const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../구원자DB.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Sheet Names:', workbook.SheetNames);

if (workbook.SheetNames.includes('플레이버 텍스트')) {
    const sheet = workbook.Sheets['플레이버 텍스트'];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log('Flavor Text Data Sample:', data.slice(0, 3));
} else {
    console.log('Sheet "플레이버 텍스트" not found.');
}
