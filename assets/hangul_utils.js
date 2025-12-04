const HangulUtils = (function () {
    const CHOSUNG = [
        'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
    ];

    const JAMO_MAP = {
        'ㄳ': 'ㄱㅅ', 'ㄵ': 'ㄴㅈ', 'ㄶ': 'ㄴㅎ', 'ㄺ': 'ㄹㄱ', 'ㄻ': 'ㄹㅁ',
        'ㄼ': 'ㄹㅂ', 'ㄽ': 'ㄹㅅ', 'ㄾ': 'ㄹㅌ', 'ㄿ': 'ㄹㅍ', 'ㅀ': 'ㄹㅎ',
        'ㅄ': 'ㅂㅅ'
    };

    // Chosung to Hangul Range Map
    // ㄱ -> [가-깋] (AC00 ~ AC1F is wrong, need full range for that chosung)
    // Formula: ((Cho * 21) + Jung) * 28 + Jong + 0xAC00
    // Range for 'ㄱ' (Cho=0):
    // Start: ((0 * 21) + 0) * 28 + 0 + 0xAC00 = 0xAC00 ('가')
    // End:   ((0 * 21) + 20) * 28 + 27 + 0xAC00 = 0xAE4B ('깋')
    // Wait, Cho index 1 starts at ((1 * 21) + 0) * 28 + 0 + 0xAC00.
    // So 'ㄱ' range is from Cho=0 start to Cho=1 start - 1.

    function getChosungRange(chosungChar) {
        const choIndex = CHOSUNG.indexOf(chosungChar);
        if (choIndex === -1) return null;

        const startCode = 0xAC00 + (choIndex * 21 * 28);
        const endCode = 0xAC00 + ((choIndex + 1) * 21 * 28) - 1;

        return `[${String.fromCharCode(startCode)}-${String.fromCharCode(endCode)}]`;
    }

    function decomposeQuery(query) {
        let result = '';
        for (let char of query) {
            if (JAMO_MAP[char]) {
                result += JAMO_MAP[char];
            } else {
                result += char;
            }
        }
        return result;
    }

    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function createFuzzyMatcher(query) {
        const decomposed = decomposeQuery(query);
        let pattern = '';

        for (let char of decomposed) {
            // 1. If it's a Chosung (e.g. 'ㄱ'), convert to range [가-깋] OR match 'ㄱ' itself
            if (CHOSUNG.includes(char)) {
                const range = getChosungRange(char);
                // Match either the full Hangul syllable in that range OR the Chosung itself
                pattern += `(${range}|${char})`;
            }
            // 2. If it's a space, match space
            else if (char === ' ') {
                pattern += ' ';
            }
            // 3. Otherwise, exact match (escaped)
            else {
                pattern += escapeRegex(char);
            }
        }

        try {
            return new RegExp(pattern, 'i'); // Case insensitive
        } catch (e) {
            console.error('Invalid Regex:', pattern);
            return new RegExp(escapeRegex(query), 'i'); // Fallback
        }
    }

    function isMatch(target, query) {
        // Optimization: Cache regex if query hasn't changed? 
        // For now, just generate it. It's fast enough for short queries.
        const matcher = createFuzzyMatcher(query);
        return matcher.test(target);
    }

    return {
        isMatch,
        createFuzzyMatcher
    };
})();

window.HangulUtils = HangulUtils;
