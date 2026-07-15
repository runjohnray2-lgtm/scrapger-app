export interface Game {
  gameNum: string
  name: string
  gameUrl: string
  price: number
  topPrize: number
  unclaimed: number
  pctSold: number
  evScore: number | null
  gintherRatio: number | null
  currentTopPrizeOdds: string
  remainingTicketsEst: number
  signal: string
  gameType: string
  isLimitedPrize: boolean
  scrapedAt: string
}

export interface ScrapeResult {
  scrapedAt: string
  totalGames: number
  buySignals: number
  watchSignals: number
  deadGames: number
  games: Game[]
  error?: string
}
