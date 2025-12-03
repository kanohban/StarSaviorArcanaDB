const XLSX = require('xlsx');

try {
    const workbook = XLSX.readFile('cards_data.xlsx');
    console.log('Sheet Names:', workbook.SheetNames);

    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        console.log(`\n--- Sheet: ${sheetName} ---`);
        if (data.length > 0) {
            console.log('Header:', data[0]);
            console.log('First Row:', data[1]);
        } else {
            console.log('Empty Sheet');
        }
    });
} catch (error) {
    console.error('Error reading Excel file:', error.message);
}
