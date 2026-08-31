const { QueryInterface, DataTypes } = require('sequelize');

/**
 * Migration script to change isActive (boolean) to status (enum)
 * Run this with: node src/migrations/update-status-field.js
 */

const { sequelize } = require('../config/database');

async function migrate() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    console.log('Starting migration: isActive -> status');
    
    // Step 1: Check if status column exists
    const tableDescription = await queryInterface.describeTable('Users');
    
    if (tableDescription.status) {
      console.log('✓ Status column already exists');
    } else {
      console.log('Adding status column...');
      // Step 2: Add new status column with default 'active'
      await queryInterface.addColumn('Users', 'status', {
        type: DataTypes.ENUM('active', 'deactivate'),
        allowNull: false,
        defaultValue: 'active'
      });
      console.log('✓ Status column added');
    }
    
    // Step 3: Migrate data from isActive to status (if isActive exists)
    if (tableDescription.isActive) {
      console.log('Migrating data from isActive to status...');
      await sequelize.query(`
        UPDATE "Users" 
        SET status = CASE 
          WHEN "isActive" = true THEN 'active'::enum_Users_status
          ELSE 'deactivate'::enum_Users_status
        END
      `);
      console.log('✓ Data migrated');
      
      // Step 4: Drop old isActive column
      console.log('Dropping isActive column...');
      await queryInterface.removeColumn('Users', 'isActive');
      console.log('✓ isActive column removed');
    } else {
      console.log('✓ isActive column already removed');
    }
    
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
