import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { ExtractedArticle } from "./types";

function extractHeadings(doc: Document): string[] {
  const nodes = Array.from(doc.querySelectorAll("h1, h2, h3"));
  return nodes
    .map((node) => node.textContent?.trim() || "")
    .filter(Boolean);
}

export function extractReadable(
  html: string,
  meta: Omit<ExtractedArticle, "html" | "text" | "headings" | "linkCount" | "hasCodeBlocks">
): ExtractedArticle {
  const dom = new JSDOM(html, { url: meta.canonicalUrl });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  if (!article) {
    throw new Error("Readability failed to extract article");
  }

  const doc = new JSDOM(article.content).window.document;
  const headings = extractHeadings(doc);
  const linkCount = doc.querySelectorAll("a").length;
  const hasCodeBlocks = doc.querySelectorAll("pre, code").length > 0;

  return {
    ...meta,
    html,
    text: article.textContent || "",
    headings,
    linkCount,
    hasCodeBlocks,
  };
}
