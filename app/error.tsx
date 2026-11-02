"use client"

import Link from "next/link"
import { useEffect } from "react"

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:pt-20">
      <h1 className="max-w-2xl font-display text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        Xbox Live may be slow or briefly unavailable. Try again, or head back to the start.
      </p>
      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={() => retry()}
          className="h-9 rounded-full bg-foreground px-4 text-sm font-medium text-background transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-95"
        >
          Try again
        </button>
        <Link
          href="/"
          className="grid h-9 place-items-center rounded-full border border-line px-4 text-sm text-muted transition-colors hover:border-line-strong hover:text-foreground"
        >
          Home
        </Link>
      </div>
    </main>
  )
}
