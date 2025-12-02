const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../assets/index-DrY0adZU.js');
try {
    const content = fs.readFileSync(filePath, 'utf8');
    const term = 'hits';
    console.log(`\n--- Searching for: ${term} ---`);
    let index = content.indexOf(term);
    while (index !== -1) {
        console.log(`Match at ${index}:`);
        console.log(content.substring(Math.max(0, index - 100), Math.min(content.length, index + 200)));
        index = content.indexOf(term, index + 1);
    }
} catch (e) {
    console.error(e);
}
