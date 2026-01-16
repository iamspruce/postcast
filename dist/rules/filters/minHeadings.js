"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.minHeadings = void 0;
/**
 * Rule: minHeadings
 * Rejects extracted articles with too few headings.
 * Why: long-form pieces usually have structure for better narration.
 * Config: min (number)
 */
const minHeadings = ({ min }) => ({
    id: "minHeadings",
    description: `Rejects articles with fewer than ${min} headings`,
    async run(input) {
        const count = input.headings.length;
        if (count < min) {
            return { ok: false, reason: `Heading count ${count} below ${min}` };
        }
        return { ok: true, data: input };
    },
});
exports.minHeadings = minHeadings;
