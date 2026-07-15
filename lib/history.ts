import { put, get } from "@vercel/blob"
import { Game, HistorySnapshot } from "@/types"
import { StateCode } from "@/lib/ev-calculator"

function blobPath(state: StateCode): string {
  return `scrapger/history-${state}.json`
}

async function readJsonBlob<T>(pathname: string): Promise<T | null> {
  try {
    const result = await get(pathname, { access: "private" })
    if (!result || result.statusCode !== 200 || !result.stream) return null
    const text = await new Response(result.stream as ReadableStream).text()
    return JSON.parse(text) as T
  } catch (err) {
    console.warn(`[blob] read failed for ${pathname}:`, err)
    return null
  }
}

export async function readHistory(state: StateCode = "oregon"): Promise<HistorySnapshot[]> {
  const data = await readJsonBlob<HistorySnapshot[]>(blobPath(state))
  return data ?? []
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
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  })
}
