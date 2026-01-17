import crypto from "crypto";
import { ExtractedArticle } from "../extract/types";

export function fingerprintArticle(article: ExtractedArticle): string {
  // Use slugified title and a cleaned version of the URL to be more resilient to tracking params
  const cleanUrl = article.canonicalUrl.split('?')[0].split('#')[0].replace(/\/$/, '');
  const input = `${cleanUrl}|${article.title.trim()}`;
  return crypto.createHash("sha256").update(input).digest("hex");
}
