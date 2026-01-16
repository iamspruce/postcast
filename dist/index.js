"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const slugify_1 = __importDefault(require("slugify"));
const index_1 = require("./sources/index");
const rssFetch_1 = require("./sources/rssFetch");
const fetchHtml_1 = require("./extract/fetchHtml");
const readability_1 = require("./extract/readability");
const index_2 = require("./rules/index");
const pipeline_1 = require("./rules/engine/pipeline");
const pickTopN_1 = require("./rules/selection/pickTopN");
const processedStore_1 = require("./dedupe/processedStore");
const fingerprint_1 = require("./dedupe/fingerprint");
const text_1 = require("./utils/text");
const logger_1 = require("./utils/logger");
const date_1 = require("./utils/date");
const config_1 = require("./config");
const state_1 = require("./state/state");
const orangeclone_1 = require("./tts/orangeclone");
const r2_1 = require("./storage/r2");
const buildRss_1 = require("./rss/buildRss");
const templates_1 = require("./rss/templates");
const MAX_CANDIDATES = config_1.config.pipeline.maxCandidates;
const LOOKBACK_HOURS = config_1.config.pipeline.lookbackHours;
const EPISODES_PER_RUN = config_1.config.pipeline.episodesPerRun;
async function ensureCharacterId() {
    if (config_1.config.orangeclone.characterId)
        return config_1.config.orangeclone.characterId;
    const state = await (0, state_1.loadState)();
    if (state.voice.characterId)
        return state.voice.characterId;
    const name = (0, config_1.requireConfig)(config_1.config.orangeclone.characterName, "ORANGECLONE_CHARACTER_NAME");
    const avatarStyle = (0, config_1.requireConfig)(config_1.config.orangeclone.characterAvatar, "ORANGECLONE_CHARACTER_AVATAR");
    const voiceSamplePath = (0, config_1.requireConfig)(config_1.config.orangeclone.voiceSamplePath, "ORANGECLONE_VOICE_SAMPLE_PATH");
    const characterId = await (0, orangeclone_1.createCharacter)({ name, avatarStyle, voiceSamplePath });
    await (0, state_1.saveState)({
        ...state,
        voice: {
            ...state.voice,
            characterId,
        },
    });
    return characterId;
}
async function loadEpisodes() {
    const episodesDir = path_1.default.join(process.cwd(), "data", "episodes");
    try {
        const dates = await promises_1.default.readdir(episodesDir);
        const items = [];
        for (const dateDir of dates) {
            const dayPath = path_1.default.join(episodesDir, dateDir);
            const slugs = await promises_1.default.readdir(dayPath);
            for (const slug of slugs) {
                const metaPath = path_1.default.join(dayPath, slug, "meta.json");
                try {
                    const raw = await promises_1.default.readFile(metaPath, "utf8");
                    const meta = JSON.parse(raw);
                    items.push(meta);
                }
                catch {
                    continue;
                }
            }
        }
        return items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    }
    catch {
        return [];
    }
}
async function main() {
    logger_1.logger.info("Starting daily pipeline");
    const processed = await (0, processedStore_1.loadProcessed)();
    const characterId = await ensureCharacterId();
    const feeds = await Promise.all(index_1.sources.map((source) => (0, rssFetch_1.fetchFeed)(source)));
    const items = feeds.flat();
    const recentItems = items
        .filter((item) => item.publishedAt)
        .filter((item) => {
        const published = new Date(item.publishedAt).getTime();
        if (Number.isNaN(published))
            return false;
        const ageHours = (Date.now() - published) / 36e5;
        return ageHours <= LOOKBACK_HOURS;
    })
        .slice(0, MAX_CANDIDATES);
    const scored = [];
    for (const item of recentItems) {
        try {
            const html = await (0, fetchHtml_1.fetchHtml)(item.link);
            const article = (0, readability_1.extractReadable)(html, {
                sourceId: item.sourceId,
                feedUrl: item.feedUrl,
                canonicalUrl: item.link,
                title: item.title,
                author: item.author,
                publishedAt: item.publishedAt,
            });
            const hash = (0, fingerprint_1.fingerprintArticle)(article);
            if ((0, processedStore_1.isProcessed)(processed, hash)) {
                logger_1.logger.info(`Skipping already processed: ${article.title}`);
                continue;
            }
            const filterResult = await (0, pipeline_1.runFilters)(article, index_2.filterRules);
            if (!filterResult.ok) {
                logger_1.logger.info(`Rejected: ${filterResult.reason}`);
                continue;
            }
            let context = {
                article,
                cleanText: article.text,
                notes: filterResult.notes || [],
                estimatedMinutes: (0, text_1.estimateMinutes)(article.text),
            };
            const transformed = await (0, pipeline_1.runTransforms)(context, index_2.cleanerRules);
            context = {
                ...transformed.data,
                notes: [...context.notes, ...transformed.notes],
                estimatedMinutes: (0, text_1.estimateMinutes)(transformed.data.cleanText),
            };
            const scoring = await (0, pipeline_1.runScoring)(context, index_2.scoreRules);
            scored.push({
                context,
                score: scoring.total,
                breakdown: scoring.breakdown,
            });
        }
        catch (err) {
            logger_1.logger.warn(`Candidate failed: ${item.title}`, { error: err.message });
        }
    }
    const selected = (0, pickTopN_1.pickTopN)(scored, EPISODES_PER_RUN);
    if (!selected.length) {
        logger_1.logger.info("No eligible candidates found");
        return;
    }
    for (const pick of selected) {
        const { context, score, breakdown } = pick;
        const slug = (0, slugify_1.default)(context.article.title, { lower: true, strict: true });
        const stamp = (0, date_1.dayStamp)();
        const episodeDir = path_1.default.join(process.cwd(), "data", "episodes", stamp, slug);
        await promises_1.default.mkdir(episodeDir, { recursive: true });
        const tts = await (0, orangeclone_1.synthesizeSpeech)({
            characterId,
            text: context.cleanText,
        });
        const audioRes = await fetch(tts.audioUrl);
        if (!audioRes.ok) {
            throw new Error(`Failed to download audio: ${audioRes.status}`);
        }
        const audioBuffer = new Uint8Array(await audioRes.arrayBuffer());
        const key = `episodes/${stamp}/${slug}.mp3`;
        const upload = await (0, r2_1.uploadAudio)(key, audioBuffer);
        const description = `${context.article.title}. Read the full article at ${context.article.canonicalUrl}.`;
        const meta = {
            title: context.article.title,
            description,
            guid: context.article.canonicalUrl,
            pubDate: context.article.publishedAt || (0, date_1.isoDate)(),
            enclosureUrl: upload.publicUrl,
            enclosureLength: audioBuffer.length,
            score,
            breakdown,
            notes: context.notes,
        };
        await promises_1.default.writeFile(path_1.default.join(episodeDir, "meta.json"), JSON.stringify(meta, null, 2));
        await promises_1.default.writeFile(path_1.default.join(episodeDir, "clean.txt"), context.cleanText);
        await promises_1.default.writeFile(path_1.default.join(episodeDir, "raw_extract.txt"), context.article.text);
        const hash = (0, fingerprint_1.fingerprintArticle)(context.article);
        const nextProcessed = (0, processedStore_1.addProcessed)(processed, hash);
        await (0, processedStore_1.saveProcessed)(nextProcessed);
        const existingItems = await loadEpisodes();
        const rssItems = [meta, ...existingItems].slice(0, 50);
        await (0, buildRss_1.buildRss)((0, templates_1.defaultChannel)(rssItems));
        logger_1.logger.info(`Episode generated: ${context.article.title}`);
    }
}
main().catch((err) => {
    logger_1.logger.error("Pipeline failed", { error: err.message });
    process.exit(1);
});
