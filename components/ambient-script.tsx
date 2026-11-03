"use client"

import { useSyncExternalStore } from "react"
import { AMBIENT_SCRIPT } from "@/lib/ambient"

function subscribeNothing() {
  return () => {}
}

/**
 * The saved ambient lighting, applied by an inline script before first paint. The script exists only in the server
 * HTML and during hydration, where the browser runs it; React never creates it on the client, where it couldn't run.
 */
export function AmbientScript() {
  const fromServer = useSyncExternalStore(subscribeNothing, () => false, () => true)
  return fromServer ? <script dangerouslySetInnerHTML={{ __html: AMBIENT_SCRIPT }} /> : null
}
