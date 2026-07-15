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

    // Ginther Ratio
    // CA: exact from "X of Y" prize counts  → totalPrizes / unclaimed
    // OR: estimated from % sold             → 1 / (1 - pctSold)
    //     Logic: if X prizes remain at Y% sold, game started with ~X/(1-Y) prizes
    //     Example: 1 prize left, 98% sold → started with ~50 prizes → 50x ratio
    let gintherRatio: number | null = null

    if (unclaimed !== null && unclaimed > 0) {
      if (totalPrizes !== null) {
        // California — exact
        gintherRatio = totalPrizes / unclaimed
      } else if (raw.pctSold < 0.9999) {
        // Oregon — estimated
        const estimatedTotal = unclaimed / (1 - raw.pctSold)
        gintherRatio = estimatedTotal / unclaimed // = 1 / (1 - pctSold)
      }
    }

    const signal = getSignal(ev, gintherRatio, unclaimed)

    return {
      name: raw.name,
      price: raw.price,
      topPrize: raw.topPrize,
      pctSold: raw.pctSold,
      printRun,
      ticketsLeft,
      ev,
      gintherRatio,
      unclaimed,
      signal,
      state,
    }
  })
}