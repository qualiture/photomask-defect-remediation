const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

/**
 * Image upload handler for defect images
 * Constraints:
 * - Max file size: 1 MB
 * - Supported formats: All (JPEG, PNG, TIFF, BMP, etc.)
 * - Storage: Direct to database as LargeBinary
 */

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB in bytes
const THUMBNAIL_SIZE = 200; // pixels
const THUMBNAIL_QUALITY = 80; // JPEG quality for thumbnail

/**
 * Configure multer for image uploads
 * Stores in memory since we'll process to database
 */
const memoryStorage = multer.memoryStorage();

const uploadMiddleware = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    // Accept all common image formats
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/tiff',
      'image/bmp',
      'image/gif',
      'image/webp',
      'image/x-tiff'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported image format: ${file.mimetype}`), false);
    }
  }
});

/**
 * Process image file and generate thumbnail
 * Returns: { imageData, imageThumbnail, imageType, filename }
 */
async function processImage(file) {
  if (!file || !file.buffer) {
    throw new Error('No image file provided');
  }

  // Validate file size
  if (file.buffer.length > MAX_FILE_SIZE) {
    throw new Error(`Image size (${file.buffer.length} bytes) exceeds 1 MB limit`);
  }

  try {
    // Get image metadata
    const metadata = await sharp(file.buffer).metadata();

    // Validate image can be read
    if (!metadata.format) {
      throw new Error('Invalid or corrupted image file');
    }

    // Generate thumbnail (max 200x200)
    let thumbnail;
    try {
      // Convert to JPEG for thumbnail to reduce size
      thumbnail = await sharp(file.buffer)
        .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: THUMBNAIL_QUALITY })
        .toBuffer();
    } catch (thumbError) {
      console.warn('Failed to generate thumbnail, using placeholder');
      // Create a small placeholder if thumbnail generation fails
      thumbnail = await sharp({
        create: {
          width: THUMBNAIL_SIZE,
          height: THUMBNAIL_SIZE,
          channels: 3,
          background: { r: 200, g: 200, b: 200 }
        }
      })
        .jpeg()
        .toBuffer();
    }

    // Return processed image data
    return {
      imageData: file.buffer,
      imageThumbnail: thumbnail,
      imageType: file.mimetype,
      originalFormat: metadata.format,
      width: metadata.width,
      height: metadata.height,
      filename: file.originalname
    };
  } catch (error) {
    throw new Error(`Failed to process image: ${error.message}`);
  }
}

/**
 * Validate image coordinates against image dimensions
 * Ensures coordinates fall within the image bounds
 */
function validateCoordinates(coordinateX, coordinateY, imageWidth, imageHeight) {
  const errors = [];

  if (coordinateX < 0 || coordinateX > imageWidth) {
    errors.push(`X coordinate (${coordinateX}) is outside image bounds (0-${imageWidth})`);
  }

  if (coordinateY < 0 || coordinateY > imageHeight) {
    errors.push(`Y coordinate (${coordinateY}) is outside image bounds (0-${imageHeight})`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Calculate affected area based on radius
 * Assumes circular defect region around coordinates
 */
function calculateAffectedArea(radiusNm) {
  if (!radiusNm || radiusNm <= 0) {
    return 0;
  }
  // Area = π * r²
  return Math.PI * Math.pow(radiusNm, 2);
}

module.exports = {
  uploadMiddleware,
  processImage,
  validateCoordinates,
  calculateAffectedArea,
  MAX_FILE_SIZE,
  THUMBNAIL_SIZE
};
