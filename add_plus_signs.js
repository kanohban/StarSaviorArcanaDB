const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public/data/cards.json');
const rawData = fs.readFileSync(filePath, 'utf8');
let cards = JSON.parse(rawData);

function formatValue(val) {
    if (typeof val !== 'string') return val;
    // If it's a number string (e.g., "5", "10") and positive, add +
    // Ignore if it already has +, -, or is not a pure number (unless it's like "5%" -> "+5%")
    // Regex: Start with a digit, optional %, optional text? No, user said "5" -> "+5".
    // Let's be safe: if it parses as a positive number and doesn't start with +, add it.

    // Check if it looks like a number start
    if (/^\d/.test(val)) {
        // It starts with a digit.
        return '+' + val;
    }
    return val;
}

function traverse(obj) {
    if (!obj) return;
    if (typeof obj === 'object') {
        if (Array.isArray(obj)) {
            obj.forEach(item => traverse(item));
        } else {
            // Check if this object is a choice object with "수치"
            if (obj.hasOwnProperty('수치')) {
                obj['수치'] = formatValue(obj['수치']);
            }
            Object.values(obj).forEach(val => traverse(val));
        }
    }
}

traverse(cards);

fs.writeFileSync(filePath, JSON.stringify(cards, null, 2), 'utf8');
console.log('Added + signs to positive values.');
