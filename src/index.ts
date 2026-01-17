import fs from "fs/promises";
import path from "path";
import slugify from "slugify";
import { sources } from "./sources/index";
import { fetchFeed } from "./sources/rssFetch";
import { fetchHtml } from "./extract/fetchHtml";
import { extractReadable } from "./extract/readability";
import { filterRules, cleanerRules, scoreRules } from "./rules/index";
import { runFilters, runScoring, runTransforms } from "./rules/engine/pipeline";
import { CleanContext } from "./rules/types";
import { pickTopN, ScoredCandidate } from "./rules/selection/pickTopN";
import { loadProcessed, addProcessed, isProcessed, saveProcessed } from "./dedupe/processedStore";
import { fingerprintArticle } from "./dedupe/fingerprint";
import { estimateMinutes } from "./utils/text";
import { logger } from "./utils/logger";
import { dayStamp, isoDate } from "./utils/date";
import { config, requireConfig } from "./config";
import { loadState, saveState } from "./state/state";
import { createCharacter, startSpeechJob, pollSpeechJob } from "./tts/orangeclone";
import { uploadAudio } from "./storage/r2";
import { buildRss } from "./rss/buildRss";
import { defaultChannel } from "./rss/templates";
import { RssItem } from "./rss/types";
import { findJobByFingerprint, saveJob } from "./state/jobStore";

const MAX_CANDIDATES = config.pipeline.maxCandidates;
const LOOKBACK_HOURS = config.pipeline.lookbackHours;
const EPISODES_PER_RUN = config.pipeline.episodesPerRun;

async function ensureCharacterId(): Promise<string> {
  if (config.orangeclone.characterId) return config.orangeclone.characterId;

  const state = await loadState();
  if (state.voice.characterId) return state.voice.characterId;

  const name = requireConfig(
    config.orangeclone.characterName,
    "ORANGECLONE_CHARACTER_NAME"
  );
  const avatarStyle = requireConfig(
    config.orangeclone.characterAvatar,
    "ORANGECLONE_CHARACTER_AVATAR"
  );
  const voiceSamplePath = requireConfig(
    config.orangeclone.voiceSamplePath,
    "ORANGECLONE_VOICE_SAMPLE_PATH"
  );

  const characterId = await createCharacter({ name, avatarStyle, voiceSamplePath });
  await saveState({
    ...state,
    voice: {
      ...state.voice,
      characterId,
    },
  });
  return characterId;
}

async function loadEpisodes(): Promise<RssItem[]> {
  const episodesDir = path.join(process.cwd(), "data", "episodes");
  try {
    const dates = await fs.readdir(episodesDir);
    const items: RssItem[] = [];
    for (const dateDir of dates) {
      const dayPath = path.join(episodesDir, dateDir);
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
          items.push(meta);
        } catch {
          continue;
        }
      }
    }
    const seenGuids = new Set<string>();
    const uniqueItems: RssItem[] = [];

    // Sort items by date descending first to keep the newest if duplicates exist
    const sorted = items.sort(
      (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    );

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

async function findExistingEpisodeDir(slug: string): Promise<string | undefined> {
  const episodesDir = path.join(process.cwd(), "data", "episodes");
  try {
    const dates = await fs.readdir(episodesDir);
    for (const date of dates) {
      if (date === ".DS_Store") continue;
      const dayPath = path.join(episodesDir, date);
      const isDir = (await fs.stat(dayPath)).isDirectory();
      if (!isDir) continue;

      const items = await fs.readdir(dayPath);
      if (items.includes(slug)) {
        return path.join(dayPath, slug);
      }
    }
  } catch {
    return undefined;
  }
}

async function main() {
  logger.info("Starting daily pipeline");
  let processed = await loadProcessed();
  const characterId = await ensureCharacterId();

  const feeds = await Promise.all(sources.map((source) => fetchFeed(source)));
  const items = feeds.flat();
  const recentItems = items
    .filter((item) => item.publishedAt)
    .filter((item) => {
      const published = new Date(item.publishedAt as string).getTime();
      if (Number.isNaN(published)) return false;
      const ageHours = (Date.now() - published) / 36e5;
      return ageHours <= LOOKBACK_HOURS;
    })
    .slice(0, MAX_CANDIDATES);

  const scored: ScoredCandidate[] = [];
  const seenHashes = new Set<string>();

  for (const item of recentItems) {
    try {
      const html = await fetchHtml(item.link);
      const article = extractReadable(html, {
        sourceId: item.sourceId,
        feedUrl: item.feedUrl,
        canonicalUrl: item.link,
        title: item.title,
        author: item.author,
        publishedAt: item.publishedAt,
      });

      const hash = fingerprintArticle(article);
      if (isProcessed(processed, hash) || seenHashes.has(hash)) {
        logger.info(`Skipping already processed or seen: ${article.title}`);
        continue;
      }
      seenHashes.add(hash);

      const filterResult = await runFilters(article, filterRules);
      if (!filterResult.ok) {
        logger.info(`Rejected: ${filterResult.reason}`);
        continue;
      }

      let context: CleanContext = {
        article,
        cleanText: article.text,
        notes: filterResult.notes || [],
        estimatedMinutes: estimateMinutes(article.text),
      };

      const transformed = await runTransforms(context, cleanerRules);
      context = {
        ...transformed.data,
        notes: [...context.notes, ...transformed.notes],
        estimatedMinutes: estimateMinutes(transformed.data.cleanText),
      };

      const scoring = await runScoring(context, scoreRules);
      scored.push({
        context,
        score: scoring.total,
        breakdown: scoring.breakdown,
      });
    } catch (err) {
      logger.warn(`Candidate failed: ${item.title}`, { error: (err as Error).message });
    }
  }

  const selected = pickTopN(scored, EPISODES_PER_RUN);
  if (!selected.length) {
    logger.info("No eligible candidates found");
    return;
  }

  for (const pick of selected) {
    const { context, score, breakdown } = pick;
    const slug = slugify(context.article.title, { lower: true, strict: true });
    const stamp = dayStamp();
    const hash = fingerprintArticle(context.article);

    // Search for any existing directory for this slug (historical or current)
    const existingDir = await findExistingEpisodeDir(slug);
    const episodeDir = existingDir || path.join(process.cwd(), "data", "episodes", stamp, slug);
    const metaPath = path.join(episodeDir, "meta.json");

    // 1. Check if already fully generated
    try {
      await fs.access(metaPath);
      logger.info(`Episode already fully generated: ${context.article.title} (Found in ${episodeDir})`);
      if (!isProcessed(processed, hash)) {
        processed = addProcessed(processed, hash);
        await saveProcessed(processed);
      }
      continue;
    } catch { }

    // 2. Check for existing job (cross-day or cross-folder)
    let jobId: string | undefined;

    // Check jobs.json first (fast)
    const storeJob = await findJobByFingerprint(hash);
    if (storeJob) {
      jobId = storeJob.jobId;
      logger.info(`Found job ${jobId} in central store for: ${context.article.title}`);
    } else if (existingDir) {
      // Check for local job.json in existing directory (slow but robust)
      try {
        const jobRaw = await fs.readFile(path.join(existingDir, "job.json"), "utf8");
        jobId = JSON.parse(jobRaw).jobId;
        logger.info(`Found existing job ${jobId} in folder: ${existingDir}`);
      } catch { }
    }

    // Ensure directory exists (might be a new day or new article)
    await fs.mkdir(episodeDir, { recursive: true });
    await fs.writeFile(path.join(episodeDir, "clean.txt"), context.cleanText);
    await fs.writeFile(path.join(episodeDir, "raw_extract.txt"), context.article.text);

    // 3. Start or resume job
    if (!jobId) {
      jobId = await startSpeechJob({
        characterId,
        text: context.cleanText,
      });
      await saveJob({
        jobId,
        fingerprint: hash,
        startedAt: new Date().toISOString(),
        status: "pending",
      });

      // Also write to the local directory for extra redundancy
      await fs.writeFile(path.join(episodeDir, "job.json"), JSON.stringify({ jobId, startedAt: new Date().toISOString() }, null, 2));
      logger.info(`Started new OrangeClone job: ${jobId}`);
    } else {
      logger.info(`Resuming existing OrangeClone job: ${jobId}`);
    }

    const tts = await pollSpeechJob(jobId);

    if (tts.status === "pending") {
      logger.warn(`Job ${jobId} is still pending. Skipping for this run.`);
      continue;
    }

    // Update job store with completion
    await saveJob({
      jobId,
      fingerprint: hash,
      startedAt: storeJob?.startedAt || new Date().toISOString(),
      status: "completed",
      audioUrl: tts.audioUrl,
    });

    const audioRes = await fetch(tts.audioUrl);
    if (!audioRes.ok) {
      throw new Error(`Failed to download audio: ${audioRes.status}`);
    }
    const audioBuffer = new Uint8Array(await audioRes.arrayBuffer());

    // Use the date from the folder name for consistency in R2 paths
    const folderParts = episodeDir.split(path.sep);
    const folderStamp = folderParts[folderParts.length - 2] || stamp;

    const key = `episodes/${folderStamp}/${slug}.mp3`;
    const upload = await uploadAudio(key, audioBuffer);

    const description = `${context.article.title}. Read the full article at ${context.article.canonicalUrl}.`;
    const meta = {
      title: context.article.title.trim(),
      description: description.trim(),
      guid: context.article.canonicalUrl,
      sourceUrl: context.article.canonicalUrl,
      sourceId: context.article.sourceId,
      author: (context.article.author || "Unknown").trim(),
      pubDate: context.article.publishedAt || isoDate(),
      enclosureUrl: upload.publicUrl,
      enclosureLength: audioBuffer.length,
      score,
      breakdown,
      notes: context.notes,
    };

    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2));

    processed = addProcessed(processed, hash);
    await saveProcessed(processed);

    logger.info(`Episode generated: ${context.article.title}`);
  }

  // Generate RSS feed after processing all selected episodes
  const finalEpisodes = await loadEpisodes();
  const rssItems = finalEpisodes.slice(0, 50);
  await buildRss(defaultChannel(rssItems));
  logger.info("RSS feed updated successfully");
}

main().catch((err) => {
  logger.error("Pipeline failed", { error: (err as Error).message });
  process.exit(1);
});
