const fs = require('fs');
const path = require('path');

const cardsPath = path.join(__dirname, 'data', 'cards.json');
const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

const typeOrder = ['힘', '체력', '인내', '집중', '보호'];
const rarityWeight = { 'SSR': 3, 'SR': 2, 'R': 1 };

// Simulate the sort
const sortedCards = cards.filter(c => true).sort((a, b) => {
    // 1. Sort by Type
    const typeA = (a.타입 && a.타입.훈련) ? a.타입.훈련.trim() : '';
    const typeB = (b.타입 && b.타입.훈련) ? b.타입.훈련.trim() : '';
    const indexA = typeOrder.indexOf(typeA);
    const indexB = typeOrder.indexOf(typeB);

    // If both are in the known list, sort by index
    if (indexA !== -1 && indexB !== -1) {
        if (indexA !== indexB) return indexA - indexB;
    }
    // If only one is in the list, put it first
    else if (indexA !== -1) return -1;
    else if (indexB !== -1) return 1;

    // 2. Sort by Rarity
    const weightA = rarityWeight[a.레어도] || 0;
    const weightB = rarityWeight[b.레어도] || 0;
    if (weightA !== weightB) {
        return weightB - weightA; // Descending Rarity
    }

    // 3. Sort by ID
    return a.아이디 - b.아이디;
});

// Print first 20 results
console.log("Sort Order: Type > Rarity");
sortedCards.slice(0, 20).forEach(c => {
    const type = c.타입 ? c.타입.훈련 : 'None';
    console.log(`[${type}] [${c.레어도}] ${c.이름}`);
});
