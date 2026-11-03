"use server"

import { refresh } from "next/cache"
import { leaderboardReady, saveSocials } from "@/lib/leaderboard"
import { cleanSocials } from "@/lib/socials"
import { currentSession } from "@/lib/xbox"

export type SocialsState = { ok: boolean; message: string } | null

/** Saves the signed-in player's social handles. Re-reads the session, so nobody can edit another profile. */
export async function saveMySocials(_previous: SocialsState, formData: FormData): Promise<SocialsState> {
  const session = await currentSession()
  if (!session) return { ok: false, message: "Sign in again to edit your links." }
  if (!leaderboardReady()) return { ok: false, message: "Links aren't available on this server yet." }
  try {
    await saveSocials(session.xuid, cleanSocials(Object.fromEntries(formData)))
  } catch {
    return { ok: false, message: "Couldn't save right now. Try again." }
  }
  refresh()
  return { ok: true, message: "Saved." }
}
