const ExcelJS = require('exceljs');

const filePath = '스타 세이비어 아르카나 V1.0_251125의 사본.xlsx';

async function main() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const sheet = workbook.getWorksheet('드롭다운');
    if (sheet) {
        console.log("=== 드롭다운 Sheet (First 20 rows) ===");
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber <= 20) {
                console.log(`Row ${rowNumber}:`, row.values);
            }
        });
    } else {
        console.log("'드롭다운' sheet not found.");
    }
}

main().catch(console.error);
