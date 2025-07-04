const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAdmin, requireStaffOrAdmin } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// Get all products
router.get('/', requireStaffOrAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, category, lowStock } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    isActive: true,
    AND: [
      search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } }
        ]
      } : {},
      category ? { category } : {},
      lowStock === 'true' ? {
        quantity: { lte: prisma.raw('threshold') }
      } : {}
    ]
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.product.count({ where })
  ]);

  res.json({
    products,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / take),
      total,
      hasNext: skip + take < total,
      hasPrev: parseInt(page) > 1
    }
  });
}));

// Get product by ID
router.get('/:id', requireStaffOrAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await prisma.product.findFirst({
    where: { id, isActive: true },
    include: {
      sales: {
        take: 10,
        orderBy: { soldAt: 'desc' },
        include: {
          user: {
            select: { name: true }
          }
        }
      },
      _count: {
        select: { sales: true }
      }
    }
  });

  if (!product) {
    return res.status(404).json({
      error: 'Product not found',
      message: 'Product with this ID does not exist'
    });
  }

  res.json({ product });
}));

// Create product (Admin only)
router.post('/', requireAdmin, validate(schemas.product), asyncHandler(async (req, res) => {
  const { name, category, description, price, quantity, threshold, sku } = req.body;

  const product = await prisma.product.create({
    data: {
      name,
      category,
      description,
      price,
      quantity,
      threshold: threshold || 10,
      sku
    }
  });

  // Emit real-time update
  const io = req.app.get('io');
  io.emit('product-created', product);

  res.status(201).json({
    message: 'Product created successfully',
    product
  });
}));

// Update product (Admin only)
router.put('/:id', requireAdmin, validate(schemas.product), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, category, description, price, quantity, threshold, sku } = req.body;

  const product = await prisma.product.update({
    where: { id },
    data: {
      name,
      category,
      description,
      price,
      quantity,
      threshold,
      sku
    }
  });

  // Emit real-time update
  const io = req.app.get('io');
  io.emit('product-updated', product);

  res.json({
    message: 'Product updated successfully',
    product
  });
}));

// Delete product (Admin only)
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      _count: {
        select: { sales: true }
      }
    }
  });

  if (!product) {
    return res.status(404).json({
      error: 'Product not found',
      message: 'Product with this ID does not exist'
    });
  }

  // If product has sales, deactivate instead of delete
  if (product._count.sales > 0) {
    await prisma.product.update({
      where: { id },
      data: { isActive: false }
    });

    return res.json({
      message: 'Product deactivated (has sales records)',
      action: 'deactivated'
    });
  }

  await prisma.product.delete({
    where: { id }
  });

  res.json({
    message: 'Product deleted successfully',
    action: 'deleted'
  });
}));

// Get product categories
router.get('/meta/categories', requireStaffOrAdmin, asyncHandler(async (req, res) => {
  const categories = await prisma.product.findMany({
    where: { isActive: true },
    select: { category: true },
    distinct: ['category']
  });

  res.json({
    categories: categories.map(c => c.category).sort()
  });
}));

// Get low stock products
router.get('/alerts/low-stock', requireStaffOrAdmin, asyncHandler(async (req, res) => {
  const lowStockProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      quantity: { lte: prisma.raw('threshold') }
    },
    orderBy: { quantity: 'asc' }
  });

  res.json({
    products: lowStockProducts,
    count: lowStockProducts.length
  });
}));

// Update product image
router.patch('/:id/image', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({
      error: 'Missing image URL',
      message: 'Image URL is required'
    });
  }

  const product = await prisma.product.update({
    where: { id },
    data: { imageUrl }
  });

  res.json({
    message: 'Product image updated successfully',
    product
  });
}));

// Bulk update quantities (Admin only)
router.patch('/bulk/quantities', requireAdmin, asyncHandler(async (req, res) => {
  const { updates } = req.body; // Array of { id, quantity }

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({
      error: 'Invalid data',
      message: 'Updates array is required'
    });
  }

  const results = [];
  
  for (const update of updates) {
    try {
      const product = await prisma.product.update({
        where: { id: update.id },
        data: { quantity: update.quantity }
      });
      results.push({ id: update.id, success: true, product });
    } catch (error) {
      results.push({ id: update.id, success: false, error: error.message });
    }
  }

  res.json({
    message: 'Bulk update completed',
    results,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length
  });
}));

module.exports = router;
