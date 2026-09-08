# next-template

A personal Next.js template: [vinext](https://vinext.dev/) (Next.js on Vite) built for Cloudflare Workers via [@cloudflare/vite-plugin](https://github.com/cloudflare/workers-sdk) + [@vinext/cloudflare](https://vinext.dev/), with [Panda CSS](https://panda-css.com/) and type-safe env vars ([@t3-oss/env-nextjs](https://env.t3.gg/) + [valibot](https://valibot.dev/)).

## Starting from this template

Click **Use this template**, then:

1. **Bootstrap runs automatically.** On the first push to `main`, the
   `Template bootstrap` workflow rewrites every `next-template` /
   `next-template-staging` occurrence (`package.json`, `package-lock.json`,
   `wrangler.jsonc`, `src/app/page.tsx`, this README) to your repo name,
   commits it, and removes itself. Nothing to do by hand.

2. **Create the KV cache namespaces** (data cache binding `VINEXT_KV_CACHE`)
   and paste each returned `id` into `wrangler.jsonc`:

   ```
   npx wrangler kv namespace create VINEXT_KV_CACHE                # -> top-level "id"
   npx wrangler kv namespace create VINEXT_KV_CACHE --env staging  # -> env.staging "id"
   ```

   Auth first with `npx wrangler login`, or by exporting `CLOUDFLARE_API_TOKEN`
   (needs _Workers Scripts: Edit_ + _Workers KV Storage: Edit_) and
   `CLOUDFLARE_ACCOUNT_ID`.

3. **Env vars.** `.env.development` / `.env.staging` / `.env.production` are
   already committed with non-secret placeholder values, so `npm run dev`
   works out of the box. When you add a real secret
   (`npx dotenvx set API_KEY xxx -f .env.production`), the pre-commit guard
   refuses the plaintext and tells you to run:

   ```
   npm run env:encrypt
   ```

   That encrypts all three ([dotenvx](https://dotenvx.com/)) with a keypair
   unique to your repo and writes `.env.keys`. **`.env.keys` is gitignored —
   never commit it.** Store it in a password manager, and add the private keys
   as repo secrets (next step).

4. **Add repo secrets** (Settings → Secrets and variables → Actions):
   `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and — once you've run
   `env:encrypt` — from `.env.keys`: `DOTENV_PRIVATE_KEY_STAGING` +
   `DOTENV_PRIVATE_KEY_PRODUCTION` (`_DEVELOPMENT` stays local).

5. **Create the `staging` and `production` Environments** (Settings →
   Environments) — add protection rules / required reviewers here if wanted.

6. **Enable deploys:** set repo variable `ENABLE_DEPLOY` to `true`. Until then
   CD still runs `verify` on every push; the deploy jobs are skipped.

## CI/CD

`verify` (check + test + build ×2) lives in a reusable workflow
(`.github/workflows/verify.yml`) that both entry points call:

| Workflow          | Trigger                                   | Does                                                                                                              |
| ----------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **CI** (`ci.yml`) | pull request                              | `verify`                                                                                                          |
| **CD** (`cd.yml`) | push to `main` / `develop`, or manual run | `verify`, then deploy — `develop` → staging Worker, `main` → production Worker, each syncing Worker secrets after |

Checks run once per commit — CI on the PR, CD on the merge/push — never twice.
"Run workflow" on CD deploys whichever branch you launch it from.

While `.env.*` hold the template's plaintext placeholders, dotenvx reads them
without a key and CI needs no `DOTENV_PRIVATE_KEY_*` secrets. Once you run
`npm run env:encrypt`, `verify`'s two build steps need the `STAGING` +
`PRODUCTION` private keys as secrets (check/test skip env validation); deploy
jobs also need `ENABLE_DEPLOY=true` + the two Cloudflare secrets. Fork PRs get
no secrets and fail at the build step.

## Scripts

- `npm run dev` starts the vinext dev server (loads `.env.development`).
- `npm run build` builds the Worker + static assets into `dist/` (`.env.production`).
- `npm run build:staging` builds with `.env.staging` values.
- `npm run start` previews the built Worker locally with `wrangler dev` (regenerates `.dev.vars`).
- `npm run deploy` / `npm run deploy:staging` build and deploy to Cloudflare Workers.
- `npm run cf:secrets` / `npm run cf:secrets:staging` push the env file's vars to the deployed Worker as secrets (CI runs these after each deploy).
- `npm run env:encrypt` encrypts the three `.env.*` files in place (run it once you add a real secret).
- `npm run check` runs format + lint + typecheck (via Vite+/`vp`).
- `npm run lint` runs Oxlint on its own. The `lint` block in `vite.config.ts` enables the React, React Hooks, Next.js, and jsx-a11y plugins so coverage matches `eslint-config-next` (`next/core-web-vitals` + `next/typescript`), plus type-aware rules via tsgolint.
- `npm run test` runs the unit tests.
- `npm run typegen` generates App Router route helper types.
- `npm run compat` scans for Next.js API compatibility gaps.

## Environment variables

`.env.development` / `.env.staging` / `.env.production` (repo root) hold each
environment's config and are committed. The template ships them **plaintext**
with non-secret placeholders; add a real secret and the pre-commit guard forces
`npm run env:encrypt`, which encrypts all three with [dotenvx](https://dotenvx.com/)
using a repo-unique keypair (`.env.keys`, gitignored). Schema + validation is in
[`src/env.ts`](src/env.ts) (`@t3-oss/env-nextjs` + valibot).

- **Add / edit a value:** `npx dotenvx set KEY value -f .env.<env>` for each of
  the three (dotenvx `set` encrypts in place once the file is encrypted). Or
  `npx dotenvx decrypt -f .env.staging`, edit, `npx dotenvx encrypt -f .env.staging`.
- **All three files must carry the same keys** — differ in value only.
  `build:staging` still runs in vinext's `production` mode and reads
  `.env.production` for any key `dotenvx run` didn't already set, so a key
  missing from one file leaks its raw (possibly `encrypted:…`) string.
- **`dev` / `build` / `start` / `deploy` / `typegen`** wrap their command in
  `dotenvx run -f .env.<env>` (reads plaintext, or decrypts with `.env.keys`
  locally / `DOTENV_PRIVATE_KEY_<ENV>` in CI). `next.config.ts` does
  `import "@/env"`, so config load validates the values against
  [`src/env.ts`](src/env.ts).
- **`check` / `fmt` / `lint` / `test`** run with `SKIP_ENV_VALIDATION=1` — env
  validation isn't their job, and `build` still does it. Linting / testing /
  committing needs no keys.
- **Commit guard:** `".env*": "dotenvx ext precommit ."` in `staged`
  (`vite.config.ts`) rejects any staged plaintext `.env` file — this is what
  forces `npm run env:encrypt` once real values go in.
- **Cloudflare Worker runtime:** `dotenvx` only touches the local build process.
  `npm run cf:secrets[:staging]` pushes every var (public ones included, so
  server code can read them off `process.env`) to the deployed Worker via
  `wrangler secret bulk`; CI runs it after each deploy. Local `npm run start`
  regenerates `.dev.vars` from `.env.production` first.

## Deploying

Cloudflare setup (cache, image optimization, KV) lives in `wrangler.jsonc` and the `vinext()`/`cloudflare()` plugins in `vite.config.ts`. `wrangler.jsonc` holds the top-level (production) config plus an `env.staging` block; `npm run deploy:staging` builds it with `CLOUDFLARE_ENV=staging`. Named environments do **not** inherit `kv_namespaces` / `vars` / `routes`, so staging carries its own `name` + KV.

> **Note:** never let a `/` immediately followed by `*` appear in `vite.config.ts` above the `cloudflare()` call — `@vinext/cloudflare`'s deploy preflight scans the config as text and misreads it as a block-comment open, hiding the plugin and aborting the deploy.

Deploy manually with:

```
npm run deploy          # production
npm run deploy:staging  # staging
```
