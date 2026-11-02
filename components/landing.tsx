import type { ReactNode } from "react"
import { Leaderboard } from "@/components/leaderboard"
import { SignInLink, XboxSetup } from "@/components/xbox-setup"
import { authConfigured } from "@/lib/xbox-auth"

const features = [
  {
    title: "Up next",
    body: "Locked achievements most players already have, pulled from the games you're closest to finishing. Your easiest gamerscore, in order.",
    accent: "#5ee08a",
  },
  {
    title: "Friends rivalry",
    body: "You and your Xbox friends, ranked by gamerscore, with exactly how much you need to pass the next one.",
    accent: "#62c0ff",
  },
  {
    title: "A profile worth sharing",
    body: "Every game, every unlock, and how rare it is. One link with a preview card for Discord, Reddit, or X.",
    accent: "#f5c542",
  },
]

/** The signed-out home: what boxfiles does, one button to start, and the board you'd join. */
export function Landing({ notice }: { notice?: ReactNode }) {
  const ready = authConfigured()
  return (
    <main className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:pt-20">
      <p className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs text-muted">
        <span className="size-1.5 rounded-full bg-xbox shadow-[0_0_6px_var(--xbox)]" aria-hidden />
        Alpha · free for Xbox players
      </p>
      <h1 className="mt-5 max-w-3xl text-balance font-display text-4xl font-semibold tracking-[-0.03em] sm:text-6xl">
        Your next 1,000 gamerscore, mapped out.
      </h1>
      <p className="mt-4 max-w-xl text-pretty text-muted sm:text-lg">
        boxfiles reads your Xbox achievements and shows the easiest ones left to unlock, how you stack up against your
        friends, and the rare unlocks worth bragging about.
      </p>

      {notice}

      <div className="mt-8">
        {ready ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <SignInLink />
            <p className="max-w-sm text-xs text-faint">
              Sign in with your Microsoft account. Read-only: boxfiles never posts or changes anything on Xbox. Your
              gamertag and gamerscore join the public leaderboard, and you can leave anytime.
            </p>
          </div>
        ) : (
          <XboxSetup />
        )}
      </div>

      <ul className="mt-14 grid gap-4 sm:grid-cols-3">
        {features.map((feature) => (
          <li key={feature.title} className="relative overflow-hidden rounded-2xl border border-line bg-card p-5">
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: `radial-gradient(280px 120px at 0% 0%, ${feature.accent}1f, transparent 70%)` }}
              aria-hidden
            />
            <h2 className="relative font-medium">{feature.title}</h2>
            <p className="relative mt-1.5 text-sm text-muted">{feature.body}</p>
          </li>
        ))}
      </ul>

      <div className="mt-14">
        <Leaderboard />
      </div>
    </main>
  )
}
