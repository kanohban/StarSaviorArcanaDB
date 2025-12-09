const XLSX = require('xlsx');
const fs = require('fs');

const workbook = XLSX.readFile('가챠테이블.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log(JSON.stringify(data, null, 2));

// Also check for other sheets if any
console.error("Sheets:", workbook.SheetNames);
