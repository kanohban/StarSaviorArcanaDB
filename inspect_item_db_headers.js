const XLSX = require("xlsx");
const file = XLSX.readFile("./import/아이템 DB.xlsx");
file.SheetNames.forEach(sheetName => {
    const sheet = file.Sheets[sheetName];
    // Get the first row (headers)
    const headers = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0];
    console.log("Headers for sheet '" + sheetName + "':", headers);
});
