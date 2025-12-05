const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const workbookPath = path.join(__dirname, '../구원자DB.xlsx');
const outputPath = path.join(__dirname, '../data/savior_raw.json');

try {
    const workbook = XLSX.readFile(workbookPath);
    const result = {};

    workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        result[sheetName] = data;
    });

    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`Successfully dumped data to ${outputPath}`);
} catch (error) {
    console.error('Error processing Excel file:', error);
}
