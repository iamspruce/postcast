"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchFeed = fetchFeed;
const crypto_1 = __importDefault(require("crypto"));
const rss_parser_1 = __importDefault(require("rss-parser"));
const parser = new rss_parser_1.default({
    timeout: 15000,
});
async function fetchFeed(source) {
    const feed = await parser.parseURL(source.feedUrl);
    return (feed.items || [])
        .filter((item) => item.link)
        .map((item) => ({
        sourceId: source.id,
        feedUrl: source.feedUrl,
        itemId: crypto_1.default
            .createHash("sha256")
            .update(`${source.id}|${item.link}|${item.title || ""}|${item.isoDate || item.pubDate || ""}`)
            .digest("hex"),
        title: item.title || "Untitled",
        link: item.link,
        publishedAt: item.isoDate || item.pubDate,
        author: item.creator || item.author,
        content: item.content || item["content:encoded"],
    }));
}
