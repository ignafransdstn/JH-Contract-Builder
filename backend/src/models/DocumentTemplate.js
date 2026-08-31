const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class DocumentTemplate extends Model {}

DocumentTemplate.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  templateName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Template name is required' }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  originalFileName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originalFilePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileType: {
    type: DataTypes.ENUM('docx', 'pdf', 'xlsx'),
    allowNull: false
  },
  fields: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of field objects: {label, type, required, placeholder, validation, order, options}'
  },
  approvalMatrix: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Approval flow: {reviewerId, approver1Id, approver2Id}'
  },
  extractedText: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Extracted text from uploaded document for reference'
  },
  status: {
    type: DataTypes.ENUM('draft', 'published'),
    defaultValue: 'draft',
    allowNull: false
  },
  targetedUsers: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of user IDs who can access this template. Empty array = public template (all users can access)'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  sequelize,
  modelName: 'DocumentTemplate',
  tableName: 'DocumentTemplates',
  timestamps: true,
  indexes: [
    {
      type: 'FULLTEXT',
      name: 'documenttemplate_search_idx',
      fields: ['templateName', 'description']
    }
  ]
});

module.exports = DocumentTemplate;
