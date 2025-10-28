/**
 * @swagger
 * tags:
 *   name: Export
 *   description: Data export endpoints for CSV and XLSX formats
 */

/**
 * @swagger
 * /api/export/applications:
 *   get:
 *     summary: Export applications data as CSV or XLSX
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, xlsx]
 *           default: xlsx
 *         description: Export format
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, shortlisted, in_progress, selected, rejected]
 *         description: Filter by application status
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         description: Filter by company ID
 *       - in: query
 *         name: branch
 *         schema:
 *           type: string
 *         description: Filter by student branch
 *       - in: query
 *         name: batch
 *         schema:
 *           type: string
 *         description: Filter by student batch
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter applications from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter applications until this date
 *     responses:
 *       200:
 *         description: Export file
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *           text/csv:
 *             schema:
 *               type: string
 *       400:
 *         description: Invalid format
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
 * /api/export/students:
 *   get:
 *     summary: Export students data as CSV or XLSX
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, xlsx]
 *           default: xlsx
 *         description: Export format
 *       - in: query
 *         name: branch
 *         schema:
 *           type: string
 *         description: Filter by branch
 *       - in: query
 *         name: batch
 *         schema:
 *           type: string
 *         description: Filter by batch
 *       - in: query
 *         name: minCGPA
 *         schema:
 *           type: number
 *         description: Minimum CGPA filter
 *       - in: query
 *         name: maxCGPA
 *         schema:
 *           type: number
 *         description: Maximum CGPA filter
 *       - in: query
 *         name: isPlaced
 *         schema:
 *           type: boolean
 *         description: Filter by placement status
 *     responses:
 *       200:
 *         description: Export file
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *           text/csv:
 *             schema:
 *               type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/export/companies:
 *   get:
 *     summary: Export companies data as CSV or XLSX
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, xlsx]
 *           default: xlsx
 *         description: Export format
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, blocked]
 *         description: Filter by company status
 *       - in: query
 *         name: industry
 *         schema:
 *           type: string
 *         description: Filter by industry
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [product, service, consulting, startup, mnc]
 *         description: Filter by company type
 *     responses:
 *       200:
 *         description: Export file
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *           text/csv:
 *             schema:
 *               type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/export/dashboard-report:
 *   get:
 *     summary: Export comprehensive dashboard report
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, xlsx]
 *           default: xlsx
 *         description: Export format
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: Filter by academic year (e.g., 2023-24)
 *     responses:
 *       200:
 *         description: Export file
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *           text/csv:
 *             schema:
 *               type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */