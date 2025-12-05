const fs = require('fs');
const path = require('path');

const rawDataPath = path.join(__dirname, '../data/savior_raw.json');
const outputPath = path.join(__dirname, '../data/savior_data.json');

try {
    const rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));
    const saviors = {};

    // 1. Process Profile
    if (rawData['프로필']) {
        rawData['프로필'].forEach(entry => {
            const name = entry['이름'];
            if (!name) return;
            saviors[name] = {
                id: name,
                profile: entry,
                skills: {},
                stats: {},
                flavorText: []
            };
        });
    }

    // 2. Process Skills
    if (rawData['스킬']) {
        rawData['스킬'].forEach(entry => {
            const name = entry['이름'];
            if (saviors[name]) {
                saviors[name].skills = entry;
            }
        });
    }

    // 3. Process Stats
    // The sheet name might vary, so we look for one starting with "스탯"
    const statSheetKey = Object.keys(rawData).find(key => key.startsWith('스탯'));
    if (statSheetKey && rawData[statSheetKey]) {
        rawData[statSheetKey].forEach(entry => {
            const name = entry['이름'];
            if (saviors[name]) {
                saviors[name].stats = entry;
            }
        });
    }

    // 4. Process Flavor Text
    const flavorSheetKey = Object.keys(rawData).find(key => key.includes('플레이버') || key.includes('Flavor'));
    if (flavorSheetKey && rawData[flavorSheetKey]) {
        rawData[flavorSheetKey].forEach(entry => {
            const name = entry['이름'];
            if (saviors[name]) {
                // Assuming structure: { 이름: '...', 키워드: '...', 내용: '...' }
                saviors[name].flavorText.push(entry);
            }
        });
    }

    // Convert to array or keep as object? Object is easier for lookup.
    // But for listing, array is good. Let's keep as object but maybe add an array export if needed.
    // Actually, let's just save the object.

    fs.writeFileSync(outputPath, JSON.stringify(saviors, null, 2));
    console.log(`Successfully processed data to ${outputPath}`);
    console.log(`Processed ${Object.keys(saviors).length} saviors.`);

} catch (error) {
    console.error('Error processing data:', error);
}
