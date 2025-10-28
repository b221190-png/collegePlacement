const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Application = require('../models/Application');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

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
 *       500:
 *         description: Server error
 */
router.get('/applications', auth.protect, async (req, res) => {
  try {
    const {
      format = 'xlsx',
      status,
      companyId,
      branch,
      batch,
      startDate,
      endDate
    } = req.query;

    if (!['csv', 'xlsx'].includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid format. Must be csv or xlsx'
      });
    }

    // Build query
    const query = {};
    if (status) query.status = status;
    if (companyId) query.companyId = companyId;
    if (startDate || endDate) {
      query.appliedAt = {};
      if (startDate) query.appliedAt.$gte = new Date(startDate);
      if (endDate) query.appliedAt.$lte = new Date(endDate);
    }

    // Get applications with populated data
    const applications = await Application.find(query)
      .populate('studentId', 'name email rollNumber branch batch cgpa phoneNumber personalEmail resumeLink')
      .populate('companyId', 'name location industry type website')
      .sort({ appliedAt: -1 });

    // Filter by branch and batch if specified
    let filteredApplications = applications;
    if (branch) {
      filteredApplications = filteredApplications.filter(app =>
        app.studentId && app.studentId.branch === branch
      );
    }
    if (batch) {
      filteredApplications = filteredApplications.filter(app =>
        app.studentId && app.studentId.batch === batch
      );
    }

    // Prepare data for export
    const exportData = filteredApplications.map(app => ({
      'Application ID': app._id.toString(),
      'Student Name': app.studentId?.name || 'N/A',
      'Roll Number': app.studentId?.rollNumber || 'N/A',
      'Email': app.studentId?.email || 'N/A',
      'Personal Email': app.studentId?.personalEmail || 'N/A',
      'Phone Number': app.studentId?.phoneNumber || 'N/A',
      'Branch': app.studentId?.branch || 'N/A',
      'Batch': app.studentId?.batch || 'N/A',
      'CGPA': app.studentId?.cgpa || 'N/A',
      'Company Name': app.companyId?.name || 'N/A',
      'Company Location': app.companyId?.location || 'N/A',
      'Company Industry': app.companyId?.industry || 'N/A',
      'Company Type': app.companyId?.type || 'N/A',
      'Company Website': app.companyId?.website || 'N/A',
      'Application Status': app.status,
      'Applied Date': app.appliedAt ? app.appliedAt.toLocaleDateString() : 'N/A',
      'Resume Link': app.studentId?.resumeLink || 'N/A',
      'Notes': app.notes || '',
      'Score': app.score || 'N/A'
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Auto-size columns
    const colWidths = [];
    exportData.forEach((row, index) => {
      if (index === 0) {
        Object.keys(row).forEach((key, colIndex) => {
          colWidths[colIndex] = Math.max(key.length, 15);
        });
      }
      Object.values(row).forEach((value, colIndex) => {
        const valueLength = String(value).length;
        if (colWidths[colIndex] < valueLength) {
          colWidths[colIndex] = valueLength;
        }
      });
    });
    ws['!cols'] = colWidths.map(width => ({ width: Math.min(width, 50) }));

    XLSX.utils.book_append_sheet(wb, ws, 'Applications');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `applications_export_${timestamp}.${format}`;

    // Set response headers
    if (format === 'xlsx') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } else {
      res.setHeader('Content-Type', 'text/csv');
    }
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send file
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: format });
    res.send(buffer);

  } catch (error) {
    console.error('Error exporting applications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

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
 *       500:
 *         description: Server error
 */
router.get('/students', auth.protect, async (req, res) => {
  try {
    const {
      format = 'xlsx',
      branch,
      batch,
      minCGPA,
      maxCGPA,
      isPlaced
    } = req.query;

    if (!['csv', 'xlsx'].includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid format. Must be csv or xlsx'
      });
    }

    // Build query
    const query = {};
    if (branch) query.branch = branch;
    if (batch) query.batch = batch;
    if (minCGPA || maxCGPA) {
      query.cgpa = {};
      if (minCGPA) query.cgpa.$gte = parseFloat(minCGPA);
      if (maxCGPA) query.cgpa.$lte = parseFloat(maxCGPA);
    }
    if (isPlaced !== undefined) query.isPlaced = isPlaced === 'true';

    // Get students
    const students = await Student.find(query).sort({ name: 1 });

    // Get application statistics for each student
    const studentsWithStats = await Promise.all(
      students.map(async (student) => {
        const applicationStats = await Application.aggregate([
          { $match: { studentId: student._id } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]);

        const stats = {
          totalApplications: 0,
          selected: 0,
          shortlisted: 0,
          rejected: 0,
          pending: 0,
          in_progress: 0
        };

        applicationStats.forEach(stat => {
          stats.totalApplications += stat.count;
          if (stat._id === 'selected') stats.selected = stat.count;
          if (stat._id === 'shortlisted') stats.shortlisted = stat.count;
          if (stat._id === 'rejected') stats.rejected = stat.count;
          if (stat._id === 'pending') stats.pending = stat.count;
          if (stat._id === 'in_progress') stats.in_progress = stat.count;
        });

        return {
          ...student.toObject(),
          ...stats
        };
      })
    );

    // Prepare data for export
    const exportData = studentsWithStats.map(student => ({
      'Student ID': student._id.toString(),
      'Name': student.name || 'N/A',
      'Roll Number': student.rollNumber || 'N/A',
      'Email': student.email || 'N/A',
      'Personal Email': student.personalEmail || 'N/A',
      'Phone Number': student.phoneNumber || 'N/A',
      'Branch': student.branch || 'N/A',
      'Batch': student.batch || 'N/A',
      'CGPA': student.cgpa || 'N/A',
      'Backlogs': student.backlogs || 0,
      'Is Placed': student.isPlaced ? 'Yes' : 'No',
      'Placed Company': student.placedCompany || 'N/A',
      'Resume Link': student.resumeLink || 'N/A',
      'LinkedIn Profile': student.linkedinProfile || 'N/A',
      'GitHub Profile': student.githubProfile || 'N/A',
      'Portfolio': student.portfolio || 'N/A',
      'Total Applications': student.totalApplications || 0,
      'Selected': student.selected || 0,
      'Shortlisted': student.shortlisted || 0,
      'Rejected': student.rejected || 0,
      'Pending': student.pending || 0,
      'In Progress': student.in_progress || 0,
      'Created Date': student.createdAt ? student.createdAt.toLocaleDateString() : 'N/A'
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Auto-size columns
    const colWidths = [];
    exportData.forEach((row, index) => {
      if (index === 0) {
        Object.keys(row).forEach((key, colIndex) => {
          colWidths[colIndex] = Math.max(key.length, 15);
        });
      }
      Object.values(row).forEach((value, colIndex) => {
        const valueLength = String(value).length;
        if (colWidths[colIndex] < valueLength) {
          colWidths[colIndex] = valueLength;
        }
      });
    });
    ws['!cols'] = colWidths.map(width => ({ width: Math.min(width, 50) }));

    XLSX.utils.book_append_sheet(wb, ws, 'Students');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `students_export_${timestamp}.${format}`;

    // Set response headers
    if (format === 'xlsx') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } else {
      res.setHeader('Content-Type', 'text/csv');
    }
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send file
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: format });
    res.send(buffer);

  } catch (error) {
    console.error('Error exporting students:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

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
 *       500:
 *         description: Server error
 */
router.get('/companies', auth.protect, async (req, res) => {
  try {
    const {
      format = 'xlsx',
      status,
      industry,
      type
    } = req.query;

    if (!['csv', 'xlsx'].includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid format. Must be csv or xlsx'
      });
    }

    // Build query
    const query = {};
    if (status) query.status = status;
    if (industry) query.industry = industry;
    if (type) query.type = type;

    // Get companies
    const companies = await Company.find(query).sort({ name: 1 });

    // Get application statistics for each company
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const applicationStats = await Application.aggregate([
          { $match: { companyId: company._id } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]);

        const stats = {
          totalApplications: 0,
          selected: 0,
          shortlisted: 0,
          rejected: 0,
          pending: 0,
          in_progress: 0
        };

        applicationStats.forEach(stat => {
          stats.totalApplications += stat.count;
          if (stat._id === 'selected') stats.selected = stat.count;
          if (stat._id === 'shortlisted') stats.shortlisted = stat.count;
          if (stat._id === 'rejected') stats.rejected = stat.count;
          if (stat._id === 'pending') stats.pending = stat.count;
          if (stat._id === 'in_progress') stats.in_progress = stat.count;
        });

        // Calculate conversion rate
        const conversionRate = stats.totalApplications > 0
          ? ((stats.selected / stats.totalApplications) * 100).toFixed(2)
          : '0.00';

        return {
          ...company.toObject(),
          ...stats,
          conversionRate
        };
      })
    );

    // Prepare data for export
    const exportData = companiesWithStats.map(company => ({
      'Company ID': company._id.toString(),
      'Name': company.name || 'N/A',
      'Website': company.website || 'N/A',
      'Location': company.location || 'N/A',
      'Industry': company.industry || 'N/A',
      'Type': company.type || 'N/A',
      'Description': company.description || 'N/A',
      'Status': company.status || 'N/A',
      'HR Contact': company.hrContact || 'N/A',
      'HR Email': company.hrEmail || 'N/A',
      'HR Phone': company.hrPhone || 'N/A',
      'Package Range': company.packageRange || 'N/A',
      'Roles Offered': company.rolesOffered ? company.rolesOffered.join(', ') : 'N/A',
      'Skills Required': company.skillsRequired ? company.skillsRequired.join(', ') : 'N/A',
      'Total Applications': company.totalApplications || 0,
      'Selected': company.selected || 0,
      'Shortlisted': company.shortlisted || 0,
      'Rejected': company.rejected || 0,
      'Pending': company.pending || 0,
      'In Progress': company.in_progress || 0,
      'Conversion Rate (%)': company.conversionRate || '0.00',
      'Created Date': company.createdAt ? company.createdAt.toLocaleDateString() : 'N/A'
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Auto-size columns
    const colWidths = [];
    exportData.forEach((row, index) => {
      if (index === 0) {
        Object.keys(row).forEach((key, colIndex) => {
          colWidths[colIndex] = Math.max(key.length, 15);
        });
      }
      Object.values(row).forEach((value, colIndex) => {
        const valueLength = String(value).length;
        if (colWidths[colIndex] < valueLength) {
          colWidths[colIndex] = valueLength;
        }
      });
    });
    ws['!cols'] = colWidths.map(width => ({ width: Math.min(width, 50) }));

    XLSX.utils.book_append_sheet(wb, ws, 'Companies');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `companies_export_${timestamp}.${format}`;

    // Set response headers
    if (format === 'xlsx') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } else {
      res.setHeader('Content-Type', 'text/csv');
    }
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send file
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: format });
    res.send(buffer);

  } catch (error) {
    console.error('Error exporting companies:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

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
 *           description: Filter by academic year (e.g., 2023-24)
 *     responses:
 *       200:
 *         description: Export file
 *       500:
 *         description: Server error
 */
router.get('/dashboard-report', auth.protect, async (req, res) => {
  try {
    const { format = 'xlsx', academicYear } = req.query;

    if (!['csv', 'xlsx'].includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid format. Must be csv or xlsx'
      });
    }

    // Get overall statistics
    const totalStudents = await Student.countDocuments();
    const totalCompanies = await Company.countDocuments({ status: 'active' });
    const totalApplications = await Application.countDocuments();

    const selectedApplications = await Application.countDocuments({ status: 'selected' });
    const placedStudents = await Student.countDocuments({ isPlaced: true });

    const placementRate = totalStudents > 0 ? ((placedStudents / totalStudents) * 100).toFixed(2) : '0.00';
    const selectionRate = totalApplications > 0 ? ((selectedApplications / totalApplications) * 100).toFixed(2) : '0.00';

    // Get branch-wise statistics
    const branchStats = await Student.aggregate([
      {
        $group: {
          _id: '$branch',
          totalStudents: { $sum: 1 },
          placedStudents: {
            $sum: { $cond: ['$isPlaced', 1, 0] }
          },
          avgCGPA: { $avg: '$cgpa' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get company-wise statistics
    const companyStats = await Application.aggregate([
      {
        $group: {
          _id: '$companyId',
          totalApplications: { $sum: 1 },
          selectedStudents: {
            $sum: { $cond: [{ $eq: ['$status', 'selected'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: '_id',
          as: 'company'
        }
      },
      { $unwind: '$company' },
      {
        $addFields: {
          conversionRate: {
            $multiply: [
              { $divide: ['$selectedStudents', '$totalApplications'] },
              100
            ]
          }
        }
      },
      { $sort: { selectedStudents: -1 } }
    ]);

    // Create workbook with multiple sheets
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryData = [
      { 'Metric': 'Total Students', 'Value': totalStudents },
      { 'Metric': 'Total Companies', 'Value': totalCompanies },
      { 'Metric': 'Total Applications', 'Value': totalApplications },
      { 'Metric': 'Selected Applications', 'Value': selectedApplications },
      { 'Metric': 'Placed Students', 'Value': placedStudents },
      { 'Metric': 'Placement Rate (%)', 'Value': placementRate },
      { 'Metric': 'Selection Rate (%)', 'Value': selectionRate },
      { 'Metric': 'Report Generated', 'Value': new Date().toLocaleString() }
    ];
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Sheet 2: Branch Statistics
    const branchData = branchStats.map(stat => ({
      'Branch': stat._id,
      'Total Students': stat.totalStudents,
      'Placed Students': stat.placedStudents,
      'Placement Rate (%)': ((stat.placedStudents / stat.totalStudents) * 100).toFixed(2),
      'Average CGPA': stat.avgCGPA ? stat.avgCGPA.toFixed(2) : 'N/A'
    }));
    const branchWs = XLSX.utils.json_to_sheet(branchData);
    XLSX.utils.book_append_sheet(wb, branchWs, 'Branch Statistics');

    // Sheet 3: Company Performance
    const companyData = companyStats.map(stat => ({
      'Company Name': stat.company.name,
      'Industry': stat.company.industry,
      'Location': stat.company.location,
      'Total Applications': stat.totalApplications,
      'Selected Students': stat.selectedStudents,
      'Conversion Rate (%)': stat.conversionRate.toFixed(2)
    }));
    const companyWs = XLSX.utils.json_to_sheet(companyData);
    XLSX.utils.book_append_sheet(wb, companyWs, 'Company Performance');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `dashboard_report_${timestamp}.${format}`;

    // Set response headers
    if (format === 'xlsx') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } else {
      res.setHeader('Content-Type', 'text/csv');
    }
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send file
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: format });
    res.send(buffer);

  } catch (error) {
    console.error('Error exporting dashboard report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;