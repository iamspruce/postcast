import { ScoreRule } from "../engine/ruleTypes";
import { CleanContext } from "../types";

/**
 * Rule: scoreByHeadings
 * Rewards articles with more headings.
 * Why: structured articles are easier to narrate.
 * Config: none
 */
export const scoreByHeadings = (): ScoreRule<CleanContext> => ({
  id: "scoreByHeadings",
  description: "Scores higher when there are more headings",
  async score(input) {
    const count = input.article.headings.length;
    if (count >= 6) return 3;
    if (count >= 3) return 1;
    return 0;
  },
});
