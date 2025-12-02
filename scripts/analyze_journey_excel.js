const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', '여정, 아르카나 선택지 족보.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Sheet Names:', workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
    if (sheetName === '아르카나 선택지') return;

    console.log(`\n--- Sheet: ${sheetName} ---`);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Array of arrays

    // Print first 5 rows to understand structure
    data.slice(0, 5).forEach(row => console.log(row));
});
