const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../import/game_data.xlsx');
try {
    const workbook = XLSX.readFile(filePath);
    console.log("Sheet Names:", JSON.stringify(workbook.SheetNames, null, 2));
} catch (e) {
    console.error("Error reading file:", e.message);
}
