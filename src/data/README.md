# Runtime Data & Content (`src/data/`)

This directory contains runtime data loaders, curated content modules, and generated audio manifests. Raw build-only datasets live in `data-raw/`.

## Structure
- **Loaders (`*.ts`)**: Lazy fetchers and typed accessors (`books.ts`, `dictionary.ts`, `grammar.ts`, `kana.ts`, `kanji.ts`, `kanjiVocab.ts`, `listening.ts`, `radicals.ts`, `shiritori.ts`, `stories.ts`, `strokes.ts`, `vocabulary.ts`).
- **Curated Content**:
  - `books/` — Genki I, Genki II, and Minna no Nihongo I lesson MDX transcriptions.
  - `content/stories/` — Graded Japanese stories & lexicon (`N5`–`N3`).
  - `dialogue/` — Dialogue Quest scenarios, types, and sprite/background asset maps.
  - `jlpt/` — JLPT exam-prep datasets (`instantReplyData.ts`, `phoneticTrapData.ts`, `starScrambleData.ts`, `synonymMatchData.ts`, `wordUsageData.ts`, etc.).
  - `reference/` — MDX learning guides rendered on `/learn/[slug]`.
- **Generated Files (`*.generated.ts`)**: Never edit by hand; excluded from ESLint and marked `linguist-generated` in `.gitattributes`.
  - `audio-manifest.generated.ts` — Regenerate via audio build scripts.
  - `book-dialogues-audio.generated.ts` — Regenerate via `npm run build:books-dialogue-audio`.
  - `book-vocab-audio.generated.ts` — Regenerate via `npm run build:books-vocab-audio`.
  - `book-grammar-practice-audio.generated.ts` — Regenerate via `npm run build:books-grammar-audio`.
