const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function updateEventNames() {
    const workbook = new ExcelJS.Workbook();
    const excelPath = path.join('f:', 'ss', 'ss', '아르카나 이벤트 이름 도움.xlsx');
    const jsonPath = path.join('f:', 'ss', 'ss', 'public', 'data', 'cards.json');

    try {
        // Read Excel
        await workbook.xlsx.readFile(excelPath);
        const worksheet = workbook.getWorksheet(1);

        const eventMap = new Map();

        // Skip header row (row 1)
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                const cardName = row.getCell(2).value; // 이름_아르카나 (Column 2)
                const event1 = row.getCell(5).value;   // 이벤트1 (Column 5)
                const event2 = row.getCell(6).value;   // 이벤트2 (Column 6)
                const event3 = row.getCell(7).value;   // 이벤트3 (Column 7)

                if (cardName) {
                    // Handle rich text or other cell types
                    let nameStr = cardName;
                    if (typeof cardName === 'object' && cardName.richText) {
                        nameStr = cardName.richText.map(t => t.text).join('');
                    } else if (typeof cardName === 'object' && cardName.text) {
                        nameStr = cardName.text;
                    }

                    const finalName = String(nameStr).trim();
                    console.log(`Excel Card: '${finalName}'`); // Debug

                    eventMap.set(finalName, {
                        '1단계': event1,
                        '2단계': event2,
                        '3단계': event3
                    });
                }
            }
        });

        console.log(`Loaded ${eventMap.size} cards from Excel.`);

        // Read JSON
        const cardsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        let updatedCount = 0;

        // Update JSON
        cardsData.forEach(card => {
            const jsonName = String(card['이름']).trim();
            const newEvents = eventMap.get(jsonName);

            if (newEvents) {
                console.log(`Match found for: '${jsonName}'`); // Debug
                if (card['이벤트']) {
                    if (card['이벤트']['1단계'] && newEvents['1단계']) {
                        card['이벤트']['1단계']['이름'] = newEvents['1단계'];
                    }
                    if (card['이벤트']['2단계'] && newEvents['2단계']) {
                        card['이벤트']['2단계']['이름'] = newEvents['2단계'];
                    }
                    if (card['이벤트']['3단계'] && newEvents['3단계']) {
                        card['이벤트']['3단계']['이름'] = newEvents['3단계'];
                    }
                    updatedCount++;
                }
            } else {
                console.log(`No match for JSON card: '${jsonName}'`);
            }
        });

        // Write back to JSON
        fs.writeFileSync(jsonPath, JSON.stringify(cardsData, null, 2), 'utf8');
        console.log(`Successfully updated event names for ${updatedCount} cards.`);

    } catch (error) {
        console.error('Error updating event names:', error);
    }
}

updateEventNames();
