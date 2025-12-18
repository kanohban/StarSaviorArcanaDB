const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, '../import/game_data.xlsx');
const outputPath = path.join(__dirname, '../temp_headers.json');

try {
    const workbook = XLSX.readFile(filePath);
    const sheetsToInspect = [
        'savior_profile',
        'savior_stats',
        'skills',
        'skills_active_level',
        'skills_passive_level',
        'Potentials'
    ];

    const result = {};

    sheetsToInspect.forEach(name => {
        if (workbook.SheetNames.includes(name)) {
            const sheet = workbook.Sheets[name];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            if (data.length > 0) {
                result[name] = {
                    headers: data[0],
                    firstRow: data.length > 1 ? data[1] : null
                };
            }
        }
    });

    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log("Headers written to temp_headers.json");

} catch (e) {
    console.error("Error reading file:", e.message);
}
