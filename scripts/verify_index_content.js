const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'assets', 'index-DrY0adZU.js');
const content = fs.readFileSync(filePath, 'utf8');

const idx = content.indexOf('journey-link');
if (idx !== -1) {
    console.log('Found "journey-link" at index:', idx);
    const start = Math.max(0, idx - 100);
    const end = Math.min(content.length, idx + 300);
    console.log('Context:');
    console.log(content.substring(start, end));
} else {
    console.log('"journey-link" NOT found.');
}
