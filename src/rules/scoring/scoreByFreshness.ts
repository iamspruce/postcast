import { ScoreRule } from "../engine/ruleTypes";
import { CleanContext } from "../types";

/**
 * Rule: scoreByFreshness
 * Adds points for recent posts.
 * Why: daily briefing should favor fresh content.
 * Config: hours (number)
 */
export const scoreByFreshness = ({ hours }: { hours: number }): ScoreRule<CleanContext> => ({
  id: "scoreByFreshness",
  description: "Scores higher for recent articles",
  async score(input) {
    const publishedAt = input.article.publishedAt;
    if (!publishedAt) return 0;
    const published = new Date(publishedAt).getTime();
    if (Number.isNaN(published)) return 0;
    const ageHours = (Date.now() - published) / 36e5;
    if (ageHours <= hours) return 3;
    if (ageHours <= hours * 2) return 1;
    return -1;
  },
});
