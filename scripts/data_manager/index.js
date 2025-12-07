const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const { Savior, Skill } = require("./classes/savior");

// const sheetNames = ["savior_profile", "savior_stats", "skills", "skills_active_level", "skills_passive_level"];

const file = XLSX.readFile(`./import/game_data.xlsx`);

// get_origin_info
const sheet_savior_profile = file.Sheets["savior_profile"];
const saviorProfileData = XLSX.utils.sheet_to_json(sheet_savior_profile, { header: 1 }).filter(e => e.length !== 0);

const saviors = [];

for (let i = 1; i < saviorProfileData.length; i++) {
    const savior = new Savior(saviorProfileData[i]);

    saviors.push(savior);
}

// get_status
const sheet_savior_stats = file.Sheets["savior_stats"];
const saviorProfileStats = XLSX.utils.sheet_to_json(sheet_savior_stats, { header: 1 }).filter(e => e.length !== 0);

for (let i = 1; i < saviorProfileStats.length; i++) {
    const stat = saviorProfileStats[i];
    const savior = saviors.find(e => e.id === stat[0]);

    savior.setStatus(stat);
}

// get_skill
const sheet_skills = file.Sheets["skills"];
const sheet_skills_active = file.Sheets["skills_active_level"];
const sheet_skills_passive = file.Sheets["skills_passive_level"];

const saviorSkills = XLSX.utils.sheet_to_json(sheet_skills, { header: 1 }).filter(e => e.length !== 0);
const saviorSkillsActive = XLSX.utils.sheet_to_json(sheet_skills_active, { header: 1 }).filter(e => e.length !== 0);
const saviorSkillsPassive = XLSX.utils.sheet_to_json(sheet_skills_passive, { header: 1 }).filter(e => e.length !== 0);

for (let i = 1; i < saviorSkills.length; i++) {
    const info = saviorSkills[i];
    const savior = saviors.find(e => e.name === info[1]);
    const skill = new Skill(info);

    if (skill.isPassive()) {
        const startIndex = saviorSkillsPassive.findIndex(e => e[0] === skill.id);
        const levels = saviorSkillsPassive.slice(startIndex, startIndex + 4);

        skill.setPassiveLevels(levels);
    } else {
        const levels = saviorSkillsActive.find(e => e[0] === skill.id);

        skill.setActiveLevels(levels);
    }

    savior.addSkill(skill);
}

fs.writeFileSync("./data/savior.json", JSON.stringify(saviors, null, 2));