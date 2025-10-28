/**
 * @swagger
 * tags:
 *   name: Eligibility
 *   description: Student eligibility checking endpoints
 */

/**
 * @swagger
 * /api/eligibility/check:
 *   post:
 *     summary: Check student eligibility for a company
 *     tags: [Eligibility]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - companyId
 *             properties:
 *               studentId:
 *                 type: string
 *                 description: Student ID
 *               companyId:
 *                 type: string
 *                 description: Company ID
 *     responses:
 *       200:
 *         description: Eligibility check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/EligibilityCheck'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Student or company not found
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
 * /api/eligibility/bulk-check:
 *   post:
 *     summary: Check eligibility for multiple students against multiple companies
 *     tags: [Eligibility]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentIds
 *               - companyIds
 *             properties:
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of student IDs
 *               companyIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of company IDs
 *     responses:
 *       200:
 *         description: Bulk eligibility check results
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
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           studentId:
 *                             type: string
 *                           studentName:
 *                             type: string
 *                           rollNumber:
 *                             type: string
 *                           eligibleCompanies:
 *                             type: array
 *                             items:
 *                               type: object
 *                           ineligibleCompanies:
 *                             type: array
 *                             items:
 *                               type: object
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalStudents:
 *                           type: integer
 *                         totalCompanies:
 *                           type: integer
 *                         totalChecks:
 *                           type: integer
 *       400:
 *         description: Invalid input
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
 * /api/eligibility/company/{companyId}/eligible-students:
 *   get:
 *     summary: Get all eligible students for a company
 *     tags: [Eligibility]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
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
 *           default: 50
 *         description: Number of students per page
 *     responses:
 *       200:
 *         description: List of eligible students
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
 *                     students:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           rollNumber:
 *                             type: string
 *                           email:
 *                             type: string
 *                           personalEmail:
 *                             type: string
 *                           phoneNumber:
 *                             type: string
 *                           branch:
 *                             type: string
 *                           batch:
 *                             type: string
 *                           cgpa:
 *                             type: number
 *                           backlogs:
 *                             type: integer
 *                           isPlaced:
 *                             type: boolean
 *                           resumeLink:
 *                             type: string
 *                           eligibility:
 *                             $ref: '#/components/schemas/EligibilityCheck'
 *                     company:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         eligibilityCriteria:
 *                           type: object
 *                     applicationWindow:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         startDate:
 *                           type: string
 *                           format: date-time
 *                         endDate:
 *                           type: string
 *                           format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       404:
 *         description: Company not found
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