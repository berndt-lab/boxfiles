"use client"

import { useEffect } from "react"
import { applyAmbient, loadAmbient, rememberXboxColor } from "@/lib/ambient"

/** Remembers the signed-in player's Xbox color so ambient lighting can follow it, then relights the page. */
export function XboxAmbient({ color }: { color: string }) {
  useEffect(() => {
    rememberXboxColor(color)
    applyAmbient(loadAmbient())
  }, [color])
  return null
}
