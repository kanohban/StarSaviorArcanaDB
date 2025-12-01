const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public/data/cards.json');
const rawData = fs.readFileSync(filePath, 'utf8');
let cards = JSON.parse(rawData);

let errors = [];

cards.forEach((card, idx) => {
    if (!card['타입']) {
        errors.push(`Card ${idx} (${card['이름']}) missing '타입'`);
    } else if (!card['타입']['훈련']) {
        // This might be okay if it's optional, but App.jsx accesses it.
        // App.jsx checks: card['타입'] && card['타입']['훈련'] in filter, but
        // in render: {card['타입']['훈련'] && ...}
        // If card['타입'] exists but is empty object, card['타입']['훈련'] is undefined, which is falsy, so safe.
        // But if card['타입'] is null/undefined, App.jsx crashes.
    }
});

if (errors.length > 0) {
    console.error('Data Integrity Errors:', errors);
} else {
    console.log('Data Integrity Check Passed: All cards have "타입" object.');
}
