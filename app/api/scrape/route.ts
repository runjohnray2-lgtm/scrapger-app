import { NextResponse } from "next/server"
import { chromium } from "playwright"
import { processGames } from "@/lib/ev-calculator"
import { saveSnapshot } from "@/lib/history"

export const runtime = "nodejs"
export const maxDuration = 60

const OREGON_URL = "https://www.oregonlottery.org/scratch-its/list/"

export async function GET() {
  let browser = null
  try {
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    })

    await page.goto(OREGON_URL, { waitUntil: "networkidle", timeout: 30000 })

    try {
      await page.waitForSelector("#DataTables_Table_0 tbody tr", { timeout: 15000 })
    } catch { /* proceed anyway */ }

    const rawGames = await page.evaluate(() => {
      const results: {
        gameNum: string; name: string; gameUrl: string
        price: number; topPrize: number; unclaimed: number; pctSold: number
      }[] = []

      let rows = document.querySelectorAll("#DataTables_Table_0 tbody tr")
      if (rows.length === 0) rows = document.querySelectorAll("table.ol-table tbody tr")

      rows.forEach((row) => {
        const cells = row.querySelectorAll("td")
        if (cells.length < 5) return
        const cell0   = cells[0]
        const gameUrl = (cell0.querySelector("a") as HTMLAnchorElement)?.href ?? ""
        const gameNum = cell0.textContent?.replace(/\D/g, "").trim() ?? ""
        const name    = cells[1].textContent?.trim() ?? ""
        const price     = parseFloat(cells[2].textContent?.replace(/[$,]/g, "") ?? "0") || 0
        const topPrize  = parseFloat(cells[3].textContent?.replace(/[$,]/g, "") ?? "0") || 0
        const unclaimed = parseInt(cells[4].textContent?.replace(/,/g, "") ?? "0", 10) || 0
        const pctSold   = (parseFloat(cells[5].textContent?.replace("%", "") ?? "0") || 0) / 100
        if (!name || price === 0) return
        results.push({ gameNum, name, gameUrl, price, topPrize, unclaimed, pctSold })
      })
      return results
    })

    await browser.close()
    browser = null

    if (rawGames.length === 0) {
      return NextResponse.json(
        { error: "No games found. Oregon Lottery may have changed their page." },
        { status: 502 }
      )
    }

    const games = processGames(rawGames)

    // Save to history (auto-runs on every scrape)
    try { saveSnapshot(games) } catch { /* don't fail scrape if history write fails */ }

    return NextResponse.json({
      scrapedAt:   new Date().toISOString(),
      totalGames:  games.length,
      buySignals:  games.filter((g) => g.signal.includes("BUY")).length,
      watchSignals: games.filter((g) => g.signal.includes("WATCH") || g.signal.includes("MONITOR")).length,
      deadGames:   games.filter((g) => g.signal.includes("DEAD")).length,
      games,
    })
  } catch (err) {
    if (browser) { try { await browser.close() } catch { /**/ } }
    return NextResponse.json({ error: `Scrape failed: ${String(err)}` }, { status: 500 })
  }
}
