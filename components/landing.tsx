import type { ReactNode } from "react"
import { AmbientOrb } from "@/components/ambient-orb"
import { Leaderboard } from "@/components/leaderboard"
import { RevealLines } from "@/components/motion"
import { SignInLink, XboxSetup } from "@/components/xbox-setup"
import { authConfigured } from "@/lib/xbox-auth"

/** The signed-out home: one line, one way in, then the leaderboards. */
export function Landing({ notice }: { notice?: ReactNode }) {
  const ready = authConfigured()
  return (
    <main>
      {/* Clipped sideways only, at the screen edge, so the orb can sit past the content column without a hard cut. */}
      <section className="overflow-x-clip">
        <div className="shell relative pb-16 pt-12 sm:pb-24 sm:pt-20">
          <AmbientOrb className="right-[-30%] top-4 size-[85vw] opacity-50 sm:right-[-8%] sm:top-0 sm:size-[min(44vw,600px)] sm:opacity-90" />
          <h1 className="display-em relative font-display text-[clamp(3.25rem,12vw,11.5rem)] font-semibold leading-[0.86] tracking-[-0.06em]">
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
          <div className="relative mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 sm:mt-14">
            {ready ? (
              <>
                <SignInLink size="lg" />
                <p className="max-w-xs text-sm text-muted">Read-only Microsoft sign-in. Leave the leaderboards anytime.</p>
              </>
            ) : (
              <XboxSetup />
            )}
          </div>
        </div>
      </section>

      <section id="board" className="shell scroll-mt-24">
        <Leaderboard />
      </section>
    </main>
  )
}
