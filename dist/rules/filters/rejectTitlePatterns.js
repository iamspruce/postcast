"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectTitlePatterns = void 0;
/**
 * Rule: rejectTitlePatterns
 * Rejects titles that match unwanted patterns (roundups, newsletters, etc.).
 * Why: keeps content focused on single deep-dive articles.
 * Config: none
 */
const rejectTitlePatterns = () => ({
    id: "rejectTitlePatterns",
    description: "Rejects titles matching undesirable patterns",
    async run(input) {
        const title = input.title.toLowerCase();
        const patterns = [
            /weekly\s+roundup/,
            /daily\s+roundup/,
            /newsletter/,
            /jobs?/,
            /sponsored/,
            /podcast/,
            /sponsor/,
            /press\s+release/,
        ];
        const hit = patterns.find((p) => p.test(title));
        if (hit) {
            return { ok: false, reason: `Title pattern rejected: ${hit}` };
        }
        return { ok: true, data: input };
    },
});
exports.rejectTitlePatterns = rejectTitlePatterns;
