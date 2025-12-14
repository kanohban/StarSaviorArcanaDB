const XLSX = require('xlsx');
const fs = require('fs');

const workbook = XLSX.readFile('가챠테이블.xlsx');
const sheets = ['구원자-통상', '구원자-픽업', '아르카나-통상', '아르카나-픽업'];
const result = {};

sheets.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    if (worksheet) {
        result[sheetName] = XLSX.utils.sheet_to_json(worksheet);
    } else {
        result[sheetName] = [];
    }
});

console.log(JSON.stringify(result, null, 2));

// Save to data folder for the app to use
fs.writeFileSync('data/gacha_data.json', JSON.stringify(result, null, 2));
