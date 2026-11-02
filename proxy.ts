import { NextResponse, type NextRequest } from "next/server"
import { REFRESH_COOKIE, SESSION_COOKIE, SESSION_MAX_AGE, cookieOptions, seal, unseal, type XboxSession } from "@/lib/session"
import { SignInError, refreshSignIn } from "@/lib/xbox-auth"

// Server Components can read cookies but not write them, so the XSTS token is renewed here before a page renders.
const RENEW_BEFORE_MS = 5 * 60 * 1000

export async function proxy(request: NextRequest) {
  const sealedRefresh = request.cookies.get(REFRESH_COOKIE)?.value
  if (!sealedRefresh) return NextResponse.next()
  const session = unseal<XboxSession>(request.cookies.get(SESSION_COOKIE)?.value)
  if (session && session.expiresAt - RENEW_BEFORE_MS > Date.now()) return NextResponse.next()

  const refreshToken = unseal<string>(sealedRefresh)
  try {
    if (!refreshToken) throw new SignInError("expired")
    const next = await refreshSignIn(refreshToken)
    const sealedSession = seal(next.session)
    const sealedToken = seal(next.refreshToken)
    request.cookies.set(SESSION_COOKIE, sealedSession)
    request.cookies.set(REFRESH_COOKIE, sealedToken)
    const response = NextResponse.next({ request })
    response.cookies.set(SESSION_COOKIE, sealedSession, cookieOptions(SESSION_MAX_AGE))
    response.cookies.set(REFRESH_COOKIE, sealedToken, cookieOptions(SESSION_MAX_AGE))
    return response
  } catch (error) {
    // A network blip keeps the cookies for the next request; a revoked or unusable token signs the user out.
    if (error instanceof SignInError && error.reason === "failed") return NextResponse.next()
    request.cookies.delete(SESSION_COOKIE)
    request.cookies.delete(REFRESH_COOKIE)
    const response = NextResponse.next({ request })
    response.cookies.delete(SESSION_COOKIE)
    response.cookies.delete(REFRESH_COOKIE)
    return response
  }
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|icon.svg).*)"],
}
