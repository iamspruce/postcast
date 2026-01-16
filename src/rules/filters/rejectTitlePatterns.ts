import { FilterRule } from "../engine/ruleTypes";
import { ExtractedArticle } from "../../extract/types";

/**
 * Rule: rejectTitlePatterns
 * Rejects titles that match unwanted patterns (roundups, newsletters, etc.).
 * Why: keeps content focused on single deep-dive articles.
 * Config: none
 */
export const rejectTitlePatterns = (): FilterRule<ExtractedArticle> => ({
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
