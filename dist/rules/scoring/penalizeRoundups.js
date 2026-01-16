"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.penalizeRoundups = void 0;
/**
 * Rule: penalizeRoundups
 * Subtracts points for roundup-style titles.
 * Why: roundups tend to be list-like and repetitive.
 * Config: none
 */
const penalizeRoundups = () => ({
    id: "penalizeRoundups",
    description: "Penalizes roundup-style titles",
    async score(input) {
        const title = input.article.title.toLowerCase();
        if (title.includes("roundup") || title.includes("weekly"))
            return -3;
        return 0;
    },
});
exports.penalizeRoundups = penalizeRoundups;
