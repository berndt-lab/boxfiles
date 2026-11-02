import { XboxError, lookupAchievements } from "@/lib/xbox"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const xuid = searchParams.get("xuid") ?? ""
  const titleId = searchParams.get("titleId") ?? ""
  try {
    const achievements = await lookupAchievements(xuid, titleId)
    return Response.json({ achievements })
  } catch (error) {
    const message = error instanceof XboxError ? error.message : "Could not load achievements."
    const status = message.includes("rate limit")
      ? 429
      : message.includes("Sign in")
        ? 401
        : message.includes("privacy")
          ? 403
          : 400
    return Response.json({ error: message }, { status })
  }
}
