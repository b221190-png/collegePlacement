# College Placement Backend - Setup Instructions

## 🚀 Quick Start

The backend is now complete! Here's how to get it running:

### 1. MongoDB Setup

You have two options for MongoDB:

#### Option A: MongoDB Atlas (Recommended for Production)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get your connection string
4. Update the `.env` file with your connection string:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/collegePlacement?retryWrites=true&w=majority
```

#### Option B: Local MongoDB
1. Install MongoDB locally:
   ```bash
   # Mac
   brew install mongodb-community

   # Ubuntu/Debian
   sudo apt-get install mongodb

   # Windows
   # Download from https://www.mongodb.com/try/download/community
   ```

2. Start MongoDB service:
   ```bash
   # Mac
   brew services start mongodb-community

   # Ubuntu/Debian
   sudo systemctl start mongod

   # Windows
   net start MongoDB
   ```

3. Update `.env` file:
   ```env
   MONGODB_URI=mongodb://localhost:27017/collegePlacement
   ```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## ✅ Features Implemented

### 🔐 Authentication System
- JWT-based authentication with access and refresh tokens
- Role-based access control (Admin, Recruiter, Student)
- Password hashing with bcrypt
- Token refresh mechanism

### 👥 User Management
- User registration and login
- Profile management
- Role-based permissions
- User activation/deactivation

### 🎓 Student Management
- Complete student profiles with academic details
- Resume upload functionality
- Bulk student upload via CSV
- Eligibility checking for companies
- Application tracking

### 🏢 Company Management
- Company profiles with detailed information
- Recruitment round management
- Application window configuration
- Company logo uploads
- Search and filtering

### 📋 Application System
- Student application submission
- Application status tracking
- Scoring system (0-100)
- Review history tracking
- Bulk application updates
- Application statistics

### 🪟 Off-Campus Opportunities
- External job opportunity management
- Opportunity tracking and analytics
- Application click tracking
- Search and filtering by skills/location

### 📊 Dashboard & Analytics
- Role-specific dashboards
- Comprehensive statistics
- Application trends
- Placement analytics
- Company performance metrics

### 📁 File Management
- Secure file uploads
- Resume management
- Company logo handling
- File type and size validation

### 🛡️ Security Features
- Rate limiting
- CORS protection
- Input validation
- SQL injection prevention
- XSS protection with Helmet

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile

### Key Features by Role

#### Admin Features
- Complete user management
- Company management
- Application oversight
- System-wide analytics
- Bulk operations

#### Recruiter Features
- Company profile management
- Application review and scoring
- Recruitment round management
- Candidate shortlisting
- Company-specific analytics

#### Student Features
- Profile management
- Company browsing
- Application submission
- Application tracking
- Resume upload

## 🎯 Next Steps for Frontend Integration

1. **Install the required dependencies:**
   ```bash
   npm install axios react-router-dom
   ```

2. **Set up API client** (see `FRONTEND_INTEGRATION.md`)

3. **Implement authentication context**

4. **Create protected routes**

5. **Build role-specific dashboards**

6. **Integrate file upload functionality**

## 🔧 Environment Variables

Create a `.env` file with the following:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=your-mongodb-connection-string

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

## 📝 Database Schema

The backend includes 8 main models:

1. **User** - Authentication and basic user info
2. **Student** - Detailed student profiles
3. **Company** - Company information and requirements
4. **Application** - Student applications with tracking
5. **ApplicationWindow** - Application eligibility windows
6. **OffCampusOpportunity** - External job opportunities
7. **RecruitmentRound** - Company recruitment rounds
8. **ApplicationReviewHistory** - Application review tracking

## 🚀 Deployment

For production deployment:

1. Update `NODE_ENV=production`
2. Use a production MongoDB instance
3. Set secure JWT secrets
4. Configure proper CORS settings
5. Set up SSL/HTTPS
6. Configure reverse proxy (nginx/Apache)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📞 Support

For any issues or questions:
1. Check the API documentation
2. Review the test files for usage examples
3. Check the console logs for detailed error messages
4. Create an issue in the repository

---

**Backend is now ready for frontend integration!** 🎉

The API is fully functional with comprehensive testing, security measures, and all the features needed for a complete college placement management system.