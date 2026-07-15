import { NextRequest, NextResponse } from "next/server"
import { readAlertConfig, saveAlertConfig } from "@/lib/alert-config"
import { checkAlertsForState, sendDailyDigest } from "@/lib/check-alerts"
import { sendAlert } from "@/lib/send-alert"
import { readHistory } from "@/lib/history"
import { StateCode } from "@/lib/ev-calculator"
import { Game } from "@/types"

export const runtime = "nodejs"
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const isTest = body.test === true
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002"

    const config = await readAlertConfig()

    if (!config.enabled && !isTest) {
      return NextResponse.json({ success: false, message: "Alerts are disabled" })
    }

    // --- TEST MODE ---
    if (isTest) {
      const r = await sendAlert(config, {
        level: "buy",
        headline: "🧪 SCRAPGER Test Alert",
        subline: "If you received this, your alerts are configured correctly!",
        games: [
          { name: "[TEST] Mystery Crossword", price: 10, ev: 0.12, gintherRatio: 62, signal: "GINTHER BUY", unclaimed: 1, pctSold: 0.98 },
          { name: "[TEST] Feeling Lucky", price: 5, ev: -0.05, gintherRatio: 8, signal: "WATCH", unclaimed: 3, pctSold: 0.72 },
        ],
        appUrl,
      })
      return NextResponse.json({ success: true, test: true, result: r })
    }

    // --- NORMAL CHECK ---
    const states: StateCode[] = []
    if (config.states.oregon) states.push("oregon")
    if (config.states.california) states.push("california")

    const results = []
    const gamesByState: Record<string, Game[]> = {}

    for (const state of states) {
      // Load most recent snapshot
      const history = await readHistory(state)
      if (history.length === 0) {
        results.push({ state, skipped: true, reason: "No data yet — run scrape first" })
        continue
      }
      const latest = history[history.length - 1]
      const currentGames = latest.games as Game[]
      gamesByState[state] = currentGames

      const checkResult = await checkAlertsForState(currentGames, state, config, appUrl)
      results.push(checkResult)
    }

    // Daily digest
    let digestResult = null
    const now = new Date()
    const lastDigest = config.lastDigestSent ? new Date(config.lastDigestSent) : null
    const needsDigest =
      config.thresholds.dailyDigest &&
      (!lastDigest || now.getTime() - lastDigest.getTime() > 20 * 60 * 60 * 1000) // 20h cooldown

    if (needsDigest && Object.keys(gamesByState).length > 0) {
      digestResult = await sendDailyDigest(gamesByState as Record<StateCode, Game[]>, config, appUrl)
      if (digestResult.sent) {
        await saveAlertConfig({ ...config, lastDigestSent: now.toISOString() })
      }
    }

    return NextResponse.json({
      success: true,
      checkedAt: now.toISOString(),
      states: results,
      digest: digestResult,
    })
  } catch (err) {
    console.error("[alerts/check]", err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
