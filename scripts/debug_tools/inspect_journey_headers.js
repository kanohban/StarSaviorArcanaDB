const XLSX = require("xlsx");
const path = "./import/game_data.xlsx";
const wb = XLSX.readFile(path);
const sheet = wb.Sheets["Journey"];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log("Headers:", data[0]);
console.log("First row:", data[1]);
