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
- **Deleted (SAFE)**: `.tmp/test-kana-a.mp3` (temporary scratch audio file in gitignored `.tmp/`).
- **Pending Decisions (`ASK`)**: See `docs/REFACTOR_PLAN.md` Section 6 ("NEEDS MY DECISION").
