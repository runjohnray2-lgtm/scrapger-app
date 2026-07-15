import { Game } from "@/types"

export type StateCode = "oregon" | "california"

const OR_PRINT_RUNS: Record<number, number> = {
  1: 1_200_000,
  2: 1_500_000,
  3: 1_200_000,
  5: 1_000_000,
  10: 800_000,
  20: 500_000,
  25: 200_000,
  30: 400_000,
}

const CA_PRINT_RUNS: Record<number, number> = {
  1: 12_000_000,
  2: 15_000_000,
  3: 12_000_000,
  5: 10_000_000,
  10: 8_000_000,
  20: 5_000_000,
  25: 2_000_000,
  30: 4_000_000,
  40: 2_000_000,
}

export interface RawGame {
  name: string
  price: number
  topPrize: number
  pctSold: number
  unclaimed?: number | null
  totalPrizes?: number | null
  printRunOverride?: number | null
  gameUrl?: string | null
}

function getPrintRun(price: number, state: StateCode): number {
  const table = state === "california" ? CA_PRINT_RUNS : OR_PRINT_RUNS
  return table[price] ?? (state === "california" ? 5_000_000 : 500_000)
}

function getSignal(
  ev: number,
  gintherRatio: number | null,
  unclaimed: number | null
): string {
  if (unclaimed === 0) return "DEAD"
  if (gintherRatio !== null && gintherRatio >= 20 && ev > -0.30) return "GINTHER BUY"
  if (ev >= 0) return "BUY"
  if (gintherRatio !== null && gintherRatio >= 5) return "WATCH"
  return "HOLD"
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

// Tickets needed to reach a target win probability, given per-ticket odds p,
// using P(win at least once) = 1 - (1 - p)^n  =>  n = ln(1 - target) / ln(1 - p)
function ticketsForPct(targetPct: number, p: number): number {
  if (p <= 0 || p >= 1) return 0
  return Math.log(1 - targetPct) / Math.log(1 - p)
}

export function calculateEV(
  price: number,
  topPrize: number,
  pctSold: number,
  printRun: number
): number {
  const ticketsLeft = Math.round(printRun * (1 - pctSold))
  if (ticketsLeft <= 0) return -price
  const smallPrizesEV = price * 0.45
  const jackpotEV = topPrize / ticketsLeft
  return jackpotEV + smallPrizesEV - price
}

export function processGames(
  rawGames: RawGame[],
  state: StateCode = "oregon"
): Game[] {
  return rawGames.map(raw => {
    const printRun = raw.printRunOverride ?? getPrintRun(raw.price, state)
    const ticketsLeft = Math.round(printRun * (1 - raw.pctSold))
    const ev = calculateEV(raw.price, raw.topPrize, raw.pctSold, printRun)

    const unclaimed = raw.unclaimed ?? null
    const totalPrizes = raw.totalPrizes ?? null

    let gintherRatio: number | null = null

    if (unclaimed !== null && unclaimed > 0) {
      if (totalPrizes !== null) {
        gintherRatio = totalPrizes / unclaimed
      } else if (raw.pctSold < 0.9999) {
        const estimatedTotal = unclaimed / (1 - raw.pctSold)
        gintherRatio = estimatedTotal / unclaimed
      }
    }

    const signal = getSignal(ev, gintherRatio, unclaimed)

    const oddsPerTicket =
      unclaimed !== null && unclaimed > 0 && ticketsLeft > 0
        ? unclaimed / ticketsLeft
        : 0

    const currentTopPrizeOdds =
      oddsPerTicket > 0
        ? `1 in ${Math.round(1 / oddsPerTicket).toLocaleString()}`
        : "N/A"

    const costFor1PctShot =
      oddsPerTicket > 0 ? Math.round(ticketsForPct(0.01, oddsPerTicket) * raw.price) : 0
    const costFor5PctShot =
      oddsPerTicket > 0 ? Math.round(ticketsForPct(0.05, oddsPerTicket) * raw.price) : 0
    const costFor10PctShot =
      oddsPerTicket > 0 ? Math.round(ticketsForPct(0.10, oddsPerTicket) * raw.price) : 0

    let buyGuide: string
    if (unclaimed === 0) {
      buyGuide = "No top prizes remain unclaimed — skip this game."
    } else if (signal === "GINTHER BUY") {
      buyGuide = `Strong signal: Ginther Ratio ${gintherRatio?.toFixed(1)}x with positive EV. For a 5% shot at the top prize, budget ~$${costFor5PctShot.toLocaleString()}. Still a gamble, not an investment.`
    } else if (oddsPerTicket > 0) {
      buyGuide = `For a 5% shot at the top prize, budget ~$${costFor5PctShot.toLocaleString()}. Treat as entertainment, not investment.`
    } else {
      buyGuide = "Not enough data to size a budget for this game yet."
    }

    const isLimitedPrize =
      (totalPrizes !== null && totalPrizes <= 20) ||
      (unclaimed !== null && unclaimed <= 2)

    return {
      name: raw.name,
      price: raw.price,
      topPrize: raw.topPrize,
      pctSold: raw.pctSold,
      printRun,
      ticketsLeft,
      ev,
      evScore: ev,
      gintherRatio,
      unclaimed,
      signal,
      state,
      gameNum: `${state}-${slugify(raw.name)}`,
      gameUrl: raw.gameUrl ?? "",
      oddsPerTicket,
      currentTopPrizeOdds,
      costFor1PctShot,
      costFor5PctShot,
      costFor10PctShot,
      buyGuide,
      isLimitedPrize,
    }
  })
}
