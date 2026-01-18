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

function toRfc822(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    // If the input date string is only a date (YYYY-MM-DD), 
    // it can cause timezone shifts. Most ISO strings from rss-parser are full.
    return d.toUTCString();
  } catch {
    return dateStr;
  }
}

export async function buildRss(channel: RssChannel): Promise<void> {
  // Ensure items are sorted by date descending (newest first)
  const sortedItems = [...channel.items].sort((a, b) => {
    const db = new Date(b.pubDate).getTime();
    const da = new Date(a.pubDate).getTime();
    return (Number.isNaN(db) ? 0 : db) - (Number.isNaN(da) ? 0 : da);
  });

  const itemsXml = sortedItems
    .map((item) => {
      const formattedDate = toRfc822(item.pubDate);
      return `
    <item>
      <title>${escapeXml(item.title.trim())}</title>
      <description>${escapeXml(item.description.trim() + " Original article: " + item.sourceUrl)}</description>
      <guid isPermaLink="false">${escapeXml(item.guid)}</guid>
      <pubDate>${escapeXml(formattedDate)}</pubDate>
      <itunes:author>${escapeXml((item.author || "").trim())}</itunes:author>
      <itunes:subtitle>${escapeXml(item.title.trim())}</itunes:subtitle>
      <itunes:summary>${escapeXml(item.description.trim())}</itunes:summary>
      <enclosure url="${escapeXml(item.enclosureUrl)}" length="${item.enclosureLength}" type="audio/mpeg" />
    </item>`;
    })
    .join("");

  const imageXml = channel.imageUrl
    ? `<image>
      <url>${escapeXml(channel.imageUrl)}</url>
      <title>${escapeXml(channel.title)}</title>
      <link>${escapeXml(channel.link)}</link>
    </image>
    <itunes:image href="${escapeXml(channel.imageUrl)}" />`
    : "";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" 
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <atom:link href="${escapeXml(channel.link)}/rss.xml" rel="self" type="application/rss+xml" />
    <title>${escapeXml(channel.title)}</title>
    <description>${escapeXml(channel.description)}</description>
    <link>${escapeXml(channel.link)}</link>
    <language>${escapeXml(channel.language)}</language>
    <copyright>Copyright ${new Date().getFullYear()} ${escapeXml(channel.author)}</copyright>
    <itunes:author>${escapeXml(channel.author)}</itunes:author>
    <itunes:summary>${escapeXml(channel.description)}</itunes:summary>
    <itunes:type>episodic</itunes:type>
    <itunes:owner>
      <itunes:email>${escapeXml(channel.email)}</itunes:email>
      <itunes:name>${escapeXml(channel.author)}</itunes:name>
    </itunes:owner>
    <itunes:category text="Technology" />
    <itunes:explicit>no</itunes:explicit>
    ${imageXml}
    ${itemsXml}
  </channel>
</rss>`;

  const publicDir = path.join(process.cwd(), "public");
  await fs.mkdir(publicDir, { recursive: true });

  await fs.writeFile(path.join(publicDir, "rss.xml"), xml);

  const json = JSON.stringify(sortedItems, null, 2);
  await fs.writeFile(path.join(publicDir, "episodes.json"), json);
}
