import { FilterRule } from "../engine/ruleTypes";
import { ExtractedArticle } from "../../extract/types";

/**
 * Rule: minHeadings
 * Rejects extracted articles with too few headings.
 * Why: long-form pieces usually have structure for better narration.
 * Config: min (number)
 */
export const minHeadings = ({ min }: { min: number }): FilterRule<ExtractedArticle> => ({
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
