import { NextResponse, type NextRequest } from "next/server"
import { REFRESH_COOKIE, SESSION_COOKIE, SESSION_MAX_AGE, STATE_COOKIE, cookieOptions, seal } from "@/lib/session"
import { SignInError, signInWithCode, type SignInReason } from "@/lib/xbox-auth"

export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl
  const fail = (reason: SignInReason) => {
    const response = NextResponse.redirect(new URL(`/?signin=${reason}`, origin))
    response.cookies.delete(STATE_COOKIE)
    return response
  }

  if (searchParams.get("error")) return fail("denied")
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  if (!code || !state || state !== request.cookies.get(STATE_COOKIE)?.value) return fail("expired")

  try {
    const { session, refreshToken } = await signInWithCode(code, origin)
    const response = NextResponse.redirect(new URL(`/u/${encodeURIComponent(session.gamertag)}`, origin))
    response.cookies.set(SESSION_COOKIE, seal(session), cookieOptions(SESSION_MAX_AGE))
    response.cookies.set(REFRESH_COOKIE, seal(refreshToken), cookieOptions(SESSION_MAX_AGE))
    response.cookies.delete(STATE_COOKIE)
    return response
  } catch (error) {
    return fail(error instanceof SignInError ? error.reason : "failed")
  }
}
