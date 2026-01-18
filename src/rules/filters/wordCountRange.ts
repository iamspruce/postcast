import { FilterRule } from "../engine/ruleTypes";
import { ExtractedArticle } from "../../extract/types";

/**
 * Rule: wordCountRange
 * Rejects articles that are too short or too long.
 * Why: Short posts lack depth; extremely long posts are hard to listen to in one go.
 * Config: min (number), max (number)
 */
export const wordCountRange = ({
    min,
    max,
}: {
    min: number;
    max: number;
}): FilterRule<ExtractedArticle> => ({
    id: "wordCountRange",
    description: `Rejects articles outside of ${min}-${max} words`,
    async run(input) {
        const words = input.text.trim().split(/\s+/).filter(Boolean).length;

        if (words < min) {
            return { ok: false, reason: `Word count ${words} below minimum ${min}` };
        }

        if (words > max) {
            return { ok: false, reason: `Word count ${words} exceeds maximum ${max}` };
        }

        return { ok: true, data: input };
    },
});
