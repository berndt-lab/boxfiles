# boxfiles

The achievement hunter's companion for Xbox. Sign in with a Microsoft account and boxfiles reads Xbox Live with your own
token to show:

- **Up next**: locked achievements most players already have, from the games you're closest to finishing.
- **Almost done**: your games nearest 100%, with the gamerscore left in each.
- **Friends**: you and your Xbox friends ranked by gamerscore, and how much you need to pass the next one.
- **Recent unlocks** and full per-game achievement lists with rarity.
- **A shareable profile**: signed-out visitors see a public card, and links unfurl with a generated preview image.

Signed-in players join a global leaderboard and can leave it anytime, which also turns off their public card.

Fan-made and independent of Microsoft. Alpha: pages carry `noindex`, so search engines leave it out.

## Local development

```bash
pnpm install
cp .env.example .env.local   # then fill it in, see below
pnpm dev
```

Open http://localhost:3000. Without leaderboard storage the app still works; the global leaderboard, ranks, and public
profile cards are simply hidden.

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
