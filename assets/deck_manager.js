const DeckManager = {
    data: {
        cards: [],
        potentials: {},
        statConfig: null,
        decks: [[], [], [], [], []], // 5 Decks
        currentDeckIndex: 0,
        level: 35 // Default Level
    },

    async init() {
        await this.fetchData();
        this.loadDecks(); // Load saved decks
        this.cacheDOM();
        this.bindEvents();
        this.renderDeck();
        this.renderCardList();
        this.renderSummary();
    },

    cacheDOM() {
        this.dom = {
            deckSlots: document.getElementById('deck-slots'),
            cardList: document.getElementById('card-list'),
            cardSearch: document.getElementById('card-search'),
            potentialList: document.getElementById('potential-list'),
            statSummary: document.getElementById('stat-summary'),
            deckCount: document.getElementById('deck-count'),
            deckIndex: document.getElementById('deck-index'),
            levelBtns: document.querySelectorAll('.level-btn'),
            prevDeckBtn: document.getElementById('prev-deck-btn'),
            nextDeckBtn: document.getElementById('next-deck-btn')
        };
    },

    bindEvents() {
        // Search
        this.dom.cardSearch.addEventListener('input', (e) => {
            this.renderCardList(e.target.value.trim());
        });

        // Level Toggle
        this.dom.levelBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.dom.levelBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.data.level = parseInt(btn.dataset.level);
                this.renderSummary();
            });
        });

        // Deck Navigation
        this.dom.prevDeckBtn.addEventListener('click', () => this.switchDeck(-1));
        this.dom.nextDeckBtn.addEventListener('click', () => this.switchDeck(1));
    },

    loadDecks() {
        const saved = localStorage.getItem('saved_decks');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length === 5) {
                    this.data.decks = parsed;
                }
            } catch (e) {
                console.error('Failed to load decks', e);
            }
        }
    },

    saveDecks() {
        localStorage.setItem('saved_decks', JSON.stringify(this.data.decks));
    },

    switchDeck(direction) {
        let newIndex = this.data.currentDeckIndex + direction;
        if (newIndex < 0) newIndex = 4;
        if (newIndex > 4) newIndex = 0;

        this.data.currentDeckIndex = newIndex;
        this.updateUI();
    },

    async fetchData() {
        try {
            const [cardsRes, potentialsRes, configRes] = await Promise.all([
                fetch('./data/cards.json'),
                fetch('./data/potentials.json'),
                fetch('./data/stat_config.json')
            ]);
            this.data.cards = await cardsRes.json();
            this.data.potentials = await potentialsRes.json();
            this.data.statConfig = await configRes.json();
        } catch (error) {
            console.error('Failed to fetch data:', error);
            // Fallback config if fetch fails
            this.data.statConfig = {
                globalTypes: {
                    Integer: ['힘', '체력', '인내', '집중', '보호', '인연', '주화'],
                    Percentage: ['주화 획득량', '훈련 효과', '컨디션 효과'],
                    String: []
                },
                categoryTypes: {
                    Percentage: ['초감응 효과', '감응 효과'],
                    Integer: ['감응 발생률', '추가 잠재력'],
                    String: []
                },
                unclassified: { Integer: [], Percentage: [], String: [] }
            };
        }
    },

    addToDeck(cardId) {
        const currentDeck = this.data.decks[this.data.currentDeckIndex];
        if (currentDeck.length >= 5) {
            alert('덱은 최대 5장까지만 구성할 수 있습니다.');
            return;
        }
        if (currentDeck.includes(cardId)) return;

        currentDeck.push(cardId);
        this.saveDecks();
        this.updateUI();
    },

    removeFromDeck(cardId) {
        const currentDeck = this.data.decks[this.data.currentDeckIndex];
        this.data.decks[this.data.currentDeckIndex] = currentDeck.filter(id => id !== cardId);
        this.saveDecks();
        this.updateUI();
    },

    updateUI() {
        this.renderDeck();
        this.renderCardList(this.dom.cardSearch.value.trim());
        this.renderSummary();
    },

    renderDeck() {
        const currentDeck = this.data.decks[this.data.currentDeckIndex];

        this.dom.deckIndex.textContent = this.data.currentDeckIndex + 1;
        this.dom.deckCount.textContent = `(${currentDeck.length}/5)`;
        this.dom.deckSlots.innerHTML = '';

        for (let i = 0; i < 5; i++) {
            const cardId = currentDeck[i];
            const slot = document.createElement('div');
            slot.className = 'deck-slot';

            if (cardId) {
                const card = this.data.cards.find(c => c.아이디 === cardId);
                slot.classList.add('filled');
                slot.innerHTML = `
                    <div class="rarity-badge ${card.레어도}">${card.레어도}</div>
                    <div class="type-badge">${card.타입.훈련}</div>
                    <img src="${card.이미지}" alt="${card.이름}">
                    <div class="remove-overlay">제거</div>
                `;
                slot.onclick = () => this.removeFromDeck(cardId);
            } else {
                slot.innerHTML = `<span class="placeholder">+</span>`;
            }
            this.dom.deckSlots.appendChild(slot);
        }
    },

    renderCardList(query = '') {
        this.dom.cardList.innerHTML = '';

        const q = query.toLowerCase();
        const currentDeck = this.data.decks[this.data.currentDeckIndex];

        // 1. Filter
        const filteredCards = this.data.cards.filter(card => {
            // Filter out cards already in deck
            if (currentDeck.includes(card.아이디)) return false;

            // Filter out cards with missing or undefined images
            if (!card.이미지 || card.이미지 === 'undefined' || card.이미지 === '') return false;

            if (!q) return true;

            // Comprehensive Search Text Generation (Deep Indexing)
            let typeStr = '';
            if (card.타입) {
                if (card.레어도 === 'SSR') {
                    typeStr = `${card.타입.훈련 || ''} / ${card.타입.보조1 || ''} / ${card.타입.보조2 || ''}`;
                } else {
                    typeStr = card.타입.훈련 || '';
                }
            }

            let potentialDesc = '';
            if (card.고유잠재 && card.고유잠재.이름 && this.data.potentials) {
                potentialDesc = this.data.potentials[card.고유잠재.이름] || '';
            }

            let searchText = `${card.이름} ${card.레어도} ${typeStr} ${card.고유효과?.이름 || ''} ${card.고유효과?.설명 || ''} ${card.고유잠재?.이름 || ''} ${potentialDesc}`;

            // Event Info
            if (card.이벤트) {
                if (card.이벤트.이름 && Array.isArray(card.이벤트.이름)) {
                    searchText += ` ${card.이벤트.이름.join(' ')}`;
                }
                ['1단계', '2단계', '3단계'].forEach(stageKey => {
                    const stage = card.이벤트[stageKey];
                    if (stage) {
                        if (stage.이름_선택지) {
                            searchText += ` ${stage.이름_선택지.선택지A || ''} ${stage.이름_선택지.선택지B || ''}`;
                        }
                        ['선택지A', '선택지B'].forEach(choiceKey => {
                            const choices = stage[choiceKey];
                            if (Array.isArray(choices)) {
                                choices.forEach(choice => {
                                    if (choice.획득) {
                                        choice.획득.forEach(reward => {
                                            searchText += ` ${reward.타입} ${reward.수치}`;
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }

            // Support Info
            if (card.지원) {
                card.지원.forEach(sup => {
                    searchText += ` ${sup.타입} ${sup.수치35} ${sup.수치50}`;
                });
            }

            return searchText.toLowerCase().includes(q);
        });

        // 2. Sort (Rarity > Type > ID)
        const typeOrder = ['힘', '체력', '인내', '집중', '보호'];
        const rarityWeight = { 'SSR': 3, 'SR': 2, 'R': 1 };

        filteredCards.sort((a, b) => {
            // 1. Sort by Rarity (Descending)
            const weightA = rarityWeight[a.레어도] || 0;
            const weightB = rarityWeight[b.레어도] || 0;
            if (weightA !== weightB) {
                return weightB - weightA;
            }

            // 2. Sort by Type
            const typeA = a.타입?.훈련 || '';
            const typeB = b.타입?.훈련 || '';
            const indexA = typeOrder.indexOf(typeA);
            const indexB = typeOrder.indexOf(typeB);

            // If both are in the known list, sort by index
            if (indexA !== -1 && indexB !== -1) {
                if (indexA !== indexB) return indexA - indexB;
            }
            // If only one is in the list, put it first
            else if (indexA !== -1) return -1;
            else if (indexB !== -1) return 1;

            // 3. Sort by ID
            return a.아이디 - b.아이디;
        });

        // 3. Render
        filteredCards.forEach(card => {
            const el = document.createElement('div');
            el.className = 'card-item';

            let typeStr = '';
            if (card.타입) {
                if (card.레어도 === 'SSR') {
                    typeStr = `${card.타입.훈련 || ''} / ${card.타입.보조1 || ''} / ${card.타입.보조2 || ''}`;
                } else {
                    typeStr = card.타입.훈련 || '';
                }
            }

            el.innerHTML = `
                <div class="rarity-badge ${card.레어도}">${card.레어도}</div>
                <div class="type-badge">${card.타입.훈련}</div>
                <img src="${card.이미지}" class="card-image" loading="lazy">
                <div class="card-info">
                    <div class="card-name">${card.이름}</div>
                    <div class="card-type">${typeStr}</div>
                </div>
            `;
            el.onclick = () => this.addToDeck(card.아이디);
            this.dom.cardList.appendChild(el);
        });
    },

    renderSummary() {
        const currentDeck = this.data.decks[this.data.currentDeckIndex];
        const deckCards = currentDeck.map(id => this.data.cards.find(c => c.아이디 === id));

        // 1. Render Potentials
        if (deckCards.length === 0) {
            this.dom.potentialList.innerHTML = '<li class="empty-message">카드를 선택해주세요.</li>';
            this.dom.statSummary.innerHTML = '<div class="empty-message">카드를 선택해주세요.</div>';
            return;
        }

        this.dom.potentialList.innerHTML = deckCards.map(card => {
            const potentialName = card.고유잠재?.이름 || '-';
            const potentialDesc = this.data.potentials[potentialName] || '설명 없음';
            return `
                <li class="potential-item">
                    <span class="potential-name">${potentialName}</span>
                    <span class="potential-desc">${potentialDesc}</span>
                </li>
            `;
        }).join('');

        // 2. Calculate Stats
        const globalStats = {};
        const categoryStats = {}; // { '힘': { '초감응 효과': 10, ... }, ... }
        const levelKey = this.data.level === 35 ? '수치35' : '수치50';

        // Flatten config for easy lookup
        const flattenTypes = (configSection) => {
            const types = new Set();
            if (configSection) {
                Object.values(configSection).forEach(list => list.forEach(t => types.add(t)));
            }
            return types;
        };

        const globalTypes = flattenTypes(this.data.statConfig.globalTypes);
        const categoryTypes = flattenTypes(this.data.statConfig.categoryTypes);
        const unclassifiedTypes = flattenTypes(this.data.statConfig.unclassified);

        deckCards.forEach(card => {
            const cardType = card.타입?.훈련 || '기타'; // Primary Type (Strength, etc.)

            const processStat = (stat) => {
                const type = stat.타입;
                const valueStr = stat[levelKey];

                if (!type || !valueStr) return;

                if (globalTypes.has(type) || unclassifiedTypes.has(type)) {
                    this.addStat(globalStats, type, valueStr);
                } else if (categoryTypes.has(type)) {
                    if (!categoryStats[cardType]) categoryStats[cardType] = {};
                    this.addStat(categoryStats[cardType], type, valueStr);
                } else {
                    // Fallback: Add to Global if unknown
                    this.addStat(globalStats, type, valueStr);
                }
            };

            if (card.여정) card.여정.forEach(processStat);
            if (card.훈련) card.훈련.forEach(processStat);
            if (card.감응) card.감응.forEach(processStat);
            if (card.지원) card.지원.forEach(processStat);
        });

        let html = '';

        // Render Global Stats
        html += '<div class="global-stats-container">';
        html += '<div class="stat-grid global-stats-grid">';
        if (Object.keys(globalStats).length === 0) {
            html += '<div class="empty-message">데이터 없음</div>';
        } else {
            html += this.generateStatHTML(globalStats, this.data.statConfig.globalTypes);
        }
        html += '</div></div>';

        // Render Category Stats
        if (Object.keys(categoryStats).length > 0) {
            html += '<div class="category-stats-container">';
            Object.entries(categoryStats).forEach(([cat, stats]) => {
                html += `<div class="category-group">
                    <div class="category-title">${cat}</div>
                    <div class="stat-grid category-stats-grid">
                        ${this.generateStatHTML(stats, this.data.statConfig.categoryTypes)}
                    </div>
                </div>`;
            });
            html += '</div>';
        }

        this.dom.statSummary.innerHTML = html;
    },

    generateStatHTML(stats, configSection) {
        // 1. Create an ordered list of types from configSection
        let orderedTypes = [];
        if (configSection) {
            Object.values(configSection).forEach(list => {
                if (Array.isArray(list)) orderedTypes.push(...list);
            });
        }

        // 2. Sort entries
        const entries = Object.entries(stats).sort((a, b) => {
            const indexA = orderedTypes.indexOf(a[0]);
            const indexB = orderedTypes.indexOf(b[0]);

            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1; // Known types first
            if (indexB !== -1) return 1;
            return a[0].localeCompare(b[0]); // Fallback to alphabetical
        });

        return entries.map(([type, value]) => {
            let displayValue = value;

            // Determine format from config
            let format = 'Integer'; // Default

            const findFormat = (section) => {
                if (!section) return null;
                for (const [fmt, types] of Object.entries(section)) {
                    if (types.includes(type)) return fmt;
                }
                return null;
            };

            format = findFormat(this.data.statConfig.globalTypes) ||
                findFormat(this.data.statConfig.categoryTypes) ||
                findFormat(this.data.statConfig.unclassified) ||
                'Integer';

            // Override for "Type Training" (e.g. "힘 훈련") which are usually percentages
            if (type.endsWith(' 훈련') && !type.includes('감응')) {
                format = 'Percentage';
            }

            let sign = value > 0 ? '+' : '';
            if (format === 'Percentage') {
                displayValue = `${sign}${value.toFixed(2)}%`;
            } else if (format === 'Integer') {
                displayValue = `${sign}${value}`;
            } else {
                displayValue = `${sign}${value}`;
            }

            // Special case for "주화 획득량" if it's percentage
            if (type === '주화 획득량') displayValue = `${sign}${value.toFixed(2)}%`;

            return `
                <div class="stat-item">
                    <span class="stat-label">${type}</span>
                    <span class="stat-value">${displayValue}</span>
                </div>
            `;
        }).join('');
    },

    addStat(stats, type, valueStr) {
        if (!valueStr) return;

        // Parse value
        let value = 0;
        let isPercent = valueStr.includes('%');

        // Remove +, % and parse
        const cleanStr = valueStr.replace(/[+%]/g, '');
        value = parseFloat(cleanStr);

        if (isNaN(value)) return;

        if (!stats[type]) stats[type] = 0;
        stats[type] += value;
    }
};

window.DeckManager = DeckManager;
