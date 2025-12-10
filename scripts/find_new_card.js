const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const excelPath = path.join(__dirname, '../import/game_data.xlsx');
const jsonPath = path.join(__dirname, '../data/cards.json');

try {
    // Read JSON
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const jsonIds = new Set(jsonData.map(c => c.아이디));
    const jsonNames = new Set(jsonData.map(c => c.이름));

    // Read Excel
    const workbook = XLSX.readFile(excelPath);
    const sheetName = 'Cards_Stats';
    if (!workbook.SheetNames.includes(sheetName)) {
        console.log(`Sheet '${sheetName}' not found.`);
        process.exit(1);
    }

    const sheet = workbook.Sheets[sheetName];
    // Assuming Row 1 is header, Data starts Row 2.
    // Let's rely on sheet_to_json default (first row header) or 'skipHeader' if we know column index.
    // Based on previous inspection, ID seems to be the first column (index 0) and Name second (index 1).
    const excelData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Skip header row
    const rows = excelData.slice(1);

    const newCards = [];

    rows.forEach(row => {
        if (row.length === 0) return;
        const id = row[0];
        const name = row[1];

        if (!jsonIds.has(id)) {
            newCards.push({ id, name, reason: 'New ID' });
        } else if (!jsonNames.has(name)) {
            // ID exists but name might be different (unlikely for new card, but possible update)
            // newCards.push({ id, name, reason: 'New Name (ID exists)' });
        }
    });

    if (newCards.length > 0) {
        console.log("Found new cards:", JSON.stringify(newCards, null, 2));
    } else {
        console.log("No new cards found based on ID.");
        // If IDs match, check counts
        console.log(`JSON count: ${jsonIds.size}, Excel count: ${rows.length}`);
    }

} catch (e) {
    console.error("Error:", e.message);
}
