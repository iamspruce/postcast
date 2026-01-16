import { ExtractedArticle } from "../extract/types";

export type CleanContext = {
  article: ExtractedArticle;
  cleanText: string;
  notes: string[];
  estimatedMinutes: number;
};
