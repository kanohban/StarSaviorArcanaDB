const SchedulerManager = {
    data: {
        cards: [], // Stats + Events
        decks: [[], [], [], [], []], // 5 Decks
        currentDeckIndex: 0,
        checks: {}, // { deckIndex_cardId_stage: boolean }
        scrollState: { card: 0, schedule: 0 }
    },

    storageKey: 'scheduler_state',

    async init() {
        await this.fetchData();
        this.loadDecks();
        this.loadChecks();
        this.cacheDOM();
        this.bindEvents();
        this.render();
        // Removed explicit ScheduleViewManager.init() call here to avoid double init, 
        // as it is called in scheduler.html
        // if (window.ScheduleViewManager) {
        //     window.ScheduleViewManager.init();
        // }
    },

    cacheDOM() {
        this.dom = {
            grid: document.getElementById('scheduler-grid'),
            deckIndex: document.getElementById('deck-index'),
            deckStats: document.getElementById('deck-stats'),
            prevBtn: document.getElementById('prev-deck-btn'),
            nextBtn: document.getElementById('next-deck-btn'),
            resetBtn: document.getElementById('reset-check-btn'),
            scheduleBtn: document.getElementById('schedule-btn'),
            deckNav: document.querySelector('.deck-navigation')
        };
    },

    bindEvents() {
        this.dom.prevBtn.addEventListener('click', () => this.switchDeck(-1));
        this.dom.nextBtn.addEventListener('click', () => this.switchDeck(1));
        this.dom.resetBtn.addEventListener('click', () => this.resetChecks());
        if (this.dom.scheduleBtn) {
            this.dom.scheduleBtn.addEventListener('click', () => this.toggleScheduleView());
        }
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
        // If button says '카드', we are in Schedule View (checking schedule) and button offers return to Cards
        const isScheduleMode = this.dom.scheduleBtn.innerText === '카드';

        if (isScheduleMode) {
            // Reset Schedule View
            if (window.ScheduleViewManager) {
                window.ScheduleViewManager.reset();
            }
        } else {
            // Reset Card View (Current Deck)
            // Key format: `${ deckIndex }_${ cardId }_${ stage } `
            const prefix = `${this.data.currentDeckIndex} _`;
            for (const key in this.data.checks) {
                if (key.startsWith(prefix)) {
                    delete this.data.checks[key];
                }
            }
            this.saveChecks();
            this.render();
        }
    },

    switchDeck(direction) {
        let newIndex = this.data.currentDeckIndex + direction;
        if (newIndex < 0) newIndex = 4;
        if (newIndex > 4) newIndex = 0;

        this.data.currentDeckIndex = newIndex;
        this.render();
    },

    toggleScheduleView() {
        // If button says '일정' (Schedule), we are in Card View -> clicking it goes to Schedule View
        // If button says '카드' (Card), we are in Schedule View -> clicking it goes to Card View
        const isCardView = this.dom.scheduleBtn.innerText === '일정';

        if (isCardView) {
            // Switch to Schedule View
            // 1. Save Card Scroll
            this.data.scrollState.card = window.scrollY;

            this.dom.scheduleBtn.innerText = '카드';
            this.dom.deckNav.style.display = 'none';
            window.ScheduleViewManager.toggleView(true);

            // 2. Restore Schedule Scroll
            setTimeout(() => {
                window.scrollTo(0, this.data.scrollState.schedule || 0);
            }, 0);

        } else {
            // Switch back to Card Grid
            // 1. Save Schedule Scroll
            this.data.scrollState.schedule = window.scrollY;

            this.dom.scheduleBtn.innerText = '일정';
            this.dom.deckNav.style.display = 'flex';
            window.ScheduleViewManager.toggleView(false);

            // 2. Restore Card Scroll
            setTimeout(() => {
                window.scrollTo(0, this.data.scrollState.card || 0);
            }, 0);
        }
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
        const deck = this.data.decks[this.data.currentDeckIndex] || [];
        this.dom.deckIndex.innerText = this.data.currentDeckIndex + 1;

        // Render Cards
        this.dom.grid.innerHTML = '';

        if (deck.length === 0) {
            this.dom.grid.innerHTML = '<div class="empty-deck-message">설정된 카드가 없습니다.<br>덱 빌더에서 카드를 추가해주세요.</div>';
            return;
        }

        deck.forEach((cardId, cardIndex) => {
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
                ['1', '2', '3'].forEach((stage, idx) => {
                    const stKey = `stage_${stage}`;
                    const eventData = card.events[stKey];
                    const eventName = eventData ? eventData.event_name : `이벤트 ${stage}`;

                    const checkKey = `${this.data.currentDeckIndex}_${card.id}_${stage}`;
                    const isChecked = this.data.checks[checkKey];

                    // Call handleCardProgress instead of toggleCheck
                    eventsHtml += `
                        <div class="event-item ${isChecked ? 'checked' : ''}" onclick="window.SchedulerManager.handleCardProgress(${cardIndex}, ${idx})">
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
    },

    handleCardProgress(cardIndex, eventIndex) {
        const deck = this.data.decks[this.data.currentDeckIndex];
        if (!deck || !deck[cardIndex]) return;

        const cardId = deck[cardIndex];
        const stages = ['1', '2', '3'];

        // Determine current max checked index for this card
        let currentMaxIndex = -1;
        stages.forEach((stage, idx) => {
            const key = `${this.data.currentDeckIndex}_${cardId}_${stage} `;
            if (this.data.checks[key]) {
                currentMaxIndex = idx;
            }
        });

        let targetIndex;
        // Logic:
        // If clicking the currently max checked item, toggle it OFF (go back one step).
        // Otherwise, set progress TO the clicked item (check everything up to it).
        if (eventIndex === currentMaxIndex) {
            targetIndex = eventIndex - 1;
        } else {
            targetIndex = eventIndex;
        }

        // Apply state
        stages.forEach((stage, idx) => {
            const key = `${this.data.currentDeckIndex}_${cardId}_${stage} `;
            if (idx <= targetIndex) {
                this.data.checks[key] = true;
            } else {
                delete this.data.checks[key];
            }
        });

        this.saveChecks();
        this.render();
    },

    renderChoices(eventData) {
        if (!eventData) return '';

        const renderSingleChoice = (name, rewardsHTML) => {
            if (!name && !rewardsHTML) return '';
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
    }
};

window.SchedulerManager = SchedulerManager;
