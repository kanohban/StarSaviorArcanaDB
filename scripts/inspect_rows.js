const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', '여정, 아르카나 선택지 족보.xlsx');
const workbook = XLSX.readFile(filePath);

const sheetName = '여정, 리세트 이벤트';
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log(`--- Inspecting Rows 10-20 of ${sheetName} ---`);
data.slice(10, 20).forEach((row, idx) => {
    console.log(`Row ${10 + idx}:`);
    console.log(`  Col 2 (Choice): ${row[2]}`);
    console.log(`  Col 3 (Result): ${row[3]}`);
});
