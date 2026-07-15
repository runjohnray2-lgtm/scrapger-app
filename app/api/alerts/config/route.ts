import { NextRequest, NextResponse } from "next/server"
import { readAlertConfig, saveAlertConfig, AlertConfig } from "@/lib/alert-config"

export const runtime = "nodejs"

export async function GET() {
  try {
    const config = await readAlertConfig()
    // Mask the password in the response
    const safe = { ...config, gmailAppPassword: config.gmailAppPassword ? "••••••••••••••••" : "" }
    return NextResponse.json({ success: true, config: safe })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<AlertConfig>
    const current = await readAlertConfig()

    // If password field is the mask placeholder, keep the existing password
    if (body.gmailAppPassword === "••••••••••••••••") {
      body.gmailAppPassword = current.gmailAppPassword
    }

    const updated: AlertConfig = { ...current, ...body }
    await saveAlertConfig(updated)
    return NextResponse.json({ success: true, config: { ...updated, gmailAppPassword: updated.gmailAppPassword ? "••••••••••••••••" : "" } })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
