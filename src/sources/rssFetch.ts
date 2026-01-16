import crypto from "crypto";
import Parser from "rss-parser";
import { FeedItem, Source } from "./types";

const parser: Parser = new Parser({
  timeout: 15000,
});

export async function fetchFeed(source: Source): Promise<FeedItem[]> {
  const feed = await parser.parseURL(source.feedUrl);
  return (feed.items || [])
    .filter((item) => item.link)
    .map((item) => ({
      sourceId: source.id,
      feedUrl: source.feedUrl,
      itemId: crypto
        .createHash("sha256")
        .update(
          `${source.id}|${item.link}|${item.title || ""}|${
            item.isoDate || item.pubDate || ""
          }`
        )
        .digest("hex"),
      title: item.title || "Untitled",
      link: item.link as string,
      publishedAt: item.isoDate || item.pubDate,
      author: item.creator || item.author,
      content: item.content || item["content:encoded"],
    }));
}
