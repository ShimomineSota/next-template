import { createEnv } from "@t3-oss/env-nextjs";
import * as v from "valibot";

export const env = createEnv({
  /**
   * Server-side environment variables, not available on the client.
   * Add secrets and server-only config here.
   *
   * Values come from the dotenvx-encrypted `.env.{development,staging,production}`
   * files at the repo root. Any key added here MUST be present in all three
   * (`npx dotenvx set KEY value -f .env.<env>` for each) — differ in value only.
   */
  server: {
    NODE_ENV: v.optional(v.picklist(["development", "production", "test"]), "development"),
  },

  /**
   * Client-side environment variables, exposed to the browser.
   * Must be prefixed with `NEXT_PUBLIC_`.
   *
   * `NEXT_PUBLIC_*` are also readable server-side (`process.env.NEXT_PUBLIC_…`),
   * so there's no need for a paired server-only var. Optional-with-default keeps
   * a stray `vitest`/`vite` run that skipped `dotenvx run` from hard-failing.
   */
  client: {
    NEXT_PUBLIC_ENVIRONMENT: v.optional(
      v.picklist(["development", "staging", "production"]),
      "development",
    ),
  },

  /**
   * `experimental__runtimeEnv` only needs to list client (`NEXT_PUBLIC_*`)
   * variables, since those are the ones the bundler must statically replace
   * in browser code. Server variables are read straight off `process.env`
   * (spread in automatically when `runtimeEnv` itself is omitted), which
   * works fine because Node evaluates that dynamically at runtime.
   *
   * Example once a client var exists:
   *   experimental__runtimeEnv: {
   *     NEXT_PUBLIC_EXAMPLE: process.env.NEXT_PUBLIC_EXAMPLE,
   *   },
   */
  experimental__runtimeEnv: {
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
  },

  /** Skip validation, e.g. for Docker builds where env vars aren't set yet. */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /** Treat empty strings as undefined, matching how most .env tooling behaves. */
  emptyStringAsUndefined: true,
});
