const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', '여정, 아르카나 선택지 족보.xlsx');
const workbook = XLSX.readFile(filePath);

const sheetName = '여정, 리세트 이벤트';
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('--- Inspecting "구원단 보급" ---');
// Find row with "구원단 보급"
let startRow = -1;
for (let i = 0; i < data.length; i++) {
    if (data[i][1] === '구원단 보급') {
        startRow = i;
        break;
    }
}

if (startRow !== -1) {
    for (let i = startRow; i < startRow + 5; i++) {
        console.log(`Row ${i}: [0]="${data[i][0]}", [1]="${data[i][1]}", [2]="${data[i][2]}"`);
    }
}

console.log('\n--- Inspecting "리세트의 휴가" ---');
startRow = -1;
for (let i = 0; i < data.length; i++) {
    if (data[i][1] === '리세트의 휴가') {
        startRow = i;
        break;
    }
}

if (startRow !== -1) {
    for (let i = startRow; i < startRow + 5; i++) {
        console.log(`Row ${i}: [0]="${data[i][0]}", [1]="${data[i][1]}", [2]="${data[i][2]}"`);
    }
}
