/**
 * @swagger
 * tags:
 *   name: Recruiter Analytics
 *   description: Recruiter dashboard analytics endpoints
 */

/**
 * @swagger
 * /api/recruiter/analytics/dashboard:
 *   get:
 *     summary: Get recruiter dashboard analytics
 *     tags: [Recruiter Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         description: Company ID (if not provided, uses all companies associated with recruiter)
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Time period for analytics
 *     responses:
 *       200:
 *         description: Recruiter analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RecruiterAnalytics'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/recruiter/companies:
 *   get:
 *     summary: Get companies associated with recruiter
 *     tags: [Recruiter Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of companies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     allOf:
 *                       - $ref: '#/components/schemas/Company'
 *                       - type: object
 *                         properties:
 *                           stats:
 *                             type: object
 *                             properties:
 *                               totalApplications:
 *                                 type: integer
 *                               selected:
 *                                 type: integer
 *                               shortlisted:
 *                                 type: integer
 *                               rejected:
 *                                 type: integer
 *                               pending:
 *                                 type: integer
 *                               in_progress:
 *                                 type: integer
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/recruiter/applications:
 *   get:
 *     summary: Get applications for recruiter's companies
 *     tags: [Recruiter Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         description: Filter by company ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, shortlisted, in_progress, selected, rejected]
 *         description: Filter by status
 *       - in: query
 *         name: branch
 *         schema:
 *           type: string
 *         description: Filter by student branch
 *       - in: query
 *         name: minCGPA
 *         schema:
 *           type: number
 *         description: Minimum CGPA filter
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of applications per page
 *     responses:
 *       200:
 *         description: List of applications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     applications:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           student:
 *                             type: object
 *                           company:
 *                             type: object
 *                           appliedAt:
 *                             type: string
 *                             format: date-time
 *                           status:
 *                             type: string
 *                           score:
 *                             type: number
 *                           notes:
 *                             type: string
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginatedResponse'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/recruiter/applications/{applicationId}/status:
 *   put:
 *     summary: Update application status
 *     tags: [Recruiter Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, shortlisted, in_progress, selected, rejected]
 *               score:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Application updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                     score:
 *                       type: number
 *                     notes:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Application not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/recruiter/applications/bulk-update:
 *   put:
 *     summary: Bulk update applications
 *     tags: [Recruiter Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - applicationIds
 *               - action
 *             properties:
 *               applicationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of application IDs
 *               action:
 *                 type: string
 *                 enum: [shortlist, reject, select]
 *                 description: Action to perform
 *               notes:
 *                 type: string
 *                 description: Notes for the update
 *     responses:
 *       200:
 *         description: Applications updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     updatedCount:
 *                       type: integer
 *                     updatedIds:
 *                       type: array
 *                       items:
 *                         type: string
 *                     status:
 *                       type: string
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */