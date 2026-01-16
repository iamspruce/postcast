"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRss = buildRss;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
function escapeXml(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;");
}
async function buildRss(channel) {
    const itemsXml = channel.items
        .map((item) => {
        return `\n    <item>\n      <title>${escapeXml(item.title)}</title>\n      <description>${escapeXml(item.description)}</description>\n      <guid>${escapeXml(item.guid)}</guid>\n      <pubDate>${escapeXml(item.pubDate)}</pubDate>\n      <enclosure url=\"${escapeXml(item.enclosureUrl)}\" length=\"${item.enclosureLength}\" type=\"audio/mpeg\" />\n    </item>`;
    })
        .join("");
    const xml = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<rss version=\"2.0\" xmlns:itunes=\"http://www.itunes.com/dtds/podcast-1.0.dtd\">\n  <channel>\n    <title>${escapeXml(channel.title)}</title>\n    <description>${escapeXml(channel.description)}</description>\n    <link>${escapeXml(channel.link)}</link>\n    <language>${escapeXml(channel.language)}</language>\n    <itunes:author>${escapeXml(channel.author)}</itunes:author>\n    <itunes:owner>\n      <itunes:email>${escapeXml(channel.email)}</itunes:email>\n      <itunes:name>${escapeXml(channel.author)}</itunes:name>\n    </itunes:owner>${itemsXml}\n  </channel>\n</rss>\n`;
    const outPath = path_1.default.join(process.cwd(), "public", "rss.xml");
    await promises_1.default.mkdir(path_1.default.dirname(outPath), { recursive: true });
    await promises_1.default.writeFile(outPath, xml);
}
