<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project Architecture & Agent Rules

- **Folder Map**:
  - `src/app/`: Thin Next.js App Router pages and API routes (no core game logic).
  - `src/features/<domain>/`: Feature modules (`engine/`, `hooks/`, `components/`, colocated `*.test.ts(x)`).
  - `src/components/`: Shared UI (`ui/`, `layout/`, `hub/`, `icons/`).
  - `src/data/`: Runtime data loaders, curated MDX/JSON content, and `*.generated.ts` manifests.
  - `data-raw/`: Raw build-time datasets (never imported by runtime `src/`).
  - `docs/`: Architecture, deployment, asset licenses, and refactor tracking.
- **Layering Rules**: `data -> engine (pure TS) -> hooks -> components -> app`. Modules under `src/**/engine/**`, `src/lib/game-core/**`, and `src/data/**` must never import `react`, `next/*`, `@/components/*`, or `@/hooks/*` (enforced by ESLint).
- **Refactor Rule**: Behavior must not change during refactors — never rename/remove URL routes, localStorage/sessionStorage/IndexedDB keys, saved data shapes, or game logic.
- **Verification Before Finishing**: Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
