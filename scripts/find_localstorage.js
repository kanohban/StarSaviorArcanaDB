const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../assets/index-DrY0adZU.js');
try {
    const content = fs.readFileSync(filePath, 'utf8');
    const regex = /localStorage\.(getItem|setItem)\s*\(\s*["']([^"']+)["']/g;

    let match;
    while ((match = regex.exec(content)) !== null) {
        console.log(`Found ${match[1]} with key: ${match[2]}`);
    }
} catch (e) {
    console.error(e);
}
