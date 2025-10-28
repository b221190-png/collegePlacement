/**
 * @swagger
 * tags:
 *   name: Rounds
 *   description: Recruitment rounds management endpoints
 */

/**
 * @swagger
 * /api/rounds/company/{companyId}:
 *   get:
 *     summary: Get all rounds for a company
 *     tags: [Rounds]
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
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include inactive rounds
 *     responses:
 *       200:
 *         description: List of rounds for the company
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
 *                     rounds:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Round'
 *                     company:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
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

/**
 * @swagger
 * /api/rounds:
 *   post:
 *     summary: Create a new round for a company
 *     tags: [Rounds]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyId
 *               - name
 *               - type
 *             properties:
 *               companyId:
 *                 type: string
 *                 description: Company ID
 *               name:
 *                 type: string
 *                 description: Name of the round
 *               type:
 *                 type: string
 *                 enum: [online_test, technical_interview, hr_interview, group_discussion, aptitude_test, case_study, coding_challenge, behavioral_interview, final_interview]
 *                 description: Type of round
 *               description:
 *                 type: string
 *                 description: Description of the round
 *               sequence:
 *                 type: integer
 *                 description: Sequence order (auto-assigned if not provided)
 *               duration:
 *                 type: integer
 *                 description: Duration in minutes
 *               maxScore:
 *                 type: number
 *                 description: Maximum score
 *               passingScore:
 *                 type: number
 *                 description: Minimum passing score
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *                 description: Scheduled date and time
 *               location:
 *                 type: string
 *                 description: Location or online link
 *               instructions:
 *                 type: string
 *                 description: Special instructions
 *               requiredDocuments:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Required documents
 *               evaluationCriteria:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     weight:
 *                       type: number
 *                     description:
 *                       type: string
 *                 description: Evaluation criteria
 *     responses:
 *       201:
 *         description: Round created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Round'
 *       400:
 *         description: Invalid input
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
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/rounds/{roundId}:
 *   get:
 *     summary: Get a specific round by ID
 *     tags: [Rounds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roundId
 *         required: true
 *         schema:
 *           type: string
 *         description: Round ID
 *     responses:
 *       200:
 *         description: Round details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Round'
 *       404:
 *         description: Round not found
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
 * /api/rounds/{roundId}:
 *   put:
 *     summary: Update a round
 *     tags: [Rounds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roundId
 *         required: true
 *         schema:
 *           type: string
 *         description: Round ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               duration:
 *                 type: integer
 *               maxScore:
 *                 type: number
 *               passingScore:
 *                 type: number
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               instructions:
 *                 type: string
 *               requiredDocuments:
 *                 type: array
 *                 items:
 *                   type: string
 *               evaluationCriteria:
 *                 type: array
 *                 items:
 *                   type: object
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Round updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Round'
 *       404:
 *         description: Round not found
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
 * /api/rounds/{roundId}:
 *   delete:
 *     summary: Delete a round
 *     tags: [Rounds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roundId
 *         required: true
 *         schema:
 *           type: string
 *         description: Round ID
 *     responses:
 *       200:
 *         description: Round deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Round not found
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
 * /api/rounds/{roundId}/candidates:
 *   get:
 *     summary: Get candidates for a specific round
 *     tags: [Rounds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roundId
 *         required: true
 *         schema:
 *           type: string
 *         description: Round ID
 *     responses:
 *       200:
 *         description: List of candidates for the round
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
 *                     round:
 *                       $ref: '#/components/schemas/Round'
 *                     candidates:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           applicationId:
 *                             type: string
 *                           student:
 *                             type: object
 *                           currentStatus:
 *                             type: string
 *       404:
 *         description: Round not found
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
 * /api/rounds/{roundId}/reorder:
 *   put:
 *     summary: Reorder round sequence
 *     tags: [Rounds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roundId
 *         required: true
 *         schema:
 *           type: string
 *         description: Round ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newSequence
 *             properties:
 *               newSequence:
 *                 type: integer
 *                 description: New sequence position
 *     responses:
 *       200:
 *         description: Round reordered successfully
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
 *                     oldSequence:
 *                       type: integer
 *                     newSequence:
 *                       type: integer
 *       404:
 *         description: Round not found
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