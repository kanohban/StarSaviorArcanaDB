const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const { Item } = require("./classes/item");

// Try to read from game_data.xlsx first, if item sheet not found, try 아이템 DB.xlsx (for development flexibility)
let file;
let sheetName = "item";
const gameDataPath = "./import/game_data.xlsx";
const itemDbPath = "./import/아이템 DB.xlsx";

try {
    if (fs.existsSync(gameDataPath)) {
        file = XLSX.readFile(gameDataPath);
        if (!file.Sheets[sheetName]) {
            console.log(`Sheet '${sheetName}' not found in ${gameDataPath}. Checking ${itemDbPath}...`);
            if (fs.existsSync(itemDbPath)) {
                file = XLSX.readFile(itemDbPath);
                sheetName = "아이템"; // The sheet name in the other file is Korean
            }
        }
    } else if (fs.existsSync(itemDbPath)) {
        file = XLSX.readFile(itemDbPath);
        sheetName = "아이템";
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

const items = [];

// Skip header row (index 0)
for (let i = 1; i < itemData.length; i++) {
    try {
        const item = new Item(itemData[i]);
        items.push(item);
    } catch (err) {
        console.error(`Error processing row ${i}:`, err);
    }
}

const outputPath = "./data/item.json";
fs.writeFileSync(outputPath, JSON.stringify(items, null, 2));
console.log(`Successfully wrote ${items.length} items to ${outputPath}`);
