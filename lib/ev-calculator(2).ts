import { Game } from "@/types"

interface RawGame {
  gameNum: string
  name: string
  gameUrl: string
  price: number
  topPrize: number
  unclaimed: number
  pctSold: number
}

interface EVResult {
  evScore: number | null
  gintherRatio: number | null
  currentTopPrizeOdds: string
  remainingTicketsEst: number
  signal: string
  gameType: string
  isLimitedPrize: boolean
}

// Estimated print runs per price point (Oregon — medium-small state, 4.2M pop)
const PRINT_RUNS: Record<number, number> = {
  1: 1_500_000,
  2: 2_500_000,
  3: 2_000_000,
  5: 1_800_000,
  10: 1_200_000,
  20: 900_000,
  30: 600_000,
  50: 400_000,
}

function getPrintRun(price: number): number {
  return PRINT_RUNS[Math.floor(price)] ?? 1_200_000
}

function getSignalRank(signal: string): number {
  if (signal.includes("GINTHER BUY")) return 0
  if (signal.includes("BUY")) return 1
  if (signal.includes("WATCH")) return 2
  if (signal.includes("MONITOR")) return 3
  if (signal.includes("SKIP")) return 4
  if (signal.includes("DEAD")) return 9
  return 5
}

export function calculateEV(game: RawGame): EVResult {
  const totalTickets = getPrintRun(game.price)
  const pctRemaining = Math.max(1.0 - game.pctSold, 0.001)
  const remainingTickets = totalTickets * pctRemaining

  // Limited-prize games: small top prize, many unclaimed (e.g. "$100 or $200 Limited")
  const isLimitedPrize = game.topPrize <= 500 && game.unclaimed > 100

  if (remainingTickets <= 0 || game.topPrize === 0) {
    return {
      evScore: null,
      gintherRatio: null,
      currentTopPrizeOdds: "N/A",
      remainingTicketsEst: 0,
      signal: "UNKNOWN",
      gameType: "unknown",
      isLimitedPrize: false,
    }
  }

  const currentProb = game.unclaimed > 0 ? game.unclaimed / remainingTickets : 0
  const baselineProb = Math.max(game.unclaimed, 1) / totalTickets

  // Ginther Ratio: how much better are your odds NOW vs when the game launched?
  // >1 = improving. >5 = serious Ginther window. >20 = hot zone.
  const gintherRatio = baselineProb > 0 ? currentProb / baselineProb : 1.0

  // EV calculation
  const minorPrizeReturn = game.price * 0.37 // industry avg ~37% returned in small prizes
  let evScore: number
  let gameType: string

  if (isLimitedPrize) {
    evScore = currentProb * game.topPrize - game.price
    gameType = "limited-prize"
  } else {
    evScore = currentProb * game.topPrize + minorPrizeReturn - game.price
    gameType = "jackpot"
  }

  // Signal
  let signal: string
  if (isLimitedPrize) {
    if (evScore > 0) signal = "🟢 BUY"
    else if (evScore > -game.price * 0.2) signal = "🟡 WATCH"
    else signal = "🔴 SKIP"
  } else if (evScore > 0) {
    signal = "🔥 GINTHER BUY"
  } else if (gintherRatio >= 5.0 && game.unclaimed > 0) {
    signal = "🟢 BUY"
  } else if (gintherRatio >= 3.0 && game.unclaimed > 0) {
    signal = "🟠 WATCH"
  } else if (gintherRatio >= 2.0 && game.unclaimed > 0) {
    signal = "🟡 MONITOR"
  } else if (game.unclaimed === 0) {
    signal = "💀 DEAD"
  } else {
    signal = "🔴 SKIP"
  }

  const oddsDisplay =
    game.unclaimed > 0
      ? `1 in ${Math.floor(remainingTickets / game.unclaimed).toLocaleString()}`
      : "No prizes left"

  return {
    evScore: Math.round(evScore * 100) / 100,
    gintherRatio: Math.round(gintherRatio * 10) / 10,
    currentTopPrizeOdds: oddsDisplay,
    remainingTicketsEst: Math.floor(remainingTickets),
    signal,
    gameType,
    isLimitedPrize,
  }
}

export function processGames(rawGames: RawGame[]): Game[] {
  const games: Game[] = rawGames.map((raw) => ({
    ...raw,
    ...calculateEV(raw),
    scrapedAt: new Date().toISOString(),
  }))

  games.sort((a, b) => {
    const ra = getSignalRank(a.signal)
    const rb = getSignalRank(b.signal)
    if (ra !== rb) return ra - rb
    return (b.gintherRatio ?? 0) - (a.gintherRatio ?? 0)
  })

  return games
}
