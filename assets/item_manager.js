const ItemManager = {
    data: [],
    filteredData: [],

    // Mappings
    tagMap: {
        0: '요리 음식',
        1: '훈련 서적',
        2: '부적',
        3: '귀중품'
    },

    placeMap: {
        0: 'NOA',
        1: '아가논',
        2: '플로라',
        3: '칼라이드',
        4: '여정 이벤트'
    },

    effectMap: {
        0: '힘',
        1: '체력',
        2: '인내',
        3: '집중',
        4: '보호',
        5: '랜덤 스탯',
        6: '올 스탯',
        7: '잠재력',
        8: '컨디션',
        9: '스태미나',
        10: '상태 획득',
        11: '상태 해제',
        12: '아이템',
        13: '주화',
        14: '일반 잠재력',
        15: '특수 잠재력',
        16: '인연'
    },

    targetMap: {
        1: '리더',
        2: '동료',
        3: '파티'
    },

    init: async function () {
        console.log('Initializing ItemManager...');
        await this.loadData();
        this.bindEvents();
        this.renderGrid();
    },

    loadData: async function () {
        try {
            const response = await fetch(`./data/item.json?v=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            this.data = await response.json();
            console.log(`Loaded ${this.data.length} items.`);
            this.filteredData = [...this.data];
        } catch (e) {
            console.error('Failed to load item data:', e);
            document.getElementById('item-grid').innerHTML = `<div class="error-message">데이터 로드 실패: ${e.message}</div>`;
        }
    },

    bindEvents: function () {
        const searchInput = document.getElementById('item-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        const filterTag = document.getElementById('filter-tag');
        if (filterTag) {
            filterTag.addEventListener('change', () => this.applyFilters());
        }

        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.applyFilters());
        }

        const closeBtn = document.querySelector('.close-button');
        if (closeBtn) {
            closeBtn.onclick = () => this.closeModal();
        }

        // Close modal on outside click
        const modal = document.getElementById('item-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    },

    handleSearch: function (term) {
        this.searchTerm = term.toLowerCase();
        this.applyFilters();
    },

    applyFilters: function () {
        const tagVal = document.getElementById('filter-tag').value;
        const sortVal = document.getElementById('sort-select').value;

        let result = this.data.filter(item => {
            // Search term
            if (this.searchTerm) {
                const nameMatch = item.name.toLowerCase().includes(this.searchTerm);
                const descMatch = (item.flavor_text || "").toLowerCase().includes(this.searchTerm);
                if (!nameMatch && !descMatch) return false;
            }

            // Tag filter
            if (tagVal !== 'all') {
                if (String(item.tag) !== tagVal) return false;
            }

            return true;
        });

        // Sort
        if (sortVal === 'name-asc') {
            result.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
        } else if (sortVal === 'rarity-desc') {
            result.sort((a, b) => (b.rarity || 0) - (a.rarity || 0));
        } else if (sortVal === 'rarity-asc') {
            result.sort((a, b) => (a.rarity || 0) - (b.rarity || 0));
        }
        // Default: usually keep original order (ID order)

        this.filteredData = result;
        this.renderGrid();
    },

    renderGrid: function () {
        const grid = document.getElementById('item-grid');
        grid.innerHTML = '';

        if (this.filteredData.length === 0) {
            grid.innerHTML = '<div class="no-data">검색 결과가 없습니다.</div>';
            return;
        }

        this.filteredData.forEach(item => {
            const card = document.createElement('div');
            card.className = `item-card rarity-${item.rarity}`;

            // Image handling
            let imgName = item.image;
            if (imgName && !imgName.endsWith('.png') && !imgName.endsWith('.webp')) {
                imgName += '.png';
            }
            const imgPath = `images/item/${imgName}`;

            card.innerHTML = `
                <img src="${imgPath}" onerror="this.closest('.item-card').style.display='none'" alt="${item.name}">
                <div class="name">${item.name}</div>
            `;

            card.onclick = () => this.openModal(item);
            grid.appendChild(card);
        });
    },

    openModal: function (item) {
        const modal = document.getElementById('item-modal');
        if (!modal) return;

        // Populate Content
        let imgName = item.image;
        if (imgName && !imgName.endsWith('.png') && !imgName.endsWith('.webp')) {
            imgName += '.png';
        }

        // Image Container Border (Rarity)
        const imgContainer = document.querySelector('.item-image-container');
        if (imgContainer) {
            // Remove old rarity classes
            imgContainer.className = imgContainer.className.replace(/rarity-\d+/g, '').trim();
            // Add new rarity class
            imgContainer.classList.add(`rarity-${item.rarity}`);
        }

        const imgEl = document.getElementById('item-image');
        imgEl.src = `images/item/${imgName}`;
        imgEl.style.display = 'block'; // Reset display state
        imgEl.onerror = function () { this.style.display = 'none'; }; // Hide if fails in modal too
        document.getElementById('item-name').innerText = item.name;

        // Tags
        const tagBadge = document.getElementById('item-tag-badge');
        tagBadge.innerText = this.tagMap[item.tag] || '기타';
        tagBadge.className = `tag tag-${item.tag}`;

        const costBadge = document.getElementById('item-cost-badge');
        if (item.cost) {
            costBadge.innerText = `가격: ${item.cost}`;
            costBadge.style.display = 'inline-block';
        } else {
            costBadge.style.display = 'none';
        }

        // New Badges for Tax 2 (Poten/Target)
        const refundBadge = document.getElementById('item-refund-badge');
        const targetBadge = document.getElementById('item-target-badge');

        if (item.tag === 2 && item.refund_poten) {
            refundBadge.innerText = `잠재력 ${item.refund_poten}`;
            refundBadge.style.display = 'inline-block';
        } else {
            refundBadge.style.display = 'none';
        }

        if (item.tag === 2 && item.target) {
            const targetName = this.targetMap[item.target] || item.target;
            targetBadge.innerText = targetName;
            targetBadge.style.display = 'inline-block';
        } else {
            targetBadge.style.display = 'none';
        }

        // Desc
        document.getElementById('item-desc').innerText = item.flavor_text || "설명이 없습니다.";

        // Effects
        const effectsList = document.getElementById('item-effects');
        effectsList.innerHTML = '';
        const effectSection = document.getElementById('effect-section');

        let hasEffects = false;

        // Standard Effects (type/value pairs)
        if (item.effects && item.effects.length > 0) {
            item.effects.forEach(eff => {
                // If type is string like "0,1,2", split it? 
                // The sample json showed: "type": "0,1,2", "value": "16,32,48"
                // I should handle this.
                const types = String(eff.type).split(',').map(s => s.trim());
                const values = String(eff.value).split(',').map(s => s.trim());

                types.forEach((t, index) => {
                    const val = values[index] || values[0]; // fallback
                    const typeId = parseInt(t);
                    const typeName = this.effectMap[typeId] || `효과 ${t}`;
                    const li = document.createElement('li');

                    if (item.tag === 1) {
                        // Training Book: show value only
                        li.innerText = val;
                    } else {
                        li.innerText = `${typeName}: ${val}`;
                    }

                    effectsList.appendChild(li);
                });
                hasEffects = true;
            });
        }

        // Tag 2 (Charm) specific effects
        // Poten/Target moved to badges, so only effect_desc remains here
        if (item.tag === 2) {
            if (item.effect_desc) {
                const li = document.createElement('li');
                li.innerText = item.effect_desc;
                effectsList.appendChild(li);
                hasEffects = true;
            }
        }

        effectSection.style.display = hasEffects ? 'block' : 'none';

        // Obtain Place
        const obtSection = document.getElementById('obt-section');

        // Default Logic
        let label = "획득 장소";
        let obtText = "";

        // Check if item has a specific place (0, 1, 2, 3)
        // obt_place might be number or string "0,1"
        let hasSpecificPlace = false;
        if (item.obt_place !== undefined && item.obt_place !== null) {
            const places = String(item.obt_place).split(',').map(s => s.trim());
            // If any place is NOT 4 (Journey Event), we consider it having a place.
            if (places.some(p => p !== '4')) {
                hasSpecificPlace = true;
            }
        }

        if (item.tag === 2 && !hasSpecificPlace) {
            // Special logic for Tag 2 (Charm) - Only Event
            label = "획득 이벤트";
            obtText = item.obt_journey_name || "";
        } else {
            // Normal Logic (includes Tag 2 with specific place)
            let placeText = "";
            if (item.obt_place !== undefined && item.obt_place !== null) {
                const places = String(item.obt_place).split(',').map(s => s.trim());
                const placeNames = places.map(p => this.placeMap[p] || p).filter(s => s);
                if (placeNames.length > 0) {
                    placeText = placeNames.join(', ');
                }
            }

            obtText = placeText;
            if (item.obt_journey_name) {
                if (obtText) obtText += " / ";
                obtText += `여정: ${item.obt_journey_name}`;
            }
        }

        obtSection.querySelector('h3').innerText = label;
        document.getElementById('item-obt-place').innerText = obtText;


        // Usage (Request Journey)
        const usageSection = document.getElementById('usage-section');
        if (item.req_journey_name) {
            document.getElementById('item-journey-req').innerText = item.req_journey_name;
            usageSection.style.display = 'block';
        } else {
            usageSection.style.display = 'none';
        }

        modal.classList.remove('hidden');
    },

    closeModal: function () {
        const modal = document.getElementById('item-modal');
        if (modal) modal.classList.add('hidden');
    }
};

window.ItemManager = ItemManager;
