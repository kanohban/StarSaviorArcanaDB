const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '여정, 아르카나 선택지 족보.xlsx');
const workbook = XLSX.readFile(filePath);

const resultData = {};

const sheetsToProcess = [
    { name: '여정, 리세트 이벤트', key: 'journey' },
    { name: '아가논, 플로라, 칼라이드, 조우, 날씨 이벤트', key: 'aganon' }
];

function parseAndAssignResult(choice, text) {
    if (!text) return;
    text = text.toString().trim();

    // Case 1: Merged "Success : ... / Failure : ..."
    if (text.includes('성공 :') && text.includes('실패 :')) {
        const parts = text.split('실패 :');
        const successPart = parts[0].replace('성공 :', '').trim();
        const failurePart = parts[1].trim();

        choice.result_positive = (choice.result_positive ? choice.result_positive + '\n' : '') + successPart.replace(/\/$/, '').trim();
        choice.result_negative = (choice.result_negative ? choice.result_negative + '\n' : '') + failurePart;
        return;
    }

    // Case 2: Starts with "성공 :" or "성공"
    if (text.startsWith('성공 :') || text.startsWith('성공')) {
        const cleanText = text.replace(/^성공\s*[:]?\s*/, '').trim();
        choice.result_positive = (choice.result_positive ? choice.result_positive + '\n' : '') + cleanText;
        return;
    }

    // Case 3: Starts with "실패 :" or "실패"
    if (text.startsWith('실패 :') || text.startsWith('실패')) {
        const cleanText = text.replace(/^실패\s*[:]?\s*/, '').trim();
        choice.result_negative = (choice.result_negative ? choice.result_negative + '\n' : '') + cleanText;
        return;
    }

    // Case 4: Starts with "대성공"
    if (text.startsWith('대성공')) {
        const cleanText = text.replace(/^대성공\s*[:]?\s*/, '').trim();
        choice.result_positive = (choice.result_positive ? choice.result_positive + '\n' : '') + '[대성공] ' + cleanText;
        return;
    }

    // Case 5: Generic Result
    choice.result = (choice.result ? choice.result + '\n' : '') + text;
}

sheetsToProcess.forEach(sheetInfo => {
    const sheet = workbook.Sheets[sheetInfo.name];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const events = [];
    let currentCategory = '';
    let currentEvent = null;

    // Start from row 1 (index 1) to skip header
    for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;

        // Columns: [0] Category/Condition, [1] Event Name/Timing, [2] Choice, [3] Result
        const col0 = row[0]; // Category or Condition
        const col1 = row[1]; // Event Name or Timing
        const choiceText = row[2];
        const result = row[3];

        // Check if choice starts with "1." -> New Event
        const isFirstChoice = choiceText && typeof choiceText === 'string' && choiceText.trim().startsWith('1');

        if (choiceText) {
            if (isFirstChoice) {
                // New Event
                if (col0) currentCategory = col0;
                const eventName = col1 || 'Unknown Event';

                currentEvent = {
                    category: currentCategory,
                    name: eventName,
                    timing: [],
                    condition: [],
                    choices: []
                };
                events.push(currentEvent);
            } else {
                // Subsequent choices: Check for Timing (Col 1) and Condition (Col 0)
                if (currentEvent) {
                    if (col1) currentEvent.timing.push(col1);
                    if (col0) currentEvent.condition.push(col0);
                }
            }

            // Add choice to current event (or create new if missing)
            if (!currentEvent) {
                currentEvent = {
                    category: currentCategory || 'Unknown',
                    name: col1 || 'Unknown',
                    timing: [],
                    condition: [],
                    choices: []
                };
                events.push(currentEvent);
            }

            const newChoice = {
                text: choiceText,
                result: '', // Generic
                result_positive: '',
                result_negative: ''
            };

            parseAndAssignResult(newChoice, result);
            currentEvent.choices.push(newChoice);

        } else if (result && currentEvent && currentEvent.choices.length > 0) {
            // No choice text, but has result -> Append to last choice
            const lastChoice = currentEvent.choices[currentEvent.choices.length - 1];
            parseAndAssignResult(lastChoice, result);

            // Also check for timing/condition on these rows just in case
            if (col1) currentEvent.timing.push(col1);
            if (col0) currentEvent.condition.push(col0);
        }
    }


    // Distribute events to new categories
    let resetteSplitFound = false;

    events.forEach(event => {
        // Flatten timing and condition arrays to strings
        event.timing = [...new Set(event.timing)].join(', ');
        event.condition = [...new Set(event.condition)].join(', ');

        const cat = event.category || '';
        const name = event.name || '';

        if (cat.includes('여정')) {
            if (!resultData.journey) resultData.journey = [];
            resultData.journey.push(event);
        } else if (cat.includes('리세트')) {
            if (name.includes('리세트의 유혹')) {
                resetteSplitFound = true;
                if (!resultData.resette) resultData.resette = [];
                resultData.resette.push(event);
            } else if (resetteSplitFound) {
                // After Resette's Temptation -> Subjugation
                if (!resultData.subjugation) resultData.subjugation = [];
                resultData.subjugation.push(event);
            } else {
                if (!resultData.resette) resultData.resette = [];
                resultData.resette.push(event);
            }
        } else if (cat.includes('합숙 훈련 - 플로라')) {
            if (!resultData.flora) resultData.flora = [];
            resultData.flora.push(event);
        } else if (cat.includes('합숙 훈련 - 칼라이드')) {
            if (!resultData.kalide) resultData.kalide = [];
            resultData.kalide.push(event);
        } else if (cat.includes('원정 평가전 - 아가논')) {
            if (!resultData.aganon) resultData.aganon = [];
            resultData.aganon.push(event);
        } else if (cat.includes('날씨')) {
            if (!resultData.weather) resultData.weather = [];
            resultData.weather.push(event);
        } else if (cat.includes('조우')) {
            if (name.includes('슬라임')) {
                if (!resultData.aganon) resultData.aganon = [];
                resultData.aganon.push(event);
            } else if (name.includes('약탈자')) {
                if (!resultData.flora) resultData.flora = [];
                resultData.flora.push(event);
            } else if (name.includes('강도')) {
                if (!resultData.kalide) resultData.kalide = [];
                resultData.kalide.push(event);
            } else {
                if (!resultData.aganon) resultData.aganon = [];
                resultData.aganon.push(event);
            }
        } else {
            // Fallback
            if (!resultData.journey) resultData.journey = [];
            resultData.journey.push(event);
        }
    });
});

const outputPath = path.join(__dirname, '..', 'data', 'journey_data.json');
fs.writeFileSync(outputPath, JSON.stringify(resultData, null, 2), 'utf8');
console.log(`Converted data saved to ${outputPath}`);
