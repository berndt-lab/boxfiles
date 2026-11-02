import assert from "node:assert/strict"
import { achievementsFrom, gamesFrom, peopleFrom, pickPerson, recentUnlocksFrom } from "./xbox-map.ts"

const people = peopleFrom({
  code: 200,
  content: {
    people: [
      {
        xuid: "2533274798129181",
        gamertag: "NovaForge",
        modernGamertag: "NovaForge",
        uniqueModernGamertag: "NovaForge#1234",
        gamerScore: "1180",
        displayPicRaw: "https://example.test/a.png",
        xboxOneRep: "GoodPlayer",
        detail: { bio: "Chasing rares.", accountTier: "Gold", followerCount: 2, followingCount: 1, hasGamePass: true },
      },
      { xuid: "1", gamertag: "Other" },
    ],
  },
})

const fromAccount = peopleFrom({
  content: {
    profileUsers: [
      {
        id: "42",
        settings: [
          { id: "Gamertag", value: "UpperMango4418" },
          { id: "ModernGamertag", value: "UpperMango" },
          { id: "UniqueModernGamertag", value: "UpperMango#4418" },
          { id: "Gamerscore", value: "0" },
        ],
      },
    ],
  },
})
assert.equal(pickPerson(fromAccount, "UpperMango#4418")?.xuid, "42")
assert.equal(pickPerson(fromAccount, "UpperMango4418")?.gamertag, "UpperMango#4418")
assert.equal(pickPerson(fromAccount, "UpperMango")?.xuid, "42")
assert.equal(gamesFrom({ content: { titles: [] } }).length, 0)

assert.equal(pickPerson(people, "novaforge#1234")?.xuid, "2533274798129181")
assert.equal(pickPerson(people, "novaforge")?.gamerscore, 1180)
assert.equal(pickPerson(people, "novaforge")?.bio, "Chasing rares.")
assert.equal(pickPerson(people, "novaforge")?.classicTag, "NovaForge")
assert.equal(pickPerson(people, "novaforge")?.avatar, "https://example.test/a.png")
assert.equal(pickPerson(people, "novaforge")?.tier, "Gold")
assert.equal(pickPerson(people, "novaforge")?.followers, 2)
assert.equal(pickPerson(people, "novaforge")?.gamePass, true)
assert.equal(pickPerson(people, "missing"), null)

const games = gamesFrom({
  titles: [
    {
      titleId: "10",
      name: "App Widget",
      type: "Application",
      achievement: { currentGamerscore: 0, totalGamerscore: 0 },
    },
    {
      titleId: "20",
      name: "Older",
      type: "Game",
      achievement: { currentGamerscore: 10, totalGamerscore: 100, currentAchievements: 1, totalAchievements: 5 },
      titleHistory: { lastTimePlayed: "2024-01-01T00:00:00Z" },
    },
    {
      titleId: "20",
      name: "Older duplicate",
      type: "Game",
      achievement: { currentGamerscore: 10, totalGamerscore: 100 },
      titleHistory: { lastTimePlayed: "2026-01-01T00:00:00Z" },
    },
    {
      titleId: "30",
      name: "Newer",
      type: "Game",
      achievement: { currentGamerscore: 50, totalGamerscore: 200, currentAchievements: 2, totalAchievements: 8 },
      titleHistory: { lastTimePlayed: "2026-08-01T00:00:00Z" },
      displayImage: "https://example.test/box.png",
      devices: ["PC", "XboxOne"],
    },
  ],
})

assert.deepEqual(games.map((game) => game.title), ["Newer", "Older"])
assert.equal(games[1]?.earned, 10)
assert.equal(games[1]?.achievementCount, 5)
assert.equal(games[0]?.image, "https://example.test/box.png")
assert.deepEqual(games[0]?.devices, ["PC", "XboxOne"])
assert.equal(games[0]?.lastPlayed, "2026-08-01T00:00:00Z")

const page = achievementsFrom(
  {
    achievements: [
      {
        id: "3",
        name: "Cold Return",
        progressState: "Achieved",
        progression: { timeUnlocked: "2026-04-02T03:19:00.3087016Z" },
        description: "Bring the crew home.",
        isSecret: false,
        rewards: [{ value: "15", type: "Gamerscore" }, { value: "5", type: "Gamerscore" }],
        rarity: { currentPercentage: 2.4 },
      },
      {
        id: "9",
        name: "Hidden",
        progressState: "NotStarted",
        isSecret: true,
        lockedDescription: "Spoilers.",
        rewards: [{ value: "50", type: "Gamerscore" }],
        platforms: "XboxOne",
        achievementType: "Challenge",
        estimatedTime: "00:12:00",
        mediaAssets: [{ type: "Icon", url: "https://example.test/icon.png" }],
        progression: { requirements: [{ current: "1", target: "3" }] },
      },
      { id: "", name: "Skip me" },
    ],
    pagingInfo: { continuationToken: "next" },
  },
  "20",
)

assert.equal(page.continuation, "next")
assert.equal(page.achievements.length, 2)
assert.equal(page.achievements[0]?.id, "20:3")
assert.equal(page.achievements[0]?.score, 20)
assert.equal(page.achievements[0]?.rarity, 2.4)
assert.equal(page.achievements[0]?.unlockedAt, "2026-04-02")
assert.equal(page.achievements[1]?.description, "Secret achievement.")
assert.equal(page.achievements[1]?.unlockedAt, null)
assert.equal(page.achievements[1]?.rarity, 100)
assert.equal(page.achievements[1]?.progress, "1/3")
assert.equal(page.achievements[1]?.estimate, "12m")
assert.equal(page.achievements[1]?.kind, "Challenge")
assert.equal(page.achievements[1]?.icon, "https://example.test/icon.png")
assert.deepEqual(page.achievements[1]?.platforms, ["XboxOne"])
assert.equal(page.achievements[0]?.estimate, undefined)
const wrapped = achievementsFrom({ content: { achievements: page.achievements.length ? [{ id: "1", name: "Wrapped", progressState: "Achieved", rewards: [] }] : [], pagingInfo: {} }, code: 200 }, "9")
assert.equal(wrapped.achievements[0]?.name, "Wrapped")
assert.equal(wrapped.achievements[0]?.unlockedAt, "achieved")

console.log("ok")

const recent = recentUnlocksFrom({
  achievements: [
    {
      id: "7",
      name: "First Blood",
      progressState: "Achieved",
      progression: { timeUnlocked: "2026-10-30T12:00:00Z" },
      titleAssociations: [{ name: "Demo Racer", id: 1234 }],
      rewards: [{ type: "Gamerscore", value: "15" }],
      rarity: { currentPercentage: 42.5 },
    },
    { id: "8", name: "Locked", progressState: "NotStarted", titleAssociations: [{ name: "Demo Racer", id: 1234 }] },
  ],
})
assert.equal(recent.length, 1)
assert.equal(recent[0].game, "Demo Racer")
assert.equal(recent[0].achievement.id, "1234:7")
assert.equal(recent[0].achievement.score, 15)
assert.equal(recent[0].achievement.unlockedAt, "2026-10-30")
console.log("ok")
