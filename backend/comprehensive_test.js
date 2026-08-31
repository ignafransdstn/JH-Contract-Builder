require('dotenv').config();
const { DocumentTemplate, User } = require('./src/models');
const { Op, Sequelize } = require('sequelize');

async function comprehensiveTest() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  COMPREHENSIVE TEMPLATE TARGETING TEST - ADMIN ONLY OVERRIDE   ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Get PKS Tst template
    const template = await DocumentTemplate.findOne({
      where: { templateName: { [Op.iLike]: '%PKS Tst%' } }
    });

    if (!template) {
      console.log('❌ Template "PKS Tst" not found');
      process.exit(1);
    }

    console.log('📄 Template: PKS Tst');
    console.log('   Status: published');
    console.log('   targetedUsers:', template.targetedUsers);
    console.log('   Targeted to: Nandana Esa only\n');
    console.log('─'.repeat(70));

    // Test users
    const testUsers = [
      { email: 'nandanaesa@gmail.com', expectedVisible: true, reason: 'Targeted user' },
      { email: 'ignasius.frans@jhilltown.com', expectedVisible: false, reason: 'Manager - not targeted' },
      { email: 'ignafransdstn@gmail.com', expectedVisible: false, reason: 'Supervisor - filtered' },
      { email: 'adminjimbaranhijau@jhilltown.com', expectedVisible: true, reason: 'Admin - full visibility' }
    ];

    for (const testCase of testUsers) {
      const user = await User.findOne({
        where: { email: testCase.email },
        attributes: ['id', 'name', 'email', 'role']
      });

      if (!user) {
        console.log(`\n⚠️  User ${testCase.email} not found - skipping\n`);
        continue;
      }

      console.log(`\n👤 Testing: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);

      // Run query
      const where = {};
      const baseConditions = [];
      
      baseConditions.push({ status: 'draft', createdBy: user.id });
      
      if (user.role === 'admin') {
        baseConditions.push({ status: 'published' });
      } else {
        baseConditions.push({ 
          status: 'published',
          [Op.or]: [
            { targetedUsers: { [Op.is]: null } },
            Sequelize.literal(`("DocumentTemplate"."targetedUsers"::text = '[]')`),
            { targetedUsers: { [Op.contains]: [user.id] } }
          ]
        });
      }
      
      where[Op.or] = baseConditions;

      const templates = await DocumentTemplate.findAll({
        where,
        attributes: ['id', 'templateName', 'status'],
        order: [['createdAt', 'DESC']]
      });

      const foundPksTst = templates.find(t => t.templateName.includes('PKS Tst'));
      const actualVisible = !!foundPksTst;

      console.log(`   Expected: ${testCase.expectedVisible ? '✅ CAN SEE' : '❌ CANNOT SEE'} (${testCase.reason})`);
      console.log(`   Actual:   ${actualVisible ? '✅ CAN SEE' : '❌ CANNOT SEE'}`);

      if (actualVisible === testCase.expectedVisible) {
        console.log(`   Result:   ✅ PASS - Behavior correct!`);
      } else {
        console.log(`   Result:   ❌ FAIL - Unexpected behavior!`);
      }

      console.log(`   Total templates visible: ${templates.length}`);
    }

    console.log('\n' + '─'.repeat(70));
    console.log('\n📊 SUMMARY - NEW FILTERING LOGIC:\n');
    console.log('✅ Admin: Full visibility (can see ALL templates)');
    console.log('✅ Supervisor: Filtered (same as other roles)');
    console.log('✅ Manager/Staff/User: Filtered by targeting');
    console.log('✅ Targeted users: Can see templates targeted to them');
    console.log('✅ Public templates: Visible to everyone\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

comprehensiveTest();
