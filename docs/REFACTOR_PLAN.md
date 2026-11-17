# Workspace Refactor & Cleanup Plan

Generated on 2026-11-17 (Phase 1: Audit — no code or file moves performed yet).

---

## 1. File Inventory

Top-level folders and key root files (excluding `node_modules/`, `.next/`, `.git/`):

| Path | Purpose |
| :--- | :--- |
| `.github/instructions/` | Gitignored VS Code Postman extension instruction files |
| `.tmp/` | Gitignored scratch directory (`test-kana-a.mp3`) |
| `.vercel/` | Gitignored Vercel project link metadata |
| `data-raw/` | Raw source datasets (`deepl-cache.json`, `kanji_jlpt_only.json`) — **DO NOT DELETE** |
| `docs/` | Refactor tracking (`REFACTOR_LOG.md`, `REFACTOR_PLAN.md`) |
| `public/` | Static assets served directly (`audio/`, `images/`, `assets/dialogue-quest/`, `dict/` Kuromoji dictionary, `data/v1/` built JSONs, `sw.js`) |
| `scripts/` | Build, data-generation, DeepL enrichment, audio synthesis, and asset conversion scripts |
| `src/app/` | Next.js App Router routes, pages, API handlers (`/api/tts/voicevox`), and route-colocated tests |
| `src/components/` | React UI components grouped by feature (`books/`, `dialogue/`, `hub/`, `icons/`, `jlpt/`, `kana/`, `kanji/`, `learn/`, `ui/`) |
| `src/data/` | Runtime data loaders, MDX/JSON content (`books/`, `content/stories/`, `reference/`, `dialogue/`, `jlpt/`), generated audio manifests (`*.generated.ts`), plus raw build-time datasets (`openjlpt/`, `grammar/*.json`, `kanji/radicals/`) |
| `src/engine/` | Pure, framework-agnostic TypeScript game logic, normalizers, session reducers, and unit tests |
| `src/games/` | Game registry metadata (`registry.ts`) |
| `src/hooks/` | Client React hooks (`useJapaneseAudio`, `useDictionary`, `useStrokeAnimation`, etc.) |
| `src/lib/` | Shared utilities (`books/`, `content/`, `game/`, `game-core/`, `grammar-data/`, `kana/`, `kanji-data/`, `srs/`, `storage/`, `fonts.ts`) |
| Root files | `AGENTS.md`, `ASSETS.md`, `DEPLOY.md`, `README.md`, `kanji-data-report.md`, `eslint.config.mjs`, `next.config.ts`, `package.json`, `tsconfig.json`, `vitest.config.ts` |

---

## 2. Unwanted-File & Cleanup Candidates

### SAFE (clearly junk or scratch)
- `.tmp/test-kana-a.mp3` (25 KB) — temporary audio test file in gitignored `.tmp/`.
- `.github/instructions/postman-*.instructions.md` (6 files) — gitignored Postman extension files unrelated to this project.

### ASK (uncertain — needs user decision)
- `kanji-data-report.md` (1.8 KB at repo root) — one-off report generated during kanji data build; move to `docs/kanji-data-report.md` or delete?
- `scripts/convert-png-to-webp.js` — legacy CommonJS duplicate of `scripts/convert-png-to-webp.ts` / `scripts/convert-all-site-png-to-webp.ts` (triggers 3 ESLint `no-require-imports` errors). Delete?
- `src/components/dialogue/AtmosphereMeter.tsx`, `src/components/dialogue/DialogueChoicePanel.tsx`, `src/components/dialogue/DialogueStage.tsx` — flagged unused by `knip` (0 imports in `src/`; superseded by `src/components/dialogue/vn/*`). Delete?
- `src/data/kanji/index.ts` — flagged unused by `knip` (0 imports). Delete?
- `src/engine/index.ts` — barrel file flagged unused by `knip` (0 imports). Keep as barrel or delete?
- `src/games/registry.ts` — flagged unused by `knip` (0 imports). Keep as reference catalog or delete?
- Unused/one-off scripts in `scripts/` (24 scenario-specific audio/migration scripts flagged by `knip` because they have no `package.json` script entry). Keep as historical build tools or move to `scripts/archive/`?

### Verified False Positives / Keep
- **NPM dependencies (`depcheck`)**: `@tailwindcss/turbopack` and `tailwindcss` are used by CSS/Turbopack (`@import "tailwindcss"` + `next.config.ts`). Keep both. (`sharp` is an optional script-only dependency used by `scripts/convert-all-site-png-to-webp.ts`).
- **Console / TODOs**: 0 `console.log`/`console.debug` and 0 `TODO`/`FIXME` entries found in `src/`.
- **Create-next-app leftovers**: None found in `public/` (no default `vercel.svg`, `next.svg`, etc.).

---

## 3. Dependency Map & Layering Check

```
src/app/  ──▶  src/components/, src/hooks/, src/lib/, src/engine/, src/data/
src/components/  ──▶  src/hooks/, src/lib/, src/engine/, src/data/
src/hooks/  ──▶  src/lib/, src/engine/, src/data/
src/lib/  ──▶  src/engine/, src/data/
src/engine/  ──▶  src/data/   (pure TypeScript)
```

- **Layering Violations**: **0** (`grep` across `src/engine/` and `src/data/` found zero imports from `react`, `next`, `@/components`, or `@/hooks`).

---

## 4. `src/data/` Review

| Path | Size | Importers | Hand-written / Generated | Should it be in `src/`? |
| :--- | :---: | :--- | :--- | :--- |
| `src/data/audio-manifest.generated.ts` | 1.3M | `src/engine/audio.ts` | Generated | Yes (imported at runtime) |
| `src/data/book-dialogues-audio.generated.ts` | 76K | `src/data/books.ts` | Generated | Yes |
| `src/data/book-grammar-practice-audio.generated.ts` | 484K | `src/app/books/...` | Generated | Yes |
| `src/data/book-vocab-audio.generated.ts` | 176K | `src/data/books.ts` | Generated | Yes |
| `src/data/books/` (12 `.mdx`) | 560K | `src/data/books.ts` | Hand-written/transcribed | Yes |
| `src/data/books.ts` (+ `.test.ts`) | 16K | `src/app/books/*`, `src/lib/books/*` | Hand-written | Yes |
| `src/data/content/stories/` | 4.2M | `src/data/stories.ts` | Hand-written + enriched | Yes |
| `src/data/dialogue/` | 608K | `src/app/games/dialogue/*`, `src/engine/dialogue/*` | Hand-written | Yes |
| `src/data/dictionary.ts` | 3.3K | `src/hooks/useDictionary.ts`, `src/app/books/*` | Hand-written | Yes |
| `src/data/grammar/*.json` (10 files) | 2.8M | **`scripts/` ONLY** (not imported by `src/`) | Raw/source JSON | **No — candidate for `data-raw/grammar/` (ASK)** |
| `src/data/grammar.ts` (+ `.test.ts`) | 9K | `src/app/grammar/*`, `src/engine/grammarSession.ts` | Hand-written | Yes |
| `src/data/jlpt/` | 1.9M | `src/engine/jlpt*.ts`, `src/app/games/jlpt/*` | Mixed (hand + generated) | Yes |
| `src/data/kana.ts` | 12K | `src/engine/kana*.ts`, `src/app/games/kana/*` | Hand-written | Yes |
| `src/data/kanji.ts` (+ `.test.ts`) | 12K | `src/engine/kanji-meaning.ts`, `src/app/games/kanji/*` | Hand-written | Yes |
| `src/data/kanji/index.ts` | 4K | **None** | Hand-written | **ASK (delete?)** |
| `src/data/kanji/meaning-overrides.json` | 4K | **`scripts/` ONLY** | Hand-written | **No — candidate for `data-raw/kanji/` (ASK)** |
| `src/data/kanji/radicals/` | 516K | **`scripts/build-radicals.ts` ONLY** | Raw dataset | **No — candidate for `data-raw/kanji/` (ASK)** |
| `src/data/kanjiVocab.ts`, `listening.ts`, `radicals.ts`, `shiritori.ts`, `stories.ts`, `strokes.ts`, `vocabulary.ts` | ~60K | `src/app/*`, `src/engine/*`, `src/hooks/*` | Hand-written | Yes |
| `src/data/openjlpt/` | 7.2M | **`scripts/` ONLY** (not imported by `src/`) | Raw OpenJLPT dataset | **No — candidate for `data-raw/openjlpt/` (ASK)** |
| `src/data/reference/` (40+ `.mdx`) | 1.0M | `src/lib/content/learn.ts` | Hand-written | Yes (or `content/learn/`) |

---

## 5. Proposed Structure & Full Move Table

The codebase already follows a clean `data -> engine -> hooks -> components -> app` architecture with zero layering violations. Proposed moves focus on tidying root/docs and separating raw build-only datasets from `src/data/`:

| Old Path | New Path | Classification |
| :--- | :--- | :---: |
| `kanji-data-report.md` | `docs/kanji-data-report.md` | **ASK** |
| `ASSETS.md` | `docs/ASSETS.md` (or keep at root) | **ASK** |
| `DEPLOY.md` | `docs/DEPLOY.md` (or keep at root) | **ASK** |
| `src/data/openjlpt/` | `data-raw/openjlpt/` (+ update script paths) | **ASK** |
| `src/data/grammar/*.json` | `data-raw/grammar/` (+ update script paths) | **ASK** |
| `src/data/kanji/meaning-overrides.json` | `data-raw/kanji/meaning-overrides.json` | **ASK** |
| `src/data/kanji/radicals/` | `data-raw/kanji/radicals/` | **ASK** |

*(No runtime routes, storage keys, or game logic files are moved or altered.)*

---

## 6. NEEDS MY DECISION

Please confirm which of the following **ASK** items you want executed in Phase 2+:

1. **Delete legacy/unused dialogue components?** (`src/components/dialogue/AtmosphereMeter.tsx`, `DialogueChoicePanel.tsx`, `DialogueStage.tsx` — 0 imports, superseded by `src/components/dialogue/vn/`).
2. **Delete duplicate JS script?** (`scripts/convert-png-to-webp.js` — superseded by `.ts` version, causes 3 ESLint errors).
3. **Delete unused barrel/stub files?** (`src/data/kanji/index.ts`, `src/engine/index.ts`, `src/games/registry.ts`).
4. **Move raw build-only datasets out of `src/data/` into `data-raw/`?** (`src/data/openjlpt/`, `src/data/grammar/*.json`, `src/data/kanji/radicals/`, `src/data/kanji/meaning-overrides.json` — ~10.5 MB total, only used by `scripts/`).
5. **Move root docs (`kanji-data-report.md`, `ASSETS.md`, `DEPLOY.md`) into `docs/`?**
6. **Archive historical one-off audio scripts in `scripts/` into `scripts/archive/`?**
