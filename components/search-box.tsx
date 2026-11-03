"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowIcon } from "@/components/ui"

type Action = (formData: FormData) => void | Promise<void>

/** Gamertag search: an inline field on wider screens, a search button that opens a full-width bar on phones. */
export function SearchBox({ action }: { action: Action }) {
  const [open, setOpen] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    input.current?.focus()
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", escape)
    return () => document.removeEventListener("keydown", escape)
  }, [open])

  return (
    <>
      <form action={action} className="ml-auto hidden min-w-0 flex-1 justify-end sm:flex sm:max-w-xs">
        <Field />
      </form>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Find a gamertag"
        className="ml-auto grid size-9 shrink-0 place-items-center rounded-full border border-line text-muted transition-colors hover:text-foreground sm:hidden"
      >
        {open ? <CloseIcon /> : <SearchIcon className="size-4" />}
      </button>

      {open && (
        <form
          action={(formData) => {
            setOpen(false)
            return action(formData)
          }}
          className="absolute inset-x-0 top-full border-b border-line bg-background/95 px-5 py-3 backdrop-blur-2xl sm:hidden"
        >
          <Field inputRef={input} large />
        </form>
      )}
    </>
  )
}

function Field({ inputRef, large = false }: { inputRef?: React.Ref<HTMLInputElement>; large?: boolean }) {
  return (
    <label
      className={`group relative flex w-full items-center rounded-full border border-line bg-white/[0.02] pl-3 pr-1 transition-[border-color,box-shadow] duration-200 focus-within:border-ambient/50 focus-within:shadow-[0_0_18px_rgb(var(--ambient)/0.25)] ${
        large ? "h-12" : "h-9"
      }`}
    >
      <SearchIcon className="size-4 shrink-0 text-faint transition-colors group-focus-within:text-muted" />
      <span className="sr-only">Gamertag</span>
      <input
        ref={inputRef}
        name="gamertag"
        required
        placeholder="Find a gamertag"
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="search"
        className="h-full min-w-0 flex-1 bg-transparent px-2 font-mono text-base text-foreground placeholder:text-faint focus:outline-none sm:text-[13px]"
      />
      <button
        type="submit"
        aria-label="View profile"
        className={`grid shrink-0 place-items-center rounded-full bg-foreground text-background transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-95 ${
          large ? "size-10" : "size-7"
        }`}
      >
        <ArrowIcon className="size-3.5" />
      </button>
    </label>
  )
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
      <path d="m4 4 8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
