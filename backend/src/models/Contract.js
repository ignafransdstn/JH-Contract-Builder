const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Contract extends Model {
  // Method to generate contract number
  static async generateContractNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const prefix = `JH-${year}${month}`;
    
    // Find the highest contract number for this month
    const { Op } = require('sequelize');
    
    const latestContract = await this.findOne({
      where: {
        contractNumber: {
          [Op.like]: `${prefix}-%`
        }
      },
      order: [['contractNumber', 'DESC']],
      attributes: ['contractNumber']
    });
    
    let nextNumber = 1;
    
    if (latestContract && latestContract.contractNumber) {
      // Extract the sequential number from the contract number
      // Format: JH-YYYYMM-XXXX
      const parts = latestContract.contractNumber.split('-');
      if (parts.length === 3) {
        const currentNumber = parseInt(parts[2], 10);
        if (!isNaN(currentNumber)) {
          nextNumber = currentNumber + 1;
        }
      }
    }
    
    return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
  }
}

Contract.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  contractNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  templateId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'DocumentTemplates',
      key: 'id'
    },
    field: 'templateId'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  contractData: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of contract data objects with fieldName, fieldLabel, value'
  },
  status: {
    type: DataTypes.ENUM(
      'draft',
      'pending_review',
      'reviewed',
      'pending_approval1',
      'approved1',
      'pending_approval2',
      'approved2',
      'completed',
      'rejected'
    ),
    defaultValue: 'draft'
  },
  currentApprovalLayer: {
    type: DataTypes.ENUM('reviewer', 'approval1', 'approval2', 'completed'),
    defaultValue: 'reviewer'
  },
  approvalHistory: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of approval history with layer, approver, action, comments, signature, actionDate'
  },
  reviewerId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    field: 'reviewerId'
  },
  approver1Id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    field: 'approver1Id'
  },
  approver2Id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    field: 'approver2Id'
  },
  submittedById: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    field: 'submittedById'
  },
  submittedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejectedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejectedById: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    field: 'rejectedById'
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  attachments: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of attachments with fileName, filePath, fileType, uploadedAt, uploadedBy'
  },
  generatedDocument: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Generated document info with filePath, generatedAt'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Contract',
  tableName: 'Contracts',
  timestamps: true,
  indexes: [
    { fields: ['contractNumber'], unique: true },
    { fields: ['status'] },
    { fields: ['submittedById'] },
    { fields: ['createdAt'] }
  ],
  hooks: {
    beforeCreate: async (contract) => {
      if (!contract.contractNumber) {
        contract.contractNumber = await Contract.generateContractNumber();
      }
    }
  }
});

module.exports = Contract;
