const SchedulerManager = {
    data: {
        cards: [], // Stats + Events
        decks: [[], [], [], [], []], // 5 Decks
        currentDeckIndex: 0,
        checks: {} // { deckIndex_cardId_stage: boolean }
    },

    storageKey: 'scheduler_state',

    async init() {
        await this.fetchData();
        this.loadDecks();
        this.loadChecks();
        this.cacheDOM();
        this.bindEvents();
        this.render();
    },

    cacheDOM() {
        this.dom = {
            grid: document.getElementById('scheduler-grid'),
            deckIndex: document.getElementById('deck-index'),
            deckStats: document.getElementById('deck-stats'),
            prevBtn: document.getElementById('prev-deck-btn'),
            nextBtn: document.getElementById('next-deck-btn'),
            resetBtn: document.getElementById('reset-check-btn')
        };
    },

    bindEvents() {
        this.dom.prevBtn.addEventListener('click', () => this.switchDeck(-1));
        this.dom.nextBtn.addEventListener('click', () => this.switchDeck(1));
        this.dom.resetBtn.addEventListener('click', () => this.resetChecks());
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

    loadChecks() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try {
                this.data.checks = JSON.parse(saved);
            } catch (e) {
                console.warn('Failed to load checks');
            }
        }
    },

    saveChecks() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data.checks));
    },

    resetChecks() {
        if (!confirm('현재 덱의 체크 리스트를 초기화하시겠습니까?')) return;

        // Remove keys belonging to current deck
        // Key format: `${deckIndex}_${cardId}_${stage}`
        const prefix = `${this.data.currentDeckIndex}_`;
        for (const key in this.data.checks) {
            if (key.startsWith(prefix)) {
                delete this.data.checks[key];
            }
        }
        this.saveChecks();
        this.render();
    },

    switchDeck(direction) {
        let newIndex = this.data.currentDeckIndex + direction;
        if (newIndex < 0) newIndex = 4;
        if (newIndex > 4) newIndex = 0;

        this.data.currentDeckIndex = newIndex;
        this.render();
    },

    async fetchData() {
        try {
            const [statsRes, eventsRes] = await Promise.all([
                fetch('./data/cards_stats.json'),
                fetch('./data/cards_event.json')
            ]);

            const stats = await statsRes.json();
            let events = [];
            if (eventsRes.ok) events = await eventsRes.json();

            // Merge
            this.data.cards = stats.map(c => {
                const ev = events.find(e => e.id === c.id);
                if (ev) c.events = ev.events;
                return c;
            });

        } catch (error) {
            console.error('Failed to fetch data:', error);
            document.getElementById('scheduler-grid').innerHTML = '<div class="loading-message">데이터 로드 실패</div>';
        }
    },

    render() {
        const deck = this.data.decks[this.data.currentDeckIndex];
        this.dom.deckIndex.innerText = this.data.currentDeckIndex + 1;

        // Count total vs checked for this deck
        let totalEvents = deck.length * 3; // 3 events per card
        let checkedCount = 0;

        // Render Cards
        this.dom.grid.innerHTML = '';

        if (deck.length === 0) {
            this.dom.grid.innerHTML = '<div class="empty-deck-message">설정된 카드가 없습니다.<br>덱 빌더에서 카드를 추가해주세요.</div>';
            this.dom.deckStats.innerText = '(0/0)';
            return;
        }

        deck.forEach(cardId => {
            const card = this.data.cards.find(c => c.id === cardId);
            if (!card) return;

            const cardEl = document.createElement('div');
            cardEl.className = 'scheduler-card';

            // Card Header
            let typeStr = '';
            if (card.type) {
                if (card.rare === 'SSR') {
                    typeStr = `${card.type.t_train} / ${card.type.t_sup_1} / ${card.type.t_sup_2}`;
                } else {
                    typeStr = card.type.t_train;
                }
            }

            let eventsHtml = '';
            if (card.events) {
                eventsHtml = '<div class="event-list">';
                ['1', '2', '3'].forEach(stage => {
                    const stKey = `stage_${stage}`;
                    const eventData = card.events[stKey];
                    const eventName = eventData ? eventData.event_name : `이벤트 ${stage}`;

                    const checkKey = `${this.data.currentDeckIndex}_${card.id}_${stage}`;
                    const isChecked = this.data.checks[checkKey];
                    if (isChecked) checkedCount++;

                    eventsHtml += `
                        <div class="event-item ${isChecked ? 'checked' : ''}" onclick="window.SchedulerManager.toggleCheck('${checkKey}')">
                            <div class="event-checkbox"></div>
                            <div class="event-text">
                                <div class="event-stage">${stage}단계</div>
                                <div class="event-name">${eventName}</div>
                                <div class="event-choices">
                                    ${this.renderChoices(eventData)}
                                </div>
                            </div>
                        </div>
                    `;
                });
                eventsHtml += '</div>';
            } else {
                eventsHtml = '<div style="color:#666; font-size:0.9rem;">이벤트 데이터 없음</div>';
            }

            cardEl.innerHTML = `
                <div class="scheduler-card-header">
                    <img src="${card.img}" alt="${card.name}">
                    <div class="scheduler-card-info">
                        <div class="scheduler-card-name">${card.name}</div>
                        <div class="scheduler-card-type">${card.rare} | ${typeStr}</div>
                    </div>
                </div>
                ${eventsHtml}
            `;

            this.dom.grid.appendChild(cardEl);
        });

        this.dom.deckStats.innerText = `(${checkedCount}/${totalEvents} 완료)`;
    },

    renderChoices(eventData) {
        if (!eventData) return '';

        const renderSingleChoice = (name, rewardsHTML) => {
            // Rule: If no name AND no rewards, don't show anything.
            if (!name && !rewardsHTML) return '';

            // Rule: If valid, render vertical stack
            return `
                <div class="choice-item">
                    ${name ? `<div class="choice-name">${name}</div>` : ''}
                    ${rewardsHTML ? `<div class="choice-rewards">${rewardsHTML}</div>` : ''}
                </div>
            `;
        };

        const choiceA_Rewards = this.extractRewards(eventData.choice_A);
        const nameA = (eventData.name && eventData.name.choice_A) ? eventData.name.choice_A : '';

        const choiceB_Rewards = this.extractRewards(eventData.choice_B);
        const nameB = (eventData.name && eventData.name.choice_B) ? eventData.name.choice_B : '';

        const htmlA = renderSingleChoice(nameA, choiceA_Rewards);
        const htmlB = renderSingleChoice(nameB, choiceB_Rewards);

        if (!htmlA && !htmlB) return '';

        return `
            <div class="choice-container">
                ${htmlA}
                ${htmlB}
            </div>
        `;
    },

    extractRewards(choiceArray) {
        if (!choiceArray || !Array.isArray(choiceArray)) return null;

        const rewardsHTML = [];

        choiceArray.forEach(item => {
            let label = '';
            let labelClass = '';

            if (item.cond === 'FIX') {
                label = '고정';
                labelClass = 'cond-fix';
            } else if (item.cond === 'Suc') {
                label = '성공';
                labelClass = 'cond-suc';
            } else if (item.cond === 'Fail') {
                label = '실패';
                labelClass = 'cond-fail';
            }

            let rewardText = '';
            if (item.rewards && item.rewards.length > 0) {
                rewardText = item.rewards.map(r => `${r.type} ${r.value}`).join(', ');
            }

            if (rewardText) {
                if (label) {
                    rewardsHTML.push(`<span class="reward-tag ${labelClass}">${label}</span> ${rewardText}`);
                } else {
                    rewardsHTML.push(rewardText);
                }
            }
        });

        if (rewardsHTML.length === 0) return null;
        return rewardsHTML.join('<br>');
    },

    toggleCheck(key) {
        if (this.data.checks[key]) {
            delete this.data.checks[key];
        } else {
            this.data.checks[key] = true;
        }
        this.saveChecks();
        this.render();
    }
};

window.SchedulerManager = SchedulerManager;
