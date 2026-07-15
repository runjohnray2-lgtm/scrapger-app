import { AlertConfig, DEFAULT_ALERT_CONFIG } from "@/lib/alert-types"
import { put, list } from "@vercel/blob"

export type { CarrierKey } from "@/lib/alert-types"
export { CARRIER_LABELS, CARRIER_GATEWAYS, DEFAULT_ALERT_CONFIG } from "@/lib/alert-types"
export type { AlertConfig } from "@/lib/alert-types"

const BLOB_PATH = "scrapger/alert-config.json"

export async function readAlertConfig(): Promise<AlertConfig> {
  let stored: Partial<AlertConfig> = {}
  try {
    const { blobs } = await list({ prefix: BLOB_PATH, limit: 1 })
    const match = blobs.find(b => b.pathname === BLOB_PATH)
    if (match) {
      const res = await fetch(match.url, { cache: "no-store" })
      if (res.ok) stored = (await res.json()) as Partial<AlertConfig>
    }
  } catch (err) {
    console.warn("[alert-config] read failed:", err)
  }

  // The Gmail app password NEVER lives in blob storage (blobs are publicly
  // readable by URL). It comes only from a server-side environment variable,
  // set directly in the Vercel dashboard — never through this app's UI/API.
  return {
    ...DEFAULT_ALERT_CONFIG,
    ...stored,
    gmailAppPassword: process.env.GMAIL_APP_PASSWORD ?? "",
  }
}

export async function saveAlertConfig(config: AlertConfig): Promise<void> {
  // Strip the password before persisting — it's not this store's job to hold it.
  const { gmailAppPassword: _omit, ...safeConfig } = config

  await put(BLOB_PATH, JSON.stringify(safeConfig, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  })
}
