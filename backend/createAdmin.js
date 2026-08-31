const { sequelize } = require('./src/config/database');
const { User } = require('./src/models');

async function createAdmin() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email: 'adminjimbaranhijau@jhilltown.com' }
    });

    if (existingUser) {
      console.log('⚠️ User already exists!');
      console.log('User ID:', existingUser.id);
      console.log('Email:', existingUser.email);
      console.log('Role:', existingUser.role);
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      email: 'adminjimbaranhijau@jhilltown.com',
      password: 'Jimbaranadmin@2026', // Will be hashed by beforeCreate hook
      name: 'Admin Jimbaran Hijau',
      role: 'admin',
      department: 'IT',
      position: 'System Administrator',
      status: 'active'
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('User ID:', admin.id);
    console.log('Email:', admin.email);
    console.log('Name:', admin.name);
    console.log('Role:', admin.role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔐 Login Credentials:');
    console.log('Email:', 'adminjimbaranhijau@jhilltown.com');
    console.log('Password:', 'Jimbaranadmin@2026');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createAdmin();
