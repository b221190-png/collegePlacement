const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Configure multer for general uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common file types
  const allowedTypes = {
    // Images
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'image/gif': true,
    'image/webp': true,
    // Documents
    'application/pdf': true,
    'application/msword': true,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
    'application/vnd.ms-excel': true,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': true,
    'text/csv': true,
    // Archives
    'application/zip': true,
    'application/x-rar-compressed': true
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, documents, and archives are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// @route   POST /api/uploads/single
// @desc    Upload a single file
// @access  Private
router.post('/single', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`,
      uploadDate: new Date()
    };

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: { file: fileInfo }
    });
  } catch (error) {
    console.error('Single file upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during file upload'
    });
  }
});

// @route   POST /api/uploads/multiple
// @desc    Upload multiple files
// @access  Private
router.post('/multiple', protect, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const filesInfo = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
      uploadDate: new Date()
    }));

    res.json({
      success: true,
      message: `${req.files.length} files uploaded successfully`,
      data: { files: filesInfo }
    });
  } catch (error) {
    console.error('Multiple files upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during file upload'
    });
  }
});

// @route   GET /api/uploads/file/:filename
// @desc    Get file information
// @access  Private
router.get('/file/:filename', protect, async (req, res) => {
  try {
    const { filename } = req.params;
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    const filePath = path.join(uploadPath, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Get file stats
    const stats = fs.statSync(filePath);

    const fileInfo = {
      filename,
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      url: `/uploads/${filename}`
    };

    res.json({
      success: true,
      data: { file: fileInfo }
    });
  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching file information'
    });
  }
});

// @route   DELETE /api/uploads/file/:filename
// @desc    Delete a file
// @access  Private
router.delete('/file/:filename', protect, async (req, res) => {
  try {
    const { filename } = req.params;
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    const filePath = path.join(uploadPath, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting file'
    });
  }
});

// @route   GET /api/uploads/list
// @desc    List all uploaded files
// @access  Private (Admin only)
router.get('/list', protect, async (req, res) => {
  try {
    // Only admins can list all files
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can list files.'
      });
    }

    const uploadPath = process.env.UPLOAD_PATH || './uploads';

    // Check if upload directory exists
    if (!fs.existsSync(uploadPath)) {
      return res.json({
        success: true,
        data: { files: [] }
      });
    }

    // Read directory
    const files = fs.readdirSync(uploadPath);

    // Get file information
    const filesInfo = files.map(filename => {
      const filePath = path.join(uploadPath, filename);
      const stats = fs.statSync(filePath);

      return {
        filename,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        isDirectory: stats.isDirectory(),
        url: `/uploads/${filename}`
      };
    });

    // Filter only files (not directories)
    const onlyFiles = filesInfo.filter(file => !file.isDirectory);

    res.json({
      success: true,
      data: { files: onlyFiles }
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while listing files'
    });
  }
});

// @route   GET /api/uploads/stats
// @desc    Get upload statistics
// @access  Private (Admin only)
router.get('/stats', protect, async (req, res) => {
  try {
    // Only admins can get statistics
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can view statistics.'
      });
    }

    const uploadPath = process.env.UPLOAD_PATH || './uploads';

    // Check if upload directory exists
    if (!fs.existsSync(uploadPath)) {
      return res.json({
        success: true,
        data: {
          totalFiles: 0,
          totalSize: 0,
          averageFileSize: 0,
          fileTypes: {}
        }
      });
    }

    // Read directory
    const files = fs.readdirSync(uploadPath);

    let totalSize = 0;
    let fileCount = 0;
    const fileTypes = {};

    files.forEach(filename => {
      const filePath = path.join(uploadPath, filename);
      const stats = fs.statSync(filePath);

      if (stats.isFile()) {
        fileCount++;
        totalSize += stats.size;

        // Get file extension
        const ext = path.extname(filename).toLowerCase();
        fileTypes[ext] = (fileTypes[ext] || 0) + 1;
      }
    });

    const stats = {
      totalFiles: fileCount,
      totalSize,
      averageFileSize: fileCount > 0 ? Math.round(totalSize / fileCount) : 0,
      fileTypes,
      uploadDirectory: uploadPath
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get upload stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching upload statistics'
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded. Maximum is 10 files.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.'
      });
    }
  }

  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
});

module.exports = router;