# Refactor Log

Branch: `chore/restructure` (from `main` @ `43b52740`)

---

## Phase 0: Baseline ("Before" Numbers)

Recorded on 2026-11-17 before any refactor changes.

### 1. Command Results
| Check | Command | Exit Code | Result Summary |
| :--- | :--- | :---: | :--- |
| Dependencies | `npm ci` | 0 | 647 packages added, 648 audited in 21s |
| TypeScript | `npx tsc --noEmit` | 0 | 0 errors |
| Linter | `npm run lint` (`eslint`) | 1 | 134 problems (30 errors, 104 warnings) in `scripts/` and `src/` |
| Tests | `npx vitest run` | 1 | 81/84 test files passed, 537/542 tests passed (97.49s). Failing: `src/app/hub.test.tsx` (1), `src/engine/__tests__/audio.test.ts` (3), `src/app/games/grammar/grammar.test.tsx` (1) |
| Production Build | `npm run build` | 0 | Next.js 16.4.6 (Turbopack): compiled in 21.2s, TS 31.3s, 163/163 static pages in 11.1s. `.next/static/chunks` total: 12M |

### 2. Production Build Route List
*(Note: Next.js 16.4.6 Turbopack CLI output lists route patterns and rendering modes; per-route First Load JS sizes are no longer printed in the Turbopack summary table. Total `.next/static/chunks` size: 12M.)*

- `○ /`
- `○ /_not-found`
- `ƒ /api/tts/voicevox`
- `○ /books`
- `◐ /books/[bookId]/[lesson]`
- `○ /dictionary`
- `○ /games/dialogue`
- `◐ /games/dialogue/play/[scenarioId]`
- `○ /games/grammar`
- `◐ /games/grammar/play/[sessionId]`
- `◐ /games/grammar/result/[sessionId]`
- `○ /games/jlpt`
- `○ /games/jlpt/info-scanner`
- `◐ /games/jlpt/info-scanner/play/[sessionId]`
- `◐ /games/jlpt/info-scanner/result/[sessionId]`
- `○ /games/jlpt/instant-reply`
- `◐ /games/jlpt/instant-reply/play/[sessionId]`
- `◐ /games/jlpt/instant-reply/result/[sessionId]`
- `○ /games/jlpt/listening-scenes`
- `◐ /games/jlpt/listening-scenes/play/[sessionId]`
- `◐ /games/jlpt/listening-scenes/result/[sessionId]`
- `○ /games/jlpt/paragraph-cloze`
- `◐ /games/jlpt/paragraph-cloze/play/[sessionId]`
- `◐ /games/jlpt/paragraph-cloze/result/[sessionId]`
- `○ /games/jlpt/phonetic-traps`
- `◐ /games/jlpt/phonetic-traps/play/[sessionId]`
- `◐ /games/jlpt/phonetic-traps/result/[sessionId]`
- `○ /games/jlpt/star-scramble`
- `◐ /games/jlpt/star-scramble/play/[sessionId]`
- `◐ /games/jlpt/star-scramble/result/[sessionId]`
- `○ /games/jlpt/synonym-match`
- `◐ /games/jlpt/synonym-match/play/[sessionId]`
- `◐ /games/jlpt/synonym-match/result/[sessionId]`
- `○ /games/jlpt/word-usage`
- `◐ /games/jlpt/word-usage/play/[sessionId]`
- `◐ /games/jlpt/word-usage/result/[sessionId]`
- `○ /games/kana`
- `○ /games/kana/play`
- `◐ /games/kana/play/[sessionId]`
- `○ /games/kana/result`
- `◐ /games/kana/result/[sessionId]`
- `○ /games/kanji`
- `○ /games/kanji/meaning`
- `◐ /games/kanji/meaning/play/[sessionId]`
- `◐ /games/kanji/meaning/result/[sessionId]`
- `◐ /games/kanji/playground/[kanji]`
- `○ /games/kanji/radicals`
- `○ /games/kanji/reading`
- `○ /games/listening`
- `◐ /games/listening/play/[sessionId]`
- `◐ /games/listening/result/[sessionId]`
- `○ /games/shiritori`
- `◐ /games/shiritori/play/[sessionId]`
- `○ /games/vocabulary`
- `◐ /games/vocabulary/play/[sessionId]`
- `◐ /games/vocabulary/result/[sessionId]`
- `○ /grammar`
- `◐ /grammar/[level]/[slug]`
- `○ /icon.svg`
- `○ /learn`
- `◐ /learn/[slug]` (+93 prerendered paths)
- `○ /learn/missed-kanji`
- `○ /learn/mistake-bank`
- `○ /manifest.webmanifest`
- `○ /review`
- `○ /stories`
- `◐ /stories/[level]/[slug]`

---

## Moves, Deletions & Decisions

### Phase 6: README
- Rewrote `README.md` with project overview, feature list, live demo placeholder, tech stack table (synced to `package.json`), quick start & scripts table, refactored project structure tree, architecture/layering summary, data provenance/licenses, testing/deployment/contributing links, and roadmap.
- Verified all relative file paths and documentation links exist.

### Phase 5: Scripts, Config, and Tooling
- **Added `package.json` scripts**: `typecheck` (`tsc --noEmit`) and `check` (`npm run lint && npm run typecheck && npm run test`).
- **Config & Tooling**:
  - Added `.editorconfig` (UTF-8, LF, 2-space indentation, trailing whitespace rules).
  - Updated `vitest.config.ts` with explicit `include: ["src/**/*.test.{ts,tsx}"]`.
- **Documentation**:
  - Created `docs/architecture.md` (layering rules, folder map, data-flow diagram).
  - Created `docs/adding-a-game.md` (step-by-step guide for adding a new game mode).
  - Updated `AGENTS.md` with project folder map, layering rules, refactor invariants, and verification commands (preserving Next.js agent rules block).

### Phase 4: Clean and Structure `src/data/`
- **Moved Raw Datasets Out of `src/data/` (`git mv`)**:
  - `src/data/openjlpt/` → `data-raw/openjlpt/` (~7.2 MB)
  - `src/data/grammar/*.json` → `data-raw/grammar/` (~2.8 MB)
  - `src/data/kanji/radicals/` → `data-raw/kanji/radicals/` (~516 KB)
  - `src/data/kanji/meaning-overrides.json` → `data-raw/kanji/meaning-overrides.json` (~4 KB)
  - Updated all script paths in `scripts/` and doc links in `README.md` / `docs/ASSETS.md`.
- **Documentation & Generated File Hygiene**:
  - Created `data-raw/README.md` documenting source, license, and dates of raw datasets.
  - Created `src/data/README.md` documenting runtime loaders, curated content, and generated manifests.
  - Created `.gitattributes` marking `*.generated.ts`, `*.generated.json`, `public/data/**`, and `public/sw.js` as `linguist-generated`.
  - Excluded `src/data/**/*.generated.ts` and `src/data/**/generated/**` from ESLint in `eslint.config.mjs`.
- **Data Integrity Tests**:
  - Added `src/data/kana.test.ts` (unique ids, non-empty romaji, unique row metadata keys, filter/count consistency).
  - Enhanced `src/data/kanji.test.ts` with schema & uniqueness validation for N5 kanji records.

### Phase 3: Restructure `src/`
- **Layering Enforcement**: Added ESLint `no-restricted-imports` rule in `eslint.config.mjs` blocking `react`, `react-*`, `next`, `next/*`, `@/components/*`, and `@/hooks/*` inside `src/**/engine/**`, `src/lib/game-core/**`, and `src/data/**`.
- **Moved Shared Layout Chrome (`git mv`)**:
  - `src/lib/game-core/layout.tsx` → `src/components/layout/game-layout.tsx`
  - `src/lib/game-core/quit-session.tsx` → `src/components/layout/quit-session.tsx`
  - `src/components/{due-review-count,pwa-register,sfx-toggle,theme-toggle}.tsx` → `src/components/layout/`
- **Moved Feature Modules (`git mv`)**:
  - `src/features/kana/engine/` (`kana.ts`, `kana-session.ts`)
  - `src/features/kanji/{engine,hooks,components}/` (`kanji-meaning.ts`, `radical-search.ts`, `stroke-practice.ts`, `clean-meanings.ts`, `use-*.ts`, `StrokePlayer`, `StrokePracticeCanvas`, `KanjiBreakdownModal`, `RadicalBuilderView`)
  - `src/features/books/{engine,components}/` (`progress.ts`, `characterDiff.ts`, `dialogueCloze.ts`, `ui/*`, modals/drawers/drills)
  - `src/features/dialogue/{engine,components}/` (`dialogueEngine.ts`, `vn/*`, legacy components)
  - `src/features/jlpt/{engine,hooks,components}/` (`jlpt*.ts`, `use-instant-reply-audio.ts`, `AudioDialogueSequence`, `InfoScannerDocumentViewer`, `JlptBookletSetupShell`)
  - `src/features/grammar/{engine,lib,components}/` (`grammar-session.ts`, `process.ts`, `grammar-guide-view.tsx`)
  - `src/features/listening/engine/` (`listening.ts` + tests)
  - `src/features/shiritori/engine/` (`shiritori.ts` + tests)
  - `src/features/vocabulary/engine/` (`vocabulary.ts`, `vocabulary-matcher.ts` + tests)
  - `src/features/learn/components/` (`LearnHubClient`, `MdxComponents`, `PersonalSheetClient`, etc.)
  - `src/features/stories/{hooks,components}/` (`use-story-narrator.ts`, `story-cover.tsx` + tests)
- **Removed Empty Directories**: `src/components/kana`, `src/lib/kana`, `src/lib/kanji-data`, `src/lib/books`, `src/lib/grammar-data`, `src/components/books`, `src/components/dialogue`, `src/components/jlpt`, `src/components/kanji`, `src/components/learn`, `src/engine/dialogue`.
- **Verification**: `npx tsc --noEmit` (0 errors), `npx eslint "src/**/engine/**" src/lib/game-core/ src/data/` (0 errors), `npx vitest run src/features/ src/lib/game-core/` (33/33 files, 222/222 tests passed).

### Phase 2: Cleanup
- **Deleted (SAFE)**:
  - `.tmp/test-kana-a.mp3` (temporary scratch audio file)
  - `.github/instructions/postman-*.instructions.md` (6 stray gitignored Postman extension files)
  - `public/audio/grammar-examples/N2/noun-wo-hajime-to-shite_3.opus.tmp.wav` (tracked leftover temporary `.wav` alongside `.opus`)
- **Moved (Root Tidiness via `git mv`)**:
  - `ASSETS.md` → `docs/ASSETS.md` (updated link in `README.md`)
  - `DEPLOY.md` → `docs/DEPLOY.md` (updated link in `README.md`)
  - `kanji-data-report.md` → `docs/kanji-data-report.md` (updated output path in `scripts/build-kanji-data.ts`)
- **`.gitignore` Updated**: Added `*.tmp.wav`, `/playwright-report/`, `/test-results/`.
- **Pending Decisions (`ASK`)**: See `docs/REFACTOR_PLAN.md` Section 6 ("NEEDS MY DECISION") for legacy dialogue components, `convert-png-to-webp.js`, unused barrels, and moving raw datasets out of `src/data/`.
