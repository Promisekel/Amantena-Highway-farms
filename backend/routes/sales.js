const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAdmin, requireStaffOrAdmin } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// Get all sales
router.get('/', requireStaffOrAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, startDate, endDate, productId, userId } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    AND: [
      startDate ? { soldAt: { gte: new Date(startDate) } } : {},
      endDate ? { soldAt: { lte: new Date(endDate) } } : {},
      productId ? { productId } : {},
      userId ? { userId } : {}
    ]
  };

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      skip,
      take,
      include: {
        product: {
          select: { name: true, category: true, sku: true }
        },
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { soldAt: 'desc' }
    }),
    prisma.sale.count({ where })
  ]);

  res.json({
    sales,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / take),
      total,
      hasNext: skip + take < total,
      hasPrev: parseInt(page) > 1
    }
  });
}));

// Create sale
router.post('/', requireStaffOrAdmin, validate(schemas.sale), asyncHandler(async (req, res) => {
  const { productId, quantitySold, notes } = req.body;
  const userId = req.user.id;

  // Check if product exists and has enough stock
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true }
  });

  if (!product) {
    return res.status(404).json({
      error: 'Product not found',
      message: 'Product does not exist or is inactive'
    });
  }

  if (product.quantity < quantitySold) {
    return res.status(400).json({
      error: 'Insufficient stock',
      message: `Only ${product.quantity} units available`
    });
  }

  const unitPrice = product.price;
  const totalAmount = unitPrice * quantitySold;

  // Create sale and update product quantity in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the sale
    const sale = await tx.sale.create({
      data: {
        productId,
        quantitySold,
        unitPrice,
        totalAmount,
        userId,
        notes
      },
      include: {
        product: {
          select: { name: true, category: true, sku: true }
        },
        user: {
          select: { name: true }
        }
      }
    });

    // Update product quantity
    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: { quantity: { decrement: quantitySold } }
    });

    return { sale, updatedProduct };
  });

  // Emit real-time updates
  const io = req.app.get('io');
  io.emit('sale-created', result.sale);
  io.emit('product-updated', result.updatedProduct);

  // Check for low stock alert
  if (result.updatedProduct.quantity <= result.updatedProduct.threshold) {
    io.emit('low-stock-alert', {
      product: result.updatedProduct,
      message: `Low stock alert: ${result.updatedProduct.name} has only ${result.updatedProduct.quantity} units left`
    });
  }

  res.status(201).json({
    message: 'Sale recorded successfully',
    sale: result.sale
  });
}));

// Get sale by ID
router.get('/:id', requireStaffOrAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      product: {
        select: { name: true, category: true, sku: true, imageUrl: true }
      },
      user: {
        select: { name: true, email: true }
      }
    }
  });

  if (!sale) {
    return res.status(404).json({
      error: 'Sale not found',
      message: 'Sale with this ID does not exist'
    });
  }

  res.json({ sale });
}));

// Update sale (Admin only)
router.put('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  const sale = await prisma.sale.update({
    where: { id },
    data: { notes },
    include: {
      product: {
        select: { name: true, category: true, sku: true }
      },
      user: {
        select: { name: true }
      }
    }
  });

  res.json({
    message: 'Sale updated successfully',
    sale
  });
}));

// Delete sale (Admin only - reverses the sale)
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { product: true }
  });

  if (!sale) {
    return res.status(404).json({
      error: 'Sale not found',
      message: 'Sale with this ID does not exist'
    });
  }

  // Reverse the sale in a transaction
  await prisma.$transaction(async (tx) => {
    // Restore product quantity
    await tx.product.update({
      where: { id: sale.productId },
      data: { quantity: { increment: sale.quantitySold } }
    });

    // Delete the sale
    await tx.sale.delete({
      where: { id }
    });
  });

  res.json({
    message: 'Sale reversed successfully',
    restoredQuantity: sale.quantitySold
  });
}));

// Get sales reports
router.get('/reports/overview', requireStaffOrAdmin, asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy = 'day' } = req.query;
  
  const dateFilter = {
    AND: [
      startDate ? { soldAt: { gte: new Date(startDate) } } : {},
      endDate ? { soldAt: { lte: new Date(endDate) } } : {}
    ]
  };

  // Total sales stats
  const totalStats = await prisma.sale.aggregate({
    where: dateFilter,
    _sum: { totalAmount: true, quantitySold: true },
    _count: { id: true }
  });

  // Sales by product
  const productSales = await prisma.sale.groupBy({
    by: ['productId'],
    where: dateFilter,
    _sum: { totalAmount: true, quantitySold: true },
    _count: { id: true },
    orderBy: { _sum: { totalAmount: 'desc' } },
    take: 10
  });

  // Get product details for top selling products
  const productIds = productSales.map(p => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, category: true, sku: true }
  });

  const topProducts = productSales.map(sale => {
    const product = products.find(p => p.id === sale.productId);
    return {
      product,
      totalRevenue: sale._sum.totalAmount,
      unitsSold: sale._sum.quantitySold,
      salesCount: sale._count.id
    };
  });

  // Sales by user (staff performance)
  const userSales = await prisma.sale.groupBy({
    by: ['userId'],
    where: dateFilter,
    _sum: { totalAmount: true, quantitySold: true },
    _count: { id: true },
    orderBy: { _sum: { totalAmount: 'desc' } }
  });

  // Get user details
  const userIds = userSales.map(u => u.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true }
  });

  const staffPerformance = userSales.map(sale => {
    const user = users.find(u => u.id === sale.userId);
    return {
      user,
      totalRevenue: sale._sum.totalAmount,
      unitsSold: sale._sum.quantitySold,
      salesCount: sale._count.id
    };
  });

  res.json({
    overview: {
      totalRevenue: totalStats._sum.totalAmount || 0,
      totalUnitsSold: totalStats._sum.quantitySold || 0,
      totalSales: totalStats._count || 0
    },
    topProducts,
    staffPerformance
  });
}));

// Get sales trends (for charts)
router.get('/reports/trends', requireStaffOrAdmin, asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy = 'day' } = req.query;
  
  const dateFilter = {
    AND: [
      startDate ? { soldAt: { gte: new Date(startDate) } } : { soldAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      endDate ? { soldAt: { lte: new Date(endDate) } } : {}
    ]
  };

  // This would need raw SQL for proper date grouping
  // For now, we'll get daily sales for the last 30 days
  const sales = await prisma.sale.findMany({
    where: dateFilter,
    select: {
      soldAt: true,
      totalAmount: true,
      quantitySold: true
    },
    orderBy: { soldAt: 'asc' }
  });

  // Group by date
  const dailySales = {};
  sales.forEach(sale => {
    const date = sale.soldAt.toISOString().split('T')[0];
    if (!dailySales[date]) {
      dailySales[date] = { date, revenue: 0, units: 0, count: 0 };
    }
    dailySales[date].revenue += Number(sale.totalAmount);
    dailySales[date].units += sale.quantitySold;
    dailySales[date].count += 1;
  });

  const trends = Object.values(dailySales).sort((a, b) => new Date(a.date) - new Date(b.date));

  res.json({ trends });
}));

module.exports = router;
