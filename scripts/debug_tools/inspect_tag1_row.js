const XLSX = require("xlsx");
const itemDbPath = "./import/아이템 DB.xlsx";
const wb = XLSX.readFile(itemDbPath);
const sheet = wb.Sheets["아이템"];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // Tag is index 3. Tag 1 = Training Book.
    if (row[3] == 1) {
        console.log(`Row ${i} (Tag 1): ${row[1]}`);
        console.log(`Col 9 (ReqID): '${row[9]}'`);
        console.log(`Col 10 (ReqName): '${row[10]}'`);
        // Just print one
        break;
    }
}
