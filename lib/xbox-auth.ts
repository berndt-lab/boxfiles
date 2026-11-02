import type { XboxSession } from "@/lib/session"

// Microsoft account OAuth, then the Xbox Live user token, then an XSTS token for xboxlive.com.
const AUTHORIZE_URL = "https://login.live.com/oauth20_authorize.srf"
const TOKEN_URL = "https://login.live.com/oauth20_token.srf"
const USER_AUTH_URL = "https://user.auth.xboxlive.com/user/authenticate"
const XSTS_URL = "https://xsts.auth.xboxlive.com/xsts/authorize"
const SCOPE = "Xboxlive.signin Xboxlive.offline_access"

export type SignInReason = "config" | "denied" | "expired" | "noxbox" | "child" | "region" | "adult" | "failed"

const reasons: Record<SignInReason, string> = {
  config: "Xbox sign-in isn't set up on this server yet.",
  denied: "Sign-in was cancelled.",
  expired: "That sign-in attempt expired. Try again.",
  noxbox: "This Microsoft account has no Xbox profile yet. Sign in once at xbox.com to create one.",
  child: "Child accounts need an adult to add them to a Microsoft family first.",
  region: "Xbox Live isn't available in this account's country.",
  adult: "This account needs adult verification on xbox.com before it can sign in.",
  failed: "Xbox sign-in failed. Try again in a moment.",
}

export function signInMessage(reason: string | undefined) {
  return reason && reason in reasons ? reasons[reason as SignInReason] : null
}

export class SignInError extends Error {
  readonly reason: SignInReason

  constructor(reason: SignInReason) {
    super(reasons[reason])
    this.reason = reason
    this.name = "SignInError"
  }
}

function clientId() {
  return process.env.XBOX_CLIENT_ID?.trim() ?? ""
}

function clientSecret() {
  return process.env.XBOX_CLIENT_SECRET?.trim() ?? ""
}

export function authConfigured() {
  return Boolean(clientId() && clientSecret() && (process.env.SESSION_SECRET?.trim().length ?? 0) >= 32)
}

export function redirectUri(origin: string) {
  return process.env.XBOX_REDIRECT_URI?.trim() || `${origin}/api/auth/callback`
}

export function authorizeUrl(origin: string, state: string) {
  const url = new URL(AUTHORIZE_URL)
  url.search = new URLSearchParams({
    client_id: clientId(),
    response_type: "code",
    redirect_uri: redirectUri(origin),
    scope: SCOPE,
    state,
    prompt: "select_account",
  }).toString()
  return url.toString()
}

export type SignIn = { session: XboxSession; refreshToken: string }

export async function signInWithCode(code: string, origin: string): Promise<SignIn> {
  return xboxSignIn(
    await msaToken({ grant_type: "authorization_code", code, redirect_uri: redirectUri(origin) }),
  )
}

export async function refreshSignIn(refreshToken: string): Promise<SignIn> {
  return xboxSignIn(await msaToken({ grant_type: "refresh_token", refresh_token: refreshToken }))
}

async function msaToken(params: Record<string, string>) {
  if (!clientId() || !clientSecret()) throw new SignInError("config")
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({ client_id: clientId(), client_secret: clientSecret(), scope: SCOPE, ...params }),
    cache: "no-store",
  })
  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null
  const accessToken = body?.access_token
  const refreshToken = body?.refresh_token
  if (response.ok && typeof accessToken === "string" && typeof refreshToken === "string") {
    return { accessToken, refreshToken }
  }
  // invalid_grant: the code or refresh token is used up or revoked.
  throw new SignInError(body?.error === "invalid_grant" ? "expired" : "failed")
}

async function xboxSignIn({ accessToken, refreshToken }: { accessToken: string; refreshToken: string }): Promise<SignIn> {
  const user = await xblPost(USER_AUTH_URL, {
    RelyingParty: "http://auth.xboxlive.com",
    TokenType: "JWT",
    Properties: { AuthMethod: "RPS", SiteName: "user.auth.xboxlive.com", RpsTicket: `d=${accessToken}` },
  })
  const xsts = await xblPost(XSTS_URL, {
    RelyingParty: "http://xboxlive.com",
    TokenType: "JWT",
    Properties: { SandboxId: "RETAIL", UserTokens: [user.token] },
  })
  const claims = xsts.claims
  const xuid = typeof claims.xid === "string" ? claims.xid : ""
  const gamertag = typeof claims.gtg === "string" ? claims.gtg : ""
  const uhs = typeof claims.uhs === "string" ? claims.uhs : ""
  if (!xuid || !gamertag || !uhs) throw new SignInError("noxbox")
  return {
    session: { xuid, gamertag, uhs, xsts: xsts.token, expiresAt: xsts.expiresAt },
    refreshToken,
  }
}

const xerr: Record<string, SignInReason> = {
  "2148916233": "noxbox",
  "2148916235": "region",
  "2148916236": "adult",
  "2148916237": "adult",
  "2148916238": "child",
}

async function xblPost(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "x-xbl-contract-version": "1" },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null
  if (!response.ok || typeof data?.Token !== "string") {
    throw new SignInError(xerr[String(data?.XErr ?? "")] ?? "failed")
  }
  const displayClaims = data.DisplayClaims as { xui?: Record<string, unknown>[] } | undefined
  const notAfter = Date.parse(typeof data.NotAfter === "string" ? data.NotAfter : "")
  return {
    token: data.Token,
    claims: displayClaims?.xui?.[0] ?? {},
    expiresAt: Number.isFinite(notAfter) ? notAfter : Date.now() + 60 * 60 * 1000,
  }
}
