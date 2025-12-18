const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../import/game_data.xlsx');
try {
    const workbook = XLSX.readFile(filePath);
    console.log("Sheet Names:", workbook.SheetNames);

    // Inspect Headers
    const sheets = ['Cards_Stats', 'Cards_Event'];

    sheets.forEach(name => {
        if (workbook.SheetNames.includes(name)) {
            const sheet = workbook.Sheets[name];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            console.log(`\n=== Sheet: ${name} ===`);
            if (data.length > 0) {
                console.log("Headers (Row 1):", JSON.stringify(data[0], null, 2));
            }
        }
    });
} catch (e) {
    console.error("Error reading file:", e.message);
}
