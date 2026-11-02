import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"

export const SESSION_COOKIE = "xp_session"
export const REFRESH_COOKIE = "xp_refresh"
export const STATE_COOKIE = "xp_oauth_state"

/** Microsoft refresh tokens last about 90 days; the cookies follow them. */
export const SESSION_MAX_AGE = 90 * 24 * 60 * 60

export type XboxSession = {
  xuid: string
  gamertag: string
  /** User hash from the XSTS token, part of the XBL3.0 header. */
  uhs: string
  xsts: string
  /** Epoch ms when the XSTS token stops working. */
  expiresAt: number
}

function key() {
  const secret = process.env.SESSION_SECRET?.trim()
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters.")
  return createHash("sha256").update(secret).digest()
}

export function seal(value: unknown) {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key(), iv)
  const body = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url")
}

export function unseal<T>(sealed: string | undefined): T | null {
  if (!sealed) return null
  try {
    const raw = Buffer.from(sealed, "base64url")
    const decipher = createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12))
    decipher.setAuthTag(raw.subarray(12, 28))
    const text = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8")
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  }
}
