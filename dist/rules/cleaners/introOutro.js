"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.introOutro = void 0;
/**
 * Rule: introOutro
 * Adds a short intro and outro for narration.
 * Why: keeps audio consistently framed.
 * Config: none
 */
const introOutro = () => ({
    id: "introOutro",
    description: "Adds intro and outro text",
    async run(input) {
        const intro = "Here is today's tech briefing. ";
        const outro = "\n\nThanks for listening. Find the full article link in the description.";
        return {
            ok: true,
            data: {
                ...input,
                cleanText: `${intro}${input.cleanText.trim()}${outro}`,
            },
        };
    },
});
exports.introOutro = introOutro;
