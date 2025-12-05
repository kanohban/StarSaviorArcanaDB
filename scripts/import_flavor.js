const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const excelPath = path.join(__dirname, '../구원자DB.xlsx');
const flavorJsonPath = path.join(__dirname, '../data/flavor_text.json');

// Read Excel
const workbook = XLSX.readFile(excelPath);
const flavorSheet = workbook.Sheets['플레이버 텍스트'];
const flavorRaw = XLSX.utils.sheet_to_json(flavorSheet);

// Map to standard format
const flavorDict = flavorRaw.map(row => ({
    키워드: row['텍스트'],
    내용: row['설명']
})).filter(item => item.키워드 && item.내용);

// Write to separate JSON
fs.writeFileSync(flavorJsonPath, JSON.stringify(flavorDict, null, 2), 'utf8');
console.log(`Exported ${flavorDict.length} flavor texts to ${flavorJsonPath}`);

