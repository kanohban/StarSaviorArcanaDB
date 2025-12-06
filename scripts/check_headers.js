const XLSX = require('xlsx');
const path = require('path');
const file = path.join(__dirname, '../data/game_data.xlsx');
const wb = XLSX.readFile(file);
const sheet = wb.Sheets['Skills'];
if (sheet) {
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(json[0]); // Print headers
} else {
    console.log("Sheet 'Skills' not found");
}
