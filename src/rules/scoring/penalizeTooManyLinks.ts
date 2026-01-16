import { ScoreRule } from "../engine/ruleTypes";
import { CleanContext } from "../types";

/**
 * Rule: penalizeTooManyLinks
 * Subtracts points for articles heavy with outbound links.
 * Why: link-heavy content reads poorly.
 * Config: none
 */
export const penalizeTooManyLinks = (): ScoreRule<CleanContext> => ({
  id: "penalizeTooManyLinks",
  description: "Penalizes link-heavy articles",
  async score(input) {
    const count = input.article.linkCount;
    if (count >= 30) return -3;
    if (count >= 15) return -1;
    return 0;
  },
});
