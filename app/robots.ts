import type { MetadataRoute } from "next"

// Alpha: keep the site out of search engines until it's ready to be found.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } }
}
