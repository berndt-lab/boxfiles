import type { Achievement, Profile } from "@/lib/format"

const ach = (
  id: string,
  name: string,
  description: string,
  score: number,
  rarity: number,
  unlockedAt: string | null,
): Achievement => ({ id, name, description, score, rarity, unlockedAt })

// ponytail: hand-written sample profiles. Replace this module with an Xbox API feed when a key exists.
export const profiles: Profile[] = [
  {
    gamertag: "NovaForge",
    bio: "Chasing the ones almost nobody has.",
    games: [
      {
        id: "starfall-protocol",
        title: "Starfall Protocol",
        achievements: [
          ach("sp-1", "First Beacon", "Land on the relay moon.", 15, 76, "2025-11-02"),
          ach("sp-2", "Quiet Airlock", "Board the station without firing.", 25, 34, "2025-11-18"),
          ach("sp-3", "Three Suns", "Chart every star in the dossier.", 40, 16, "2025-12-04"),
          ach("sp-4", "No Witnesses", "Clear the dock unseen.", 70, 6.2, "2026-01-09"),
          ach("sp-5", "Black Docket", "Finish with the docket intact.", 150, 3.4, "2026-03-21"),
          ach("sp-6", "Cold Return", "Bring the crew home on the damaged hull.", 200, 9.1, "2026-04-02"),
        ],
      },
      {
        id: "harbor-of-ash",
        title: "Harbor of Ash",
        achievements: [
          ach("ha-1", "Ash on the Boots", "Enter the burned harbor.", 10, 84, "2025-08-14"),
          ach("ha-2", "Toll Paid", "Cross the coal bridge.", 30, 41, "2025-08-30"),
          ach("ha-3", "Lantern Thief", "Steal the harbor lantern back.", 45, 18, "2025-09-12"),
          ach("ha-4", "Chapel Light", "Relight the chapel before dawn.", 65, 7.5, "2025-10-03"),
          ach("ha-5", "Unburned", "Leave with the chapel still standing.", 150, 4.2, "2026-02-02"),
          ach("ha-6", "Last Coal", "Burn nothing on the last night.", 200, 1.6, null),
        ],
      },
      {
        id: "low-orbit-courier",
        title: "Low Orbit Courier",
        achievements: [
          ach("lo-1", "Parcel 01", "Deliver the first crate.", 20, 91, "2025-06-01"),
          ach("lo-2", "Window Seat", "Ride a full orbit in the passenger ring.", 20, 48, "2025-06-11"),
          ach("lo-3", "Customs", "Pass inspection with an empty pocket.", 60, 22, "2025-07-02"),
          ach("lo-4", "Debris Garden", "Pick the dark route clean.", 80, 8.8, "2026-04-19"),
          ach("lo-5", "Full Manifest", "Deliver every named crate in one shift.", 120, 11, null),
          ach("lo-6", "Night Side", "Finish a route with the cabin lights off.", 200, 2.4, "2026-08-30"),
        ],
      },
    ],
  },
  {
    gamertag: "DriftKing",
    bio: "Night races and clean laps.",
    games: [
      {
        id: "night-apex",
        title: "Night Apex",
        achievements: [
          ach("na-1", "First Heat", "Finish a race after midnight.", 20, 80, "2026-01-04"),
          ach("na-2", "Clean Line", "Win without touching a wall.", 30, 29, "2026-01-20"),
          ach("na-3", "Pink Slip", "Beat the harbor king in his car.", 50, 14, "2026-02-11"),
          ach("na-4", "All Neon", "Win on every night track.", 100, 6.8, "2026-03-01"),
          ach("na-5", "Ghost Tape", "Beat the developer ghost by two seconds.", 100, 3.9, "2026-05-16"),
          ach("na-6", "Unlit", "Win a race with the headlights off.", 200, 1.9, "2026-07-22"),
        ],
      },
      {
        id: "redline-parish",
        title: "Redline Parish",
        achievements: [
          ach("rp-1", "Parish Green", "Set a lap on the parish circuit.", 15, 70, "2025-12-12"),
          ach("rp-2", "Sunday Grid", "Start from pole.", 35, 33, "2026-01-08"),
          ach("rp-3", "Rain Line", "Win in the wet.", 50, 12, "2026-02-14"),
          ach("rp-4", "No Assists", "Take a podium with every assist off.", 80, 5.5, "2026-04-04"),
          ach("rp-5", "Record Book", "Hold every track record at once.", 120, 8.4, null),
          ach("rp-6", "Perfect Sector", "Purple all three sectors in one lap.", 200, 2.7, "2026-06-18"),
        ],
      },
      {
        id: "dust-circuit",
        title: "Dust Circuit",
        achievements: [
          ach("dc-1", "Dust in the Teeth", "Finish the first stage.", 30, 77, "2026-09-01"),
          ach("dc-2", "Spare Tire", "Repair a tire without retiring.", 30, 40, "2026-09-03"),
          ach("dc-3", "Canyon Cut", "Take the canyon shortcut clean.", 40, 21, null),
          ach("dc-4", "Night Dune", "Win a stage after sunset.", 100, 9.4, null),
          ach("dc-5", "Service Park", "Leave the park inside the time window.", 100, 15, null),
          ach("dc-6", "Unbroken", "Finish the rally without a repair.", 200, 3.3, null),
        ],
      },
    ],
  },
  {
    gamertag: "MossQuota",
    bio: "Slow games, unfinished lists.",
    games: [
      {
        id: "glen-rafter",
        title: "Glen & Rafter",
        achievements: [
          ach("gr-1", "Key under the Mat", "Unlock the first cottage.", 10, 86, "2025-04-02"),
          ach("gr-2", "Tea for Two", "Host a visitor.", 40, 45, "2025-04-18"),
          ach("gr-3", "Long Porch", "Finish the river porch.", 50, 24, "2025-05-09"),
          ach("gr-4", "Winter Glass", "Keep every pane intact through a storm.", 80, 9.6, "2025-12-20"),
          ach("gr-5", "All Let", "Rent every cottage in one season.", 120, 6.1, null),
          ach("gr-6", "Quiet Glen", "Finish a year without selling the meadow.", 200, 2.1, "2026-08-08"),
        ],
      },
      {
        id: "paper-kingdoms",
        title: "Paper Kingdoms",
        achievements: [
          ach("pk-1", "First Fold", "Win a match.", 20, 82, "2025-03-01"),
          ach("pk-2", "Ink Crown", "Win with only crown cards.", 20, 28, "2025-03-22"),
          ach("pk-3", "Margin Note", "Win after discarding your opening hand.", 60, 13, "2025-04-30"),
          ach("pk-4", "Uncreased", "Win a war without losing a unit.", 100, 4.8, "2026-01-14"),
          ach("pk-5", "Atlas", "Control every region in one match.", 100, 18, null),
          ach("pk-6", "Blank Page", "Win with no cards left in the deck.", 200, 1.2, null),
        ],
      },
      {
        id: "static-orchard",
        title: "Static Orchard",
        achievements: [
          ach("so-1", "First Static", "Hear the orchard radio.", 25, 74, "2024-11-02"),
          ach("so-2", "Rotten Sweet", "Identify the bad tree.", 35, 38, "2024-11-20"),
          ach("so-3", "Night Harvest", "Pick the north row after dark.", 40, 17, null),
          ach("so-4", "Copper Root", "Trace the signal to the copper root.", 100, 8.1, null),
          ach("so-5", "Still Air", "Silence every speaker in the orchard.", 100, 5.2, null),
          ach("so-6", "Last Broadcast", "Play the final tape to the end.", 200, 2.9, null),
        ],
      },
    ],
  },
]

function assertCatalog(list: Profile[]) {
  const tags = new Set<string>()
  const ids = new Set<string>()
  for (const profile of list) {
    const tag = profile.gamertag.trim().toLowerCase()
    if (!tag || tags.has(tag)) throw new Error(`Bad gamertag: ${profile.gamertag}`)
    tags.add(tag)
    for (const game of profile.games) {
      if (game.achievements.length === 0) throw new Error(`No achievements: ${game.title}`)
      for (const achievement of game.achievements) {
        if (ids.has(achievement.id)) throw new Error(`Duplicate achievement id ${achievement.id}`)
        ids.add(achievement.id)
        if (achievement.score <= 0 || achievement.rarity <= 0 || achievement.rarity > 100) {
          throw new Error(`Bad score or rarity on ${achievement.name}`)
        }
        if (!achievement.unlockedAt) continue
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(achievement.unlockedAt)
        const month = Number(match?.[2])
        const day = Number(match?.[3])
        if (!match || month < 1 || month > 12 || day < 1 || day > 31) {
          throw new Error(`Bad date on ${achievement.name}`)
        }
      }
    }
  }
}

assertCatalog(profiles)
