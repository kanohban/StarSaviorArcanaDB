const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const prettier = require("prettier");

const importArcana = async () => {
    const excelPath = path.join(__dirname, "../../import/game_data.xlsx");
    const outputPath = path.join(__dirname, "../../data/cards.json");

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

    const cards = [];

    // Helper to extract rewards (Type/Value pairs)
    const getRewards = (row, prefix, maxCount) => {
        const rewards = [];
        for (let i = 0; i <= maxCount; i++) {
            const typeKey = `${prefix}_${i}_T`;
            const valKey = `${prefix}_${i}_V`;
            const type = row[typeKey];
            const val = row[valKey];

            if (type && val !== undefined) {
                rewards.push({
                    "타입": type,
                    "수치": String(val) // Ensure string for consistency with existing JSON
                });
            }
        }
        return rewards;
    };

    // Helper to extract nested structure (Journey, Training, Sensory, Support)
    const getStatsList = (row, prefix, maxCount, typeKeyName = "타입") => { // trn_1_t
        const list = [];
        for (let i = 1; i <= maxCount; i++) {
            const tKey = `${prefix}_${i}_t`;
            const v35Key = `${prefix}_${i}_v35`;
            const v50Key = `${prefix}_${i}_v50`;

            const t = row[tKey];
            if (t) {
                const item = {};
                item[typeKeyName] = t;
                if (row[v35Key]) item["수치35"] = String(row[v35Key]); // "수치35" matches existing JSON key
                if (row[v50Key]) item["수치50"] = String(row[v50Key]);
                list.push(item);
            }
        }
        return list;
    };


    for (const statRow of statsData) {
        const id = statRow.id;
        if (!id) continue;

        const eventRow = eventData.find(e => e.id === id);

        const card = {
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
            "고유잠재": {
                "이름": statRow.u_pot_nm
            },
            "고유효과": {
                "이름": statRow.u_eff_nm,
                "설명": statRow.u_eff_dsc
            },
            "지원": getStatsList(statRow, "sup", 2), // Assuming max 2 based on headers inspected (sup_1)
            "여정": getStatsList(statRow, "jrn", 3),
            "훈련": getStatsList(statRow, "trn", 4),
            "감응": getStatsList(statRow, "sns", 3),
            "이벤트": {
                "이름": [
                    eventRow ? eventRow.ev_1_nm : "",
                    eventRow ? eventRow.ev_2_nm : "",
                    eventRow ? eventRow.ev_3_nm : ""
                ].filter(n => n), // Filter empty names
                "1단계": {},
                "2단계": {},
                "3단계": {}
            }
        };


        if (eventRow) {
            // Process Events 1, 2, 3
            for (let i = 1; i <= 3; i++) {
                const stepKey = `${i}단계`;
                const evPrefix = `ev_${i}`; // ev_1, ev_2...

                // Ensure step object structure
                card["이벤트"][stepKey] = {
                    "이름": {
                        "선택지": {
                            "선택지A": eventRow[`${evPrefix}_A_nm`] || "",
                            "선택지B": eventRow[`${evPrefix}_B_nm`] || ""
                        }
                    },
                    "이름_선택지": { // Legacy structure support? mirroring existing JSON
                        "선택지A": eventRow[`${evPrefix}_A_nm`] || "",
                        "선택지B": eventRow[`${evPrefix}_B_nm`] || ""
                    },
                    "선택지A": [],
                    "선택지B": []
                };

                // Choice A Rewards
                // Fixed
                const fixARewards = getRewards(eventRow, `${evPrefix}_A_FIX`, 5);
                if (fixARewards.length > 0) {
                    card["이벤트"][stepKey]["선택지A"].push({ "여부": "고정", "획득": fixARewards });
                }

                // Success
                const sucARewards = getRewards(eventRow, `${evPrefix}_A_Suc`, 5);
                card["이벤트"][stepKey]["선택지A"].push({ "여부": "성공", "획득": sucARewards }); // Even if empty, existing JSON keeps structure? Or maybe remove if empty. Existing has empty arrays.

                // Fail
                const failARewards = getRewards(eventRow, `${evPrefix}_A_Fail`, 5);
                card["이벤트"][stepKey]["선택지A"].push({ "여부": "실패", "획득": failARewards });


                // Choice B Rewards
                // Fixed
                const fixBRewards = getRewards(eventRow, `${evPrefix}_B_FIX`, 5);
                if (fixBRewards.length > 0) { // Keep consistent with A logic
                    card["이벤트"][stepKey]["선택지B"].push({ "여부": "고정", "획득": fixBRewards });
                } else if (fixARewards.length > 0) { // If A had fixed, B might need entry to balance structure? Existing JSON: Choice B often has empty "Fixed" entry if A has it. Let's force add.
                    card["이벤트"][stepKey]["선택지B"].push({ "여부": "고정", "획득": [] });
                } else {
                    card["이벤트"][stepKey]["선택지B"].push({ "여부": "고정", "획득": [] });
                }

                // Success
                const sucBRewards = getRewards(eventRow, `${evPrefix}_B_Suc`, 5);
                card["이벤트"][stepKey]["선택지B"].push({ "여부": "성공", "획득": sucBRewards });

                // Fail
                const failBRewards = getRewards(eventRow, `${evPrefix}_B_Fail`, 5);
                card["이벤트"][stepKey]["선택지B"].push({ "여부": "실패", "획득": failBRewards });
            }
        }

        cards.push(card);
    }

    // Write to file
    const outputContent = JSON.stringify(cards, null, 2);
    // Prettify? JSON.stringify with null, 2 is basic pretty. Prettier can format better.
    // const formattedInfo = await prettier.format(outputContent, { parser: "json" }); 

    fs.writeFileSync(outputPath, outputContent);
    console.log(`Successfully wrote ${cards.length} cards to ${outputPath}`);

};

importArcana();
