import type { MetadataRoute } from "next"

// Crawlers may fetch pages so link previews (X, Discord) work; the noindex meta tag in the layout keeps the alpha out of search results.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" } }
}
