let gachaData = {};
let allCards = [];
let gachaImageConfig = {};
let currentBanner = '구원자-통상';

// New State
let currentGroup = 'savior';
let subType = 'standard';
let targetType = 'savior';
let targetItem = '';
let isTargeting = false;
let targetingLoop = null;
let targetingCount = 0;
let targetFoundCount = 0;

// Drop Log State
let sessionDrops = {}; // { 'Name': { count: 1, grade: 'SSR' } }

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const [gachaRes, cardsRes, configRes] = await Promise.all([
            fetch('./data/gacha_data.json'),
            fetch('./data/cards.json'),
            fetch('./data/gacha_image_config.json').catch(() => ({ ok: false, json: () => ({}) }))
        ]);

        if (!gachaRes.ok || !cardsRes.ok) throw new Error('Failed to load data');

        gachaData = await gachaRes.json();
        allCards = await cardsRes.json();
        if (configRes.ok) gachaImageConfig = await configRes.json();

        initUI();
    } catch (e) {
        console.error(e);
    }
});

function initUI() {
    document.querySelectorAll('.banner-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.banner-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentGroup = btn.dataset.group;
            updateUIState();
        });
    });

    document.querySelectorAll('.sub-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sub-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            subType = btn.dataset.type;
            if (currentGroup === 'target') populateTargetSelect();
            updateUIState();
        });
    });

    const typeSelect = document.getElementById('target-select-type');
    typeSelect.addEventListener('change', (e) => {
        targetType = e.target.value;
        populateTargetSelect();
    });

    document.getElementById('target-select-item').addEventListener('change', (e) => {
        targetItem = e.target.value;
        // Clear warning on selection
        const statusEl = document.getElementById('target-status');
        if (statusEl.textContent.includes('선택해주세요')) {
            statusEl.innerHTML = '설정 후 시작하세요.';
            statusEl.style.color = '#fdcb6e';
        }
    });

    document.getElementById('btn-target-start').addEventListener('click', startTargeting);
    document.getElementById('btn-target-stop').addEventListener('click', stopTargeting);
    document.getElementById('btn-target-reset').addEventListener('click', resetTargetStats);

    populateTargetSelect();
    loadStats();
    renderDropLog(); // Init empty
}

function updateUIState() {
    const gachaControls = document.getElementById('gacha-controls');
    const targetControls = document.getElementById('target-controls');

    if (currentGroup === 'target') {
        gachaControls.classList.add('hidden');
        targetControls.classList.remove('hidden');
    } else {
        gachaControls.classList.remove('hidden');
        targetControls.classList.add('hidden');
    }

    if (currentGroup !== 'target') {
        const groupName = currentGroup === 'savior' ? '구원자' : '아르카나';
        const typeName = subType === 'standard' ? '통상' : '픽업';
        currentBanner = `${groupName}-${typeName}`;
    }
}

function populateTargetSelect() {
    const select = document.getElementById('target-select-item');
    select.innerHTML = '<option value="">대상 선택...</option>';

    const groupName = targetType === 'savior' ? '구원자' : '아르카나';
    const typeName = subType === 'standard' ? '통상' : '픽업';
    const bannerKey = `${groupName}-${typeName}`;

    const pool = gachaData[bannerKey];
    const items = new Set();

    if (pool) {
        pool.forEach(item => {
            if (item.등급 === 'SSR' || item.등급 === 'SR') {
                items.add(item.이름);
            }
        });
    }

    const sortedItems = Array.from(items).sort();
    sortedItems.forEach(name => {
        if (name === '아르카나') return;
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });
}

// ----------------------------------------------------
// Targeting Logic
// ----------------------------------------------------
function resetTargetStats() {
    targetingCount = 0;
    targetFoundCount = 0;
    resetStats();

    const statusEl = document.getElementById('target-status');
    statusEl.innerHTML = '초기화되었습니다. 대상을 선택하세요.';
    statusEl.style.color = '#fdcb6e';
}

async function startTargeting() {
    const statusEl = document.getElementById('target-status');

    if (!targetItem) {
        // [MODIFIED] No Alert. Use Status Text.
        statusEl.innerHTML = '⚠️ 노리기 대상을 먼저 선택해주세요!';
        statusEl.style.color = '#ff7675';

        const targetControls = document.getElementById('target-controls');
        // Simple visual feedback if CSS allowed, but logic is fine without it.
        return;
    }

    isTargeting = true;
    document.getElementById('btn-target-start').disabled = true;
    document.getElementById('btn-target-stop').disabled = false;
    document.getElementById('target-select-item').disabled = true;
    document.getElementById('target-select-type').disabled = true;

    document.querySelectorAll('.sub-tab').forEach(b => b.style.pointerEvents = 'none');

    const groupName = targetType === 'savior' ? '구원자' : '아르카나';
    const typeName = subType === 'standard' ? '통상' : '픽업';
    currentBanner = `${groupName}-${typeName}`;

    runTargetingLoop();
}

function stopTargeting() {
    isTargeting = false;
    clearTimeout(targetingLoop);
    document.getElementById('btn-target-start').disabled = false;
    document.getElementById('btn-target-stop').disabled = true;
    document.getElementById('target-select-item').disabled = false;
    document.getElementById('target-select-type').disabled = false;
    document.querySelectorAll('.sub-tab').forEach(b => b.style.pointerEvents = 'auto');

    const statusEl = document.getElementById('target-status');
    if (!statusEl.innerHTML.includes('획득!')) {
        statusEl.innerHTML = '정지됨.';
        statusEl.style.color = '#d63031';
    }
}

async function runTargetingLoop() {
    if (!isTargeting) return;

    // 1. Pull 10
    const results = await pullGacha(10, true);

    // 2. Update Target Stats
    targetingCount++;

    // 3. Check for Target
    let found = false;
    results.forEach(item => {
        if (item.이름 === targetItem) {
            found = true;
            targetFoundCount++;
        }
    });

    const statusEl = document.getElementById('target-status');

    if (found) {
        statusEl.innerHTML = `<b>목표 획득!</b> 총 ${targetingCount}회차`;
        statusEl.style.color = '#00b894';
        stopTargeting();
        return;
    } else {
        statusEl.innerHTML = `진행 중... ${targetingCount}회차`;
        statusEl.style.color = '#fdcb6e';
    }

    // 4. Continue Loop
    targetingLoop = setTimeout(runTargetingLoop, 100);
}

// ----------------------------------------------------
// Core Gacha Logic
// ----------------------------------------------------
function formatArcanaImageName(name) {
    return name.replace(/[ ,.?!]/g, '_');
}

async function pullGacha(count, isAuto = false) {
    if (!gachaData[currentBanner]) {
        return [];
    }

    const pool = gachaData[currentBanner];
    const results = [];

    const getRandomRCard = () => {
        const rCards = allCards.filter(c => c.레어도 === 'R');
        if (rCards.length === 0) return { 등급: 'R', 이름: '아르카나' };
        return { 등급: 'R', 이름: rCards[Math.floor(Math.random() * rCards.length)].이름, origin: 'card' };
    };

    for (let i = 0; i < count; i++) {
        let item = drawOne(pool);
        if (item.등급 === 'R' && item.이름 === '아르카나') {
            item = getRandomRCard();
        }
        results.push(item);
    }

    renderResults(results);
    updateStats(results);
    updateDropLog(results); // New Tracking

    return results;
}

function drawOne(pool) {
    const rand = Math.random();
    let cumulative = 0;
    for (const item of pool) {
        cumulative += parseFloat(item.확률);
        if (rand < cumulative) return { ...item };
    }
    return { ...pool[pool.length - 1] };
}

function renderResults(results) {
    const grid = document.getElementById('result-area');
    grid.innerHTML = '';

    results.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = `gacha-card rarity-${item.등급}`;
        card.style.animationDelay = `${index * 50}ms`;

        const isSaviorBanner = currentBanner.startsWith('구원자');
        const normalize = (str) => str ? str.replace(/[_\s,.?!]/g, '') : '';
        const targetName = normalize(item.이름);
        const foundArcana = allCards.find(c => normalize(c.이름) === targetName);
        const isGenericArcana = item.이름 === '아르카나';

        let isArcana = false;
        let imgPath = '';

        if (foundArcana || isGenericArcana || item.origin === 'card' || (!isSaviorBanner && !item.origin)) {
            const formattedName = isGenericArcana ? '아르카나' : formatArcanaImageName(item.이름);
            imgPath = `./images/cards/${formattedName}.png`;
            isArcana = true;
        } else {
            imgPath = `./images/illust/${item.이름}.webp`;
            isArcana = false;
        }

        const imgError = `this.style.display='none';`;
        if (isArcana) card.classList.add('is-arcana');

        let textClass = 'gacha-card-name';
        if (item.이름.length > 11) textClass += item.이름.length > 14 ? ' text-xlong' : ' text-long';

        let customStyle = '';
        const config = gachaImageConfig[item.이름];
        if (config) {
            const scale = config.scale !== undefined ? config.scale : 1.15;
            const originX = config.x || '50%';
            const originY = config.y || '50%';
            customStyle = `style="object-position: ${originX} ${originY}; transform: scale(${scale}) translateZ(0); transform-origin: ${originX} ${originY};"`;
        }

        if (targetItem && item.이름 === targetItem) {
            card.style.border = '3px solid #00b894';
            card.style.boxShadow = '0 0 15px #00b894';
        }

        card.innerHTML = `
            <div class="gacha-fallback-text">${item.이름}</div>
            <img src="${imgPath}" class="gacha-card-img" onerror="${imgError}" ${customStyle}>
            <div class="${textClass}">${item.이름}</div>
        `;
        grid.appendChild(card);
    });
}

// ----------------------------------------------------
// Stats Logic
// ----------------------------------------------------
let totalPulls = 0;
let ssrCount = 0;
let pickupCount = 0;

function loadStats() {
    totalPulls = parseInt(localStorage.getItem('gacha_total') || '0');
    ssrCount = parseInt(localStorage.getItem('gacha_ssr') || '0');
    pickupCount = parseInt(localStorage.getItem('gacha_pickup') || '0');
    updateStatsUI();
}

function saveStats() {
    localStorage.setItem('gacha_total', totalPulls);
    localStorage.setItem('gacha_ssr', ssrCount);
    localStorage.setItem('gacha_pickup', pickupCount);
}

function updateStatsUI() {
    document.getElementById('stat-total').textContent = totalPulls;
    document.getElementById('stat-ssr').textContent = ssrCount;

    const pickupEl = document.getElementById('stat-pickup');
    if (pickupEl) pickupEl.textContent = pickupCount;

    let ssrRatio = 0, pickupRatio = 0;
    if (totalPulls > 0) {
        ssrRatio = (ssrCount / totalPulls) * 100;
        pickupRatio = (pickupCount / totalPulls) * 100;
    }
    document.getElementById('stat-ratio').textContent = ssrRatio.toFixed(2) + '%';

    const pickupRatioEl = document.getElementById('stat-pickup-ratio');
    if (pickupRatioEl) pickupRatioEl.textContent = pickupRatio.toFixed(2) + '%';
}

function updateStats(results) {
    totalPulls += results.length;
    const newSSRs = results.filter(item => item.등급 === 'SSR');
    ssrCount += newSSRs.length;
    pickupCount += newSSRs.filter(item => item.이름 === '픽업').length;

    saveStats();
    updateStatsUI();
}

// ----------------------------------------------------
// Drop Log Logic
// ----------------------------------------------------
function updateDropLog(results) {
    results.forEach(item => {
        if (item.등급 === 'SSR' || item.등급 === 'SR') {
            if (!sessionDrops[item.이름]) {
                sessionDrops[item.이름] = { count: 0, grade: item.등급 };
            }
            sessionDrops[item.이름].count++;
        }
    });
    renderDropLog();
}

function renderDropLog() {
    const list = document.getElementById('drop-log-list');
    if (!list) return; // guard if element missing in prod transition
    list.innerHTML = '';

    const keys = Object.keys(sessionDrops).sort((a, b) => {
        const itemA = sessionDrops[a];
        const itemB = sessionDrops[b];
        if (itemA.grade !== itemB.grade) return itemA.grade === 'SSR' ? -1 : 1;
        return itemB.count - itemA.count;
    });

    if (keys.length === 0) {
        list.innerHTML = '<span style="color:#666;">획득한 SSR/SR이 없습니다.</span>';
        return;
    }

    keys.forEach(name => {
        const info = sessionDrops[name];
        const badge = document.createElement('div');
        badge.className = `drop-item ${info.grade === 'SSR' ? 'ssr' : ''} ${name === '픽업' ? 'pickup' : ''}`;
        badge.textContent = `${name} × ${info.count}`;
        list.appendChild(badge);
    });
}

function resetStats() {
    totalPulls = 0; ssrCount = 0; pickupCount = 0;
    sessionDrops = {};
    renderDropLog();

    saveStats();
    updateStatsUI();
}
