const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public/data/cards.json');
const rawData = fs.readFileSync(filePath, 'utf8');
let cards = JSON.parse(rawData);

cards.forEach(card => {
    if (card['이벤트']) {
        Object.keys(card['이벤트']).forEach(stageKey => {
            const oldEvents = card['이벤트'][stageKey];

            // Skip if already migrated (not an array)
            if (!Array.isArray(oldEvents)) return;

            const newStage = {
                "선택지A": [],
                "선택지B": []
            };

            oldEvents.forEach(ev => {
                const num = ev['번호'];

                // Process Choice A
                if (ev['선택지A']) {
                    if (Array.isArray(ev['선택지A'])) {
                        // Multiple effects
                        newStage['선택지A'].push({
                            "번호": num,
                            "효과": ev['선택지A']
                        });
                    } else {
                        // Single effect
                        newStage['선택지A'].push({
                            "번호": num,
                            ...ev['선택지A']
                        });
                    }
                }

                // Process Choice B
                if (ev['선택지B']) {
                    if (Array.isArray(ev['선택지B'])) {
                        newStage['선택지B'].push({
                            "번호": num,
                            "효과": ev['선택지B']
                        });
                    } else {
                        newStage['선택지B'].push({
                            "번호": num,
                            ...ev['선택지B']
                        });
                    }
                }
            });

            // Update the stage data
            card['이벤트'][stageKey] = newStage;
        });
    }
});

fs.writeFileSync(filePath, JSON.stringify(cards, null, 2), 'utf8');
console.log('Migration completed successfully.');
