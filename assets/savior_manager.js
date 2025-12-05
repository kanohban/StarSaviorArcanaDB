// Savior Manager
const SaviorManager = {
    data: {},
    flavorData: [],
    maxStats: {
        공격력: 0,
        체력: 0,
        방어력: 0,
        치명률: 0,
        치명뎀: 0
    },
    filterGrade: 'all',
    filterAttribute: 'all',
    filterClass: 'all',
    sortOrder: 'default', // default, name-asc, name-desc
    filteredList: [], // Store currently rendered list for navigation
    currentSavior: null,
    activeTab: 'stats', // Default active tab
    searchTerm: '',

    init: async function () {
        console.log('SaviorManager init started');
        await this.loadData();
        this.calculateMaxStats();
        this.renderGrid();
        this.bindEvents();
    },

    loadData: async function () {
        try {
            console.log('Fetching savior data...');
            const [saviorRes, flavorRes] = await Promise.all([
                fetch('./data/savior_data.json'),
                fetch('./data/flavor_text.json')
            ]);

            if (!saviorRes.ok) throw new Error(`Savior Data HTTP error! status: ${saviorRes.status}`);
            if (!flavorRes.ok) throw new Error(`Flavor Text HTTP error! status: ${flavorRes.status}`);

            this.data = await saviorRes.json();
            this.flavorData = await flavorRes.json();

            console.log('Savior data loaded:', Object.keys(this.data).length, 'entries');
            console.log('Flavor text loaded:', this.flavorData.length, 'entries');
        } catch (error) {
            console.error('Failed to load data:', error);
            const grid = document.getElementById('savior-grid');
            if (grid) grid.innerHTML = `<div class="error-message">데이터 로드 실패: ${error.message}</div>`;
        }
    },

    calculateMaxStats: function () {
        Object.values(this.data).forEach(savior => {
            const stats = savior.stats;
            if (!stats) return;
            this.maxStats.공격력 = Math.max(this.maxStats.공격력, stats.공격력 || 0);
            this.maxStats.체력 = Math.max(this.maxStats.체력, stats.체력 || 0);
            this.maxStats.방어력 = Math.max(this.maxStats.방어력, stats.방어력 || 0);
            this.maxStats.치명률 = Math.max(this.maxStats.치명률, stats.치명률 || 0);
            this.maxStats.치명뎀 = Math.max(this.maxStats.치명뎀, stats.치명뎀 || 0);
        });
    },

    renderGrid: function () {
        const grid = document.getElementById('savior-grid');
        grid.innerHTML = '';

        let saviors = Object.values(this.data);

        // Filter
        saviors = this.filterSaviors(saviors);

        // Sort
        saviors = this.sortSaviors(saviors);

        this.filteredList = saviors; // Update filtered list for navigation

        if (saviors.length === 0) {
            grid.innerHTML = '<div style="color:white;">데이터가 없습니다. (No Data)</div>';
            return;
        }

        saviors.forEach(savior => {
            const item = document.createElement('div');
            item.className = 'savior-item';
            item.innerHTML = `
                <img src="images/icon/${savior.profile.이름}.webp" onerror="this.style.display='none'">
                <span class="name">${savior.profile.이름}</span>
            `;
            item.onclick = () => this.openModal(savior);
            grid.appendChild(item);
        });
    },

    filterSaviors: function (saviors) {
        return saviors.filter(s => {
            const gradeMatch = this.filterGrade === 'all' || s.profile.등급 === this.filterGrade;
            const attrMatch = this.filterAttribute === 'all' || s.profile.속성 === this.filterAttribute;
            const classMatch = this.filterClass === 'all' || s.profile.클래스 === this.filterClass;

            let searchMatch = true;
            if (this.searchTerm) {
                const term = this.searchTerm.toLowerCase();
                const p = s.profile;

                // 1. Basic Profile Search
                if (p.이름.toLowerCase().includes(term) ||
                    (window.HangulUtils && window.HangulUtils.isMatch(p.이름, term))) {
                    searchMatch = true;
                } else if (p.속성.includes(term) || p.클래스.includes(term) || p.소속.includes(term)) {
                    searchMatch = true;
                } else if (p['캐릭터 소개'] && p['캐릭터 소개'].toLowerCase().includes(term)) {
                    searchMatch = true;
                } else {
                    // 2. Deep Skill Search
                    let skillMatch = false;
                    if (s.skills) {
                        const skillTypes = ['패시브', '기본기', '특수기', '궁극기'];
                        for (const type of skillTypes) {
                            const name = s.skills[type];
                            const desc = s.skills[`${type}_설명`];
                            if ((name && name.toLowerCase().includes(term)) ||
                                (desc && desc.toLowerCase().includes(term))) {
                                skillMatch = true;
                                break;
                            }
                        }
                    }
                    searchMatch = skillMatch;
                }
            }

            return gradeMatch && attrMatch && classMatch && searchMatch;
        });
    },

    sortSaviors: function (saviors) {
        if (this.sortOrder === 'name-asc') {
            return saviors.sort((a, b) => a.profile.이름.localeCompare(b.profile.이름));
        } else if (this.sortOrder === 'name-desc') {
            return saviors.sort((a, b) => b.profile.이름.localeCompare(a.profile.이름));
        } else {
            // Default Sort: SSR -> SR, then Sun -> Moon -> Star -> Order -> Chaos, then Class
            const gradeOrder = { 'SSR': 1, 'SR': 2 };
            const attrOrder = { '태양': 1, '달': 2, '별': 3, '질서': 4, '혼돈': 5 };
            const classOrder = { '스트라이커': 1, '어쌔신': 2, '레인저': 3, '캐스터': 4, '디펜더': 5, '서포터': 6 };

            return saviors.sort((a, b) => {
                const gradeDiff = (gradeOrder[a.profile.등급] || 99) - (gradeOrder[b.profile.등급] || 99);
                if (gradeDiff !== 0) return gradeDiff;

                const attrDiff = (attrOrder[a.profile.속성] || 99) - (attrOrder[b.profile.속성] || 99);
                if (attrDiff !== 0) return attrDiff;

                const classDiff = (classOrder[a.profile.클래스] || 99) - (classOrder[b.profile.클래스] || 99);
                if (classDiff !== 0) return classDiff;

                return a.profile.이름.localeCompare(b.profile.이름);
            });
        }
    },

    openModal: function (savior) {
        const modal = document.getElementById('savior-modal');
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        this.currentSavior = savior;

        // Reset Tabs based on activeTab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        const tabToActivate = this.activeTab || 'stats';
        const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabToActivate}"]`);
        const tabContent = document.getElementById(`tab-${tabToActivate}`);

        if (tabBtn) tabBtn.classList.add('active');
        if (tabContent) tabContent.classList.add('active');

        this.renderModalContent(savior);
    },

    closeModal: function () {
        const modal = document.getElementById('savior-modal');
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        this.currentSavior = null;
        this.activeTab = 'stats'; // Reset to default on close
    },

    showPrevSavior: function () {
        if (!this.currentSavior || this.filteredList.length === 0) return;
        const currentIndex = this.filteredList.findIndex(s => s.profile.이름 === this.currentSavior.profile.이름);
        if (currentIndex === -1) return;

        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) prevIndex = this.filteredList.length - 1; // Loop

        this.openModal(this.filteredList[prevIndex]);
    },

    showNextSavior: function () {
        if (!this.currentSavior || this.filteredList.length === 0) return;
        const currentIndex = this.filteredList.findIndex(s => s.profile.이름 === this.currentSavior.profile.이름);
        if (currentIndex === -1) return;

        let nextIndex = currentIndex + 1;
        if (nextIndex >= this.filteredList.length) nextIndex = 0; // Loop

        this.openModal(this.filteredList[nextIndex]);
    },

    renderModalContent: function (savior) {
        // Render Left Column
        document.getElementById('savior-illust').src = `images/illust/${savior.profile.이름}.webp`;
        document.getElementById('savior-arcpoint').src = `images/arcpoint/${savior.profile.이름}.webp`;
        document.getElementById('arcpoint-wrapper').classList.add('spoiler-active'); // Reset spoiler

        // Render Profile Header
        document.getElementById('savior-icon').src = `images/icon/${savior.profile.이름}.webp`;
        document.getElementById('savior-name').textContent = savior.profile.이름;

        const elElement = document.getElementById('savior-element');
        const elClass = document.getElementById('savior-class');
        const elRole = document.getElementById('savior-role');

        elElement.textContent = savior.profile.속성;
        elClass.textContent = savior.profile.클래스;
        elRole.textContent = savior.profile['공격 타입'];

        // Reset and apply base classes
        elElement.className = 'tag profile-badge';
        elClass.className = 'tag profile-badge badge-common';
        elRole.className = 'tag profile-badge badge-common';

        // Attribute specific styling
        const attrMap = {
            '태양': 'attr-sun',
            '달': 'attr-moon',
            '별': 'attr-star',
            '질서': 'attr-order',
            '혼돈': 'attr-chaos'
        };
        if (attrMap[savior.profile.속성]) {
            elElement.classList.add(attrMap[savior.profile.속성]);
        }



        document.getElementById('savior-desc').textContent = savior.profile['캐릭터 소개'];

        // Render Stats
        this.renderStats(savior);

        // Render Skills
        this.renderSkills(savior);

        // Render Detailed Profile
        this.renderProfileDetails(savior);
    },

    renderStats: function (savior) {
        const stats = savior.stats;
        const container = document.getElementById('basic-stats');
        container.innerHTML = '';

        if (!stats) return;

        document.getElementById('stat-max-level').textContent = stats.최대레벨;

        const statKeys = ['공격력', '체력', '방어력', '치명률', '치명뎀'];
        statKeys.forEach(key => {
            const val = stats[key];
            const max = this.maxStats[key];
            const percent = (val / max) * 100;

            // Rank Calculation
            const rank = Object.values(this.data)
                .map(s => s.stats[key] || 0)
                .sort((a, b) => b - a)
                .indexOf(val) + 1;

            const displayVal = (key === '치명률' || key === '치명뎀') ? `${(val * 100).toFixed(0)}%` : val.toLocaleString();

            const row = document.createElement('div');
            row.className = 'stat-row';
            row.innerHTML = `
                <span class="stat-name">${key}</span>
                <div class="stat-bar-container">
                    <div class="stat-bar-fill" style="width: ${percent}%"></div>
                </div>
                <span class="stat-val">${displayVal}</span>
                <span class="stat-rank">${rank}위</span>
            `;
            container.appendChild(row);
        });

        // Sub Stats
        const subContainer = document.getElementById('sub-stats');
        subContainer.innerHTML = `
            <div class="text-stat-item"><span>효과명중</span><span>${(stats.효과명중 * 100).toFixed(0)}%</span></div>
            <div class="text-stat-item"><span>효과저항</span><span>${(stats.효과저항 * 100).toFixed(0)}%</span></div>
            <div class="text-stat-item"><span>명중률</span><span>${(stats.명중률 * 100).toFixed(0)}%</span></div>
        `;

        // Journey Stats
        const journeyContainer = document.getElementById('journey-stats');
        journeyContainer.innerHTML = `
            <div class="journey-stat-item"><span class="journey-stat-label">힘</span><span class="journey-stat-value">${stats.힘}</span></div>
            <div class="journey-stat-item"><span class="journey-stat-label">체력</span><span class="journey-stat-value">${stats.체력_1}</span></div>
            <div class="journey-stat-item"><span class="journey-stat-label">인내</span><span class="journey-stat-value">${stats.인내}</span></div>
            <div class="journey-stat-item"><span class="journey-stat-label">집중</span><span class="journey-stat-value">${stats.집중}</span></div>
            <div class="journey-stat-item"><span class="journey-stat-label">보호</span><span class="journey-stat-value">${stats.보호}</span></div>
        `;

        // Potentials
        const potList = document.getElementById('potential-list');
        potList.innerHTML = `
            <li><span class="potential-level">Lv.3</span> ${stats.잠재력1 || '-'}</li>
            <li><span class="potential-level">Lv.6</span> ${stats.잠재력2 || '-'}</li>
            <li><span class="potential-level">Lv.10</span> ${stats.잠재력3 || '-'}</li>
        `;
    },

    renderSkills: function (savior) {
        const container = document.getElementById('skill-list');
        container.innerHTML = '';
        const skills = savior.skills;
        if (!skills) return;

        const skillTypes = ['패시브', '기본기', '특수기', '궁극기'];

        skillTypes.forEach(type => {
            const name = skills[type]; // e.g. "승진 욕심"
            if (!name) return;

            const desc = skills[`${type}_설명`] || '';
            let processedDesc = this.processFlavorText(desc);
            processedDesc = processedDesc.replace(/\\n|\n/g, '<br>');

            // New fields
            const cooldown = skills[`${type}_쿨`];
            const target = skills[`${type}_대상`];
            const nova = skills[`${type}_노바`];

            const iconName = `${savior.profile.이름}_${type}`;

            const div = document.createElement('div');
            div.className = 'skill-item';

            let metaHtml = '';
            if (cooldown || target) {
                metaHtml = `<div class="skill-meta">`;
                if (cooldown) metaHtml += `<span class="skill-badge cooldown">${cooldown}</span>`;
                if (target) metaHtml += `<span class="skill-badge target">${target}</span>`;
                metaHtml += `</div>`;
            }

            let novaHtml = '';
            if (nova) {
                novaHtml = `
                    <div class="skill-nova">
                        <span class="skill-badge nova">NOVA</span>
                        <span class="skill-nova-desc">${nova}</span>
                    </div>
                `;
            }

            div.innerHTML = `
                <img src="images/icon/${iconName}.webp" class="skill-icon" onerror="this.style.display='none'">
                <div class="skill-info">
                    <div class="skill-header">
                        <span class="skill-name">${name}</span>
                        <span class="skill-type">${type}</span>
                    </div>
                    ${metaHtml}
                    <div class="skill-desc">${processedDesc}</div>
                    ${novaHtml}
                </div>
            `;
            container.appendChild(div);
        });
    },

    processFlavorText: function (text) {
        if (!text) return '';
        let processed = text;

        // Find matching flavor texts from the global list
        const matchedFlavors = this.flavorData.filter(flavor => text.includes(flavor.키워드));

        matchedFlavors.forEach(flavor => {
            const keyword = flavor.키워드;
            const content = flavor.내용;

            if (processed.includes(keyword)) {
                // Escape special characters in content for HTML attribute
                const safeContent = content.replace(/"/g, '&quot;').replace(/\n/g, '&#10;');
                const replacement = `<span class="flavor-keyword" data-content="${safeContent}">${keyword}</span>`;
                processed = processed.split(keyword).join(replacement);
            }
        });
        return processed;
    },

    renderProfileDetails: function (savior) {
        const container = document.getElementById('profile-details');
        const p = savior.profile;

        // Excel Date Conversion
        const excelDate = p.생일;
        let birthdayStr = excelDate;
        if (typeof excelDate === 'number') {
            const date = new Date((excelDate - 25569) * 86400 * 1000);
            const month = date.getMonth() + 1;
            const day = date.getDate();
            birthdayStr = `${month}월 ${day}일`;
        }

        container.innerHTML = `
            <div class="profile-details-box">
                <p><strong>생일</strong> <span>${birthdayStr}</span></p>
                <p><strong>신장</strong> <span>${p.신장}cm</span></p>
                <p><strong>출신</strong> <span>${p.출신}</span></p>
                <p><strong>소속</strong> <span>${p.소속}</span></p>
                <p><strong>CV (KR)</strong> <span>${p['CV(KR)']}</span></p>
                <p><strong>CV (JP)</strong> <span>${p['CV(JP)']}</span></p>
            </div>
        `;
    },

    bindEvents: function () {
        // Modal Close
        const closeBtn = document.querySelector('.close-button');
        if (closeBtn) {
            closeBtn.onclick = () => this.closeModal();
        }

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

                e.target.classList.add('active');
                const tabId = e.target.dataset.tab;
                document.getElementById(`tab-${tabId}`).classList.add('active');

                this.activeTab = tabId; // Update active tab state
            };
        });

        // Spoiler Toggle
        document.getElementById('arcpoint-wrapper').onclick = function () {
            this.classList.toggle('spoiler-active');
        };

        // Flavor Tooltip Delegation (Click)
        document.body.addEventListener('click', (e) => {
            const tooltip = document.getElementById('flavor-tooltip');

            if (e.target.classList.contains('flavor-keyword')) {
                e.stopPropagation(); // Prevent closing immediately
                const content = e.target.dataset.content;

                // Toggle if clicking the same keyword, otherwise show new
                if (tooltip.textContent === content && !tooltip.classList.contains('hidden')) {
                    tooltip.classList.add('hidden');
                } else {
                    tooltip.innerHTML = content.replace(/\\n|\n/g, '<br>'); // Handle newlines in tooltip too
                    tooltip.classList.remove('hidden');

                    // Position logic
                    const rect = e.target.getBoundingClientRect();
                    let top = rect.bottom + 5;
                    let left = rect.left;

                    // Boundary check (simple)
                    if (left + 300 > window.innerWidth) {
                        left = window.innerWidth - 310;
                    }
                    if (top + 100 > window.innerHeight) {
                        top = rect.top - 100; // Show above if too low
                    }

                    tooltip.style.top = `${top}px`;
                    tooltip.style.left = `${left}px`;
                }
            } else {
                // Close if clicking outside
                if (!tooltip.contains(e.target)) {
                    tooltip.classList.add('hidden');
                }
            }
        });

        // Search
        document.getElementById('savior-search').addEventListener('input', (e) => {
            this.searchTerm = e.target.value.trim();
            this.renderGrid();
        });

        // Filter Selects
        document.getElementById('filter-grade').addEventListener('change', (e) => {
            this.filterGrade = e.target.value;
            this.renderGrid();
        });

        document.getElementById('filter-attribute').addEventListener('change', (e) => {
            this.filterAttribute = e.target.value;
            this.renderGrid();
        });

        document.getElementById('filter-class').addEventListener('change', (e) => {
            this.filterClass = e.target.value;
            this.renderGrid();
        });

        // Sort Select
        document.getElementById('sort-select').addEventListener('change', (e) => {
            this.sortOrder = e.target.value;
            this.renderGrid();
        });

        // Navigation Buttons
        document.querySelector('.prev-btn').onclick = (e) => {
            e.stopPropagation();
            this.navigate(-1);
        };
        document.querySelector('.next-btn').onclick = (e) => {
            e.stopPropagation();
            this.navigate(1);
        };

        // Keyboard Navigation
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('savior-modal').classList.contains('hidden')) return;
            if (e.key === 'Escape') this.closeModal();
            if (e.key === 'ArrowLeft') this.navigate(-1);
            if (e.key === 'ArrowRight') this.navigate(1);
        });
    },

    navigate: function (direction) {
        if (!this.currentSavior || this.filteredList.length === 0) return;

        const currentIndex = this.filteredList.findIndex(s => s.profile.이름 === this.currentSavior.profile.이름);
        if (currentIndex === -1) return;

        let newIndex = currentIndex + direction;
        if (newIndex < 0) newIndex = this.filteredList.length - 1;
        if (newIndex >= this.filteredList.length) newIndex = 0;

        this.openModal(this.filteredList[newIndex]);
    }
};



window.SaviorManager = SaviorManager;
