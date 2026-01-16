"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enforceMaxDuration = void 0;
const text_1 = require("../../utils/text");
/**
 * Rule: enforceMaxDuration
 * Trims text to stay under a maximum duration.
 * Why: keeps episodes consistent in length.
 * Config: maxMinutes (number)
 */
const enforceMaxDuration = ({ maxMinutes, }) => ({
    id: "enforceMaxDuration",
    description: "Trims text to fit the maximum duration",
    async run(input) {
        const words = input.cleanText.split(/\s+/).filter(Boolean);
        const maxWords = Math.floor(maxMinutes * 155);
        let cleanText = input.cleanText;
        if (words.length > maxWords) {
            cleanText = words.slice(0, maxWords).join(" ") + "...";
        }
        return {
            ok: true,
            data: {
                ...input,
                cleanText,
                estimatedMinutes: (0, text_1.estimateMinutes)(cleanText),
            },
        };
    },
});
exports.enforceMaxDuration = enforceMaxDuration;
