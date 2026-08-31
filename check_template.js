const AdmZip = require('./backend/node_modules/adm-zip');

const zip = new AdmZip('C:\\Users\\ignaf\\JIMBARAN HIJAU\\Development\\JH Contract Builder\\backend\\uploads\\099c9c88-2eda-47f6-884f-324c23e3bad9\\document-1770344478587-858774903.docx');
const xml = zip.readAsText('word/document.xml');

console.log('\n=== ANALYZING ALL 13 PLACEHOLDERS ===\n');

let idx = 0;
let count = 0;

while((idx = xml.indexOf('{{', idx)) > -1) {
  const end = xml.indexOf('}}', idx);
  if(end > idx) {
    count++;
    const sample = xml.substring(idx, end + 50);
    const isBroken = sample.includes('</w:t>') || sample.includes('</w:r>');
    const status = isBroken ? 'RUSAK' : 'BERSIH';
    
    console.log(`${count}. ${status}: ${sample.substring(0, 40)}...`);
  }
  idx++;
}

console.log(`\nTotal: ${count} placeholders`);
