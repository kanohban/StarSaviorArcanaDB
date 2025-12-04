(function () {
    const SearchManager = {
        data: {
            cards: [],
            journeys: []
        },
        index: [],

        async init() {
            this.cacheDOM();
            this.bindEvents();
            await this.fetchData();
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
            this.input.addEventListener('input', (e) => this.handleSearch(e.target.value));
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

        async fetchData() {
            try {
                const [cardsRes, journeyRes, potentialsRes] = await Promise.all([
                    fetch('./data/cards.json'),
                    fetch('./data/journey_data.json'),
                    fetch('./data/potentials.json')
                ]);

                const cardsData = await cardsRes.json();
                const journeyData = await journeyRes.json();
                const potentialsData = await potentialsRes.json();

                this.processData(cardsData, journeyData, potentialsData);
            } catch (error) {
                console.error('Failed to fetch data:', error);
                this.resultsContainer.innerHTML = '<div class="empty-state">데이터를 불러오는 중 오류가 발생했습니다.</div>';
            }
        },

        processData(cards, journeys, potentials) {
            this.data.potentials = potentials;
            this.index = [];

            // 1. Process Cards
            cards.forEach(card => {
                // Fix: Handle Type Object
                let typeStr = '';
                if (card.타입) {
                    if (card.레어도 === 'SSR') {
                        typeStr = `${card.타입.훈련 || ''} / ${card.타입.보조1 || ''} / ${card.타입.보조2 || ''}`;
                    } else {
                        typeStr = card.타입.훈련 || '';
                    }
                }

                // Create a massive searchable string
                let potentialDesc = '';
                if (card.고유잠재 && card.고유잠재.이름 && potentials) {
                    potentialDesc = potentials[card.고유잠재.이름] || '';
                }
                let searchText = `${card.이름} ${card.캐릭터 || ''} ${card.레어도} ${typeStr} ${card.고유효과?.이름 || ''} ${card.고유효과?.설명 || ''} ${card.고유잠재?.이름 || ''} ${potentialDesc}`;

                // Add Event info to search text (Deep Indexing)
                if (card.이벤트) {
                    // Index Event Names
                    if (card.이벤트.이름 && Array.isArray(card.이벤트.이름)) {
                        searchText += ` ${card.이벤트.이름.join(' ')}`;
                    }

                    // Index Stages
                    ['1단계', '2단계', '3단계'].forEach(stageKey => {
                        const stage = card.이벤트[stageKey];
                        if (stage) {
                            // Index Choice Names
                            if (stage.이름_선택지) {
                                searchText += ` ${stage.이름_선택지.선택지A || ''} ${stage.이름_선택지.선택지B || ''}`;
                            }

                            // Index Choice Rewards (Deep Dive)
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

                // Index Support Info
                if (card.지원) {
                    card.지원.forEach(sup => {
                        searchText += ` ${sup.타입} ${sup.수치35} ${sup.수치50}`;
                    });
                }

                this.index.push({
                    type: 'card',
                    title: card.이름,
                    subtitle: `${card.레어도} | ${typeStr}`,
                    content: card.고유효과?.설명 || (card.고유잠재 ? `고유잠재: ${card.고유잠재.이름}` : '설명 없음'),
                    searchText: searchText.toLowerCase(),
                    data: card
                });
            });

            // 2. Process Journeys
            Object.keys(journeys).forEach(key => {
                const group = journeys[key];
                if (Array.isArray(group)) {
                    group.forEach(event => {
                        let searchText = `${event.name} ${event.category} ${event.timing || ''} ${event.condition || ''}`;

                        if (event.choices) {
                            event.choices.forEach(choice => {
                                searchText += ` ${choice.text} ${choice.result || ''} ${choice.result_positive || ''} ${choice.result_negative || ''}`;
                            });
                        }

                        this.index.push({
                            type: 'journey',
                            title: event.name,
                            subtitle: `${event.category} ${event.timing ? `(${event.timing})` : ''}`,
                            content: event.choices ? event.choices.map(c => c.text).join(', ') : '',
                            searchText: searchText.toLowerCase(),
                            data: event
                        });
                    });
                }
            });

            console.log(`Indexed ${this.index.length} items.`);
        },

        handleSearch(query) {
            const q = query.trim().toLowerCase();
            const showCards = this.filterCard.checked;
            const showJourneys = this.filterJourney.checked;

            if (q.length === 0) {
                this.resultsContainer.innerHTML = '<div class="empty-state">검색어를 입력해주세요.</div>';
                return;
            }

            const results = this.index.filter(item => {
                // Filter by Type
                if (item.type === 'card' && !showCards) return false;
                if (item.type === 'journey' && !showJourneys) return false;

                // Filter by Query
                if (window.HangulUtils) {
                    return window.HangulUtils.isMatch(item.searchText, q);
                }
                return item.searchText.includes(q);
            });

            this.renderResults(results, q);
        },

        renderResults(results, query) {
            this.resultsContainer.innerHTML = '';

            if (results.length === 0) {
                this.resultsContainer.innerHTML = '<div class="empty-state">검색 결과가 없습니다.</div>';
                return;
            }

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

                // Only add expand logic for Journeys, Cards use Modal
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

                this.resultsContainer.appendChild(card);
            });
        },

        highlightText(text, query) {
            if (!query || !text) return text;
            const regex = new RegExp(`(${query})`, 'gi');
            return text.replace(regex, '<span class="highlight">$1</span>');
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
                                    ${choice.condition ? `조건: ${choice.condition} / ` : ''}
                                    결과: ${choice.result || choice.result_positive || '-'}
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
            if (card.고유잠재 && card.고유잠재.이름 && this.data.potentials) {
                potentialDesc = this.data.potentials[card.고유잠재.이름] || '-';
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

                        // Check if B has content
                        const hasB = stage['선택지B'] && stage['선택지B'].length > 0 && stage['선택지B'][0].획득 && stage['선택지B'][0].획득.length > 0;

                        ['선택지A', '선택지B'].forEach(choiceKey => {
                            const choiceName = stage.이름_선택지?.[choiceKey] || (choiceKey === '선택지A' ? 'A' : 'B');
                            const choices = stage[choiceKey];

                            if (choices && choices.length > 0 && choices[0].획득 && choices[0].획득.length > 0) {
                                html += `<div class="choice-column">`;

                                // Only show header if it's B, OR if it's A and B also exists
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

    // Initialize
    SearchManager.init();
})();
