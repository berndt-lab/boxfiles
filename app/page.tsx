import { Suspense } from "react"
import { Dashboard } from "@/components/dashboard"
import { Landing } from "@/components/landing"
import { currentSession } from "@/lib/xbox"
import { signInMessage } from "@/lib/xbox-auth"

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent searchParams={searchParams} />
    </Suspense>
  )
}

async function HomeContent({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const [{ signin }, session] = await Promise.all([searchParams, currentSession()])
  const problem = signInMessage(typeof signin === "string" ? signin : undefined)
  const notice = problem ? (
    <p
      role="alert"
      className="mb-6 mt-6 max-w-xl rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200"
    >
      {problem}
    </p>
  ) : null
  return session ? <Dashboard session={session} notice={notice} /> : <Landing notice={notice} />
}

function HomeSkeleton() {
  return (
    <main className="shell pb-10 pt-14 sm:pt-20" aria-label="Loading">
      <span className="block h-12 w-full max-w-xl animate-pulse rounded-2xl bg-card" />
      <span className="mt-4 block h-5 w-full max-w-md animate-pulse rounded-full bg-card" />
    </main>
  )
}
