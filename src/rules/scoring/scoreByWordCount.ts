import { ScoreRule } from "../engine/ruleTypes";
import { CleanContext } from "../types";
import { countWords } from "../../utils/text";

/**
 * Rule: scoreByWordCount
 * Adds points for longer, substantive articles.
 * Why: longer pieces generally make better episodes.
 * Config: none
 */
export const scoreByWordCount = (): ScoreRule<CleanContext> => ({
  id: "scoreByWordCount",
  description: "Scores higher for larger word counts",
  async score(input) {
    const words = countWords(input.cleanText);
    if (words >= 1600) return 5;
    if (words >= 1200) return 3;
    if (words >= 800) return 1;
    return -1;
  },
});
