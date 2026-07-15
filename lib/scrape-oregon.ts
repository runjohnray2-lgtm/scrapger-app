export interface ORRawGame {
  name: string
  price: number
  topPrize: number
  pctSold: number
  unclaimed: number | null
}

interface OLGame {
  GameNumber: string
  GameNameTitle: string
  TicketPrice: number
  TopPrize: number
  TopPrizesRemaining: number
  SellThroughRate: number
  DateAvailable: string
  GameEndDate: string | null
  ValidationEndDate: string | null
  PlayStyle: string
}

interface OLResponse {
  InstantGames: OLGame[]
  NextItems: number
}

function unscramble(encoded: string, chunkSize = 4, shift = 3): string {
  let decoded = ""
  for (const char of encoded) {
    const code = char.charCodeAt(0)
    if (char >= "a" && char <= "z") {
      decoded += String.fromCharCode(((code - 97 - shift + 26) % 26) + 97)
    } else if (char >= "A" && char <= "Z") {
      decoded += String.fromCharCode(((code - 65 - shift + 26) % 26) + 65)
    } else {
      decoded += char
    }
  }
  const chunks: string[] = []
  for (let i = 0; i < decoded.length; i += chunkSize) {
    chunks.push(decoded.slice(i, i + chunkSize))
  }
  chunks.reverse()
  return chunks.join("")
}

const CLIENT_ID = unscramble("27i2d9i356h5dhd74i87898he1e3d007")
const CLIENT_SECRET = unscramble("7h92G9g5784de2604H2017Hh94f309G1")
const API_BASE = "https://api.oregonlottery.org/gameinfo/v1/instant/games"

async function fetchPage(offset: number, count = 200): Promise<OLResponse | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${API_BASE}?count=${count}&offset=${offset}`, {
      headers: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      },
      next: { revalidate: 0 },
    })

    if (res.ok) {
      return (await res.json()) as OLResponse
    }

    if (res.status === 502 || res.status === 503) {
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
        continue
      }
      console.warn(`OR Lottery API: ${res.status} at offset=${offset} — giving up after retries`)
      return null
    }

    throw new Error(`OR Lottery API HTTP ${res.status} at offset=${offset}`)
  }
  return null
}

function isActive(g: OLGame): boolean {
  const now = new Date()
  if (!g.GameNameTitle) return false
  if (g.DateAvailable && new Date(g.DateAvailable) > now) return false
  if (g.GameEndDate && new Date(g.GameEndDate) < now) return false
  return true
}

function toRaw(g: OLGame): ORRawGame {
  return {
    name: g.GameNameTitle,
    price: g.TicketPrice,
    topPrize: g.TopPrize,
    pctSold: Math.min(g.SellThroughRate / 100, 1),
    unclaimed: g.TopPrizesRemaining ?? null,
  }
}

export async function scrapeOregonLottery(): Promise<ORRawGame[]> {
  const seen = new Set<string>()
  const allGames: OLGame[] = []
  const count = 200
  let offset = 0

  while (true) {
    const page = await fetchPage(offset, count)
    if (!page || page.InstantGames.length === 0) break

    for (const g of page.InstantGames) {
      if (!seen.has(g.GameNumber)) {
        seen.add(g.GameNumber)
        allGames.push(g)
      }
    }

    if (!page.NextItems || page.NextItems <= 0) break
    offset += count
  }

  return allGames.filter(isActive).map(toRaw)
}