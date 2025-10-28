# College Placement Backend API

A comprehensive backend API for college placement management system with support for students, recruiters, and administrators.

## Features

- **User Management**: Multi-role authentication (Admin, Recruiter, Student)
- **Company Management**: Company profiles, recruitment rounds, application windows
- **Application System**: Student applications, review process, scoring system
- **Off-Campus Opportunities**: External job opportunities management
- **Dashboard & Analytics**: Comprehensive statistics and reporting
- **File Management**: Resume uploads, company logos, document handling
- **Security**: JWT authentication, role-based access control, input validation

## Tech Stack

- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **Jest** for testing
- **Helmet** for security headers
- **CORS** for cross-origin requests

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/collegePlacement

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

4. Start the server
```bash
# Development
npm run dev

# Production
npm start
```

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | User login | Public |
| POST | `/api/auth/refresh` | Refresh access token | Public |
| GET | `/api/auth/profile` | Get user profile | Private |
| PUT | `/api/auth/profile` | Update user profile | Private |
| POST | `/api/auth/logout` | User logout | Private |

### User Management Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/users` | Get all users | Admin |
| GET | `/api/users/:id` | Get user by ID | Private |
| PUT | `/api/users/:id` | Update user | Private |
| DELETE | `/api/users/:id` | Delete user | Admin |
| GET | `/api/users/stats` | Get user statistics | Admin |

### Student Management Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/students` | Get all students | Admin |
| GET | `/api/students/:id` | Get student by ID | Private |
| POST | `/api/students` | Create new student | Admin |
| PUT | `/api/students/:id` | Update student | Private |
| DELETE | `/api/students/:id` | Delete student | Admin |
| POST | `/api/students/bulk-upload` | Bulk upload students | Admin |
| POST | `/api/students/:id/upload-resume` | Upload resume | Private |
| GET | `/api/students/eligible/:companyId` | Get eligible students | Admin |

### Company Management Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/companies` | Get all companies | Public |
| GET | `/api/companies/active` | Get active companies | Public |
| GET | `/api/companies/:id` | Get company by ID | Public |
| POST | `/api/companies` | Create new company | Admin |
| PUT | `/api/companies/:id` | Update company | Private |
| DELETE | `/api/companies/:id` | Delete company | Admin |
| POST | `/api/companies/:id/rounds` | Create recruitment round | Private |
| GET | `/api/companies/:id/rounds` | Get recruitment rounds | Private |
| GET | `/api/companies/search` | Search companies | Public |
| GET | `/api/companies/stats` | Get company statistics | Admin |

### Application Management Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/applications` | Get applications | Admin/Recruiter |
| GET | `/api/applications/:id` | Get application by ID | Private |
| POST | `/api/applications` | Submit application | Student |
| PUT | `/api/applications/:id/status` | Update application status | Admin/Recruiter |
| PUT | `/api/applications/:id/score` | Update application score | Admin/Recruiter |
| POST | `/api/applications/bulk-update` | Bulk update applications | Admin/Recruiter |
| GET | `/api/applications/student/:studentId` | Get student applications | Private |
| GET | `/api/applications/company/:companyId` | Get company applications | Private |
| GET | `/api/applications/stats` | Get application statistics | Admin/Recruiter |

### Application Windows Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/application-windows` | Get application windows | Admin |
| GET | `/api/application-windows/active` | Get active windows | Public |
| GET | `/api/application-windows/upcoming` | Get upcoming windows | Public |
| GET | `/api/application-windows/:id` | Get window by ID | Private |
| POST | `/api/application-windows` | Create application window | Admin |
| PUT | `/api/application-windows/:id` | Update application window | Admin |
| DELETE | `/api/application-windows/:id` | Delete application window | Admin |
| POST | `/api/application-windows/:id/deactivate` | Deactivate window | Admin |
| GET | `/api/application-windows/eligible/:companyId` | Check eligibility | Student |

### Off-Campus Opportunities Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/off-campus-opportunities` | Get opportunities | Public |
| GET | `/api/off-campus-opportunities/featured` | Get featured opportunities | Public |
| GET | `/api/off-campus-opportunities/:id` | Get opportunity by ID | Public |
| POST | `/api/off-campus-opportunities` | Create opportunity | Admin/Recruiter |
| PUT | `/api/off-campus-opportunities/:id` | Update opportunity | Private |
| DELETE | `/api/off-campus-opportunities/:id` | Delete opportunity | Private |
| POST | `/api/off-campus-opportunities/:id/track-application` | Track application | Student |
| GET | `/api/off-campus-opportunities/search` | Search opportunities | Public |
| GET | `/api/off-campus-opportunities/by-skills` | Get opportunities by skills | Public |
| GET | `/api/off-campus-opportunities/my-opportunities` | Get my opportunities | Private |

### Dashboard Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/dashboard/admin` | Get admin dashboard | Admin |
| GET | `/api/dashboard/recruiter/:companyId` | Get recruiter dashboard | Private |
| GET | `/api/dashboard/student/:studentId` | Get student dashboard | Private |
| GET | `/api/dashboard/analytics/overall` | Get overall analytics | Admin |

### File Upload Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/uploads/single` | Upload single file | Private |
| POST | `/api/uploads/multiple` | Upload multiple files | Private |
| GET | `/api/uploads/file/:filename` | Get file information | Private |
| DELETE | `/api/uploads/file/:filename` | Delete file | Private |
| GET | `/api/uploads/list` | List all files | Admin |
| GET | `/api/uploads/stats` | Get upload statistics | Admin |

## Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (admin/recruiter/student),
  companyId: ObjectId (for recruiters),
  isActive: Boolean,
  lastLogin: Date
}
```

### Student Model
```javascript
{
  userId: ObjectId (ref: User),
  rollNumber: String (unique),
  branch: String,
  cgpa: Number,
  phone: String,
  skills: [String],
  resumeUrl: String,
  batch: Number,
  placed: Boolean,
  placedCompany: ObjectId (ref: Company)
}
```

### Company Model
```javascript
{
  name: String,
  logoUrl: String,
  description: String,
  industry: String,
  location: String,
  packageOffered: String,
  totalPositions: Number,
  applicationDeadline: Date,
  status: String (active/inactive/completed),
  requirements: [String],
  skills: [String],
  createdBy: ObjectId (ref: User)
}
```

### Application Model
```javascript
{
  studentId: ObjectId (ref: Student),
  companyId: ObjectId (ref: Company),
  roundId: ObjectId (ref: RecruitmentRound),
  status: String (submitted/under-review/shortlisted/rejected/selected),
  score: Number (0-100),
  recruiterNotes: String,
  formData: Object,
  resumeUrl: String,
  reviewedBy: ObjectId (ref: User)
}
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Access Token**: Short-lived (1 hour) token for API access
2. **Refresh Token**: Long-lived (7 days) token for getting new access tokens

### Request Headers
```javascript
Authorization: Bearer <access-token>
```

### Response Format
```javascript
{
  "success": true,
  "message": "Success message",
  "data": {
    // Response data
  }
}
```

### Error Response Format
```javascript
{
  "success": false,
  "message": "Error message",
  "errors": [] // Validation errors if any
}
```

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for password security
- **Role-Based Access Control**: Different access levels for different user roles
- **Input Validation**: Comprehensive validation using express-validator
- **Rate Limiting**: Prevent brute force attacks
- **CORS Protection**: Cross-origin resource sharing configuration
- **Helmet**: Security headers for HTTP protection
- **File Upload Security**: File type and size validation

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment (development/production) | development |
| MONGODB_URI | MongoDB connection string | - |
| JWT_SECRET | JWT secret key | - |
| JWT_REFRESH_SECRET | JWT refresh secret key | - |
| JWT_EXPIRE | JWT expiration time | 1h |
| JWT_REFRESH_EXPIRE | JWT refresh expiration time | 7d |
| MAX_FILE_SIZE | Maximum file upload size | 10485760 (10MB) |
| UPLOAD_PATH | File upload directory | ./uploads |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:3000 |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run tests and ensure they pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please create an issue in the repository.