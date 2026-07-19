import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

/**
 * ESLint configuration for the FIFA 2026 Smart Stadium.
 *
 * Builds on Next.js core-web-vitals + TypeScript presets, then layers on
 * explicit best-practice rules for type-safety, consistency, and
 * maintainability. The additional rules are surfaced (rather than relying on
 * implicit preset behaviour) so that any engineer opening the repo can read
 * the project's quality contract at a glance.
 */
const config = [
  ...nextVitals,
  ...nextTypeScript,
  {
    ignores: [
      ".next/**",
      ".vercel/**",
      "coverage/**",
      "legacy/**",
      "node_modules/**",
      "prisma/generated/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  {
    rules: {
      // ----- Type-safety -----
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Prefer optional chaining with a single style for readable null-safe access.
      "@typescript-eslint/no-non-null-assertion": "off",

      // ----- Consistency & correctness -----
      "consistent-return": "error",
      "default-case": "warn",
      "default-case-last": "error",
      "eqeqeq": ["error", "always", { null: "ignore" }],
      "no-var": "error",
      "prefer-const": "error",
      "prefer-template": "warn",
      "object-shorthand": ["warn", "always"],
      "no-console": [
        "warn",
        { allow: ["warn", "error"], },
      ],

      // ----- React / Next.js quality -----
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react/no-danger": "warn",
    },
  },
  {
    // Rules specific to server-side route handlers and library code.
    files: ["src/app/api/**/*.ts", "src/lib/**/*.ts"],
    rules: {
      // API routes and shared libs should never rely on browser globals.
      "no-console": "off",
    },
  },
  {
    // Standalone CLI scripts (DB seed, build-time scripts) legitimately write
    // progress to stdout/stderr.
    files: ["prisma/seed.ts", "scripts/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    // Tests may legitimately use console stubs and async utilities.
    files: ["test/**/*.test.ts", "e2e/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },
];

export default config;
