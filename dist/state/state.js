"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadState = loadState;
exports.saveState = saveState;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const statePath = path_1.default.join(process.cwd(), "data", "state.json");
function defaultState() {
    const now = new Date().toISOString();
    return { voice: { createdAt: now, updatedAt: now } };
}
async function loadState() {
    try {
        const raw = await promises_1.default.readFile(statePath, "utf8");
        return JSON.parse(raw);
    }
    catch {
        return defaultState();
    }
}
async function saveState(state) {
    const next = {
        ...state,
        voice: {
            ...state.voice,
            updatedAt: new Date().toISOString(),
        },
    };
    await promises_1.default.mkdir(path_1.default.dirname(statePath), { recursive: true });
    await promises_1.default.writeFile(statePath, JSON.stringify(next, null, 2));
}
