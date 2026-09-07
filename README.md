# next-template

A personal Next.js template: [vinext](https://vinext.dev/) (Next.js on Vite) built for Cloudflare Workers via [@cloudflare/vite-plugin](https://github.com/cloudflare/workers-sdk) + [@vinext/cloudflare](https://vinext.dev/), with [Panda CSS](https://panda-css.com/) and type-safe env vars ([@t3-oss/env-nextjs](https://env.t3.gg/) + [valibot](https://valibot.dev/)).

## Starting from this template

Click **Use this template**, then:

1. **Bootstrap runs automatically.** On the first push to `main`, the
   `Template bootstrap` workflow rewrites every `next-template` /
   `next-template-staging` occurrence (`package.json`, `package-lock.json`,
   `wrangler.jsonc`, `src/app/page.tsx`, this README) to your repo name, then
   commits and deletes itself. Nothing to do by hand.

2. **Create the KV cache namespaces** (data cache binding `VINEXT_KV_CACHE`)
   and paste each returned `id` into `wrangler.jsonc`:

   ```
   npx wrangler kv namespace create VINEXT_KV_CACHE                # -> top-level "id"
   npx wrangler kv namespace create VINEXT_KV_CACHE --env staging  # -> env.staging "id"
   ```

   Auth first with `npx wrangler login`, or by exporting `CLOUDFLARE_API_TOKEN`
   (needs _Workers Scripts: Edit_ + _Workers KV Storage: Edit_) and
   `CLOUDFLARE_ACCOUNT_ID`.

3. **Add repo secrets** `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`
   (Settings → Secrets and variables → Actions).

4. **Create the `staging` and `production` Environments** (Settings →
   Environments) — add protection rules / required reviewers here if wanted.

5. **Enable deploys:** set repo variable `ENABLE_DEPLOY` to `true`. Until then
   the `verify` job still runs on every PR/push; the deploy jobs are skipped.

## CI/CD

`.github/workflows/ci.yml`:

| Trigger                             | Job                 | Result                                                       |
| ----------------------------------- | ------------------- | ------------------------------------------------------------ |
| every PR + push to `main`/`develop` | `verify`            | `npm run check` + `test` + `build`                           |
| push to `develop`                   | `deploy-staging`    | deploy to Worker `<name>-staging` (`wrangler --env staging`) |
| push to `main`                      | `deploy-production` | deploy to Worker `<name>`                                    |

Deploy jobs require `ENABLE_DEPLOY=true` and the two Cloudflare secrets.

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

Cloudflare setup (cache, image optimization, KV) lives in `wrangler.jsonc` and the `vinext()`/`cloudflare()` plugins in `vite.config.ts`. `wrangler.jsonc` holds the top-level (production) config plus an `env.staging` block; `npm run deploy -- --env staging` builds it with `CLOUDFLARE_ENV=staging`. Named environments do **not** inherit `kv_namespaces` / `vars` / `routes`, so staging carries its own `name` + KV.

> **Note:** never let a `/` immediately followed by `*` appear in `vite.config.ts` above the `cloudflare()` call — `@vinext/cloudflare`'s deploy preflight scans the config as text and misreads it as a block-comment open, hiding the plugin and aborting the deploy.

Deploy manually with:

```
npm run deploy                 # production
npm run deploy -- --env staging # staging
```
