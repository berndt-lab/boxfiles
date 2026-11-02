# xboxprofiles

Show off Xbox achievements: gamerscore, game completion, and how rare each unlock is. Visitors sign in with their
Microsoft account, and the app reads Xbox Live directly with their own token. Signed-in players appear on a public
leaderboard ranked by gamerscore, and can leave it anytime.

Fan-made and independent of Microsoft. Alpha: the site asks search engines not to index it.

## Local development

```bash
pnpm install
cp .env.example .env.local   # then fill it in, see below
pnpm dev
```

Open http://localhost:3000. Without leaderboard storage, the home page shows demo players instead of real rankings.

Checks: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm check`, `pnpm build`. CI runs the same on every push.

## Xbox sign-in (Azure app registration)

1. In the [Azure portal](https://portal.azure.com) → App registrations → **New registration**.
2. Supported account types: **Personal Microsoft accounts only**.
3. Redirect URI, platform **Web**: `http://localhost:3000/api/auth/callback`. Add your production URL here too,
   for example `https://your-app.vercel.app/api/auth/callback`.
4. Copy **Application (client) ID** into `XBOX_CLIENT_ID`.
5. Certificates & secrets → **New client secret**; copy its **Value** into `XBOX_CLIENT_SECRET`.
6. Set `SESSION_SECRET` to a random string of 32+ characters:
   `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`

Client secrets expire (up to 24 months). Put a reminder in your calendar to rotate it.

## Leaderboard storage (Upstash Redis)

The leaderboard lives in Upstash Redis, reached over its REST API. Either set of variables works:

- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, from the Upstash console, or
- `KV_REST_API_URL` and `KV_REST_API_TOKEN`, which the Vercel Marketplace integration sets for you.

A player's row is written when they view their own profile, and the board refreshes within about a minute.

## Deploy on Vercel

1. Sign in to [Vercel](https://vercel.com) with the GitHub account that owns this repo and import it.
2. Storage → add **Upstash for Redis** from the Marketplace and connect it to the project.
3. Settings → Environment Variables: add `XBOX_CLIENT_ID`, `XBOX_CLIENT_SECRET`, `SESSION_SECRET`, and
   `XBOX_REDIRECT_URI=https://<your-domain>/api/auth/callback`.
4. Add that same redirect URI to the Azure app registration, then redeploy.
