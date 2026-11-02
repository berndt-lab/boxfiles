import { leaderboardReady } from "@/lib/leaderboard"
import { authConfigured } from "@/lib/xbox-auth"

export function XboxSetup() {
  if (authConfigured()) return <SignInCard />
  const steps = [
    <>
      In the{" "}
      <a
        className="text-foreground underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-white"
        href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
        target="_blank"
        rel="noreferrer"
      >
        Azure portal
      </a>
      , register an app for <em>personal Microsoft accounts only</em> with the Web redirect URI{" "}
      <Code>http://localhost:3000/api/auth/callback</Code>.
    </>,
    <>Under Certificates &amp; secrets, create a client secret.</>,
    <>
      Save <Code>XBOX_CLIENT_ID</Code>, <Code>XBOX_CLIENT_SECRET</Code>, and a random 32+ character{" "}
      <Code>SESSION_SECRET</Code> in <Code>.env.local</Code>.
    </>,
    <>
      Restart <Code>npm run dev</Code> and sign in with Xbox.
    </>,
  ]
  return (
    <section className="max-w-xl rounded-2xl border border-line bg-card p-5">
      <h2 className="font-medium">Set up Xbox sign-in</h2>
      <p className="mt-1 text-sm text-muted">Until then, the sample players below show how a profile looks.</p>
      <ol className="mt-4 space-y-3">
        {steps.map((step, index) => (
          <li key={index} className="flex gap-3 text-sm text-muted">
            <span className="grid size-5 shrink-0 place-items-center rounded-full border border-line-strong text-[11px] tabular-nums text-foreground">
              {index + 1}
            </span>
            <span className="pt-px">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function SignInCard() {
  return (
    <section className="flex max-w-xl flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-card p-5">
      <div className="min-w-0">
        <h2 className="font-medium">Sign in with Xbox</h2>
        <p className="mt-1 text-sm text-muted">See your own gamerscore and look up any gamertag with live data.</p>
        {leaderboardReady() && (
          <p className="mt-2 text-xs text-faint">
            Signing in puts your gamertag and gamerscore on the public leaderboard. You can leave it anytime.
          </p>
        )}
      </div>
      <SignInLink />
    </section>
  )
}

export function SignInLink({ compact = false }: { compact?: boolean }) {
  return (
    // A plain anchor: the login route answers with a redirect to Microsoft, which client navigation can't follow.
    <a
      href="/api/auth/login"
      className={`inline-flex shrink-0 items-center gap-2 rounded-full bg-[#107c10] font-medium text-white transition-[filter,transform] duration-150 hover:brightness-110 active:scale-95 ${
        compact ? "h-9 px-3.5 text-sm" : "h-10 px-4 text-sm"
      }`}
    >
      <XboxMark />
      Sign in
    </a>
  )
}

function XboxMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M7 6.5c2.4 1.6 4 3.4 5 5.5 1-2.1 2.6-3.9 5-5.5M6.5 18c1.5-2.6 3.3-4.6 5.5-6 2.2 1.4 4 3.4 5.5 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded-md bg-raised px-1.5 py-0.5 text-[0.85em] text-foreground">{children}</code>
}
