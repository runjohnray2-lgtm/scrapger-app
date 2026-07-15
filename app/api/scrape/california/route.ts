import { NextResponse } from "next/server"
import { scrapeCaliforniaLottery } from "@/lib/scrape-california"
import { processGames, RawGame } from "@/lib/ev-calculator"
import { saveSnapshot } from "@/lib/history"

export const runtime = "nodejs"
export const maxDuration = 60

export async function GET() {
  try {
    const raw = await scrapeCaliforniaLottery()
    if (raw.length === 0) {
      return NextResponse.json({ success: false, error: "No active games found from California Lottery" }, { status: 502 })
    }
    const mapped: RawGame[] = raw.map(g => ({
      name: g.name,
      price: g.price,
      topPrize: g.topPrize,
      pctSold: g.pctSold,
      unclaimed: g.unclaimed,
      totalPrizes: g.totalPrizes,
      printRunOverride: g.printRunOverride,
      gameUrl: g.gameUrl,
    }))
    const games = processGames(mapped, "california")
    await saveSnapshot(games, "california")
    return NextResponse.json({ success: true, count: games.length, games, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error("[scrape/california]", err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
