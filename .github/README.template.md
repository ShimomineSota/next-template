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

2. **Env vars:** `.env.development` / `.env.staging` / `.env.production` are
   already committed with placeholder values. Add a real secret
   (`npx dotenvx set KEY val -f .env.<env>`) and the pre-commit guard forces
   `npm run env:encrypt`, which encrypts all three and writes `.env.keys`
   (gitignored — store it in a password manager, never commit).

3. **Add repo secrets** (Settings → Secrets and variables → Actions):
   `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and — after `env:encrypt` —
   from `.env.keys`: `DOTENV_PRIVATE_KEY_STAGING` + `DOTENV_PRIVATE_KEY_PRODUCTION`
   (`_DEVELOPMENT` stays local).

4. **Create the `staging` and `production` Environments** (Settings → Environments).

5. **Enable deploys:** set repo variable `ENABLE_DEPLOY` to `true`. Until then CD
   still runs `verify` on every push; the deploy jobs are skipped.

## CI/CD

`verify` (check + test + build ×2) is a reusable workflow (`verify.yml`) called
by both entry points:

| Workflow          | Trigger                            | Does                                                                                            |
| ----------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| **CI** (`ci.yml`) | pull request                       | `verify`                                                                                        |
| **CD** (`cd.yml`) | push to `main` / `develop`, manual | `verify`, then deploy — `develop` → `{{SLUG}}-staging`, `main` → `{{SLUG}}`, sync secrets after |

Checks run once per commit (CI on the PR, CD on the merge), never twice.

## Scripts

- `npm run dev` — vinext dev server (`.env.development`)
- `npm run build` / `build:staging` — build the Worker + static assets into `dist/`
- `npm run start` — preview the built Worker locally with `wrangler dev`
- `npm run deploy` / `deploy:staging` — build + deploy to Cloudflare Workers
- `npm run cf:secrets` / `cf:secrets:staging` — push env vars to the deployed Worker
- `npm run env:encrypt` — encrypt the three `.env.*` files (run once a real secret goes in)
- `npm run check` — format + lint + typecheck (Vite+/`vp`)
- `npm run test` — unit tests
- `npm run typegen` — App Router route helper types
- `npm run compat` — scan for Next.js API compatibility gaps

## Environment variables

`.env.development` / `.env.staging` / `.env.production` are committed — plaintext
placeholders in the fresh template, [dotenvx](https://dotenvx.com/)-encrypted
once you `npm run env:encrypt` (`.env.keys` gitignored). Schema in
[`src/env.ts`](src/env.ts). Set values with `npx dotenvx set KEY value -f
.env.<env>` per environment (all three must carry the same keys); the `.env*`
pre-commit guard blocks any plaintext `.env` with real content. `dev` / `build`
/ `deploy` load via `dotenvx run` (`DOTENV_PRIVATE_KEY_*` secrets in CI once
encrypted); `check` / `test` run with `SKIP_ENV_VALIDATION`. `npm run
cf:secrets*` pushes the values into the deployed Worker runtime.

## Notes

- `wrangler.jsonc` has the top-level (production) config plus an `env.staging`
  block. Named environments do **not** inherit `kv_namespaces` / `vars` /
  `routes`, so staging repeats what it needs.
- Never let a `/` immediately followed by `*` appear in `vite.config.ts` above
  the `cloudflare()` call — `@vinext/cloudflare`'s deploy preflight scans the
  config as text and misreads it as a block-comment open, hiding the plugin and
  aborting the deploy.
