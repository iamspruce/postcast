"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeWhitespace = void 0;
/**
 * Rule: normalizeWhitespace
 * Collapses extra whitespace and trims edges.
 * Why: keeps narration smooth and consistent.
 * Config: none
 */
const normalizeWhitespace = () => ({
    id: "normalizeWhitespace",
    description: "Normalizes whitespace in clean text",
    async run(input) {
        const cleanText = input.cleanText
            .replace(/\r\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .replace(/[ \t]{2,}/g, " ")
            .trim();
        return {
            ok: true,
            data: {
                ...input,
                cleanText,
            },
        };
    },
});
exports.normalizeWhitespace = normalizeWhitespace;
