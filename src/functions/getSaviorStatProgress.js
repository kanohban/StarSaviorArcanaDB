import saviors from "../data/savior.json";
import CONFIG from "../data/modal_savior_status_config.json";

let maxStat = null;

const construct = () => {
    if(!maxStat) {
        maxStat = {}

        CONFIG.STATUS.forEach(config => {
            const sorted = saviors.sort((a, b) => b.status[config.value] - a.status[config.value]);
            
            maxStat[config.value] = sorted[0].status[config.value];
        });
    }
}

construct();

const getSaviorStatProgress = (savior, statName) => {
    return Math.min(100, (savior.status[statName] / maxStat[statName]) * 100);
}

export default getSaviorStatProgress;