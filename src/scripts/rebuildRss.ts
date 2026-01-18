import { loadEpisodes } from "../rss/loadEpisodes";
import { defaultChannel } from "../rss/templates";
import { buildRss } from "../rss/buildRss";
import { logger } from "../utils/logger";

async function main() {
    logger.info("Starting manual RSS rebuild...");

    try {
        const finalEpisodes = await loadEpisodes();
        logger.info(`Found ${finalEpisodes.length} episodes.`);

        const rssItems = finalEpisodes.slice(0, 50);

        const channel = defaultChannel(rssItems);
        const siteUrl = channel.link.replace(/\/$/, "");
        channel.imageUrl = `${siteUrl}/podcast-cover.png`;

        await buildRss(channel);
        logger.info("RSS feed updated successfully.");
    } catch (err) {
        logger.error("RSS rebuild failed", { error: (err as Error).message });
        process.exit(1);
    }
}

main();
