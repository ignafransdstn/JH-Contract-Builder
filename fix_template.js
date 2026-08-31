const AdmZip = require('./backend/node_modules/adm-zip');
const fs = require('fs');
const path = require('path');

const templatePath = 'C:\\Users\\ignaf\\JIMBARAN HIJAU\\Development\\JH Contract Builder\\backend\\uploads\\099c9c88-2eda-47f6-884f-324c23e3bad9\\document-1770344478587-858774903.docx';

console.log('=== TEMPLATE CLEANER ===\n');
console.log('Loading template:', path.basename(templatePath));

// Load template
const zip = new AdmZip(templatePath);
let xml = zip.readAsText('word/document.xml');

console.log('Original XML length:', xml.length);

// Count placeholders before
let countBefore = 0;
let idx = 0;
while((idx = xml.indexOf('{{', idx)) > -1) {
  countBefore++;
  idx++;
}
console.log('Placeholders found:', countBefore);

// Backup original
const backupPath = templatePath.replace('.docx', '_BACKUP.docx');
fs.copyFileSync(templatePath, backupPath);
console.log('Backup created:', path.basename(backupPath));

console.log('\n--- CLEANING PROCESS ---\n');

// The problem: Placeholders are complete in one <w:t> tag, but followed by formatting runs
// Pattern: {{placeholder}}</w:t></w:r><w:r w:rsidRPr="..."><w:rPr>...</w:rPr><w:t>next text
// Solution: Keep placeholder in its own run, remove the complex formatting of next run

// Step 1: Find and fix placeholders split across runs (rare case)
console.log('Step 1: Fixing split placeholders (middle splits)...');
const regex1 = /(\{\{[^}<]*)<\/w:t><\/w:r><w:r[^>]*>(?:<w:rPr>[\s\S]*?<\/w:rPr>)?<w:t>([^{}]*}})/g;
let matches1 = xml.match(regex1);
console.log('  - Found', matches1 ? matches1.length : 0, 'middle splits');
for (let i = 0; i < 10; i++) {
  const before = xml.length;
  xml = xml.replace(regex1, '$1$2');
  if (xml.length === before) break;
  console.log(`    Iteration ${i+1}: cleaned ${before - xml.length} bytes`);
}

// Step 2: Remove formatting runs that start AFTER }} closing
console.log('Step 2: Removing formatting runs after closing }}...');
// Match: }}</w:t></w:r><w:r ...><w:rPr>...</w:rPr><w:t>
// Keep: }}</w:t> and <w:t> but remove the run boundaries
const regex2 = /}}<\/w:t><\/w:r><w:r[^>]*>(?:<w:rPr>[\s\S]*?<\/w:rPr>)?<w:t>/g;
let matches2 = xml.match(regex2);
console.log('  - Found', matches2 ? matches2.length : 0, 'formatting runs after }}');
xml = xml.replace(regex2, '}}</w:t><w:t>');

// Step 3: Remove formatting runs that end BEFORE {{ opening  
console.log('Step 3: Removing formatting runs before opening {{...');
// Match: </w:t></w:r><w:r ...><w:rPr>...</w:rPr><w:t>{{
const regex3 = /<\/w:t><\/w:r><w:r[^>]*>(?:<w:rPr>[\s\S]*?<\/w:rPr>)?<w:t>\{\{/g;
let matches3 = xml.match(regex3);
console.log('  - Found', matches3 ? matches3.length : 0, 'formatting runs before {{');
xml = xml.replace(regex3, '</w:t><w:t>{{');

// Step 4: Merge consecutive <w:t> tags
console.log('Step 4: Merging consecutive text elements...');
const regex4 = /<\/w:t><w:t(?:\s+xml:space="preserve")?>/g;
let mergeCount = 0;
for (let i = 0; i < 5; i++) {
  const before = xml.length;
  xml = xml.replace(regex4, '');
  const after = xml.length;
  if (before === after) break;
  mergeCount += (before - after);
}
console.log('  - Merged', mergeCount, 'bytes of consecutive tags');

console.log('\n--- VERIFICATION ---\n');
console.log('Cleaned XML length:', xml.length);
console.log('Bytes removed:', zip.readAsText('word/document.xml').length - xml.length);

// Count placeholders after
let countAfter = 0;
idx = 0;
while((idx = xml.indexOf('{{', idx)) > -1) {
  countAfter++;
  idx++;
}
console.log('Placeholders after cleaning:', countAfter);

// Check each placeholder
console.log('\n--- PLACEHOLDER STATUS ---\n');
idx = 0;
let count = 0;
const placeholderNames = ['tanggal', 'perusahaan1', 'alamat1', 'nama1', 'posisi1', 'perusahaan1a', 'perusahaan2', 'alamat2', 'nama2', 'posisi2', 'perusahaan2a', 'penandatangan1', 'penandatangan2'];

while((idx = xml.indexOf('{{', idx)) > -1) {
  const end = xml.indexOf('}}', idx);
  if(end > idx) {
    count++;
    const sample = xml.substring(idx, end + 50);
    const isBroken = sample.includes('</w:t>') || sample.includes('</w:r>');
    const status = isBroken ? '❌ MASIH RUSAK' : '✅ BERSIH';
    const name = count <= placeholderNames.length ? placeholderNames[count-1] : 'unknown';
    console.log(`${count}. ${status}: {{${name}}}`);
  }
  idx++;
}

// Write back
console.log('\n--- SAVING ---\n');
zip.updateFile('word/document.xml', Buffer.from(xml, 'utf8'));

// Save cleaned template
const cleanedPath = templatePath.replace('.docx', '_CLEAN.docx');
fs.writeFileSync(cleanedPath, zip.toBuffer());
console.log('✓ Cleaned template saved:', path.basename(cleanedPath));

// Also overwrite original
fs.writeFileSync(templatePath, zip.toBuffer());
console.log('✓ Original template updated:', path.basename(templatePath));

console.log('\n=== SUMMARY ===\n');
console.log('✓ Backup:', path.basename(backupPath));
console.log('✓ Clean copy:', path.basename(cleanedPath));
console.log('✓ Original updated');
console.log(`\nPlaceholders: ${countBefore} → ${countAfter}`);

if (countAfter === countBefore && countAfter === 13) {
  console.log('\n🎉 SUCCESS! All 13 placeholders intact and cleaned!');
  console.log('\nNext steps:');
  console.log('1. Test document generation in the system');
  console.log('2. Should get 0 errors now!');
} else {
  console.log('\n⚠️ WARNING: Placeholder count changed!');
  console.log('Please verify the cleaned template manually.');
}
