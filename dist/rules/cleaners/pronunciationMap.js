"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pronunciationMap = void 0;
/**
 * Rule: pronunciationMap
 * Applies custom pronunciation substitutions.
 * Why: improves TTS clarity for acronyms and brand names.
 * Config: none
 */
const pronunciationMap = () => ({
    id: "pronunciationMap",
    description: "Maps special terms to speakable variants",
    async run(input) {
        let text = input.cleanText;
        const mappings = [
            [/\bAI\b/g, "A I"],
            [/\bGPU\b/g, "G P U"],
            [/\bCPU\b/g, "C P U"],
            [/\bAPI\b/g, "A P I"],
            [/\bJavaScript\b/g, "Java script"],
            [/\bTypeScript\b/g, "Type script"],
            [/\bSQL\b/g, "sequel"],
        ];
        for (const [pattern, replacement] of mappings) {
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
exports.pronunciationMap = pronunciationMap;
