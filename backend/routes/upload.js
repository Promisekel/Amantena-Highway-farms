const express = require('express');
const multer = require('multer');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { requireStaffOrAdmin, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload single image
router.post('/image', requireStaffOrAdmin, upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No file uploaded',
      message: 'Please select an image to upload'
    });
  }

  const { folder = 'general' } = req.body;

  try {
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: `amantena-farms/${folder}`,
      transformation: [
        { width: 800, height: 600, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    res.json({
      message: 'Image uploaded successfully',
      image: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      }
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: 'Failed to upload image to cloud storage'
    });
  }
}));

// Upload multiple images
router.post('/images', requireStaffOrAdmin, upload.array('images', 10), asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      error: 'No files uploaded',
      message: 'Please select images to upload'
    });
  }

  const { folder = 'general' } = req.body;
  const uploadPromises = req.files.map(file => 
    uploadToCloudinary(file.buffer, {
      folder: `amantena-farms/${folder}`,
      transformation: [
        { width: 800, height: 600, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    })
  );

  try {
    const results = await Promise.all(uploadPromises);
    
    const images = results.map(result => ({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    }));

    res.json({
      message: `${images.length} images uploaded successfully`,
      images
    });
  } catch (error) {
    console.error('Cloudinary batch upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: 'Failed to upload one or more images'
    });
  }
}));

// Delete image by public ID
router.delete('/image/:publicId', requireAdmin, asyncHandler(async (req, res) => {
  const { publicId } = req.params;

  try {
    const result = await deleteFromCloudinary(publicId);
    
    if (result.result === 'ok') {
      res.json({
        message: 'Image deleted successfully',
        publicId
      });
    } else {
      res.status(404).json({
        error: 'Image not found',
        message: 'Image with this ID was not found'
      });
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    res.status(500).json({
      error: 'Delete failed',
      message: 'Failed to delete image from cloud storage'
    });
  }
}));

// Get image info
router.get('/image/:publicId/info', requireStaffOrAdmin, asyncHandler(async (req, res) => {
  const { publicId } = req.params;

  try {
    const result = await cloudinary.api.resource(publicId);
    
    res.json({
      image: {
        publicId: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        createdAt: result.created_at
      }
    });
  } catch (error) {
    if (error.http_code === 404) {
      return res.status(404).json({
        error: 'Image not found',
        message: 'Image with this ID was not found'
      });
    }
    
    console.error('Cloudinary info error:', error);
    res.status(500).json({
      error: 'Failed to get image info',
      message: error.message
    });
  }
}));

module.exports = router;
