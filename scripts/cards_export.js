const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const cardsPath = path.join(__dirname, '../data/cards.json');
const outputPath = path.join(__dirname, '../cards_data.xlsx');

const cardsData = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

// 1. Cards Sheet (Basic Info)
const cardsSheetData = cardsData.map(card => ({
    '아이디': card.아이디,
    '이름': card.이름,
    '캐릭터': card.캐릭터,
    '레어도': card.레어도,
    '이미지': card.이미지,
    '타입_훈련': card.타입?.훈련 || '',
    '타입_보조1': card.타입?.보조1 || '',
    '타입_보조2': card.타입?.보조2 || '',
    '고유잠재_이름': card.고유잠재?.이름 || '',
    '고유효과_이름': card.고유효과?.이름 || '',
    '고유효과_설명': card.고유효과?.설명 || ''
}));

// 2. EventNames Sheet
const eventNamesSheetData = cardsData.map(card => ({
    '아이디': card.아이디,
    '카드': card.이름,
    '이벤트1': card.이벤트?.이름?.[0] || '',
    '이벤트2': card.이벤트?.이름?.[1] || '',
    '이벤트3': card.이벤트?.이름?.[2] || ''
}));

// 3. Stats Sheet (Support, Journey, Training, Resonance)
const statsSheetData = [];
cardsData.forEach(card => {
    // Support (지원)
    if (card.지원 && Array.isArray(card.지원)) {
        card.지원.forEach(item => {
            statsSheetData.push({
                '아이디': card.아이디,
                '카드': card.이름,
                '분류': '지원',
                '타입': item.타입,
                '수치1': item.수치35 || item.수치 || '',
                '수치2': item.수치50 || ''
            });
        });
    } else if (card.지원 && typeof card.지원 === 'object') {
        // Fallback for legacy object structure (during migration)
        statsSheetData.push({
            '아이디': card.아이디,
            '카드': card.이름,
            '분류': '지원',
            '타입': card.지원.타입 || '',
            '수치1': card.지원.수치35 || card.지원.수치 || '',
            '수치2': card.지원.수치50 || ''
        });
    }

    // Journey (여정)
    if (card.여정) {
        card.여정.forEach(item => {
            statsSheetData.push({
                '아이디': card.아이디,
                '카드': card.이름,
                '분류': '여정',
                '타입': item.타입,
                '수치1': item.수치35 || '', // Value35
                '수치2': item.수치50 || ''  // Value50
            });
        });
    }
    // Training (훈련)
    if (card.훈련) {
        card.훈련.forEach(item => {
            statsSheetData.push({
                '아이디': card.아이디,
                '카드': card.이름,
                '분류': '훈련',
                '타입': item.타입,
                '수치1': item.수치35 || '',
                '수치2': item.수치50 || ''
            });
        });
    }
    // Resonance (감응)
    if (card.감응) {
        card.감응.forEach(item => {
            statsSheetData.push({
                '아이디': card.아이디,
                '카드': card.이름,
                '분류': '감응',
                '타입': item.타입,
                '수치1': item.수치35 || '',
                '수치2': item.수치50 || ''
            });
        });
    }
});

// 4. Events Sheet (Stages + Rewards)
const eventsSheetData = [];
cardsData.forEach(card => {
    if (card.이벤트) {
        ['1단계', '2단계', '3단계'].forEach(stageKey => {
            const stageData = card.이벤트[stageKey];
            if (stageData) {
                const choiceTexts = stageData.이름_선택지 || {};

                ['선택지A', '선택지B'].forEach(choiceKey => {
                    const choiceText = choiceTexts[choiceKey] || '';
                    const choiceData = stageData[choiceKey];

                    if (choiceData && choiceData.length > 0) {
                        choiceData.forEach(conditionData => {
                            const condition = conditionData.여부;
                            if (conditionData.획득 && conditionData.획득.length > 0) {
                                conditionData.획득.forEach(reward => {
                                    eventsSheetData.push({
                                        '아이디': card.아이디,
                                        '카드': card.이름,
                                        '단계': stageKey,
                                        '선택지': choiceKey,
                                        '선택지_내용': choiceText,
                                        '조건': condition,
                                        '보상_타입': reward.타입,
                                        '보상_수치': reward.수치
                                    });
                                });
                            } else {
                                // Entry without reward
                                eventsSheetData.push({
                                    '아이디': card.아이디,
                                    '카드': card.이름,
                                    '단계': stageKey,
                                    '선택지': choiceKey,
                                    '선택지_내용': choiceText,
                                    '조건': condition,
                                    '보상_타입': '',
                                    '보상_수치': ''
                                });
                            }
                        });
                    }
                });
            }
        });
    }
});

// Create Workbook
const wb = XLSX.utils.book_new();

const cardsSheet = XLSX.utils.json_to_sheet(cardsSheetData);
XLSX.utils.book_append_sheet(wb, cardsSheet, 'Cards');

const eventNamesSheet = XLSX.utils.json_to_sheet(eventNamesSheetData);
XLSX.utils.book_append_sheet(wb, eventNamesSheet, 'EventNames');

const statsSheet = XLSX.utils.json_to_sheet(statsSheetData);
XLSX.utils.book_append_sheet(wb, statsSheet, 'Stats');

const eventsSheet = XLSX.utils.json_to_sheet(eventsSheetData);
XLSX.utils.book_append_sheet(wb, eventsSheet, 'Events');

// Write to file
XLSX.writeFile(wb, outputPath);
console.log(`Exported cards data to ${outputPath}`);
