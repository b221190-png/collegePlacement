/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: Company management endpoints
 */

/**
 * @swagger
 * /api/companies:
 *   get:
 *     summary: Get all companies
 *     description: Retrieve a list of companies with filtering and pagination
 *     tags: [Companies]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, completed]
 *         description: Filter by status
 *       - in: query
 *         name: industry
 *         schema:
 *           type: string
 *         description: Filter by industry
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name, description, location, and skills
 *     responses:
 *       200:
 *         description: List of companies retrieved successfully
 *       400:
 *         description: Validation error
 *   post:
 *     summary: Create a new company
 *     description: Create a new company (Admin only)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - industry
 *               - location
 *               - packageOffered
 *               - totalPositions
 *               - applicationDeadline
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               industry:
 *                 type: string
 *                 enum: [Information Technology, Software Development, Consulting, Banking and Finance, Manufacturing, Healthcare, Education, E-commerce, Telecommunications, Automotive, Other]
 *               location:
 *                 type: string
 *               packageOffered:
 *                 type: string
 *               totalPositions:
 *                 type: integer
 *                 minimum: 1
 *               applicationDeadline:
 *                 type: string
 *                 format: date-time
 *               logo:
 *                 type: string
 *                 format: binary
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Company created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *
 * /api/companies/active:
 *   get:
 *     summary: Get active companies
 *     description: Retrieve all currently active companies
 *     tags: [Companies]
 *     responses:
 *       200:
 *         description: Active companies retrieved successfully
 *
 * /api/companies/{id}:
 *   get:
 *     summary: Get company by ID
 *     description: Retrieve detailed information about a specific company
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company details retrieved successfully
 *       404:
 *         description: Company not found
 *   put:
 *     summary: Update company
 *     description: Update company information (Admin or company recruiter)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               totalPositions:
 *                 type: integer
 *               applicationDeadline:
 *                 type: string
 *                 format: date-time
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Company updated successfully
 *       404:
 *         description: Company not found
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Delete company
 *     description: Delete a company (Admin only)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company deleted successfully
 *       404:
 *         description: Company not found
 *       401:
 *         description: Unauthorized
 *
 * /api/companies/{id}/rounds:
 *   post:
 *     summary: Create recruitment round
 *     description: Create a recruitment round for a company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - scheduledDate
 *               - roundNumber
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               roundNumber:
 *                 type: integer
 *                 minimum: 1
 *               duration:
 *                 type: integer
 *               isOnline:
 *                 type: boolean
 *               meetingLink:
 *                 type: string
 *     responses:
 *       201:
 *         description: Recruitment round created successfully
 *       404:
 *         description: Company not found
 *   get:
 *     summary: Get recruitment rounds
 *     description: Get all recruitment rounds for a company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Recruitment rounds retrieved successfully
 *       404:
 *         description: Company not found
 *
 * /api/companies/stats:
 *   get:
 *     summary: Get company statistics
 *     description: Get comprehensive company statistics (Admin only)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */

module.exports = {};
