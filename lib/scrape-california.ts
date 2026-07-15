export interface CARawGame {
  name: string
  price: number
  topPrize: number
  pctSold: number
  unclaimed: number | null
  totalPrizes: number | null
  printRunOverride: number | null
  gameUrl: string
}

interface CAListItem {
  GameName: string
  GameNumber: number
  GamePrice: string
  TopPrizeDollarAmt: string
  GameProductPage: string
}

interface CAListResponse {
  TotalScratcherCards: number
  TotalPages: number
  SerializedScratcherCardList: CAListItem[]
}

const LIST_API = "https://www.calottery.com/api/Sitecore/ScratchersFilteredList/GetScratchers"
const BASE = "https://www.calottery.com"

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&reg;/g, "®")
    .replace(/&rsquo;/g, "’")
    .replace(/&nbsp;/g, " ")
}

function parseMoney(s: string): number {
  return parseInt(s.replace(/[$,]/g, ""), 10) || 0
}

async function fetchGameList(): Promise<CAListItem[]> {
  const res = await fetch(`${LIST_API}?page=1&size=100&sortBy=newest`, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`CA Lottery list API HTTP ${res.status}`)
  const data: CAListResponse = await res.json()
  return data.SerializedScratcherCardList ?? []
}

interface TopTier {
  odds: number
  remaining: number
  total: number
}

async function fetchTopTier(productPage: string, attempt = 0): Promise<TopTier | null> {
  try {
    const res = await fetch(`${BASE}${productPage}`, {
      redirect: "follow",
      next: { revalidate: 0 },
      headers: { "User-Agent": "Mozilla/5.0" },
    })
    if (!res.ok) {
      if ((res.status === 502 || res.status === 503) && attempt < 2) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
        return fetchTopTier(productPage, attempt + 1)
      }
      console.warn(`CA Lottery page HTTP ${res.status} for ${productPage}`)
      return null
    }
    const html = await res.text()
    const rowRegex = /<td[^>]*>\$?([\d,]+)<\/td>\s*<td[^>]*>([\d,]+)<\/td>\s*<td[^>]*>\s*<span>([\d,]+)\s*<\/span>of\s*<span>([\d,]+)<\/span>/
    const match = html.match(rowRegex)
    if (!match) return null
    return {
      odds: parseInt(match[2].replace(/,/g, ""), 10),
      remaining: parseInt(match[3].replace(/,/g, ""), 10),
      total: parseInt(match[4].replace(/,/g, ""), 10),
    }
  } catch (err) {
    if (attempt < 2) {
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
      return fetchTopTier(productPage, attempt + 1)
    }
    console.warn(`CA Lottery fetch failed for ${productPage}:`, err)
    return null
  }
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let i = 0
  async function worker() {
    while (i < items.length) {
      const idx = i++
      results[idx] = await fn(items[idx])
    }
  }
  await Promise.all(Array.from({ length: limit }, worker))
  return results
}

export async function scrapeCaliforniaLottery(): Promise<CARawGame[]> {
  const list = await fetchGameList()

  const tiers = await mapWithConcurrency(list, 5, async item => {
    const tier = await fetchTopTier(item.GameProductPage)
    return { item, tier }
  })

  const games: CARawGame[] = []
  for (const { item, tier } of tiers) {
    const price = parseMoney(item.GamePrice)
    const topPrize = parseMoney(item.TopPrizeDollarAmt)
    if (!tier || tier.total === 0 || tier.odds === 0) {
      continue
    }
    const printRunOverride = tier.odds * tier.total
    const pctSold = 1 - tier.remaining / tier.total
    games.push({
      name: decodeEntities(item.GameName),
      price,
      topPrize,
      pctSold: Math.min(Math.max(pctSold, 0), 0.9999),
      unclaimed: tier.remaining,
      totalPrizes: tier.total,
      printRunOverride,
      gameUrl: `${BASE}${item.GameProductPage}`,
    })
  }

  return games
}
