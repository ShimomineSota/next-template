# {{REPO_NAME}}

Bootstrapped from [next-template](https://github.com/ShimomineSota/next-template) —
[vinext](https://vinext.dev/) (Next.js on Vite) on Cloudflare Workers, with
[Panda CSS](https://panda-css.com/) and type-safe env vars
([@t3-oss/env-nextjs](https://env.t3.gg/) + [valibot](https://valibot.dev/)).

## Setup

1. **Create the KV cache namespaces** and paste each returned `id` into `wrangler.jsonc`:

   ```
   npx wrangler kv namespace create VINEXT_KV_CACHE                # -> top-level "id"
   npx wrangler kv namespace create VINEXT_KV_CACHE --env staging  # -> env.staging "id"
   ```

   Auth first with `npx wrangler login`, or by exporting `CLOUDFLARE_API_TOKEN`
   (_Workers Scripts: Edit_ + _Workers KV Storage: Edit_) and `CLOUDFLARE_ACCOUNT_ID`.

2. **Add repo secrets** `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`
   (Settings → Secrets and variables → Actions).

3. **Create the `staging` and `production` Environments** (Settings → Environments).

4. **Enable deploys:** set repo variable `ENABLE_DEPLOY` to `true`. Until then the
   `verify` job still runs on every PR/push; the deploy jobs are skipped.

## CI/CD

| Trigger                             | Job                 | Result                              |
| ----------------------------------- | ------------------- | ----------------------------------- |
| every PR + push to `main`/`develop` | `verify`            | `npm run check` + `test` + `build`  |
| push to `develop`                   | `deploy-staging`    | deploy to Worker `{{SLUG}}-staging` |
| push to `main`                      | `deploy-production` | deploy to Worker `{{SLUG}}`         |

## Scripts

- `npm run dev` — vinext dev server
- `npm run build` — build the Worker + static assets into `dist/`
- `npm run start` — preview the built Worker locally with `wrangler dev`
- `npm run deploy` — build + deploy to Cloudflare Workers (`-- --env staging` for staging)
- `npm run check` — format + lint + typecheck (Vite+/`vp`)
- `npm run test` — unit tests
- `npm run typegen` — App Router route helper types
- `npm run compat` — scan for Next.js API compatibility gaps

## Notes

- `wrangler.jsonc` has the top-level (production) config plus an `env.staging`
  block. Named environments do **not** inherit `kv_namespaces` / `vars` /
  `routes`, so staging repeats what it needs.
- Never let a `/` immediately followed by `*` appear in `vite.config.ts` above
  the `cloudflare()` call — `@vinext/cloudflare`'s deploy preflight scans the
  config as text and misreads it as a block-comment open, hiding the plugin and
  aborting the deploy.
