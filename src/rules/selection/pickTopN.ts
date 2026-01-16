import { CleanContext } from "../types";

export type ScoredCandidate = {
  context: CleanContext;
  score: number;
  breakdown: { id: string; delta: number }[];
};

export function pickTopN(items: ScoredCandidate[], limit: number): ScoredCandidate[] {
  return [...items]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
