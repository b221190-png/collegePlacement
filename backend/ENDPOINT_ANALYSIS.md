# Frontend Endpoint Analysis

## ✅ Already Implemented Endpoints

### Authentication (/api/auth)
- ✅ POST `/register` - User registration
- ✅ POST `/login` - User login
- ✅ POST `/refresh` - Refresh access token
- ✅ GET `/profile` - Get user profile
- ✅ PUT `/profile` - Update user profile
- ✅ POST `/logout` - User logout

### User Management (/api/users)
- ✅ GET `/` - Get all users (admin only)
- ✅ GET `/:id` - Get user by ID
- ✅ PUT `/:id` - Update user
- ✅ DELETE `/:id` - Delete user (admin only)
- ✅ POST `/:id/deactivate` - Deactivate user (admin only)
- ✅ POST `/:id/activate` - Activate user (admin only)
- ✅ GET `/stats` - User statistics (admin only)

### Student Management (/api/students)
- ✅ GET `/` - Get all students (admin only)
- ✅ GET `/:id` - Get student by ID
- ✅ POST `/` - Create student (admin only)
- ✅ PUT `/:id` - Update student
- ✅ DELETE `/:id` - Delete student (admin only)
- ✅ POST `/bulk-upload` - Bulk upload students (admin only)
- ✅ POST `/:id/upload-resume` - Upload resume
- ✅ GET `/eligible/:companyId` - Get eligible students (admin only)

### Company Management (/api/companies)
- ✅ GET `/` - Get all companies
- ✅ GET `/active` - Get active companies (for students)
- ✅ GET `/:id` - Get company by ID
- ✅ POST `/` - Create company (admin only)
- ✅ PUT `/:id` - Update company
- ✅ DELETE `/:id` - Delete company (admin only)
- ✅ POST `/:id/rounds` - Create recruitment round
- ✅ GET `/:id/rounds` - Get recruitment rounds
- ✅ GET `/search` - Search companies
- ✅ GET `/stats` - Company statistics (admin only)

### Application Management (/api/applications)
- ✅ GET `/` - Get applications (admin/recruiter)
- ✅ GET `/:id` - Get application by ID
- ✅ POST `/` - Submit application (student only)
- ✅ PUT `/:id/status` - Update application status
- ✅ PUT `/:id/score` - Update application score
- ✅ POST `/bulk-update` - Bulk update applications
- ✅ GET `/student/:studentId` - Get student applications
- ✅ GET `/company/:companyId` - Get company applications
- ✅ GET `/stats` - Application statistics

### Application Windows (/api/application-windows)
- ✅ GET `/` - Get all application windows (admin only)
- ✅ GET `/active` - Get currently active windows
- ✅ GET `/upcoming` - Get upcoming windows
- ✅ GET `/:id` - Get window by ID
- ✅ POST `/` - Create application window (admin only)
- ✅ PUT `/:id` - Update application window (admin only)
- ✅ DELETE `/:id` - Delete application window (admin only)
- ✅ POST `/:id/deactivate` - Deactivate window (admin only)
- ✅ GET `/eligible/:companyId` - Check eligibility (student only)

### Off-Campus Opportunities (/api/off-campus-opportunities)
- ✅ GET `/` - Get all opportunities
- ✅ GET `/featured` - Get featured opportunities
- ✅ GET `/:id` - Get opportunity by ID
- ✅ POST `/` - Create opportunity (admin/recruiter)
- ✅ PUT `/:id` - Update opportunity
- ✅ DELETE `/:id` - Delete opportunity
- ✅ POST `/:id/track-application` - Track application click
- ✅ GET `/search` - Search opportunities
- ✅ GET `/by-skills` - Get opportunities by skills
- ✅ GET `/my-opportunities` - Get my opportunities (admin/recruiter)

### Dashboard (/api/dashboard)
- ✅ GET `/admin` - Admin dashboard
- ✅ GET `/recruiter/:companyId` - Recruiter dashboard
- ✅ GET `/student/:studentId` - Student dashboard
- ✅ GET `/analytics/overall` - Overall analytics (admin only)

### File Uploads (/api/uploads)
- ✅ POST `/single` - Upload single file
- ✅ POST `/multiple` - Upload multiple files
- ✅ GET `/file/:filename` - Get file info
- ✅ DELETE `/file/:filename` - Delete file
- ✅ GET `/list` - List all files (admin only)
- ✅ GET `/stats` - Upload statistics (admin only)

### System
- ✅ GET `/api/health` - Health check

## ❌ Missing Endpoints for Frontend

Based on typical frontend requirements, here are some endpoints that might be missing:

### 1. Reports and Analytics
- ❌ GET `/api/reports/applications` - Export application data
- ❌ GET `/api/reports/students` - Export student data
- ❌ GET `/api/reports/placements` - Placement statistics report
- ❌ GET `/api/reports/company-performance` - Company performance report

### 2. Notifications
- ❌ GET `/api/notifications` - Get user notifications
- ❌ POST `/api/notifications` - Create notification
- ❌ PUT `/api/notifications/:id/read` - Mark notification as read
- ❌ DELETE `/api/notifications/:id` - Delete notification

### 3. Search and Filtering Enhancements
- ❌ GET `/api/search/global` - Global search across all entities
- ❌ GET `/api/companies/filter` - Advanced company filtering
- ❌ GET `/api/students/filter` - Advanced student filtering

### 4. Application Review History
- ❌ GET `/api/applications/:id/history` - Get application review history (already implemented in model but not in routes)

### 5. Additional Utility Endpoints
- ❌ GET `/api/settings` - Get system settings
- ❌ PUT `/api/settings` - Update system settings (admin only)
- ❌ GET `/api/stats/overview` - Quick overview statistics

### 6. Data Export
- ❌ GET `/api/export/applications` - Export applications as CSV/Excel
- ❌ GET `/api/export/students` - Export students as CSV/Excel
- ❌ GET `/api/export/companies` - Export companies as CSV/Excel

## 🔧 Recommended Additions

Let me implement the most critical missing endpoints for frontend needs:

1. **Reports/Export endpoints** - Important for admin functionality
2. **Application review history endpoint** - Already in model, just need route
3. **Global search endpoint** - Enhanced search functionality
4. **Quick overview stats** - For dashboard widgets