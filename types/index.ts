export type StateCode = "oregon" | "california"

export interface Game {
  name: string
  price: number
  topPrize: number
  pctSold: number
  printRun: number
  ticketsLeft: number
  ev: number
  gintherRatio: number | null
  unclaimed: number | null
  signal: string
  state: StateCode
}

export interface HistorySnapshot {
  timestamp: string
  games: Game[]
}
