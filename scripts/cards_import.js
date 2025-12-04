const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const excelPath = path.join(__dirname, '../cards_data.xlsx');
const outputPath = path.join(__dirname, '../data/cards.json');

try {
    const workbook = XLSX.readFile(excelPath);

    // Helper to get sheet data
    const getSheetData = (sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        return sheet ? XLSX.utils.sheet_to_json(sheet) : [];
    };

    const cardsSheet = getSheetData('Cards');
    const eventNamesSheet = getSheetData('EventNames');
    const statsSheet = getSheetData('Stats');
    const eventsSheet = getSheetData('Events');

    // Reconstruct Cards
    const cards = cardsSheet.map(row => {
        const id = row['아이디'];

        // Base Object
        const card = {
            '아이디': id,
            '이름': row['이름'],
            '캐릭터': row['캐릭터'],
            '레어도': row['레어도'],
            '이미지': row['이미지'],
            '타입': {
                '훈련': row['타입_훈련'],
                '보조1': row['타입_보조1'],
                '보조2': row['타입_보조2']
            },
            '고유잠재': {
                '이름': row['고유잠재_이름']
            },
            '고유효과': {
                '이름': row['고유효과_이름'],
                '설명': row['고유효과_설명']
            },
            '지원': [],
            '이벤트': {
                '이름': [],
                '1단계': { '이름_선택지': {}, '선택지A': [], '선택지B': [] },
                '2단계': { '이름_선택지': {}, '선택지A': [], '선택지B': [] },
                '3단계': { '이름_선택지': {}, '선택지A': [], '선택지B': [] }
            },
            '여정': [],
            '훈련': [],
            '감응': []
        };

        // 1. Add Event Names
        const eventNameRow = eventNamesSheet.find(r => r['아이디'] === id);
        if (eventNameRow) {
            card.이벤트.이름 = [
                eventNameRow['이벤트1'],
                eventNameRow['이벤트2'],
                eventNameRow['이벤트3']
            ].filter(Boolean);
        }

        // 2. Add Stats (Journey, Training, Resonance, Support)
        const cardStats = statsSheet.filter(r => r['아이디'] === id);
        cardStats.forEach(stat => {
            const category = stat['분류'];
            const type = (stat['타입'] || '').trim();
            const val1 = stat['수치1'];
            const val2 = stat['수치2'];

            let targetArray;
            if (category === '지원') targetArray = card.지원;
            else if (category === '여정') targetArray = card.여정;
            else if (category === '훈련') targetArray = card.훈련;
            else if (category === '감응') targetArray = card.감응;

            if (targetArray) {
                // Check if an entry with this type already exists
                let existingItem = targetArray.find(item => item.타입 === type);

                // Helper to check if value is valid (not undefined/null/empty string, but allow 0)
                const isValid = (v) => v !== undefined && v !== null && v !== '';

                if (existingItem) {
                    // Merge values if they exist in the new row
                    if (isValid(val1)) existingItem.수치35 = val1;
                    if (isValid(val2)) existingItem.수치50 = val2;
                } else {
                    // Create new entry
                    targetArray.push({
                        '타입': type,
                        '수치35': isValid(val1) ? val1 : "",
                        '수치50': isValid(val2) ? val2 : ""
                    });
                }
            }
        });

        // 3. Add Events (Stages + Rewards)
        const cardEvents = eventsSheet.filter(r => r['아이디'] === id);

        ['1단계', '2단계', '3단계'].forEach(stageKey => {
            ['선택지A', '선택지B'].forEach(choiceKey => {
                const choiceRows = cardEvents.filter(r => r['단계'] === stageKey && r['선택지'] === choiceKey);

                if (choiceRows.length > 0) {
                    // Set Choice Text (Take from the first row of this choice)
                    if (card.이벤트[stageKey]) {
                        card.이벤트[stageKey]['이름_선택지'][choiceKey] = choiceRows[0]['선택지_내용'] || '';
                    }

                    // Group by Condition to reconstruct the array
                    const conditions = ['고정', '성공', '실패'];
                    const choiceArray = [];

                    conditions.forEach(cond => {
                        const condRows = choiceRows.filter(r => r['조건'] === cond);
                        // Even if empty, we might need to check if we should add it.
                        // But usually we only add if there are rows OR if it's a standard structure.
                        // Let's add it if there are rows.

                        if (condRows.length > 0) {
                            const rewards = condRows
                                .filter(r => r['보상_타입'] || r['보상_수치']) // Filter out empty placeholders
                                .map(r => ({
                                    '타입': r['보상_타입'],
                                    '수치': r['보상_수치']
                                }));

                            choiceArray.push({
                                '여부': cond,
                                '획득': rewards
                            });
                        } else {
                            // If no rows for this condition, do we add an empty entry?
                            // The original JSON usually has all 3 conditions.
                            // If the Excel doesn't have rows for '실패', it might mean it was deleted or just not exported.
                            // To be safe, we can check if we want to enforce all 3.
                            // For now, let's just add what's in Excel.
                            // BUT, if the user deleted rows for '실패' because it was empty, we might lose the structure.
                            // However, the export script exports empty rows for conditions if they exist in JSON.
                            // So if they are in Excel, we read them.
                        }
                    });

                    if (card.이벤트[stageKey]) {
                        card.이벤트[stageKey][choiceKey] = choiceArray;
                    }
                }
            });
        });

        return card;
    });

    fs.writeFileSync(outputPath, JSON.stringify(cards, null, 2));
    console.log(`Imported ${cards.length} cards to ${outputPath}`);

} catch (error) {
    console.error('Error importing Excel file:', error.message);
}
