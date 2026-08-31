require('dotenv').config();
const { DocumentTemplate, User } = require('./src/models');
const { Op, Sequelize } = require('sequelize');

async function testFiltering() {
  try {
    console.log('\n=== TESTING TEMPLATE FILTERING ===\n');

    // Get Ignasius Frans
    const ignasius = await User.findOne({
      where: { name: { [Op.iLike]: '%Ignasius Frans%' } },
      attributes: ['id', 'name', 'email', 'role']
    });

    if (!ignasius) {
      console.log('❌ User Ignasius Frans not found');
      process.exit(1);
    }

    console.log('Testing for user:', ignasius.name);
    console.log('User ID:', ignasius.id);
    console.log('Role:', ignasius.role);
    console.log('\n--- BUILDING QUERY ---\n');

    const where = {};
    const baseConditions = [];
    
    // User's own drafts
    baseConditions.push({ status: 'draft', createdBy: ignasius.id });
    console.log('Condition 1: Own drafts');
    console.log('  { status: "draft", createdBy:', ignasius.id, '}');
    
    // Published templates filtering
    if (ignasius.role === 'admin' || ignasius.role === 'supervisor') {
      console.log('\nCondition 2: Admin/Supervisor - see ALL published');
      baseConditions.push({ status: 'published' });
    } else {
      console.log('\nCondition 2: Regular user - filtered published templates');
      console.log('  Can see:');
      console.log('    a) targetedUsers IS NULL');
      console.log('    b) targetedUsers = [] (empty array)');
      console.log('    c) targetedUsers CONTAINS user ID:', ignasius.id);
      
      const publishedCondition = { 
        status: 'published',
        [Op.or]: [
          { targetedUsers: { [Op.is]: null } },
          Sequelize.literal(`("DocumentTemplate"."targetedUsers"::text = '[]')`),
          { targetedUsers: { [Op.contains]: [ignasius.id] } }
        ]
      };
      baseConditions.push(publishedCondition);
    }
    
    where[Op.or] = baseConditions;

    console.log('\n--- EXECUTING QUERY ---\n');
    
    const templates = await DocumentTemplate.findAll({
      where,
      attributes: ['id', 'templateName', 'status', 'targetedUsers', 'createdBy'],
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'role'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    console.log(`Found ${templates.length} templates:\n`);
    
    templates.forEach((t, index) => {
      const targetInfo = !t.targetedUsers || t.targetedUsers.length === 0
        ? '🌍 PUBLIC'
        : `🎯 TARGETED to ${t.targetedUsers.length} user(s)`;
      
      const visibility = () => {
        // Draft - only creator
        if (t.status === 'draft') {
          return t.createdBy === ignasius.id ? '✅ VISIBLE (own draft)' : '❌ HIDDEN (not creator)';
        }
        
        // Published
        if (ignasius.role === 'admin' || ignasius.role === 'supervisor') {
          return '✅ VISIBLE (admin/supervisor override)';
        }
        
        // Public
        if (!t.targetedUsers || t.targetedUsers.length === 0) {
          return '✅ VISIBLE (public template)';
        }
        
        // Targeted
        if (t.targetedUsers.includes(ignasius.id)) {
          return '✅ VISIBLE (targeted to this user)';
        }
        
        return '❌ SHOULD BE HIDDEN (not targeted to this user)';
      };
      
      console.log(`${index + 1}. "${t.templateName}"`);
      console.log(`   Status: ${t.status}`);
      console.log(`   Creator: ${t.creator?.name} (${t.creator?.role})`);
      console.log(`   Targeting: ${targetInfo}`);
      if (t.targetedUsers && t.targetedUsers.length > 0) {
        console.log(`   Target IDs: ${t.targetedUsers.join(', ')}`);
      }
      console.log(`   ${visibility()}`);
      console.log('');
    });

    // Specific check for PKS Tst
    console.log('\n=== SPECIFIC CHECK: PKS Tst ===\n');
    const pksTst = templates.find(t => t.templateName.includes('PKS Tst'));
    if (pksTst) {
      console.log('❌ PROBLEM FOUND!');
      console.log('Template "PKS Tst" is in the results, but should NOT be visible!');
      console.log('');
      console.log('Template details:');
      console.log('  targetedUsers:', JSON.stringify(pksTst.targetedUsers));
      console.log('  Current user ID:', ignasius.id);
      console.log('  Is user in targetedUsers?', pksTst.targetedUsers?.includes(ignasius.id));
      console.log('');
      console.log('This means the Sequelize query is NOT filtering correctly!');
    } else {
      console.log('✅ CORRECT! Template "PKS Tst" is NOT in results (properly filtered)');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testFiltering();
