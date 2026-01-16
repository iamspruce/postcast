"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreByWordCount = void 0;
const text_1 = require("../../utils/text");
/**
 * Rule: scoreByWordCount
 * Adds points for longer, substantive articles.
 * Why: longer pieces generally make better episodes.
 * Config: none
 */
const scoreByWordCount = () => ({
    id: "scoreByWordCount",
    description: "Scores higher for larger word counts",
    async score(input) {
        const words = (0, text_1.countWords)(input.cleanText);
        if (words >= 1600)
            return 5;
        if (words >= 1200)
            return 3;
        if (words >= 800)
            return 1;
        return -1;
    },
});
exports.scoreByWordCount = scoreByWordCount;
