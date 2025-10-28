const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Round = require('../models/Round');
const Company = require('../models/Company');
const Application = require('../models/Application');

/**
 * @swagger
 * components:
 *   schemas:
 *     Round:
 *       type: object
 *       required:
 *         - companyId
 *         - name
 *         - type
 *         - sequence
 *       properties:
 *         id:
 *           type: string
 *           description: Round ID
 *         companyId:
 *           type: string
 *           description: Company ID this round belongs to
 *         name:
 *           type: string
 *           description: Name of the recruitment round
 *         type:
 *           type: string
 *           enum: [online_test, technical_interview, hr_interview, group_discussion, aptitude_test, case_study, coding_challenge, behavioral_interview, final_interview]
 *           description: Type of recruitment round
 *         description:
 *           type: string
 *           description: Description of what this round involves
 *         sequence:
 *           type: integer
 *           description: Order in which this round occurs
 *         duration:
 *           type: integer
 *           description: Duration in minutes
 *         maxScore:
 *           type: number
 *           description: Maximum score for this round
 *         passingScore:
 *           type: number
 *           description: Minimum score required to pass
 *         scheduledDate:
 *           type: string
 *           format: date-time
 *           description: Scheduled date and time for this round
 *         location:
 *           type: string
 *           description: Location of the round (physical or online link)
 *         instructions:
 *           type: string
 *           description: Special instructions for candidates
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether this round is currently active
 *         requiredDocuments:
 *           type: array
 *           items:
 *             type: string
 *           description: List of required documents for this round
 *         evaluationCriteria:
 *           type: array
 *           items:
 *             type: object
 *           description: Evaluation criteria for this round
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
 *       500:
 *         description: Server error
 */
router.get('/company/:companyId', auth.protect, async (req, res) => {
  try {
    const { companyId } = req.params;
    const includeInactive = req.query.includeInactive === 'true';

    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Get rounds for the company
    const rounds = await Round.getCompanyRounds(companyId, includeInactive);

    // Format rounds
    const formattedRounds = rounds.map(round => round.getFormattedInfo());

    res.json({
      success: true,
      data: {
        rounds: formattedRounds,
        company: {
          id: company._id,
          name: company.name
        }
      }
    });
  } catch (error) {
    console.error('Error fetching company rounds:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

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
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Company not found
 *       500:
 *         description: Server error
 */
router.post('/', auth.protect, async (req, res) => {
  try {
    const {
      companyId,
      name,
      type,
      description,
      sequence,
      duration,
      maxScore,
      passingScore,
      scheduledDate,
      location,
      instructions,
      requiredDocuments,
      evaluationCriteria
    } = req.body;

    // Validate required fields
    if (!companyId || !name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: companyId, name, type'
      });
    }

    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Get next sequence if not provided
    let roundSequence = sequence;
    if (!roundSequence) {
      roundSequence = await Round.getNextSequence(companyId);
    }

    // Create round
    const round = new Round({
      companyId,
      name,
      type,
      description,
      sequence: roundSequence,
      duration,
      maxScore,
      passingScore,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      location,
      instructions,
      requiredDocuments: requiredDocuments || [],
      evaluationCriteria: evaluationCriteria || [],
      createdBy: req.user.id
    });

    await round.save();
    await round.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: round.getFormattedInfo()
    });
  } catch (error) {
    console.error('Error creating round:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

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
 *       500:
 *         description: Server error
 */
router.get('/:roundId', auth.protect, async (req, res) => {
  try {
    const { roundId } = req.params;

    const round = await Round.findById(roundId)
      .populate('companyId', 'name')
      .populate('createdBy', 'name email');

    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Round not found'
      });
    }

    res.json({
      success: true,
      data: round.getFormattedInfo()
    });
  } catch (error) {
    console.error('Error fetching round:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

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
 *       404:
 *         description: Round not found
 *       500:
 *         description: Server error
 */
router.put('/:roundId', auth.protect, async (req, res) => {
  try {
    const { roundId } = req.params;
    const updateData = req.body;

    // Find and update round
    const round = await Round.findById(roundId);
    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Round not found'
      });
    }

    // Handle scheduledDate conversion
    if (updateData.scheduledDate) {
      updateData.scheduledDate = new Date(updateData.scheduledDate);
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (key !== 'sequence' && key !== 'companyId' && key !== 'createdBy') {
        round[key] = updateData[key];
      }
    });

    await round.save();
    await round.populate('createdBy', 'name email');

    res.json({
      success: true,
      data: round.getFormattedInfo()
    });
  } catch (error) {
    console.error('Error updating round:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

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
 *       404:
 *         description: Round not found
 *       500:
 *         description: Server error
 */
router.delete('/:roundId', auth.protect, async (req, res) => {
  try {
    const { roundId } = req.params;

    const round = await Round.findById(roundId);
    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Round not found'
      });
    }

    await Round.findByIdAndDelete(roundId);

    res.json({
      success: true,
      message: 'Round deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting round:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

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
 *       500:
 *         description: Server error
 */
router.get('/:roundId/candidates', auth.protect, async (req, res) => {
  try {
    const { roundId } = req.params;

    const round = await Round.findById(roundId)
      .populate('companyId', 'name');

    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Round not found'
      });
    }

    const candidates = await round.getUpcomingCandidates();

    res.json({
      success: true,
      data: {
        round: round.getFormattedInfo(),
        candidates
      }
    });
  } catch (error) {
    console.error('Error fetching round candidates:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

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
 *       404:
 *         description: Round not found
 *       500:
 *         description: Server error
 */
router.put('/:roundId/reorder', auth.protect, async (req, res) => {
  try {
    const { roundId } = req.params;
    const { newSequence } = req.body;

    if (!newSequence || newSequence < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid newSequence value'
      });
    }

    const round = await Round.findById(roundId);
    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Round not found'
      });
    }

    const oldSequence = round.sequence;

    if (oldSequence === newSequence) {
      return res.json({
        success: true,
        message: 'No sequence change needed'
      });
    }

    // Update other rounds' sequences
    if (newSequence < oldSequence) {
      // Move up: increment rounds between newSequence and oldSequence
      await Round.updateMany(
        {
          companyId: round.companyId,
          sequence: { $gte: newSequence, $lt: oldSequence },
          _id: { $ne: roundId }
        },
        { $inc: { sequence: 1 } }
      );
    } else {
      // Move down: decrement rounds between oldSequence and newSequence
      await Round.updateMany(
        {
          companyId: round.companyId,
          sequence: { $gt: oldSequence, $lte: newSequence },
          _id: { $ne: roundId }
        },
        { $inc: { sequence: -1 } }
      );
    }

    // Update this round's sequence
    round.sequence = newSequence;
    await round.save();

    res.json({
      success: true,
      message: 'Round reordered successfully',
      data: {
        oldSequence,
        newSequence
      }
    });
  } catch (error) {
    console.error('Error reordering round:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;