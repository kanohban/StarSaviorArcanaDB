const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const importArcana = async () => {
    const excelPath = path.join(__dirname, "../../import/game_data.xlsx");
    const cardsPath = path.join(__dirname, "../../data/cards.json");
    const statsPath = path.join(__dirname, "../../data/cards_stats.json");
    const eventPath = path.join(__dirname, "../../data/cards_event.json");

    console.log(`Reading Excel file from: ${excelPath}`);
    const file = XLSX.readFile(excelPath);

    const statsSheet = file.Sheets["Cards_Stats"];
    const eventSheet = file.Sheets["Cards_Event"];

    if (!statsSheet || !eventSheet) {
        console.error("Missing Cards_Stats or Cards_Event sheet.");
        return;
    }

    const statsData = XLSX.utils.sheet_to_json(statsSheet);
    const eventData = XLSX.utils.sheet_to_json(eventSheet);

    console.log(`Found ${statsData.length} entries in Cards_Stats.`);
    console.log(`Found ${eventData.length} entries in Cards_Event.`);

    const cards = [];      // For cards.json (Korean)
    const cardsStats = []; // For cards_stats.json (English)
    const cardsEvents = []; // For cards_event.json (English)

    // Helper: Extract key-value pairs for Korean JSON
    const getStatsListKr = (row, prefix, maxCount) => {
        const list = [];
        for (let i = 1; i <= maxCount; i++) {
            const t = row[`${prefix}_${i}_t`];
            if (t) {
                const item = { "타입": t };
                if (row[`${prefix}_${i}_v35`]) item["수치35"] = String(row[`${prefix}_${i}_v35`]);
                if (row[`${prefix}_${i}_v50`]) item["수치50"] = String(row[`${prefix}_${i}_v50`]);
                list.push(item);
            }
        }
        return list;
    };

    // Helper: Extract key-value pairs for English JSON (cards_stats.json)
    const getStatsListEn = (row, prefix, maxCount) => {
        const list = [];
        for (let i = 1; i <= maxCount; i++) {
            const t = row[`${prefix}_${i}_t`];
            if (t) {
                const item = { "type": t };
                if (row[`${prefix}_${i}_v35`]) item["v35"] = String(row[`${prefix}_${i}_v35`]);
                if (row[`${prefix}_${i}_v50`]) item["v50"] = String(row[`${prefix}_${i}_v50`]);
                list.push(item);
            }
        }
        return list;
    };

    // Helper: Extract rewards for Korean JSON
    const getRewardsKr = (row, prefix, maxCount) => {
        const rewards = [];
        for (let i = 0; i <= maxCount; i++) {
            const type = row[`${prefix}_${i}_T`];
            const val = row[`${prefix}_${i}_V`];
            if (type && val !== undefined) {
                rewards.push({ "타입": type, "수치": String(val) });
            }
        }
        return rewards;
    };

    // Helper: Extract rewards for English JSON (cards_event.json)
    const getRewardsEn = (row, prefix, maxCount) => {
        const rewards = [];
        for (let i = 0; i <= maxCount; i++) {
            const type = row[`${prefix}_${i}_T`];
            const val = row[`${prefix}_${i}_V`];
            if (type && val !== undefined) {
                rewards.push({ "type": type, "value": String(val) });
            }
        }
        return rewards;
    };

    for (const statRow of statsData) {
        const id = statRow.id;
        if (!id) continue;

        const eventRow = eventData.find(e => e.id === id);

        // --- 1. cards.json (Korean) ---
        const cardKr = {
            "아이디": id,
            "이름": statRow.name,
            "캐릭터": statRow.char,
            "레어도": statRow.rarity,
            "이미지": statRow.img || `images/cards/${statRow.name.replace(/ /g, "_")}.png`,
            "타입": {
                "훈련": statRow.t_train,
                "보조1": statRow.t_sup_1,
                "보조2": statRow.t_sup_2
            },
            "고유잠재": { "이름": statRow.u_pot_nm },
            "고유효과": { "이름": statRow.u_eff_nm, "설명": statRow.u_eff_dsc },
            "지원": getStatsListKr(statRow, "sup", 2),
            "여정": getStatsListKr(statRow, "jrn", 3),
            "훈련": getStatsListKr(statRow, "trn", 4),
            "감응": getStatsListKr(statRow, "sns", 3),
            "이벤트": {
                "이름": [eventRow?.ev_1_nm, eventRow?.ev_2_nm, eventRow?.ev_3_nm].filter(n => n),
                "1단계": {}, "2단계": {}, "3단계": {}
            }
        };

        if (eventRow) {
            for (let i = 1; i <= 3; i++) {
                const stepKey = `${i}단계`;
                const evPrefix = `ev_${i}`;
                cardKr["이벤트"][stepKey] = {
                    "이름": {
                        "선택지": {
                            "선택지A": eventRow[`${evPrefix}_A_nm`] || "",
                            "선택지B": eventRow[`${evPrefix}_B_nm`] || ""
                        }
                    },
                    "이름_선택지": {
                        "선택지A": eventRow[`${evPrefix}_A_nm`] || "",
                        "선택지B": eventRow[`${evPrefix}_B_nm`] || ""
                    },
                    "선택지A": [
                        { "여부": "고정", "획득": getRewardsKr(eventRow, `${evPrefix}_A_FIX`, 5) },
                        { "여부": "성공", "획득": getRewardsKr(eventRow, `${evPrefix}_A_Suc`, 5) },
                        { "여부": "실패", "획득": getRewardsKr(eventRow, `${evPrefix}_A_Fail`, 5) }
                    ],
                    "선택지B": [
                        { "여부": "고정", "획득": getRewardsKr(eventRow, `${evPrefix}_B_FIX`, 5) },
                        { "여부": "성공", "획득": getRewardsKr(eventRow, `${evPrefix}_B_Suc`, 5) },
                        { "여부": "실패", "획득": getRewardsKr(eventRow, `${evPrefix}_B_Fail`, 5) }
                    ]
                };
            }
        }
        cards.push(cardKr);

        // --- 2. cards_stats.json (English) ---
        const cardEn = {
            "id": id,
            "name": statRow.name,
            "char": statRow.char,
            "rare": statRow.rarity, // Mapped from rarity to rare
            "img": statRow.img || `images/cards/${statRow.name.replace(/ /g, "_")}.png`,
            "type": {
                "t_train": statRow.t_train,
                "t_sup_1": statRow.t_sup_1,
                "t_sup_2": statRow.t_sup_2
            },
            "u_pot": { "name": statRow.u_pot_nm },
            "u_eff": { "name": statRow.u_eff_nm, "desc": statRow.u_eff_dsc },
            "support": getStatsListEn(statRow, "sup", 2),
            "jrn": getStatsListEn(statRow, "jrn", 3),
            "trn": getStatsListEn(statRow, "trn", 4),
            "sns": getStatsListEn(statRow, "sns", 3)
        };
        cardsStats.push(cardEn);

        // --- 3. cards_event.json (English) ---
        if (eventRow) {
            const eventEn = {
                "id": id,
                "events": {}
            };
            for (let i = 1; i <= 3; i++) {
                const stageKey = `stage_${i}`;
                const evPrefix = `ev_${i}`;
                eventEn.events[stageKey] = {
                    "event_name": eventRow[`${evPrefix}_nm`],
                    "name": {
                        "choice_A": eventRow[`${evPrefix}_A_nm`] || "",
                        "choice_B": eventRow[`${evPrefix}_B_nm`] || ""
                    },
                    "choice_A": [
                        { "cond": "FIX", "rewards": getRewardsEn(eventRow, `${evPrefix}_A_FIX`, 5) },
                        { "cond": "Suc", "rewards": getRewardsEn(eventRow, `${evPrefix}_A_Suc`, 5) },
                        { "cond": "Fail", "rewards": getRewardsEn(eventRow, `${evPrefix}_A_Fail`, 5) }
                    ],
                    "choice_B": [
                        { "cond": "FIX", "rewards": getRewardsEn(eventRow, `${evPrefix}_B_FIX`, 5) },
                        { "cond": "Suc", "rewards": getRewardsEn(eventRow, `${evPrefix}_B_Suc`, 5) },
                        { "cond": "Fail", "rewards": getRewardsEn(eventRow, `${evPrefix}_B_Fail`, 5) }
                    ]
                };
            }
            cardsEvents.push(eventEn);
        }
    }

    // Write Files
    fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));
    console.log(`Updated ${cardsPath} (${cards.length} items)`);

    fs.writeFileSync(statsPath, JSON.stringify(cardsStats, null, 2));
    console.log(`Updated ${statsPath} (${cardsStats.length} items)`);

    fs.writeFileSync(eventPath, JSON.stringify(cardsEvents, null, 2));
    console.log(`Updated ${eventPath} (${cardsEvents.length} items)`);
};

importArcana();
