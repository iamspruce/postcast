"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreByFreshness = void 0;
/**
 * Rule: scoreByFreshness
 * Adds points for recent posts.
 * Why: daily briefing should favor fresh content.
 * Config: hours (number)
 */
const scoreByFreshness = ({ hours }) => ({
    id: "scoreByFreshness",
    description: "Scores higher for recent articles",
    async score(input) {
        const publishedAt = input.article.publishedAt;
        if (!publishedAt)
            return 0;
        const published = new Date(publishedAt).getTime();
        if (Number.isNaN(published))
            return 0;
        const ageHours = (Date.now() - published) / 36e5;
        if (ageHours <= hours)
            return 3;
        if (ageHours <= hours * 2)
            return 1;
        return -1;
    },
});
exports.scoreByFreshness = scoreByFreshness;
