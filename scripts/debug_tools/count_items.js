const XLSX = require("xlsx");
const fs = require("fs");

const itemDbPath = "./import/아이템 DB.xlsx";
const gameDataPath = "./import/game_data.xlsx";

function checkFile(path, name) {
    if (fs.existsSync(path)) {
        console.log(`Checking ${path}...`);
        const wb = XLSX.readFile(path);
        const sheet = wb.Sheets[name];
        if (sheet) {
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            console.log(`Sheet '${name}' has ${data.length} rows.`);

            // Check for training books (Tag 1)
            let tag1Count = 0;
            let reqJourneyCount = 0;
            data.forEach((row, idx) => {
                if (idx === 0) return; // Header
                if (row[3] == 1) tag1Count++;
                if (row[10]) reqJourneyCount++;
            });
            console.log(`Tag 1 (Training Books) count: ${tag1Count}`);
            console.log(`Rows with req_journey_name (Col 10): ${reqJourneyCount}`);
        } else {
            console.log(`Sheet '${name}' not found.`);
        }
    } else {
        console.log(`${path} not found.`);
    }
}

checkFile(itemDbPath, "아이템");
checkFile(gameDataPath, "item");
