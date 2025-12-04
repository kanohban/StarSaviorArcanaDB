const SearchService = (function () {
    let index = [];
    let isDataLoaded = false;

    // Debounce Utility
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    // Index Building Logic (Centralized)
    function buildIndex(cards, journeys, potentials) {
        index = [];

        // 1. Process Cards
        cards.forEach(card => {
            if (!card.이름) return;

            let typeStr = '';
            if (card.타입) {
                if (card.레어도 === 'SSR') {
                    typeStr = `${card.타입.훈련 || ''} / ${card.타입.보조1 || ''} / ${card.타입.보조2 || ''}`;
                } else {
                    typeStr = card.타입.훈련 || '';
                }
            }

            let potentialDesc = '';
            if (card.고유잠재 && card.고유잠재.이름 && potentials) {
                potentialDesc = potentials[card.고유잠재.이름] || '';
            }

            let searchText = `${card.이름} ${card.캐릭터 || ''} ${card.레어도} ${typeStr} ${card.고유효과?.이름 || ''} ${card.고유효과?.설명 || ''} ${card.고유잠재?.이름 || ''} ${potentialDesc}`;

            // Event Info (Deep Indexing)
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

            index.push({
                type: 'card',
                title: card.이름,
                subtitle: `${card.레어도} | ${typeStr}`,
                content: card.고유효과?.설명 || (card.고유잠재 ? `고유잠재: ${card.고유잠재.이름}` : '설명 없음'),
                searchText: searchText.toLowerCase(),
                data: card
            });
        });

        // 2. Process Journeys (if provided)
        if (journeys) {
            Object.keys(journeys).forEach(key => {
                const group = journeys[key];
                if (Array.isArray(group)) {
                    group.forEach(event => {
                        if (!event.name) return;
                        let searchText = `${event.name} ${event.category} ${event.timing || ''} ${event.condition || ''}`;

                        if (event.choices) {
                            event.choices.forEach(choice => {
                                searchText += ` ${choice.text} ${choice.result || ''} ${choice.result_positive || ''} ${choice.result_negative || ''}`;
                            });
                        }

                        index.push({
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
        }

        isDataLoaded = true;
        console.log(`SearchService: Indexed ${index.length} items.`);
    }

    // Search Function
    function search(query, filters = {}) {
        if (!isDataLoaded) return [];

        const q = query.trim().toLowerCase();
        if (!q) return [];

        return index.filter(item => {
            // Filter by Type
            if (filters.showCards === false && item.type === 'card') return false;
            if (filters.showJourneys === false && item.type === 'journey') return false;

            // Filter by Query
            if (window.HangulUtils) {
                return window.HangulUtils.isMatch(item.searchText, q);
            }
            return item.searchText.includes(q);
        });
    }

    // Get Index (for main page filtering if needed directly)
    function getIndex() {
        return index;
    }

    return {
        buildIndex,
        search,
        debounce,
        getIndex
    };
})();

window.SearchService = SearchService;
