"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectDomainMismatch = void 0;
/**
 * Rule: rejectDomainMismatch
 * Rejects articles whose canonical URL doesn't match the feed domain.
 * Why: some feeds syndicate unrelated content or tracking links.
 * Config: none
 */
const rejectDomainMismatch = () => ({
    id: "rejectDomainMismatch",
    description: "Rejects articles from a different domain than the feed",
    async run(input) {
        try {
            const feedHost = new URL(input.feedUrl).hostname.replace(/^www\./, "");
            const articleHost = new URL(input.canonicalUrl).hostname.replace(/^www\./, "");
            if (!articleHost.endsWith(feedHost)) {
                return {
                    ok: false,
                    reason: `Domain mismatch: ${articleHost} vs ${feedHost}`,
                };
            }
            return { ok: true, data: input };
        }
        catch (err) {
            return { ok: false, reason: `Invalid URL: ${err.message}` };
        }
    },
});
exports.rejectDomainMismatch = rejectDomainMismatch;
