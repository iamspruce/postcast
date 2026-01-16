import { ScoreRule } from "../engine/ruleTypes";
import { CleanContext } from "../types";

/**
 * Rule: penalizeRoundups
 * Subtracts points for roundup-style titles.
 * Why: roundups tend to be list-like and repetitive.
 * Config: none
 */
export const penalizeRoundups = (): ScoreRule<CleanContext> => ({
  id: "penalizeRoundups",
  description: "Penalizes roundup-style titles",
  async score(input) {
    const title = input.article.title.toLowerCase();
    if (title.includes("roundup") || title.includes("weekly")) return -3;
    return 0;
  },
});
