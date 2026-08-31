const AdmZip = require('./backend/node_modules/adm-zip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, 'backend/uploads/099c9c88-2eda-47f6-884f-324c23e3bad9/document-1770523133406-615871034.docx');

console.log('=== FINAL FIX FOR {{penandatangan2}} ===');

const zip = new AdmZip(templatePath);
let xml = zip.readAsText('word/document.xml');

console.log('Original XML length:', xml.length);

// Find the broken pattern
const broken = xml.match(/<w:t>\{<\/w:t><\/w:r><w:r[^>]*><w:t>\{penandatangan2\}\}<\/w:t>/);
if(broken) {
  console.log('Found broken pattern for {{penandatangan2}}');
  console.log('Pattern:', broken[0].substring(0, 100) + '...');
}

// Fix: <w:t>{</w:t></w:r><w:r...><w:t>{penandatangan2}}</w:t>
// To:  <w:t>{{penandatangan2}}</w:t>
xml = xml.replace(/<w:t>\{<\/w:t><\/w:r><w:r[^>]*>(?:<[^>]+>)*<w:t>\{penandatangan2\}\}<\/w:t>/g, '<w:t>{{penandatangan2}}</w:t>');

// Also fix any other single { before {placeholder}}
xml = xml.replace(/<w:t>\{<\/w:t><\/w:r><w:r[^>]*>(?:<[^>]+>)*<w:t>(\{[a-zA-Z0-9]+\}\})<\/w:t>/g, '<w:t>{$1</w:t>');

console.log('Fixed XML length:', xml.length);

// Verify
const isFixed = xml.includes('{{penandatangan2}}');
console.log('\nVerification:');
console.log('{{penandatangan2}} found in XML:', isFixed);

if(isFixed) {
  // Check if it's in single tag
  const inSingleTag = /<w:t[^>]*>\{\{penandatangan2\}\}<\/w:t>/.test(xml);
  console.log('In single <w:t> tag:', inSingleTag);
  
  if(inSingleTag) {
    console.log('✅ SUCCESS! {{penandatangan2}} is now CLEAN!');
  } else {
    console.log('⚠️ Found but not in single tag');
  }
}

// Final check all placeholders
console.log('\n--- FINAL PLACEHOLDER CHECK ---');
const placeholders = [
  'tanggal', 'perusahaan1', 'alamat1', 'nama1', 'posisi1', 'perusahaan1a',
  'perusahaan2', 'alamat2', 'nama2', 'posisi2', 'perusahaan2a',
  'penandatangan1', 'penandatangan2'
];

let allClean = true;
placeholders.forEach((name, idx) => {
  const pattern = new RegExp(`<w:t[^>]*>\\{\\{${name}\\}\\}<\\/w:t>`);
  const isClean = pattern.test(xml);
  console.log(`${idx + 1}. ${isClean ? '✅' : '❌'} {{${name}}}`);
  if(!isClean) allClean = false;
});

if(allClean) {
  console.log('\n🎉 ALL 13 PLACEHOLDERS ARE CLEAN!');
  
  // Save
  zip.updateFile('word/document.xml', Buffer.from(xml, 'utf8'));
  zip.writeZip(templatePath);
  console.log('✅ Template saved!');
  
  console.log('\n📋 NEXT: Silakan test generate contract sekarang!');
} else {
  console.log('\n⚠️ Some placeholders still broken. Manual fix needed.');
}
