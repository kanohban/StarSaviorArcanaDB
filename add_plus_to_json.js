const fs = require('fs');

const filePath = './public/data/cards.json';

try {
    const data = fs.readFileSync(filePath, 'utf8');
    let cards = JSON.parse(data);

    let updatedCount = 0;

    const addPlus = (val) => {
        if (typeof val === 'number' && val > 0) {
            return `+${val}`;
        }
        if (typeof val === 'string' && !val.startsWith('+') && !val.startsWith('-') && !isNaN(parseFloat(val)) && parseFloat(val) > 0) {
            return `+${val}`;
        }
        return val;
    };

    cards = cards.map(card => {
        // Update '여정' (Start Effects)
        if (card['여정']) {
            card['여정'] = card['여정'].map(item => ({
                ...item,
                '수치': addPlus(item['수치'])
            }));
        }

        // Update '훈련' (Training Bonus)
        if (card['훈련']) {
            card['훈련'] = card['훈련'].map(item => ({
                ...item,
                '수치': addPlus(item['수치'])
            }));
        }

        // Update '감응' (Resonance Training)
        if (card['감응']) {
            card['감응'] = card['감응'].map(item => ({
                ...item,
                '수치': addPlus(item['수치'])
            }));
        }

        // Update '지원' (Support Request)
        if (card['지원'] && card['지원']['수치']) {
            card['지원']['수치'] = addPlus(card['지원']['수치']);
        }

        updatedCount++;
        return card;
    });

    fs.writeFileSync(filePath, JSON.stringify(cards, null, 2), 'utf8');
    console.log(`Successfully updated ${updatedCount} cards with plus signs.`);

} catch (err) {
    console.error('Error updating JSON:', err);
}
