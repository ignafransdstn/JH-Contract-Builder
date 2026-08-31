const AdmZip = require('adm-zip');
const path = require('path');

console.log('=== FIXING TEXT STUCK TO PLACEHOLDERS ===\n');

const templatePath = 'uploads/099c9c88-2eda-47f6-884f-324c23e3bad9/document-1770524915462-299962004.docx';

try {
  const zip = new AdmZip(templatePath);
  let xml = zip.readAsText('word/document.xml');
  
  console.log('Original XML length:', xml.length);
  
  // Check current issues
  const issues = [];
  
  // Pattern 1: Text AFTER closing }} - {{placeholder}}word
  const afterMatches = xml.match(/<w:t([^>]*)>(\{\{[a-zA-Z0-9_]+\}\})([a-zA-Z]+)<\/w:t>/g) || [];
  console.log('\n❌ Found', afterMatches.length, 'placeholders with text AFTER:');
  afterMatches.slice(0, 5).forEach(m => console.log('  ', m));
  
  // Pattern 2: Text BEFORE opening {{ - word{{placeholder}}
  const beforeMatches = xml.match(/<w:t([^>]*)>([a-zA-Z]+)(\{\{[a-zA-Z0-9_]+\}\})<\/w:t>/g) || [];
  console.log('\n❌ Found', beforeMatches.length, 'placeholders with text BEFORE:');
  beforeMatches.slice(0, 5).forEach(m => console.log('  ', m));
  
  // Apply fixes
  let fixedCount = 0;
  
  // Fix Pattern 1: Text AFTER closing }}
  xml = xml.replace(/<w:t([^>]*)>(\{\{[a-zA-Z0-9_]+\}\})([a-zA-Z]+)<\/w:t>/g, (match, attrs, placeholder, text) => {
    fixedCount++;
    console.log(`\n✅ Fixed: ${placeholder}${text} → ${placeholder} | ${text}`);
    return `<w:t${attrs}>${placeholder}</w:t></w:r><w:r w:rsidRPr="00972614"><w:t>${text}</w:t>`;
  });
  
  // Fix Pattern 2: Text BEFORE opening {{
  xml = xml.replace(/<w:t([^>]*)>([a-zA-Z]+)(\{\{[a-zA-Z0-9_]+\}\})<\/w:t>/g, (match, attrs, text, placeholder) => {
    fixedCount++;
    console.log(`\n✅ Fixed: ${text}${placeholder} → ${text} | ${placeholder}`);
    return `<w:t${attrs}>${text}</w:t></w:r><w:r w:rsidRPr="00972614"><w:t>${placeholder}</w:t>`;
  });
  
  console.log('\n\n=== VERIFICATION ===');
  console.log('Total fixes applied:', fixedCount);
  console.log('New XML length:', xml.length);
  console.log('Bytes added:', xml.length - 81366);
  
  // Verify all placeholders are now clean
  console.log('\n--- Checking all placeholders ---');
  const placeholders = ['tanggal', 'perusahaan1', 'alamat1', 'nama1', 'posisi1', 'perusahaan1a', 'perusahaan2', 'alamat2', 'nama2', 'posisi2', 'perusahaan2a', 'penandatangan1', 'penandatangan2'];
  let allClean = true;
  
  placeholders.forEach((name, i) => {
    const pattern = new RegExp('<w:t[^>]*>\\{\\{' + name + '\\}\\}<\\/w:t>');
    const isClean = pattern.test(xml);
    console.log((i + 1) + '. ' + (isClean ? '✅ CLEAN' : '❌ BROKEN') + ': {{' + name + '}}');
    if (!isClean) allClean = false;
  });
  
  if (allClean && fixedCount > 0) {
    // Save fixed template
    zip.updateFile('word/document.xml', Buffer.from(xml, 'utf8'));
    zip.writeZip(templatePath);
    console.log('\n🎉 ALL 13 PLACEHOLDERS ARE NOW CLEAN!');
    console.log('✅ Template saved!');
  } else if (allClean) {
    console.log('\n✅ Template was already clean, no changes needed');
  } else {
    console.log('\n❌ Some placeholders still broken - manual inspection needed');
  }
  
} catch (error) {
  console.error('Error:', error.message);
}
