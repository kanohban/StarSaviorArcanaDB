const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'journey_data.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const categories = new Set();

// Check 'journey' array
if (data.journey) {
    data.journey.forEach(e => categories.add(e.category));
}

// Check 'aganon' array
if (data.aganon) {
    data.aganon.forEach(e => categories.add(e.category));
}

console.log('Unique Categories:', Array.from(categories));
