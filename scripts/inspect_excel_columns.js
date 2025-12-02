const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', '여정, 아르카나 선택지 족보.xlsx');
const workbook = XLSX.readFile(filePath);

const sheetName = '아가논, 플로라, 칼라이드, 조우, 날씨 이벤트';
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log(`--- Sheet: ${sheetName} ---`);
// Print first 10 rows, showing all columns and their indices
data.slice(0, 10).forEach((row, rowIndex) => {
    console.log(`Row ${rowIndex}:`);
    row.forEach((cell, colIndex) => {
        console.log(`  Col ${colIndex}: ${cell}`);
    });
});
