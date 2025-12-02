const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', '여정, 아르카나 선택지 족보.xlsx');
const workbook = XLSX.readFile(filePath);

const sheetName = '여정, 리세트 이벤트'; // Check this sheet too
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log(`--- Scanning ${sheetName} ---`);
data.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
        if (typeof cell === 'string' && (cell.includes('성공') || cell.includes('실패'))) {
            console.log(`Row ${rowIndex} Col ${colIndex}: ${cell}`);
        }
    });
});

const sheetName2 = '아가논, 플로라, 칼라이드, 조우, 날씨 이벤트';
const sheet2 = workbook.Sheets[sheetName2];
const data2 = XLSX.utils.sheet_to_json(sheet2, { header: 1 });

console.log(`\n--- Scanning ${sheetName2} ---`);
data2.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
        if (typeof cell === 'string' && (cell.includes('성공') || cell.includes('실패'))) {
            console.log(`Row ${rowIndex} Col ${colIndex}: ${cell}`);
        }
    });
});
