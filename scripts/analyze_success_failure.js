const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', '여정, 아르카나 선택지 족보.xlsx');
const workbook = XLSX.readFile(filePath);

const sheetName = '아가논, 플로라, 칼라이드, 조우, 날씨 이벤트';
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log(`--- Scanning ${sheetName} for Success/Failure in Choice Column ---`);

data.forEach((row, rowIndex) => {
    const choice = row[2]; // Col 2 is Choice
    if (typeof choice === 'string') {
        if (choice.includes('성공') || choice.includes('실패')) {
            console.log(`Row ${rowIndex}: ${choice}`);
            console.log(`  Result (Col 3): ${row[3]}`);
        }
    }
});
