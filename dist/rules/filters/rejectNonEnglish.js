"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectNonEnglish = void 0;
/**
 * Rule: rejectNonEnglish
 * Rejects articles likely not in English.
 * Why: ensures narration stays consistent for the target audience.
 * Config: none
 */
const rejectNonEnglish = () => ({
    id: "rejectNonEnglish",
    description: "Rejects articles with a high ratio of non-ASCII characters",
    async run(input) {
        const text = input.text.slice(0, 2000);
        if (!text)
            return { ok: false, reason: "No text to evaluate" };
        const nonAscii = text.match(/[^\x00-\x7F]/g) || [];
        const ratio = nonAscii.length / text.length;
        if (ratio > 0.2) {
            return { ok: false, reason: `Non-ASCII ratio too high (${ratio.toFixed(2)})` };
        }
        return { ok: true, data: input };
    },
});
exports.rejectNonEnglish = rejectNonEnglish;
