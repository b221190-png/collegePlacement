const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const studentRoutes = require('./routes/students');
const companyRoutes = require('./routes/companies');
const applicationRoutes = require('./routes/applications');
const applicationWindowRoutes = require('./routes/applicationWindows');
const offCampusRoutes = require('./routes/offCampus');
const dashboardRoutes = require('./routes/dashboard');
const uploadRoutes = require('./routes/uploads');
const reportsRoutes = require('./routes/reports');
const searchRoutes = require('./routes/search');
const applicationReviewRoutes = require('./routes/applicationReview');
const notificationsRoutes = require('./routes/notifications');
const roundsRoutes = require('./routes/rounds');
const exportRoutes = require('./routes/export');
const eligibilityRoutes = require('./routes/eligibility');
const recruiterRoutes = require('./routes/recruiter');
const emailRoutes = require('./routes/email');

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration - accept multiple development ports
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  process.env.PRODUCTION_FRONTEND_URL || 'https://your-frontend-domain.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'College Placement API',
      version: '1.0.0',
      description: 'API documentation for College Placement Management System',
      contact: {
        name: 'API Support',
        email: 'support@collegeplacement.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Development server'
      },
      {
        url: process.env.PRODUCTION_URL || 'https://pixora-backend-726038512757.us-central1.run.app',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        }
      }
    }
  },
  apis: ['./routes/*.js', './routes/*-swagger.js', './swagger-schemas.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'College Placement API Docs'
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Database connection with better error handling
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('ERROR: MONGODB_URI environment variable is not set');
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds timeout
    });

    console.log('Connected to MongoDB successfully');
    console.log('Database:', conn.connection.name);
    
    return conn;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    console.error('Connection string:', process.env.MONGODB_URI ? '[HIDDEN]' : 'NOT SET');
    
    // Retry connection after 5 seconds
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

// Initial connection attempt
connectDB();

// Create default admin user if not exists
const createDefaultAdmin = async () => {
  try {
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    
    const existingAdmin = await User.findOne({ email: 'admin@collegeplacement.com' });
    
    if (!existingAdmin) {
      const defaultAdmin = new User({
        name: 'System Administrator',
        email: 'admin@collegeplacement.com',
        password: 'admin123',
        role: 'admin',
        isActive: true
      });
      
      await defaultAdmin.save();
      console.log('Default admin user created successfully');
    } else {
      console.log('Default admin user already exists');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

// Call the function after database connection
mongoose.connection.once('open', () => {
  createDefaultAdmin();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/application-windows', applicationWindowRoutes);
app.use('/api/off-campus-opportunities', offCampusRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/applications/review', applicationReviewRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/rounds', roundsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/eligibility', eligibilityRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/email', emailRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'College Placement Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

// Only start server if this file is run directly (not during tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
}

module.exports = app;
