/**
 * @swagger
 * tags:
 *   name: Email
 *   description: Email management endpoints for communicating with eligible students
 */

/**
 * @swagger
 * /api/email/send-to-eligible:
 *   post:
 *     summary: Send emails to all eligible students for a company
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Sends personalized emails to all students who meet the eligibility criteria for a specific company.
 *       Uses intelligent eligibility checking based on company requirements and supports custom messaging.
 *
 *       **Features:**
 *       - Automatic eligibility checking based on company criteria
 *       - Professional HTML email templates with company branding
 *       - Batch processing to handle large student lists
 *       - Detailed success/failure tracking
 *       - Automatic notification creation for students
 *       - Support for custom messages and subjects
 *
 *       **Email Template Includes:**
 *       - Company information and description
 *       - Eligibility confirmation badge
 *       - Personalized greeting
 *       - Call-to-action button to apply
 *       - Professional HTML design
 *       - Text version for accessibility
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyId
 *             properties:
 *               companyId:
 *                 type: string
 *                 description: Company ID to send emails for
 *                 example: "64a1b2c3d4e5f6789012345"
 *               customMessage:
 *                 type: string
 *                 description: Custom message to include in emails (optional)
 *                 example: "This is a great opportunity for final year students interested in full-stack development. We have multiple positions available."
 *               subject:
 *                 type: string
 *                 description: Custom email subject line (optional)
 *                 example: "🚀 Exciting Career Opportunity at Google - Apply Now!"
 *               dryRun:
 *                 type: boolean
 *                 default: false
 *                 description: If true, only validates eligibility without sending emails
 *               filters:
 *                 type: object
 *                 description: Additional filters to apply beyond company eligibility criteria
 *                 properties:
 *                   branch:
 *                     type: string
 *                     description: Filter by specific branch
 *                     example: "Computer Science"
 *                   batch:
 *                     type: string
 *                     description: Filter by specific batch
 *                     example: "2024"
 *                   minCGPA:
 *                     type: number
 *                     description: Filter by minimum CGPA
 *                     example: 8.5
 *                   maxBacklogs:
 *                     type: integer
 *                     description: Filter by maximum backlogs allowed
 *                     example: 0
 *                   isPlaced:
 *                     type: boolean
 *                     description: Filter by placement status
 *                     example: false
 *     responses:
 *       200:
 *         description: Emails processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Email sending completed. 45 successful, 2 failed."
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total students processed
 *                       example: 47
 *                     successful:
 *                       type: integer
 *                       description: Number of emails sent successfully
 *                       example: 45
 *                     failed:
 *                       type: integer
 *                       description: Number of emails that failed to send
 *                       example: 2
 *                     errors:
 *                       type: array
 *                       description: List of failed email attempts with error details
 *                       items:
 *                         type: object
 *                         properties:
 *                           studentId:
 *                             type: string
 *                           email:
 *                             type: string
 *                           error:
 *                             type: string
 *                     eligibleStudents:
 *                       type: array
 *                       description: List of students who were eligible
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                     company:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *       400:
 *         description: Bad request - Missing required fields or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Company ID is required"
 *       403:
 *         description: Access denied - User doesn't have permission for this company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/email/preview-eligible:
 *   post:
 *     summary: Preview eligible students for a company before sending emails
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns a list of students who would be eligible to receive emails for a company,
 *       including detailed statistics and breakdown information. This endpoint uses the same
 *       eligibility logic as the send endpoint but doesn't actually send emails.
 *
 *       **Use Cases:**
 *       - Preview email recipients before sending
 *       - Validate eligibility criteria
 *       - Get statistics on eligible students
 *       - Plan email campaigns
 *
 *       **Statistics Include:**
 *       - Total eligible students count
 *       - Breakdown by branch
 *       - Breakdown by batch
 *       - Average CGPA of eligible students
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyId
 *             properties:
 *               companyId:
 *                 type: string
 *                 description: Company ID to check eligibility for
 *                 example: "64a1b2c3d4e5f6789012345"
 *               filters:
 *                 type: object
 *                 description: Additional filters to apply
 *                 properties:
 *                   branch:
 *                     type: string
 *                     description: Filter by specific branch
 *                     example: "Computer Science"
 *                   batch:
 *                     type: string
 *                     description: Filter by specific batch
 *                     example: "2024"
 *                   minCGPA:
 *                     type: number
 *                     description: Filter by minimum CGPA
 *                     example: 8.5
 *                   maxBacklogs:
 *                     type: integer
 *                     description: Filter by maximum backlogs allowed
 *                     example: 0
 *                   isPlaced:
 *                     type: boolean
 *                     description: Filter by placement status
 *                     example: false
 *     responses:
 *       200:
 *         description: Preview of eligible students
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Found 47 eligible students"
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total number of eligible students
 *                       example: 47
 *                     students:
 *                       type: array
 *                       description: List of eligible students
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "64a1b2c3d4e5f6789012346"
 *                           name:
 *                             type: string
 *                             example: "John Doe"
 *                           email:
 *                             type: string
 *                             example: "john.doe@college.edu"
 *                           personalEmail:
 *                             type: string
 *                             example: "john.personal@gmail.com"
 *                           branch:
 *                             type: string
 *                             example: "Computer Science"
 *                           batch:
 *                             type: string
 *                             example: "2024"
 *                           cgpa:
 *                             type: number
 *                             example: 8.7
 *                           backlogs:
 *                             type: integer
 *                             example: 0
 *                     company:
 *                       type: object
 *                       description: Company information
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         eligibilityCriteria:
 *                           type: object
 *                     filters:
 *                       type: object
 *                       description: Filters that were applied
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         byBranch:
 *                           type: object
 *                           description: Student count by branch
 *                           example:
 *                             "Computer Science": 25
 *                             "Information Technology": 15
 *                             "Electronics": 7
 *                         byBatch:
 *                           type: object
 *                           description: Student count by batch
 *                           example:
 *                             "2024": 35
 *                             "2023": 12
 *                         averageCGPA:
 *                           type: string
 *                           description: Average CGPA of eligible students
 *                           example: "8.65"
 *       400:
 *         description: Bad request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied - User doesn't have permission for this company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/email/test-configuration:
 *   get:
 *     summary: Test email service configuration
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Tests the email service configuration to ensure emails can be sent successfully.
 *       This endpoint verifies the connection to the email service and returns configuration details.
 *
 *       **What it tests:**
 *       - Email service connection
 *       - Authentication credentials
 *       - SMTP configuration
 *
 *       **Configuration types:**
 *       - Development: Uses Ethereal Email (test service)
 *       - Production: Uses configured email service (Gmail, SendGrid, etc.)
 *     responses:
 *       200:
 *         description: Email configuration test result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Email configuration is working correctly"
 *                 data:
 *                   type: object
 *                   properties:
 *                     configured:
 *                       type: boolean
 *                       description: Whether the email service is properly configured
 *                       example: true
 *                     environment:
 *                       type: string
 *                       description: Current environment (development/production)
 *                       example: "development"
 *                     emailProvider:
 *                       type: string
 *                       description: Email service being used
 *                       example: "Ethereal Email (Test Service)"
 *                     hasCredentials:
 *                       type: boolean
 *                       description: Whether email credentials are configured
 *                       example: true
 *       403:
 *         description: Access denied - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Access denied"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */