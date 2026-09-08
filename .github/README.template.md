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

2. **Encrypt the env files:** `npm run env:encrypt` encrypts
   `.env.development` / `.env.staging` / `.env.production` in place and writes
   `.env.keys` (gitignored — store it in a password manager, never commit).

3. **Add repo secrets** (Settings → Secrets and variables → Actions):
   `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and from `.env.keys`:
   `DOTENV_PRIVATE_KEY_DEVELOPMENT`, `DOTENV_PRIVATE_KEY_STAGING`,
   `DOTENV_PRIVATE_KEY_PRODUCTION`.

4. **Create the `staging` and `production` Environments** (Settings → Environments).

5. **Enable deploys:** set repo variable `ENABLE_DEPLOY` to `true`. Until then the
   `verify` job still runs on every PR/push; the deploy jobs are skipped.

## CI/CD

| Trigger                             | Job                 | Result                                          |
| ----------------------------------- | ------------------- | ----------------------------------------------- |
| every PR + push to `main`/`develop` | `verify`            | `check` + `test` + `build` (prod & staging)     |
| push to `develop`                   | `deploy-staging`    | deploy Worker `{{SLUG}}-staging` + sync secrets |
| push to `main`                      | `deploy-production` | deploy Worker `{{SLUG}}` + sync secrets         |

## Scripts

- `npm run dev` — vinext dev server (`.env.development`)
- `npm run build` / `build:staging` — build the Worker + static assets into `dist/`
- `npm run start` — preview the built Worker locally with `wrangler dev`
- `npm run deploy` / `deploy:staging` — build + deploy to Cloudflare Workers
- `npm run cf:secrets` / `cf:secrets:staging` — push env vars to the deployed Worker
- `npm run env:encrypt` — (re-)encrypt the three `.env.*` files
- `npm run check` — format + lint + typecheck (Vite+/`vp`)
- `npm run test` — unit tests
- `npm run typegen` — App Router route helper types
- `npm run compat` — scan for Next.js API compatibility gaps

## Environment variables

`.env.development` / `.env.staging` / `.env.production` are encrypted with
[dotenvx](https://dotenvx.com/) and committed; `.env.keys` is gitignored.
Schema in [`src/env.ts`](src/env.ts). Edit with
`npx dotenvx set KEY value -f .env.<env>` (per environment — all three files
must carry the same keys). Every `npm run` script decrypts via `dotenvx run`;
CI uses the `DOTENV_PRIVATE_KEY_*` secrets. `npm run cf:secrets*` bridges the
values into the deployed Worker runtime.

## Notes

- `wrangler.jsonc` has the top-level (production) config plus an `env.staging`
  block. Named environments do **not** inherit `kv_namespaces` / `vars` /
  `routes`, so staging repeats what it needs.
- Never let a `/` immediately followed by `*` appear in `vite.config.ts` above
  the `cloudflare()` call — `@vinext/cloudflare`'s deploy preflight scans the
  config as text and misreads it as a block-comment open, hiding the plugin and
  aborting the deploy.
