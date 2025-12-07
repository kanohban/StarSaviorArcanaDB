// SaviorManager
const SaviorManager = {
    data: {},
    flavorData: [],
    potentialData: {},
    searchTerm: '',
    filterGrade: 'all',
    filterAttr: 'all',
    filterClass: 'all',

    globalMaxStats: {
        atk: 5000, hp: 30000, def: 2500, spd: 130, crit_rate: 1, crit_dmg: 3
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
            const [saviorRes, flavorRes, potentialRes] = await Promise.all([
                fetch('./data/savior.json'),
                fetch('./data/flavor_text.json'),
                fetch('./data/potentials.json')
            ]);

            if (!saviorRes.ok) throw new Error(`Savior Data HTTP error! status: ${saviorRes.status}`);
            if (!flavorRes.ok) throw new Error(`Flavor Text HTTP error! status: ${flavorRes.status}`);

            const saviorsList = await saviorRes.json();
            this.flavorData = await flavorRes.json();

            if (potentialRes.ok) {
                this.potentialData = await potentialRes.json();
            } else {
                console.warn('Potentials data not found');
            }

            // Convert array to map for compatibility
            this.data = {};
            saviorsList.forEach(savior => {
                this.data[savior.id] = savior;
            });

            console.log('Savior data loaded:', Object.keys(this.data).length, 'entries');
        } catch (error) {
            console.error('Failed to load data:', error);
            const grid = document.getElementById('savior-grid');
            if (grid) grid.innerHTML = `<div class="error-message">데이터 로드 실패: ${error.message}</div>`;
        }
    },

    calculateGlobalMaxStats: function () {
        const saviors = Object.values(this.data);
        if (saviors.length === 0) return;

        const keys = ['atk', 'hp', 'def', 'spd', 'crit_rate', 'crit_dmg'];
        keys.forEach(key => {
            const maxVal = Math.max(...saviors.map(s => s.status[key] || 0));
            this.globalMaxStats[key] = maxVal > 0 ? maxVal : this.globalMaxStats[key];
        });
        console.log('Global Max Stats Calculated:', this.globalMaxStats);
    },

    prepareRanks: function () {
        const saviors = Object.values(this.data);
        const keys = ['atk', 'hp', 'def', 'spd', 'crit_rate', 'crit_dmg'];

        keys.forEach(key => {
            // Sort descending
            const sorted = [...saviors].sort((a, b) => (b.status[key] || 0) - (a.status[key] || 0));
            // Assign ranks (Joint Ranking)
            for (let i = 0; i < sorted.length; i++) {
                const s = sorted[i];
                s.ranks = s.ranks || {};

                if (i > 0 && (sorted[i].status[key] || 0) === (sorted[i - 1].status[key] || 0)) {
                    s.ranks[key] = sorted[i - 1].ranks[key];
                } else {
                    s.ranks[key] = i + 1;
                }
            }
        });
    },

    calculateMaxStats: function (savior) {
        const s = savior.status || {};
        const maxVals = this.globalMaxStats;
        return {
            atk: Math.min(100, (s.atk / maxVals.atk) * 100),
            hp: Math.min(100, (s.hp / maxVals.hp) * 100),
            def: Math.min(100, (s.def / maxVals.def) * 100),
            spd: Math.min(100, (s.spd / maxVals.spd) * 100),
            crit_rate: Math.min(100, (s.crit_rate / maxVals.crit_rate) * 100),
            crit_dmg: Math.min(100, (s.crit_dmg / maxVals.crit_dmg) * 100)
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
            const attrMap = { '태양': 'sun', '달': 'moon', '별': 'star', '질서': 'order', '혼돈': 'chaos' };
            const attrClass = attrMap[savior.attr] || 'unknown';

            const div = document.createElement('div');
            div.className = `savior-item attr-${attrClass}`;

            const iconPath = `images/icon/${savior.name}.webp`;

            div.innerHTML = `
                <img src="${iconPath}" alt="${savior.name}" onerror="this.src='images/icon/default.webp'">
                <div class="name">${savior.name}</div>
            `;

            div.onclick = () => this.openModal(savior.id);
            grid.appendChild(div);
        });
    },

    filterSaviors: function (list) {
        return list.filter(s => {
            if (this.searchTerm) {
                const term = this.searchTerm.toLowerCase();
                let text = (s.name + s.inst.desc).toLowerCase();
                if (s.skills) {
                    s.skills.forEach(sk => {
                        text += (sk.name + (sk.desc || '')).toLowerCase();
                    });
                }
                if (!text.includes(term)) return false;
            }
            if (this.filterGrade && this.filterGrade !== 'all') { if (s.rank !== this.filterGrade) return false; }
            if (this.filterAttr && this.filterAttr !== 'all') { if (s.attr !== this.filterAttr) return false; }
            if (this.filterClass && this.filterClass !== 'all') { if (s.class !== this.filterClass) return false; }
            return true;
        });
    },

    sortSaviors: function (list) {
        const sortType = document.getElementById('sort-select') ? document.getElementById('sort-select').value : 'default';

        const rankOrder = { 'SSR': 1, 'SR': 2, 'R': 3 };
        const attrOrder = { '태양': 1, '달': 2, '별': 3, '질서': 4, '혼돈': 5 };
        const classOrder = { '스트라이커': 1, '어쌔신': 2, '레인저': 3, '캐스터': 4, '디펜더': 5, '서포터': 6 };

        return list.sort((a, b) => {
            if (sortType === 'name-asc') return a.name.localeCompare(b.name, 'ko');
            if (sortType === 'name-desc') return b.name.localeCompare(a.name, 'ko');

            // Default Sort: Rank -> Attr -> Class -> Name
            const rA = rankOrder[a.rank] || 99;
            const rB = rankOrder[b.rank] || 99;
            if (rA !== rB) return rA - rB;

            const aA = attrOrder[a.attr] || 99;
            const aB = attrOrder[b.attr] || 99;
            if (aA !== aB) return aA - aB;

            const cA = classOrder[a.class] || 99;
            const cB = classOrder[b.class] || 99;
            if (cA !== cB) return cA - cB;

            return a.name.localeCompare(b.name, 'ko');
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
        const illustImg = document.getElementById('savior-illust');
        illustImg.src = `images/illust/${savior.name}.webp`;
        illustImg.onclick = () => this.openImagePopup(illustImg.src);

        const arcImg = document.getElementById('savior-arcpoint');
        arcImg.src = `images/arcpoint/${savior.name}.webp`;

        const arcWrapper = document.getElementById('arcpoint-wrapper');
        if (arcWrapper) arcWrapper.classList.add('spoiler-active');

        const iconElement = document.getElementById('savior-icon');
        iconElement.src = `images/icon/${savior.name}.webp`;

        const attrMap = { '태양': 'sun', '달': 'moon', '별': 'star', '질서': 'order', '혼돈': 'chaos' };
        const attrClass = attrMap[savior.attr] || 'unknown';
        iconElement.className = `profile-icon attr-${attrClass}`;

        document.getElementById('savior-name').innerText = savior.name;

        const elSpan = document.getElementById('savior-element');
        elSpan.innerText = savior.attr;
        elSpan.className = `tag attr-${attrClass}`;

        const classSpan = document.getElementById('savior-class');
        classSpan.innerText = savior.class;
        classSpan.className = 'profile-badge badge-common';

        const roleSpan = document.getElementById('savior-role');
        roleSpan.innerText = savior.atk_type;
        roleSpan.className = 'profile-badge badge-common';

        document.getElementById('savior-desc').innerText = savior.inst.desc;

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
        const s = savior.status;
        if (!s) return;

        const maxLevel = (savior.rank === 'SSR') ? 200 : 160;
        document.getElementById('stat-max-level').innerText = maxLevel;

        const percs = this.calculateMaxStats(savior);
        const barsContainer = document.getElementById('basic-stats');

        const ranks = savior.ranks || {};

        const makeStatRow = (label, key, val, percent) => `
            <div class="stat-row">
                <div class="stat-name">${label}</div>
                <div class="stat-bar-container"><div class="stat-bar-fill" style="width:${percent}%"></div></div>
                <div class="stat-val">${val}</div>
                <div class="stat-rank">${ranks[key] || '-'}위</div>
            </div>`;

        barsContainer.innerHTML = [
            makeStatRow('공격력', 'atk', s.atk.toLocaleString(), percs.atk),
            makeStatRow('생명력', 'hp', s.hp.toLocaleString(), percs.hp),
            makeStatRow('방어력', 'def', s.def.toLocaleString(), percs.def),
            makeStatRow('속도', 'spd', s.spd, percs.spd),
            makeStatRow('치명타 확률', 'crit_rate', `${Math.round(s.crit_rate * 100)}%`, percs.crit_rate),
            makeStatRow('치명타 피해', 'crit_dmg', `${Math.round(s.crit_dmg * 100)}%`, percs.crit_dmg)
        ].join('');

        const subStats = document.getElementById('sub-stats');
        subStats.innerHTML = `
            <div class="text-stat-item"><span>효과 적중</span><span>${Math.round(s.eff_rate * 100)}%</span></div>
            <div class="text-stat-item"><span>효과 저항</span><span>${Math.round(s.eff_resist * 100)}%</span></div>
            <div class="text-stat-item"><span>명중률</span><span>${Math.round(s.acc * 100)}%</span></div>
        `;

        const js = savior.journey_status;
        const journeyGrid = document.getElementById('journey-stats');
        journeyGrid.innerHTML = `
             <div class="journey-stat-item"><span class="journey-stat-label">힘</span><div class="journey-stat-value">${js.str}</div></div>
             <div class="journey-stat-item"><span class="journey-stat-label">체력</span><div class="journey-stat-value">${js.hp}</div></div>
             <div class="journey-stat-item"><span class="journey-stat-label">인내</span><div class="journey-stat-value">${js.end}</div></div>
             <div class="journey-stat-item"><span class="journey-stat-label">집중</span><div class="journey-stat-value">${js.focus}</div></div>
             <div class="journey-stat-item"><span class="journey-stat-label">보호</span><div class="journey-stat-value">${js.prot}</div></div>
        `;

        const potList = document.getElementById('potential-list');
        potList.innerHTML = '';

        const renderPotentialItem = (level, name) => {
            if (!name) return '';
            let desc = (this.potentialData && this.potentialData[name]) || '';
            desc = desc.replace('Lv', level);
            const safeContent = desc.replace(/"/g, '&quot;').replace(/\n/g, '&#10;');
            const keywordClass = desc ? 'flavor-keyword' : '';
            const dataAttr = desc ? `data-content="${safeContent}"` : '';
            return `<li><span class="potential-level">Lv.${level}</span> <span class="potential-desc ${keywordClass}" ${dataAttr}>${name}</span></li>`;
        };

        if (savior.potentials) {
            savior.potentials.forEach(p => {
                potList.innerHTML += renderPotentialItem(p.level, p.value);
            });
        }
    },

    renderSkills: function (savior) {
        const container = document.getElementById('skill-list');
        container.innerHTML = '';
        if (!savior.skills) return;

        // Sort: Passive(0) -> Basic(1) -> Special(2) -> Ultimate(3)
        const sortedSkills = [...savior.skills].sort((a, b) => a.type - b.type);

        const typeLabels = { 0: '패시브', 1: '기본기', 2: '특수기', 3: '궁극기' };

        sortedSkills.forEach(skill => {
            const typeLabel = typeLabels[skill.type] || '스킬';

            let processedDesc = this.processFlavorText(skill.desc);
            processedDesc = processedDesc.replace(/\\n|\n/g, '<br>');

            const iconName = `${savior.name}_${typeLabel}`;

            const div = document.createElement('div');
            div.className = 'skill-item';

            const badges = [];
            if (skill.cooltime) badges.push(`<span class="skill-badge cooldown">${skill.cooltime}턴</span>`);
            if (skill.target) {
                const isAlly = skill.target.includes('아군') || skill.target.includes('자신');
                const badgeClass = isAlly ? 'skill-badge target-ally' : 'skill-badge target';
                badges.push(`<span class="${badgeClass}">${skill.target}</span>`);
            }
            if (skill.break) badges.push(`<span class="skill-badge break">강인도 피해 ${skill.break}</span>`);
            if (skill.nova) badges.push(`<span class="skill-badge nova-gain">노바 획득 ${skill.nova}</span>`);

            let metaHtml = '';
            if (badges.length > 0) metaHtml = `<div class="skill-meta">${badges.join('')}</div>`;

            let novaHtml = '';
            if (skill.nova_desc) {
                novaHtml = `
                    <div class="skill-nova">
                        <span class="skill-badge nova">노바 버스트</span>
                        <span class="skill-nova-desc">${skill.nova_desc}</span>
                    </div>
                `;
            }

            let levelHtml = '';
            if (skill.levels && skill.levels.length > 0) {
                levelHtml = `
                        <button class="skill-level-btn" onclick="this.nextElementSibling.classList.toggle('active'); this.classList.toggle('active')">
                            스킬 레벨 정보 <span class="toggle-icon">▼</span>
                        </button>
                        <div class="skill-level-data">
                            <table>
                                ${skill.levels.map(l => this.renderLevelRow(skill, l, savior.name)).join('')}
                            </table>
                        </div>
                    `;
            }

            div.innerHTML = `
                <img src="images/icon/${iconName}.webp" class="skill-icon" onerror="this.style.display='none'">
                <div class="skill-info">
                    <div class="skill-header">
                        <span class="skill-name">${skill.name}</span>
                        <span class="skill-type">${typeLabel}</span>
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

    // CONSTANTS from scripts/data_manager/constants.js
    ACTIVE_SKILL_EFFECT_TYPE: {
        0: "기본 효과",
        1: "피해량 {value}% 증가",
        2: "회복량 {value}% 증가",
        3: "보호막 {value}% 증가",
        4: "쿨타임 {value}턴 감소",
        5: "공격력 증가 발생 확률 {value}% 증가",
        6: "공격력 감소 발생 확률 {value}% 증가",
        7: "공격력 증가 지속 턴 수 {value}턴 증가",
        8: "공격력 감소 지속 턴 수 {value}턴 증가",
        9: "방어력 증가 발생 확률 {value}% 증가",
        10: "방어력 감소 발생 확률 {value}% 증가",
        11: "방어력 증가 지속 턴 수 {value}턴 증가",
        12: "방어력 감소 지속 턴 수 {value}턴 증가",
        13: "속도 증가 발생 확률 {value}% 증가",
        14: "속도 감소 발생 확률 {value}% 증가",
        15: "속도 증가 지속 턴 수 {value}턴 증가",
        16: "속도 감소 지속 턴 수 {value}턴 증가",
        17: "행동 게이지 증가량 {value}% 증가",
        18: "행동 게이지 감소량 {value}% 증가",
        19: "도발 발생 확률 {value}% 증가",
        20: "수호 지속 턴 수 {value}턴 증가",
        21: "약화 효과 연장 발생 확률 {value}% 증가",
        22: "연소 발생 확률 {value}% 증가",
        23: "추가 연소 발생 확률 {value}% 증가",
        24: "냉각 부여 확률 {value}% 증가",
        25: "빙결 발생 확률 {value}% 증가",
        26: "속박 발생 확률 {value}% 증가",
        27: "뒤엉킨 꿈결 발생 확률 {value}% 증가",
        28: "미지의 주문 발생 확률 {value}% 증가",
        29: "성스러운 가호 발생 확률 {value}% 증가",
    },

    PASSIVE_SKILL_EFFECT_TYPE: {
        0: "{char}의 공격력이 {value}% 증가합니다.",
        1: "{char}의 방어력이 {value}% 증가합니다.",
        2: "{char}의 최대 생명력이 {value}% 증가합니다.",
        3: "{char}의 치명타 확률이 {value}% 증가합니다.",
        4: "{char}의 치명타 피해가 {value}% 증가합니다.",
        5: "다나가 급속 개화로 치명타 발생 시 자신에게 {value}% 확률로 1턴 간 속도 증가를 발생시킵니다.",
        6: "레이시가 뒤엉킨 꿈결 상태인 적에게 피격 후 행동 게이지를 {value}% 증가시키고 자신의 생명력을 회복합니다. 회복량은 자신의 공격력에 비례해 증가합니다.",
        7: "루그가 제압부 사용 후 적에게 {value}% 확률로 1턴 간 빙결을 발생시킵니다.",
        8: "루나가 내 눈에 비친 세계 사용 시 강화 효과 상태이면 치명타 피해가 {value}% 증가합니다.",
        9: "리디아가 공허의 손길 사용 후 적이 약화 효과 상태이면 자신의 공격력이 {value}%씩 증가합니다. 최대 5회 중첩됩니다.",
        10: "릴리가 토끼씨의 즉결 심판 사용 후 자신의 행동 게이지를 {value}% 증가시킵니다.",
        11: "뮤리엘이 자신을 제외한 태양 속성 아군이 궁극기 사용 후 자신에게 {value}% 확률로 점화 스택을 1개 부여합니다.",
        12: "샤를이 꺾이지 않는 일격 사용 후 정직한 찌르기의 피해량이 {value}%씩 증가합니다. 최대 3회 중첩됩니다.",
        13: "세르팡이 너로 정했다! 사용 후 적에게 {value}% 확률로 1턴 간 연소를 발생시킵니다.",
        14: "세이라가 타격 시 적의 생명력이 75% 이상이면 피해량이 {value}% 증가합니다.",
        15: "스마일이 사격 좌표 확인 사용 후 적의 생명력이 50% 이상이면 자신의 행동 게이지를 {value}% 증가시킵니다.",
        16: "스칼렛이 턴 시작 시 자신에게 핀볼 타임!을 3회 발생시키고 타격 후 핀볼 타임! 상태를 모두 해제합니다. 턴 시작 시 자신이 보유한 세븐볼(해제불가) 개수 당 속도가 1씩 증가합니다. 최대 {value}회 중첩됩니다.\\n노멀볼(해제불가) : 주는 피해량이 1% 증가합니다.\\n세븐볼(해제불가) : 주는 피해량이 7% 증가합니다.",
        17: "아세라가 장막 베기 사용 후 자신의 치명타 피해가 {value}%씩 증가합니다. 최대 5회 중첩됩니다.",
        18: "에데가 최초 전투 시작 시 자신에게 1턴 간 수호를 발생시킵니다. 피격 후 자신에게 {value}% 확률로 도약 스택을 1개 부여합니다.",
        19: "에핀델은 달 속성 아군이 치명타 발생 시 자신에게 냉각 스택을 1개 부여합니다. 에핀델이 오를랑식 검술 사용 시 자신의 냉각이 최대 스택이면 피해량이 {value}% 증가하고 오를랑식 검술 사용 후 냉각 스택을 모두 소거합니다.",
        20: "엘리사가 부질없지만 도움을 사용 시 자신의 생명력이 75% 이상이면 회복량이 {value}% 증가합니다.",
        21: "카르멘이 피격 시 자신에게 부여된 냉각 스택에 비례하여 방어력이 {value}%씩 증가하며 최대 5개까지 적용됩니다.",
        22: "클레어가 턴 시작 시 자신의 치명타 확률이 {value}%씩 증가합니다. 최대 3회 중첩됩니다. 눈보다 빠른 움직임을 사용 후 자신의 냉각이 최대 스택이면 모두 소거하고 어딜 보시는 거죠?를 발동합니다.",
        23: "키라가 스킬 사용시 자신이 은신 상태이면 피해량이 {value}% 증가합니다.",
        24: "타냐가 적의 강인도 격파 후 자신에게 도약 스택을 3개 부여하고 자신을 제외한 아군 전체의 행동 게이지를 {value}% 증가시킵니다.",
        25: "트리쉬가 적 처치 시 자신의 행동 게이지가 {value}% 증가합니다.",
        26: "페트라는 자신을 제외한 아군이 적의 강인도 격파 후 자신에게 점화 스택을 1개 부여하고 자신의 행동 게이지를 {value}% 증가시킵니다. 1턴에 1번만 발생합니다.",
        27: "프레이가 모나스티르의 전력지원 사용 후 자신의 생명력이 50% 이하이면 아군 전체의 행동 게이지를 {value}% 증가시킵니다.",
        28: "할리는 자신을 제외한 아군이 피격 후 {value}% 확률로 자신의 속도가 3%씩 증가합니다. 최대 5회 중첩됩니다.",
    },

    renderLevelRow: function (skill, lvl, charName) {
        let text = "";
        if (skill.type === 0 && lvl.desc) { // Passive
            text = lvl.desc.map(d => {
                let t = this.PASSIVE_SKILL_EFFECT_TYPE[d.type] || "";
                return t.replace("{value}", d.value).replace("{char}", charName);
            }).join(" ");
        } else { // Active
            let t = this.ACTIVE_SKILL_EFFECT_TYPE[lvl.type] || "";
            text = t.replace("{value}", lvl.value);
        }
        text = text.replace(/\n/g, '<br>');
        return `<tr><td class="sl-num">${lvl.level}</td><td class="sl-desc">${text}</td></tr>`;
    },

    processFlavorText: function (text) {
        if (!text) return '';
        let processed = text;
        const matchedFlavors = this.flavorData.filter(flavor => text.includes(flavor.keyword));
        matchedFlavors.forEach(flavor => {
            const keyword = flavor.keyword;
            const content = flavor.content;
            if (processed.includes(keyword)) {
                const safeContent = content.replace(/"/g, '&quot;').replace(/\n/g, '&#10;');
                const replacement = `<span class="flavor-keyword" data-content="${safeContent}">${keyword}</span>`;
                processed = processed.split(keyword).join(replacement);
            }
        });
        return processed;
    },

    renderProfileDetails: function (savior) {
        const container = document.getElementById('profile-details');
        const p = savior.inst; // inst object in new json
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
                <p><strong>소속</strong> <span>${p.team}</span></p>
                <p><strong>CV (KR)</strong> <span>${p.cv_ko}</span></p>
                <p><strong>CV (JP)</strong> <span>${p.cv_jp}</span></p>
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
                this.activeTab = tabId;
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

        document.body.addEventListener('click', (e) => {
            const tooltip = document.getElementById('flavor-tooltip');
            if (!tooltip) return;
            if (e.target.classList.contains('flavor-keyword')) {
                e.stopPropagation();
                const content = e.target.dataset.content;
                if (tooltip.textContent === content.replace(/&#10;/g, '\n') && !tooltip.classList.contains('hidden')) {
                    tooltip.classList.add('hidden');
                } else {
                    tooltip.innerHTML = content.replace(/&#10;/g, '<br>').replace(/\\n|\n/g, '<br>');
                    tooltip.classList.remove('hidden');

                    const container = e.target.closest('.detail-left, .detail-right') || document.querySelector('.modal-content');
                    if (container) {
                        const style = window.getComputedStyle(container);
                        if (style.position === 'static') {
                            container.style.position = 'relative';
                        }
                        container.appendChild(tooltip);

                        const containerRect = container.getBoundingClientRect();
                        const targetRect = e.target.getBoundingClientRect();

                        const top = targetRect.bottom - containerRect.top + container.scrollTop + 5;
                        let left = targetRect.left - containerRect.left + container.scrollLeft;

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
