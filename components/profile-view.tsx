"use client"

import { AnimatePresence, MotionConfig, motion } from "motion/react"
import { useEffect, useState } from "react"
import { CopyLink } from "@/components/copy-link"
import { Avatar, Gs, Meter, Panel } from "@/components/ui"
import {
  formatGs,
  formatPct,
  formatRarity,
  formatUnlocked,
  gameTally,
  rarityColor,
  rarityTier,
  tally,
  tileHue,
  words,
  type Achievement,
  type Game,
  type Profile,
  type RarityTone,
} from "@/lib/format"

export type Filter = "all" | "unlocked" | "locked"
type Sort = "rarity" | "score" | "recent"

const spring = { type: "spring", stiffness: 420, damping: 34, mass: 0.7 } as const

function firstGameId(profile: Profile) {
  const rarest = tally(profile.games).rarest
  if (!rarest) return profile.games[0]?.id ?? ""
  return profile.games.find((game) => game.title === rarest.game)?.id ?? profile.games[0]?.id ?? ""
}

export function ProfileView({
  profile,
  initialGame,
  initialFilter = "unlocked",
}: {
  profile: Profile
  initialGame?: string
  initialFilter?: Filter
}) {
  const [games, setGames] = useState(profile.games)
  const [gameId, setGameId] = useState(() =>
    initialGame && profile.games.some((game) => game.id === initialGame) ? initialGame : firstGameId(profile),
  )
  const [filter, setFilter] = useState<Filter>(initialFilter)
  const [sort, setSort] = useState<Sort>("rarity")
  const [loadError, setLoadError] = useState<string | null>(null)
  const stats = tally(games)
  const game = games.find((item) => item.id === gameId) ?? games[0]
  const selectedId = game?.id
  const loaded = game?.achievementsLoaded === true
  const headline = profile.gamerscore ?? stats.earned

  useEffect(() => {
    if (!profile.xuid || !selectedId || loaded) return
    const titleId = selectedId
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
      })
      .catch((error: unknown) => {
        if (cancel) return
        setLoadError(error instanceof Error ? error.message : "Could not load achievements.")
        setGames((current) =>
          current.map((item) => (item.id === titleId ? { ...item, achievementsLoaded: true } : item)),
        )
      })
    return () => {
      cancel = true
    }
  }, [loaded, profile.xuid, selectedId])
  const gameStats = game ? gameTally(game) : null
  const shown = (game?.achievements ?? [])
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
      return a.rarity - b.rarity
    })
  const hue = tileHue(profile.gamertag)

  return (
    <MotionConfig reducedMotion="user">
      <main className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:pt-12">
        {/* Profile header */}
        <section className="relative overflow-hidden rounded-3xl border border-line bg-card">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(640px 220px at 0% 0%, hsl(${hue} 45% 40% / 0.16), transparent 70%)`,
            }}
            aria-hidden
          />
          <div className="relative flex flex-wrap items-center justify-between gap-6 p-5 sm:p-7">
            <div className="flex min-w-0 items-center gap-4 sm:gap-5">
              <Avatar name={profile.gamertag} src={profile.avatar} size="xl" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h1 className="break-all font-display text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">
                    {profile.gamertag}
                  </h1>
                </div>
                {profile.bio ? <p className="mt-1.5 text-pretty text-muted">{profile.bio}</p> : null}
                <ProfileFacts profile={profile} />
              </div>
            </div>
            <div className="flex w-full items-end justify-between gap-4 sm:w-auto sm:flex-col sm:items-end sm:gap-3">
              <div className="sm:text-right">
                <p className="text-xs text-muted">Gamerscore</p>
                <p className="font-display text-4xl font-semibold tracking-[-0.03em] sm:text-5xl" title="Gamerscore">
                  <Gs value={formatGs(headline)} unitClassName="ml-1 text-[0.5em] text-faint" />
                </p>
                {stats.total > 0 && <p className="text-sm text-faint">of {formatGs(stats.total)} possible</p>}
              </div>
              <CopyLink />
            </div>
          </div>
          <dl className="relative grid grid-cols-2 gap-px border-t border-line bg-line sm:grid-cols-4">
            <Stat label="Games" value={String(games.length)} />
            <Stat
              label="Achievements"
              value={stats.count > stats.unlocked ? `${stats.unlocked} / ${stats.count}` : String(stats.unlocked)}
            />
            <Stat label="Completion" value={formatPct(stats.completion)} meter={stats.completion} />
            <Stat
              label="Rarest"
              value={stats.rarest ? formatRarity(stats.rarest.rarity) : "None"}
              tone={stats.rarest ? rarityTier(stats.rarest.rarity).tone : undefined}
            />
          </dl>
        </section>

        {games.length === 0 || !game || !gameStats ? (
          <Panel className="mt-6">
            <div className="px-5 py-12 text-center">
              <p className="font-medium">No games yet</p>
              <p className="mt-1 text-sm text-muted">Games show up here once this player has played something on Xbox.</p>
            </div>
          </Panel>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
            <aside className="flex flex-col gap-6 lg:sticky lg:top-20">
              <Panel title="Games" aside={<span className="text-xs tabular-nums text-faint">{games.length}</span>}>
                <ul className="scroll-thin max-h-[22rem] space-y-0.5 overflow-y-auto p-1.5 lg:max-h-[min(30rem,calc(100vh-22rem))]">
                  {games.map((item) => (
                    <GameRow
                      key={item.id}
                      game={item}
                      selected={item.id === game.id}
                      onSelect={() => setGameId(item.id)}
                    />
                  ))}
                </ul>
              </Panel>
              <RarityLegend />
            </aside>

            <div className="flex min-w-0 flex-col gap-6">
              {stats.rarest && (
                <RarestCard
                  name={stats.rarest.name}
                  game={stats.rarest.game}
                  rarity={stats.rarest.rarity}
                  score={stats.rarest.score}
                />
              )}

              <section className="overflow-hidden rounded-2xl border border-line bg-card">
                <header className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-line px-4 py-3.5">
                  <div className="mr-auto min-w-0">
                    <h2 className="truncate font-display text-xl font-semibold tracking-[-0.02em]">{game.title}</h2>
                    <p className="mt-0.5 text-xs text-faint">
                      <Gs value={`${formatGs(gameStats.earned)} / ${formatGs(gameStats.total)}`} />
                      {gameMeta(game) ? <span className="ml-3">{gameMeta(game)}</span> : null}
                    </p>
                  </div>
                  <Segmented
                    value={filter}
                    onChange={setFilter}
                    options={[
                      { value: "unlocked", label: "Unlocked", count: gameStats.unlocked },
                      { value: "locked", label: "Locked", count: Math.max(0, gameStats.count - gameStats.unlocked) },
                      { value: "all", label: "All" },
                    ]}
                  />
                  <SortSelect value={sort} onChange={setSort} />
                </header>

                {profile.xuid && !loaded ? (
                  <LoadingRows />
                ) : shown.length === 0 ? (
                  <p className="px-4 py-12 text-center text-sm text-muted">
                    {loadError ?? (filter === "locked" ? "Every achievement in this game is unlocked." : "No achievements in this view.")}
                  </p>
                ) : (
                  <ul className="divide-y divide-line">
                    <AnimatePresence initial={false} mode="popLayout">
                      {shown.map((achievement) => (
                        <motion.li
                          key={`${game.id}-${achievement.id}`}
                          layout="position"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, transition: { duration: 0.12 } }}
                          transition={spring}
                        >
                          <AchievementRow achievement={achievement} />
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </section>
            </div>
          </div>
        )}
      </main>
    </MotionConfig>
  )
}

function GameRow({ game, selected, onSelect }: { game: Game; selected: boolean; onSelect: () => void }) {
  const stats = gameTally(game)
  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className={`group relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors ${
          selected ? "" : "hover:bg-white/[0.03]"
        }`}
      >
        {selected && (
          <motion.span
            layoutId="game-active"
            className="absolute inset-0 rounded-xl bg-raised ring-1 ring-line-strong"
            transition={spring}
            aria-hidden
          />
        )}
        <span className="relative">
          <Avatar name={game.title} src={game.image} size="md" shape="square" />
        </span>
        <span className="relative min-w-0 flex-1">
          <span className={`block truncate text-sm font-medium ${selected ? "text-foreground" : "text-foreground/85"}`}>
            {game.title}
          </span>
          <span className="mt-1.5 flex items-center gap-2">
            <Meter value={stats.completion} className="flex-1" color={selected ? "var(--foreground)" : "var(--muted)"} />
            <span className="w-8 text-right text-[11px] tabular-nums text-faint">{formatPct(stats.completion)}</span>
          </span>
        </span>
      </button>
    </li>
  )
}

function AchievementRow({ achievement }: { achievement: Achievement }) {
  const tier = rarityTier(achievement.rarity)
  const color = rarityColor[tier.tone]
  const unlocked = Boolean(achievement.unlockedAt)
  const extras = [
    achievement.kind,
    achievement.estimate ? `About ${achievement.estimate}` : "",
    achievement.platforms?.length ? achievement.platforms.map(words).join(", ") : "",
  ].filter(Boolean)
  return (
    <div className="flex gap-4 px-4 py-4 transition-colors hover:bg-white/[0.015]">
      <AchievementIcon src={achievement.icon} color={color} unlocked={unlocked} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className={`font-medium leading-snug ${unlocked ? "" : "text-foreground/70"}`}>{achievement.name}</h3>
          <Gs value={String(achievement.score)} className="shrink-0 font-display font-semibold" />
        </div>
        <p className="mt-0.5 text-sm text-muted">{achievement.description}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
          <RarityBadge tone={tier.tone} label={tier.label} />
          <span className="tabular-nums text-muted">{formatRarity(achievement.rarity)} of players</span>
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

function AchievementIcon({ src, color, unlocked }: { src?: string; color: string; unlocked: boolean }) {
  const dim = unlocked ? "" : "opacity-45 grayscale"
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={`size-12 shrink-0 rounded-xl object-cover ${dim}`}
        style={{ boxShadow: `0 0 0 1px ${color}55` }}
      />
    )
  }
  return (
    <span
      className={`grid size-12 shrink-0 place-items-center rounded-xl ${dim}`}
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

function RarestCard({ name, game, rarity, score }: { name: string; game: string; rarity: number; score: number }) {
  const tier = rarityTier(rarity)
  const color = rarityColor[tier.tone]
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border bg-card"
      style={{ borderColor: `${color}40` }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(520px 200px at 100% 0%, ${color}24, transparent 70%)` }}
        aria-hidden
      />
      <div className="relative flex flex-wrap items-center gap-4 p-5">
        <span
          className="grid size-14 shrink-0 place-items-center rounded-2xl"
          style={{ background: `${color}1a`, color, boxShadow: `inset 0 0 0 1px ${color}4d, 0 0 32px ${color}26` }}
          aria-hidden
        >
          <TrophyIcon className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium" style={{ color }}>
            Rarest unlock
          </p>
          <p className="mt-0.5 truncate font-display text-xl font-semibold tracking-[-0.02em]">{name}</p>
          <p className="truncate text-sm text-muted">
            {game}, <Gs value={String(score)} />
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl font-semibold tabular-nums tracking-[-0.03em]" style={{ color }}>
            {formatRarity(rarity)}
          </p>
          <p className="text-xs text-muted">of players have it</p>
        </div>
      </div>
    </motion.section>
  )
}

const tiers: Array<{ tone: RarityTone; label: string; range: string }> = [
  { tone: "ultra", label: "Ultra Rare", range: "under 5%" },
  { tone: "very", label: "Very Rare", range: "under 10%" },
  { tone: "rare", label: "Rare", range: "under 25%" },
  { tone: "uncommon", label: "Uncommon", range: "under 50%" },
  { tone: "common", label: "Common", range: "50% and up" },
]

function RarityLegend() {
  return (
    <Panel title="Rarity tiers" className="hidden lg:block">
      <ul className="space-y-2 px-4 py-3.5 text-sm">
        {tiers.map((tier) => (
          <li key={tier.tone} className="flex items-center gap-2.5">
            <span className="size-2 rounded-full" style={{ background: rarityColor[tier.tone] }} aria-hidden />
            <span>{tier.label}</span>
            <span className="ml-auto text-xs text-faint">{tier.range}</span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (value: T) => void
  options: Array<{ value: T; label: string; count?: number }>
}) {
  return (
    <div role="group" aria-label="Show" className="flex rounded-full border border-line bg-background p-0.5">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`relative rounded-full px-3 py-1 text-sm transition-colors duration-200 ${
              active ? "text-background" : "text-muted hover:text-foreground"
            }`}
          >
            {active && (
              <motion.span
                layoutId="filter-pill"
                className="absolute inset-0 rounded-full bg-foreground"
                transition={spring}
                aria-hidden
              />
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

function SortSelect({ value, onChange }: { value: Sort; onChange: (value: Sort) => void }) {
  return (
    <label className="relative flex items-center">
      <span className="sr-only">Sort by</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as Sort)}
        className="h-8 cursor-pointer appearance-none rounded-full border border-line bg-background pl-3 pr-8 text-sm text-foreground transition-colors hover:border-line-strong focus:outline-none focus-visible:border-foreground"
      >
        <option value="rarity">Rarest first</option>
        <option value="score">Most gamerscore</option>
        <option value="recent">Most recent</option>
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
      {[0, 1, 2, 3].map((index) => (
        <li key={index} className="flex gap-4 px-4 py-4">
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

function Stat({ label, value, meter, tone }: { label: string; value: string; meter?: number; tone?: RarityTone }) {
  return (
    <div className="bg-card px-5 py-4 sm:px-7">
      <dt className="text-xs text-muted">{label}</dt>
      <dd
        className="mt-1 font-display text-2xl font-semibold tabular-nums tracking-[-0.02em]"
        style={tone ? { color: rarityColor[tone] } : undefined}
      >
        {value}
      </dd>
      {meter != null && <Meter value={meter} className="mt-2" />}
    </div>
  )
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
