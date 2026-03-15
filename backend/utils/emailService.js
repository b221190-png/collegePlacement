const nodemailer = require('nodemailer');

/**
 * Email service utility for sending emails
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  hasConfiguredSmtp() {
    return Boolean(
      process.env.EMAIL_HOST &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS
    );
  }

  getFromAddress() {
    return process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER || 'placements@college.edu';
  }

  getFromName() {
    return process.env.EMAIL_FROM_NAME || 'Placement Cell';
  }

  /**
   * Initialize email transporter
   */
  initializeTransporter() {
    const port = Number(process.env.EMAIL_PORT || 587);
    const secure =
      process.env.EMAIL_SECURE === 'true' ||
      (process.env.EMAIL_SECURE !== 'false' && port === 465);

    // Prefer configured SMTP credentials in every environment.
    if (this.hasConfiguredSmtp()) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port,
        secure,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      return;
    }

    // Fallback for local development when real SMTP is not configured.
    this.transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.ETHEREAL_USER || 'ethereal.user@ethereal.email',
        pass: process.env.ETHEREAL_PASS || 'ethereal.password'
      }
    });
  }

  /**
   * Send email to eligible students
   * @param {Array} students - Array of eligible students
   * @param {Object} company - Company information
   * @param {Object} emailOptions - Email customization options
   * @returns {Promise} - Result of email sending operation
   */
  async sendEmailsToEligibleStudents(students, company, emailOptions = {}) {
    try {
      const results = {
        total: students.length,
        successful: 0,
        failed: 0,
        errors: []
      };

      const defaultSubject = `Exciting Opportunity at ${company.name} - Application Now Open!`;
      const defaultHtmlTemplate = this.generateEmailTemplate(company, emailOptions.customMessage);
      const defaultTextTemplate = this.generateTextEmailTemplate(company, emailOptions.customMessage);

      // Send emails in batches to avoid overwhelming the email service
      const batchSize = 10;
      for (let i = 0; i < students.length; i += batchSize) {
        const batch = students.slice(i, i + batchSize);

        const emailPromises = batch.map(async (student) => {
          try {
            const mailOptions = {
              from: `"${this.getFromName()}" <${this.getFromAddress()}>`,
              to: student.email,
              cc: student.personalEmail ? student.personalEmail : undefined,
              subject: emailOptions.subject || defaultSubject,
              text: defaultTextTemplate.replace('{{studentName}}', student.name),
              html: defaultHtmlTemplate.replace('{{studentName}}', student.name)
            };

            const info = await this.transporter.sendMail(mailOptions);
            results.successful++;
            return {
              studentId: student._id,
              email: student.email,
              messageId: info.messageId,
              status: 'success'
            };
          } catch (error) {
            results.failed++;
            results.errors.push({
              studentId: student._id,
              email: student.email,
              error: error.message
            });
            return {
              studentId: student._id,
              email: student.email,
              status: 'failed',
              error: error.message
            };
          }
        });

        await Promise.all(emailPromises);

        // Small delay between batches to be respectful to email services
        if (i + batchSize < students.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return {
        success: true,
        message: `Email sending completed. ${results.successful} successful, ${results.failed} failed.`,
        results
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to send emails: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Generate HTML email template
   * @param {Object} company - Company information
   * @param {string} customMessage - Custom message to include
   * @returns {string} - HTML email template
   */
  generateEmailTemplate(company, customMessage = '') {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Career Opportunity at ${company.name}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #007bff;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 10px;
        }
        .company-info {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .opportunity-details {
            margin: 20px 0;
        }
        .cta-button {
            display: inline-block;
            background-color: #28a745;
            color: #ffffff;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 14px;
        }
        .eligibility-badge {
            background-color: #28a745;
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🎓 Placement Cell</div>
            <h1>Career Opportunity Alert!</h1>
        </div>

        <p>Dear <strong>{{studentName}}</strong>,</p>

        <p>Great news! We are excited to inform you that you are eligible for an excellent career opportunity at <strong>${company.name}</strong>.</p>

        <div class="company-info">
            <h3>About ${company.name}</h3>
            <p><strong>Industry:</strong> ${company.industry || 'Leading Technology'}</p>
            <p><strong>Type:</strong> ${company.type || 'Product Company'}</p>
            <p><strong>Location:</strong> ${company.location || 'Multiple Locations'}</p>
            ${company.description ? `<p><strong>About:</strong> ${company.description}</p>` : ''}
        </div>

        <div class="opportunity-details">
            <h3>Why This Opportunity is Perfect for You:</h3>
            <ul>
                <li><span class="eligibility-badge">ELIGIBLE</span> You meet all the eligibility criteria</li>
                <li>Excellent growth potential and learning opportunities</li>
                <li>Competitive compensation package</li>
                <li>Great work culture and environment</li>
            </ul>
        </div>

        ${customMessage ? `
        <div class="custom-message">
            <h3>Additional Information:</h3>
            <p>${customMessage}</p>
        </div>
        ` : ''}

        <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/companies/${company._id}" class="cta-button">
                Apply Now
            </a>
        </div>

        <p><strong>Don't miss this opportunity!</strong> Applications are open for a limited time. We encourage you to apply as soon as possible.</p>

        <p>If you have any questions or need assistance with your application, please don't hesitate to contact the placement cell.</p>

        <div class="footer">
            <p>Best regards,<br>
            Training and Placement Cell<br>
            [Your College Name]<br>
            <small>This is an automated message. Please do not reply to this email.</small></p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate text email template
   * @param {Object} company - Company information
   * @param {string} customMessage - Custom message to include
   * @returns {string} - Text email template
   */
  generateTextEmailTemplate(company, customMessage = '') {
    return `
Dear {{studentName}},

Great news! We are excited to inform you that you are eligible for an excellent career opportunity at ${company.name}.

COMPANY DETAILS:
===============
Company: ${company.name}
Industry: ${company.industry || 'Leading Technology'}
Type: ${company.type || 'Product Company'}
Location: ${company.location || 'Multiple Locations'}
${company.description ? `About: ${company.description}` : ''}

WHY THIS OPPORTUNITY IS PERFECT FOR YOU:
==========================================
✓ ELIGIBLE - You meet all the eligibility criteria
✓ Excellent growth potential and learning opportunities
✓ Competitive compensation package
✓ Great work culture and environment

${customMessage ? `ADDITIONAL INFORMATION:
========================
${customMessage}` : ''}

Apply Now: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/companies/${company._id}

Don't miss this opportunity! Applications are open for a limited time. We encourage you to apply as soon as possible.

If you have any questions or need assistance with your application, please don't hesitate to contact the placement cell.

Best regards,
Training and Placement Cell
[Your College Name]

---
This is an automated message. Please do not reply to this email.
`;
  }

  /**
   * Test email configuration
   * @returns {Promise<boolean>} - Test result
   */
  async testEmailConfiguration() {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email configuration test failed:', error);
      return false;
    }
  }

  /**
   * Send temporary password email for first-time access / recovery
   * @param {Object} payload
   * @param {string} payload.name
   * @param {string} payload.email
   * @param {string} payload.temporaryPassword
   * @param {string} payload.role
   * @returns {Promise<Object>}
   */
  async sendTemporaryPasswordEmail({ name, email, temporaryPassword, role }) {
    try {
      const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
      const subject = 'Your temporary placement portal password';
      const text = `Hello ${name},

You requested access to the College Placement Portal.

Temporary password: ${temporaryPassword}

Role: ${role}

Use this temporary password to sign in at ${frontendBase}/auth.
After signing in, you will be asked to set a new password before continuing.

If you did not request this, please contact the placement cell immediately.
`;

      const html = `
        <div style="font-family:Segoe UI,Tahoma,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f8fafc;color:#0f172a">
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;padding:28px">
            <p style="font-size:14px;letter-spacing:0.14em;text-transform:uppercase;color:#2563eb;margin:0 0 12px">College Placement</p>
            <h1 style="font-size:26px;line-height:1.2;margin:0 0 12px">Temporary password issued</h1>
            <p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 18px">
              Hello <strong>${name}</strong>, use the temporary password below to sign in to the placement portal.
            </p>
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;padding:18px;margin:0 0 18px">
              <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.12em;color:#1d4ed8;margin-bottom:8px">Temporary Password</div>
              <div style="font-size:24px;font-weight:700;letter-spacing:0.08em;color:#0f172a">${temporaryPassword}</div>
            </div>
            <p style="font-size:14px;line-height:1.7;color:#475569;margin:0 0 12px">
              Role: <strong>${role}</strong>
            </p>
            <p style="font-size:14px;line-height:1.7;color:#475569;margin:0 0 18px">
              Sign in at <a href="${frontendBase}/auth" style="color:#2563eb">${frontendBase}/auth</a>.
              The portal will require you to set a new password before you can continue.
            </p>
            <p style="font-size:13px;line-height:1.7;color:#64748b;margin:0">
              If you did not request this, contact the placement cell immediately.
            </p>
          </div>
        </div>
      `;

      const info = await this.transporter.sendMail({
        from: `"${this.getFromName()}" <${this.getFromAddress()}>`,
        to: email,
        subject,
        text,
        html
      });

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info) || null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new EmailService();
