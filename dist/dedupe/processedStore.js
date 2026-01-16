"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadProcessed = loadProcessed;
exports.saveProcessed = saveProcessed;
exports.isProcessed = isProcessed;
exports.addProcessed = addProcessed;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const processedPath = path_1.default.join(process.cwd(), "data", "processed.json");
async function loadProcessed() {
    try {
        const raw = await promises_1.default.readFile(processedPath, "utf8");
        return JSON.parse(raw);
    }
    catch {
        return { hashes: [] };
    }
}
async function saveProcessed(store) {
    await promises_1.default.mkdir(path_1.default.dirname(processedPath), { recursive: true });
    await promises_1.default.writeFile(processedPath, JSON.stringify(store, null, 2));
}
function isProcessed(store, hash) {
    return store.hashes.includes(hash);
}
function addProcessed(store, hash) {
    if (store.hashes.includes(hash))
        return store;
    return { hashes: [...store.hashes, hash] };
}
