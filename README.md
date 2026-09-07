# next-template

A personal Next.js template: [vinext](https://vinext.dev/) (Next.js on Vite) built for Cloudflare Workers via [@cloudflare/vite-plugin](https://github.com/cloudflare/workers-sdk) + [@vinext/cloudflare](https://vinext.dev/), with [Panda CSS](https://panda-css.com/) and type-safe env vars ([@t3-oss/env-nextjs](https://env.t3.gg/) + [valibot](https://valibot.dev/)).

## Scripts

- `npm run dev` starts the vinext dev server.
- `npm run build` builds the Worker + static assets into `dist/`.
- `npm run start` previews the built Worker locally with `wrangler dev`.
- `npm run deploy` builds and deploys to Cloudflare Workers via `wrangler`.
- `npm run check` runs format + lint + typecheck (via Vite+/`vp`).
- `npm run lint` runs Oxlint on its own. The `lint` block in `vite.config.ts` enables the React, React Hooks, Next.js, and jsx-a11y plugins so coverage matches `eslint-config-next` (`next/core-web-vitals` + `next/typescript`), plus type-aware rules via tsgolint.
- `npm run test` runs the unit tests.
- `npm run typegen` generates App Router route helper types.
- `npm run compat` scans for Next.js API compatibility gaps.

## Deploying

Cloudflare setup (cache, image optimization, KV) lives in `wrangler.jsonc` and the `vinext()`/`cloudflare()` plugins in `vite.config.ts`. Data caching uses a KV namespace (`VINEXT_KV_CACHE`) — before the first deploy, create it and copy the returned id into `wrangler.jsonc`:

```
npx wrangler kv namespace create VINEXT_KV_CACHE
```

Then deploy with:

```
npm run deploy
```
