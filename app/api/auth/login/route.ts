import { randomBytes } from "node:crypto"
import { NextResponse, type NextRequest } from "next/server"
import { STATE_COOKIE, cookieOptions } from "@/lib/session"
import { authConfigured, authorizeUrl } from "@/lib/xbox-auth"

export function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  if (!authConfigured()) return NextResponse.redirect(new URL("/?signin=config", origin))
  const state = randomBytes(16).toString("base64url")
  const response = NextResponse.redirect(authorizeUrl(origin, state))
  response.cookies.set(STATE_COOKIE, state, cookieOptions(10 * 60))
  return response
}
