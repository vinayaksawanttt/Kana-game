import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["src/**/engine/**/*.{ts,tsx}", "src/lib/game-core/**/*.{ts,tsx}", "src/data/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["react", "react-*", "next", "next/*"], message: "Engine, game-core, and data modules must not import React or Next.js." },
            { group: ["@/components/*", "@/hooks/*"], message: "Engine, game-core, and data modules must not import UI components or hooks." },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
