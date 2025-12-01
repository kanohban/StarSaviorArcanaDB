const ExcelJS = require('exceljs');
const path = require('path');

async function inspectExcel() {
    const workbook = new ExcelJS.Workbook();
    const filePath = path.join('f:', 'ss', 'ss', '아르카나 이벤트 이름 도움.xlsx');

    try {
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1); // Get first sheet

        console.log('Sheet Name:', worksheet.name);
        console.log('Row Count:', worksheet.rowCount);

        // Print first 5 rows
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber <= 5) {
                console.log(`Row ${rowNumber}:`, row.values);
            }
        });
    } catch (error) {
        console.error('Error reading Excel file:', error);
    }
}

inspectExcel();
