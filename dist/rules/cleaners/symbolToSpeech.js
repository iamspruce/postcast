"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.symbolToSpeech = void 0;
/**
 * Rule: symbolToSpeech
 * Expands symbols into words.
 * Why: TTS handles symbols inconsistently.
 * Config: none
 */
const symbolToSpeech = () => ({
    id: "symbolToSpeech",
    description: "Replaces common symbols with spoken words",
    async run(input) {
        let text = input.cleanText;
        const replacements = [
            [/&/g, " and "],
            [/\+/g, " plus "],
            [/\//g, " slash "],
            [/\$/g, " dollars "],
            [/%/g, " percent "],
            [/@/g, " at "],
            [/\s{2,}/g, " "],
        ];
        for (const [pattern, replacement] of replacements) {
            text = text.replace(pattern, replacement);
        }
        return {
            ok: true,
            data: {
                ...input,
                cleanText: text,
            },
        };
    },
});
exports.symbolToSpeech = symbolToSpeech;
