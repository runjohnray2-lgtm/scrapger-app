export type StateCode = "oregon" | "california"

export interface Game {
  name: string
  price: number
  topPrize: number
  pctSold: number
  printRun: number
  ticketsLeft: number
  ev: number
  evScore: number
  gintherRatio: number | null
  unclaimed: number | null
  signal: string
  state: StateCode
  gameNum: string
  gameUrl: string
  oddsPerTicket: number
  currentTopPrizeOdds: string
  costFor1PctShot: number
  costFor5PctShot: number
  costFor10PctShot: number
  buyGuide: string
  isLimitedPrize: boolean
}

export interface HistorySnapshot {
  timestamp: string
  games: Game[]
}
