import { FilterRule } from "../engine/ruleTypes";
import { ExtractedArticle } from "../../extract/types";

/**
 * Rule: minWordCount
 * Rejects extracted articles with too few words.
 * Why: short posts are often announcements, promos, or low depth.
 * Config: min (number)
 */
export const minWordCount = ({ min }: { min: number }): FilterRule<ExtractedArticle> => ({
  id: "minWordCount",
  description: `Rejects articles with fewer than ${min} words`,
  async run(input) {
    const words = input.text.trim().split(/\s+/).filter(Boolean);
    if (words.length < min) {
      return { ok: false, reason: `Word count ${words.length} below ${min}` };
    }
    return { ok: true, data: input };
  },
});
