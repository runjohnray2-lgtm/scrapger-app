"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, TrendingUp, AlertCircle, Loader2, ExternalLink } from "lucide-react"
import { Game } from "@/types"
import { StateCode } from "@/lib/ev-calculator"
import { StatsBar } from "@/components/stats-bar"
import { TrendChart } from "@/components/trend-chart"
import { LocalStrategy } from "@/components/local-strategy"
import { AlertSettings } from "@/components/alert-settings"

const STATE_CONFIG: Record<StateCode, {
  label: string; flag: string; emoji: string
  apiPath: string; subtitle: string
  loadingMsg: string; footerNote: string
  tabColor: string; borderColor: string
  siteUrl: string; siteName: string
}> = {
  oregon: {
    label: "Oregon", flag: "OR", emoji: "🌲",
    apiPath: "/api/scrape/oregon",
    subtitle: "Brookings / Curry County",
    loadingMsg: "Scraping oregonlottery.org…",
    footerNote: "Oregon Lottery data — refreshed on demand. Retailers in Brookings: Fred Meyer, Safeway.",
    tabColor: "text-green-400", borderColor: "border-green-700",
    siteUrl: "https://www.oregonlottery.org/games/scratch-its/top-prizes",
    siteName: "oregonlottery.org",
  },
  california: {
    label: "California", flag: "CA", emoji: "🌴",
    apiPath: "/api/scrape/california",
    subtitle: "Crescent City (~25 mi south)",
    loadingMsg: "Scraping calottery.com… (takes ~10s)",
    footerNote: "California Lottery — Crescent City stores: Safeway, Walmart, Rite Aid. Use calottery.com/where-to-play.",
    tabColor: "text-yellow-400", borderColor: "border-yellow-700",
    siteUrl: "https://www.calottery.com/scratchers/top-prizes-remaining",
    siteName: "calottery.com",
  },
}

const SIGNAL_STYLES: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  "GINTHER BUY": { bg: "bg-red-900/30",    border: "border-red-600",    text: "text-red-300",    badge: "bg-red-600" },
  "BUY":         { bg: "bg-green-900/20",  border: "border-green-700",  text: "text-green-300",  badge: "bg-green-600" },
  "WATCH":       { bg: "bg-yellow-900/10", border: "border-yellow-800", text: "text-yellow-300", badge: "bg-yellow-600" },
  "DEAD":        { bg: "bg-gray-800",      border: "border-gray-700",   text: "text-gray-500",   badge: "bg-gray-600" },
  "HOLD":        { bg: "bg-gray-900",      border: "border-gray-800",   text: "text-gray-400",   badge: "bg-gray-700" },
}

function GameCard({ game }: { game: Game }) {
  const styles = SIGNAL_STYLES[game.signal] ?? SIGNAL_STYLES["HOLD"]
  return (
    <div className={`rounded-lg border p-3 ${styles.bg} ${styles.border}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-medium text-sm truncate">{game.name}</span>
            <Badge className={`text-white text-[10px] px-1.5 py-0 ${styles.badge}`}>{game.signal}</Badge>
          </div>
          <div className="text-gray-400 text-xs mt-1 space-x-2">
            <span>${game.price} ticket</span>
            <span>·</span>
            <span>Top: ${game.topPrize.toLocaleString()}</span>
            {game.unclaimed !== null && (
              <><span>·</span><span>{game.unclaimed} prizes left</span></>
            )}
            <span>·</span>
            <span>{Math.round((1 - game.pctSold) * 100)}% remaining</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-base font-bold ${game.ev >= 0 ? "text-green-400" : styles.text}`}>
            EV {game.ev >= 0 ? "+" : ""}${game.ev.toFixed(2)}
          </div>
          {game.gintherRatio !== null && (
            <div className={`text-xs ${game.gintherRatio >= 20 ? "text-red-400 font-bold" : "text-gray-400"}`}>
              Ginther {game.gintherRatio.toFixed(1)}×
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [activeState, setActiveState] = useState<StateCode>("oregon")
  const [dataByState, setDataByState] = useState<Partial<Record<StateCode, { games: Game[]; timestamp: string }>>>({})
  const [loadingState, setLoadingState] = useState<StateCode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "buy" | "watch">("all")

  const cfg = STATE_CONFIG[activeState]

  async function scrape(state: StateCode) {
    setLoadingState(state)
    setError(null)
    try {
      const res = await fetch(STATE_CONFIG[state].apiPath)
      const data = await res.json()
      if (data.success) {
        setDataByState(prev => ({ ...prev, [state]: { games: data.games, timestamp: data.timestamp } }))
      } else {
        setError(data.error ?? "Scrape failed — try again")
      }
    } catch (e) {
      setError(`Network error: ${String(e)}`)
    } finally {
      setLoadingState(null)
    }
  }

  const current = dataByState[activeState]
  const isLoading = loadingState === activeState

  let displayGames: Game[] = current?.games ?? []
  if (filter === "buy") displayGames = displayGames.filter(g => g.signal === "BUY" || g.signal === "GINTHER BUY")
  if (filter === "watch") displayGames = displayGames.filter(g => g.signal === "WATCH")

  const buyCount = (state: StateCode) => {
    const d = dataByState[state]
    return d ? d.games.filter(g => g.signal === "BUY" || g.signal === "GINTHER BUY").length : 0
  }

  return (
    <main className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              🎰 SCRAPGER
              <Badge className="bg-blue-700 text-white text-xs">BETA</Badge>
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">Scratch-off EV + Ginther Ratio Analysis · {cfg.subtitle}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => scrape(activeState)}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />{cfg.loadingMsg}</>
              ) : (
                <><RefreshCw className="h-4 w-4 mr-1.5" />Scrape {cfg.flag}</>
              )}
            </Button>
            <a href={cfg.siteUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200">
              <ExternalLink className="h-3.5 w-3.5" />{cfg.siteName}
            </a>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* State Tabs */}
        <Tabs value={activeState} onValueChange={v => setActiveState(v as StateCode)}>
          <TabsList className="bg-gray-800 border border-gray-700">
            {(["oregon", "california"] as StateCode[]).map(state => {
              const s = STATE_CONFIG[state]
              const bc = buyCount(state)
              return (
                <TabsTrigger key={state} value={state} className={`${s.tabColor} data-[state=active]:bg-gray-700`}>
                  {s.emoji} {s.label}
                  {bc > 0 && (
                    <Badge className="ml-1.5 bg-green-600 text-white text-[10px] px-1 py-0">{bc}</Badge>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {(["oregon", "california"] as StateCode[]).map(state => (
            <TabsContent key={state} value={state} className="mt-4 space-y-4">
              {dataByState[state] ? (
                <>
                  {/* Stats */}
                  <StatsBar games={dataByState[state]!.games} state={state} />

                  {/* Strategy panel */}
                  <LocalStrategy games={dataByState[state]!.games} state={state} />

                  {/* Trend chart */}
                  <TrendChart state={state} />

                  {/* Filter bar */}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">Filter:</span>
                    {(["all", "buy", "watch"] as const).map(f => (
                      <Button
                        key={f}
                        size="sm"
                        variant={filter === f ? "default" : "outline"}
                        onClick={() => setFilter(f)}
                        className={`text-xs px-2 py-1 h-7 ${filter === f ? "bg-blue-600" : "border-gray-700 text-gray-400"}`}
                      >
                        {f === "all" ? "All Games" : f === "buy" ? "🟢 BUY" : "👀 WATCH"}
                      </Button>
                    ))}
                    <span className="text-gray-500 text-xs ml-auto">
                      {displayGames.length} games · Last scraped {dataByState[state]?.timestamp
                        ? new Date(dataByState[state]!.timestamp).toLocaleTimeString()
                        : "—"}
                    </span>
                  </div>

                  {/* Game list */}
                  <div className="space-y-2">
                    {displayGames.length === 0 ? (
                      <div className="text-gray-500 text-sm text-center py-6">No games match this filter.</div>
                    ) : (
                      displayGames.map((g, i) => <GameCard key={`${g.name}-${i}`} game={g} />)
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-16 text-gray-500 space-y-3">
                  <div className="text-4xl">{STATE_CONFIG[state].emoji}</div>
                  <div className="text-lg font-medium text-gray-400">No {STATE_CONFIG[state].label} data yet</div>
                  <p className="text-sm max-w-sm mx-auto">
                    {state === "california"
                      ? "Click \"Scrape CA\" to pull live prize data from calottery.com. Nearest store: Crescent City (~25 mi south)."
                      : "Click \"Scrape OR\" to pull live prize data from oregonlottery.org."}
                  </p>
                  <Button
                    onClick={() => scrape(state)}
                    disabled={loadingState === state}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loadingState === state ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading…</>
                    ) : (
                      <><RefreshCw className="h-4 w-4 mr-2" />Scrape {STATE_CONFIG[state].flag} Now</>
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Alert Settings */}
        <AlertSettings />

        {/* Footer */}
        <div className="text-center text-xs text-gray-600 pb-4 space-y-1">
          <div>{cfg.footerNote}</div>
          <div>Lottery outcomes are random. EV analysis is mathematical only. Play responsibly. Set a budget. Stick to it.</div>
        </div>
      </div>
    </main>
  )
}
