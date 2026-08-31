const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
require('dotenv').config();

// Database connection
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'jh_contract_builder',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  logging: false
});

async function createAdmin() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✓ Database connected');

    // Admin data
    const email = 'adminjimbaranhijau@jhilltown.com';
    const password = 'Jimbaranadmin@2026';
    const firstName = 'Admin';
    const lastName = 'Jimbaran Hijau';
    const role = 'admin';

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('✓ Password hashed');

    // Check if user already exists
    const [existingUser] = await sequelize.query(
      'SELECT id FROM "Users" WHERE email = :email',
      {
        replacements: { email },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (existingUser) {
      console.log('✗ User already exists with this email!');
      console.log('  Updating password...');
      
      await sequelize.query(
        'UPDATE "Users" SET password = :password, "updatedAt" = NOW() WHERE email = :email',
        {
          replacements: { password: hashedPassword, email }
        }
      );
      
      console.log('✓ Password updated successfully!');
    } else {
      // Insert new user
      const id = uuidv4();
      
      await sequelize.query(
        `INSERT INTO "Users" (id, email, password, "firstName", "lastName", role, "isActive", "createdAt", "updatedAt")
         VALUES (:id, :email, :password, :firstName, :lastName, :role, true, NOW(), NOW())`,
        {
          replacements: {
            id,
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role
          }
        }
      );
      
      console.log('✓ Admin user created successfully!');
    }

    console.log('\n=================================');
    console.log('Admin Account Details:');
    console.log('=================================');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role:', role);
    console.log('=================================\n');

    // Verify user
    const [user] = await sequelize.query(
      'SELECT id, email, "firstName", "lastName", role, "isActive" FROM "Users" WHERE email = :email',
      {
        replacements: { email },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    console.log('✓ Verification:', user);

  } catch (error) {
    console.error('✗ Error:', error.message);
  } finally {
    await sequelize.close();
    console.log('\n✓ Database connection closed');
  }
}

// Run the script
createAdmin();
