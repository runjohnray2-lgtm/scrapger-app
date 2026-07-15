import { Game } from "@/types"
import { StateCode } from "@/lib/ev-calculator"
import { AlertConfig } from "@/lib/alert-config"
import { sendAlert, AlertGameCard, AlertPayload } from "@/lib/send-alert"
import { readHistory } from "@/lib/history"

interface AlertCheckResult {
  state: StateCode
  alertsSent: number
  triggers: string[]
  errors: string[]
}

function gameToCard(g: Game): AlertGameCard {
  return {
    name: g.name,
    price: g.price,
    ev: g.ev,
    gintherRatio: g.gintherRatio,
    signal: g.signal,
    unclaimed: g.unclaimed,
    pctSold: g.pctSold,
  }
}

function signalRank(signal: string): number {
  if (signal === "GINTHER BUY") return 4
  if (signal === "BUY") return 3
  if (signal === "WATCH") return 2
  if (signal === "DEAD") return 0
  return 1 // HOLD
}

export async function checkAlertsForState(
  currentGames: Game[],
  state: StateCode,
  config: AlertConfig,
  appUrl: string = "http://localhost:3002"
): Promise<AlertCheckResult> {
  const result: AlertCheckResult = { state, alertsSent: 0, triggers: [], errors: [] }

  // Load yesterday's snapshot
  const history = await readHistory(state)
  if (history.length < 2) {
    result.triggers.push("Not enough history for comparison (need 2+ snapshots)")
    return result
  }

  const yesterday = history[history.length - 2]
  const yesterdayGames = yesterday.games as Game[]

  // Build lookup maps
  const prevMap = new Map<string, Game>()
  for (const g of yesterdayGames) prevMap.set(g.name, g)

  const newBuyGames: AlertGameCard[] = []
  const peakGintherGames: AlertGameCard[] = []
  const lastPrizeGames: AlertGameCard[] = []
  const evPositiveGames: AlertGameCard[] = []
  const prizeClearedGames: AlertGameCard[] = []

  for (const game of currentGames) {
    const prev = prevMap.get(game.name)

    // --- New BUY signal (wasn't BUY before, is BUY now) ---
    if (config.thresholds.newBuySignal) {
      const wasNotBuy = !prev || signalRank(prev.signal) < 3
      const isNowBuy = signalRank(game.signal) >= 3
      if (wasNotBuy && isNowBuy) {
        newBuyGames.push(gameToCard(game))
      }
    }

    // --- Peak Ginther (crossed 20x threshold) ---
    if (config.thresholds.peakGinther) {
      const wasBelow = !prev || (prev.gintherRatio ?? 0) < 20
      const isAbove = (game.gintherRatio ?? 0) >= 20
      if (wasBelow && isAbove) {
        peakGintherGames.push(gameToCard(game))
      }
    }

    // --- Last Prize (unclaimed dropped to 1) ---
    if (config.thresholds.lastPrize) {
      const wasMore = !prev || (prev.unclaimed ?? 999) > 1
      const isNowOne = (game.unclaimed ?? 999) === 1
      if (wasMore && isNowOne) {
        lastPrizeGames.push(gameToCard(game))
      }
    }

    // --- EV went positive ---
    if (config.thresholds.evPositive) {
      const wasNeg = !prev || prev.ev <= 0
      const isPos = game.ev > 0
      if (wasNeg && isPos) {
        evPositiveGames.push(gameToCard(game))
      }
    }

    // --- Prize cleared (was BUY, now DEAD) ---
    if (config.thresholds.prizeCleared) {
      const wasBuy = prev && signalRank(prev.signal) >= 3
      const isDead = game.signal === "DEAD"
      if (wasBuy && isDead) {
        prizeClearedGames.push(gameToCard(game))
      }
    }
  }

  const stateLabel = state === "california" ? "🌴 California" : "🌲 Oregon"

  // Send new BUY signal alert
  if (newBuyGames.length > 0) {
    const payload: AlertPayload = {
      level: "buy",
      headline: `${newBuyGames.length} New BUY Signal${newBuyGames.length > 1 ? "s" : ""} — ${stateLabel}`,
      subline: `New games crossed the EV threshold in ${state === "california" ? "California" : "Oregon"}. Time to buy!`,
      games: newBuyGames,
      appUrl,
    }
    const r = await sendAlert(config, payload)
    result.alertsSent++
    result.triggers.push(`newBuySignal: ${newBuyGames.map(g => g.name).join(", ")}`)
    if (r.errors.length) result.errors.push(...r.errors)
  }

  // Send peak Ginther alert
  if (peakGintherGames.length > 0) {
    const payload: AlertPayload = {
      level: "peak",
      headline: `🔥 Peak Ginther Alert — ${stateLabel}`,
      subline: `Ginther Ratio crossed 20x — top prizes are disappearing fast!`,
      games: peakGintherGames,
      appUrl,
    }
    const r = await sendAlert(config, payload)
    result.alertsSent++
    result.triggers.push(`peakGinther: ${peakGintherGames.map(g => g.name).join(", ")}`)
    if (r.errors.length) result.errors.push(...r.errors)
  }

  // Send last prize alert
  if (lastPrizeGames.length > 0) {
    const payload: AlertPayload = {
      level: "peak",
      headline: `⚡ LAST TOP PRIZE Standing — ${stateLabel}`,
      subline: `Only 1 top prize remains unclaimed. This is the peak Ginther moment!`,
      games: lastPrizeGames,
      appUrl,
    }
    const r = await sendAlert(config, payload)
    result.alertsSent++
    result.triggers.push(`lastPrize: ${lastPrizeGames.map(g => g.name).join(", ")}`)
    if (r.errors.length) result.errors.push(...r.errors)
  }

  // Send EV positive alert
  if (evPositiveGames.length > 0) {
    const payload: AlertPayload = {
      level: "buy",
      headline: `📈 EV Flipped Positive — ${stateLabel}`,
      subline: `Expected value turned positive — mathematically favorable to buy!`,
      games: evPositiveGames,
      appUrl,
    }
    const r = await sendAlert(config, payload)
    result.alertsSent++
    result.triggers.push(`evPositive: ${evPositiveGames.map(g => g.name).join(", ")}`)
    if (r.errors.length) result.errors.push(...r.errors)
  }

  // Send prize cleared alert
  if (prizeClearedGames.length > 0) {
    const payload: AlertPayload = {
      level: "dead",
      headline: `💀 Top Prize Claimed — ${stateLabel}`,
      subline: `Previously flagged BUY games have been cleared. Stop buying these tickets.`,
      games: prizeClearedGames,
      appUrl,
    }
    const r = await sendAlert(config, payload)
    result.alertsSent++
    result.triggers.push(`prizeCleared: ${prizeClearedGames.map(g => g.name).join(", ")}`)
    if (r.errors.length) result.errors.push(...r.errors)
  }

  return result
}

export async function sendDailyDigest(
  gamesByState: Record<StateCode, Game[]>,
  config: AlertConfig,
  appUrl: string = "http://localhost:3002"
): Promise<{ sent: boolean; errors: string[] }> {
  if (!config.thresholds.dailyDigest) return { sent: false, errors: [] }

  const minRatio = config.minGintherForDigest ?? 5
  const allNotable: AlertGameCard[] = []

  for (const [stateKey, games] of Object.entries(gamesByState)) {
    const state = stateKey as StateCode
    if (!config.states[state]) continue

    const notable = games
      .filter(g => (g.gintherRatio ?? 0) >= minRatio || signalRank(g.signal) >= 2)
      .sort((a, b) => (b.gintherRatio ?? 0) - (a.gintherRatio ?? 0))
      .slice(0, 5)

    for (const g of notable) {
      allNotable.push({ ...gameToCard(g), name: `[${state === "california" ? "CA" : "OR"}] ${g.name}` })
    }
  }

  if (allNotable.length === 0) return { sent: false, errors: [] }

  const payload: AlertPayload = {
    level: "digest",
    headline: "📊 Daily SCRAPGER Digest",
    subline: `Your top ${allNotable.length} games worth watching today`,
    games: allNotable,
    appUrl,
  }

  const r = await sendAlert(config, payload)
  return { sent: true, errors: r.errors }
}
