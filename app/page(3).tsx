"use client"

import { useState, useEffect, useCallback } from "react"
import { ScrapeResult } from "@/types"
import { StatsBar } from "@/components/stats-bar"
import { GamesTable } from "@/components/games-table"
import { BudgetCalc } from "@/components/budget-calc"
import { RefreshCw, TrendingUp, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Home() {
  const [data, setData] = useState<ScrapeResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showExplainer, setShowExplainer] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/scrape", { cache: "no-store" })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="min-h-screen bg-gray-950">

      {/* â”€â”€ Header â”€â”€ */}
      <header className="sticky top-0 z-10 border-b border-gray-800 bg-gray-950/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 rounded-lg p-1.5 flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-black" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">SCRAPGER</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Oregon Lottery Â· EV + Ginther Analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {data && !loading && (
              <span className="text-xs text-gray-600 hidden md:block">
                Updated {new Date(data.scrapedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <button
              onClick={fetchData}
              disabled={loading}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                loading
                  ? "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
              )}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              {loading ? "Scrapingâ€¦" : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* â”€â”€ Explainer (collapsible) â”€â”€ */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowExplainer(!showExplainer)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800/30 transition-colors"
          >
            <span className="text-sm font-semibold text-yellow-400">
              ðŸ“– How to read this â€” Ginther Ratio, EV Score & what to actually buy
            </span>
            {showExplainer
              ? <ChevronUp className="h-4 w-4 text-gray-500 flex-shrink-0" />
              : <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
            }
          </button>

          {showExplainer && (
            <div className="px-4 pb-4 space-y-4 text-sm text-gray-300 border-t border-gray-800">

              <div className="grid sm:grid-cols-3 gap-4 mt-4">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-white font-bold mb-1">ðŸ”¢ Ginther Ratio</div>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    How much better your odds are TODAY vs. when the game first launched.
                    A <span className="text-white">25x</span> ratio means your odds of
                    hitting the top prize are <span className="text-green-400">25 times better</span> than
                    day one â€” because most tickets sold, but that winning ticket is still in the pile.
                    <br /><br />
                    <span className="text-yellow-400">5x+ = BUY signal. 20x+ = hot window.</span>
                  </p>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-white font-bold mb-1">ðŸ’° EV Score</div>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Expected Value â€” what you'd win (or lose) on average per ticket.
                    Almost all lottery tickets are negative EV by design.
                    A <span className="text-white">-$3.00 EV</span> on a $5 ticket = lose $3 on average.
                    <br /><br />
                    As Ginther Ratio rises, EV improves toward zero.
                    <span className="text-green-400"> Positive EV = statistically profitable.</span> Rare, but real.
                  </p>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-white font-bold mb-1">ðŸŽ¯ How Many to Buy</div>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Use the <span className="text-white">Budget Calculator</span> below.
                    Enter how much you want to spend, and it calculates:
                    how many tickets to buy, your exact % chance at the top prize,
                    and estimated minor-prize money back.
                    <br /><br />
                    <span className="text-yellow-400">Joan Ginther bought in bulk during high Ginther windows.</span>
                    Casual play = 5â€“10 tickets. Aggressive = 20â€“50.
                  </p>
                </div>
              </div>

              <div className="bg-blue-950/30 border border-blue-900/40 rounded-lg p-3 text-xs text-blue-300">
                <span className="font-semibold text-blue-200">Strategy in one sentence: </span>
                Instead of buying random tickets, put your scratch-off budget into the games
                with the highest Ginther Ratio â€” you're buying the same lottery ticket,
                just at the best possible statistical moment.
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-950/50 border border-red-900 rounded-xl p-4 text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Scrape failed</p>
              <p className="text-sm text-red-500 mt-1">{error}</p>
              <button onClick={fetchData} className="text-sm text-red-400 hover:text-red-300 underline mt-2">
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && !data && (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-gray-800" />
              <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold">Scraping Oregon Lotteryâ€¦</p>
              <p className="text-gray-500 text-sm mt-1">First load takes ~15 seconds (browser startup)</p>
            </div>
          </div>
        )}

        {/* Data */}
        {data && (
          <>
            <StatsBar data={data} />

            {/* Budget Calculator â€” most important section */}
            <div>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Budget Calculator â€” BUY Signal Games Only
              </h2>
              <BudgetCalc games={data.games} />
            </div>

            {/* Full table */}
            <div>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-600 rounded-full"></span>
                All Games â€” Ranked by Ginther Ratio
              </h2>
              <GamesTable games={data.games} />
            </div>

            <div className="text-center text-xs text-gray-700 pb-4 space-y-1">
              <p>Data from oregonlottery.org â€” refreshed every page load</p>
              <p>EV and probability calculations are estimates. Play responsibly. 18+.</p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}