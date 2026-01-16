import dotenv from "dotenv";

dotenv.config();

type Env = {
  ORANGECLONE_API_KEY?: string;
  ORANGECLONE_BASE_URL?: string;
  ORANGECLONE_CHARACTER_ID?: string;
  ORANGECLONE_CHARACTER_NAME?: string;
  ORANGECLONE_CHARACTER_AVATAR?: string;
  ORANGECLONE_VOICE_SAMPLE_PATH?: string;
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET?: string;
  R2_PUBLIC_BASE_URL?: string;
  PODCAST_TITLE?: string;
  PODCAST_DESCRIPTION?: string;
  PODCAST_LANGUAGE?: string;
  PODCAST_AUTHOR?: string;
  PODCAST_EMAIL?: string;
  PODCAST_SITE_URL?: string;
  LOOKBACK_HOURS?: string;
  MAX_CANDIDATES?: string;
  EPISODES_PER_RUN?: string;
};

const env = process.env as Env;

export const config = {
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

export function requireConfig(value: string, name: string) {
  if (!value) {
    throw new Error(`Missing required config: ${name}`);
  }
  return value;
}
