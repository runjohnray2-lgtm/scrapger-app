import { NextRequest, NextResponse } from "next/server"
import { readHistory } from "@/lib/history"
import { StateCode } from "@/lib/ev-calculator"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const state = (req.nextUrl.searchParams.get("state") ?? "oregon") as StateCode
  try {
    const history = await readHistory(state)
    return NextResponse.json({ success: true, count: history.length, history })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
