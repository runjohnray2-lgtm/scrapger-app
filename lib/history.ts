import fs from "fs/promises"
import path from "path"
import { Game, HistorySnapshot } from "@/types"
import { StateCode } from "@/lib/ev-calculator"

const DATA_DIR = path.join(process.cwd(), "data")

function historyFile(state: StateCode): string {
  return path.join(DATA_DIR, `history-${state}.json`)
}

export async function readHistory(state: StateCode = "oregon"): Promise<HistorySnapshot[]> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    const file = historyFile(state)
    const raw = await fs.readFile(file, "utf-8")
    return JSON.parse(raw) as HistorySnapshot[]
  } catch {
    // Try legacy file for oregon
    if (state === "oregon") {
      try {
        const legacy = path.join(DATA_DIR, "history.json")
        const raw = await fs.readFile(legacy, "utf-8")
        return JSON.parse(raw) as HistorySnapshot[]
      } catch { /* ignore */ }
    }
    return []
  }
}

export async function saveSnapshot(games: Game[], state: StateCode = "oregon"): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  const history = await readHistory(state)

  const snapshot: HistorySnapshot = {
    timestamp: new Date().toISOString(),
    games,
  }

  history.push(snapshot)

  // Keep last 30 snapshots
  const trimmed = history.slice(-30)
  const file = historyFile(state)
  await fs.writeFile(file, JSON.stringify(trimmed, null, 2), "utf-8")
}
