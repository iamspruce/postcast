import { TransformRule } from "../engine/ruleTypes";
import { CleanContext } from "../types";

/**
 * Rule: pronunciationMap
 * Applies custom pronunciation substitutions.
 * Why: improves TTS clarity for acronyms and brand names.
 * Config: none
 */
export const pronunciationMap = (): TransformRule<CleanContext> => ({
  id: "pronunciationMap",
  description: "Maps special terms to speakable variants",
  async run(input) {
    let text = input.cleanText;
    const mappings: Array<[RegExp, string]> = [
      [/\bAI\b/g, "A I"],
      [/\bGPU\b/g, "G P U"],
      [/\bCPU\b/g, "C P U"],
      [/\bAPI\b/g, "A P I"],
      [/\bJavaScript\b/g, "Java script"],
      [/\bTypeScript\b/g, "Type script"],
      [/\bSQL\b/g, "sequel"],
    ];

    for (const [pattern, replacement] of mappings) {
      text = text.replace(pattern, replacement);
    }

    return {
      ok: true,
      data: {
        ...input,
        cleanText: text,
      },
    };
  },
});
