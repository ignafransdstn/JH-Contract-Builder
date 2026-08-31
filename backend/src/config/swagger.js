const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'JH Contract Builder API',
      version: '1.0.0',
      description: 'API Documentation for Jimbaran Hijau Contract Builder System',
      contact: {
        name: 'API Support',
        email: 'support@jhilltown.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.jhilltown.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'email', 'password', 'role'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User ID',
              example: '099c9c88-2eda-47f6-884f-324c23e3bad9'
            },
            name: {
              type: 'string',
              description: 'User full name',
              example: 'Admin Jimbaran Hijau'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'adminjimbaranhijau@jhilltown.com'
            },
            role: {
              type: 'string',
              enum: ['admin', 'supervisor', 'staff', 'manager', 'c-level'],
              description: 'User role',
              example: 'admin'
            },
            department: {
              type: 'string',
              description: 'User department',
              example: 'IT'
            },
            phoneNumber: {
              type: 'string',
              description: 'User phone number',
              example: '+6281234567890'
            },
            position: {
              type: 'string',
              description: 'User position',
              example: 'System Administrator'
            },
            isActive: {
              type: 'boolean',
              description: 'User active status',
              example: true
            }
          }
        },
        Contract: {
          type: 'object',
          required: ['templateId', 'title', 'contractData'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Contract ID'
            },
            contractNumber: {
              type: 'string',
              description: 'Contract number (auto-generated)',
              example: 'JH-202602-0001'
            },
            templateId: {
              type: 'string',
              format: 'uuid',
              description: 'Template ID'
            },
            title: {
              type: 'string',
              description: 'Contract title',
              example: 'Perjanjian Kerjasama Vendor'
            },
            description: {
              type: 'string',
              description: 'Contract description',
              example: 'Perjanjian kerjasama dengan vendor XYZ'
            },
            contractData: {
              type: 'object',
              description: 'Contract form data',
              example: {
                vendorName: 'PT XYZ',
                contractValue: 50000000,
                startDate: '2026-02-01',
                endDate: '2026-12-31'
              }
            },
            status: {
              type: 'string',
              enum: ['draft', 'pending_review', 'reviewed', 'pending_approval1', 'approved1', 'pending_approval2', 'approved2', 'completed', 'rejected'],
              description: 'Contract status',
              example: 'pending_review'
            },
            currentApprovalLayer: {
              type: 'string',
              enum: ['reviewer', 'approval1', 'approval2', 'completed'],
              description: 'Current approval layer',
              example: 'reviewer'
            },
            submittedById: {
              type: 'string',
              format: 'uuid',
              description: 'Submitter user ID'
            },
            reviewerId: {
              type: 'string',
              format: 'uuid',
              description: 'Reviewer user ID'
            },
            approver1Id: {
              type: 'string',
              format: 'uuid',
              description: 'First approver user ID'
            },
            approver2Id: {
              type: 'string',
              format: 'uuid',
              description: 'Second approver user ID'
            },
            approvalHistory: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  layer: {
                    type: 'string',
                    enum: ['reviewer', 'approval1', 'approval2']
                  },
                  approverId: {
                    type: 'string',
                    format: 'uuid'
                  },
                  action: {
                    type: 'string',
                    enum: ['reviewed', 'approved', 'rejected']
                  },
                  comments: {
                    type: 'string'
                  },
                  signature: {
                    type: 'string',
                    description: 'Base64 encoded signature'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            }
          }
        },
        DocumentTemplate: {
          type: 'object',
          required: ['templateName', 'category', 'templateData'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Template ID'
            },
            templateName: {
              type: 'string',
              description: 'Template name',
              example: 'Template Perjanjian Vendor'
            },
            category: {
              type: 'string',
              description: 'Template category',
              example: 'Vendor Agreement'
            },
            description: {
              type: 'string',
              description: 'Template description'
            },
            templateData: {
              type: 'object',
              description: 'Template structure definition',
              example: {
                fields: [
                  { name: 'vendorName', type: 'text', label: 'Nama Vendor', required: true },
                  { name: 'contractValue', type: 'number', label: 'Nilai Kontrak', required: true }
                ]
              }
            },
            isActive: {
              type: 'boolean',
              description: 'Template active status'
            },
            usageCount: {
              type: 'integer',
              description: 'Number of times template has been used'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            error: {
              type: 'string',
              example: 'Detailed error information'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation successful'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Not authorized to access this route'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Resource not found'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Validation failed',
                error: 'Please provide all required fields'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'You do not have permission to perform this action'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication endpoints'
      },
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'Document Templates',
        description: 'Document template management endpoints'
      },
      {
        name: 'Contracts',
        description: 'Contract management endpoints'
      },
      {
        name: 'Approvals',
        description: 'Contract approval workflow endpoints'
      }
    ]
  },
  apis: ['./src/routes/*.js'], // Path to API route files
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
