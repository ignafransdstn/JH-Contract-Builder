const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('jh_contract_builder', 'postgres', 'admin', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false
});

(async () => {
  try {
    const [users] = await sequelize.query(
      `SELECT id, name, email, role FROM "Users" WHERE name LIKE '%Nandana%'`
    );
    console.log('\n=== NANDANA ESA ROLE DEBUG ===');
    const user = users[0];
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Role (raw):', JSON.stringify(user.role));
    console.log('Role === "user":', user.role === 'user');
    console.log('Roles array includes:', ['user', 'staff', 'supervisor', 'admin'].includes(user.role));
    
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
    await sequelize.close();
  }
})();
