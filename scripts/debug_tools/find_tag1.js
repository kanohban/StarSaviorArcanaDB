const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./data/item.json', 'utf8'));
const tag1Items = data.filter(item => item.tag === 1);

console.log(`Found ${tag1Items.length} Tag 1 items.`);
tag1Items.forEach(item => {
    console.log(`ID: ${item.id}, Name: ${item.name}, Req: ${item.req_journey_name || "NONE"}`);
});
