"use client"

import Link from "next/link"
import { useEffect } from "react"

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="shell pb-10 pt-14 sm:pt-20">
      <p className="label-mono text-muted">(Error) Something broke</p>
      <h1 className="display-em mt-6 max-w-4xl font-display text-5xl font-semibold leading-[0.92] tracking-[-0.05em] sm:text-8xl">
        That didn&apos;t <em>load</em>.
      </h1>
      <p className="mt-5 max-w-xl text-lg text-muted">
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
