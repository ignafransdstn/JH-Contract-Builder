const AdmZip = require('./backend/node_modules/adm-zip');

const templatePath = 'C:\\Users\\ignaf\\JIMBARAN HIJAU\\Development\\JH Contract Builder\\backend\\uploads\\099c9c88-2eda-47f6-884f-324c23e3bad9\\document-1770344478587-858774903_BACKUP.docx';

const zip = new AdmZip(templatePath);
const xml = zip.readAsText('word/document.xml');

console.log('\n=== DETAILED PLACEHOLDER ANALYSIS ===\n');

// Find first 3 placeholders and show their full structure
let idx = 0;
let count = 0;

while((idx = xml.indexOf('{{', idx)) > -1) {
  const end = xml.indexOf('}}', idx);
  if(end > idx) {
    count++;
    if (count <= 3) {
      console.log(`\n--- Placeholder #${count} ---`);
      const sample = xml.substring(idx, idx + 400);
      console.log(sample);
      console.log('');
    }
  }
  idx++;
}
