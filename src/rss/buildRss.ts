import fs from "fs/promises";
import path from "path";
import { RssChannel } from "./types";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

export async function buildRss(channel: RssChannel): Promise<void> {
  const itemsXml = channel.items
    .map((item) => {
      return `
    <item>
      <title>${escapeXml(item.title)}</title>
      <description>${escapeXml(item.description + " Original article: " + item.sourceUrl)}</description>
      <guid>${escapeXml(item.guid)}</guid>
      <pubDate>${escapeXml(item.pubDate)}</pubDate>
      <itunes:author>${escapeXml(item.author || "")}</itunes:author>
      <enclosure url="${escapeXml(item.enclosureUrl)}" length="${item.enclosureLength}" type="audio/mpeg" />
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" 
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(channel.title)}</title>
    <description>${escapeXml(channel.description)}</description>
    <link>${escapeXml(channel.link)}</link>
    <language>${escapeXml(channel.language)}</language>
    <itunes:author>${escapeXml(channel.author)}</itunes:author>
    <itunes:summary>${escapeXml(channel.description)}</itunes:summary>
    <itunes:owner>
      <itunes:email>${escapeXml(channel.email)}</itunes:email>
      <itunes:name>${escapeXml(channel.author)}</itunes:name>
    </itunes:owner>
    <itunes:category text="Technology" />
    <itunes:explicit>no</itunes:explicit>
    ${itemsXml}
  </channel>
</rss>`;

  const publicDir = path.join(process.cwd(), "public");
  await fs.mkdir(publicDir, { recursive: true });

  await fs.writeFile(path.join(publicDir, "rss.xml"), xml);

  const json = JSON.stringify(channel.items, null, 2);
  await fs.writeFile(path.join(publicDir, "episodes.json"), json);
}
