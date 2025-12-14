const { PASSIVE_SKILL_EFFECT_TYPE, ACTIVE_SKILL_EFFECT_TYPE } = require('./scripts/data_manager/constants.js');

console.log("Testing Constants Access...");
try {
    console.log("PASSIVE_SKILL_EFFECT_TYPE[29]:", PASSIVE_SKILL_EFFECT_TYPE[29]);
    console.log("ACTIVE_SKILL_EFFECT_TYPE[29]:", ACTIVE_SKILL_EFFECT_TYPE[29]);
    console.log("Access Successful.");
} catch (e) {
    console.error("Error accessing constants:", e);
}
