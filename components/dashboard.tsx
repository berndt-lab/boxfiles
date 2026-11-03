import Link from "next/link"
import { updateTag } from "next/cache"
import { after } from "next/server"
import { Suspense, type ReactNode } from "react"
import { CopyLink } from "@/components/copy-link"
import { Leaderboard } from "@/components/leaderboard"
import { CountUp } from "@/components/motion"
import { ArrowIcon, Avatar, Gs, Meter, Panel, SectionHead } from "@/components/ui"
import { XboxAmbient } from "@/components/xbox-ambient"
import {
  formatGs,
  formatPct,
  formatRarity,
  formatUnlocked,
  rarityColor,
  rarityTier,
  tally,
  type Achievement,
  type Game,
} from "@/lib/format"
import {
  LEADERBOARD_TAG,
  entryFromProfile,
  isHidden,
  joinBoard,
  leaderboardReady,
  leaveBoard,
  rankOf,
  saveEntry,
} from "@/lib/leaderboard"
import type { XboxSession } from "@/lib/session"
import { currentSession, lookupFriends, lookupMyProfile, lookupNextUp, lookupRecentUnlocks } from "@/lib/xbox"

const XBOX_DOWN = "Couldn't reach Xbox Live. Refresh in a minute."

function profileHref(gamertag: string, gameId?: string, show?: "locked") {
  const path = `/u/${encodeURIComponent(gamertag)}`
  if (!gameId) return path
  return `${path}?game=${encodeURIComponent(gameId)}${show ? `&show=${show}` : ""}`
}

async function leaveLeaderboard() {
  "use server"
  const session = await currentSession()
  if (!session) return
  await leaveBoard(session.xuid)
  updateTag(LEADERBOARD_TAG)
}

async function joinLeaderboard() {
  "use server"
  const profile = await lookupMyProfile().catch(() => null)
  const entry = profile ? entryFromProfile(profile) : null
  if (!entry) return
  await joinBoard(entry)
  updateTag(LEADERBOARD_TAG)
}

/** The signed-in home: every section loads from Xbox Live on its own, so a slow one never holds up the rest. */
export function Dashboard({ session, notice }: { session: XboxSession; notice?: ReactNode }) {
  return (
    <main className="shell pt-8 sm:pt-12">
      {notice}
      <Suspense fallback={<Skeleton className="h-72" />}>
        <Overview session={session} />
      </Suspense>
      <div className="mt-20 sm:mt-28">
        <SectionHead
          index="01"
          label="Today's plan"
          title={
            <>
              What to <em>unlock next</em>.
            </>
          }
        />
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <Suspense fallback={<Skeleton className="h-[26rem]" />}>
            <UpNext gamertag={session.gamertag} />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-64" />}>
            <AlmostDone gamertag={session.gamertag} />
          </Suspense>
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <Suspense fallback={<Skeleton className="h-80" />}>
            <Friends session={session} />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-80" />}>
            <RecentUnlocks gamertag={session.gamertag} />
          </Suspense>
        </div>
      </div>
      <div className="mt-20 sm:mt-28">
        <SectionHead
          index="02"
          label="The board"
          title={
            <>
              Where you <em>stand</em>.
            </>
          }
        />
      </div>
      <div className="mt-10 space-y-4">
        <Leaderboard me={session.xuid} />
        <Suspense fallback={null}>
          <Membership session={session} />
        </Suspense>
      </div>
    </main>
  )
}

async function Overview({ session }: { session: XboxSession }) {
  const [profile, rank] = await Promise.all([
    lookupMyProfile().catch(() => null),
    rankOf(session.xuid).catch(() => null),
  ])
  if (!profile) {
    return (
      <Panel>
        <p className="px-5 py-10 text-center text-sm text-muted">{XBOX_DOWN}</p>
      </Panel>
    )
  }
  const entry = entryFromProfile(profile)
  if (entry) {
    // Visiting home keeps your leaderboard row current.
    after(() => saveEntry(entry).catch(() => {}))
  }
  const stats = tally(profile.games)
  const gamerscore = profile.gamerscore ?? stats.earned
  const completed = profile.games.filter((game) => (game.total ?? 0) > 0 && (game.earned ?? 0) >= (game.total ?? 0)).length
  return (
    <section>
      {profile.color && <XboxAmbient color={profile.color} />}
      <div className="label-mono flex items-center justify-between gap-4 border-b border-line pb-4 text-muted">
        <span className="flex items-center gap-2">
          <span className="ambient-glow size-1.5 rounded-full bg-ambient" aria-hidden />
          (You) Signed in
        </span>
        <span>{rank ? `Rank ${formatGs(rank.rank)} / ${formatGs(rank.total)}` : "Unranked"}</span>
      </div>
      <div className="mt-8 grid items-end gap-8 sm:mt-12 lg:grid-cols-12">
        <div className="flex min-w-0 items-end gap-4 sm:gap-6 lg:col-span-7">
          <Avatar name={profile.gamertag} src={profile.avatar} size="xl" />
          <div className="min-w-0">
            <p className="label-mono text-muted">Welcome back</p>
            <h1 className="mt-2 break-all font-display text-[clamp(2.5rem,7vw,6.5rem)] font-semibold leading-[0.9] tracking-[-0.055em]">
              {profile.gamertag}
            </h1>
          </div>
        </div>
        <div className="lg:col-span-5 lg:text-right">
          <p className="label-mono text-muted">Gamerscore</p>
          <p className="mt-2 font-display text-[clamp(3.75rem,10vw,9rem)] font-semibold leading-[0.82] tracking-[-0.06em] tabular-nums">
            <CountUp value={gamerscore} />
            <span className="ambient-text ml-[0.04em] align-top text-[0.34em] tracking-normal">G</span>
          </p>
        </div>
      </div>
      <dl className="mt-10 grid grid-cols-2 border-t border-line sm:mt-14 sm:grid-cols-4">
        <Stat
          label="Global rank"
          value={rank ? `#${formatGs(rank.rank)}` : "—"}
          hint={rank ? `of ${formatGs(rank.total)} on boxfiles` : "Join the board to rank"}
        />
        <Stat label="Completion" value={formatPct(stats.completion)} meter={stats.completion} />
        <Stat label="Games" value={formatGs(profile.games.length)} />
        <Stat label="Completed" value={formatGs(completed)} hint="at 100%" />
      </dl>
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <Link
          href={profileHref(profile.gamertag)}
          className="group inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-[box-shadow,transform] duration-300 hover:shadow-[0_0_32px_rgb(var(--ambient)/0.35)] active:scale-[0.97]"
        >
          Your full profile
          <ArrowIcon className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
        <CopyLink path={profileHref(profile.gamertag)} label="Copy share link" />
      </div>
    </section>
  )
}

async function UpNext({ gamertag }: { gamertag: string }) {
  let picks: Awaited<ReturnType<typeof lookupNextUp>>
  try {
    const profile = await lookupMyProfile()
    picks = await lookupNextUp(profile?.games ?? [])
  } catch {
    return <Section title="Up next" body={XBOX_DOWN} />
  }
  const total = picks.reduce((sum, pick) => sum + pick.achievement.score, 0)
  return (
    <Panel
      title="Up next"
      aside={
        picks.length > 0 ? (
          <span className="label-mono text-faint">
            <Gs value={formatGs(total)} unitClassName="ml-0.5 text-faint" /> within reach
          </span>
        ) : null
      }
    >
      {picks.length === 0 ? (
        <p className="px-4 py-8 text-sm text-muted">
          Nothing easy left in your closest games. Start something new and come back for a plan.
        </p>
      ) : (
        <>
          <p className="border-b border-line px-4 py-2.5 text-xs text-faint">
            Locked achievements most players already have, from the games you&apos;re closest to finishing.
          </p>
          <ul className="divide-y divide-line">
            {picks.map(({ achievement, game }) => (
              <li key={achievement.id}>
                <Link
                  href={profileHref(gamertag, game.id, "locked")}
                  className="flex gap-3.5 px-4 py-3.5 transition-colors hover:bg-white/[0.025]"
                >
                  <AchievementIcon achievement={achievement} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span className="font-medium leading-snug">{achievement.name}</span>
                      <Gs value={String(achievement.score)} className="shrink-0 font-display font-semibold" />
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-muted">{achievement.description}</span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span className="text-foreground/80">{game.title}</span>
                      <RarityText rarity={achievement.rarity} />
                      {achievement.progress && <span className="text-faint">Progress {achievement.progress}</span>}
                      {achievement.estimate && <span className="text-faint">About {achievement.estimate}</span>}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  )
}

async function AlmostDone({ gamertag }: { gamertag: string }) {
  const profile = await lookupMyProfile().catch(() => null)
  if (!profile) return <Section title="Almost done" body={XBOX_DOWN} />
  const games = profile.games
    .filter((game) => (game.total ?? 0) > 0 && (game.earned ?? 0) < (game.total ?? 0))
    .sort((a, b) => ratio(b) - ratio(a))
    .slice(0, 5)
  return (
    <Panel title="Almost done" aside={<span className="label-mono text-faint">Closest to 100%</span>}>
      {games.length === 0 ? (
        <p className="px-4 py-8 text-sm text-muted">No unfinished games with achievements yet.</p>
      ) : (
        <ul className="p-1.5">
          {games.map((game) => (
            <li key={game.id}>
              <Link
                href={profileHref(gamertag, game.id, "locked")}
                className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-white/[0.03]"
              >
                <Avatar name={game.title} src={game.image} size="md" shape="square" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-medium">{game.title}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted">
                      <Gs value={formatGs((game.total ?? 0) - (game.earned ?? 0))} unitClassName="ml-0.5 text-faint" /> to go
                    </span>
                  </span>
                  <span className="mt-1.5 flex items-center gap-2">
                    <Meter value={ratio(game)} className="flex-1" />
                    <span className="w-8 text-right text-[11px] tabular-nums text-faint">{formatPct(ratio(game))}</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

async function Friends({ session }: { session: XboxSession }) {
  const [profile, friends] = await Promise.all([lookupMyProfile().catch(() => null), lookupFriends().catch(() => null)])
  if (!friends) return <Section title="Friends" body="Couldn't load your Xbox friends right now." />
  const mine = {
    xuid: session.xuid,
    gamertag: profile?.gamertag ?? session.gamertag,
    avatar: profile?.avatar,
    gamerscore: profile?.gamerscore ?? (profile ? tally(profile.games).earned : 0),
    presence: undefined as string | undefined,
  }
  const board = [mine, ...friends].sort((a, b) => b.gamerscore - a.gamerscore)
  const place = board.findIndex((row) => row.xuid === session.xuid)
  const rival = place > 0 ? board[place - 1] : null
  return (
    <Panel
      title="Friends"
      aside={
        friends.length > 0 ? (
          <span className="label-mono text-faint">
            You&apos;re #{place + 1} of {board.length}
          </span>
        ) : null
      }
    >
      {friends.length === 0 ? (
        <p className="px-4 py-8 text-sm text-muted">Add friends on Xbox and they&apos;ll show up here to compete with.</p>
      ) : (
        <>
          {rival ? (
            <p className="border-b border-line px-4 py-2.5 text-xs text-muted">
              <Gs value={formatGs(rival.gamerscore - mine.gamerscore)} unitClassName="ml-0.5 text-faint" /> to pass{" "}
              <span className="text-foreground">{rival.gamertag}</span>
            </p>
          ) : (
            <p className="border-b border-line px-4 py-2.5 text-xs text-ambient">You&apos;re top of your friends list.</p>
          )}
          <ol className="scroll-thin p-1.5 lg:max-h-[24rem] lg:overflow-y-auto">
            {board.map((row, index) => {
              const me = row.xuid === session.xuid
              return (
                <li key={row.xuid}>
                  <Link
                    href={profileHref(row.gamertag)}
                    className={`flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-white/[0.03] ${
                      me ? "ambient-row" : ""
                    }`}
                  >
                    <span className="w-5 text-right text-xs tabular-nums text-faint">{index + 1}</span>
                    <Avatar name={row.gamertag} src={row.avatar} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {row.gamertag}
                        {me && <span className="ml-2 text-xs font-normal text-ambient">You</span>}
                      </span>
                      {row.presence && <span className="block truncate text-xs text-faint">{row.presence}</span>}
                    </span>
                    <Gs value={formatGs(row.gamerscore)} className="shrink-0 text-sm" unitClassName="ml-0.5 text-faint" />
                  </Link>
                </li>
              )
            })}
          </ol>
        </>
      )}
    </Panel>
  )
}

async function RecentUnlocks({ gamertag }: { gamertag: string }) {
  const unlocks = await lookupRecentUnlocks().catch(() => null)
  if (!unlocks) return <Section title="Recent unlocks" body={XBOX_DOWN} />
  return (
    <Panel title="Recent unlocks">
      {unlocks.length === 0 ? (
        <p className="px-4 py-8 text-sm text-muted">Your next unlock will show up here.</p>
      ) : (
        <ul className="divide-y divide-line">
          {unlocks.map(({ achievement, game, titleId }) => (
            <li key={achievement.id}>
              <Link
                href={profileHref(gamertag, titleId)}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.025]"
              >
                <AchievementIcon achievement={achievement} small />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{achievement.name}</span>
                  <span className="block truncate text-xs text-faint">
                    {game}
                    {achievement.unlockedAt && achievement.unlockedAt !== "achieved"
                      ? ` · ${formatUnlocked(achievement.unlockedAt)}`
                      : ""}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-0.5">
                  <Gs value={String(achievement.score)} className="text-sm" unitClassName="ml-0.5 text-faint" />
                  <RarityText rarity={achievement.rarity} compact />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

async function Membership({ session }: { session: XboxSession }) {
  if (!leaderboardReady()) return null
  const hidden = await isHidden(session.xuid).catch(() => null)
  if (hidden === null) return null
  return (
    <form
      action={hidden ? joinLeaderboard : leaveLeaderboard}
      className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted"
    >
      <span>
        {hidden
          ? "You're hidden from the global leaderboard and your public card is off."
          : "You're on the global leaderboard, and your profile has a public card for sharing."}
      </span>
      <button
        type="submit"
        className="h-8 shrink-0 rounded-full border border-line px-3.5 transition-colors hover:border-line-strong hover:text-foreground"
      >
        {hidden ? "Join leaderboard" : "Leave leaderboard"}
      </button>
    </form>
  )
}

function ratio(game: Game) {
  return game.total ? (game.earned ?? 0) / game.total : 0
}

function Stat({ label, value, hint, meter }: { label: string; value: ReactNode; hint?: string; meter?: number }) {
  return (
    <div className="border-line py-5 pr-4 odd:pr-4 even:border-l even:pl-4 sm:border-l sm:pl-5 sm:first:border-l-0 sm:first:pl-0">
      <dt className="label-mono text-muted">{label}</dt>
      <dd className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] tabular-nums sm:text-4xl">{value}</dd>
      {hint && <p className="label-mono mt-1 text-faint">{hint}</p>}
      {meter != null && <Meter value={meter} className="mt-3 max-w-40" />}
    </div>
  )
}

function RarityText({ rarity, compact = false }: { rarity: number; compact?: boolean }) {
  const tier = rarityTier(rarity)
  return (
    <span className="flex items-center gap-1.5 tabular-nums" style={{ color: rarityColor[tier.tone] }}>
      <span className="size-1.5 rounded-full" style={{ background: rarityColor[tier.tone] }} aria-hidden />
      {compact ? formatRarity(rarity) : `${formatRarity(rarity)} of players`}
    </span>
  )
}

function AchievementIcon({ achievement, small = false }: { achievement: Achievement; small?: boolean }) {
  const size = small ? "size-10" : "size-12"
  const color = rarityColor[rarityTier(achievement.rarity).tone]
  if (achievement.icon) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={achievement.icon}
        alt=""
        className={`${size} shrink-0 rounded-xl object-cover`}
        style={{ boxShadow: `0 0 0 1px ${color}55` }}
      />
    )
  }
  return (
    <span
      className={`${size} shrink-0 rounded-xl`}
      style={{ background: `${color}14`, boxShadow: `inset 0 0 0 1px ${color}40` }}
      aria-hidden
    />
  )
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <Panel title={title}>
      <p className="px-4 py-8 text-sm text-muted">{body}</p>
    </Panel>
  )
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl border border-line bg-card ${className}`} aria-hidden />
}
