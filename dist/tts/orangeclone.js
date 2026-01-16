"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.synthesizeSpeech = synthesizeSpeech;
exports.createCharacter = createCharacter;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config");
function baseHeaders() {
    const apiKey = (0, config_1.requireConfig)(config_1.config.orangeclone.apiKey, "ORANGECLONE_API_KEY");
    return {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
    };
}
function authHeaders() {
    const apiKey = (0, config_1.requireConfig)(config_1.config.orangeclone.apiKey, "ORANGECLONE_API_KEY");
    return {
        authorization: `Bearer ${apiKey}`,
    };
}
function resolveBaseUrl() {
    const baseUrl = config_1.config.orangeclone.baseUrl || "https://orangeclone.com/api";
    return baseUrl.replace(/\/+$/, "");
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function synthesizeSpeech(request) {
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
    const startPayload = (await startRes.json());
    const jobId = startPayload.data?.jobId || startPayload.jobId;
    if (!jobId) {
        throw new Error("OrangeClone synth start did not return a jobId");
    }
    const maxAttempts = 120;
    const pollIntervalMs = 3000;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const statusRes = await fetch(`${baseUrl}/voices/${jobId}`, {
            headers: baseHeaders(),
        });
        if (!statusRes.ok) {
            throw new Error(`OrangeClone status failed: ${statusRes.status}`);
        }
        const statusPayload = (await statusRes.json());
        const status = statusPayload.data?.status || statusPayload.status;
        const audioUrl = statusPayload.data?.audioUrl || statusPayload.audioUrl;
        const error = statusPayload.data?.error || statusPayload.error;
        if (status === "completed" && audioUrl) {
            return { audioUrl };
        }
        if (status === "failed") {
            throw new Error(`OrangeClone synth failed: ${error || "unknown error"}`);
        }
        await sleep(pollIntervalMs);
    }
    throw new Error("OrangeClone synth timed out waiting for audioUrl");
}
async function createCharacter(params) {
    const baseUrl = resolveBaseUrl();
    const buffer = await promises_1.default.readFile(params.voiceSamplePath);
    const fileName = path_1.default.basename(params.voiceSamplePath);
    const blob = new Blob([buffer]);
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
        throw new Error(`OrangeClone create character failed: ${res.status}`);
    }
    const payload = (await res.json());
    const id = payload.data?.id || payload.data?.characterId || payload.id || payload.characterId;
    if (!id) {
        throw new Error("OrangeClone create character did not return an id");
    }
    return id;
}
