const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const cardsPath = path.join(__dirname, '../data/cards.json');
const outputPath = path.join(__dirname, '../cards_data.xlsx');

const cardsData = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

// 1. Cards Sheet Data
const cardsSheetData = cardsData.map(card => {
    return {
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
        '고유효과_설명': card.고유효과?.설명 || '',
        '지원_타입': card.지원?.타입 || '',
        '지원_수치': card.지원?.수치 || '',
        '이벤트_이름1': card.이벤트?.이름?.[0] || '',
        '이벤트_이름2': card.이벤트?.이름?.[1] || '',
        '이벤트_이름3': card.이벤트?.이름?.[2] || ''
    };
});

// 2. Journey Sheet Data
const journeySheetData = [];
cardsData.forEach(card => {
    if (card.여정) {
        card.여정.forEach(item => {
            journeySheetData.push({
                '아이디': card.아이디,
                '카드': card.이름,
                '타입': item.타입,
                '수치35': item.수치35,
                '수치50': item.수치50
            });
        });
    }
});

// 3. Training Sheet Data
const trainingSheetData = [];
cardsData.forEach(card => {
    if (card.훈련) {
        card.훈련.forEach(item => {
            trainingSheetData.push({
                '아이디': card.아이디,
                '카드': card.이름,
                '타입': item.타입,
                '수치35': item.수치35,
                '수치50': item.수치50
            });
        });
    }
});

// 4. Resonance Sheet Data
const resonanceSheetData = [];
cardsData.forEach(card => {
    if (card.감응) {
        card.감응.forEach(item => {
            resonanceSheetData.push({
                '아이디': card.아이디,
                '카드': card.이름,
                '타입': item.타입,
                '수치35': item.수치35,
                '수치50': item.수치50
            });
        });
    }
});

// 5. EventStages Sheet Data
const eventStagesSheetData = [];
// 6. EventRewards Sheet Data
const eventRewardsSheetData = [];

cardsData.forEach(card => {
    if (card.이벤트) {
        ['1단계', '2단계', '3단계'].forEach(stageKey => {
            const stageData = card.이벤트[stageKey];
            if (stageData) {
                // Event Stages
                eventStagesSheetData.push({
                    '아이디': card.아이디,
                    '카드': card.이름,
                    '단계': stageKey,
                    '선택지A_텍스트': stageData.이름_선택지?.선택지A || '',
                    '선택지B_텍스트': stageData.이름_선택지?.선택지B || ''
                });

                // Event Rewards
                ['선택지A', '선택지B'].forEach(choiceKey => {
                    const choiceData = stageData[choiceKey];
                    if (choiceData) {
                        choiceData.forEach(conditionData => {
                            const condition = conditionData.여부; // 고정, 성공, 실패
                            if (conditionData.획득 && conditionData.획득.length > 0) {
                                conditionData.획득.forEach(reward => {
                                    eventRewardsSheetData.push({
                                        '아이디': card.아이디,
                                        '카드': card.이름,
                                        '단계': stageKey,
                                        '선택지': choiceKey,
                                        '조건': condition,
                                        '보상_타입': reward.타입,
                                        '보상_수치': reward.수치
                                    });
                                });
                            } else {
                                // Empty reward case to preserve structure if needed, or skip
                                // For now, let's skip empty rewards to keep it clean, 
                                // but if we need to show "None", we can add it.
                                // Let's add an entry with empty values if it's "고정" and empty, to show it exists?
                                // Actually, if it's empty, it just means no reward.
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

const journeySheet = XLSX.utils.json_to_sheet(journeySheetData);
XLSX.utils.book_append_sheet(wb, journeySheet, 'Journey');

const trainingSheet = XLSX.utils.json_to_sheet(trainingSheetData);
XLSX.utils.book_append_sheet(wb, trainingSheet, 'Training');

const resonanceSheet = XLSX.utils.json_to_sheet(resonanceSheetData);
XLSX.utils.book_append_sheet(wb, resonanceSheet, 'Resonance');

const eventStagesSheet = XLSX.utils.json_to_sheet(eventStagesSheetData);
XLSX.utils.book_append_sheet(wb, eventStagesSheet, 'EventStages');

const eventRewardsSheet = XLSX.utils.json_to_sheet(eventRewardsSheetData);
XLSX.utils.book_append_sheet(wb, eventRewardsSheet, 'EventRewards');

// Write to file
XLSX.writeFile(wb, outputPath);
console.log(`Exported cards data to ${outputPath}`);
