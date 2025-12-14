const SchedulerSearchManager = {
    dom: {
        searchInput: null,
        mainContainer: null,
        resultsContainer: null,
        modal: null,
        modalClose: null,
        modalContent: null
    },
    state: {
        lastScrollY: 0,
        isSearchActive: false,
        potentialsData: {}
    },

    async init() {
        this.dom.searchInput = document.getElementById('scheduler-search-input');
        this.dom.mainContainer = document.querySelector('.scheduler-container');
        this.dom.resultsContainer = document.getElementById('scheduler-search-results');

        // Modal DOM
        this.dom.modal = document.getElementById('card-modal');
        this.dom.modalClose = document.querySelector('.modal-close');
        this.dom.modalContent = document.querySelector('.modal-content-body');

        if (!this.dom.searchInput) {
            console.warn('Scheduler Search Input not found');
            return;
        }

        await this.loadData();
        this.bindEvents();
    },

    async loadData() {
        try {
            const [cardsRes, journeyRes, potentialsRes] = await Promise.all([
                fetch('./data/cards.json'),
                fetch('./data/journey_data.json'),
                fetch('./data/potentials.json')
            ]);

            const cardsData = await cardsRes.json();
            const journeyData = await journeyRes.json();
            this.state.potentialsData = await potentialsRes.json();

            if (window.SearchService) {
                window.SearchService.buildIndex(cardsData, journeyData, this.state.potentialsData);
                console.log("Scheduler Search Index Built");
            }
        } catch (e) {
            console.error("Scheduler Search Data Load Failed", e);
        }
    },

    bindEvents() {
        if (this.dom.searchInput) {
            this.dom.searchInput.addEventListener('input', (e) => this.handleInput(e));
        }

        if (this.dom.modalClose) {
            this.dom.modalClose.addEventListener('click', () => this.closeModal());
        }
        window.addEventListener('click', (e) => {
            if (e.target === this.dom.modal) this.closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    },

    handleInput(e) {
        const query = e.target.value.trim();

        if (!query) {
            if (this.state.isSearchActive) {
                this.dom.mainContainer.classList.remove('search-active');
                this.state.isSearchActive = false;
                // Restore scroll
                setTimeout(() => window.scrollTo(0, this.state.lastScrollY), 0);
            }
            return;
        }

        if (!this.state.isSearchActive) {
            this.state.lastScrollY = window.scrollY;
            this.state.isSearchActive = true;
            this.dom.mainContainer.classList.add('search-active');
            window.scrollTo(0, 0);
        }

        if (window.SearchService) {
            const results = window.SearchService.search(query, { showCards: true, showJourneys: true });
            this.renderResults(results, query);
        }
    },

    renderResults(results, query) {
        this.dom.resultsContainer.innerHTML = '';
        if (results.length === 0) {
            this.dom.resultsContainer.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#888;">검색 결과가 없습니다.</div>';
            return;
        }

        const fragment = document.createDocumentFragment();

        results.forEach(item => {
            const wrapper = document.createElement('div');
            wrapper.className = 'result-card-container';
            const badgeText = item.type === 'card' ? '아르카나' : '여정 이벤트';

            wrapper.innerHTML = `
                <div class="result-card type-${item.type}" style="height: auto; min-height: 100%; border-radius:12px; box-sizing:border-box;">
                    <div class="result-type-badge type-${item.type}">${badgeText}</div>
                    <div class="result-title">${this.highlightText(item.title, query)}</div>
                    <div class="result-subtitle">${item.subtitle}</div>
                    <div class="result-content">${this.highlightText(item.content, query)}</div>
                </div>
            `;

            wrapper.querySelector('.result-card').addEventListener('click', () => {
                this.openModal(item);
            });

            fragment.appendChild(wrapper);
        });

        this.dom.resultsContainer.appendChild(fragment);
    },

    highlightText(text, query) {
        if (!query || !text) return text;
        try {
            const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedQuery, 'gi');
            return text.replace(regex, '<span class="highlight">$&</span>');
        } catch (e) { return text; }
    },

    // Modal Logic
    closeModal() {
        if (this.dom.modal) this.dom.modal.style.display = 'none';
    },

    openModal(item) {
        if (!this.dom.modal) return;
        let html = '';

        if (item.type === 'journey') {
            const eventData = item.data;
            html += `<div style="padding-bottom:10px; border-bottom:1px solid #444; margin-bottom:15px;">
                        <h2 style="margin:0; color:var(--primary-color);">${eventData.name} <small style='color:#aaa; font-size:0.6em;'>[${eventData.category}]</small></h2>
                     </div>`;
            html += this.generateEventCardHTML(eventData);

        } else {
            const card = item.data || item;
            let typeStr = '';
            if (card.타입) {
                if (card.레어도 === 'SSR') {
                    typeStr = `${card.타입.훈련 || ''} / ${card.타입.보조1 || ''} / ${card.타입.보조2 || ''}`;
                } else {
                    typeStr = card.타입.훈련 || '';
                }
            }

            let potentialDesc = '-';
            if (card.고유잠재 && card.고유잠재.이름 && this.state.potentialsData) {
                potentialDesc = this.state.potentialsData[card.고유잠재.이름] || '-';
            }

            html = `
                <div class="modal-card-header">
                    <img src="${card.이미지}" alt="${card.이름}" class="modal-card-img" onerror="this.style.display='none'">
                    <div class="modal-card-info">
                        <h2>${card.이름}</h2>
                        <div class="modal-card-meta">
                            <span class="badge badge-rarity">${card.레어도}</span>
                            <span class="badge badge-type">${typeStr}</span>
                        </div>
                    </div>
                </div>
                
                <div class="modal-section">
                    <h3>고유 효과: ${card.고유효과?.이름 || '-'}</h3>
                    <p>${card.고유효과?.설명 || '-'}</p>
                </div>

                <div class="modal-section">
                    <h3>고유 잠재: ${card.고유잠재?.이름 || '-'}</h3>
                    <p>${potentialDesc}</p>
                </div>
            `;

            if (card.이벤트) {
                html += `<div class="modal-section"><h3>여정 이벤트</h3>`;
                ['1단계', '2단계', '3단계'].forEach((stageKey, index) => {
                    const stage = card.이벤트[stageKey];
                    if (stage) {
                        const eventName = (card.이벤트.이름 && card.이벤트.이름[index]) ? card.이벤트.이름[index] : stageKey;
                        html += `
                            <div class="stage-block">
                                <h4>${eventName}</h4>
                                <div class="stage-choices">
                        `;
                        const hasB = stage['선택지B'] && stage['선택지B'].length > 0 && stage['선택지B'][0].획득 && stage['선택지B'][0].획득.length > 0;
                        ['선택지A', '선택지B'].forEach(choiceKey => {
                            const choiceName = stage.이름_선택지?.[choiceKey] || (choiceKey === '선택지A' ? 'A' : 'B');
                            const choices = stage[choiceKey];
                            if (choices && choices.length > 0 && choices[0].획득 && choices[0].획득.length > 0) {
                                html += `<div class="choice-column">`;
                                if (choiceKey === '선택지B' || hasB) html += `<div class="choice-header">${choiceName}</div>`;
                                html += `<div class="choice-rewards">`;
                                choices.forEach(group => {
                                    if (group.획득 && group.획득.length > 0) {
                                        html += `<div class="reward-group ${group.여부 === '성공' ? 'success' : (group.여부 === '실패' ? 'fail' : '')}">`;
                                        if (group.여부 !== '고정') html += `<div class="reward-badge">${group.여부}</div>`;
                                        group.획득.forEach(item => {
                                            html += `<div class="reward-item">
                                                <span class="reward-type">${item.타입}</span>
                                                <span class="reward-value">${item.수치}</span>
                                            </div>`;
                                        });
                                        html += `</div>`;
                                    }
                                });
                                html += `</div></div>`;
                            }
                        });
                        html += `</div></div>`;
                    }
                });
                html += `</div>`;
            }
        }
        this.dom.modalContent.innerHTML = html;
        this.dom.modal.style.display = 'flex';
    },

    generateEventCardHTML(event) {
        const timings = event.timing ? event.timing.split(',').map(t => t.trim()).filter(t => t) : [];
        const conditions = event.condition ? event.condition.split(',').map(c => c.trim()).filter(c => c) : [];

        return `
            <div class="event-card">
                <div class="event-name">${event.name}</div>
                <div class="event-meta-container">
                    ${timings.length > 0 ? `<div class="meta-row">${timings.map(t => `<span class="meta-pill value-timing">${t}</span>`).join('')}</div>` : ''}
                    ${conditions.length > 0 ? `<div class="meta-row">${conditions.map(c => `<span class="meta-pill value-condition">${c}</span>`).join('')}</div>` : ''}
                </div>
                <ul class="choice-list">
                    ${event.choices.map(choice => `
                        <li class="choice-item">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                                <span class="choice-text" style="margin-bottom: 0;">${choice.text}</span>
                                ${choice.condition ? `<span class="meta-pill value-condition" style="font-size:0.8rem; padding:2px 10px; margin-left: 10px; flex-shrink: 0;">${choice.condition}</span>` : ''}
                            </div>
                            <div class="choice-results">
                                ${choice.result_positive ? `<div class="result-positive"><span class="result-label">성공:</span> ${choice.result_positive}</div>` : ''}
                                ${choice.result_negative ? `<div class="result-negative"><span class="result-label">실패:</span> ${choice.result_negative}</div>` : ''}
                                ${choice.result ? `<div class="result-common">${choice.result}</div>` : ''}
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
};

window.SchedulerSearchManager = SchedulerSearchManager;
