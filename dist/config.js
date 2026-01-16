"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.requireConfig = requireConfig;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const env = process.env;
exports.config = {
    orangeclone: {
        apiKey: env.ORANGECLONE_API_KEY || "",
        baseUrl: env.ORANGECLONE_BASE_URL || "",
        characterId: env.ORANGECLONE_CHARACTER_ID || "",
        characterName: env.ORANGECLONE_CHARACTER_NAME || "",
        characterAvatar: env.ORANGECLONE_CHARACTER_AVATAR || "",
        voiceSamplePath: env.ORANGECLONE_VOICE_SAMPLE_PATH || "",
    },
    r2: {
        accountId: env.R2_ACCOUNT_ID || "",
        accessKeyId: env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: env.R2_SECRET_ACCESS_KEY || "",
        bucket: env.R2_BUCKET || "",
        publicBaseUrl: env.R2_PUBLIC_BASE_URL || "",
    },
    podcast: {
        title: env.PODCAST_TITLE || "Tech Audio Briefing",
        description: env.PODCAST_DESCRIPTION || "Daily tech articles read aloud.",
        language: env.PODCAST_LANGUAGE || "en-us",
        author: env.PODCAST_AUTHOR || "Tech Audio",
        email: env.PODCAST_EMAIL || "you@example.com",
        siteUrl: env.PODCAST_SITE_URL || "",
    },
    pipeline: {
        lookbackHours: Number(env.LOOKBACK_HOURS || 72),
        maxCandidates: Number(env.MAX_CANDIDATES || 15),
        episodesPerRun: Number(env.EPISODES_PER_RUN || 1),
    },
};
function requireConfig(value, name) {
    if (!value) {
        throw new Error(`Missing required config: ${name}`);
    }
    return value;
}
