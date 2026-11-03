import { XboxError, inspectAchievements } from "@/lib/xbox"

/** Local development only: GET /api/debug/xbox?gamertag=…&titleId=… shows raw achievement shapes per contract version. */
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") return new Response("Not found", { status: 404 })
  const { searchParams } = new URL(request.url)
  const titleId = searchParams.get("titleId") ?? undefined
  const gamertag = searchParams.get("gamertag")?.trim() || undefined
  try {
    return Response.json(await inspectAchievements({ titleId, gamertag }))
  } catch (error) {
    return Response.json({ error: error instanceof XboxError ? error.message : String(error) }, { status: 400 })
  }
}
