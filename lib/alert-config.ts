import { AlertConfig, DEFAULT_ALERT_CONFIG } from "@/lib/alert-types"

export type { CarrierKey } from "@/lib/alert-types"
export { CARRIER_LABELS, CARRIER_GATEWAYS, DEFAULT_ALERT_CONFIG } from "@/lib/alert-types"
export type { AlertConfig } from "@/lib/alert-types"

export async function readAlertConfig(): Promise<AlertConfig> {
  try {
    const fs = await import("fs/promises")
    const file = process.cwd() + "/data/alert-config.json"
    const raw = await fs.readFile(file, "utf-8")
    return { ...DEFAULT_ALERT_CONFIG, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_ALERT_CONFIG }
  }
}

export async function saveAlertConfig(config: AlertConfig): Promise<void> {
  const fs = await import("fs/promises")
  const dir = process.cwd() + "/data"
  const file = dir + "/alert-config.json"
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(file, JSON.stringify(config, null, 2), "utf-8")
}