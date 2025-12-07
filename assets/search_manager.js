(function () {
    const SearchManager = {
        init() {
            this.cacheDOM();
            this.bindEvents();
            this.loadData();
        },

        cacheDOM() {
            this.input = document.getElementById('search-input');
            this.filterCard = document.getElementById('filter-card');
            this.filterJourney = document.getElementById('filter-journey');
            this.resultsContainer = document.getElementById('search-results');

            // Modal Elements
            this.modal = document.getElementById('card-modal');
            this.modalClose = document.querySelector('.modal-close');
            this.modalContent = document.querySelector('.modal-content-body');
        },

        bindEvents() {
            // Use Debounce from SearchService
            const debouncedSearch = window.SearchService.debounce((query) => {
                this.handleSearch(query);
            }, 300);

            this.input.addEventListener('input', (e) => debouncedSearch(e.target.value));

            this.filterCard.addEventListener('change', () => this.handleSearch(this.input.value));
            this.filterJourney.addEventListener('change', () => this.handleSearch(this.input.value));

            // Modal Events
            if (this.modalClose) {
                this.modalClose.addEventListener('click', () => this.closeModal());
            }
            window.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.closeModal();
                }
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.modal.style.display === 'flex') {
                    this.closeModal();
                }
            });
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
                const potentialsData = await potentialsRes.json();

                // Build Index via Service
                window.SearchService.buildIndex(cardsData, journeyData, potentialsData);

                // Store Potentials for Modal display
                this.potentials = potentialsData;

            } catch (error) {
                console.error('Failed to fetch data:', error);
                this.resultsContainer.innerHTML = '<div class="empty-state">데이터를 불러오는 중 오류가 발생했습니다.</div>';
            }
        },

        handleSearch(query) {
            const q = query.trim();
            const showCards = this.filterCard.checked;
            const showJourneys = this.filterJourney.checked;

            if (q.length === 0) {
                this.resultsContainer.innerHTML = '<div class="empty-state">검색어를 입력해주세요.</div>';
                return;
            }

            // Use SearchService
            const results = window.SearchService.search(q, { showCards, showJourneys });
            this.renderResults(results, q);
        },

        renderResults(results, query) {
            this.resultsContainer.innerHTML = '';

            if (results.length === 0) {
                this.resultsContainer.innerHTML = '<div class="empty-state">검색 결과가 없습니다.</div>';
                return;
            }

            // Use DocumentFragment for performance
            const fragment = document.createDocumentFragment();

            results.forEach(item => {
                const card = document.createElement('div');
                card.className = `result-card type-${item.type}`;

                let badgeText = item.type === 'card' ? '아르카나' : '여정';

                let html = `
                    <div class="result-type-badge type-${item.type}">${badgeText}</div>
                    <div class="result-title">${this.highlightText(item.title, query)}</div>
                    <div class="result-subtitle">${item.subtitle}</div>
                    <div class="result-content">${this.highlightText(item.content, query)}</div>
                `;

                if (item.type === 'journey') {
                    const detailsId = `details-${Math.random().toString(36).substr(2, 9)}`;
                    html += `
                        <div class="result-details" id="${detailsId}" style="display:none; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color, #555);">
                            ${this.renderDetails(item)}
                        </div>
                    `;
                }

                card.innerHTML = html;

                card.addEventListener('click', () => {
                    if (item.type === 'card') {
                        this.openModal(item.data);
                    } else {
                        const details = card.querySelector('.result-details');
                        const isHidden = details.style.display === 'none';
                        details.style.display = isHidden ? 'block' : 'none';
                    }
                });

                fragment.appendChild(card);
            });

            this.resultsContainer.appendChild(fragment);
        },

        highlightText(text, query) {
            if (!query || !text) return text;
            // Use Regex from HangulUtils for highlighting? 
            // Highlighting complex regex matches is tricky. 
            // For now, let's stick to simple query highlighting or try to use the matcher.
            // Actually, if we use regex for search, we should use it for highlight too.

            try {
                const matcher = window.HangulUtils.createFuzzyMatcher(query);
                // We need global flag for replaceAll
                const globalMatcher = new RegExp(matcher.source, 'gi');
                return text.replace(globalMatcher, '<span class="highlight">$&</span>');
            } catch (e) {
                return text;
            }
        },

        renderDetails(item) {
            if (item.type === 'journey') {
                const e = item.data;
                let html = `<ul style="padding-left: 1.2rem;">`;
                if (e.choices) {
                    e.choices.forEach(choice => {
                        html += `
                            <li style="margin-bottom: 0.5rem;">
                                <strong>${choice.text}</strong><br>
                                <span style="color: #aaa; font-size: 0.9rem;">

                                    ${choice.condition ? `조건: ${choice.condition}<br>` : ''}
                                    ${choice.result ? `결과: ${choice.result}<br>` : ''}
                                    ${choice.result_positive ? `<span style="color: #4cd137;">성공: ${choice.result_positive}</span><br>` : ''}
                                    ${choice.result_negative ? `<span style="color: #e84118;">실패: ${choice.result_negative}</span>` : ''}
                                    ${(!choice.result && !choice.result_positive && !choice.result_negative) ? '결과: -' : ''}

                                </span>
                            </li>
                        `;
                    });
                }
                html += `</ul>`;
                return html;
            }
            return '';
        },

        openModal(card) {
            if (!this.modal) return;

            // Build Modal Content
            let typeStr = '';
            if (card.타입) {
                if (card.레어도 === 'SSR') {
                    typeStr = `${card.타입.훈련 || ''} / ${card.타입.보조1 || ''} / ${card.타입.보조2 || ''}`;
                } else {
                    typeStr = card.타입.훈련 || '';
                }
            }

            // Get Potential Description
            let potentialDesc = '-';
            if (card.고유잠재 && card.고유잠재.이름 && this.potentials) {
                potentialDesc = this.potentials[card.고유잠재.이름] || '-';
            }

            let html = `
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

            // Events Section
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

                                if (choiceKey === '선택지B' || hasB) {
                                    html += `<div class="choice-header">${choiceName}</div>`;
                                }

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

            this.modalContent.innerHTML = html;
            this.modal.style.display = 'flex';
        },

        closeModal() {
            if (this.modal) {
                this.modal.style.display = 'none';
            }
        }
    };

    SearchManager.init();
})();
