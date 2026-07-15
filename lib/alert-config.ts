import { AlertConfig, DEFAULT_ALERT_CONFIG } from "@/lib/alert-types"
import { put, get } from "@vercel/blob"

export type { CarrierKey } from "@/lib/alert-types"
export { CARRIER_LABELS, CARRIER_GATEWAYS, DEFAULT_ALERT_CONFIG } from "@/lib/alert-types"
export type { AlertConfig } from "@/lib/alert-types"

const BLOB_PATH = "scrapger/alert-config.json"

export async function readAlertConfig(): Promise<AlertConfig> {
  let stored: Partial<AlertConfig> = {}
  try {
    const result = await get(BLOB_PATH, { access: "private" })
    if (result && result.statusCode === 200 && result.stream) {
      const text = await new Response(result.stream as ReadableStream).text()
      stored = JSON.parse(text) as Partial<AlertConfig>
    }
  } catch (err) {
    console.warn("[alert-config] read failed:", err)
  }

  // The Gmail app password NEVER lives in blob storage. It comes only from a
  // server-side environment variable, set directly in the Vercel dashboard —
  // never through this app's UI/API.
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
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  })
}
