const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireStaffOrAdmin, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { deleteFromCloudinary } = require('../config/cloudinary');

const router = express.Router();
const prisma = new PrismaClient();

// Get all albums
router.get('/', requireStaffOrAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const [albums, total] = await Promise.all([
    prisma.album.findMany({
      skip,
      take,
      include: {
        images: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { images: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.album.count()
  ]);

  res.json({
    albums,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / take),
      total,
      hasNext: skip + take < total,
      hasPrev: parseInt(page) > 1
    }
  });
}));

// Get album by ID
router.get('/:id', requireStaffOrAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const album = await prisma.album.findUnique({
    where: { id },
    include: {
      images: {
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      },
      _count: {
        select: { images: true }
      }
    }
  });

  if (!album) {
    return res.status(404).json({
      error: 'Album not found',
      message: 'Album with this ID does not exist'
    });
  }

  res.json({
    album,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(album._count.images / take),
      total: album._count.images,
      hasNext: skip + take < album._count.images,
      hasPrev: parseInt(page) > 1
    }
  });
}));

// Create album
router.post('/', requireStaffOrAdmin, asyncHandler(async (req, res) => {
  const { title } = req.body;

  if (!title || title.trim().length === 0) {
    return res.status(400).json({
      error: 'Title required',
      message: 'Album title is required'
    });
  }

  const album = await prisma.album.create({
    data: { title: title.trim() }
  });

  res.status(201).json({
    message: 'Album created successfully',
    album
  });
}));

// Update album
router.put('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  if (!title || title.trim().length === 0) {
    return res.status(400).json({
      error: 'Title required',
      message: 'Album title is required'
    });
  }

  const album = await prisma.album.update({
    where: { id },
    data: { title: title.trim() }
  });

  res.json({
    message: 'Album updated successfully',
    album
  });
}));

// Delete album
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const album = await prisma.album.findUnique({
    where: { id },
    include: { images: true }
  });

  if (!album) {
    return res.status(404).json({
      error: 'Album not found',
      message: 'Album with this ID does not exist'
    });
  }

  // Delete images from Cloudinary
  const deletePromises = album.images.map(image => 
    deleteFromCloudinary(image.publicId).catch(err => 
      console.error(`Failed to delete image ${image.publicId}:`, err)
    )
  );

  await Promise.all(deletePromises);

  // Delete album (cascade will delete images from DB)
  await prisma.album.delete({
    where: { id }
  });

  res.json({
    message: 'Album deleted successfully',
    deletedImages: album.images.length
  });
}));

// Add image to album
router.post('/:id/images', requireStaffOrAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { url, publicId, description } = req.body;

  if (!url || !publicId) {
    return res.status(400).json({
      error: 'Missing data',
      message: 'Image URL and public ID are required'
    });
  }

  // Check if album exists
  const album = await prisma.album.findUnique({
    where: { id }
  });

  if (!album) {
    return res.status(404).json({
      error: 'Album not found',
      message: 'Album with this ID does not exist'
    });
  }

  const image = await prisma.image.create({
    data: {
      albumId: id,
      url,
      publicId,
      description: description || null
    }
  });

  res.status(201).json({
    message: 'Image added to album successfully',
    image
  });
}));

// Update image description
router.put('/:albumId/images/:imageId', requireStaffOrAdmin, asyncHandler(async (req, res) => {
  const { albumId, imageId } = req.params;
  const { description } = req.body;

  const image = await prisma.image.update({
    where: {
      id: imageId,
      albumId // Ensure image belongs to the specified album
    },
    data: { description: description || null }
  });

  res.json({
    message: 'Image updated successfully',
    image
  });
}));

// Delete image from album
router.delete('/:albumId/images/:imageId', requireAdmin, asyncHandler(async (req, res) => {
  const { albumId, imageId } = req.params;

  const image = await prisma.image.findFirst({
    where: {
      id: imageId,
      albumId
    }
  });

  if (!image) {
    return res.status(404).json({
      error: 'Image not found',
      message: 'Image not found in this album'
    });
  }

  // Delete from Cloudinary
  try {
    await deleteFromCloudinary(image.publicId);
  } catch (error) {
    console.error('Failed to delete from Cloudinary:', error);
  }

  // Delete from database
  await prisma.image.delete({
    where: { id: imageId }
  });

  res.json({
    message: 'Image deleted successfully'
  });
}));

// Get recent images across all albums
router.get('/images/recent', requireStaffOrAdmin, asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const images = await prisma.image.findMany({
    take: parseInt(limit),
    include: {
      album: {
        select: { title: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ images });
}));

module.exports = router;
