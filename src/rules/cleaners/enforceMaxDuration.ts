import { TransformRule } from "../engine/ruleTypes";
import { CleanContext } from "../types";
import { countWords, estimateMinutes } from "../../utils/text";

/**
 * Rule: enforceMaxDuration
 * Trims text to stay under a maximum duration.
 * Why: keeps episodes consistent in length.
 * Config: maxMinutes (number)
 */
export const enforceMaxDuration = ({
  maxMinutes,
}: {
  maxMinutes: number;
}): TransformRule<CleanContext> => ({
  id: "enforceMaxDuration",
  description: "Trims text to fit the maximum duration",
  async run(input) {
    const words = input.cleanText.split(/\s+/).filter(Boolean);
    const maxWords = Math.floor(maxMinutes * 155);
    let cleanText = input.cleanText;

    if (words.length > maxWords) {
      cleanText = words.slice(0, maxWords).join(" ") + "...";
    }

    return {
      ok: true,
      data: {
        ...input,
        cleanText,
        estimatedMinutes: estimateMinutes(cleanText),
      },
    };
  },
});
