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
                fetch('./data/cards_stats.json'), // Changed from cards.json to cards_stats.json? Or cards.json?
                // Wait, script separates them into cards_stats.json and cards_event.json.
                // But DeckManager usually needs ONE merged object if possible, 
                // OR we need to load cards_event.json too if we want event search.
                // Let's assume we load both and merge for search logic.
                fetch('./data/potentials.json'),
                fetch('./data/stat_config.json')
            ]);

            // cards_stats.json
            const stats = await cardsRes.json();

            // We need event data for search text generation
            // Try loading events
            let events = [];
            try {
                const evRes = await fetch('./data/cards_event.json');
                if (evRes.ok) events = await evRes.json();
            } catch (e) { console.warn('Events load failed', e); }

            // Merge events into stats
            this.data.cards = stats.map(c => {
                const ev = events.find(e => e.id === c.id);
                if (ev) c.events = ev.events;
                return c;
            });

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
        this.dom.deckSlots.innerHTML = '';

        for (let i = 0; i < 5; i++) {
            const cardId = currentDeck[i];
            const slot = document.createElement('div');
            slot.className = 'deck-slot';

            if (cardId) {
                const card = this.data.cards.find(c => c.id === cardId);
                if (card) {
                    slot.classList.add('filled');
                    slot.innerHTML = `
                        <div class="rarity-badge ${card.rare}">${card.rare}</div>
                        <div class="type-badge">${card.type.t_train}</div>
                        <img src="${card.img}" alt="${card.name}">
                        <div class="remove-overlay">제거</div>
                    `;
                    slot.onclick = () => this.removeFromDeck(cardId);
                }
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
            if (currentDeck.includes(card.id)) return false;

            // Filter out cards with missing or undefined images
            if (!card.img || card.img === 'undefined' || card.img === '') return false;

            if (!q) return true;

            // Comprehensive Search Text Generation (Deep Indexing)
            let typeStr = '';
            if (card.type) {
                if (card.rare === 'SSR') {
                    typeStr = `${card.type.t_train || ''} / ${card.type.t_sup_1 || ''} / ${card.type.t_sup_2 || ''}`;
                } else {
                    typeStr = card.type.t_train || '';
                }
            }

            let potentialDesc = '';
            if (card.u_pot && card.u_pot.name && this.data.potentials) {
                potentialDesc = this.data.potentials[card.u_pot.name] || '';
            }

            let searchText = `${card.name} ${card.char || ''} ${card.rare} ${typeStr} ${card.u_eff?.name || ''} ${card.u_eff?.desc || ''} ${card.u_pot?.name || ''} ${potentialDesc}`;

            // Event Info (New Structure)
            if (card.events) {
                // Check name map? Wait, logic says 'name' inside stage
                ['1', '2', '3'].forEach(stageNum => {
                    const stKey = `stage_${stageNum}`;
                    const stage = card.events[stKey];
                    if (stage) {
                        // Stage Names
                        if (stage.name) {
                            searchText += ` ${stage.name.choice_A || ''} ${stage.name.choice_B || ''}`;
                        }
                        // Choices
                        ['choice_A', 'choice_B'].forEach(choiceKey => {
                            const choices = stage[choiceKey]; // Array of {cond, rewards}
                            if (Array.isArray(choices)) {
                                choices.forEach(c => {
                                    if (c.rewards) {
                                        c.rewards.forEach(r => {
                                            searchText += ` ${r.type} ${r.value}`;
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }

            // Support Info
            if (card.support) {
                card.support.forEach(sup => {
                    searchText += ` ${sup.type} ${sup.v35} ${sup.v50}`;
                });
            }

            // Use HangulUtils for Chosung Search
            if (window.HangulUtils) {
                return window.HangulUtils.isMatch(searchText, q);
            }
            return searchText.toLowerCase().includes(q);
        });

        // 2. Sort (Rarity > Type > ID)
        const typeOrder = ['힘', '체력', '인내', '집중', '보호'];
        const rarityWeight = { 'SSR': 3, 'SR': 2, 'R': 1 };

        filteredCards.sort((a, b) => {
            // 1. Sort by Rarity (Descending)
            const weightA = rarityWeight[a.rare] || 0;
            const weightB = rarityWeight[b.rare] || 0;
            if (weightA !== weightB) {
                return weightB - weightA;
            }

            // 2. Sort by Type
            const typeA = a.type?.t_train || '';
            const typeB = b.type?.t_train || '';
            const indexA = typeOrder.indexOf(typeA);
            const indexB = typeOrder.indexOf(typeB);

            if (indexA !== -1 && indexB !== -1) {
                if (indexA !== indexB) return indexA - indexB;
            }
            else if (indexA !== -1) return -1;
            else if (indexB !== -1) return 1;

            // 3. Sort by ID
            return a.id - b.id;
        });

        // 3. Render
        filteredCards.forEach(card => {
            const el = document.createElement('div');
            el.className = 'card-item';

            let typeStr = '';
            if (card.type) {
                if (card.rare === 'SSR') {
                    typeStr = `${card.type.t_train || ''} / ${card.type.t_sup_1 || ''} / ${card.type.t_sup_2 || ''}`;
                } else {
                    typeStr = card.type.t_train || '';
                }
            }

            el.innerHTML = `
                <div class="rarity-badge ${card.rare}">${card.rare}</div>
                <div class="type-badge">${card.type.t_train}</div>
                <img src="${card.img}" class="card-image" loading="lazy">
                <div class="card-info">
                    <div class="card-name">${card.name}</div>
                    <div class="card-type">${typeStr}</div>
                </div>
            `;
            el.onclick = () => this.addToDeck(card.id);
            this.dom.cardList.appendChild(el);
        });
    },

    renderSummary() {
        const currentDeck = this.data.decks[this.data.currentDeckIndex];
        const deckCards = currentDeck.map(id => this.data.cards.find(c => c.id === id)).filter(c => c);

        // 1. Render Potentials
        if (deckCards.length === 0) {
            this.dom.potentialList.innerHTML = '<li class="empty-message">카드를 선택해주세요.</li>';
            this.dom.statSummary.innerHTML = '<div class="empty-message">카드를 선택해주세요.</div>';
            return;
        }

        this.dom.potentialList.innerHTML = deckCards.map(card => {
            const potentialName = card.u_pot?.name || '-';
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
        const categoryStats = {};
        const levelKey = this.data.level === 35 ? 'v35' : 'v50'; // Changed from 수치35/수치50 to v35/v50

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
            const cardType = card.type?.t_train || '기타';

            const processStat = (stat) => {
                const type = stat.type;
                const valueStr = stat[levelKey];

                if (!type || !valueStr) return;

                if (globalTypes.has(type) || unclassifiedTypes.has(type)) {
                    this.addStat(globalStats, type, valueStr);
                } else if (categoryTypes.has(type)) {
                    if (!categoryStats[cardType]) categoryStats[cardType] = {};
                    this.addStat(categoryStats[cardType], type, valueStr);
                } else {
                    this.addStat(globalStats, type, valueStr);
                }
            };

            // Using jrn, trn, sns
            if (card.jrn) card.jrn.forEach(processStat);
            if (card.trn) card.trn.forEach(processStat);
            if (card.sns) card.sns.forEach(processStat);
            if (card.support) card.support.forEach(processStat);
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
        let orderedTypes = [];
        if (configSection) {
            Object.values(configSection).forEach(list => {
                if (Array.isArray(list)) orderedTypes.push(...list);
            });
        }

        const entries = Object.entries(stats).sort((a, b) => {
            const indexA = orderedTypes.indexOf(a[0]);
            const indexB = orderedTypes.indexOf(b[0]);

            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a[0].localeCompare(b[0]);
        });

        return entries.map(([type, value]) => {
            let displayValue = value;
            let format = 'Integer';

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

        let value = 0;
        let isPercent = valueStr.includes('%');
        const cleanStr = valueStr.replace(/[+%]/g, '');
        value = parseFloat(cleanStr);

        if (isNaN(value)) return;

        if (!stats[type]) stats[type] = 0;
        stats[type] += value;
    }
};

window.DeckManager = DeckManager;
