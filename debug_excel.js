const ExcelJS = require('exceljs');

const filePath = '스타 세이비어 아르카나 V1.0_251125의 사본.xlsx';

async function main() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const dbSheet = workbook.getWorksheet('아르카나DB');
    const buildSheet = workbook.getWorksheet('빌드');

    console.log("=== 아르카나DB Sheet (First 3 rows) ===");
    dbSheet.eachRow((row, rowNumber) => {
        if (rowNumber <= 3) {
            console.log(`Row ${rowNumber}:`, row.values);
        }
    });

    if (buildSheet) {
        console.log("\n=== 빌드 Sheet (First 10 rows) ===");
        buildSheet.eachRow((row, rowNumber) => {
            if (rowNumber <= 10) {
                console.log(`Row ${rowNumber}:`, row.values);
            }
        });
    } else {
        console.log("\n'빌드' sheet not found.");
    }
}

main().catch(console.error);
