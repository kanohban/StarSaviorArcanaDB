const HangulUtils = {
    CHOSUNG: [
        'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
    ],

    // Get Chosung from a single character
    getCharChosung(char) {
        const code = char.charCodeAt(0);
        // Check if it's a Hangul Syllable (AC00-D7A3)
        if (code >= 0xAC00 && code <= 0xD7A3) {
            const chosungIndex = Math.floor((code - 0xAC00) / (21 * 28));
            return this.CHOSUNG[chosungIndex];
        }
        return char; // Return as is if not Hangul
    },

    // Get Chosung string from text
    getChosung(str) {
        if (!str) return '';
        return str.split('').map(char => this.getCharChosung(char)).join('');
    },

    // Check if query matches text (supports Chosung search)
    isMatch(text, query) {
        if (!text || !query) return false;
        text = text.toLowerCase();
        query = query.toLowerCase();

        // 1. Exact/Normal match
        if (text.includes(query)) return true;

        // 2. Chosung match
        // Only attempt Chosung match if query contains Hangul Chosung characters
        // and doesn't contain complete Hangul syllables (simple heuristic)
        // Actually, just check if the Chosung of text contains the query
        // But query might be mixed. 
        // Let's assume query is typed as Chosung (e.g. "ㄱㅇ")

        const textChosung = this.getChosung(text);
        return textChosung.includes(query);
    }
};

// Export for module or global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HangulUtils;
} else {
    window.HangulUtils = HangulUtils;
}
