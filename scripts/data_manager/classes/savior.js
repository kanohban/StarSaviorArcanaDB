class Savior {
    id;
    name;
    rank;
    attr;
    class;
    atk_type;
    inst = {
        birth: 0,
        height: 0,
        origin: "",
        team: "",
        cv_ko: "",
        cv_jp: "",
        desc: ""
    }
    status = {
        atk: 0,
        hp: 0,
        def: 0,
        spd: 0,
        crit_rate: 0,
        crit_dmg: 0,
        eff_rate: 0,
        eff_resist: 0,
        acc: 0,
    }
    journey_status = {
        str: 0,
        hp: 0,
        end: 0,
        focus: 0,
        prot: 0,
    }
    potentials = []
    skills = []

    constructor(info) {
        this.id = info[0];
        this.name = info[1];
        this.rank = info[2];
        this.attr = info[3];
        this.class = info[4];
        this.atk_type = info[5];

        this.inst.birth = info[6];
        this.inst.height = info[7];
        this.inst.origin = info[8];
        this.inst.team = info[9];
        this.inst.cv_ko = info[10];
        this.inst.cv_jp = info[11];
        this.inst.desc = info[12];
    }

    setStatus = (info) => {
        this.status.atk = info[2];
        this.status.hp = info[3];
        this.status.def = info[4];
        this.status.spd = info[5];
        this.status.crit_rate = info[6];
        this.status.crit_dmg = info[7];
        this.status.eff_rate = info[8];
        this.status.eff_resist = info[9];
        this.status.acc = info[10];

        this.journey_status.str = info[11];
        this.journey_status.hp = info[12];
        this.journey_status.end = info[13];
        this.journey_status.focus = info[14];
        this.journey_status.prot = info[15];

        for(let i = 0; i < 3; i++) {
            const value = info[i + 16];
            
            if(value !== undefined) {
                this.potentials.push({
                    level: i === 0 ? 3 : i === 1 ? 6 : 10,
                    value: value
                });
            }
        }
    }

    addSkill = (skill) => {
        this.skills.push(skill);
    }
    
    static test = (data) => {
        const { SKILL_TYPE, ACTIVE_SKILL_EFFECT_TYPE, PASSIVE_SKILL_EFFECT_TYPE } = require("../constants.js");
        
        console.log(data.name);
        for(let i = 0; i < data.skills.length; i++) {
            const skill = data.skills[i];

            console.log(skill.name);

            if(skill.type === 0 ) {
                for(let j = 0; j < skill.levels.length; j++) {
                    const levelInfo = skill.levels[j];
                    console.log(`스킬레벨 : ${levelInfo.level}`);
                    console.log(`스킬설명 : ${levelInfo.desc.map(e => PASSIVE_SKILL_EFFECT_TYPE[e.type].replace("{value}", e.value).replace("{char}", data.name)).join(" ")}`);
                }
            } else {
                for(let j = 0; j < skill.levels.length; j++) {
                    const levelInfo = skill.levels[j];
                    console.log(`스킬레벨 : ${levelInfo.level} / 스킬설명 : ${ACTIVE_SKILL_EFFECT_TYPE[levelInfo.type].replace("{value}", levelInfo.value)}`);
                }
            }
            console.log("-----------------")
        }
    }
}

class Skill {
    id;
    name;
    type;
    atk_type;
    target;
    cooltime;
    break;
    nova;
    desc;
    nova_desc;
    levels = []

    constructor(info) {
        this.id = info[0];
        this.name = info[2];
        this.type = info[3];
        this.atk_type = info[4];
        this.target = info[5];
        this.cooltime = info[6];
        this.break = info[7];
        this.nova = info[8];
        this.desc = info[9];
        this.nova_desc = info[10];
    }

    isPassive = () => this.type === 0;

    setPassiveLevels = (info) => {
        for(let i = 0; i < info.length; i++) {
            const levelInfo = info[i];

            const passive = {
                level: levelInfo[2],
                desc: []
            }

            passive.desc.push({
                type: levelInfo[3],
                value: levelInfo[4]
            });

            if(levelInfo[5] !== undefined) {
                passive.desc.push({
                    type: levelInfo[5],
                    value: levelInfo[6]
                });
            }

            this.levels.push(passive);
        }
    }

    setActiveLevels = (info) => {
        let level = 1;
        for(let i = 2; i < info.length; i += 2) {
            this.levels.push({
                level: level++,
                type: info[i],
                value: info[i + 1]
            });
        }
    }
}

module.exports = {
    Savior,
    Skill
}