const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '../data/savior_data.json');

try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    let count = 0;

    for (const key in data) {
        if (data[key].flavorText) {
            delete data[key].flavorText;
            count++;
        }
    }

    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Removed flavorText from ${count} entries.`);
} catch (err) {
    console.error('Error:', err);
}
