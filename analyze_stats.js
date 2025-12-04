const fs = require('fs');
const path = require('path');

const cardsPath = path.join(__dirname, 'data', 'cards.json');
const configPath = path.join(__dirname, 'data', 'stat_config.json');

const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const knownTypes = new Set([...config.globalTypes, ...config.categoryTypes, ...config.excludeTypes]);
const unclassified = new Map(); // Type -> Set of values

function processStat(type, value) {
    if (!type) return;
    // Normalize type (remove trailing spaces, etc. if needed)
    type = type.trim();

    if (knownTypes.has(type)) return;

    if (!unclassified.has(type)) {
        unclassified.set(type, new Set());
    }
    if (value) unclassified.get(type).add(value);
}

cards.forEach(card => {
    // Journey
    if (card.여정) {
        card.여정.forEach(s => processStat(s.타입, s.수치35 || s.수치50));
    }
    // Training
    if (card.훈련) {
        card.훈련.forEach(s => processStat(s.타입, s.수치35 || s.수치50));
    }
    // Resonance
    if (card.감응) {
        card.감응.forEach(s => processStat(s.타입, s.수치35 || s.수치50));
    }
    // Support
    if (card.지원) {
        card.지원.forEach(s => processStat(s.타입, s.수치35 || s.수치50));
    }
    // Event
    if (card.이벤트) {
        ['1단계', '2단계', '3단계'].forEach(stage => {
            if (card.이벤트[stage]) {
                ['선택지A', '선택지B'].forEach(choice => {
                    if (card.이벤트[stage][choice]) {
                        card.이벤트[stage][choice].forEach(outcome => {
                            if (outcome.획득) {
                                outcome.획득.forEach(reward => processStat(reward.타입, reward.수치));
                            }
                        });
                    }
                });
            }
        });
    }
});

// Analyze formats
const result = [];
unclassified.forEach((values, type) => {
    let format = 'Unknown';
    let sample = '';

    // Check samples
    const samples = Array.from(values).filter(v => v);
    if (samples.length > 0) {
        sample = samples[0];
        const isPercent = samples.every(v => v.includes('%'));
        const isNumber = samples.every(v => !isNaN(parseFloat(v.replace(/[+%]/g, ''))));
        const hasDecimal = samples.some(v => v.includes('.'));

        if (isPercent) {
            format = 'Percentage'; // e.g. +5.00%
        } else if (isNumber) {
            format = hasDecimal ? 'Decimal' : 'Integer'; // e.g. +5 or +5.5
        } else {
            format = 'String'; // e.g. "Some Text"
        }
    }

    result.push({ type, format, sample });
});

console.log(JSON.stringify(result, null, 2));
