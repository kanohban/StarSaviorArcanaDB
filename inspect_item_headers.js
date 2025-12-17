const XLSX = require("xlsx");
const file = XLSX.readFile("./import/game_data.xlsx");
const sheetName = "item";
if (file.Sheets[sheetName]) {
    const sheet = file.Sheets[sheetName];
    // Get the first row (headers)
    const headers = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0];
    console.log("Headers for sheet '" + sheetName + "':", headers);
} else {
    console.log("Sheet '" + sheetName + "' not found. Available sheets:", file.SheetNames);
}
