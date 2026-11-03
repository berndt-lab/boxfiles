import { XboxError, lookupBaseComplete } from "@/lib/xbox"

/** ?xuid=…&titleIds=1,2,3 → the titles whose main game is finished while DLC achievements remain. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const xuid = searchParams.get("xuid") ?? ""
  const titleIds = (searchParams.get("titleIds") ?? "").split(",").filter(Boolean)
  try {
    return Response.json({ titleIds: await lookupBaseComplete(xuid, titleIds) })
  } catch (error) {
    const message = error instanceof XboxError ? error.message : "Could not check games."
    return Response.json({ error: message }, { status: message.includes("Sign in") ? 401 : 400 })
  }
}
