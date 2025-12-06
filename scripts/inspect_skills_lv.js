const XLSX = require('xlsx');
const path = require('path');
const file = path.join(__dirname, '../data/game_data.xlsx');
const wb = XLSX.readFile(file);
const sheet = wb.Sheets['Skills_lv'];
if (sheet) {
    const json = XLSX.utils.sheet_to_json(sheet);
    console.log(JSON.stringify(json.slice(0, 5), null, 2)); // Print first 5 rows
} else {
    console.log("Sheet 'Skills_lv' not found");
}
