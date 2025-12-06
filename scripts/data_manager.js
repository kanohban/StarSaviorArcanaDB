const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const DATA_DIR = path.join(__dirname, '../data');
const ROOT_DIR = path.join(__dirname, '../');
const EXCEL_FILE = path.join(DATA_DIR, 'game_data.xlsx');
const REFERENCE_EXCEL = path.join(ROOT_DIR, 'cards_data.xlsx');
const CARDS_BACKUP_JSON = path.join(DATA_DIR, 'cards.json.bak'); // Recovery Source

// Source / Target Files
const SAVIOR_PROFILE_JSON = path.join(DATA_DIR, 'savior_profile.json');
const SAVIOR_STATS_JSON = path.join(DATA_DIR, 'savior_stats.json');
const CARDS_STATS_JSON = path.join(DATA_DIR, 'cards_stats.json');
const CARDS_EVENT_JSON = path.join(DATA_DIR, 'cards_event.json');
const JOURNEY_JSON = path.join(DATA_DIR, 'journey_data.json');
const POTENTIALS_JSON = path.join(DATA_DIR, 'potentials.json');
const FLAVOR_JSON = path.join(DATA_DIR, 'flavor_text.json');

function loadJson(filePath) {
    return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : null;
}
function saveJson(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// --- Helper: Read keys with priorities ---
function getVal(obj, ...keys) {
    if (!obj) return undefined;
    for (const k of keys) {
        if (obj[k] !== undefined) return obj[k];
    }
    return undefined;
}

function loadExternalCardContext() {
    const namesMap = {};
    const eventsMap = {};
    if (fs.existsSync(REFERENCE_EXCEL)) {
        try {
            const wb = XLSX.readFile(REFERENCE_EXCEL);
            const nameSheet = wb.Sheets['EventNames'];
            if (nameSheet) {
                const rows = XLSX.utils.sheet_to_json(nameSheet);
                rows.forEach(r => {
                    namesMap[r.아이디] = { '1': r.이벤트1, '2': r.이벤트2, '3': r.이벤트3 };
                });
            }
            const logicSheet = wb.Sheets['Events'];
            if (logicSheet) {
                const rows = XLSX.utils.sheet_to_json(logicSheet);
                rows.forEach(r => {
                    const id = r.아이디;
                    const stageMap = { '1단계': '1', '2단계': '2', '3단계': '3' };
                    const choiceMap = { '선택지A': 'A', '선택지B': 'B' };
                    const condMap = { '고정': 'FIX', '성공': 'Suc', '실패': 'Fail' };

                    const stage = stageMap[r.단계] || r.단계;
                    const choice = choiceMap[r.선택지] || r.선택지;
                    const cond = condMap[r.조건] || r.조건;

                    if (!eventsMap[id]) eventsMap[id] = {};
                    if (!eventsMap[id][stage]) eventsMap[id][stage] = { A: { FIX: [], Suc: [], Fail: [] }, B: { FIX: [], Suc: [], Fail: [] } };
                    const target = eventsMap[id][stage][choice];
                    if (!target) return;
                    if (r.선택지_내용) target.name = r.선택지_내용;
                    if (r.보상_타입 || r.보상_수치) {
                        if (target[cond]) target[cond].push({ type: r.보상_타입, value: r.보상_수치 });
                    }
                });
            }
        } catch (e) { }
    }
    return { namesMap, eventsMap };
}

// --- Backup Recovery Helper ---
function loadBackupCards() {
    if (!fs.existsSync(CARDS_BACKUP_JSON)) return {};
    const list = loadJson(CARDS_BACKUP_JSON);
    const map = {};
    list.forEach(c => {
        // Map ID -> { jrn: [], trn: [], sns: [] }
        // Keys in backup are Korean: 여정, 훈련, 감응
        map[c.아이디] = {
            jrn: c.여정 || [],
            trn: c.훈련 || [],
            sns: c.감응 || []
        };
    });
    return map;
}

// --- Savior Handlers ---
function exportSaviorAndSkills() {
    let profiles = loadJson(SAVIOR_PROFILE_JSON) || {};
    let stats = loadJson(SAVIOR_STATS_JSON) || {};
    let skillLevels = loadJson(SAVIOR_SKILL_LV_JSON) || {};

    const profileRows = [];
    const statsRows = [];
    const skillsRows = [];

    for (const id in profiles) {
        const p = profiles[id];
        const s = stats[id] || {};
        const sl = skillLevels[id] || {};
        const pro = p.profile || {};

        profileRows.push({
            id: p.id,
            name: getVal(pro, 'name', '이름'),
            rank: getVal(pro, 'rank', '등급'),
            attr: getVal(pro, 'attr', 'attribute', '속성'),
            cls: getVal(pro, 'cls', 'class', '클래스'),
            atk_t: getVal(pro, 'atk_t', 'attack_type', '공격 타입'),
            birth: getVal(pro, 'birth', 'birthday', '생일'),
            height: getVal(pro, 'height', '신장'),
            origin: getVal(pro, 'origin', '출신'),
            affil: getVal(pro, 'affil', 'affiliation', '소속'),
            cv_k: getVal(pro, 'cv_k', 'cv_kr', 'CV(KR)'),
            cv_j: getVal(pro, 'cv_j', 'cv_jp', 'CV(JP)'),
            desc: getVal(pro, 'desc', 'intro', '캐릭터 소개')
        });

        statsRows.push({
            id: p.id,
            name: getVal(pro, 'name', '이름'),
            c_atk: getVal(s, 'c_atk', 'atk', '공격력'),
            c_hp: getVal(s, 'c_hp', 'hp', '체력'),
            c_def: getVal(s, 'c_def', 'def', '방어력'),
            c_spd: getVal(s, 'c_spd', 'spd', '속도'),
            crt_r: getVal(s, 'crt_r', 'crit_rate', '치명률'),
            crt_d: getVal(s, 'crt_d', 'crit_dmg', '치명뎀'),
            eff_a: getVal(s, 'eff_a', 'eff_acc', '효과명중'),
            eff_r: getVal(s, 'eff_r', 'eff_res', '효과저항'),
            c_acc: getVal(s, 'c_acc', 'acc', '명중률'),

            j_str: getVal(s, 'j_str', 'str', '힘'),
            j_vit: getVal(s, 'j_vit', 'vit', '체력_1'),
            j_end: getVal(s, 'j_end', 'end', '인내'),
            j_foc: getVal(s, 'j_foc', 'foc', '집중'),
            j_prt: getVal(s, 'j_prt', 'prt', '보호'),

            pot_1: getVal(s, 'pot_1', 'potential_1', '잠재력1'),
            pot_2: getVal(s, 'pot_2', 'potential_2', '잠재력2'),
            pot_3: getVal(s, 'pot_3', 'potential_3', '잠재력3')
        });

        if (p.skills) {
            skillsRows.push({
                id: p.id,
                name: getVal(pro, 'name', '이름'),

                psv_nm: getVal(p.skills, 'psv_nm', 'passive_name', '패시브'),
                psv_dsc: getVal(p.skills, 'psv_dsc', 'passive_desc', '패시브_설명'),
                psv_lv: getVal(sl, 'psv', 'psv_lv', '패시브_레벨'),

                bsc_nm: getVal(p.skills, 'bsc_nm', 'basic_name', '기본기'),
                bsc_tp: getVal(p.skills, 'bsc_tp', 'basic_type', '기본기_타입'),
                bsc_tgt: getVal(p.skills, 'bsc_tgt', 'basic_target', '기본기_대상'),
                bsc_dsc: getVal(p.skills, 'bsc_dsc', 'basic_desc', '기본기_설명'),
                bsc_nva: getVal(p.skills, 'bsc_nva', 'basic_nova', '기본기_노바'),
                bsc_lv: getVal(sl, 'bsc', 'bsc_lv', '기본기_레벨'),

                spc_nm: getVal(p.skills, 'spc_nm', 'special_name', '특수기'),
                spc_tp: getVal(p.skills, 'spc_tp', 'special_type', '특수기_타입'),
                spc_tgt: getVal(p.skills, 'spc_tgt', 'special_target', '특수기_대상'),
                spc_cl: getVal(p.skills, 'spc_cl', 'special_cool', '특수기_쿨'),
                spc_dsc: getVal(p.skills, 'spc_dsc', 'special_desc', '특수기_설명'),
                spc_nva: getVal(p.skills, 'spc_nva', 'special_nova', '특수기_노바'),
                spc_lv: getVal(sl, 'spc', 'spc_lv', '특수기_레벨'),

                ult_nm: getVal(p.skills, 'ult_nm', 'ultimate_name', '궁극기'),
                ult_tp: getVal(p.skills, 'ult_tp', 'ultimate_type', '궁극기_타입'),
                ult_tgt: getVal(p.skills, 'ult_tgt', 'ultimate_target', '궁극기_대상'),
                ult_cl: getVal(p.skills, 'ult_cl', 'ultimate_cool', '궁극기_쿨'),
                ult_dsc: getVal(p.skills, 'ult_dsc', 'ultimate_desc', '궁극기_설명'),
                ult_nva: getVal(p.skills, 'ult_nva', 'ultimate_nova', '궁극기_노바'),
                ult_lv: getVal(sl, 'ult', 'ult_lv', '궁극기_레벨')
            });
        }
    }
    return { profileRows, statsRows, skillsRows };
}

// New file path
const SAVIOR_SKILL_LV_JSON = path.join(DATA_DIR, 'savior_skill_levels.json');

function importSaviorAndSkills(profileRows, statsRows, skillsRows, lvRows, psvLvRows) {
    const profiles = {};
    const stats = {};
    const skillLevels = {};

    profileRows.forEach(row => {
        if (!row.id) return;
        profiles[row.id] = {
            id: row.id,
            profile: {
                name: row.name,
                rank: row.rank,
                attr: row.attr,
                cls: row.cls,
                atk_t: row.atk_t,
                birth: row.birth,
                height: row.height,
                origin: row.origin,
                affil: row.affil,
                cv_k: row.cv_k,
                cv_j: row.cv_j,
                desc: row.desc
            },
            skills: {}
        };
    });
    statsRows.forEach(row => {
        if (!row.id) return;
        stats[row.id] = {
            name: row.name,
            c_atk: row.c_atk,
            c_hp: row.c_hp,
            c_def: row.c_def,
            c_spd: row.c_spd,
            crt_r: row.crt_r,
            crt_d: row.crt_d,
            eff_a: row.eff_a,
            eff_r: row.eff_r,
            c_acc: row.c_acc || row.acc,

            j_str: row.j_str,
            j_vit: row.j_vit,
            j_end: row.j_end,
            j_foc: row.j_foc,
            j_prt: row.j_prt,
            pot_1: row.pot_1,
            pot_2: row.pot_2,
            pot_3: row.pot_3
        };
    });
    skillsRows.forEach(row => {
        if (profiles[row.id]) {
            profiles[row.id].skills = {
                name: row.name,
                psv_nm: row.psv_nm,
                psv_dsc: row.psv_dsc,
                bsc_nm: row.bsc_nm,
                bsc_tp: row.bsc_tp,
                bsc_tgt: row.bsc_tgt,
                bsc_dsc: row.bsc_dsc,
                bsc_nva: row.bsc_nva,
                spc_nm: row.spc_nm,
                spc_tp: row.spc_tp,
                spc_tgt: row.spc_tgt,
                spc_cl: row.spc_cl,
                spc_dsc: row.spc_dsc,
                spc_nva: row.spc_nva,
                ult_nm: row.ult_nm,
                ult_tp: row.ult_tp,
                ult_tgt: row.ult_tgt,
                ult_cl: row.ult_cl,
                ult_dsc: row.ult_dsc,
                ult_nva: row.ult_nva
            };


        }
    });

    saveJson(SAVIOR_PROFILE_JSON, profiles);
    saveJson(SAVIOR_STATS_JSON, stats);

    // Helper to build level string
    const buildLevelStr = (row) => {
        const lines = [];
        for (let i = 1; i <= 10; i++) {
            if (row[i]) lines.push(`${i} : ${row[i]}`);
        }
        return lines.join('\n');
    };

    // Initialize skillLevels objects
    Object.keys(profiles).forEach(id => {
        skillLevels[id] = { psv: '', bsc: '', spc: '', ult: '' };
    });

    // Parse Passive Levels
    if (psvLvRows) {
        psvLvRows.forEach(row => {
            if (skillLevels[row.id]) {
                skillLevels[row.id].psv = buildLevelStr(row);
            }
        });
    }

    // Parse Active Skills Levels
    if (lvRows) {
        lvRows.forEach(row => {
            if (skillLevels[row.id]) {
                // Map type code to key
                let key = null;
                if (row.type === 'bsc_nm') key = 'bsc';
                else if (row.type === 'spc_nm') key = 'spc';
                else if (row.type === 'ult_nm') key = 'ult';

                if (key) {
                    skillLevels[row.id][key] = buildLevelStr(row);
                }
            }
        });
    }

    saveJson(SAVIOR_SKILL_LV_JSON, skillLevels);
    console.log("Updated Savior Profiles, Stats & Skill Levels");
}

// --- Cards Handlers ---

function exportCards() {
    const statsList = loadJson(CARDS_STATS_JSON) || [];
    const { namesMap, eventsMap } = loadExternalCardContext();
    const backupMap = loadBackupCards(); // RECOVERY

    const statsRows = [];
    const eventRows = [];

    statsList.forEach(card => {
        const id = getVal(card, 'id', '아이디');

        // Recover extra stats from backup if missing
        let jrn = card.jrn || card.journey || card.여정 || [];
        let trn = card.trn || card.train || card.훈련 || [];
        let sns = card.sns || card.sensor || card.감응 || [];

        if (backupMap[id]) {
            if (!jrn.length) jrn = backupMap[id].jrn;
            if (!trn.length) trn = backupMap[id].trn;
            if (!sns.length) sns = backupMap[id].sns;
        }

        // Cards_Stats
        const sRow = {
            id: id,
            name: getVal(card, 'name', '이름'),
            char: getVal(card, 'char', 'character', '캐릭터'),
            rare: getVal(card, 'rare', 'rarity', '레어도'),
            img: getVal(card, 'img', 'image', '이미지'),

            t_train: getVal(card.type || card.타입, 't_train', 'train', 'type_train', '훈련'),
            t_sup_1: getVal(card.type || card.타입, 't_sup_1', 'sup_1', 'type_sup_1', '보조1'),
            t_sup_2: getVal(card.type || card.타입, 't_sup_2', 'sup_2', 'type_sup_2', '보조2'),

            u_pot_nm: getVal(card.u_pot || card.unique_pot || card.고유잠재, 'name', 'u_pot_nm', 'unique_pot_name', '이름'),
            u_eff_nm: getVal(card.u_eff || card.unique_eff || card.고유효과, 'name', 'u_eff_nm', 'unique_eff_name', '이름'),
            u_eff_dsc: getVal(card.u_eff || card.unique_eff || card.고유효과, 'desc', 'u_eff_dsc', 'unique_eff_desc', '설명')
        };

        const supports = card.support || card.지원 || [];
        supports.forEach((sup, i) => {
            const idx = i + 1;
            sRow[`sup_${idx}_t`] = getVal(sup, 'type', '타입');
            sRow[`sup_${idx}_v35`] = getVal(sup, 'v35', 'val_35', '수치35');
            sRow[`sup_${idx}_v50`] = getVal(sup, 'v50', 'val_50', '수치50');
        });

        // Helper to flatten arrays to columns
        // e.g. jrn_1_t, jrn_1_v35...
        const addArrayStats = (arr, prefix) => {
            arr.forEach((item, i) => {
                const idx = i + 1;
                sRow[`${prefix}_${idx}_t`] = getVal(item, 'type', '타입');
                sRow[`${prefix}_${idx}_v35`] = getVal(item, 'v35', '수치35');
                sRow[`${prefix}_${idx}_v50`] = getVal(item, 'v50', '수치50');
            });
        };
        addArrayStats(jrn, 'jrn'); // Journey
        addArrayStats(trn, 'trn'); // Train
        addArrayStats(sns, 'sns'); // Sensor (Gam-eung)

        statsRows.push(sRow);

        // Cards_Event
        const evData = eventsMap[id];
        const namesData = namesMap[id];

        const eRow = {
            id: id,
            card_nm: getVal(card, 'name', '이름')
        };

        ['1', '2', '3'].forEach(stageNum => {
            const prefix = `ev_${stageNum}`;
            const stageEvents = evData?.[stageNum];

            eRow[`${prefix}_nm`] = namesData?.[stageNum] || '';

            ['A', 'B'].forEach(choiceChar => {
                const cData = stageEvents?.[choiceChar];
                eRow[`${prefix}_${choiceChar}_nm`] = cData?.name || '';

                ['FIX', 'Suc', 'Fail'].forEach(cond => {
                    for (let i = 0; i <= 5; i++) {
                        const typeKey = `${prefix}_${choiceChar}_${cond}_${i}_T`;
                        const valKey = `${prefix}_${choiceChar}_${cond}_${i}_V`;
                        const reward = cData?.[cond]?.[i];
                        eRow[typeKey] = reward ? reward.type : '';
                        eRow[valKey] = reward ? reward.value : '';
                    }
                });
            });
        });
        eventRows.push(eRow);
    });

    return { statsRows, eventRows };
}

function importCards(statsRows, eventRows) {
    const statsList = [];
    const eventList = [];

    statsRows.forEach(row => {
        const item = {
            id: row.id,
            name: row.name,
            char: row.char,
            rare: row.rare,
            img: row.img,
            type: {
                t_train: row.t_train,
                t_sup_1: row.t_sup_1,
                t_sup_2: row.t_sup_2
            },
            u_pot: { name: row.u_pot_nm },
            u_eff: { name: row.u_eff_nm, desc: row.u_eff_dsc },
            support: [],
            jrn: [],
            trn: [],
            sns: []
        };

        // Recover Arrays
        const rebuildArray = (prefix, targetArr) => {
            for (let i = 1; i <= 10; i++) { // Max guess
                if (row[`${prefix}_${i}_t`]) {
                    targetArr.push({
                        type: row[`${prefix}_${i}_t`],
                        v35: row[`${prefix}_${i}_v35`],
                        v50: row[`${prefix}_${i}_v50`]
                    });
                }
            }
        };
        rebuildArray('sup', item.support);
        rebuildArray('jrn', item.jrn);
        rebuildArray('trn', item.trn);
        rebuildArray('sns', item.sns);

        statsList.push(item);
    });

    eventRows.forEach(row => {
        if (!row.id) return;
        const evObj = {};
        ['1', '2', '3'].forEach(stageNum => {
            const prefix = `ev_${stageNum}`;
            const hasData = row[`${prefix}_nm`] || row[`${prefix}_A_nm`] || row[`${prefix}_B_nm`];

            if (hasData) {
                const stageData = {
                    event_name: row[`${prefix}_nm`],
                    name: {
                        choice_A: row[`${prefix}_A_nm`],
                        choice_B: row[`${prefix}_B_nm`]
                    },
                    choice_A: [],
                    choice_B: []
                };

                const rebuild = (choiceChar, cond) => {
                    const obj = { cond: cond, rewards: [] };
                    for (let k = 0; k <= 5; k++) {
                        const typeKey = `${prefix}_${choiceChar}_${cond}_${k}_T`;
                        const valKey = `${prefix}_${choiceChar}_${cond}_${k}_V`;
                        if (row[typeKey]) {
                            obj.rewards.push({
                                type: row[typeKey],
                                value: row[valKey]
                            });
                        }
                    }
                    if (obj.rewards.length === 0) delete obj.rewards;
                    return obj;
                };

                ['FIX', 'Suc', 'Fail'].forEach(c => stageData.choice_A.push(rebuild('A', c)));
                ['FIX', 'Suc', 'Fail'].forEach(c => stageData.choice_B.push(rebuild('B', c)));

                evObj[`stage_${stageNum}`] = stageData;
            }
        });
        eventList.push({ id: row.id, events: evObj });
    });

    saveJson(CARDS_STATS_JSON, statsList);
    saveJson(CARDS_EVENT_JSON, eventList);
    console.log("Updated Cards Stats & Events");
}

// --- Journey & Common ---
function exportJourney() {
    const raw = loadJson(JOURNEY_JSON);
    const rows = [];
    for (const k in raw) {
        raw[k].forEach(ev => {
            const r = { grp: k, cat: ev.category, name: ev.name, time: ev.timing, cond: ev.condition };
            if (ev.choices) ev.choices.forEach((c, i) => {
                const idx = i + 1;
                r[`ch_${idx}_txt`] = (c.text || '').replace(/^\d+\.\s*/, '');
                r[`ch_${idx}_cond`] = c.condition;
                r[`ch_${idx}_res`] = c.result;
                r[`ch_${idx}_res_pos`] = c.result_positive;
                r[`ch_${idx}_res_neg`] = c.result_negative;
            });
            rows.push(r);
        });
    }
    return rows;
}
function importJourney(rows) {
    const newData = {};
    rows.forEach(r => {
        const g = r.grp || r.GroupKey;
        if (!newData[g]) newData[g] = [];
        const ev = { category: r.cat || r.category, name: r.name, timing: r.time || r.timing, condition: r.cond || r.condition, choices: [] };
        let i = 1;
        while (r[`ch_${i}_txt`] || r[`choice_${i}_text`] || r[`ch_${i}_res`]) {
            const txt = r[`ch_${i}_txt`] || r[`choice_${i}_text`];
            if (txt) {
                ev.choices.push({
                    text: `${i}. ${txt}`,
                    condition: r[`ch_${i}_cond`] || r[`choice_${i}_condition`] || '',
                    result: r[`ch_${i}_res`] || r[`choice_${i}_result`] || '',
                    result_positive: r[`ch_${i}_res_pos`] || r[`choice_${i}_result_pos`] || '',
                    result_negative: r[`ch_${i}_res_neg`] || r[`choice_${i}_result_neg`] || ''
                });
            }
            i++;
        }
        newData[g].push(ev);
    });
    saveJson(JOURNEY_JSON, newData);
    console.log("Updated Journey");
}
function exportCommon(f) {
    if (!fs.existsSync(f)) return [];
    const d = loadJson(f);
    if (f.includes('potentials')) return Object.entries(d).map(([k, v]) => ({ nm: k, dsc: v }));
    return d.map(x => ({ kw: x.keyword || x.키워드, cont: x.content || x.내용 }));
}
function importCommon(rows, f) {
    if (f.includes('potentials')) {
        const d = {}; rows.forEach(r => d[r.nm] = r.dsc);
        saveJson(f, d);
    } else {
        saveJson(f, rows.map(r => ({ keyword: r.kw, content: r.cont })));
    }
    console.log(`Updated ${f}`);
}

// --- Main ---
const mode = process.argv[2];
if (mode === 'export') {
    const wb = XLSX.utils.book_new();

    const { profileRows, statsRows, skillsRows } = exportSaviorAndSkills();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(profileRows), 'Savior_Profile');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(statsRows), 'Savior_Stats');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(skillsRows), 'Skills');

    const { statsRows: cardStats, eventRows: cardEvents } = exportCards();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cardStats), 'Cards_Stats');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cardEvents), 'Cards_Event');

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportJourney()), 'Journey');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportCommon(POTENTIALS_JSON)), 'Potentials');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportCommon(FLAVOR_JSON)), 'FlavorText');

    XLSX.writeFile(wb, EXCEL_FILE);
    console.log(`Exported to ${EXCEL_FILE}`);
} else if (mode === 'import') {
    const wb = XLSX.readFile(EXCEL_FILE);
    if (wb.Sheets['Savior_Profile']) importSaviorAndSkills(
        XLSX.utils.sheet_to_json(wb.Sheets['Savior_Profile']),
        XLSX.utils.sheet_to_json(wb.Sheets['Savior_Stats']),
        XLSX.utils.sheet_to_json(wb.Sheets['Skills']),
        XLSX.utils.sheet_to_json(wb.Sheets['Skills_lv'] || []),
        XLSX.utils.sheet_to_json(wb.Sheets['Skills_psv_lv'] || [])
    );
    if (wb.Sheets['Cards_Stats']) importCards(
        XLSX.utils.sheet_to_json(wb.Sheets['Cards_Stats']),
        XLSX.utils.sheet_to_json(wb.Sheets['Cards_Event'])
    );
    if (wb.Sheets['Journey']) importJourney(XLSX.utils.sheet_to_json(wb.Sheets['Journey']));
    if (wb.Sheets['Potentials']) importCommon(XLSX.utils.sheet_to_json(wb.Sheets['Potentials']), POTENTIALS_JSON);
    if (wb.Sheets['FlavorText']) importCommon(XLSX.utils.sheet_to_json(wb.Sheets['FlavorText']), FLAVOR_JSON);

    exportLegacy();
} else {
    console.log("Usage: node scripts/data_manager.js [export|import]");
}

function exportLegacy() {
    const stats = loadJson(CARDS_STATS_JSON) || [];
    const events = loadJson(CARDS_EVENT_JSON) || [];

    const legacyCards = stats.map(c => {
        const ev = events.find(e => e.id === c.id);
        const cardEvents = ev ? ev.events : {};

        const mappedEvents = {};
        if (cardEvents) {
            mappedEvents.이름 = ["", "", ""];

            ['1', '2', '3'].forEach((num, idx) => {
                const sKey = `stage_${num}`;
                const tKey = `${num}단계`;
                if (cardEvents[sKey]) {
                    const s = cardEvents[sKey];
                    // Populate with string name
                    mappedEvents.이름[idx] = s.event_name || "";

                    const stageObj = {
                        이름: {
                            선택지: {
                                선택지A: s.name?.choice_A,
                                선택지B: s.name?.choice_B
                            }
                        },
                        이름_선택지: {
                            선택지A: s.name?.choice_A,
                            선택지B: s.name?.choice_B
                        },
                        선택지A: [],
                        선택지B: []
                    };

                    const mapRewards = (arr) => arr.map(r => ({
                        타입: r.type,
                        수치: r.value
                    }));

                    const processChoices = (sourceArr, targetKey) => {
                        if (!sourceArr) return;
                        sourceArr.forEach(ch => {
                            stageObj[targetKey].push({
                                여부: ch.cond === 'FIX' ? '고정' : (ch.cond === 'Suc' ? '성공' : '실패'),
                                획득: mapRewards(ch.rewards || [])
                            });
                        });
                    };
                    processChoices(s.choice_A, '선택지A');
                    processChoices(s.choice_B, '선택지B');

                    mappedEvents[tKey] = stageObj;
                }
            });
        }

        const mappedSupport = (c.support || []).map(s => ({
            타입: s.type,
            수치35: s.v35,
            수치50: s.v50
        }));

        return {
            아이디: c.id,
            이름: c.name,
            캐릭터: c.char,
            레어도: c.rare,
            이미지: c.img,
            타입: {
                훈련: c.type?.t_train,
                보조1: c.type?.t_sup_1,
                보조2: c.type?.t_sup_2
            },
            고유잠재: { 이름: c.u_pot?.name },
            고유효과: { 이름: c.u_eff?.name, 설명: c.u_eff?.desc },
            지원: mappedSupport,
            여정: (c.jrn || []).map(x => ({ 타입: x.type, 수치35: x.v35, 수치50: x.v50 })),
            훈련: (c.trn || []).map(x => ({ 타입: x.type, 수치35: x.v35, 수치50: x.v50 })),
            감응: (c.sns || []).map(x => ({ 타입: x.type, 수치35: x.v35, 수치50: x.v50 })),
            이벤트: mappedEvents
        };
    });

    saveJson(path.join(DATA_DIR, 'cards.json'), legacyCards);
    console.log("Updated Legacy cards.json");
}
