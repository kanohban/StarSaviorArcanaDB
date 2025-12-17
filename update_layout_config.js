const fs = require('fs');

const configPath = './data/layout_config.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const itemButton = {
    "type": "button",
    "icon": "<img src='images/index/search.png' style='width: 100%; height: 100%; object-fit: contain;'>",
    "title": "아이템",
    "action": "navigate",
    "target": "item.html"
};

// Add item button to all existing pages
Object.keys(config.pages).forEach(pageKey => {
    const page = config.pages[pageKey];
    // Check if button already exists to prevent duplicates
    const exists = page.left.some(btn => btn.target === 'item.html');
    if (!exists) {
        page.left.push(itemButton);
    }
});

// Create item page config
// It should include all other links.
// We can copy the 'index' page links and just add/remove what's needed, 
// but easier to just take the "index" page's updated links (which now has item) 
// and remove "item" self-link if we want, or keep it (other pages have self-links? No, they don't seem to link to themselves strictly? 
// Actually they DO link to others. 'index' has link to 'savior', 'journey' etc.
// 'savior' has link to 'arcana', 'deck', 'journey' etc. It does NOT link to 'savior'.
// So for 'item' page, we should list everything EXCEPT 'item'.

const allButtons = [
    {
        "type": "button",
        "icon": "<img src='images/index/arcana.png' style='width: 100%; height: 100%; object-fit: contain;'>",
        "title": "아르카나",
        "action": "navigate",
        "target": "arcana.html"
    },
    {
        "type": "button",
        "icon": "<img src='images/index/savior.png' style='width: 100%; height: 100%; object-fit: contain;'>",
        "title": "구원자",
        "action": "navigate",
        "target": "savior.html"
    },
    {
        "type": "button",
        "icon": "<img src='images/index/journey.png' style='width: 100%; height: 100%; object-fit: contain;'>",
        "title": "여정",
        "action": "navigate",
        "target": "journey.html"
    },
    {
        "type": "button",
        "icon": "<img src='images/index/deck.png' style='width: 100%; height: 100%; object-fit: contain;'>",
        "title": "덱 구성",
        "action": "navigate",
        "target": "deck.html"
    },
    {
        "type": "button",
        "icon": "<img src='images/index/schedule.png' style='width: 100%; height: 100%; object-fit: contain;'>",
        "title": "스케줄러",
        "action": "navigate",
        "target": "scheduler.html"
    },
    {
        "type": "button",
        "icon": "<img src='images/index/search.png' style='width: 100%; height: 100%; object-fit: contain;'>",
        "title": "가챠",
        "action": "navigate",
        "target": "gacha.html"
    }
];

// Item page config
config.pages["item"] = {
    "title": "아이템",
    "left": allButtons,
    "right": [
        { "type": "theme-toggle" },
        { "type": "view-toggle" }
    ]
};

// Also we need to make sure we didn't add 'item' link to 'item' page in the loop above?
// The loop ran on Object.keys(config.pages) BEFORE we added "item". So it's fine.

fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
console.log('Updated layout_config.json');
