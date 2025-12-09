let gachaData = {};
let allCards = [];
let currentBanner = '구원자-통상';

// Load Data on Init
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const [gachaRes, cardsRes] = await Promise.all([
            fetch('./data/gacha_data.json'),
            fetch('./data/cards.json')
        ]);

        if (!gachaRes.ok || !cardsRes.ok) throw new Error('Failed to load data');

        gachaData = await gachaRes.json();
        allCards = await cardsRes.json();

        // Init Button State
        const defaultTab = document.querySelector('.banner-tab[data-banner="구원자-통상"]');
        if (defaultTab) defaultTab.classList.add('active');

    } catch (e) {
        console.error(e);
    }

    // Bind Tabs
    document.querySelectorAll('.banner-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            // Update Active Class
            document.querySelectorAll('.banner-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update State
            currentBanner = btn.dataset.banner;

            // UI Update: No title/desc update needed as per user request
            // If there were other UI elements to reset, do it here
        });
    });
});

// ----------------------------------------------------
// Image Name Formatting Logic
// ----------------------------------------------------
function formatArcanaImageName(name) {
    // Replace spaces, commas, dots, question marks, exclamation marks with underscores
    return name.replace(/[ ,.?!]/g, '_');
}

async function pullGacha(count) {
    if (!gachaData[currentBanner]) {
        alert('데이터가 준비되지 않았습니다.');
        return;
    }

    const pool = gachaData[currentBanner];
    const results = [];

    // Helper to get random R card
    const getRandomRCard = () => {
        const rCards = allCards.filter(c => c.레어도 === 'R');
        if (rCards.length === 0) return { 등급: 'R', 이름: '아르카나' };
        const randCard = rCards[Math.floor(Math.random() * rCards.length)];
        return { 등급: 'R', 이름: randCard.이름, origin: 'card' };
    };

    for (let i = 0; i < count; i++) {
        let item = drawOne(pool);

        // If result is generic "아르카나" (R grade), replace with actual random R card
        if (item.등급 === 'R' && item.이름 === '아르카나') {
            item = getRandomRCard();
        }

        results.push(item);
    }

    renderResults(results);
}

function drawOne(pool) {
    const rand = Math.random();
    let cumulative = 0;

    for (const item of pool) {
        cumulative += parseFloat(item.확률);
        if (rand < cumulative) {
            return { ...item };
        }
    }
    return { ...pool[pool.length - 1] };
}

function renderResults(results) {
    const grid = document.getElementById('result-area');
    grid.innerHTML = '';

    results.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = `gacha-card rarity-${item.등급}`;
        card.style.animationDelay = `${index * 100}ms`;

        // Revised Logic: Check precise card type
        const isSaviorBanner = currentBanner.startsWith('구원자');

        // Normalize helper for comparison (remove spaces, special chars)
        const normalize = (str) => str ? str.replace(/[_\s,.?!]/g, '') : '';
        const targetName = normalize(item.이름);

        // 1. Check if name exists in allCards (Arcana DB) by normalized match
        const foundArcana = allCards.find(c => normalize(c.이름) === targetName);

        // 2. Explicitly handle generic "Arcana" placeholder
        const isGenericArcana = item.이름 === '아르카나';

        // 3. Determine if Arcana
        // If it's in Arcana DB OR it's generic "Arcana" OR origin is card -> Arcana
        if (foundArcana || isGenericArcana || item.origin === 'card' || (!isSaviorBanner && !item.origin)) {
            // It is an Arcana
            const formattedName = isGenericArcana ? '아르카나' : formatArcanaImageName(item.이름);
            // If specific card image exists, use it. If generic, use placeholder if needed (but usually handled by logic)
            // Note: The original logic treated '아르카나' text name as image name if not substituted.

            // If it is generic Arcana, we might not have '아르카나.png' in cards folder? 
            // Actually, previous logic just used formattedName. Let's stick to that.
            imgPath = `./images/cards/${formattedName}.png`;
            isArcana = true;
        } else {
            // It is a Savior
            imgPath = `./images/illust/${item.이름}.webp`;
            isArcana = false;
        }

        const imgError = `this.style.display='none'; console.warn('Missing image:', '${imgPath}');`;

        // Add special class if Arcana (Force black bg)
        if (isArcana) {
            card.classList.add('is-arcana');
        }

        // Determine Font Scaling Class
        let textClass = 'gacha-card-name';
        const nameLen = item.이름.length;

        // Thresholds based on "고양이는 웃지 않는다" (~11 chars) width
        if (nameLen > 11) {
            if (nameLen > 14) {
                textClass += ' text-xlong';
            } else {
                textClass += ' text-long';
            }
        }

        card.innerHTML = `
            <div class="gacha-fallback-text">${item.이름}</div>
            <img src="${imgPath}" class="gacha-card-img" onerror="${imgError}">
            <div class="${textClass}">${item.이름}</div>
        `;

        grid.appendChild(card);
    });
}
