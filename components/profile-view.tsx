"use client"

import { AnimatePresence, MotionConfig, motion } from "motion/react"
import { Suspense, use, useEffect, useState, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import { CopyLink } from "@/components/copy-link"
import { SocialLinks } from "@/components/social-links"
import { SocialsEditor } from "@/components/socials-editor"
import { Avatar, Gs, Meter } from "@/components/ui"
import {
  completionTier,
  formatGs,
  formatPct,
  formatRarity,
  formatUnlocked,
  gameTally,
  isCompleted,
  rarityColor,
  rarityHue,
  rarityTier,
  words,
  type Achievement,
  type Game,
  type Profile,
  type RarityTone,
} from "@/lib/format"
import type { Socials } from "@/lib/socials"
import type { RecentUnlock } from "@/lib/xbox-map"

export type Filter = "all" | "unlocked" | "locked"
type Sort = "rarity" | "score" | "recent"
type Tier = "complete" | "base" | null
type GameFilter = "all" | "complete" | "base" | "progress"
type GameSort = "recent" | "completion" | "score" | "name"

const spring = { type: "spring", stiffness: 420, damping: 34, mass: 0.7 } as const
const ease = [0.22, 1, 0.36, 1] as const
const PAGE = 48
const GOLD = "#f5c542"
const MYTHIC = "#c084fc"

function ratio(game: Game) {
  return game.total ? (game.earned ?? 0) / game.total : 0
}

export function ProfileView({
  profile,
  initialGame,
  initialFilter = "unlocked",
  unlocks,
  views = null,
  rank = null,
  socials = {},
  canEditSocials = false,
}: {
  profile: Profile
  initialGame?: string
  initialFilter?: Filter
  unlocks?: Promise<RecentUnlock[] | null>
  views?: number | null
  rank?: { rank: number; total: number } | null
  socials?: Socials
  canEditSocials?: boolean
}) {
  const [games, setGames] = useState(profile.games)
  const [openId, setOpenId] = useState<string | null>(() =>
    initialGame && profile.games.some((game) => game.id === initialGame) ? initialGame : null,
  )
  const [filter, setFilter] = useState<Filter>(initialFilter)
  const [sort, setSort] = useState<Sort>("rarity")
  const [loadError, setLoadError] = useState<string | null>(null)
  const [baseDone, setBaseDone] = useState<ReadonlySet<string>>(() => new Set())
  const open = games.find((game) => game.id === openId) ?? null
  const loaded = open?.achievementsLoaded === true

  // Only a game's full achievement list says whether its main game is done, so check the likeliest candidates.
  useEffect(() => {
    if (!profile.xuid) return
    const candidates = profile.games
      .filter((game) => !isCompleted(game) && ratio(game) >= 0.3)
      .sort((a, b) => (b.earned ?? 0) - (a.earned ?? 0))
      .slice(0, 12)
      .map((game) => game.id)
    if (candidates.length === 0) return
    let cancel = false
    fetch(`/api/base-games?xuid=${encodeURIComponent(profile.xuid)}&titleIds=${candidates.join(",")}`)
      .then((response) => (response.ok ? (response.json() as Promise<{ titleIds?: string[] }>) : { titleIds: [] }))
      .then((body) => {
        if (cancel || !body.titleIds?.length) return
        setBaseDone((current) => new Set([...current, ...(body.titleIds ?? [])]))
      })
      .catch(() => {})
    return () => {
      cancel = true
    }
  }, [profile.xuid, profile.games])

  useEffect(() => {
    if (!profile.xuid || !openId || loaded) return
    const titleId = openId
    let cancel = false
    fetch(`/api/achievements?xuid=${encodeURIComponent(profile.xuid)}&titleId=${encodeURIComponent(titleId)}`)
      .then(async (response) => {
        const body = (await response.json()) as { achievements?: Achievement[]; error?: string }
        if (!response.ok) throw new Error(body.error || "Could not load achievements.")
        return body.achievements ?? []
      })
      .then((achievements) => {
        if (cancel) return
        setLoadError(null)
        setGames((current) =>
          current.map((item) => (item.id === titleId ? { ...item, achievements, achievementsLoaded: true } : item)),
        )
        if (completionTier(achievements) === "base") setBaseDone((current) => new Set([...current, titleId]))
      })
      .catch((error: unknown) => {
        if (cancel) return
        setLoadError(error instanceof Error ? error.message : "Could not load achievements.")
        setGames((current) => current.map((item) => (item.id === titleId ? { ...item, achievementsLoaded: true } : item)))
      })
    return () => {
      cancel = true
    }
  }, [loaded, profile.xuid, openId])

  const tierOf = (game: Game): Tier => (isCompleted(game) ? "complete" : baseDone.has(game.id) ? "base" : null)

  function openGame(id: string) {
    setOpenId(id)
    setFilter("unlocked")
    setLoadError(null)
    const url = new URL(window.location.href)
    url.searchParams.set("game", id)
    url.searchParams.delete("show")
    window.history.replaceState(null, "", url)
  }

  function closeGame() {
    setOpenId(null)
    const url = new URL(window.location.href)
    url.searchParams.delete("game")
    url.searchParams.delete("show")
    window.history.replaceState(null, "", url)
  }

  const visible = games.reduce((sum, game) => sum + (game.earned ?? 0), 0)
  const headline = profile.gamerscore ?? visible
  // Players can hide games on Xbox: their gamerscore still counts, but the title history leaves them out.
  const hidden = Math.max(0, headline - visible)

  return (
    <MotionConfig reducedMotion="user">
      <main className="shell pt-8 sm:pt-12">
        <section>
          <div className="label-mono flex items-center justify-between gap-4 border-b border-line pb-4 text-muted">
            <span className="flex items-center gap-2">
              <span className="ambient-glow size-1.5 rounded-full bg-ambient" aria-hidden />
              (Profile) Xbox Live
            </span>
            <CopyLink />
          </div>
          <div className="mt-8 grid items-end gap-8 sm:mt-12 lg:grid-cols-12">
            <div className="flex min-w-0 items-start gap-4 sm:gap-6 lg:col-span-7">
              <span className="mt-1 shrink-0 sm:mt-2">
                <Avatar name={profile.gamertag} src={profile.avatar} size="xl" />
              </span>
              <div className="min-w-0">
                <h1 className="break-all font-display text-[clamp(2.5rem,7vw,6.5rem)] font-semibold leading-[0.9] tracking-[-0.055em]">
                  {profile.gamertag}
                </h1>
                {profile.bio ? <p className="mt-3 max-w-xl text-pretty text-muted">{profile.bio}</p> : null}
                <ProfileFacts profile={profile} />
                <SocialLinks socials={socials} className="mt-3" />
                {canEditSocials && <SocialsEditor socials={socials} />}
              </div>
            </div>
            <div className="lg:col-span-5 lg:text-right">
              <p className="label-mono text-muted">Gamerscore</p>
              <p
                className="mt-2 font-display text-[clamp(3.5rem,9vw,8rem)] font-semibold leading-[0.82] tracking-[-0.06em] tabular-nums"
                title="Gamerscore"
              >
                {formatGs(headline)}
                <span className="ambient-text ml-[0.04em] align-top text-[0.34em] tracking-normal">G</span>
              </p>
              {hidden > 0 && (
                <p className="label-mono mt-3 text-faint">{formatGs(hidden)}G from games hidden on Xbox</p>
              )}
            </div>
          </div>
          <StatsStrip games={games} baseCount={baseDone.size} views={views} rank={rank} />
        </section>

        {unlocks && (
          <Suspense fallback={<HighlightSkeleton />}>
            <Highlights unlocks={unlocks} games={games} onOpen={openGame} />
          </Suspense>
        )}

        <GamesSection games={games} tierOf={tierOf} onOpen={openGame} />

        <AnimatePresence>
          {open && (
            <GameDrawer
              key={open.id}
              game={open}
              tier={tierOf(open)}
              loading={Boolean(profile.xuid) && !loaded}
              loadError={loadError}
              filter={filter}
              onFilter={setFilter}
              sort={sort}
              onSort={setSort}
              onClose={closeGame}
            />
          )}
        </AnimatePresence>
      </main>
    </MotionConfig>
  )
}

/** The scoreboard row: big numbers with small labels, in the spirit of a trophy profile header. */
function StatsStrip({
  games,
  baseCount,
  views,
  rank,
}: {
  games: Game[]
  baseCount: number
  views: number | null
  rank: { rank: number; total: number } | null
}) {
  const withAchievements = games.filter((game) => (game.total ?? 0) > 0)
  const completed = games.filter(isCompleted).length
  const average = withAchievements.length
    ? withAchievements.reduce((sum, game) => sum + ratio(game), 0) / withAchievements.length
    : 0
  const unlocked = games.reduce((sum, game) => sum + (game.unlockedCount ?? 0), 0)
  const counted = games.reduce((sum, game) => sum + (game.achievementCount ?? 0), 0)
  const cells: { label: string; value: string; accent?: string }[] = [
    { label: "Games played", value: formatGs(games.length) },
    { label: "Completed", value: formatGs(completed), accent: completed > 0 ? GOLD : undefined },
    { label: "Mythic", value: formatGs(baseCount), accent: baseCount > 0 ? MYTHIC : undefined },
    { label: "Avg. completion", value: `${(average * 100).toFixed(1)}%` },
    { label: "Unlocked", value: formatGs(unlocked) },
    ...(counted > unlocked ? [{ label: "Unearned", value: formatGs(counted - unlocked) }] : []),
    ...(views != null ? [{ label: "Profile views", value: formatGs(views) }] : []),
    ...(rank ? [{ label: "boxfiles rank", value: `#${formatGs(rank.rank)}`, accent: "rgb(var(--ambient))" }] : []),
  ]
  return (
    <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden border-y border-line bg-line sm:mt-14 sm:grid-cols-4 xl:grid-cols-8">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="flex flex-col-reverse justify-end bg-background px-3 py-4 sm:px-4 sm:py-5"
        >
          <dt className="label-mono mt-2 text-muted">{cell.label}</dt>
          <dd
            className="font-display text-[1.75rem] font-semibold leading-none tracking-[-0.04em] tabular-nums sm:text-[2.6rem]"
            style={cell.accent ? { color: cell.accent } : undefined}
          >
            {cell.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** Rarest five unlocks on the left, the latest unlock in the middle, recent 100% games on the right. */
function Highlights({
  unlocks,
  games,
  onOpen,
}: {
  unlocks: Promise<RecentUnlock[] | null>
  games: Game[]
  onOpen: (id: string) => void
}) {
  const feed = use(unlocks)
  const rarest = (feed ?? [])
    .flatMap((unlock) => (unlock.achievement.rarity == null ? [] : [{ ...unlock, rarity: unlock.achievement.rarity }]))
    .sort((a, b) => a.rarity - b.rarity)
    .slice(0, 5)
  const latest = feed?.[0] ?? null
  const completed = games
    .filter(isCompleted)
    .sort((a, b) => (b.lastPlayed ?? "").localeCompare(a.lastPlayed ?? ""))
    .slice(0, 4)
  if (rarest.length === 0 && !latest && completed.length === 0) return null
  return (
    <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:items-stretch">
      <div className="material light-strip relative rounded-[20px] border border-line p-4">
        <p className="label-mono text-muted">Rarest 5</p>
        {rarest.length === 0 ? (
          <p className="mt-3 text-sm text-faint">No rarity data yet.</p>
        ) : (
          <ul className="mt-3 flex gap-2 sm:gap-2.5">
            {rarest.map((unlock) => {
              const color = rarityHue(unlock.rarity)
              return (
                <li key={unlock.achievement.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(unlock.titleId)}
                    title={`${unlock.achievement.name} · ${unlock.game} · ${formatRarity(unlock.rarity)} of players`}
                    className="group block text-center"
                  >
                    <span
                      className="block size-12 overflow-hidden rounded-xl transition-transform duration-300 group-hover:-translate-y-0.5 sm:size-16"
                      style={{ boxShadow: `0 0 0 1.5px ${color}, 0 0 18px ${color}55` }}
                    >
                      <AchievementImage src={unlock.achievement.icon} color={color} />
                    </span>
                    <span className="label-mono mt-2 block tabular-nums" style={{ color }}>
                      {formatRarity(unlock.rarity)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {latest ? (
        <button
          type="button"
          onClick={() => onOpen(latest.titleId)}
          className="material light-strip group relative order-first flex min-w-0 items-center gap-4 rounded-[20px] border border-line p-4 text-left transition-colors hover:border-line-strong md:col-span-2 xl:order-none xl:col-span-1"
        >
          <span className="block size-16 shrink-0 overflow-hidden rounded-xl sm:size-20">
            <AchievementImage src={latest.achievement.icon} color={rarityHue(latest.achievement.rarity)} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="label-mono block text-muted">Latest unlock</span>
            <span className="mt-1 block truncate font-display text-xl font-semibold tracking-[-0.03em] sm:text-2xl">
              {latest.achievement.name}
            </span>
            <span className="block truncate text-sm text-muted">{latest.achievement.description}</span>
            <span className="mt-1 block truncate text-xs text-faint">
              {latest.achievement.unlockedAt && latest.achievement.unlockedAt !== "achieved"
                ? `${formatUnlocked(latest.achievement.unlockedAt)} in `
                : "In "}
              <span className="text-foreground/80">{latest.game}</span>
            </span>
          </span>
          {latest.achievement.rarity != null && (
            <span className="hidden shrink-0 text-right sm:block">
              <span
                className="block font-display text-3xl font-semibold tabular-nums tracking-[-0.04em]"
                style={{ color: rarityHue(latest.achievement.rarity) }}
              >
                {formatRarity(latest.achievement.rarity)}
              </span>
              <span className="label-mono text-faint">{rarityTier(latest.achievement.rarity).label}</span>
            </span>
          )}
        </button>
      ) : (
        <div className="hidden xl:block" />
      )}

      {completed.length > 0 && (
        <div className="material light-strip relative rounded-[20px] border border-line p-4">
          <p className="label-mono text-muted">Recently completed</p>
          <ul className="mt-3 flex gap-2 sm:gap-2.5">
            {completed.map((game) => (
              <li key={game.id}>
                <button
                  type="button"
                  onClick={() => onOpen(game.id)}
                  title={`${game.title} · 100%`}
                  className="group block"
                >
                  <span
                    className="block size-12 overflow-hidden rounded-xl transition-transform duration-300 group-hover:-translate-y-0.5 sm:size-16"
                    style={{ boxShadow: `0 0 0 1.5px ${GOLD}, 0 0 18px ${GOLD}55` }}
                  >
                    <Cover game={game} />
                  </span>
                  <span className="label-mono mt-2 block text-center" style={{ color: GOLD }}>
                    100%
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function HighlightSkeleton() {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-[22rem_minmax(0,1fr)_18rem]" aria-hidden>
      {[0, 1, 2].map((index) => (
        <div key={index} className="h-[7.5rem] animate-pulse rounded-[20px] border border-line bg-card" />
      ))}
    </div>
  )
}

const gameFilters: { value: GameFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "complete", label: "100%" },
  { value: "base", label: "Mythic" },
  { value: "progress", label: "In progress" },
]

/** Every game, as the main event: cover cards, lit gold at 100% and iridescent when the main game is done. */
function GamesSection({ games, tierOf, onOpen }: { games: Game[]; tierOf: (game: Game) => Tier; onOpen: (id: string) => void }) {
  const [filter, setFilter] = useState<GameFilter>("all")
  const [sort, setSort] = useState<GameSort>("recent")
  const [limit, setLimit] = useState(PAGE)
  const counts: Record<GameFilter, number> = {
    all: games.length,
    complete: games.filter((game) => tierOf(game) === "complete").length,
    base: games.filter((game) => tierOf(game) === "base").length,
    progress: games.filter((game) => tierOf(game) === null).length,
  }
  const shown = games
    .filter((game) => {
      const tier = tierOf(game)
      if (filter === "complete") return tier === "complete"
      if (filter === "base") return tier === "base"
      if (filter === "progress") return tier === null
      return true
    })
    .sort((a, b) => {
      if (sort === "completion") return ratio(b) - ratio(a)
      if (sort === "score") return (b.earned ?? 0) - (a.earned ?? 0)
      if (sort === "name") return a.title.localeCompare(b.title)
      return (b.lastPlayed ?? "").localeCompare(a.lastPlayed ?? "")
    })

  return (
    <section className="mt-16 sm:mt-24">
      <div className="grid gap-x-8 gap-y-5 border-t border-line pt-5 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-5">
          <p className="label-mono text-muted">(Games) {formatGs(games.length)}</p>
          <h2 className="display-em mt-3 font-display text-4xl font-semibold leading-[0.95] tracking-[-0.045em] sm:text-6xl">
            Every game, <em>every unlock</em>.
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:col-span-7 lg:justify-end">
          <Segmented
            layoutId="game-filter"
            value={filter}
            onChange={(value) => {
              setFilter(value)
              setLimit(PAGE)
            }}
            options={gameFilters.map((option) => ({ ...option, count: counts[option.value] }))}
          />
          <Select
            label="Sort games"
            value={sort}
            onChange={(value) => setSort(value as GameSort)}
            options={[
              { value: "recent", label: "Recently played" },
              { value: "completion", label: "Completion" },
              { value: "score", label: "Gamerscore" },
              { value: "name", label: "A–Z" },
            ]}
          />
        </div>
      </div>

      <TierLegend />

      {shown.length === 0 ? (
        <p className="mt-10 border-t border-line pt-10 text-center text-muted">
          {games.length === 0 ? "No games yet. They show up once this player plays something on Xbox." : "No games in this view."}
        </p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6">
          {shown.slice(0, limit).map((game) => (
            <li key={game.id}>
              <GameCard game={game} tier={tierOf(game)} onOpen={() => onOpen(game.id)} />
            </li>
          ))}
        </ul>
      )}
      {shown.length > limit && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setLimit(limit + PAGE)}
            className="label-mono h-11 rounded-full border border-line px-6 text-muted transition-colors hover:border-line-strong hover:text-foreground"
          >
            Show more · {formatGs(shown.length - limit)} left
          </button>
        </div>
      )}
    </section>
  )
}

/** The three looks side by side, so the highlights read without explanation. */
function TierLegend() {
  return (
    <ul className="label-mono mt-6 flex flex-wrap gap-x-6 gap-y-2 text-muted">
      <li className="flex items-center gap-2">
        <span className="complete-frame size-3 rounded-[4px]" aria-hidden />
        100%: every achievement, DLC included
      </li>
      <li className="flex items-center gap-2">
        <span className="mythic-frame size-3 rounded-[4px]" aria-hidden />
        Mythic: main game done, DLC left
      </li>
      <li className="flex items-center gap-2">
        <span className="size-3 rounded-[4px] border border-line-strong" aria-hidden />
        In progress
      </li>
    </ul>
  )
}

function GameCard({ game, tier, onOpen }: { game: Game; tier: Tier; onOpen: () => void }) {
  const stats = gameTally(game)
  const frame =
    tier === "complete"
      ? "complete-frame shadow-[0_0_28px_rgb(245_197_66/0.22)]"
      : tier === "base"
        ? "mythic-frame shadow-[0_0_28px_rgb(192_132_252/0.25)]"
        : "bg-line hover:bg-line-strong"
  const meter =
    tier === "complete"
      ? "linear-gradient(90deg, #ffe08a, #f5c542)"
      : tier === "base"
        ? "linear-gradient(90deg, #c084fc, #ff4fb8, #ffb347)"
        : undefined
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group block w-full rounded-[18px] p-px text-left transition-[transform,background-color] duration-300 hover:-translate-y-1 ${frame}`}
    >
      <span className="block overflow-hidden rounded-[17px] bg-[#0b0b0d]">
        <span className="relative block aspect-square overflow-hidden">
          <Cover game={game} className="transition-transform duration-500 group-hover:scale-[1.04]" />
          <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0b0b0d] to-transparent" aria-hidden />
          {tier && <TierBadge tier={tier} className="absolute left-2 top-2" />}
          <span className="label-mono absolute bottom-2 right-2.5 tabular-nums text-foreground/90">
            {formatPct(stats.completion)}
          </span>
        </span>
        <span className="block px-3 pb-3 pt-1">
          <span className="line-clamp-2 min-h-[2.5em] text-sm font-medium leading-tight">{game.title}</span>
          <span className="mt-2 flex items-center justify-between gap-2">
            <span className="label-mono tabular-nums text-muted">
              {formatGs(stats.earned)}/{formatGs(stats.total)}G
            </span>
            {stats.count > 0 && (
              <span className="label-mono tabular-nums text-faint">
                {stats.unlocked}/{stats.count}
              </span>
            )}
          </span>
          <Meter value={stats.completion} className="mt-2" color={meter} />
        </span>
      </span>
    </button>
  )
}

function TierBadge({ tier, className = "" }: { tier: Exclude<Tier, null>; className?: string }) {
  return tier === "complete" ? (
    <span
      className={`label-mono inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold text-[#2a1f00] ${className}`}
      style={{ background: "linear-gradient(135deg, #ffe08a, #f5c542)" }}
    >
      <TrophyIcon className="size-3" />
      100%
    </span>
  ) : (
    <span
      className={`label-mono inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold text-white ${className}`}
      style={{ background: "linear-gradient(135deg, #a855f7, #ec4899 60%, #f59e0b)" }}
    >
      ✦ Mythic
    </span>
  )
}

function Cover({ game, className = "" }: { game: Game; className?: string }) {
  if (game.image) {
    return (
      // Xbox box art comes from several hosts, so a plain img keeps it simple.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={game.image} alt="" loading="lazy" className={`size-full object-cover ${className}`} />
    )
  }
  return (
    <span className={`grid size-full place-items-center bg-raised ${className}`}>
      <Avatar name={game.title} size="lg" shape="square" />
    </span>
  )
}

/** One game's achievements in a panel that slides in over the page. */
function GameDrawer({
  game,
  tier,
  loading,
  loadError,
  filter,
  onFilter,
  sort,
  onSort,
  onClose,
}: {
  game: Game
  tier: Tier
  loading: boolean
  loadError: string | null
  filter: Filter
  onFilter: (value: Filter) => void
  sort: Sort
  onSort: (value: Sort) => void
  onClose: () => void
}) {
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", escape)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener("keydown", escape)
    }
  }, [onClose])

  // Rendered on <body>: the page content sits in its own layer under the sticky header, and the drawer must cover both.
  const mounted = useSyncExternalStore(subscribeNothing, () => true, () => false)
  const stats = gameTally(game)
  const shown = game.achievements
    .filter((achievement) => {
      if (filter === "unlocked") return achievement.unlockedAt
      if (filter === "locked") return !achievement.unlockedAt
      return true
    })
    .sort((a, b) => {
      if (sort === "score") return b.score - a.score
      if (sort === "recent") {
        if (a.unlockedAt && b.unlockedAt) return b.unlockedAt.localeCompare(a.unlockedAt)
        if (a.unlockedAt) return -1
        if (b.unlockedAt) return 1
      }
      // Unknown rarity sorts last.
      return (a.rarity ?? 101) - (b.rarity ?? 101)
    })

  if (!mounted) return null
  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={game.title}>
      <motion.button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.aside
        className="material scroll-thin absolute inset-y-0 right-0 flex w-full flex-col overflow-y-auto border-l border-line sm:max-w-xl"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.5, ease }}
      >
        <header className="light-strip relative border-b border-line p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="block size-20 shrink-0 overflow-hidden rounded-2xl sm:size-24">
              <Cover game={game} />
            </span>
            <div className="min-w-0 flex-1">
              {tier && <TierBadge tier={tier} />}
              <h2 className="mt-2 font-display text-2xl font-semibold leading-tight tracking-[-0.035em] sm:text-3xl">{game.title}</h2>
              <p className="label-mono mt-2 tabular-nums text-muted">
                {formatGs(stats.earned)} / {formatGs(stats.total)}G · {formatPct(stats.completion)}
              </p>
              {gameMeta(game) && <p className="mt-1 text-xs text-faint">{gameMeta(game)}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-muted transition-colors hover:border-line-strong hover:text-foreground"
            >
              <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
                <path d="m4 4 8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <Meter value={stats.completion} className="mt-5" />
        </header>

        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-line bg-[#0b0b0d]/90 px-5 py-3 backdrop-blur-xl sm:px-6">
          <Segmented
            layoutId="achievement-filter"
            value={filter}
            onChange={onFilter}
            options={[
              { value: "unlocked", label: "Unlocked", count: stats.unlocked },
              { value: "locked", label: "Locked", count: Math.max(0, stats.count - stats.unlocked) },
              { value: "all", label: "All" },
            ]}
          />
          <Select
            label="Sort achievements"
            value={sort}
            onChange={(value) => onSort(value as Sort)}
            options={[
              { value: "rarity", label: "Rarest first" },
              { value: "score", label: "Most gamerscore" },
              { value: "recent", label: "Most recent" },
            ]}
          />
        </div>

        {loading ? (
          <LoadingRows />
        ) : shown.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm text-muted">
            {loadError ?? (filter === "locked" ? "Every achievement in this game is unlocked." : "No achievements in this view.")}
          </p>
        ) : (
          <ul className="divide-y divide-line pb-[env(safe-area-inset-bottom)]">
            {shown.map((achievement) => (
              <li key={achievement.id}>
                <AchievementRow achievement={achievement} />
              </li>
            ))}
          </ul>
        )}
      </motion.aside>
    </div>,
    document.body,
  )
}

function subscribeNothing() {
  return () => {}
}

function AchievementRow({ achievement }: { achievement: Achievement }) {
  const tier = achievement.rarity == null ? null : rarityTier(achievement.rarity)
  const color = rarityHue(achievement.rarity)
  const unlocked = Boolean(achievement.unlockedAt)
  const extras = [
    achievement.kind,
    achievement.estimate ? `About ${achievement.estimate}` : "",
    achievement.platforms?.length ? achievement.platforms.map(words).join(", ") : "",
  ].filter(Boolean)
  return (
    <div className="flex gap-4 px-5 py-4 transition-colors hover:bg-white/[0.015] sm:px-6">
      <span className={`block size-12 shrink-0 overflow-hidden rounded-xl ${unlocked ? "" : "opacity-45 grayscale"}`} style={{ boxShadow: `0 0 0 1px ${color}55` }}>
        <AchievementImage src={achievement.icon} color={color} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className={`font-medium leading-snug ${unlocked ? "" : "text-foreground/70"}`}>{achievement.name}</h3>
          <Gs value={String(achievement.score)} className="shrink-0 font-display font-semibold" />
        </div>
        <p className="mt-0.5 text-sm text-muted">{achievement.description}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
          {tier && achievement.rarity != null && (
            <>
              <RarityBadge tone={tier.tone} label={tier.label} />
              <span className="tabular-nums text-muted">{formatRarity(achievement.rarity)} of players</span>
            </>
          )}
          <span className={unlocked ? "text-muted" : "text-faint"}>{unlockStatus(achievement)}</span>
          {extras.map((extra) => (
            <span key={extra} className="text-faint">
              {extra}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function AchievementImage({ src, color }: { src?: string; color: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" loading="lazy" className="size-full object-cover" />
  }
  return (
    <span
      className="grid size-full place-items-center"
      style={{ background: `${color}14`, boxShadow: `inset 0 0 0 1px ${color}40`, color }}
      aria-hidden
    >
      <TrophyIcon className="size-5" />
    </span>
  )
}

function RarityBadge({ tone, label }: { tone: RarityTone; label: string }) {
  const color = rarityColor[tone]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium"
      style={{ color, background: `${color}14`, boxShadow: `inset 0 0 0 1px ${color}33` }}
    >
      <span className="size-1.5 rounded-full" style={{ background: color }} aria-hidden />
      {label}
    </span>
  )
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
  layoutId,
}: {
  value: T
  onChange: (value: T) => void
  options: Array<{ value: T; label: string; count?: number }>
  layoutId: string
}) {
  return (
    <div role="group" aria-label="Show" className="flex flex-wrap rounded-full border border-line bg-background p-0.5">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`relative rounded-full px-3 py-1.5 text-sm transition-colors duration-200 sm:py-1 ${
              active ? "text-background" : "text-muted hover:text-foreground"
            }`}
          >
            {active && (
              <motion.span layoutId={layoutId} className="absolute inset-0 rounded-full bg-foreground" transition={spring} aria-hidden />
            )}
            <span className="relative flex items-center gap-1.5">
              {option.label}
              {option.count != null && (
                <span className={`text-xs tabular-nums ${active ? "text-background/60" : "text-faint"}`}>{option.count}</span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="relative flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 cursor-pointer appearance-none rounded-full border border-line bg-background pl-3 pr-8 text-base text-foreground sm:h-8 sm:text-sm transition-colors hover:border-line-strong focus:outline-none focus-visible:border-foreground"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <svg viewBox="0 0 16 16" className="pointer-events-none absolute right-2.5 size-3.5 text-muted" aria-hidden>
        <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  )
}

function LoadingRows() {
  return (
    <ul className="divide-y divide-line" aria-label="Loading achievements">
      {[0, 1, 2, 3, 4].map((index) => (
        <li key={index} className="flex gap-4 px-6 py-4">
          <span className="size-12 shrink-0 animate-pulse rounded-xl bg-raised" />
          <span className="flex-1 space-y-2 pt-1">
            <span className="block h-3.5 w-1/3 animate-pulse rounded-full bg-raised" />
            <span className="block h-3 w-2/3 animate-pulse rounded-full bg-raised/70" />
            <span className="block h-3 w-1/4 animate-pulse rounded-full bg-raised/50" />
          </span>
        </li>
      ))}
    </ul>
  )
}

function profileFacts(profile: Profile) {
  const tenure = profile.tenure && profile.tenure !== "0" ? `${words(profile.tenure)} tenure` : ""
  return [
    profile.classicTag,
    profile.presence,
    profile.tier ? words(profile.tier) : "",
    profile.gamePass ? "Game Pass" : "",
    profile.verified ? "Verified" : "",
    profile.reputation ? words(profile.reputation) : "",
    profile.location,
    tenure,
    profile.followers != null ? `${formatGs(profile.followers)} followers` : "",
    profile.following != null ? `${formatGs(profile.following)} following` : "",
    profile.lastSeen ? `Last seen ${formatUnlocked(profile.lastSeen)}` : "",
  ].filter((item): item is string => Boolean(item))
}

function ProfileFacts({ profile }: { profile: Profile }) {
  const facts = profileFacts(profile)
  if (facts.length === 0) return null
  return (
    <ul className="mt-3 flex flex-wrap gap-1.5">
      {facts.map((fact) => (
        <li
          key={fact}
          className="flex items-center gap-1.5 rounded-full border border-line bg-white/[0.02] px-2.5 py-1 text-xs text-muted"
        >
          {fact === profile.presence && /online/i.test(fact) ? (
            <span className="size-1.5 rounded-full bg-xbox shadow-[0_0_6px_var(--xbox)]" aria-hidden />
          ) : null}
          {fact}
        </li>
      ))}
    </ul>
  )
}

function gameMeta(game: { devices?: string[]; lastPlayed?: string }) {
  const devices = game.devices?.map(words).join(", ")
  const played = game.lastPlayed ? `Last played ${formatUnlocked(game.lastPlayed)}` : ""
  return [devices, played].filter(Boolean).join(", ")
}

function unlockStatus(achievement: Achievement) {
  if (achievement.unlockedAt) return `Unlocked ${formatUnlocked(achievement.unlockedAt)}`
  if (achievement.progress) return `In progress ${achievement.progress}`
  return "Locked"
}

function TrophyIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4z" />
      <path d="M16 6h3a2 2 0 0 1-2 3.5M8 6H5a2 2 0 0 0 2 3.5" />
      <path d="M12 13v3M9 20h6M10 16h4l.5 4h-5l.5-4z" />
    </svg>
  )
}
