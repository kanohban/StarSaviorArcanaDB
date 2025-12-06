const XLSX = require('xlsx');
const path = require('path');
const file = path.join(__dirname, '../data/game_data.xlsx');
try {
    const wb = XLSX.readFile(file);
    const result = {};
    wb.SheetNames.forEach(name => {
        const sheet = wb.Sheets[name];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (json && json.length > 0) {
            result[name] = json[0];
        }
    });
    console.log(JSON.stringify(result, null, 2));
} catch (e) {
    console.error("Error reading file:", e);
}
