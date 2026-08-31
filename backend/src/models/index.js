const { sequelize } = require('../config/database');
const User = require('./User');
const DocumentTemplate = require('./DocumentTemplate');
const Contract = require('./Contract');

// Define relationships
// User relationships
User.hasMany(DocumentTemplate, { foreignKey: 'createdBy', as: 'createdTemplates' });
User.hasMany(DocumentTemplate, { foreignKey: 'updatedBy', as: 'updatedTemplates' });
User.hasMany(Contract, { foreignKey: 'submittedById', as: 'submittedContracts' });
User.hasMany(Contract, { foreignKey: 'reviewerId', as: 'reviewedContracts' });
User.hasMany(Contract, { foreignKey: 'approver1Id', as: 'approved1Contracts' });
User.hasMany(Contract, { foreignKey: 'approver2Id', as: 'approved2Contracts' });
User.hasMany(Contract, { foreignKey: 'rejectedById', as: 'rejectedContracts' });

// DocumentTemplate relationships
DocumentTemplate.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
DocumentTemplate.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });
DocumentTemplate.hasMany(Contract, { foreignKey: 'templateId', as: 'contracts' });

// Contract relationships
Contract.belongsTo(DocumentTemplate, { foreignKey: 'templateId', as: 'template' });
Contract.belongsTo(User, { foreignKey: 'submittedById', as: 'submittedBy' });
Contract.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });
Contract.belongsTo(User, { foreignKey: 'approver1Id', as: 'approver1' });
Contract.belongsTo(User, { foreignKey: 'approver2Id', as: 'approver2' });
Contract.belongsTo(User, { foreignKey: 'rejectedById', as: 'rejectedBy' });

// Sync database
const syncDatabase = async (options = {}) => {
  try {
    await sequelize.sync(options);
    console.log('✓ Database synchronized successfully');
  } catch (error) {
    console.error('✗ Database sync error:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  DocumentTemplate,
  Contract,
  syncDatabase
};
