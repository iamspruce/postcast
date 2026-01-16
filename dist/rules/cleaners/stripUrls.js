"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripUrls = void 0;
/**
 * Rule: stripUrls
 * Replaces URLs with a short spoken placeholder.
 * Why: TTS reading URLs is noisy.
 * Config: urlReplacement (string)
 */
const stripUrls = ({ urlReplacement, }) => ({
    id: "stripUrls",
    description: "Replaces URLs with a spoken placeholder",
    async run(input) {
        const cleanText = input.cleanText.replace(/https?:\/\/[^\s)\]]+/g, urlReplacement);
        return {
            ok: true,
            data: {
                ...input,
                cleanText,
            },
        };
    },
});
exports.stripUrls = stripUrls;
