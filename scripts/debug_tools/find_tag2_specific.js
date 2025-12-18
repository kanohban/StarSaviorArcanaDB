const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./data/item.json', 'utf8'));
// Filter for Tag 2 AND obt_place != 4
const items = data.filter(item => {
    if (item.tag !== 2) return false;

    // Check obt_place
    // obt_place might be 4, or "4", or "0,1" etc.
    // We want to find cases where it includes something OTHER than 4.
    const places = String(item.obt_place).split(',').map(s => s.trim());
    const hasSpecific = places.some(p => p !== '4');

    return hasSpecific;
});

console.log(`Found ${items.length} Tag 2 items with specific places.`);
items.forEach(item => {
    console.log(`ID: ${item.id}, Name: ${item.name}, Place: ${item.obt_place}, Req: ${item.req_journey_name || "NONE"}`);
});
