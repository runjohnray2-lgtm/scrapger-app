"use client"

import { useState, useMemo } from "react"
import { Game } from "@/types"
import { cn } from "@/lib/utils"
import { ExternalLink, ChevronDown, ChevronUp, Filter } from "lucide-react"

interface GamesTableProps {
  games: Game[]
}

type FilterType = "ALL" | "BUY" | "WATCH" | "SKIP" | "DEAD"
type SortKey = "ginther" | "ev" | "price" | "sold" | "unclaimed"

function getSignalBadge(signal: string) {
  if (signal.includes("GINTHER BUY"))
    return "bg-green-500 text-black font-bold text-xs px-2 py-0.5 rounded-full animate-pulse"
  if (signal.includes("BUY"))
    return "bg-green-500/20 text-green-400 border border-green-500/40 text-xs px-2 py-0.5 rounded-full"
  if (signal.includes("WATCH"))
    return "bg-orange-500/20 text-orange-400 border border-orange-500/40 text-xs px-2 py-0.5 rounded-full"
  if (signal.includes("MONITOR"))
    return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 text-xs px-2 py-0.5 rounded-full"
  if (signal.includes("DEAD"))
    return "bg-gray-700/50 text-gray-500 border border-gray-700 text-xs px-2 py-0.5 rounded-full"
  return "bg-red-500/20 text-red-400 border border-red-500/40 text-xs px-2 py-0.5 rounded-full"
}

function getSignalLabel(signal: string): string {
  if (signal.includes("GINTHER BUY")) return "🔥 GINTHER BUY"
  if (signal.includes("BUY")) return "🟢 BUY"
  if (signal.includes("WATCH")) return "🟠 WATCH"
  if (signal.includes("MONITOR")) return "🟡 MONITOR"
  if (signal.includes("DEAD")) return "💀 DEAD"
  return "🔴 SKIP"
}

function getGintherStyle(ratio: number | null): string {
  if (!ratio) return "text-gray-600"
  if (ratio >= 50) return "text-green-400 font-black text-lg"
  if (ratio >= 20) return "text-green-400 font-bold"
  if (ratio >= 10) return "text-emerald-400 font-semibold"
  if (ratio >= 5)  return "text-orange-400 font-semibold"
  if (ratio >= 2)  return "text-yellow-400"
  return "text-gray-500"
}

function getRowBg(signal: string): string {
  if (signal.includes("GINTHER BUY")) return "bg-green-950/30 border-l-2 border-l-green-500"
  if (signal.includes("BUY")) return "bg-green-950/20 border-l-2 border-l-green-700"
  if (signal.includes("WATCH")) return "bg-orange-950/20 border-l-2 border-l-orange-700"
  if (signal.includes("MONITOR")) return "bg-yellow-950/10 border-l-2 border-l-yellow-800"
  if (signal.includes("DEAD")) return "opacity-40"
  return ""
}

export function GamesTable({ games }: GamesTableProps) {
  const [filter, setFilter] = useState<FilterType>("ALL")
  const [sortKey, setSortKey] = useState<SortKey>("ginther")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const filters: { label: string; value: FilterType; count: number }[] = [
    { label: "All", value: "ALL", count: games.length },
    {
      label: "🟢 BUY",
      value: "BUY",
      count: games.filter((g) => g.signal.includes("BUY")).length,
    },
    {
      label: "🟠 Watch",
      value: "WATCH",
      count: games.filter((g) => g.signal.includes("WATCH") || g.signal.includes("MONITOR"))
        .length,
    },
    {
      label: "🔴 Skip",
      value: "SKIP",
      count: games.filter((g) => g.signal.includes("SKIP")).length,
    },
    {
      label: "💀 Dead",
      value: "DEAD",
      count: games.filter((g) => g.signal.includes("DEAD")).length,
    },
  ]

  const filtered = useMemo(() => {
    let result = games
    if (filter === "BUY") result = games.filter((g) => g.signal.includes("BUY"))
    else if (filter === "WATCH")
      result = games.filter(
        (g) => g.signal.includes("WATCH") || g.signal.includes("MONITOR")
      )
    else if (filter === "SKIP") result = games.filter((g) => g.signal.includes("SKIP"))
    else if (filter === "DEAD") result = games.filter((g) => g.signal.includes("DEAD"))

    return [...result].sort((a, b) => {
      let aVal = 0
      let bVal = 0
      if (sortKey === "ginther") {
        aVal = a.gintherRatio ?? 0
        bVal = b.gintherRatio ?? 0
      } else if (sortKey === "ev") {
        aVal = a.evScore ?? -9999
        bVal = b.evScore ?? -9999
      } else if (sortKey === "price") {
        aVal = a.price
        bVal = b.price
      } else if (sortKey === "sold") {
        aVal = a.pctSold
        bVal = b.pctSold
      } else if (sortKey === "unclaimed") {
        aVal = a.unclaimed ?? 0
        bVal = b.unclaimed ?? 0
      }
      return sortDir === "desc" ? bVal - aVal : aVal - bVal
    })
  }, [games, filter, sortKey, sortDir])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc")
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronDown className="h-3 w-3 text-gray-600 inline ml-1" />
    return sortDir === "desc" ? (
      <ChevronDown className="h-3 w-3 text-blue-400 inline ml-1" />
    ) : (
      <ChevronUp className="h-3 w-3 text-blue-400 inline ml-1" />
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Filter bar */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-800 flex-wrap">
        <Filter className="h-4 w-4 text-gray-500 flex-shrink-0" />
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "px-3 py-1 rounded-full text-sm transition-colors",
              filter === f.value
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            )}
          >
            {f.label}
            <span className="ml-1.5 bg-gray-700 text-gray-300 text-xs px-1.5 py-0.5 rounded-full">
              {f.count}
            </span>
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-600">{filtered.length} games shown</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left">
              <th className="px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">
                Signal
              </th>
              <th className="px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">
                Game
              </th>
              <th
                className="px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider cursor-pointer hover:text-gray-300 select-none"
                onClick={() => handleSort("price")}
              >
                Price <SortIcon col="price" />
              </th>
              <th className="px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">
                Top Prize
              </th>
              <th
                className="px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider cursor-pointer hover:text-gray-300 select-none"
                onClick={() => handleSort("unclaimed")}
              >
                Unclaimed <SortIcon col="unclaimed" />
              </th>
              <th
                className="px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider cursor-pointer hover:text-gray-300 select-none"
                onClick={() => handleSort("sold")}
              >
                % Sold <SortIcon col="sold" />
              </th>
              <th
                className="px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider cursor-pointer hover:text-gray-300 select-none"
                onClick={() => handleSort("ginther")}
              >
                Ginther Ratio <SortIcon col="ginther" />
              </th>
              <th
                className="px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider cursor-pointer hover:text-gray-300 select-none"
                onClick={() => handleSort("ev")}
              >
                EV Score <SortIcon col="ev" />
              </th>
              <th className="px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">
                Odds
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {filtered.map((game, i) => (
              <tr
                key={`${game.gameNum}-${i}`}
                className={cn(
                  "hover:bg-gray-800/50 transition-colors",
                  getRowBg(game.signal)
                )}
              >
                {/* Signal */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={getSignalBadge(game.signal)}>
                    {getSignalLabel(game.signal)}
                  </span>
                </td>

                {/* Game Name */}
                <td className="px-4 py-3">
                  {game.gameUrl ? (
                    <a
                      href={game.gameUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-blue-400 font-medium flex items-center gap-1.5 transition-colors"
                    >
                      {game.name}
                      <ExternalLink className="h-3 w-3 text-gray-600 flex-shrink-0" />
                    </a>
                  ) : (
                    <span className="text-white font-medium">{game.name}</span>
                  )}
                  {game.isLimitedPrize && (
                    <span className="block text-xs text-gray-600 mt-0.5">limited-prize game</span>
                  )}
                </td>

                {/* Price */}
                <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                  ${game.price.toFixed(0)}
                </td>

                {/* Top Prize */}
                <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                  ${game.topPrize.toLocaleString()}
                </td>

                {/* Unclaimed */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={cn(
                      "font-semibold",
                      game.unclaimed === 0
                        ? "text-gray-600"
                        : game.unclaimed === 1
                        ? "text-yellow-400"
                        : "text-white"
                    )}
                  >
                    {(game.unclaimed ?? 0).toLocaleString()}
                  </span>
                </td>

                {/* % Sold */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-12 bg-gray-800 rounded-full h-1.5 flex-shrink-0">
                      <div
                        className={cn(
                          "h-1.5 rounded-full",
                          game.pctSold >= 0.9
                            ? "bg-green-500"
                            : game.pctSold >= 0.7
                            ? "bg-orange-500"
                            : "bg-gray-600"
                        )}
                        style={{ width: `${Math.round(game.pctSold * 100)}%` }}
                      />
                    </div>
                    <span className="text-gray-400 text-xs">
                      {Math.round(game.pctSold * 100)}%
                    </span>
                  </div>
                </td>

                {/* Ginther Ratio — THE KEY METRIC */}
                <td className="px-4 py-3 whitespace-nowrap">
                  {game.gintherRatio !== null ? (
                    <span className={getGintherStyle(game.gintherRatio)}>
                      {game.gintherRatio}x
                    </span>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </td>

                {/* EV Score */}
                <td className="px-4 py-3 whitespace-nowrap">
                  {game.evScore !== null ? (
                    <span
                      className={cn(
                        "font-mono text-xs",
                        game.evScore > 0 ? "text-green-400 font-bold" : "text-gray-500"
                      )}
                    >
                      {game.evScore > 0 ? "+" : ""}${game.evScore.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </td>

                {/* Current Odds */}
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {game.currentTopPrizeOdds}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-gray-600">No games match this filter.</div>
      )}
    </div>
  )
}
