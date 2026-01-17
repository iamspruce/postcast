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
    return items.sort(
      (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    );
  } catch {
    return [];
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
    const episodeDir = path.join(process.cwd(), "data", "episodes", stamp, slug);
    const metaPath = path.join(episodeDir, "meta.json");

    // 1. Check if already fully generated
    try {
      await fs.access(metaPath);
      logger.info(`Episode already fully generated: ${context.article.title}`);
      if (!isProcessed(processed, hash)) {
        processed = addProcessed(processed, hash);
        await saveProcessed(processed);
      }
      continue;
    } catch { }

    // 2. Check for existing job (cross-day)
    let jobId: string | undefined;
    const existingJob = await findJobByFingerprint(hash);

    if (existingJob) {
      jobId = existingJob.jobId;
      logger.info(`Found existing job ${jobId} for: ${context.article.title} (Status: ${existingJob.status})`);
    }

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
      logger.info(`Started new OrangeClone job: ${jobId}`);
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
      startedAt: existingJob?.startedAt || new Date().toISOString(),
      status: "completed",
      audioUrl: tts.audioUrl,
    });

    const audioRes = await fetch(tts.audioUrl);
    if (!audioRes.ok) {
      throw new Error(`Failed to download audio: ${audioRes.status}`);
    }
    const audioBuffer = new Uint8Array(await audioRes.arrayBuffer());

    const key = `episodes/${stamp}/${slug}.mp3`;
    const upload = await uploadAudio(key, audioBuffer);

    const description = `${context.article.title}. Read the full article at ${context.article.canonicalUrl}.`;
    const meta = {
      title: context.article.title,
      description,
      guid: context.article.canonicalUrl,
      sourceUrl: context.article.canonicalUrl,
      sourceId: context.article.sourceId,
      author: context.article.author || "Unknown",
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

    const existingItems = await loadEpisodes();
    const rssItems = [meta as RssItem, ...existingItems].slice(0, 50);
    await buildRss(defaultChannel(rssItems));

    logger.info(`Episode generated: ${context.article.title}`);
  }
}

main().catch((err) => {
  logger.error("Pipeline failed", { error: (err as Error).message });
  process.exit(1);
});
