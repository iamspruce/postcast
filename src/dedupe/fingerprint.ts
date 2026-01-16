import crypto from "crypto";
import { ExtractedArticle } from "../extract/types";

export function fingerprintArticle(article: ExtractedArticle): string {
  const input = `${article.canonicalUrl}|${article.title}`;
  return crypto.createHash("sha256").update(input).digest("hex");
}
