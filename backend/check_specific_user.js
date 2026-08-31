require('dotenv').config();
const { DocumentTemplate, User } = require('./src/models');
const { Op, Sequelize } = require('sequelize');

async function checkSpecificUser() {
  try {
    console.log('\n=== CHECKING USER: ignafransdstn@gmail.com ===\n');
    
    const user = await User.findOne({
      where: { email: 'ignafransdstn@gmail.com' },
      attributes: ['id', 'name', 'email', 'role']
    });

    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('User Details:');
    console.log('  ID:', user.id);
    console.log('  Name:', user.name);
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);

    // Check PKS Tst template
    console.log('\n=== CHECKING TEMPLATE: PKS Tst ===\n');
    
    const template = await DocumentTemplate.findOne({
      where: { templateName: { [Op.iLike]: '%PKS Tst%' } }
    });

    if (!template) {
      console.log('❌ Template not found');
      process.exit(1);
    }

    console.log('Template Details:');
    console.log('  ID:', template.id);
    console.log('  Name:', template.templateName);
    console.log('  Status:', template.status);
    console.log('  targetedUsers:', JSON.stringify(template.targetedUsers, null, 2));

    // Visibility check
    console.log('\n=== VISIBILITY CHECK ===\n');
    
    const isAdmin = user.role === 'admin'; // UPDATED: Only admin has override
    const isInTargetList = template.targetedUsers && template.targetedUsers.includes(user.id);
    const isPublic = !template.targetedUsers || template.targetedUsers.length === 0;
    
    console.log('Is Admin? (only admin has full visibility):', isAdmin);
    console.log('Is in targetedUsers list?:', isInTargetList);
    console.log('Is public template?:', isPublic);
    console.log('\n--- CONCLUSION ---');
    
    if (isAdmin) {
      console.log('✅ Should see template: YES (Admin full visibility override)');
    } else if (isInTargetList) {
      console.log('✅ Should see template: YES (Targeted to this user)');
    } else if (isPublic) {
      console.log('✅ Should see template: YES (Public template)');
    } else {
      console.log('❌ Should see template: NO (Not authorized)');
    }

    // Run actual query to see what backend returns
    console.log('\n=== RUNNING ACTUAL BACKEND QUERY ===\n');
    
    const where = {};
    const baseConditions = [];
    
    // User's own drafts
    baseConditions.push({ status: 'draft', createdBy: user.id });
    
    // Published templates - UPDATED: Only admin gets override
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
      attributes: ['id', 'templateName', 'status', 'targetedUsers'],
      order: [['createdAt', 'DESC']]
    });

    console.log(`Query returned ${templates.length} templates:\n`);
    
    templates.forEach((t, idx) => {
      const isPksTst = t.templateName.includes('PKS Tst');
      const icon = isPksTst ? '🚨' : '  ';
      console.log(`${icon} ${idx + 1}. ${t.templateName} (${t.status})`);
      if (t.targetedUsers && t.targetedUsers.length > 0) {
        console.log(`     Targeted to: ${t.targetedUsers.length} user(s)`);
      } else {
        console.log(`     Public template`);
      }
    });

    const foundPksTst = templates.find(t => t.templateName.includes('PKS Tst'));
    if (foundPksTst) {
      console.log('\n❌ PROBLEM CONFIRMED!');
      console.log('Template "PKS Tst" is in query results for this user');
      console.log('This should NOT happen!');
    } else {
      console.log('\n✅ CORRECT!');
      console.log('Template "PKS Tst" is NOT in query results');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

checkSpecificUser();
