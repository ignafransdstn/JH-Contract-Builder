require('dotenv').config();
const { DocumentTemplate, User } = require('./src/models');
const { Op } = require('sequelize');

async function checkTemplateData() {
  try {
    console.log('\n=== CHECKING TEMPLATE: PKS Tst ===\n');
    
    const template = await DocumentTemplate.findOne({
      where: { templateName: { [Op.iLike]: '%PKS Tst%' } },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'role'] }
      ]
    });

    if (!template) {
      console.log('❌ Template "PKS Tst" not found');
      return;
    }

    console.log('Template ID:', template.id);
    console.log('Template Name:', template.templateName);
    console.log('Status:', template.status);
    console.log('Category:', template.category);
    console.log('\n--- TARGETED USERS ---');
    console.log('targetedUsers field:', JSON.stringify(template.targetedUsers, null, 2));
    console.log('Type:', typeof template.targetedUsers);
    console.log('Is Array:', Array.isArray(template.targetedUsers));
    console.log('Length:', template.targetedUsers ? template.targetedUsers.length : 'null');
    
    if (template.targetedUsers && template.targetedUsers.length > 0) {
      console.log('\n--- TARGETED USERS DETAILS ---');
      for (const userId of template.targetedUsers) {
        const user = await User.findByPk(userId, {
          attributes: ['id', 'name', 'email', 'role']
        });
        if (user) {
          console.log(`  ✓ ${user.name} (${user.email}) - ${user.role}`);
        } else {
          console.log(`  ✗ User ID ${userId} not found`);
        }
      }
    } else {
      console.log('  → PUBLIC TEMPLATE (empty or null targetedUsers)');
    }

    console.log('\n--- CREATOR ---');
    if (template.creator) {
      console.log(`Creator: ${template.creator.name} (${template.creator.email}) - ${template.creator.role}`);
    }

    // Check Ignasius Frans
    console.log('\n=== CHECKING USER: Ignasius Frans ===\n');
    const ignasius = await User.findOne({
      where: { name: { [Op.iLike]: '%Ignasius Frans%' } },
      attributes: ['id', 'name', 'email', 'role']
    });

    if (ignasius) {
      console.log('User ID:', ignasius.id);
      console.log('Name:', ignasius.name);
      console.log('Email:', ignasius.email);
      console.log('Role:', ignasius.role);
      
      const isTargeted = template.targetedUsers && template.targetedUsers.includes(ignasius.id);
      const isAdmin = ignasius.role === 'admin' || ignasius.role === 'supervisor';
      const isPublic = !template.targetedUsers || template.targetedUsers.length === 0;
      
      console.log('\n--- VISIBILITY CHECK ---');
      console.log('Is in targetedUsers?:', isTargeted);
      console.log('Is Admin/Supervisor?:', isAdmin);
      console.log('Is Public template?:', isPublic);
      console.log('Should see template?:', isTargeted || isAdmin || isPublic);
    }

    // Check Nandana Esa
    console.log('\n=== CHECKING USER: Nandana Esa ===\n');
    const nandana = await User.findOne({
      where: { name: { [Op.iLike]: '%Nandana%' } },
      attributes: ['id', 'name', 'email', 'role']
    });

    if (nandana) {
      console.log('User ID:', nandana.id);
      console.log('Name:', nandana.name);
      console.log('Email:', nandana.email);
      console.log('Role:', nandana.role);
      
      const isTargeted = template.targetedUsers && template.targetedUsers.includes(nandana.id);
      const isAdmin = nandana.role === 'admin' || nandana.role === 'supervisor';
      const isPublic = !template.targetedUsers || template.targetedUsers.length === 0;
      
      console.log('\n--- VISIBILITY CHECK ---');
      console.log('Is in targetedUsers?:', isTargeted);
      console.log('Is Admin/Supervisor?:', isAdmin);
      console.log('Is Public template?:', isPublic);
      console.log('Should see template?:', isTargeted || isAdmin || isPublic);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTemplateData();
