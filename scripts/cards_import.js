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
    const journeySheet = getSheetData('Journey');
    const trainingSheet = getSheetData('Training');
    const resonanceSheet = getSheetData('Resonance');
    const eventStagesSheet = getSheetData('EventStages');
    const eventRewardsSheet = getSheetData('EventRewards');

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
            '지원': {
                '타입': row['지원_타입'] || null,
                '수치': row['지원_수치'] || null
            },
            '이벤트': {
                '이름': [
                    row['이벤트_이름1'],
                    row['이벤트_이름2'],
                    row['이벤트_이름3']
                ].filter(Boolean),
                '1단계': { '이름_선택지': {}, '선택지A': [], '선택지B': [] },
                '2단계': { '이름_선택지': {}, '선택지A': [], '선택지B': [] },
                '3단계': { '이름_선택지': {}, '선택지A': [], '선택지B': [] }
            },
            '여정': [],
            '훈련': [],
            '감응': []
        };

        // Add Journey
        journeySheet.filter(r => r['아이디'] === id).forEach(r => {
            card.여정.push({
                '타입': r['타입'],
                '수치35': r['수치35'],
                '수치50': r['수치50']
            });
        });

        // Add Training
        trainingSheet.filter(r => r['아이디'] === id).forEach(r => {
            card.훈련.push({
                '타입': r['타입'],
                '수치35': r['수치35'],
                '수치50': r['수치50']
            });
        });

        // Add Resonance
        resonanceSheet.filter(r => r['아이디'] === id).forEach(r => {
            card.감응.push({
                '타입': r['타입'],
                '수치35': r['수치35'],
                '수치50': r['수치50']
            });
        });

        // Add Event Stages (Choice Texts)
        eventStagesSheet.filter(r => r['아이디'] === id).forEach(r => {
            const stageKey = r['단계']; // 1단계, 2단계, 3단계
            if (card.이벤트[stageKey]) {
                card.이벤트[stageKey]['이름_선택지'] = {
                    '선택지A': r['선택지A_텍스트'] || '',
                    '선택지B': r['선택지B_텍스트'] || ''
                };
            }
        });

        // Add Event Rewards
        // We need to group rewards by Stage -> Choice -> Condition
        const rewards = eventRewardsSheet.filter(r => r['아이디'] === id);

        ['1단계', '2단계', '3단계'].forEach(stageKey => {
            ['선택지A', '선택지B'].forEach(choiceKey => {
                // Initialize choice array with default structure if needed, 
                // but usually we want to build it from data.
                // However, the original JSON has specific structure: array of objects with { 여부, 획득: [] }
                // We need to reconstruct this array.
                // The possible conditions are usually: 고정, 성공, 실패.

                const stageRewards = rewards.filter(r => r['단계'] === stageKey && r['선택지'] === choiceKey);

                // Group by Condition
                const conditions = ['고정', '성공', '실패'];
                const choiceArray = [];

                conditions.forEach(cond => {
                    const condRewards = stageRewards.filter(r => r['조건'] === cond);
                    // Even if no rewards, we might need the entry if it existed in original.
                    // But for now, let's only add if we have data OR if we want to enforce structure.
                    // The original JSON always has these 3 entries for each choice.

                    const rewardList = condRewards.map(r => ({
                        '타입': r['보상_타입'],
                        '수치': r['보상_수치']
                    }));

                    choiceArray.push({
                        '여부': cond,
                        '획득': rewardList
                    });
                });

                if (card.이벤트[stageKey]) {
                    card.이벤트[stageKey][choiceKey] = choiceArray;
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
