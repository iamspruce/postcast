import fs from "fs/promises";
import path from "path";
import { config, requireConfig } from "../config";
import { TtsRequest, TtsResponse } from "./types";
import { logger } from "../utils/logger";

function baseHeaders() {
  const apiKey = requireConfig(config.orangeclone.apiKey, "ORANGECLONE_API_KEY");
  return {
    "content-type": "application/json",
    authorization: `Bearer ${apiKey}`,
  } as Record<string, string>;
}

function authHeaders() {
  const apiKey = requireConfig(config.orangeclone.apiKey, "ORANGECLONE_API_KEY");
  return {
    "Authorization": `Bearer ${apiKey}`,
  } as Record<string, string>;
}

function resolveBaseUrl(): string {
  const baseUrl = config.orangeclone.baseUrl || "https://orangeclone.com/api";
  return baseUrl.replace(/\/+$/, "");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function startSpeechJob(request: TtsRequest): Promise<string> {
  const baseUrl = resolveBaseUrl();
  const startRes = await fetch(`${baseUrl}/voices_clone`, {
    method: "POST",
    headers: baseHeaders(),
    body: JSON.stringify({
      text: request.text,
      character_ids: [request.characterId],
    }),
  });

  if (!startRes.ok) {
    throw new Error(`OrangeClone synth start failed: ${startRes.status}`);
  }

  const startPayload = (await startRes.json()) as {
    data?: { jobId?: string };
    jobId?: string;
  };
  const jobId = startPayload.data?.jobId || startPayload.jobId;
  if (!jobId) {
    throw new Error("OrangeClone synth start did not return a jobId");
  }
  return jobId;
}

export async function getJobStatus(jobId: string): Promise<TtsResponse> {
  const baseUrl = resolveBaseUrl();
  const statusRes = await fetch(`${baseUrl}/voices/${jobId}`, {
    headers: baseHeaders(),
  });

  if (!statusRes.ok) {
    const errorBody = await statusRes.text();
    logger.error(`OrangeClone status check failed: ${statusRes.status}`, { body: errorBody });
    throw new Error(`OrangeClone status failed: ${statusRes.status}`);
  }

  const payload = (await statusRes.json()) as any;
  logger.info(`OrangeClone status payload for ${jobId}:`, payload);

  const status = payload.data?.status || payload.status;
  const audioUrl = payload.data?.audioUrl || payload.data?.audio_url || payload.audioUrl || payload.audio_url;
  const error = payload.data?.error || payload.error;

  if (status === "failed") {
    logger.error(`OrangeClone job failed: ${jobId}`, { error });
    throw new Error(`OrangeClone synth failed: ${error || "unknown error"}`);
  }

  return {
    audioUrl: audioUrl || "",
    jobId,
    status: (status === "completed" ? "completed" : "pending") as TtsResponse["status"]
  };
}


export async function pollSpeechJob(jobId: string): Promise<TtsResponse> {
  const maxAttempts = 300; // 15 minutes at 3s intervals
  const pollIntervalMs = 3000;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const result = await getJobStatus(jobId);

    if (result.status === "completed" && result.audioUrl) {
      logger.info(`OrangeClone job ${jobId} completed!`);
      return result;
    }

    if (attempt % 5 === 0) { // Log every 15 seconds
      logger.info(`OrangeClone job ${jobId} is ${result.status}... (attempt ${attempt + 1})`);
    }

    await sleep(pollIntervalMs);
  }

  return { audioUrl: "", jobId, status: "pending" };
}

export async function synthesizeSpeech(request: TtsRequest): Promise<TtsResponse> {
  const jobId = await startSpeechJob(request);
  const result = await pollSpeechJob(jobId);

  if (result.status === "pending") {
    throw new Error("OrangeClone synth timed out waiting for audioUrl");
  }

  return result;
}

export async function createCharacter(params: {
  name: string;
  avatarStyle: string;
  voiceSamplePath: string;
}): Promise<string> {
  const baseUrl = resolveBaseUrl();
  const buffer = await fs.readFile(params.voiceSamplePath);
  const fileName = path.basename(params.voiceSamplePath);
  const blob = new Blob([new Uint8Array(buffer)], { type: "audio/wav" });

  const formData = new FormData();
  formData.append("name", params.name);
  formData.append("avatarStyle", params.avatarStyle);
  formData.append("voiceFile", blob, fileName);

  const res = await fetch(`${baseUrl}/characters/create`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OrangeClone create character failed: ${res.status} - ${text}`);
  }

  const payload = (await res.json()) as {
    data?: { id?: string; characterId?: string };
    id?: string;
    characterId?: string;
  };
  const id = payload.data?.id || payload.data?.characterId || payload.id || payload.characterId;
  if (!id) {
    throw new Error("OrangeClone create character did not return an id");
  }
  return id;
}
