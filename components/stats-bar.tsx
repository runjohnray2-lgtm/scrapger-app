"use client"

import { Game } from "@/types"
import { StateCode } from "@/lib/ev-calculator"

interface StatsBarProps {
  games: Game[]
  state?: StateCode
}

export function StatsBar({ games, state = "oregon" }: StatsBarProps) {
  const buyCount = games.filter(g => g.signal === "BUY" || g.signal === "GINTHER BUY").length
  const watchCount = games.filter(g => g.signal === "WATCH").length
  const deadCount = games.filter(g => g.signal === "DEAD").length
  const avgEV = games.length ? (games.reduce((s, g) => s + g.ev, 0) / games.length) : 0
  const topGinther = games.reduce((best, g) => Math.max(best, g.gintherRatio ?? 0), 0)

  const isCA = state === "california"
  const accent = isCA ? "text-yellow-400" : "text-green-400"
  const bgAccent = isCA ? "bg-yellow-900/20 border-yellow-800" : "bg-green-900/20 border-green-800"

  const stats = [
    { label: "Total Games", value: games.length, color: "text-blue-400" },
    { label: "🟢 BUY Signals", value: buyCount, color: buyCount > 0 ? "text-green-400" : "text-gray-400" },
    { label: "👀 WATCH", value: watchCount, color: "text-yellow-400" },
    { label: "💀 DEAD", value: deadCount, color: "text-red-400" },
    { label: "Avg EV", value: `${avgEV >= 0 ? "+" : ""}$${avgEV.toFixed(2)}`, color: avgEV >= 0 ? "text-green-400" : "text-red-400" },
    { label: "Top Ginther ×", value: topGinther > 0 ? topGinther.toFixed(1) : "N/A", color: topGinther >= 20 ? "text-red-400" : accent },
  ]

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
      {stats.map(s => (
        <div key={s.label} className={`rounded-lg border px-3 py-2 text-center ${buyCount > 0 && s.label.includes("BUY") ? bgAccent : "bg-gray-800 border-gray-700"}`}>
          <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
          <div className="text-xs text-gray-400">{s.label}</div>
        </div>
      ))}
    </div>
  )
}
