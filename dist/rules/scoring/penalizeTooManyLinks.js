"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.penalizeTooManyLinks = void 0;
/**
 * Rule: penalizeTooManyLinks
 * Subtracts points for articles heavy with outbound links.
 * Why: link-heavy content reads poorly.
 * Config: none
 */
const penalizeTooManyLinks = () => ({
    id: "penalizeTooManyLinks",
    description: "Penalizes link-heavy articles",
    async score(input) {
        const count = input.article.linkCount;
        if (count >= 30)
            return -3;
        if (count >= 15)
            return -1;
        return 0;
    },
});
exports.penalizeTooManyLinks = penalizeTooManyLinks;
