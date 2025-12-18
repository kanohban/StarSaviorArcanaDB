const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const { Item } = require("./classes/item");

// Try to read from game_data.xlsx
let file;
let sheetName = "item";
const gameDataPath = "./import/game_data.xlsx";

try {
    if (fs.existsSync(gameDataPath)) {
        file = XLSX.readFile(gameDataPath);
    } else {
        console.error(`File not found: ${gameDataPath}`);
        process.exit(1);
    }
} catch (e) {
    console.error("Error loading Excel file:", e);
    process.exit(1);
}

if (!file || !file.Sheets[sheetName]) {
    console.error(`Could not find sheet '${sheetName}' in available files.`);
    process.exit(1);
}

const sheet = file.Sheets[sheetName];
const itemData = XLSX.utils.sheet_to_json(sheet, { header: 1 }).filter(e => e.length !== 0);

// Load Journey Map (ID -> Name)
let journeyMap = [];
const journeySheet = file.Sheets["Journey"];
if (journeySheet) {
    const journeyData = XLSX.utils.sheet_to_json(journeySheet, { header: 1 });
    // Header is row 0. ID 0 is row 1.
    // Name is column 2 (index 2).
    // map[(index - 1)] = row[2]
    journeyMap = journeyData.slice(1).map(row => row[2]);
    console.log(`Loaded ${journeyMap.length} journey names for mapping.`);
}


const items = [];


// Skip header row (index 0)
for (let i = 1; i < itemData.length; i++) {
    try {
        const item = new Item(itemData[i]);

        // Fix missing req_journey_name if id exists
        if (!item.req_journey_name && item.req_journey_id !== undefined) {
            const ids = String(item.req_journey_id).split(',').map(s => s.trim());
            const names = ids.map(id => journeyMap[id] || "").filter(s => s);
            if (names.length > 0) {
                item.req_journey_name = names.join(',');
                console.log(`Restored ReqName for ${item.name}: ${item.req_journey_name}`);
            }
        }

        // Fix missing obt_journey_name if id exists
        if (!item.obt_journey_name && item.obt_journey_id !== undefined) {
            const ids = String(item.obt_journey_id).split(',').map(s => s.trim());
            const names = ids.map(id => journeyMap[id] || "").filter(s => s);
            if (names.length > 0) {
                item.obt_journey_name = names.join(',');
                // console.log(`Restored ObtName for ${item.name}: ${item.obt_journey_name}`);
            }
        }

        items.push(item);
    } catch (err) {
        console.error(`Error processing row ${i}:`, err);
    }
}

const outputPath = "./data/item.json";
fs.writeFileSync(outputPath, JSON.stringify(items, null, 2));
console.log(`Successfully wrote ${items.length} items to ${outputPath}`);
