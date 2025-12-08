const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../여정 시트 정리.xlsx');
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]]; // First sheet
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Find the row where "플로라/칼라이드" starts
let floraRowIndex = data.findIndex(row => row[0] && row[0].includes('플로라'));
if (floraRowIndex === -1) {
    console.log('Could not find Flora section');
} else {
    console.log(`Flora section starts at row ${floraRowIndex}`);
    // Log next 15 rows, showing first 5 columns
    for (let i = floraRowIndex; i < floraRowIndex + 15; i++) {
        if (data[i]) {
            console.log(`Row ${i}:`, JSON.stringify(data[i].slice(0, 6)));
        }
    }
}
