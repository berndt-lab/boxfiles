"use client"

import { useActionState, useState } from "react"
import { saveMySocials } from "@/app/actions"
import { NETWORKS, type Socials } from "@/lib/socials"

/** "Edit links" on your own profile: a small form of handles, saved with a server action. */
export function SocialsEditor({ socials }: { socials: Socials }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(saveMySocials, null)
  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="label-mono rounded-full border border-dashed border-line-strong px-3 py-1.5 text-muted transition-colors hover:border-ambient/60 hover:text-foreground"
      >
        {open ? "Close" : Object.keys(socials).length > 0 ? "Edit links" : "+ Add your socials"}
      </button>
      {open && (
        <form action={action} className="material light-strip relative mt-3 max-w-xl overflow-hidden rounded-2xl border border-line p-4">
          <p className="text-sm text-muted">Handles only, no links. They show on your profile and public card.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {NETWORKS.map((network) => (
              <label key={network.key} className="block">
                <span className="label-mono text-faint">{network.label}</span>
                <input
                  name={network.key}
                  defaultValue={socials[network.key] ?? ""}
                  placeholder={network.key === "discord" ? "username" : "@handle"}
                  maxLength={80}
                  autoComplete="off"
                  spellCheck={false}
                  className="mt-1 h-10 w-full rounded-xl border border-line bg-white/[0.02] px-3 font-mono text-base sm:h-9 sm:text-[13px] text-foreground placeholder:text-faint focus:border-ambient/60 focus:outline-none"
                />
              </label>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="h-9 rounded-full bg-foreground px-4 text-sm font-medium text-background transition-opacity disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save links"}
            </button>
            {state && (
              <span role="status" className={`text-sm ${state.ok ? "text-ambient" : "text-red-300"}`}>
                {state.message}
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
