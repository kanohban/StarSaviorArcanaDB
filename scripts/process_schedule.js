const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../여정 시트 정리.xlsx');
const outputPath = path.join(__dirname, '../data/schedule_data.json');

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // Read raw data
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const scheduleData = [];
    let currentPeriod = null;
    let currentTurn = null;

    // Helper to extract Type and Content
    // Example: "(인자 계승)인자 계승" -> type: "인자 계승", content: "인자 계승"
    const parseEvent = (eventStr) => {
        if (!eventStr) return null;
        let tempStr = eventStr.trim();
        const types = [];

        // Extract logical types like (A)(B)
        while (tempStr.startsWith('(')) {
            const endIdx = tempStr.indexOf(')');
            if (endIdx === -1) break; // Malformed
            const type = tempStr.substring(1, endIdx).trim();
            types.push(type);
            tempStr = tempStr.substring(endIdx + 1).trim();
        }

        if (types.length > 0) {
            return {
                type: types.join(','),
                content: tempStr,
                original: eventStr
            };
        }

        return {
            type: '기타',
            content: eventStr,
            original: eventStr
        };
    };

    console.log(`Processesing ${rawData.length} rows...`);

    rawData.forEach((row, index) => {
        // Row structure seems to be: [Period, Turn/Date, Event] based on inspection
        // But merged cells might mean Period is only in the first row of the period

        // Column 0: Period
        if (row[0]) {
            currentPeriod = {
                title: row[0],
                turns: []
            };
            scheduleData.push(currentPeriod);
            currentTurn = null; // Reset turn when new period starts? 
            // Actually, a period has multiple turns.
        }

        // Special Handling for Flora/Kalide Period
        const isBranchPeriod = currentPeriod && currentPeriod.title.includes('플로라');

        if (isBranchPeriod) {

            // Check for Turn in Column 1 (Turn 30 case)
            if (row[1]) {
                let turnStr = row[1];
                let dateStr = '';
                if (turnStr.includes('/')) {
                    const parts = turnStr.split('/');
                    turnStr = parts[0].trim();
                    dateStr = parts.length > 1 ? parts[1].trim() : '';
                }
                currentTurn = {
                    turnInfo: turnStr,
                    dateInfo: dateStr,
                    events: []
                };
                currentPeriod.turns.push(currentTurn);
            }
            // Check for Turn in Column 2 (Turn 31+ case)
            else if (row[2] && (row[2].includes('턴') || row[2].includes('월'))) {
                let turnStr = row[2];
                let dateStr = '';
                if (turnStr.includes('/')) {
                    const parts = turnStr.split('/');
                    turnStr = parts[0].trim();
                    dateStr = parts.length > 1 ? parts[1].trim() : '';
                }
                currentTurn = {
                    turnInfo: turnStr,
                    dateInfo: dateStr,
                    events: []
                };
                currentPeriod.turns.push(currentTurn);
            }
            // Check for Common Event in Column 2 (e.g. Turn 30 event)
            else if (row[2]) {
                const ev = parseEvent(row[2]);
                if (ev && !ev.original.includes('[플로라]') && !ev.original.includes('[칼라이드]')) {
                    if (currentTurn) currentTurn.events.push(ev);
                }
            }

            // Events in Col 3 (Flora)
            if (row[3]) {
                const ev = parseEvent(row[3]);
                if (ev && !ev.original.includes('[플로라]')) {
                    ev.branch = 'flora';
                    if (currentTurn) currentTurn.events.push(ev);
                }
            }
            // Events in Col 5 (Kalide)
            if (row[5]) {
                const ev = parseEvent(row[5]);
                if (ev && !ev.original.includes('[칼라이드]')) {
                    ev.branch = 'kalide';
                    if (currentTurn) currentTurn.events.push(ev);
                }
            }
        } else {
            // Standard Logic
            if (row[1]) {
                let turnStr = row[1];
                let dateStr = '';
                if (turnStr.includes('/')) {
                    const parts = turnStr.split('/');
                    turnStr = parts[0].trim();
                    dateStr = parts.length > 1 ? parts[1].trim() : '';
                }
                currentTurn = {
                    turnInfo: turnStr,
                    dateInfo: dateStr,
                    events: []
                };
                if (currentPeriod) currentPeriod.turns.push(currentTurn);
                else console.warn(`Row ${index}: Found turn "${row[1]}" without a Period!`);
            }
        }

        // Column 2: Event
        if (row[2] && !isBranchPeriod) {
            const eventObj = parseEvent(row[2]);
            if (currentTurn) {
                currentTurn.events.push(eventObj);
            } else {
                // It's possible to have an event without a turn if it belongs to the period directly?
                // Or maybe the first row has Period, Turn, AND Event
                // Let's check logic.
                // If row has Period, it might also have Turn and Event.
                // If row has Turn, it might also have Event.

                // If currentTurn is still null but we have an event, 
                // it might mean the turn was defined in the same row as Period?
                // Previous logic: if(row[0]) -> make period. if(row[1]) -> make turn.
                // If row[0] and row[1] are both present, we make period then turn. Correct.

                if (currentPeriod && currentPeriod.turns.length > 0) {
                    // Fallback: add to last turn
                    currentPeriod.turns[currentPeriod.turns.length - 1].events.push(eventObj);
                } else {
                    console.warn(`Row ${index}: Found event "${row[2]}" without a Turn!`);
                }
            }
        }
    });

    // Cleanup: Remove empty periods or turns if any (optional)

    // Cleanup: Remove 'original' field from all events
    scheduleData.forEach(period => {
        period.turns.forEach(turn => {
            turn.events.forEach(ev => {
                delete ev.original;
            });
        });
    });

    fs.writeFileSync(outputPath, JSON.stringify(scheduleData, null, 2), 'utf8');
    console.log(`Successfully generated ${outputPath}`);
    console.log(`Total Periods: ${scheduleData.length}`);

} catch (err) {
    console.error('Error processing schedule:', err);
    process.exit(1);
}
