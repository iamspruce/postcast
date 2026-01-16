import fs from "fs/promises";
import path from "path";

export type ProcessedStore = {
  hashes: string[];
};

const processedPath = path.join(process.cwd(), "data", "processed.json");

export async function loadProcessed(): Promise<ProcessedStore> {
  try {
    const raw = await fs.readFile(processedPath, "utf8");
    return JSON.parse(raw) as ProcessedStore;
  } catch {
    return { hashes: [] };
  }
}

export async function saveProcessed(store: ProcessedStore): Promise<void> {
  await fs.mkdir(path.dirname(processedPath), { recursive: true });
  await fs.writeFile(processedPath, JSON.stringify(store, null, 2));
}

export function isProcessed(store: ProcessedStore, hash: string): boolean {
  return store.hashes.includes(hash);
}

export function addProcessed(store: ProcessedStore, hash: string): ProcessedStore {
  if (store.hashes.includes(hash)) return store;
  return { hashes: [...store.hashes, hash] };
}
