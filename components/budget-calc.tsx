"use client"

import { useState, useMemo } from "react"
import { Game } from "@/types"
import { DollarSign, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface BudgetCalcProps {
  games: Game[]
}

export function BudgetCalc({ games }: BudgetCalcProps) {
  const [budget, setBudget] = useState(50)

  const buyGames = games.filter(
    (g) => g.signal.includes("BUY") && g.unclaimed > 0 && g.oddsPerTicket > 0
  )

  const results = useMemo(() => {
    return buyGames.map((g) => {
      const tickets = Math.floor(budget / g.price)
      if (tickets === 0) return null

      // P(win at least once) = 1 - (1 - p)^n
      const pWin = 1 - Math.pow(1 - g.oddsPerTicket, tickets)
      const pWinPct = (pWin * 100).toFixed(3)

      // Expected spend after minor prize returns (~37% back)
      const minorReturn = tickets * g.price * 0.37
      const netCost = budget - minorReturn

      return {
        game: g,
        tickets,
        spend: tickets * g.price,
        pWinPct,
        pWinRaw: pWin,
        minorReturn: Math.round(minorReturn),
        netCost: Math.round(netCost),
      }
    }).filter(Boolean)
  }, [buyGames, budget])

  if (buyGames.length === 0) return null

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-500" />
          <h2 className="text-sm font-semibold text-white">Budget Calculator</h2>
          <span className="text-xs text-gray-500">â€” how many to buy & what are your chances</span>
        </div>
      </div>

      {/* Budget slider */}
      <div className="p-4 border-b border-gray-800 bg-gray-950/30">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 w-28 flex-shrink-0">Your budget:</span>
          <input
            type="range"
            min={5}
            max={500}
            step={5}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="flex-1 accent-green-500"
          />
          <div className="flex items-center gap-1 w-24 flex-shrink-0">
            <span className="text-gray-500 text-sm">$</span>
            <input
              type="number"
              min={1}
              max={10000}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value) || 1)}
              className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white text-right"
            />
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-2 ml-32">
          Drag the slider or type any amount. Results update instantly.
        </p>
      </div>

      {/* Results */}
      <div className="divide-y divide-gray-800/50">
        {results.length === 0 ? (
          <div className="p-4 text-sm text-gray-500 text-center">
            Increase your budget â€” some tickets cost more than ${budget}.
          </div>
        ) : (
          results.map((r) => {
            if (!r) return null
            const { game: g, tickets, pWinPct, pWinRaw, minorReturn, netCost } = r
            const isGood = pWinRaw > 0.01 // >1% chance

            return (
              <div key={g.gameNum} className="p-4 hover:bg-gray-800/30 transition-colors">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <div>
                    <a
                      href={g.gameUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white font-semibold hover:text-blue-400 transition-colors"
                    >
                      {g.name}
                    </a>
                    <div className="text-xs text-gray-500 mt-0.5">
                      ${g.price}/ticket Â· Top prize: ${g.topPrize.toLocaleString()} Â· Ginther: {g.gintherRatio}x
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div
                      className={cn(
                        "text-2xl font-black",
                        pWinRaw > 0.05
                          ? "text-green-400"
                          : pWinRaw > 0.01
                          ? "text-yellow-400"
                          : "text-gray-400"
                      )}
                    >
                      {pWinPct}%
                    </div>
                    <div className="text-xs text-gray-500">chance of top prize</div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                  <div className="bg-gray-800/60 rounded-lg p-2.5 text-center">
                    <div className="text-lg font-bold text-white">{tickets}</div>
                    <div className="text-xs text-gray-500">tickets to buy</div>
                  </div>
                  <div className="bg-gray-800/60 rounded-lg p-2.5 text-center">
                    <div className="text-lg font-bold text-white">${tickets * g.price}</div>
                    <div className="text-xs text-gray-500">total spend</div>
                  </div>
                  <div className="bg-gray-800/60 rounded-lg p-2.5 text-center">
                    <div className="text-lg font-bold text-green-400">~${minorReturn}</div>
                    <div className="text-xs text-gray-500">minor prizes back*</div>
                  </div>
                  <div className="bg-gray-800/60 rounded-lg p-2.5 text-center">
                    <div className="text-lg font-bold text-orange-400">~${netCost}</div>
                    <div className="text-xs text-gray-500">net cost</div>
                  </div>
                </div>

                {/* Current odds context */}
                <div className="mt-3 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                  <span>Current odds per ticket: <span className="text-gray-300">{g.currentTopPrizeOdds}</span></span>
                  <span>For 1% shot: <span className="text-gray-300">${g.costFor1PctShot.toLocaleString()}</span></span>
                  <span>For 5% shot: <span className="text-gray-300">${g.costFor5PctShot.toLocaleString()}</span></span>
                  <span>For 10% shot: <span className="text-gray-300">${g.costFor10PctShot.toLocaleString()}</span></span>
                </div>

                {/* Buy guide */}
                <div className="mt-2 text-xs bg-gray-800/40 rounded px-3 py-2 text-gray-300 border-l-2 border-green-700">
                  ðŸ’¡ {g.buyGuide}
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="px-4 py-3 bg-gray-950/30 border-t border-gray-800">
        <p className="text-xs text-gray-700">
          * Minor prize return is estimated at 37% of spend (industry average for small wins $2â€“$20).
          Top prize % is calculated as P(at least 1 win) = 1 âˆ’ (1 âˆ’ odds)^tickets.
          This is not gambling advice. Play responsibly.
        </p>
      </div>
    </div>
  )
}