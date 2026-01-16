import fs from "fs/promises";
import path from "path";
import { State } from "./schema";

const statePath = path.join(process.cwd(), "data", "state.json");

function defaultState(): State {
  const now = new Date().toISOString();
  return { voice: { createdAt: now, updatedAt: now } };
}

export async function loadState(): Promise<State> {
  try {
    const raw = await fs.readFile(statePath, "utf8");
    return JSON.parse(raw) as State;
  } catch {
    return defaultState();
  }
}

export async function saveState(state: State): Promise<void> {
  const next = {
    ...state,
    voice: {
      ...state.voice,
      updatedAt: new Date().toISOString(),
    },
  };
  await fs.mkdir(path.dirname(statePath), { recursive: true });
  await fs.writeFile(statePath, JSON.stringify(next, null, 2));
}
