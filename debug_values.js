const ExcelJS = require('exceljs');
const path = require('path');

const filePath = '스타 세이비어 아르카나 V1.0_251125의 사본.xlsx';

async function main() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.getWorksheet('아르카나DB');

    const headerMap = {};
    sheet.getRow(1).eachCell((cell, colNumber) => {
        headerMap[cell.value] = colNumber;
    });

    console.log('Header Map for 여정1-1-A_수치:', headerMap['여정1-1-A_수치']);

    // Check first few rows
    for (let i = 2; i <= 5; i++) {
        const row = sheet.getRow(i);
        const colIdx = headerMap['여정1-1-A_수치'];
        const val = row.getCell(colIdx).value;
        console.log(`Row ${i}, Val:`, val, 'Type:', typeof val);
    }
}

main();
