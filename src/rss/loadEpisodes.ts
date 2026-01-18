import fs from "fs/promises";
import path from "path";
import { RssItem } from "./types";

export async function loadEpisodes(): Promise<RssItem[]> {
    const episodesDir = path.join(process.cwd(), "data", "episodes");
    try {
        const dates = await fs.readdir(episodesDir);
        const items: RssItem[] = [];
        for (const dateDir of dates) {
            const dayPath = path.join(episodesDir, dateDir);
            const isDir = (await fs.stat(dayPath)).isDirectory();
            if (!isDir) continue;

            const slugs = await fs.readdir(dayPath);
            for (const slug of slugs) {
                const metaPath = path.join(dayPath, slug, "meta.json");
                try {
                    const raw = await fs.readFile(metaPath, "utf8");
                    const meta = JSON.parse(raw) as {
                        title: string;
                        description: string;
                        guid: string;
                        sourceUrl: string;
                        sourceId: string;
                        author: string;
                        pubDate: string;
                        enclosureUrl: string;
                        enclosureLength: number;
                    };
                    // Override pubDate with the folder date (generation date)
                    // to ensure the RSS feed reflects when the episode was created/published,
                    // not when the original article was written.
                    meta.pubDate = new Date(dateDir).toISOString();
                    items.push(meta);
                } catch {
                    continue;
                }
            }
        }
        const seenGuids = new Set<string>();
        const uniqueItems: RssItem[] = [];

        // Sort items by date descending first to keep the newest if duplicates exist
        const sorted = items.sort((a, b) => {
            const db = new Date(b.pubDate).getTime();
            const da = new Date(a.pubDate).getTime();
            return (Number.isNaN(db) ? 0 : db) - (Number.isNaN(da) ? 0 : da);
        });

        for (const item of sorted) {
            if (seenGuids.has(item.guid)) continue;
            seenGuids.add(item.guid);
            uniqueItems.push(item);
        }

        return uniqueItems;
    } catch {
        return [];
    }
}
