const ExcelJS = require('exceljs');

const filePath = '스타 세이비어 아르카나 V1.0_251125의 사본.xlsx';

async function main() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const sheet = workbook.getWorksheet('아르카나DB');
    if (!sheet) {
        console.log("Sheet not found");
        return;
    }

    const headers = [];
    sheet.getRow(1).eachCell((cell, colNumber) => {
        headers.push({ index: colNumber, value: cell.value });
    });

    console.log("Headers Mapping:");
    headers.forEach(h => console.log(`${h.index}: ${h.value}`));

    console.log("\nFirst Row Data:");
    const firstRow = sheet.getRow(2);
    headers.forEach(h => {
        console.log(`${h.value} (${h.index}): ${firstRow.getCell(h.index).value}`);
    });
}

main().catch(console.error);
