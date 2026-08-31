require('dotenv').config();
const { DocumentTemplate, User } = require('./src/models');
const { Op } = require('sequelize');

async function updateTemplateTargeting() {
  try {
    console.log('\n=== UPDATING TEMPLATE: PKS Tst ===\n');
    
    // Find template
    const template = await DocumentTemplate.findOne({
      where: { templateName: { [Op.iLike]: '%PKS Tst%' } }
    });

    if (!template) {
      console.log('❌ Template "PKS Tst" not found');
      process.exit(1);
    }

    console.log('✓ Found template:', template.templateName);
    console.log('  Current targetedUsers:', JSON.stringify(template.targetedUsers));

    // Find Nandana Esa
    const nandana = await User.findOne({
      where: { name: { [Op.iLike]: '%Nandana%' } },
      attributes: ['id', 'name', 'email', 'role']
    });

    if (!nandana) {
      console.log('❌ User "Nandana Esa" not found');
      process.exit(1);
    }

    console.log('✓ Found user:', nandana.name, `(${nandana.email})`);
    console.log('  User ID:', nandana.id);
    console.log('  Role:', nandana.role);

    // Update template
    template.targetedUsers = [nandana.id];
    await template.save();

    console.log('\n✅ Template updated successfully!');
    console.log('  New targetedUsers:', JSON.stringify(template.targetedUsers));
    console.log('\n--- RESULT ---');
    console.log('Template "PKS Tst" sekarang HANYA akan muncul untuk:');
    console.log(`  ✓ ${nandana.name} (${nandana.role})`);
    console.log('  ✓ Admin & Supervisor (role override)');
    console.log('\nTidak akan muncul untuk:');
    console.log('  ✗ Ignasius Frans (manager)');
    console.log('  ✗ User lain yang bukan admin/supervisor');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateTemplateTargeting();
