"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HistorySnapshot, Game } from "@/types"
import { StateCode } from "@/lib/ev-calculator"

interface TrendChartProps {
  state?: StateCode
}

interface ChartPoint {
  date: string
  buyCount: number
  avgEV: number
  topGinther: number
}

export function TrendChart({ state = "oregon" }: TrendChartProps) {
  const [data, setData] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setData([])
    fetch(`/api/history?state=${state}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const points: ChartPoint[] = (d.history as HistorySnapshot[]).map(snap => {
            const games = snap.games as Game[]
            const buyCount = games.filter(g => g.signal === "BUY" || g.signal === "GINTHER BUY").length
            const avgEV = games.length ? +(games.reduce((s, g) => s + g.ev, 0) / games.length).toFixed(2) : 0
            const topGinther = +games.reduce((best, g) => Math.max(best, g.gintherRatio ?? 0), 0).toFixed(1)
            return {
              date: new Date(snap.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              buyCount,
              avgEV,
              topGinther,
            }
          })
          setData(points)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [state])

  if (loading) return <div className="text-gray-500 text-sm py-4">Loading trend data…</div>
  if (data.length < 2) return <div className="text-gray-500 text-sm py-4">Not enough snapshots yet for trend chart. Run scrape a few times to build history.</div>

  const isCA = state === "california"

  return (
    <Card className="bg-gray-900 border-gray-700 mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm">
          {isCA ? "🌴 California" : "🌲 Oregon"} EV Trend Over Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
            <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8 }} labelStyle={{ color: "#fff" }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="buyCount" stroke={isCA ? "#eab308" : "#22c55e"} name="BUY signals" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="topGinther" stroke="#f87171" name="Top Ginther ×" dot={false} strokeWidth={1.5} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
