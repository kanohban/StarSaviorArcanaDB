const HangulUtils = (function () {
    const CHOSUNG = [
        'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
    ];

    const JAMO_MAP = {
        'ㄳ': 'ㄱㅅ', 'ㄵ': 'ㄴㅈ', 'ㄶ': 'ㄴㅎ', 'ㄺ': 'ㄹㄱ', 'ㄻ': 'ㄹㅁ',
        'ㄼ': 'ㄹㅂ', 'ㄽ': 'ㄹㅅ', 'ㄾ': 'ㄹㅌ', 'ㄿ': 'ㄹㅍ', 'ㅀ': 'ㄹㅎ',
        'ㅄ': 'ㅂㅅ'
    };

    function getChosung(char) {
        const code = char.charCodeAt(0);
        if (code >= 0xAC00 && code <= 0xD7A3) {
            const charCode = code - 0xAC00;
            const choIndex = Math.floor(charCode / (21 * 28));
            return CHOSUNG[choIndex];
        }
        return char;
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

    function isChosung(char) {
        const code = char.charCodeAt(0);
        // Hangul Jamo range (U+3131 ~ U+318E)
        return code >= 0x3131 && code <= 0x318E;
    }

    function isMatch(target, query) {
        // 1. Decompose Query (e.g. "ㄽㅍ" -> "ㄹㅅㅍ")
        const decomposedQuery = decomposeQuery(query);

        // 2. Remove spaces from target/query for fuzzy search? 
        // The user didn't explicitly ask for space ignoring, but it's usually good.
        // However, let's stick to the raw strings for now to avoid matching across word boundaries unexpectedly unless requested.
        // Actually, standard behavior usually ignores spaces. Let's try to match strictly first.

        // 3. Char-by-Char Matching
        // We scan the target to see if decomposedQuery appears in it.

        for (let i = 0; i <= target.length - decomposedQuery.length; i++) {
            let match = true;
            for (let j = 0; j < decomposedQuery.length; j++) {
                const tChar = target[i + j];
                const qChar = decomposedQuery[j];

                if (!checkCharMatch(tChar, qChar)) {
                    match = false;
                    break;
                }
            }
            if (match) return true;
        }
        return false;
    }

    function checkCharMatch(tChar, qChar) {
        // If qChar is a space, it must match a space (or we can skip spaces? Let's require match for now)
        if (qChar === ' ') return tChar === ' ';

        // If qChar is full Hangul (e.g. '누'), tChar must be exactly '누'
        const qCode = qChar.charCodeAt(0);
        if (qCode >= 0xAC00 && qCode <= 0xD7A3) {
            return tChar === qChar;
        }

        // If qChar is a Jamo (Chosung), check if tChar's Chosung matches
        if (isChosung(qChar)) {
            const tChosung = getChosung(tChar);
            return tChosung === qChar;
        }

        // Otherwise (English, numbers, symbols), exact match (case insensitive handled by caller usually, but let's be safe)
        return tChar.toLowerCase() === qChar.toLowerCase();
    }

    return {
        isMatch
    };
})();

window.HangulUtils = HangulUtils;
