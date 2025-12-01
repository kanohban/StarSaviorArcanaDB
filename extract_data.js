const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const filePath = '스타 세이비어 아르카나 V1.0_251125의 사본.xlsx';
const outputDir = 'public';
const imagesDir = path.join(outputDir, 'images', 'cards');
const dataDir = path.join(outputDir, 'data');

// Ensure directories exist
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Mapping for Types based on Dropdown sheet inspection
const typeMapping = {
    1: '힘',
    2: '체력',
    3: '인내',
    4: '집중',
    5: '보호'
};

function mapType(value) {
    if (typeof value === 'number' && typeMapping[value]) {
        return typeMapping[value];
    }
    return value;
}

function formatValue(value) {
    if (typeof value === 'number') {
        if (Math.abs(value) > 0 && Math.abs(value) < 1) {
            return `${(value * 100).toFixed(2)}%`;
        }
    }
    return value;
}

async function main() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const sheet = workbook.getWorksheet('아르카나DB');
    if (!sheet) {
        console.error("Sheet '아르카나DB' not found!");
        return;
    }

    // Map headers to column indices (1-based)
    const headerMap = {};
    sheet.getRow(1).eachCell((cell, colNumber) => {
        headerMap[cell.value] = colNumber;
    });

    // Map for images: row -> image buffer
    const imageMap = new Map();
    sheet.getImages().forEach(image => {
        const imgId = image.imageId;
        const imgRange = image.range;
        const rowIndex = imgRange.tl.nativeRow + 1;

        const img = workbook.model.media.find(m => m.index === imgId);
        if (img) {
            imageMap.set(rowIndex, {
                buffer: img.buffer,
                extension: img.extension
            });
        }
    });

    const cards = [];

    // Iterate rows (starting from 2)
    sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const getVal = (headerName) => {
            const col = headerMap[headerName];
            return col ? row.getCell(col).value : null;
        };

        const cardName = getVal('이름_아르카나') || getVal('이름') || getVal('카드이름');

        const card = {
            "아이디": rowNumber - 1,
            "이름": cardName,
            "캐릭터": getVal('이름_캐릭터'),
            "레어도": getVal('레어도'),
            "이미지": "",
            "타입": {
                "훈련": mapType(getVal('타입_훈련')),
                "보조1": mapType(getVal('타입_보조1')),
                "보조2": mapType(getVal('타입_보조2')),
            },
            "고유잠재": {
                "이름": getVal('고유_잠재_이름'),
                "설명": getVal('고유_잠재_설명'),
            },
            "고유효과": {
                "이름": getVal('고유_효과_이름'),
                "설명": getVal('고유_효과_설명'),
            },
            "이벤트": {}, // Renamed from '여정' (contains stages/choices)
            "여정": [],   // New '여정' (contains global journey stats)
            "훈련": [],
            "감응": [],
            "지원": {
                "타입": mapType(getVal('지원_타입')),
                "수치": formatValue(getVal('지원_수치')),
            }
        };

        // Events (Stages 1, 2, 3)
        for (let i = 1; i <= 3; i++) {
            const stageEvents = [];

            // Events 1 to 5
            for (let j = 1; j <= 5; j++) {
                const typeA = mapType(getVal(`여정${i}-${j}-A_타입`));
                let valA = formatValue(getVal(`여정${i}-${j}-A_수치`));
                const typeB = mapType(getVal(`여정${i}-${j}-B_타입`));
                let valB = formatValue(getVal(`여정${i}-${j}-B_수치`));

                // Convert to string to ensure it appears as "value" in JSON
                if (valA !== null && valA !== undefined && valA !== '') {
                    valA = String(valA);
                }
                if (valB !== null && valB !== undefined && valB !== '') {
                    valB = String(valB);
                }

                if (typeA || valA || typeB || valB) {
                    stageEvents.push({
                        "번호": j,
                        "선택지A": (typeA || valA) ? { "타입": typeA, "수치": valA } : null,
                        "선택지B": (typeB || valB) ? { "타입": typeB, "수치": valB } : null
                    });
                }
            }
            card["이벤트"][`${i}단계`] = stageEvents;
        }

        // Journey Stats (여정1~3) -> Start Effects
        for (let i = 1; i <= 3; i++) {
            const type = mapType(getVal(`여정${i}_타입`));
            const val = formatValue(getVal(`여정${i}_수치`));
            if (type || val) {
                // Just push type and value, no stage label
                card["여정"].push({ "타입": type, "수치": val });
            }
        }

        // Training
        for (let i = 1; i <= 5; i++) {
            const type = mapType(getVal(`훈련${i}_타입`));
            const val = formatValue(getVal(`훈련${i}_수치`));
            if (type || val) card["훈련"].push({ "타입": type, "수치": val });
        }

        // Resonance
        for (let i = 1; i <= 3; i++) {
            const type = mapType(getVal(`감응${i}_타입`));
            const val = formatValue(getVal(`감응${i}_수치`));
            if (type || val) card["감응"].push({ "타입": type, "수치": val });
        }

        // Image Handling
        if (imageMap.has(rowNumber)) {
            const imgData = imageMap.get(rowNumber);
            const safeName = cardName ? cardName.replace(/[^a-zA-Z0-9가-힣]/g, '_') : `card_${rowNumber - 1}`;
            const fileName = `${safeName}.png`;
            const fullPath = path.join(imagesDir, fileName);

            card["이미지"] = `images/cards/${fileName}`;

            if (!fs.existsSync(fullPath)) {
                fs.writeFileSync(fullPath, imgData.buffer);
                console.log(`Saved image: ${fileName}`);
            }
        }

        cards.push(card);
    });

    fs.writeFileSync(path.join(dataDir, 'cards.json'), JSON.stringify(cards, null, 2));
    console.log(`Extracted ${cards.length} cards to public/data/cards.json`);
}

main().catch(console.error);
