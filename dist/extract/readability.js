"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractReadable = extractReadable;
const jsdom_1 = require("jsdom");
const readability_1 = require("@mozilla/readability");
function extractHeadings(doc) {
    const nodes = Array.from(doc.querySelectorAll("h1, h2, h3"));
    return nodes
        .map((node) => node.textContent?.trim() || "")
        .filter(Boolean);
}
function extractReadable(html, meta) {
    const dom = new jsdom_1.JSDOM(html, { url: meta.canonicalUrl });
    const reader = new readability_1.Readability(dom.window.document);
    const article = reader.parse();
    if (!article) {
        throw new Error("Readability failed to extract article");
    }
    const doc = new jsdom_1.JSDOM(article.content).window.document;
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
