const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('jh_contract_builder', 'postgres', 'admin', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false
});

(async () => {
  try {
    // Get contract info
    const [contracts] = await sequelize.query(
      `SELECT id, "contractNumber", "templateId" FROM "Contracts" WHERE id = '1b400dda-3e1a-4489-a50f-a34de8d4fbb9'`
    );
    console.log('\n=== CONTRACT INFO ===');
    console.log('Contract Number:', contracts[0].contractNumber);
    console.log('Template ID:', contracts[0].templateId);

    // Get template info
    const [templates] = await sequelize.query(
      `SELECT id, "templateName", "originalFilePath" FROM "DocumentTemplates" WHERE id = '${contracts[0].templateId}'`
    );
    console.log('\n=== TEMPLATE INFO ===');
    console.log('Template Name:', templates[0].templateName);
    console.log('Template Path:', templates[0].originalFilePath);

    // Check if this is the fixed template (normalize paths)
    const expectedPath = 'uploads/099c9c88-2eda-47f6-884f-324c23e3bad9/document-1770524915462-299962004.docx';
    const actualPath = templates[0].originalFilePath.replace(/\\/g, '/');
    const isFixedTemplate = actualPath === expectedPath;
    console.log('\n=== VERIFICATION ===');
    console.log('Is this the fixed template?', isFixedTemplate);
    
    if (!isFixedTemplate) {
      console.log('\n❌ CONTRACT IS USING WRONG TEMPLATE!');
      console.log('Expected:', expectedPath);
      console.log('Actual:', templates[0].originalFilePath);
    } else {
      console.log('\n✅ Contract is using the correct (fixed) template');
      
      // Verify the template file content
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(templates[0].originalFilePath);
      const xml = zip.readAsText('word/document.xml');
      
      const hasStuckText = xml.includes('{{tanggal}}telah') || 
                          xml.includes('{{perusahaan1a}}atau') || 
                          xml.includes('{{perusahaan2a}}atau');
      
      console.log('\n=== TEMPLATE FILE CHECK ===');
      console.log('XML Length:', xml.length);
      console.log('Has stuck text?', hasStuckText);
      
      if (hasStuckText) {
        console.log('\n❌ TEMPLATE FILE STILL HAS STUCK TEXT!');
      } else {
        console.log('\n✅ Template file is clean (no stuck text)');
        console.log('\n⚠️ BUT GENERATION STILL FAILS - THIS IS STRANGE!');
        console.log('This suggests the backend might be caching the template or reading from wrong location.');
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
})();
