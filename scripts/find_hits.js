const fs = require('fs');
const path = require('path');

function searchDir(dir, term) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                searchDir(filePath, term);
            }
        } else {
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                if (content.includes(term)) {
                    console.log(`Found in ${filePath}`);
                    const index = content.indexOf(term);
                    console.log(content.substring(Math.max(0, index - 100), Math.min(content.length, index + 200)));
                }
            } catch (e) {
                // Ignore binary files or errors
            }
        }
    });
}

searchDir(path.join(__dirname, '../'), 'hits.seeyoufarm.com');
