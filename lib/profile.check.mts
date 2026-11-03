import assert from "node:assert/strict"
import {
  completionTier,
  isCompleted,
  formatRarity,
  formatUnlocked,
  gameTally,
  initials,
  rarityTier,
  tally,
  words,
} from "./format.ts"

assert.equal(rarityTier(0.1).label, "Ultra Rare")
assert.equal(rarityTier(4.99).label, "Ultra Rare")
assert.equal(rarityTier(5).label, "Very Rare")
assert.equal(rarityTier(9.99).label, "Very Rare")
assert.equal(rarityTier(10).label, "Rare")
assert.equal(rarityTier(24.99).label, "Rare")
assert.equal(rarityTier(25).label, "Uncommon")
assert.equal(rarityTier(49.99).label, "Uncommon")
assert.equal(rarityTier(50).label, "Common")
assert.equal(rarityTier(100).label, "Common")

const games = [
  {
    title: "Demo",
    achievements: [
      {
        id: "locked",
        name: "Locked Rare",
        description: "Nope.",
        score: 100,
        rarity: 0.4,
        unlockedAt: null,
      },
      {
        id: "got",
        name: "Got",
        description: "Yes.",
        score: 10,
        rarity: 12,
        unlockedAt: "2026-01-02",
      },
      {
        id: "rarer",
        name: "Rarer",
        description: "Yes.",
        score: 50,
        rarity: 3.2,
        unlockedAt: "2026-03-07",
      },
    ],
  },
]

const stats = tally(games)
assert.equal(stats.earned, 60)
assert.equal(stats.total, 160)
assert.equal(stats.unlocked, 2)
assert.equal(stats.count, 3)
assert.equal(stats.completion, 60 / 160)
assert.equal(stats.rarest?.name, "Rarer")

const empty = tally([])
assert.equal(empty.earned, 0)
assert.equal(empty.rarest, null)
assert.equal(empty.completion, 0)

const game = gameTally({ achievements: [] })
assert.equal(game.completion, 0)
assert.equal(gameTally(games[0]).earned, 60)

assert.equal(formatRarity(3.2), "3.2%")
assert.equal(formatRarity(76), "76%")
assert.equal(formatUnlocked("2026-03-07"), "7 Mar 2026")
assert.equal(formatUnlocked("achieved"), "Unlocked")
const partial = gameTally({ achievements: [], earned: 40, total: 100, unlockedCount: 2, achievementCount: 10 })
assert.equal(partial.earned, 40)
assert.equal(partial.unlocked, 2)
assert.equal(partial.completion, 0.4)
assert.equal(initials("Glen & Rafter"), "GR")
assert.equal(initials("Starfall Protocol"), "SP")
assert.equal(initials("NovaForge"), "NF")
assert.equal(words("XboxOne"), "Xbox One")
assert.equal(words("GoodPlayer"), "Good Player")

console.log("ok")

const base = (unlockedAt: string | null, product?: string) => ({ unlockedAt, product })
assert.equal(completionTier([]), null)
assert.equal(completionTier([base("2026-01-01", "a"), base("2026-01-02", "b")]), "complete")
assert.equal(completionTier([base("x", "a"), base("x", "a"), base(null, "b")]), "base")
assert.equal(completionTier([base("x", "a"), base(null, "a"), base("x", "b")]), null)
assert.equal(completionTier([base("x"), base(null)]), null)
assert.equal(isCompleted({ earned: 1000, total: 1000 }), true)
assert.equal(isCompleted({ earned: 0, total: 0 }), false)
console.log("ok")
