import nodemailer from "nodemailer"
import { AlertConfig, CARRIER_GATEWAYS } from "@/lib/alert-config"

export type SignalLevel = "peak" | "buy" | "watch" | "dead" | "digest"

const LEVEL_COLORS: Record<SignalLevel, { bg: string; border: string; text: string }> = {
  peak:   { bg: "#7f1d1d", border: "#ef4444", text: "#fca5a5" },
  buy:    { bg: "#14532d", border: "#22c55e", text: "#86efac" },
  watch:  { bg: "#713f12", border: "#f59e0b", text: "#fcd34d" },
  dead:   { bg: "#1f2937", border: "#6b7280", text: "#9ca3af" },
  digest: { bg: "#1e1b4b", border: "#818cf8", text: "#c7d2fe" },
}

export interface AlertGameCard {
  name: string
  price: number
  ev: number
  gintherRatio: number | null
  signal: string
  unclaimed: number | null
  pctSold: number
}

export interface AlertPayload {
  level: SignalLevel
  headline: string
  subline: string
  games: AlertGameCard[]
  appUrl: string
}

export function buildAlertEmail(payload: AlertPayload): string {
  const colors = LEVEL_COLORS[payload.level]
  const gameCards = payload.games.map(g => `
    <div style="background:${colors.bg};border:1px solid ${colors.border};border-radius:8px;padding:12px;margin-bottom:10px;">
      <div style="font-size:14px;font-weight:bold;color:${colors.text}">${g.signal} — ${g.name}</div>
      <div style="font-size:12px;color:#d1d5db;margin-top:4px;">
        $${g.price} ticket &nbsp;|&nbsp;
        EV: ${g.ev >= 0 ? "+" : ""}$${g.ev.toFixed(2)} &nbsp;|&nbsp;
        Ginther: ${g.gintherRatio !== null ? g.gintherRatio.toFixed(1) + "×" : "N/A"} &nbsp;|&nbsp;
        ${g.unclaimed !== null ? g.unclaimed + " prizes left" : Math.round((1 - g.pctSold) * 100) + "% remaining"}
      </div>
    </div>
  `).join("")

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#111827;font-family:system-ui,sans-serif;padding:20px;margin:0;">
  <div style="max-width:540px;margin:0 auto;">
    <div style="background:#1f2937;border-radius:12px;padding:20px;border:1px solid #374151;">
      <div style="font-size:22px;font-weight:bold;color:white;margin-bottom:4px;">
        🎰 SCRAPGER
      </div>
      <div style="font-size:18px;font-weight:bold;color:${colors.text};margin-bottom:4px;">
        ${payload.headline}
      </div>
      <div style="font-size:13px;color:#9ca3af;margin-bottom:16px;">
        ${payload.subline}
      </div>
      ${gameCards}
      <div style="margin-top:16px;text-align:center;">
        <a href="${payload.appUrl}" style="background:#2563eb;color:white;padding:10px 24px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:bold;">
          Open SCRAPGER →
        </a>
      </div>
      <div style="margin-top:16px;font-size:11px;color:#6b7280;text-align:center;">
        Lottery outcomes are random. This tool analyzes mathematical EV only. Play responsibly.
      </div>
    </div>
  </div>
</body>
</html>`.trim()
}

function buildSMSText(payload: AlertPayload): string {
  const top = payload.games[0]
  const short = top
    ? `${top.signal}: ${top.name} ($${top.price}) EV${top.ev >= 0 ? "+" : ""}$${top.ev.toFixed(2)}`
    : ""
  return `SCRAPGER: ${payload.headline}\n${short}\n${payload.appUrl}`
}

export async function sendAlert(
  config: AlertConfig,
  payload: AlertPayload
): Promise<{ email: boolean; sms: boolean; errors: string[] }> {
  const errors: string[] = []
  let emailOk = false
  let smsOk = false

  if (!config.gmailUser || !config.gmailAppPassword) {
    errors.push("Gmail credentials not configured")
    return { email: false, sms: false, errors }
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.gmailUser,
      pass: config.gmailAppPassword.replace(/\s/g, ""),
    },
  })

  // Send email
  if (config.email) {
    try {
      await transporter.sendMail({
        from: `"SCRAPGER 🎰" <${config.gmailUser}>`,
        to: config.email,
        subject: payload.headline,
        html: buildAlertEmail(payload),
      })
      emailOk = true
    } catch (e) {
      errors.push(`Email error: ${String(e)}`)
    }
  }

  // Send SMS via carrier gateway
  if (config.phone && config.carrier) {
    const gateway = CARRIER_GATEWAYS[config.carrier]
    if (gateway) {
      const smsAddress = `${config.phone}@${gateway}`
      try {
        await transporter.sendMail({
          from: config.gmailUser,
          to: smsAddress,
          subject: "",
          text: buildSMSText(payload),
        })
        smsOk = true
      } catch (e) {
        errors.push(`SMS error: ${String(e)}`)
      }
    }
  }

  return { email: emailOk, sms: smsOk, errors }
}
