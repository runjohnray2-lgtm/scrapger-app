import { NextResponse } from "next/server"
import { scrapeOregonLottery } from "@/lib/scrape-oregon"
import { processGames, RawGame } from "@/lib/ev-calculator"
import { saveSnapshot } from "@/lib/history"

export const runtime = "nodejs"
export const maxDuration = 30

export async function GET() {
  try {
    const raw = await scrapeOregonLottery()
    if (raw.length === 0) {
      return NextResponse.json({ success: false, error: "No active games found from Oregon Lottery API" }, { status: 502 })
    }
    const mapped: RawGame[] = raw.map(g => ({
      name: g.name,
      price: g.price,
      topPrize: g.topPrize,
      pctSold: g.pctSold,
      unclaimed: g.unclaimed,
      totalPrizes: null,
    }))
    const games = processGames(mapped, "oregon")
    await saveSnapshot(games, "oregon")
    return NextResponse.json({ success: true, count: games.length, games, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error("[scrape/oregon]", err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}