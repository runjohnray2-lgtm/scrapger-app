# SCRAPGER — Oregon Lottery EV Dashboard

Real-time Expected Value and Ginther Ratio analysis for Oregon Lottery scratch-it tickets.

## What is the Ginther Ratio?
Joan Ginther won the Texas lottery 4 times by exploiting a simple fact: as tickets sell,
the winning tickets remaining in the batch become proportionally easier to hit.

**Ginther Ratio = (current odds of winning) ÷ (original odds at game launch)**

- 5x = your odds are 5x better than game launch → potential BUY signal
- 20x = your odds are 20x better → strong BUY signal
- 50x = extremely hot window

## Running Locally

### Requirements
- Node.js 18 or newer → download at https://nodejs.org (pick the LTS version)

### Steps
```bash
# 1. Install dependencies (one time only)
npm install

# 2. Start the app
npm run dev

# 3. Open your browser to:
http://localhost:3000
```

That's it. The app scrapes Oregon Lottery live data every time you load the page.

## Deploying Live (Free — Vercel)

1. Create a free account at https://vercel.com (sign up with GitHub)
2. Install Vercel CLI: `npm install -g vercel`
3. From this folder, run: `vercel --prod`
4. Follow the prompts — you'll get a live URL like `scrapger.vercel.app`

The live version auto-scrapes Oregon Lottery whenever someone visits the page.

## How the EV Score Works
```
EV = (probability of winning top prize × top prize amount)
   + (ticket price × 0.37)   ← estimated minor prize return
   - ticket price
```
An EV score above $0 = statistically positive return. Most scratch-offs are negative EV,
but late-game tickets with unclaimed prizes can flip positive.

## Data Source
Live data from: https://www.oregonlottery.org/scratch-its/list/
Updated: every page load (server caches for 1 hour to be polite to Oregon's servers)
