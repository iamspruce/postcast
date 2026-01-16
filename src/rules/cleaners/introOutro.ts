import { TransformRule } from "../engine/ruleTypes";
import { CleanContext } from "../types";

/**
 * Rule: introOutro
 * Adds a short intro and outro for narration.
 * Why: keeps audio consistently framed.
 * Config: none
 */
export const introOutro = (): TransformRule<CleanContext> => ({
  id: "introOutro",
  description: "Adds intro and outro text",
  async run(input) {
    const intro = "Here is today's tech briefing. ";
    const outro = "\n\nThanks for listening. Find the full article link in the description.";

    return {
      ok: true,
      data: {
        ...input,
        cleanText: `${intro}${input.cleanText.trim()}${outro}`,
      },
    };
  },
});
