import { NextResponse } from "next/server"
import { scrapeJackpots, calcAllEVs } from "@/lib/scrape-jackpots"

export async function GET() {
  try {
    const data = await scrapeJackpots()
    const evs  = calcAllEVs(data)
    return NextResponse.json({ success: true, data, evs })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}