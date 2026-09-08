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

3. **Create the env files.** The template ships only `.env.example`. Generate
   your own per-env files (each encrypted with a keypair unique to this repo):

   ```
   npm run env:init
   ```

   This seeds `.env.development` / `.env.staging` / `.env.production` from
   `.env.example`, encrypts them ([dotenvx](https://dotenvx.com/)), and writes
   `.env.keys`. **`.env.keys` is gitignored — never commit it.** Store it in a
   password manager; you need it to run `npm run dev` / `build` locally. Then
   commit the ciphertext (gitignored by default, so force the first add):

   ```
   git add -f .env.development .env.staging .env.production
   ```

   Set real values later with `npx dotenvx set KEY val -f .env.<env>`.

4. **Add repo secrets** (Settings → Secrets and variables → Actions):
   `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and from `.env.keys`:
   `DOTENV_PRIVATE_KEY_STAGING` + `DOTENV_PRIVATE_KEY_PRODUCTION` (CI only
   decrypts for the staging/production builds; `_DEVELOPMENT` stays local).

5. **Create the `staging` and `production` Environments** (Settings →
   Environments) — add protection rules / required reviewers here if wanted.

6. **Enable deploys:** set repo variable `ENABLE_DEPLOY` to `true`. Until then
   the `verify` job still runs on every PR/push; the deploy jobs are skipped.

## CI/CD

`.github/workflows/ci.yml`:

| Trigger                             | Job                 | Result                                                      |
| ----------------------------------- | ------------------- | ----------------------------------------------------------- |
| every PR + push to `main`/`develop` | `verify`            | `npm run check` + `test` + `build` (production & staging)   |
| push to `develop`                   | `deploy-staging`    | deploy to Worker `<name>-staging`, then sync Worker secrets |
| push to `main`                      | `deploy-production` | deploy to Worker `<name>`, then sync Worker secrets         |

Every job runs `npm run env:init` first — a no-op once the encrypted `.env.*`
files are committed, otherwise it mints a throwaway keypair so the bare template
still builds. Once you commit real encrypted values, `verify` needs
`DOTENV_PRIVATE_KEY_STAGING` + `_PRODUCTION` for its two build steps (check/test
run with `SKIP_ENV_VALIDATION`); deploy jobs also need `ENABLE_DEPLOY=true` + the
two Cloudflare secrets. Fork PRs get no secrets and fail at the build step.

## Scripts

- `npm run dev` starts the vinext dev server (loads `.env.development`).
- `npm run build` builds the Worker + static assets into `dist/` (`.env.production`).
- `npm run build:staging` builds with `.env.staging` values.
- `npm run start` previews the built Worker locally with `wrangler dev` (regenerates `.dev.vars`).
- `npm run deploy` / `npm run deploy:staging` build and deploy to Cloudflare Workers.
- `npm run cf:secrets` / `npm run cf:secrets:staging` push the env file's vars to the deployed Worker as secrets (CI runs these after each deploy).
- `npm run env:init` seeds `.env.{development,staging,production}` from `.env.example` (if missing) and encrypts them.
- `npm run env:encrypt` re-encrypts the three `.env.*` files in place.
- `npm run check` runs format + lint + typecheck (via Vite+/`vp`).
- `npm run lint` runs Oxlint on its own. The `lint` block in `vite.config.ts` enables the React, React Hooks, Next.js, and jsx-a11y plugins so coverage matches `eslint-config-next` (`next/core-web-vitals` + `next/typescript`), plus type-aware rules via tsgolint.
- `npm run test` runs the unit tests.
- `npm run typegen` generates App Router route helper types.
- `npm run compat` scans for Next.js API compatibility gaps.

## Environment variables

`.env.example` (committed, plaintext) is the canonical key list. `npm run
env:init` turns it into `.env.development` / `.env.staging` / `.env.production`
at the repo root, **encrypted with [dotenvx](https://dotenvx.com/)** — commit
those (ciphertext); `.env.keys` stays gitignored. Schema + validation is in
[`src/env.ts`](src/env.ts) (`@t3-oss/env-nextjs` + valibot).

- **Add a key:** put it in `.env.example`, then
  `npx dotenvx set KEY value -f .env.<env>` for each of the three.
- **Edit a value:** `npx dotenvx set KEY value -f .env.staging`, or
  `npx dotenvx decrypt -f .env.staging`, edit, `npx dotenvx encrypt -f .env.staging`.
- **All three files must carry the same keys** — differ in value only.
  `build:staging` still runs in vinext's `production` mode and reads
  `.env.production` (as ciphertext) for any key `dotenvx run` didn't already
  set, so a key missing from one file leaks an `encrypted:…` string.
- **`dev` / `build` / `start` / `deploy` / `typegen`** wrap their command in
  `dotenvx run -f .env.<env>` (decrypts with `.env.keys` locally or
  `DOTENV_PRIVATE_KEY_<ENV>` in CI). `next.config.ts` does `import "@/env"`, so
  config load validates the decrypted values against [`src/env.ts`](src/env.ts).
- **`check` / `fmt` / `lint` / `test`** don't decrypt — they run with
  `SKIP_ENV_VALIDATION=1` (env validation isn't their job, and `build` still
  does it). So linting / testing / committing needs no keys.
- **Commit guard:** the `.env*` entry in `staged` (`vite.config.ts`) runs
  `dotenvx ext precommit`, rejecting any staged plaintext `.env` file.
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
