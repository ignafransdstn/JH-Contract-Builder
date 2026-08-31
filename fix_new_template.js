const AdmZip = require('./backend/node_modules/adm-zip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, 'backend/uploads/099c9c88-2eda-47f6-884f-324c23e3bad9/document-1770523133406-615871034.docx');

console.log('=== AGGRESSIVE TEMPLATE CLEANER ===');
console.log('Loading template:', path.basename(templatePath));

// Create backup
const backupPath = templatePath.replace('.docx', '_BACKUP_NEW.docx');
fs.copyFileSync(templatePath, backupPath);
console.log('Backup created:', path.basename(backupPath));

// Load template
const zip = new AdmZip(templatePath);
let xml = zip.readAsText('word/document.xml');

console.log('\n--- ORIGINAL STATE ---');
console.log('XML length:', xml.length);

// Count placeholders
const originalCount = (xml.match(/\{\{/g) || []).length;
console.log('Opening {{ found:', originalCount);

console.log('\n--- CLEANING PROCESS ---');

// Step 1: Remove spell check markers completely
console.log('\nStep 1: Removing spell check markers...');
const spellBefore = (xml.match(/<w:proofErr/g) || []).length;
xml = xml.replace(/<w:proofErr[^>]*\/>/g, '');
console.log('  Removed', spellBefore, 'spell check markers');

// Step 2: Fix split placeholders - {{
console.log('\nStep 2: Fixing split opening {{...');
let fixCount = 0;
// Pattern: {{</w:t>...any tags...<w:t>rest
for(let i = 0; i < 10; i++) {
  const before = xml.length;
  // Fix: {{</w:t></w:r><w:r...><w:t>word
  xml = xml.replace(/\{\{<\/w:t><\/w:r>(?:<[^>]+>)*<w:r[^>]*>(?:<[^>]+>)*<w:t>(\w+)/g, '{{$1');
  const after = xml.length;
  if(before !== after) fixCount++;
  else break;
}
console.log('  Fixed', fixCount, 'split opening tags');

// Step 3: Fix split placeholders - }}
console.log('\nStep 3: Fixing split closing }}...');
fixCount = 0;
for(let i = 0; i < 10; i++) {
  const before = xml.length;
  // Fix: word</w:t></w:r><w:r...><w:t>}}
  xml = xml.replace(/(\w+)<\/w:t><\/w:r>(?:<[^>]+>)*<w:r[^>]*>(?:<[^>]+>)*<w:t>\}\}/g, '$1}}');
  const after = xml.length;
  if(before !== after) fixCount++;
  else break;
}
console.log('  Fixed', fixCount, 'split closing tags');

// Step 4: Remove empty runs between placeholder parts
console.log('\nStep 4: Removing empty formatting runs...');
const emptyBefore = xml.length;
// Remove: </w:t></w:r><w:r...><w:rPr>...</w:rPr><w:t> between placeholder content
xml = xml.replace(/(\{\{[^}]{0,20})<\/w:t><\/w:r><w:r[^>]*>(?:<w:rPr>[\s\S]*?<\/w:rPr>)?<w:t>([^{}<>]{0,30}})/g, '$1$2');
console.log('  Removed', emptyBefore - xml.length, 'bytes of empty runs');

// Step 5: Merge consecutive text elements
console.log('\nStep 5: Merging consecutive text elements...');
for(let i = 0; i < 5; i++) {
  const before = xml.length;
  xml = xml.replace(/<\/w:t><w:t(?:\s+xml:space="preserve")?>/g, '');
  const after = xml.length;
  if(before === after) break;
}
console.log('  Merged', emptyBefore - xml.length, 'bytes');

// Step 6: Clean up formatting AFTER placeholders
console.log('\nStep 6: Cleaning formatting after placeholders...');
const afterBefore = xml.length;
xml = xml.replace(/}}<\/w:t><\/w:r><w:r[^>]*><w:rPr>[\s\S]*?<\/w:rPr><w:t>/g, '}}</w:t><w:t>');
console.log('  Cleaned', afterBefore - xml.length, 'bytes after placeholders');

// Step 7: Clean up formatting BEFORE placeholders  
console.log('\nStep 7: Cleaning formatting before placeholders...');
const beforeBefore = xml.length;
xml = xml.replace(/<\/w:t><\/w:r><w:r[^>]*><w:rPr>[\s\S]*?<\/w:rPr><w:t>\{\{/g, '</w:t><w:t>{{');
console.log('  Cleaned', beforeBefore - xml.length, 'bytes before placeholders');

console.log('\n--- VERIFICATION ---');
console.log('Final XML length:', xml.length);
console.log('Bytes removed:', originalCount, '-', xml.length, '=', zip.readAsText('word/document.xml').length - xml.length);

// Count placeholders again
const finalCount = (xml.match(/\{\{/g) || []).length;
console.log('Opening {{ count:', originalCount, '→', finalCount);

// Check each placeholder
console.log('\n--- PLACEHOLDER CHECK ---');
const placeholders = [
  'tanggal', 'perusahaan1', 'alamat1', 'nama1', 'posisi1', 'perusahaan1a',
  'perusahaan2', 'alamat2', 'nama2', 'posisi2', 'perusahaan2a',
  'penandatangan1', 'penandatangan2'
];

let cleanCount = 0;
placeholders.forEach((name, idx) => {
  const fullPlaceholder = `{{${name}}}`;
  const isClean = xml.includes(fullPlaceholder);
  
  if(isClean) {
    // Check if it's truly clean (in single <w:t> tag)
    const pattern = new RegExp(`<w:t[^>]*>\\{\\{${name}\\}\\}<\\/w:t>`);
    const trulyClean = pattern.test(xml);
    
    if(trulyClean) {
      console.log(`${idx + 1}. ✅ BERSIH: {{${name}}}`);
      cleanCount++;
    } else {
      console.log(`${idx + 1}. ⚠️  AGAK BERSIH: {{${name}}} (ada tapi belum sempurna)`);
    }
  } else {
    console.log(`${idx + 1}. ❌ MASIH RUSAK: {{${name}}}`);
  }
});

console.log('\n--- SUMMARY ---');
console.log('Clean placeholders:', cleanCount, '/', placeholders.length);
console.log('Success rate:', Math.round(cleanCount / placeholders.length * 100) + '%');

// Save cleaned template
zip.updateFile('word/document.xml', Buffer.from(xml, 'utf8'));
zip.writeZip(templatePath);

console.log('\n✅ Template cleaned and saved!');
console.log('Backup available at:', path.basename(backupPath));
console.log('\n📋 NEXT STEPS:');
console.log('1. Refresh halaman template di browser');
console.log('2. Test generate contract lagi');
console.log('3. Kalau masih error, kita buat template baru dari NOL dengan lebih hati-hati');
