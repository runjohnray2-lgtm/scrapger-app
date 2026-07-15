"use client"

import { Game } from "@/types"
import { StateCode } from "@/lib/ev-calculator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface LocalStrategyProps {
  games: Game[]
  state?: StateCode
}

export function LocalStrategy({ games, state = "oregon" }: LocalStrategyProps) {
  const buyGames = games
    .filter(g => g.signal === "BUY" || g.signal === "GINTHER BUY")
    .sort((a, b) => (b.gintherRatio ?? 0) - (a.gintherRatio ?? 0))

  const watchGames = games
    .filter(g => g.signal === "WATCH")
    .sort((a, b) => (b.gintherRatio ?? 0) - (a.gintherRatio ?? 0))
    .slice(0, 3)

  if (state === "california") {
    return (
      <Card className="bg-gray-900 border-yellow-800 mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-yellow-400 text-sm">🌴 California Strategy — Crescent City (~25 mi south)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {buyGames.length === 0 && watchGames.length === 0 ? (
            <div className="text-gray-400">No BUY or WATCH signals right now. Hold budget and check again tomorrow.</div>
          ) : (
            <>
              {buyGames.length > 0 && (
                <div>
                  <div className="text-green-400 font-semibold mb-1">🟢 BUY NOW — Worth the drive!</div>
                  {buyGames.map(g => (
                    <div key={g.name} className="flex items-center justify-between bg-green-900/20 border border-green-800 rounded p-2 mb-1">
                      <div>
                        <div className="text-white font-medium">{g.name}</div>
                        <div className="text-gray-400 text-xs">
                          ${g.price}/ticket · Ginther {g.gintherRatio?.toFixed(1) ?? "N/A"}× · {g.unclaimed} prizes left
                        </div>
                      </div>
                      <div className={`text-sm font-bold ${g.ev >= 0 ? "text-green-400" : "text-yellow-400"}`}>
                        EV {g.ev >= 0 ? "+" : ""}${g.ev.toFixed(2)}
                      </div>
                    </div>
                  ))}
                  <div className="text-gray-400 text-xs mt-1">
                    📍 Retailers: Safeway, Walmart, Rite Aid in Crescent City, CA. Use{" "}
                    <a href="https://www.calottery.com/where-to-play" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                      calottery.com/where-to-play
                    </a>{" "}
                    to find exact stores. Don&apos;t go past Crescent City — no additional edge further south.
                  </div>
                </div>
              )}
              {watchGames.length > 0 && (
                <div>
                  <div className="text-yellow-400 font-semibold mb-1">👀 WATCH — Not yet, but close</div>
                  {watchGames.map(g => (
                    <div key={g.name} className="flex items-center justify-between bg-yellow-900/10 border border-yellow-900 rounded p-2 mb-1">
                      <div>
                        <div className="text-white">{g.name}</div>
                        <div className="text-gray-400 text-xs">${g.price} · Ginther {g.gintherRatio?.toFixed(1) ?? "N/A"}× · {g.unclaimed} prizes left</div>
                      </div>
                      <div className="text-yellow-400 text-sm">EV ${g.ev.toFixed(2)}</div>
                    </div>
                  ))}
                  <div className="text-gray-500 text-xs mt-1">Check again tomorrow — these games are heating up.</div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  // Oregon strategy
  return (
    <Card className="bg-gray-900 border-green-900 mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-green-400 text-sm">🌲 Oregon Strategy — Brookings / Curry County</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {buyGames.length === 0 && watchGames.length === 0 ? (
          <div className="text-gray-400">No strong signals today. Hold budget. Check California — it may have better odds right now.</div>
        ) : (
          <>
            {buyGames.length > 0 && (
              <div>
                <div className="text-green-400 font-semibold mb-1">🟢 BUY NOW — Local action!</div>
                {buyGames.map(g => (
                  <div key={g.name} className="flex items-center justify-between bg-green-900/20 border border-green-800 rounded p-2 mb-1">
                    <div>
                      <div className="text-white font-medium">{g.name}</div>
                      <div className="text-gray-400 text-xs">${g.price}/ticket · {Math.round((1 - g.pctSold) * 100)}% remaining</div>
                    </div>
                    <div className={`text-sm font-bold ${g.ev >= 0 ? "text-green-400" : "text-yellow-400"}`}>
                      EV {g.ev >= 0 ? "+" : ""}${g.ev.toFixed(2)}
                    </div>
                  </div>
                ))}
                <div className="text-gray-400 text-xs mt-1">
                  📍 Try: Fred Meyer, Safeway, or any Oregon Lottery retailer in Brookings. Spread across 2–3 stores.
                </div>
              </div>
            )}
            {watchGames.length > 0 && (
              <div>
                <div className="text-yellow-400 font-semibold mb-1">👀 WATCH — Almost there</div>
                {watchGames.map(g => (
                  <div key={g.name} className="flex items-center justify-between bg-yellow-900/10 border border-yellow-900 rounded p-2 mb-1">
                    <div>
                      <div className="text-white">{g.name}</div>
                      <div className="text-gray-400 text-xs">${g.price} · {Math.round((1 - g.pctSold) * 100)}% remaining</div>
                    </div>
                    <div className="text-yellow-400 text-sm">EV ${g.ev.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
