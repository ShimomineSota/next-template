import { defineConfig } from "vite-plus";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { kvDataAdapter } from "@vinext/cloudflare/cache/kv-data-adapter";
import { cdnAdapter } from "@vinext/cloudflare/cache/cdn-adapter";
import { imagesOptimizer } from "@vinext/cloudflare/images/images-optimizer";

// vinext's "rsc" environment sets `resolve.external` for Node builtins, which
// @cloudflare/vite-plugin refuses to allow on Worker-bound environments. That
// collision only shows up when Vitest resolves the config with both plugins
// present (plain dev/build never hits it) - vinext() alone is fine under
// Vitest (verified: a throwaway test passed with only vinext() registered),
// so only cloudflare() is skipped there; keeping vinext() means tests that
// import the next/image, next/link (etc.) shims still resolve correctly.
// NOTE: never let a slash-then-star sequence appear anywhere in this file -
// @vinext/cloudflare's deploy preflight scans the config as plain text and
// misreads such a sequence as a block-comment open, which then hides the
// cloudflare() plugin call below and aborts the deploy.
const isVitest = !!process.env.VITEST;

export default defineConfig({
  plugins: isVitest
    ? [vinext()]
    : [
        vinext({
          cache: { data: kvDataAdapter(), cdn: cdnAdapter() },
          images: { optimizer: imagesOptimizer() },
        }),
        cloudflare({
          viteEnvironment: {
            name: "rsc",
            childEnvironments: ["ssr"],
          },
        }),
      ],
  fmt: {
    ignorePatterns: [],
  },
  lint: {
    ignorePatterns: ["styled-system/**"],
    // Oxlint plugin set that mirrors what `eslint-config-next`
    // (`next/core-web-vitals` + `next/typescript`) turns on:
    // React, the React Hooks rules, Next.js, and jsx-a11y — plus the
    // defaults Vite+ already runs (unicorn/typescript/oxc) and import/promise.
    plugins: ["react", "unicorn", "typescript", "oxc", "import", "promise", "jsx-a11y", "nextjs"],
    // eslint-plugin-panda runs under Oxlint's JS-plugin compat layer. None of
    // its rules need type info, so the "type-aware rules unsupported" caveat
    // doesn't bite; it loads the Panda context once per run (~0.4s overhead).
    jsPlugins: ["@pandacss/eslint-plugin"],
    rules: {
      // Not in Oxlint's default `correctness` set; `next/core-web-vitals`
      // ships them as error/warn respectively.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // @pandacss/eslint-plugin `recommended` set.
      "@pandacss/file-not-included": "error",
      "@pandacss/no-config-function-in-source": "error",
      "@pandacss/no-invalid-nesting": "error",
      "@pandacss/no-invalid-token-paths": "error",
      "@pandacss/no-debug": "warn",
      "@pandacss/no-dynamic-styling": "warn",
      "@pandacss/no-hardcoded-color": "warn",
      "@pandacss/no-property-renaming": "warn",
      "@pandacss/no-unsafe-token-fn-usage": "warn",
      "@pandacss/no-deprecated-tokens": "warn",
    },
    overrides: [
      {
        files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
        plugins: ["vitest"],
      },
    ],
    options: {
      typeAware: true,
      typeCheck: true,
      denyWarnings: true,
    },
  },
  test: {
    include: ["**/*.test.{ts,tsx}"],
    // No test files exist yet; without this, Vitest (and the pre-push
    // `vp test run` hook) exits with code 1 on "No test files found".
    passWithNoTests: true,
    // Test mode: vinext loads only `.env.test` / `.env` (never the encrypted
    // `.env.{development,staging,production}`), so `NEXT_PUBLIC_ENVIRONMENT`
    // falls back to its `src/env.ts` default. When a test needs specific env
    // values, set them here (non-secret) rather than adding a `.env.test`
    // file (the `.env*` commit guard would reject a plaintext one):
    //   env: { NEXT_PUBLIC_ENVIRONMENT: "development" },
  },
  staged: {
    // lint + format + per-file typecheck
    "*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}": "vp check --fix",
    // Oxfmt also formats these; no lint/typecheck to run
    "*.{json,jsonc,css,md,mdx,yml,yaml}": "vp fmt --no-error-on-unmatched-pattern",
    // Block committing a plaintext .env file (dotenvx-encrypted / gitignored only).
    // The trailing `.` is the scan dir; `vp staged` appends the matched filenames
    // after it (ignored), and `precommit` runs its own git-staged scan.
    ".env*": "dotenvx ext precommit .",
  },
});
