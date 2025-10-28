/**
 * Swagger schema definitions for College Placement API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: User's unique identifier
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         role:
 *           type: string
 *           enum: [admin, recruiter, student]
 *           description: User's role in the system
 *         companyId:
 *           type: string
 *           description: Company ID (for recruiters only)
 *         isActive:
 *           type: boolean
 *           description: Whether the user account is active
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Last login timestamp
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the operation was successful
 *         message:
 *           type: string
 *           description: Error message or success message
 *         errors:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of validation errors
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             accessToken:
 *               type: string
 *               description: JWT access token
 *             refreshToken:
 *               type: string
 *               description: JWT refresh token
 *     StudentData:
 *       type: object
 *       properties:
 *         rollNumber:
 *           type: string
 *           description: Student's roll number
 *         branch:
 *           type: string
 *           description: Student's branch of study
 *         cgpa:
 *           type: number
 *           minimum: 0
 *           maximum: 10
 *           description: Student's CGPA
 *         phone:
 *           type: string
 *           pattern: '^[0-9]{10}$'
 *           description: Student's phone number
 *         batch:
 *           type: integer
 *           minimum: 2000
 *           maximum: 2030
 *           description: Student's batch year
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           description: Student's technical skills
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT Bearer token authentication
 */

module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'College Placement API',
    version: '1.0.0',
    description: 'API documentation for College Placement Management System',
    contact: {
      name: 'API Support',
      email: 'support@collegeplacement.com'
    }
  },
  servers: [
    {
      url: process.env.FRONTEND_URL || 'http://localhost:5000',
      description: 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: "User's unique identifier"
          },
          name: {
            type: 'string',
            description: "User's full name"
          },
          email: {
            type: 'string',
            format: 'email',
            description: "User's email address"
          },
          role: {
            type: 'string',
            enum: ['admin', 'recruiter', 'student'],
            description: "User's role in the system"
          },
          companyId: {
            type: 'string',
            description: "Company ID (for recruiters only)"
          },
          isActive: {
            type: 'boolean',
            description: "Whether the user account is active"
          },
          lastLogin: {
            type: 'string',
            format: 'date-time',
            description: "Last login timestamp"
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: "Whether the operation was successful"
          },
          message: {
            type: 'string',
            description: "Error message or success message"
          },
          errors: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: "Array of validation errors"
          }
        }
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean'
          },
          message: {
            type: 'string'
          },
          data: {
            type: 'object',
            properties: {
              user: {
                $ref: '#/components/schemas/User'
              },
              accessToken: {
                type: 'string',
                description: 'JWT access token'
              },
              refreshToken: {
                type: 'string',
                description: 'JWT refresh token'
              }
            }
          }
        }
      },
      StudentData: {
        type: 'object',
        properties: {
          rollNumber: {
            type: 'string',
            description: "Student's roll number"
          },
          branch: {
            type: 'string',
            description: "Student's branch of study"
          },
          cgpa: {
            type: 'number',
            minimum: 0,
            maximum: 10,
            description: "Student's CGPA"
          },
          phone: {
            type: 'string',
            pattern: '^[0-9]{10}$',
            description: "Student's phone number"
          },
          batch: {
            type: 'integer',
            minimum: 2000,
            maximum: 2030,
            description: "Student's batch year"
          },
          skills: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: "Student's technical skills"
          }
        }
      },
      Student: {
        type: 'object',
        required: ['name', 'email', 'rollNumber', 'branch', 'batch', 'cgpa'],
        properties: {
          id: {
            type: 'string',
            description: 'Student ID'
          },
          name: {
            type: 'string',
            description: 'Student full name'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Student email address'
          },
          rollNumber: {
            type: 'string',
            description: 'Student roll number'
          },
          branch: {
            type: 'string',
            description: 'Student branch/department'
          },
          batch: {
            type: 'string',
            description: 'Student batch/year'
          },
          cgpa: {
            type: 'number',
            minimum: 0,
            maximum: 10,
            description: 'Student CGPA'
          },
          backlogs: {
            type: 'integer',
            default: 0,
            description: 'Number of backlogs'
          },
          phoneNumber: {
            type: 'string',
            description: 'Student phone number'
          },
          personalEmail: {
            type: 'string',
            format: 'email',
            description: 'Personal email address'
          },
          isPlaced: {
            type: 'boolean',
            default: false,
            description: 'Whether student is placed'
          },
          placedCompany: {
            type: 'string',
            description: 'Company where student is placed'
          },
          resumeLink: {
            type: 'string',
            description: 'Link to resume file'
          },
          linkedinProfile: {
            type: 'string',
            description: 'LinkedIn profile URL'
          },
          githubProfile: {
            type: 'string',
            description: 'GitHub profile URL'
          },
          portfolio: {
            type: 'string',
            description: 'Portfolio website URL'
          },
          skills: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Student technical skills'
          }
        }
      },
      Company: {
        type: 'object',
        required: ['name', 'location', 'industry', 'type'],
        properties: {
          id: {
            type: 'string',
            description: 'Company ID'
          },
          name: {
            type: 'string',
            description: 'Company name'
          },
          website: {
            type: 'string',
            format: 'uri',
            description: 'Company website URL'
          },
          location: {
            type: 'string',
            description: 'Company location'
          },
          industry: {
            type: 'string',
            description: 'Company industry sector'
          },
          type: {
            type: 'string',
            enum: ['product', 'service', 'consulting', 'startup', 'mnc'],
            description: 'Company type'
          },
          description: {
            type: 'string',
            description: 'Company description'
          },
          hrContact: {
            type: 'string',
            description: 'HR contact person'
          },
          hrEmail: {
            type: 'string',
            format: 'email',
            description: 'HR email address'
          },
          hrPhone: {
            type: 'string',
            description: 'HR phone number'
          },
          packageRange: {
            type: 'string',
            description: 'Salary package range'
          },
          rolesOffered: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Roles offered by company'
          },
          skillsRequired: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Required skills'
          },
          eligibilityCriteria: {
            type: 'object',
            properties: {
              minCGPA: {
                type: 'number',
                description: 'Minimum required CGPA'
              },
              maxBacklogs: {
                type: 'integer',
                description: 'Maximum allowed backlogs'
              },
              allowedBranches: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Allowed branches'
              },
              allowedBatches: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Allowed batches'
              },
              allowPlaced: {
                type: 'boolean',
                description: 'Whether placed students can apply'
              }
            }
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'blocked'],
            default: 'active',
            description: 'Company status'
          }
        }
      },
      Application: {
        type: 'object',
        required: ['studentId', 'companyId', 'status'],
        properties: {
          id: {
            type: 'string',
            description: 'Application ID'
          },
          studentId: {
            type: 'string',
            description: 'Student ID'
          },
          companyId: {
            type: 'string',
            description: 'Company ID'
          },
          applicationWindowId: {
            type: 'string',
            description: 'Application window ID'
          },
          status: {
            type: 'string',
            enum: ['pending', 'shortlisted', 'in_progress', 'selected', 'rejected'],
            default: 'pending',
            description: 'Application status'
          },
          appliedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Application date'
          },
          resumeUrl: {
            type: 'string',
            description: 'Resume file URL'
          },
          notes: {
            type: 'string',
            description: 'Application notes'
          },
          score: {
            type: 'number',
            description: 'Application score'
          }
        }
      },
      ApplicationWindow: {
        type: 'object',
        required: ['companyId', 'startDate', 'endDate'],
        properties: {
          id: {
            type: 'string',
            description: 'Application window ID'
          },
          companyId: {
            type: 'string',
            description: 'Company ID'
          },
          title: {
            type: 'string',
            description: 'Application window title'
          },
          description: {
            type: 'string',
            description: 'Application window description'
          },
          startDate: {
            type: 'string',
            format: 'date-time',
            description: 'Application start date'
          },
          endDate: {
            type: 'string',
            format: 'date-time',
            description: 'Application end date'
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'closed'],
            default: 'active',
            description: 'Application window status'
          },
          maxApplications: {
            type: 'integer',
            description: 'Maximum number of applications'
          },
          currentApplications: {
            type: 'integer',
            description: 'Current number of applications'
          }
        }
      },
      Notification: {
        type: 'object',
        required: ['recipientId', 'recipientType', 'type', 'message'],
        properties: {
          id: {
            type: 'string',
            description: 'Notification ID'
          },
          recipientId: {
            type: 'string',
            description: 'Recipient ID'
          },
          recipientType: {
            type: 'string',
            enum: ['student', 'user'],
            description: 'Type of recipient'
          },
          type: {
            type: 'string',
            enum: ['application_status', 'new_company', 'deadline_reminder', 'system_update'],
            description: 'Type of notification'
          },
          message: {
            type: 'string',
            description: 'Notification message'
          },
          read: {
            type: 'boolean',
            default: false,
            description: 'Whether notification has been read'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Notification timestamp'
          },
          metadata: {
            type: 'object',
            description: 'Additional notification data'
          }
        }
      },
      Round: {
        type: 'object',
        required: ['companyId', 'name', 'type', 'sequence'],
        properties: {
          id: {
            type: 'string',
            description: 'Round ID'
          },
          companyId: {
            type: 'string',
            description: 'Company ID'
          },
          name: {
            type: 'string',
            description: 'Name of the recruitment round'
          },
          type: {
            type: 'string',
            enum: ['online_test', 'technical_interview', 'hr_interview', 'group_discussion', 'aptitude_test', 'case_study', 'coding_challenge', 'behavioral_interview', 'final_interview'],
            description: 'Type of recruitment round'
          },
          description: {
            type: 'string',
            description: 'Description of what this round involves'
          },
          sequence: {
            type: 'integer',
            description: 'Order in which this round occurs'
          },
          duration: {
            type: 'integer',
            description: 'Duration in minutes'
          },
          maxScore: {
            type: 'number',
            description: 'Maximum score for this round'
          },
          passingScore: {
            type: 'number',
            description: 'Minimum score required to pass'
          },
          scheduledDate: {
            type: 'string',
            format: 'date-time',
            description: 'Scheduled date and time for this round'
          },
          location: {
            type: 'string',
            description: 'Location of the round (physical or online link)'
          },
          instructions: {
            type: 'string',
            description: 'Special instructions for candidates'
          },
          isActive: {
            type: 'boolean',
            default: true,
            description: 'Whether this round is currently active'
          },
          requiredDocuments: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'List of required documents for this round'
          },
          evaluationCriteria: {
            type: 'array',
            items: {
              type: 'object'
            },
            description: 'Evaluation criteria for this round'
          }
        }
      },
      OffCampusOpportunity: {
        type: 'object',
        required: ['title', 'company', 'location', 'type'],
        properties: {
          id: {
            type: 'string',
            description: 'Opportunity ID'
          },
          title: {
            type: 'string',
            description: 'Opportunity title'
          },
          company: {
            type: 'string',
            description: 'Company name'
          },
          location: {
            type: 'string',
            description: 'Job location'
          },
          type: {
            type: 'string',
            enum: ['full-time', 'internship', 'part-time', 'contract'],
            description: 'Employment type'
          },
          description: {
            type: 'string',
            description: 'Job description'
          },
          requirements: {
            type: 'string',
            description: 'Job requirements'
          },
          salary: {
            type: 'string',
            description: 'Salary range'
          },
          deadline: {
            type: 'string',
            format: 'date-time',
            description: 'Application deadline'
          },
          applyLink: {
            type: 'string',
            format: 'uri',
            description: 'Application link'
          },
          isActive: {
            type: 'boolean',
            default: true,
            description: 'Whether opportunity is active'
          }
        }
      },
      EligibilityCheck: {
        type: 'object',
        properties: {
          eligible: {
            type: 'boolean',
            description: 'Whether the student is eligible'
          },
          reason: {
            type: 'string',
            description: 'Reason for ineligibility (if applicable)'
          },
          criteria: {
            type: 'object',
            properties: {
              minCGPA: {
                type: 'object',
                properties: {
                  required: {
                    type: 'number'
                  },
                  student: {
                    type: 'number'
                  },
                  met: {
                    type: 'boolean'
                  }
                }
              },
              maxBacklogs: {
                type: 'object',
                properties: {
                  allowed: {
                    type: 'integer'
                  },
                  student: {
                    type: 'integer'
                  },
                  met: {
                    type: 'boolean'
                  }
                }
              },
              allowedBranches: {
                type: 'object',
                properties: {
                  allowed: {
                    type: 'array',
                    items: {
                      type: 'string'
                    }
                  },
                  student: {
                    type: 'string'
                  },
                  met: {
                    type: 'boolean'
                  }
                }
              },
              graduationYear: {
                type: 'object',
                properties: {
                  allowed: {
                    type: 'array',
                    items: {
                      type: 'string'
                    }
                  },
                  student: {
                    type: 'string'
                  },
                  met: {
                    type: 'boolean'
                  }
                }
              },
              isPlaced: {
                type: 'object',
                properties: {
                  allowPlaced: {
                    type: 'boolean'
                  },
                  student: {
                    type: 'boolean'
                  },
                  met: {
                    type: 'boolean'
                  }
                }
              },
              activeApplicationWindow: {
                type: 'object',
                properties: {
                  hasWindow: {
                    type: 'boolean'
                  },
                  endDate: {
                    type: 'string'
                  },
                  met: {
                    type: 'boolean'
                  }
                }
              }
            }
          },
          recommendations: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Recommendations for improvement'
          },
          nextSteps: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Next steps for the student'
          }
        }
      },
      RecruiterAnalytics: {
        type: 'object',
        properties: {
          overview: {
            type: 'object',
            properties: {
              totalApplications: {
                type: 'integer'
              },
              newApplications: {
                type: 'integer'
              },
              shortlistedCandidates: {
                type: 'integer'
              },
              selectedCandidates: {
                type: 'integer'
              },
              activeRecruitments: {
                type: 'integer'
              },
              conversionRate: {
                type: 'number'
              }
            }
          },
          applicationTrends: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: {
                  type: 'string'
                },
                count: {
                  type: 'integer'
                }
              }
            }
          },
          statusBreakdown: {
            type: 'object',
            properties: {
              pending: {
                type: 'integer'
              },
              shortlisted: {
                type: 'integer'
              },
              in_progress: {
                type: 'integer'
              },
              selected: {
                type: 'integer'
              },
              rejected: {
                type: 'integer'
              }
            }
          },
          branchWiseStats: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                branch: {
                  type: 'string'
                },
                applications: {
                  type: 'integer'
                },
                shortlisted: {
                  type: 'integer'
                },
                selected: {
                  type: 'integer'
                },
                conversionRate: {
                  type: 'number'
                }
              }
            }
          },
          recentApplications: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string'
                },
                student: {
                  type: 'object'
                },
                appliedAt: {
                  type: 'string'
                },
                status: {
                  type: 'string'
                }
              }
            }
          }
        }
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          data: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'object'
                },
                description: 'Array of items'
              },
              pagination: {
                type: 'object',
                properties: {
                  page: {
                    type: 'integer',
                    description: 'Current page number'
                  },
                  limit: {
                    type: 'integer',
                    description: 'Items per page'
                  },
                  total: {
                    type: 'integer',
                    description: 'Total number of items'
                  },
                  pages: {
                    type: 'integer',
                    description: 'Total number of pages'
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};