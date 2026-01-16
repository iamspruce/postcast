import { FilterRule } from "../engine/ruleTypes";
import { ExtractedArticle } from "../../extract/types";

/**
 * Rule: rejectPromos
 * Rejects articles that look like promotions, ads, or events.
 * Why: promos are not suitable for a daily content feed.
 * Config: none
 */
export const rejectPromos = (): FilterRule<ExtractedArticle> => ({
  id: "rejectPromos",
  description: "Rejects promotional or event-driven content",
  async run(input) {
    const hay = `${input.title}\n${input.text}`.toLowerCase();
    const keywords = [
      "sponsored",
      "advertorial",
      "webinar",
      "register now",
      "promotion",
      "promo code",
      "conference",
      "event",
      "sale",
      "discount",
      "partner",
    ];
    const hit = keywords.find((k) => hay.includes(k));
    if (hit) {
      return { ok: false, reason: `Promo keyword detected: ${hit}` };
    }
    return { ok: true, data: input };
  },
});
