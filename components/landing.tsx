import type { ReactNode } from "react"
import { AmbientOrb } from "@/components/ambient-orb"
import { Leaderboard } from "@/components/leaderboard"
import { Reveal, RevealLines } from "@/components/motion"
import { Marquee, SectionHead } from "@/components/ui"
import { SignInLink, XboxSetup } from "@/components/xbox-setup"
import { formatGs, rarityColor, type RarityTone } from "@/lib/format"
import { topPlayers } from "@/lib/leaderboard"
import { authConfigured } from "@/lib/xbox-auth"

const features: { title: ReactNode; body: string; visual: ReactNode }[] = [
  {
    title: (
      <>
        Up <em>next</em>
      </>
    ),
    body: "Locked achievements most players already have, pulled from the games you're closest to finishing. Your easiest gamerscore, in order.",
    visual: <StackVisual />,
  },
  {
    title: (
      <>
        Friends <em>rivalry</em>
      </>
    ),
    body: "You and your Xbox friends, ranked by gamerscore, with exactly how much you need to pass the next one.",
    visual: <RaceVisual />,
  },
  {
    title: (
      <>
        Worth <em>sharing</em>
      </>
    ),
    body: "Every game, every unlock, and how rare it is. One link that unfurls into a card on Discord, Reddit, or X.",
    visual: <CardVisual />,
  },
]

const tiers: { tone: RarityTone; label: string; range: string; width: number }[] = [
  { tone: "ultra", label: "Ultra rare", range: "Under 5%", width: 5 },
  { tone: "very", label: "Very rare", range: "5–10%", width: 5 },
  { tone: "rare", label: "Rare", range: "10–25%", width: 15 },
  { tone: "uncommon", label: "Uncommon", range: "25–50%", width: 25 },
  { tone: "common", label: "Common", range: "50% and up", width: 50 },
]

/** The signed-out home: an editorial pitch, one way in, and the live board you'd join. */
export function Landing({ notice }: { notice?: ReactNode }) {
  const ready = authConfigured()
  return (
    <main>
      <section className="shell relative pt-8 sm:pt-12">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <AmbientOrb className="right-[-18%] top-16 size-[78vw] opacity-60 sm:right-[-4%] sm:top-10 sm:size-[min(46vw,600px)] sm:opacity-90" />
        </div>
        <div className="label-mono relative flex items-center justify-between gap-4 border-b border-line pb-4 text-muted">
          <span className="flex items-center gap-2">
            <span className="ambient-glow size-1.5 rounded-full bg-ambient" aria-hidden />
            <span className="normal-case">(α)</span> Alpha release
          </span>
          <span className="hidden sm:block">For Xbox achievement hunters</span>
          <span>Free · Read-only</span>
        </div>

        <h1 className="display-em relative mt-8 font-display text-[clamp(3.25rem,12.6vw,12.5rem)] font-semibold leading-[0.86] tracking-[-0.06em] sm:mt-12">
          <RevealLines
            lines={[
              "Your next",
              <span key="score">
                1,000<span className="ml-[0.04em] align-top text-[0.42em] tracking-normal text-muted">G</span>
              </span>,
              <em key="mapped" className="ambient-text pr-[0.08em]">
                mapped out.
              </em>,
            ]}
          />
        </h1>

        {notice}

        <div className="relative mt-10 grid gap-8 border-t border-line pt-8 sm:mt-14 sm:grid-cols-12">
          <Reveal className="sm:col-span-5" delay={0.35}>
            <p className="text-pretty text-lg leading-relaxed text-muted sm:text-xl">
              boxfiles reads your Xbox achievements and shows the easiest ones left to unlock, how you stack up against
              your friends, and the rare unlocks worth bragging about.
            </p>
          </Reveal>
          <Reveal className="sm:col-span-5 sm:col-start-8" delay={0.45}>
            {ready ? (
              <div className="flex flex-col items-start gap-4">
                <SignInLink size="lg" />
                <p className="max-w-sm text-xs leading-relaxed text-faint">
                  Microsoft sign-in, read-only: boxfiles never posts or changes anything on Xbox. Your gamertag and
                  gamerscore join the public leaderboard, and you can leave anytime.
                </p>
              </div>
            ) : (
              <XboxSetup />
            )}
          </Reveal>
        </div>
      </section>

      <div className="mt-20 sm:mt-28">
        <Ticker />
      </div>

      <section id="how" className="shell mt-24 scroll-mt-24 sm:mt-32">
        <SectionHead
          index="01"
          label="What you get"
          title={
            <>
              Three reasons to <em>open it daily</em>.
            </>
          }
        />
        <ol className="mt-10">
          {features.map((feature, index) => (
            <li key={index}>
              <Reveal>
                <div className="row-light light-strip relative grid items-center gap-6 border-t border-line py-10 transition-colors duration-500 hover:bg-white/[0.015] sm:grid-cols-12 sm:py-14">
                  <span className="label-mono text-muted sm:col-span-1">(0{index + 1})</span>
                  <h3 className="display-em font-display text-5xl font-semibold leading-[0.9] tracking-[-0.05em] sm:col-span-5 sm:text-7xl">
                    {feature.title}
                  </h3>
                  <p className="max-w-md text-pretty text-muted sm:col-span-4">{feature.body}</p>
                  <div className="sm:col-span-2 sm:justify-self-end">{feature.visual}</div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      <section className="shell mt-24 sm:mt-32">
        <SectionHead
          index="02"
          label="Rarity, decoded"
          title={
            <>
              Every unlock, ranked by <em>how few</em> have it.
            </>
          }
        />
        <Reveal className="mt-12">
          <div className="flex h-3 overflow-hidden rounded-full">
            {tiers.map((tier) => (
              <span
                key={tier.tone}
                style={{ width: `${tier.width}%`, background: rarityColor[tier.tone], boxShadow: `0 0 24px ${rarityColor[tier.tone]}66` }}
              />
            ))}
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-5">
            {tiers.map((tier) => (
              <li key={tier.tone} className="border-t border-line pt-3">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <span className="size-2 rounded-full" style={{ background: rarityColor[tier.tone] }} aria-hidden />
                  {tier.label}
                </p>
                <p className="label-mono mt-1 text-faint">{tier.range} of players</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <section id="board" className="shell mt-24 scroll-mt-24 sm:mt-32">
        <SectionHead
          index="03"
          label="The board"
          title={
            <>
              Who&apos;s <em>on top</em> right now.
            </>
          }
        />
        <Reveal className="mt-10">
          <Leaderboard />
        </Reveal>
      </section>

      {ready && (
        <section className="shell mt-28 sm:mt-40">
          <Reveal>
            <div className="grid items-end gap-8 border-t border-line pt-10 sm:grid-cols-12">
              <h2 className="display-em font-display text-6xl font-semibold leading-[0.88] tracking-[-0.055em] sm:col-span-8 sm:text-[9rem]">
                Start <em className="ambient-text pr-[0.06em]">hunting.</em>
              </h2>
              <div className="sm:col-span-4 sm:justify-self-end">
                <SignInLink size="lg" />
              </div>
            </div>
          </Reveal>
        </section>
      )}
    </main>
  )
}

/** The live board as a ticker: real gamertags and scores, or the product's vocabulary before anyone signs in. */
async function Ticker() {
  const players = await topPlayers(20).catch(() => null)
  const items =
    players && players.length > 0
      ? players.map((player) => ({ key: player.xuid, label: player.gamertag, value: `${formatGs(player.gamerscore)}G` }))
      : ["Up next", "Friends rivalry", "Rarity", "Almost done", "Recent unlocks", "Share cards"].map((label) => ({
          key: label,
          label,
          value: "",
        }))
  return (
    <Marquee seconds={Math.max(30, items.length * 5)}>
      {items.map((item) => (
        <span key={item.key} className="flex items-center gap-4 px-6 sm:gap-6 sm:px-10">
          <span className="font-display text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">{item.label}</span>
          {item.value ? <span className="label-mono text-muted">{item.value}</span> : null}
          <span className="ambient-text text-2xl sm:text-3xl" aria-hidden>
            ✦
          </span>
        </span>
      ))}
    </Marquee>
  )
}

function StackVisual() {
  return (
    <div className="flex w-36 flex-col gap-2" aria-hidden>
      {[1, 0.78, 0.6, 0.42].map((width, index) => (
        <span
          key={index}
          className="ambient-glow block h-2 rounded-full"
          style={{
            width: `${width * 100}%`,
            opacity: 1 - index * 0.2,
            background: "linear-gradient(90deg, rgb(var(--ambient)), rgb(var(--ambient-2)))",
          }}
        />
      ))}
    </div>
  )
}

function RaceVisual() {
  return (
    <div className="flex w-36 flex-col gap-3" aria-hidden>
      <span className="block h-2 w-full rounded-full bg-white/15" />
      <span className="relative block h-2 w-[82%] rounded-full">
        <span
          className="ambient-glow absolute inset-0 rounded-full"
          style={{ background: "linear-gradient(90deg, rgb(var(--ambient)), rgb(var(--ambient-2)))" }}
        />
        <span className="absolute -right-[22%] top-1/2 h-px w-[18%] -translate-y-1/2 border-t border-dashed border-white/40" />
      </span>
    </div>
  )
}

function CardVisual() {
  return (
    <div className="relative h-20 w-36 rounded-xl border border-line-strong bg-white/[0.02] p-3" aria-hidden>
      <span className="block size-6 rounded-full" style={{ background: "linear-gradient(135deg, rgb(var(--ambient)), rgb(var(--ambient-2)))" }} />
      <span className="mt-2 block h-1.5 w-16 rounded-full bg-white/30" />
      <span className="mt-1.5 block h-1.5 w-10 rounded-full bg-white/15" />
      <span className="ambient-glow absolute bottom-3 right-3 h-1.5 w-8 rounded-full bg-ambient" />
    </div>
  )
}
