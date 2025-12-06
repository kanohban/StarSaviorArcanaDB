// Savior Manager
const SaviorManager = {
    skillLevels: {},
    data: {},
    flavorData: [],
    searchTerm: '',
    filterGrade: 'all',
    filterAttr: 'all',
    filterClass: 'all',

    globalMaxStats: {
        c_atk: 5000, c_hp: 30000, c_def: 2500, c_spd: 130, crt_r: 1, crt_d: 3
    },

    init: async function () {
        console.log('Initializing SaviorManager...');
        this.activeTab = 'stats'; // Default tab
        this.bindEvents();
        await this.loadData();
        this.prepareRanks();
        this.calculateGlobalMaxStats();
        this.renderGrid();
        console.log('SaviorManager Initialized.');
    },

    loadData: async function () {
        try {
            console.log('Fetching savior data...');
            const [profileRes, statsRes, flavorRes] = await Promise.all([
                fetch('./data/savior_profile.json'),
                fetch('./data/savior_stats.json'),
                fetch('./data/flavor_text.json')
            ]);
            if (!profileRes.ok) throw new Error(`Profile Data HTTP error! status: ${profileRes.status}`);
            if (!statsRes.ok) throw new Error(`Stats Data HTTP error! status: ${statsRes.status}`);
            if (!flavorRes.ok) throw new Error(`Flavor Text HTTP error! status: ${flavorRes.status}`);

            try {
                const skillLevelRes = await fetch('./data/savior_skill_levels.json');
                if (skillLevelRes.ok) {
                    this.skillLevels = await skillLevelRes.json();
                } else {
                    console.warn(`Skill level data not found: ${skillLevelRes.status}`);
                }
            } catch (slError) {
                console.warn('Failed to load skill levels:', slError);
            }

            const profiles = await profileRes.json();
            const stats = await statsRes.json();
            this.flavorData = await flavorRes.json();

            // Load Potentials separately
            try {
                const potentialsRes = await fetch('./data/potentials.json');
                if (potentialsRes.ok) {
                    this.potentialData = await potentialsRes.json();
                } else {
                    console.warn(`Potentials data not found: ${potentialsRes.status}`);
                    this.potentialData = {};
                }
            } catch (potError) {
                console.warn('Failed to load potentials:', potError);
                this.potentialData = {};
            }

            this.data = {};
            for (const id in profiles) {
                this.data[id] = {
                    ...profiles[id],
                    stats: stats[id] || {}
                };
            }
            console.log('Savior data loaded:', Object.keys(this.data).length, 'entries');
        } catch (error) {
            console.error('Failed to load data:', error);
            const grid = document.getElementById('savior-grid');
            if (grid) grid.innerHTML = `<div class="error-message">데이터 로드 실패: ${error.message}</div>`;
        }
    },

    calculateGlobalMaxStats: function () {
        const stats = Object.values(this.data).map(s => s.stats).filter(s => s);
        if (stats.length === 0) return;

        const keys = ['c_atk', 'c_hp', 'c_def', 'c_spd', 'crt_r', 'crt_d'];
        keys.forEach(key => {
            const maxVal = Math.max(...stats.map(s => s[key] || 0));
            // Ensure min value to avoid division by zero or weird small bars, default to at least the old defaults if max is 0 (unlikely)
            this.globalMaxStats[key] = maxVal > 0 ? maxVal : this.globalMaxStats[key];
        });
        console.log('Global Max Stats Calculated:', this.globalMaxStats);
    },

    prepareRanks: function () {
        const stats = Object.values(this.data).map(s => s.stats).filter(s => s);
        const keys = ['c_atk', 'c_hp', 'c_def', 'c_spd', 'crt_r', 'crt_d'];

        keys.forEach(key => {
            // Sort descending
            const sorted = [...stats].sort((a, b) => (b[key] || 0) - (a[key] || 0));
            // Assign ranks (Joint Ranking)
            let currentRank = 1;
            for (let i = 0; i < sorted.length; i++) {
                if (i > 0 && (sorted[i][key] || 0) === (sorted[i - 1][key] || 0)) {
                    // Tie: use same rank as previous
                    sorted[i].ranks = sorted[i].ranks || {};
                    sorted[i].ranks[key] = sorted[i - 1].ranks[key];
                } else {
                    // New rank: i + 1 (standard competition ranking: 1, 1, 3)
                    sorted[i].ranks = sorted[i].ranks || {};
                    sorted[i].ranks[key] = i + 1;
                }
            }
        });
    },

    calculateMaxStats: function (savior) {
        const s = savior.stats || {};
        const maxVals = this.globalMaxStats;
        return {
            atk: Math.min(100, (s.c_atk / maxVals.c_atk) * 100),
            hp: Math.min(100, (s.c_hp / maxVals.c_hp) * 100),
            def: Math.min(100, (s.c_def / maxVals.c_def) * 100),
            spd: Math.min(100, (s.c_spd / maxVals.c_spd) * 100),
            crt_r: Math.min(100, (s.crt_r / maxVals.crt_r) * 100),
            crt_d: Math.min(100, (s.crt_d / maxVals.crt_d) * 100)
        };
    },

    renderGrid: function () {
        const grid = document.getElementById('savior-grid');
        if (!grid) return;
        grid.innerHTML = '';

        let saviors = Object.values(this.data);
        saviors = this.filterSaviors(saviors);
        saviors = this.sortSaviors(saviors);
        this.filteredList = saviors;

        if (saviors.length === 0) {
            grid.innerHTML = '<div style="color:white; text-align:center; padding:20px;">데이터가 없습니다. (No Data)</div>';
            return;
        }

        saviors.forEach(savior => {
            const p = savior.profile;
            const div = document.createElement('div');
            div.className = 'savior-item';

            const iconPath = `images/icon/${p.name}.webp`;

            // Simple Item Structure (Image + Name only) as per user screenshot
            div.innerHTML = `
                <img src="${iconPath}" alt="${p.name}" onerror="this.src='images/icon/default.webp'">
                <div class="name">${p.name}</div>
            `;

            div.onclick = () => this.openModal(savior.id);
            grid.appendChild(div);
        });
    },

    filterSaviors: function (list) {
        return list.filter(s => {
            const p = s.profile;
            if (this.searchTerm) {
                const term = this.searchTerm.toLowerCase();
                const text = (p.name + p.desc + s.skills.name + s.skills.psv_nm + s.skills.bsc_nm + s.skills.spc_nm + s.skills.ult_nm).toLowerCase();
                if (!text.includes(term)) return false;
            }
            if (this.filterGrade && this.filterGrade !== 'all') { if (p.rank !== this.filterGrade) return false; }
            if (this.filterAttr && this.filterAttr !== 'all') { if (p.attr !== this.filterAttr) return false; }
            if (this.filterClass && this.filterClass !== 'all') { if (p.cls !== this.filterClass) return false; }
            return true;
        });
    },

    sortSaviors: function (list) {
        const sortType = document.getElementById('sort-select') ? document.getElementById('sort-select').value : 'default';

        // Define Custom Orders
        const rankOrder = { 'SSR': 1, 'SR': 2, 'R': 3 };
        const attrOrder = { '태양': 1, '달': 2, '별': 3, '질서': 4, '혼돈': 5 };
        const classOrder = { '스트라이커': 1, '어쌔신': 2, '레인저': 3, '캐스터': 4, '디펜더': 5, '서포터': 6 };

        return list.sort((a, b) => {
            const pa = a.profile;
            const pb = b.profile;

            if (sortType === 'name-asc') return pa.name.localeCompare(pb.name, 'ko');
            if (sortType === 'name-desc') return pb.name.localeCompare(pa.name, 'ko');

            // Default Sort: Rank -> Attr -> Class -> Name

            // 1. Rank (SSR -> SR)
            const rA = rankOrder[pa.rank] || 99;
            const rB = rankOrder[pb.rank] || 99;
            if (rA !== rB) return rA - rB;

            // 2. Attribute (Sun -> Moon -> Star -> Order -> Chaos)
            const aA = attrOrder[pa.attr] || 99;
            const aB = attrOrder[pb.attr] || 99;
            if (aA !== aB) return aA - aB;

            // 3. Class (Striker -> Assassin -> Ranger -> Caster -> Defender -> Supporter)
            const cA = classOrder[pa.cls] || 99;
            const cB = classOrder[pb.cls] || 99;
            if (cA !== cB) return cA - cB;

            // 4. Name
            return pa.name.localeCompare(pb.name, 'ko');
        });
    },

    openModal: function (id) {
        const savior = this.data[id];
        if (!savior) return;
        this.currentSaviorId = id;
        const modal = document.getElementById('savior-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.renderModalContent(savior);
        }
    },

    closeModal: function () {
        const modal = document.getElementById('savior-modal');
        if (modal) modal.classList.add('hidden');
    },

    showPrevSavior: function () {
        if (!this.filteredList || !this.currentSaviorId) return;
        const idx = this.filteredList.findIndex(s => s.id === this.currentSaviorId);
        if (idx > 0) this.openModal(this.filteredList[idx - 1].id);
    },

    showNextSavior: function () {
        if (!this.filteredList || !this.currentSaviorId) return;
        const idx = this.filteredList.findIndex(s => s.id === this.currentSaviorId);
        if (idx < this.filteredList.length - 1) this.openModal(this.filteredList[idx + 1].id);
    },

    renderModalContent: function (savior) {
        const p = savior.profile;
        const illustImg = document.getElementById('savior-illust');
        illustImg.src = `images/illust/${p.name}.webp`;
        illustImg.onclick = () => this.openImagePopup(illustImg.src);

        const arcImg = document.getElementById('savior-arcpoint');
        arcImg.src = `images/arcpoint/${p.name}.webp`;

        // Reset spoiler state on new render
        const arcWrapper = document.getElementById('arcpoint-wrapper');
        if (arcWrapper) arcWrapper.classList.add('spoiler-active');

        document.getElementById('savior-icon').src = `images/icon/${p.name}.webp`;
        document.getElementById('savior-name').innerText = p.name;
        document.getElementById('savior-element').innerText = p.attr;

        const attrMap = { '태양': 'sun', '달': 'moon', '별': 'star', '질서': 'order', '혼돈': 'chaos' };
        const attrClass = attrMap[p.attr] || 'unknown';
        document.getElementById('savior-element').className = `tag attr-${attrClass}`;

        document.getElementById('savior-class').innerText = p.cls;
        document.getElementById('savior-class').className = 'profile-badge badge-common';

        document.getElementById('savior-role').innerText = p.atk_t;
        document.getElementById('savior-role').className = 'profile-badge badge-common';

        document.getElementById('savior-desc').innerText = p.desc;

        // Restore active tab
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        const targetTab = this.activeTab || 'stats';
        const btn = document.querySelector(`.tab-btn[data-tab="${targetTab}"]`);
        const content = document.getElementById(`tab-${targetTab}`);

        if (btn) btn.classList.add('active');
        if (content) content.classList.add('active');

        this.renderStats(savior);
        this.renderSkills(savior);
        this.renderProfileDetails(savior);
    },

    openImagePopup: function (src) {
        const popup = document.getElementById('image-popup');
        const img = document.getElementById('popup-img');
        if (popup && img) {
            img.src = src;
            popup.classList.remove('hidden');
        }
    },

    closeImagePopup: function () {
        const popup = document.getElementById('image-popup');
        if (popup) {
            popup.classList.add('hidden');
        }
    },

    renderStats: function (savior) {
        const s = savior.stats;
        if (!s) return;

        // Level Logic: SSR -> 200, Others -> 160
        const maxLevel = (savior.profile.rank === 'SSR') ? 200 : 160;
        document.getElementById('stat-max-level').innerText = maxLevel;

        const percs = this.calculateMaxStats(savior);
        const barsContainer = document.getElementById('basic-stats');

        const ranks = s.ranks || {};

        barsContainer.innerHTML = `
            <div class="stat-row">
                <div class="stat-name">공격력</div>
                <div class="stat-bar-container"><div class="stat-bar-fill" style="width:${percs.atk}%"></div></div>
                <div class="stat-val">${s.c_atk.toLocaleString()}</div>
                <div class="stat-rank">${ranks.c_atk || '-'}위</div>
            </div>
            <div class="stat-row">
                <div class="stat-name">생명력</div>
                <div class="stat-bar-container"><div class="stat-bar-fill" style="width:${percs.hp}%"></div></div>
                <div class="stat-val">${s.c_hp.toLocaleString()}</div>
                <div class="stat-rank">${ranks.c_hp || '-'}위</div>
            </div>
            <div class="stat-row">
                <div class="stat-name">방어력</div>
                <div class="stat-bar-container"><div class="stat-bar-fill" style="width:${percs.def}%"></div></div>
                <div class="stat-val">${s.c_def.toLocaleString()}</div>
                <div class="stat-rank">${ranks.c_def || '-'}위</div>
            </div>
            <div class="stat-row">
                <div class="stat-name">속도</div>
                <div class="stat-bar-container"><div class="stat-bar-fill" style="width:${percs.spd}%"></div></div>
                <div class="stat-val">${s.c_spd}</div>
                <div class="stat-rank">${ranks.c_spd || '-'}위</div>
            </div>
            <div class="stat-row">
                <div class="stat-name">치명타 확률</div>
                <div class="stat-bar-container"><div class="stat-bar-fill" style="width:${percs.crt_r}%"></div></div>
                <div class="stat-val">${(s.crt_r * 100).toFixed(0)}%</div>
                <div class="stat-rank">${ranks.crt_r || '-'}위</div>
            </div>
            <div class="stat-row">
                <div class="stat-name">치명타 피해</div>
                <div class="stat-bar-container"><div class="stat-bar-fill" style="width:${percs.crt_d}%"></div></div>
                <div class="stat-val">${(s.crt_d * 100).toFixed(0)}%</div>
                <div class="stat-rank">${ranks.crt_d || '-'}위</div>
            </div>
        `;

        const subStats = document.getElementById('sub-stats');
        subStats.innerHTML = `
            <div class="text-stat-item"><span>효과 적중</span><span>${(s.eff_a * 100).toFixed(0)}%</span></div>
            <div class="text-stat-item"><span>효과 저항</span><span>${(s.eff_r * 100).toFixed(0)}%</span></div>
            <div class="text-stat-item"><span>명중률</span><span>${(s.c_acc * 100).toFixed(0)}%</span></div>
        `;

        const journeyGrid = document.getElementById('journey-stats');
        journeyGrid.innerHTML = `
             <div class="journey-stat-item"><span class="journey-stat-label">힘</span><div class="journey-stat-value">${s.j_str}</div></div>
             <div class="journey-stat-item"><span class="journey-stat-label">체력</span><div class="journey-stat-value">${s.j_vit}</div></div>
             <div class="journey-stat-item"><span class="journey-stat-label">인내</span><div class="journey-stat-value">${s.j_end}</div></div>
             <div class="journey-stat-item"><span class="journey-stat-label">집중</span><div class="journey-stat-value">${s.j_foc}</div></div>
             <div class="journey-stat-item"><span class="journey-stat-label">보호</span><div class="journey-stat-value">${s.j_prt}</div></div>
        `;

        const potList = document.getElementById('potential-list');
        potList.innerHTML = '';

        const renderPotentialItem = (level, name) => {
            if (!name) return '';
            // Exclusive lookup from this.potentialData
            let desc = (this.potentialData && this.potentialData[name]) || '';
            // Basic Lv replacement if present in description
            desc = desc.replace('Lv', level);
            // Escape quotes and newlines for attribute
            const safeContent = desc.replace(/"/g, '&quot;').replace(/\n/g, '&#10;');

            // Only add flavor-keyword class if there is a description
            const keywordClass = desc ? 'flavor-keyword' : '';
            const dataAttr = desc ? `data-content="${safeContent}"` : '';

            return `<li><span class="potential-level">Lv.${level}</span> <span class="potential-desc ${keywordClass}" ${dataAttr}>${name}</span></li>`;
        };

        if (s.pot_1) potList.innerHTML += renderPotentialItem(3, s.pot_1);
        if (s.pot_2) potList.innerHTML += renderPotentialItem(6, s.pot_2);
        if (s.pot_3) potList.innerHTML += renderPotentialItem(10, s.pot_3);
    },

    renderSkills: function (savior) {
        const container = document.getElementById('skill-list');
        container.innerHTML = '';
        const skills = savior.skills;
        if (!skills) return;
        const levels = this.skillLevels[savior.id] || {};
        const skillTypes = [
            { type: 'passive', label: '패시브', nm: 'psv_nm', dsc: 'psv_dsc', cl: null, tgt: null, nva: null, lv: 'psv' },
            { type: 'basic', label: '기본기', nm: 'bsc_nm', dsc: 'bsc_dsc', cl: null, tgt: 'bsc_tgt', nva: 'bsc_nva', lv: 'bsc' },
            { type: 'special', label: '특수기', nm: 'spc_nm', dsc: 'spc_dsc', cl: 'spc_cl', tgt: 'spc_tgt', nva: 'spc_nva', lv: 'spc' },
            { type: 'ultimate', label: '궁극기', nm: 'ult_nm', dsc: 'ult_dsc', cl: 'ult_cl', tgt: 'ult_tgt', nva: 'ult_nva', lv: 'ult' }
        ];

        skillTypes.forEach(s => {
            const name = skills[s.nm];
            if (!name) return;
            const desc = skills[s.dsc] || '';
            let processedDesc = this.processFlavorText(desc);
            processedDesc = processedDesc.replace(/\\n|\n/g, '<br>');
            const cooldown = s.cl ? skills[s.cl] : null;
            const target = s.tgt ? skills[s.tgt] : null;
            const nova = s.nva ? skills[s.nva] : null;
            const levelInfo = levels[s.lv];
            const iconName = `${savior.profile.name}_${s.label}`;

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
                        <span class="skill-badge nova">노바 버스트</span>
                        <span class="skill-nova-desc">${nova}</span>
                    </div>
                `;
            }

            let levelHtml = '';
            if (levelInfo) {
                // Split by "Number : ", capturing the number.
                // This handles "1 : Desc 1\n2 : Desc 2" or "1 : Desc 12 : Desc 2"
                const parts = levelInfo.split(/(\d+)\s*[:.]\s*/);
                // parts[0] is usually empty or text before first number
                // parts[1] is number, parts[2] is content, parts[3] is number, parts[4] is content...

                const rows = [];
                for (let i = 1; i < parts.length; i += 2) {
                    const num = parts[i];
                    let text = parts[i + 1] || '';

                    // Clean up trailing/leading newlines/spaces from content
                    text = text.trim();

                    // Process Flavor Text in Level Info
                    let processedLevelText = this.processFlavorText(text);
                    processedLevelText = processedLevelText.replace(/\\n|\n/g, '<br>');

                    rows.push(`<tr><td class="sl-num">${num}</td><td class="sl-desc">${processedLevelText}</td></tr>`);
                }

                if (rows.length > 0) {
                    levelHtml = `
                        <button class="skill-level-btn" onclick="this.nextElementSibling.classList.toggle('active'); this.classList.toggle('active')">
                            스킬 레벨 정보 <span class="toggle-icon">▼</span>
                        </button>
                        <div class="skill-level-data">
                            <table>
                                ${rows.join('')}
                            </table>
                        </div>
                    `;
                }
            }

            div.innerHTML = `
                <img src="images/icon/${iconName}.webp" class="skill-icon" onerror="this.style.display='none'">
                <div class="skill-info">
                    <div class="skill-header">
                        <span class="skill-name">${name}</span>
                        <span class="skill-type">${s.label}</span>
                    </div>
                    ${metaHtml}
                    <div class="skill-desc">${processedDesc}</div>
                    ${novaHtml}
                    ${levelHtml}
                </div>
            `;
            container.appendChild(div);
        });
    },

    processFlavorText: function (text) {
        if (!text) return '';
        let processed = text;
        const matchedFlavors = this.flavorData.filter(flavor => text.includes(flavor.keyword));
        matchedFlavors.forEach(flavor => {
            const keyword = flavor.keyword;
            const content = flavor.content;
            if (processed.includes(keyword)) {
                // Use &#10; for line breaks in data attribute content
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
        const excelDate = p.birth;
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
                <p><strong>신장</strong> <span>${p.height}cm</span></p>
                <p><strong>출신</strong> <span>${p.origin}</span></p>
                <p><strong>소속</strong> <span>${p.affil}</span></p>
                <p><strong>CV (KR)</strong> <span>${p.cv_k}</span></p>
                <p><strong>CV (JP)</strong> <span>${p.cv_j}</span></p>
            </div>
        `;
    },

    bindEvents: function () {
        const closeBtn = document.querySelector('.close-button');
        if (closeBtn) closeBtn.onclick = () => this.closeModal();

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                const tabId = e.target.dataset.tab;
                document.getElementById(`tab-${tabId}`).classList.add('active');
                this.activeTab = tabId; // Persist tab
            };
        });

        const arcWrapper = document.getElementById('arcpoint-wrapper');
        if (arcWrapper) arcWrapper.onclick = () => {
            if (arcWrapper.classList.contains('spoiler-active')) {
                arcWrapper.classList.remove('spoiler-active');
            } else {
                const arcImg = document.getElementById('savior-arcpoint');
                if (arcImg && arcImg.src) {
                    this.openImagePopup(arcImg.src);
                }
            }
        };

        // Improved Tooltip Handling
        document.body.addEventListener('click', (e) => {
            const tooltip = document.getElementById('flavor-tooltip');
            if (!tooltip) return;
            if (e.target.classList.contains('flavor-keyword')) {
                e.stopPropagation();
                const content = e.target.dataset.content;
                // Check content match (ignoring html entities diff, basically strict string check)
                if (tooltip.textContent === content.replace(/&#10;/g, '\n') && !tooltip.classList.contains('hidden')) {
                    // Check if it is the same content, toggle off
                    tooltip.classList.add('hidden');
                } else {
                    tooltip.innerHTML = content.replace(/&#10;/g, '<br>').replace(/\\n|\n/g, '<br>');
                    tooltip.classList.remove('hidden');

                    // Attach to the nearest scrollable container to move with scroll
                    const container = e.target.closest('.detail-left, .detail-right') || document.querySelector('.modal-content');
                    if (container) {
                        // Make sure container has relative positioning for absolute child
                        const style = window.getComputedStyle(container);
                        if (style.position === 'static') {
                            container.style.position = 'relative';
                        }
                        container.appendChild(tooltip);

                        // Calculate position relative to container
                        const containerRect = container.getBoundingClientRect();
                        const targetRect = e.target.getBoundingClientRect();

                        // top = target.top - container.top + container.scrollTop
                        // Add some buffer
                        const top = targetRect.bottom - containerRect.top + container.scrollTop + 5;
                        let left = targetRect.left - containerRect.left + container.scrollLeft;

                        // Boundary checks (simple)
                        if (left + 300 > container.clientWidth) {
                            left = container.clientWidth - 310;
                        }

                        tooltip.style.position = 'absolute';
                        tooltip.style.top = `${top}px`;
                        tooltip.style.left = `${left}px`;
                        tooltip.style.zIndex = 3000;
                    }
                }
            } else {
                if (!tooltip.contains(e.target)) tooltip.classList.add('hidden');
            }
        });

        const searchInput = document.getElementById('savior-search');
        if (searchInput) searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.trim();
            this.renderGrid();
        });

        const fGrade = document.getElementById('filter-grade');
        if (fGrade) fGrade.addEventListener('change', (e) => {
            this.filterGrade = e.target.value;
            this.renderGrid();
        });

        const fAttr = document.getElementById('filter-attribute');
        if (fAttr) fAttr.addEventListener('change', (e) => {
            this.filterAttr = e.target.value;
            this.renderGrid();
        });

        const fClass = document.getElementById('filter-class');
        if (fClass) fClass.addEventListener('change', (e) => {
            this.filterClass = e.target.value;
            this.renderGrid();
        });

        const sSelect = document.getElementById('sort-select');
        if (sSelect) sSelect.addEventListener('change', (e) => {
            this.sortOrder = e.target.value;
            this.renderGrid();
        });

        const prevBtn = document.querySelector('.prev-btn');
        if (prevBtn) prevBtn.onclick = (e) => {
            e.stopPropagation();
            this.navigate(-1);
        };
        const nextBtn = document.querySelector('.next-btn');
        if (nextBtn) nextBtn.onclick = (e) => {
            e.stopPropagation();
            this.navigate(1);
        };

        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('savior-modal');
            if (!modal || modal.classList.contains('hidden')) return;
            if (e.key === 'Escape') this.closeModal();
            if (e.key === 'ArrowLeft') this.navigate(-1);
            if (e.key === 'ArrowRight') this.navigate(1);
        });
    },

    navigate: function (direction) {
        if (!this.currentSaviorId || !this.filteredList || this.filteredList.length === 0) return;
        const currentIndex = this.filteredList.findIndex(s => s.id === this.currentSaviorId);
        if (currentIndex === -1) return;

        let newIndex = currentIndex + direction;
        if (newIndex < 0) newIndex = this.filteredList.length - 1;
        if (newIndex >= this.filteredList.length) newIndex = 0;

        this.openModal(this.filteredList[newIndex].id);
    }
};

window.SaviorManager = SaviorManager;
