import saviors from "../data/savior.json";

let ranks = null;

const construct = () => {
    if(!ranks) {
        ranks = saviors.map(e => {
            return {
                name: e.name,
                status: e.status
            }
        });
        const keys = ['atk', 'hp', 'def', 'spd', 'crit_rate', 'crit_dmg'];

        keys.forEach(key => {
            const sorted = [...ranks].sort((a, b) => (b.status[key] || 0) - (a.status[key] || 0));
            
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
    }

    return ranks;
}

construct();

const getSaviorStatRanks = () => ranks;

export default getSaviorStatRanks;