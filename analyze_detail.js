const AdmZip = require('./backend/node_modules/adm-zip');

const zip = new AdmZip('C:\\Users\\ignaf\\JIMBARAN HIJAU\\Development\\JH Contract Builder\\backend\\uploads\\099c9c88-2eda-47f6-884f-324c23e3bad9\\document-1770344478587-858774903.docx');
const xml = zip.readAsText('word/document.xml');

console.log('\n=== DETAILED ANALYSIS OF PLACEHOLDER #1 (tanggal) ===\n');

const idx1 = xml.indexOf('{{tanggal}}');
if (idx1 > -1) {
  console.log('Sample 200 chars:');
  console.log(xml.substring(idx1, idx1 + 200));
  console.log('\n');
}

console.log('=== DETAILED ANALYSIS OF PLACEHOLDER #4 (nama1) ===\n');

let count = 0;
let idx = 0;
while((idx = xml.indexOf('{{', idx)) > -1) {
  const end = xml.indexOf('}}', idx);
  if(end > idx) {
    count++;
    if (count === 4) {
      console.log('Sample 300 chars:');
      console.log(xml.substring(idx, idx + 300));
      break;
    }
  }
  idx++;
}
