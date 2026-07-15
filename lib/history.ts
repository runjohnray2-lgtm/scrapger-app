import { put, list } from "@vercel/blob"
import { Game, HistorySnapshot } from "@/types"
import { StateCode } from "@/lib/ev-calculator"

function blobPath(state: StateCode): string {
  return `scrapger/history-${state}.json`
}

export async function readHistory(state: StateCode = "oregon"): Promise<HistorySnapshot[]> {
  try {
    const path = blobPath(state)
    const { blobs } = await list({ prefix: path, limit: 1 })
    const match = blobs.find(b => b.pathname === path)
    if (!match) return []
    const res = await fetch(match.url, { cache: "no-store" })
    if (!res.ok) return []
    return (await res.json()) as HistorySnapshot[]
  } catch (err) {
    console.warn("[history] read failed:", err)
    return []
  }
}

export async function saveSnapshot(games: Game[], state: StateCode = "oregon"): Promise<void> {
  const history = await readHistory(state)

  const snapshot: HistorySnapshot = {
    timestamp: new Date().toISOString(),
    games,
  }

  history.push(snapshot)

  // Keep last 30 snapshots
  const trimmed = history.slice(-30)

  await put(blobPath(state), JSON.stringify(trimmed, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  })
}
