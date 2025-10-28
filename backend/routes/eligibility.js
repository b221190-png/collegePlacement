const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Application = require('../models/Application');

/**
 * @swagger
 * components:
 *   schemas:
 *     EligibilityCheck:
 *       type: object
 *       properties:
 *         eligible:
 *           type: boolean
 *           description: Whether the student is eligible
 *         reason:
 *           type: string
 *           description: Reason for ineligibility (if applicable)
 *         criteria:
 *           type: object
 *           properties:
 *             minCGPA:
 *               type: object
 *               properties:
 *                 required:
 *                   type: number
 *                 student:
 *                   type: number
 *                 met:
 *                   type: boolean
 *             maxBacklogs:
 *               type: object
 *               properties:
 *                 allowed:
 *                   type: number
 *                 student:
 *                   type: number
 *                 met:
 *                   type: boolean
 *             allowedBranches:
 *               type: object
 *               properties:
 *                 allowed:
 *                   type: array
 *                   items:
 *                     type: string
 *                 student:
 *                   type: string
 *                 met:
 *                   type: boolean
 *             graduationYear:
 *               type: object
 *               properties:
 *                 allowed:
 *                   type: array
 *                   items:
 *                     type: string
 *                 student:
 *                   type: string
 *                 met:
 *                   type: boolean
 *             isPlaced:
 *               type: object
 *               properties:
 *                 allowPlaced:
 *                   type: boolean
 *                 student:
 *                   type: boolean
 *                 met:
 *                   type: boolean
 *             activeApplicationWindow:
 *               type: object
 *               properties:
 *                 hasWindow:
 *                   type: boolean
 *                 endDate:
 *                   type: string
 *                 met:
 *                   type: boolean
 *         recommendations:
 *           type: array
 *           items:
 *             type: string
 *           description: Recommendations for improvement
 *         nextSteps:
 *           type: array
 *           items:
 *             type: string
 *           description: Next steps for the student
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
 *       404:
 *         description: Student or company not found
 *       500:
 *         description: Server error
 */
router.post('/check', auth.protect, async (req, res) => {
  try {
    const { studentId, companyId } = req.body;

    if (!studentId || !companyId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: studentId, companyId'
      });
    }

    // Get student and company details
    const student = await Student.findById(studentId);
    const company = await Company.findById(companyId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      studentId,
      companyId
    });

    if (existingApplication) {
      return res.json({
        success: true,
        data: {
          eligible: false,
          reason: 'Already applied to this company',
          criteria: {},
          recommendations: [],
          nextSteps: ['Check your application status', 'Prepare for upcoming rounds if shortlisted'],
          existingApplication: {
            id: existingApplication._id,
            status: existingApplication.status,
            appliedAt: existingApplication.appliedAt
          }
        }
      });
    }

    // Initialize eligibility result
    const eligibilityResult = {
      eligible: true,
      reason: null,
      criteria: {},
      recommendations: [],
      nextSteps: []
    };

    // Check 1: Minimum CGPA
    if (company.eligibilityCriteria && company.eligibilityCriteria.minCGPA) {
      const minCGPA = company.eligibilityCriteria.minCGPA;
      const studentCGPA = student.cgpa || 0;

      eligibilityResult.criteria.minCGPA = {
        required: minCGPA,
        student: studentCGPA,
        met: studentCGPA >= minCGPA
      };

      if (studentCGPA < minCGPA) {
        eligibilityResult.eligible = false;
        eligibilityResult.reason = `CGPA requirement not met. Required: ${minCGPA}, Your CGPA: ${studentCGPA}`;
        eligibilityResult.recommendations.push(`Focus on improving your CGPA to meet the minimum requirement of ${minCGPA}`);
      }
    }

    // Check 2: Maximum Backlogs
    if (company.eligibilityCriteria && company.eligibilityCriteria.maxBacklogs !== undefined) {
      const maxBacklogs = company.eligibilityCriteria.maxBacklogs;
      const studentBacklogs = student.backlogs || 0;

      eligibilityResult.criteria.maxBacklogs = {
        allowed: maxBacklogs,
        student: studentBacklogs,
        met: studentBacklogs <= maxBacklogs
      };

      if (studentBacklogs > maxBacklogs) {
        eligibilityResult.eligible = false;
        if (!eligibilityResult.reason) {
          eligibilityResult.reason = `Backlog limit exceeded. Maximum allowed: ${maxBacklogs}, Your backlogs: ${studentBacklogs}`;
        }
        eligibilityResult.recommendations.push(`Clear your backlogs to meet the maximum limit of ${maxBacklogs}`);
      }
    }

    // Check 3: Allowed Branches
    if (company.eligibilityCriteria && company.eligibilityCriteria.allowedBranches &&
        company.eligibilityCriteria.allowedBranches.length > 0) {
      const allowedBranches = company.eligibilityCriteria.allowedBranches;
      const studentBranch = student.branch;

      eligibilityResult.criteria.allowedBranches = {
        allowed: allowedBranches,
        student: studentBranch,
        met: allowedBranches.includes(studentBranch)
      };

      if (!allowedBranches.includes(studentBranch)) {
        eligibilityResult.eligible = false;
        if (!eligibilityResult.reason) {
          eligibilityResult.reason = `Branch not eligible. Allowed branches: ${allowedBranches.join(', ')}, Your branch: ${studentBranch}`;
        }
        eligibilityResult.recommendations.push(`Look for companies that specifically recruit from your branch: ${studentBranch}`);
      }
    }

    // Check 4: Graduation Year/Batch
    if (company.eligibilityCriteria && company.eligibilityCriteria.allowedBatches &&
        company.eligibilityCriteria.allowedBatches.length > 0) {
      const allowedBatches = company.eligibilityCriteria.allowedBatches;
      const studentBatch = student.batch;

      eligibilityResult.criteria.graduationYear = {
        allowed: allowedBatches,
        student: studentBatch,
        met: allowedBatches.includes(studentBatch)
      };

      if (!allowedBatches.includes(studentBatch)) {
        eligibilityResult.eligible = false;
        if (!eligibilityResult.reason) {
          eligibilityResult.reason = `Batch not eligible. Allowed batches: ${allowedBatches.join(', ')}, Your batch: ${studentBatch}`;
        }
        eligibilityResult.recommendations.push(`Look for companies that are recruiting for your batch: ${studentBatch}`);
      }
    }

    // Check 5: Placement Status
    if (company.eligibilityCriteria && company.eligibilityCriteria.allowPlaced !== undefined) {
      const allowPlaced = company.eligibilityCriteria.allowPlaced;
      const studentIsPlaced = student.isPlaced || false;

      eligibilityResult.criteria.isPlaced = {
        allowPlaced,
        student: studentIsPlaced,
        met: allowPlaced || !studentIsPlaced
      };

      if (!allowPlaced && studentIsPlaced) {
        eligibilityResult.eligible = false;
        if (!eligibilityResult.reason) {
          eligibilityResult.reason = 'Already placed. This company does not allow placed students to apply.';
        }
        eligibilityResult.recommendations.push('Focus on companies that allow already placed students to apply');
      }
    }

    // Check 6: Active Application Window
    const ApplicationWindow = require('../models/ApplicationWindow');
    const activeWindow = await ApplicationWindow.findOne({
      companyId,
      status: 'active',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    eligibilityResult.criteria.activeApplicationWindow = {
      hasWindow: !!activeWindow,
      endDate: activeWindow ? activeWindow.endDate : null,
      met: !!activeWindow
    };

    if (!activeWindow) {
      eligibilityResult.eligible = false;
      if (!eligibilityResult.reason) {
        eligibilityResult.reason = 'No active application window for this company';
      }
      eligibilityResult.nextSteps.push('Keep checking for upcoming application windows');
    } else {
      eligibilityResult.nextSteps.push(`Application deadline: ${activeWindow.endDate.toLocaleDateString()}`);
    }

    // Add general recommendations
    if (eligibilityResult.eligible) {
      eligibilityResult.nextSteps.push('Update your resume and prepare for the application');
      eligibilityResult.nextSteps.push('Research the company and prepare for potential interviews');

      if (!student.resumeLink) {
        eligibilityResult.recommendations.push('Upload your resume to your profile');
      }

      if (!student.linkedinProfile) {
        eligibilityResult.recommendations.push('Add your LinkedIn profile to enhance your application');
      }

      if (!student.githubProfile && ['Computer Science', 'Information Technology'].includes(student.branch)) {
        eligibilityResult.recommendations.push('Add your GitHub profile to showcase your projects');
      }
    }

    res.json({
      success: true,
      data: eligibilityResult
    });

  } catch (error) {
    console.error('Error checking eligibility:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

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
 *       500:
 *         description: Server error
 */
router.post('/bulk-check', auth.protect, async (req, res) => {
  try {
    const { studentIds, companyIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing studentIds'
      });
    }

    if (!companyIds || !Array.isArray(companyIds) || companyIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing companyIds'
      });
    }

    // Limit bulk check to prevent performance issues
    const maxStudents = 50;
    const maxCompanies = 20;

    if (studentIds.length > maxStudents) {
      return res.status(400).json({
        success: false,
        message: `Cannot check more than ${maxStudents} students at once`
      });
    }

    if (companyIds.length > maxCompanies) {
      return res.status(400).json({
        success: false,
        message: `Cannot check more than ${maxCompanies} companies at once`
      });
    }

    // Get students and companies
    const students = await Student.find({ _id: { $in: studentIds } });
    const companies = await Company.find({ _id: { $in: companyIds } });

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid students found'
      });
    }

    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid companies found'
      });
    }

    // Get existing applications to exclude already applied combinations
    const existingApplications = await Application.find({
      studentId: { $in: studentIds },
      companyId: { $in: companyIds }
    });

    const existingApplicationKeys = new Set(
      existingApplications.map(app => `${app.studentId.toString()}-${app.companyId.toString()}`)
    );

    // Get active application windows
    const ApplicationWindow = require('../models/ApplicationWindow');
    const activeWindows = await ApplicationWindow.find({
      companyId: { $in: companyIds },
      status: 'active',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    const activeWindowMap = new Map(
      activeWindows.map(window => [window.companyId.toString(), window])
    );

    // Prepare results
    const results = [];

    for (const student of students) {
      const studentResult = {
        studentId: student._id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        eligibleCompanies: [],
        ineligibleCompanies: []
      };

      for (const company of companies) {
        const applicationKey = `${student._id.toString()}-${company._id.toString()}`;

        // Skip if already applied
        if (existingApplicationKeys.has(applicationKey)) {
          continue;
        }

        // Check eligibility
        const eligibility = checkSingleStudentEligibility(
          student,
          company,
          activeWindowMap.get(company._id.toString())
        );

        const companyInfo = {
          companyId: company._id,
          companyName: company.name,
          industry: company.industry,
          location: company.location,
          eligibility
        };

        if (eligibility.eligible) {
          studentResult.eligibleCompanies.push(companyInfo);
        } else {
          studentResult.ineligibleCompanies.push(companyInfo);
        }
      }

      results.push(studentResult);
    }

    res.json({
      success: true,
      data: {
        results,
        summary: {
          totalStudents: students.length,
          totalCompanies: companies.length,
          totalChecks: results.reduce((sum, result) =>
            sum + result.eligibleCompanies.length + result.ineligibleCompanies.length, 0
          )
        }
      }
    });

  } catch (error) {
    console.error('Error in bulk eligibility check:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

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
 *       404:
 *         description: Company not found
 *       500:
 *         description: Server error
 */
router.get('/company/:companyId/eligible-students', auth.protect, async (req, res) => {
  try {
    const { companyId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check for active application window
    const ApplicationWindow = require('../models/ApplicationWindow');
    const activeWindow = await ApplicationWindow.findOne({
      companyId,
      status: 'active',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    if (!activeWindow) {
      return res.json({
        success: true,
        data: {
          students: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0
          },
          message: 'No active application window for this company'
        }
      });
    }

    // Build eligibility query
    const query = buildEligibilityQuery(company);

    // Get students who haven't applied yet
    const existingApplicants = await Application.find({
      companyId,
      studentId: { $exists: true }
    }).select('studentId');

    const existingStudentIds = existingApplicants.map(app => app.studentId);

    if (existingStudentIds.length > 0) {
      query._id = { $nin: existingStudentIds };
    }

    // Get eligible students with pagination
    const skip = (page - 1) * limit;
    const students = await Student.find(query)
      .select('name rollNumber email branch batch cgpa backlogs isPlaced resumeLink personalEmail phoneNumber')
      .sort({ cgpa: -1, name: 1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Student.countDocuments(query);

    // Format student data
    const formattedStudents = students.map(student => ({
      id: student._id,
      name: student.name,
      rollNumber: student.rollNumber,
      email: student.email,
      personalEmail: student.personalEmail,
      phoneNumber: student.phoneNumber,
      branch: student.branch,
      batch: student.batch,
      cgpa: student.cgpa,
      backlogs: student.backlogs,
      isPlaced: student.isPlaced,
      resumeLink: student.resumeLink,
      eligibility: checkSingleStudentEligibility(student, company, activeWindow)
    }));

    res.json({
      success: true,
      data: {
        students: formattedStudents,
        company: {
          id: company._id,
          name: company.name,
          eligibilityCriteria: company.eligibilityCriteria
        },
        applicationWindow: {
          id: activeWindow._id,
          startDate: activeWindow.startDate,
          endDate: activeWindow.endDate
        },
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching eligible students:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Helper function to check single student eligibility
function checkSingleStudentEligibility(student, company, activeWindow) {
  const criteria = company.eligibilityCriteria || {};
  const result = {
    eligible: true,
    reasons: [],
    criteriaChecks: {}
  };

  // Check CGPA
  if (criteria.minCGPA) {
    const met = (student.cgpa || 0) >= criteria.minCGPA;
    result.criteriaChecks.cgpa = {
      required: criteria.minCGPA,
      actual: student.cgpa || 0,
      met
    };
    if (!met) {
      result.eligible = false;
      result.reasons.push(`CGPA below minimum (${criteria.minCGPA})`);
    }
  }

  // Check backlogs
  if (criteria.maxBacklogs !== undefined) {
    const met = (student.backlogs || 0) <= criteria.maxBacklogs;
    result.criteriaChecks.backlogs = {
      allowed: criteria.maxBacklogs,
      actual: student.backlogs || 0,
      met
    };
    if (!met) {
      result.eligible = false;
      result.reasons.push(`Backlogs exceed limit (${criteria.maxBacklogs})`);
    }
  }

  // Check branch
  if (criteria.allowedBranches && criteria.allowedBranches.length > 0) {
    const met = criteria.allowedBranches.includes(student.branch);
    result.criteriaChecks.branch = {
      allowed: criteria.allowedBranches,
      actual: student.branch,
      met
    };
    if (!met) {
      result.eligible = false;
      result.reasons.push(`Branch not in allowed list`);
    }
  }

  // Check batch
  if (criteria.allowedBatches && criteria.allowedBatches.length > 0) {
    const met = criteria.allowedBatches.includes(student.batch);
    result.criteriaChecks.batch = {
      allowed: criteria.allowedBatches,
      actual: student.batch,
      met
    };
    if (!met) {
      result.eligible = false;
      result.reasons.push(`Batch not in allowed list`);
    }
  }

  // Check placement status
  if (criteria.allowPlaced !== undefined) {
    const met = criteria.allowPlaced || !(student.isPlaced || false);
    result.criteriaChecks.placementStatus = {
      allowPlaced: criteria.allowPlaced,
      isPlaced: student.isPlaced || false,
      met
    };
    if (!met) {
      result.eligible = false;
      result.reasons.push(`Already placed (company doesn't allow placed students)`);
    }
  }

  // Check application window
  if (!activeWindow) {
    result.eligible = false;
    result.reasons.push('No active application window');
  }

  return result;
}

// Helper function to build eligibility query
function buildEligibilityQuery(company) {
  const criteria = company.eligibilityCriteria || {};
  const query = {};

  if (criteria.minCGPA) {
    query.cgpa = { $gte: criteria.minCGPA };
  }

  if (criteria.maxBacklogs !== undefined) {
    query.backlogs = { $lte: criteria.maxBacklogs };
  }

  if (criteria.allowedBranches && criteria.allowedBranches.length > 0) {
    query.branch = { $in: criteria.allowedBranches };
  }

  if (criteria.allowedBatches && criteria.allowedBatches.length > 0) {
    query.batch = { $in: criteria.allowedBatches };
  }

  if (criteria.allowPlaced !== undefined && !criteria.allowPlaced) {
    query.isPlaced = { $ne: true };
  }

  return query;
}

module.exports = router;