# Kana-Play · 日本語練習

A fast, tactile, local-first Japanese learning platform and interactive game workspace featuring Kana, Kanji, Vocabulary, Grammar, JLPT exam prep, Textbook Companion (Genki I, Genki II, Minna no Nihongo I), Dialogue Quest, Graded Stories, and FSRS spaced repetition.

---

## Live Demo

- **Production URL**: _Coming soon (Vercel deployment placeholder)_

---

## Features

- **Kana Practice (`/games/kana`)**: Hiragana, Katakana, or mixed practice across basic gojūon, dakuten/handakuten, yōon digraphs, and extended katakana with deterministic seeded decks.
- **Kanji Studio (`/games/kanji`)**: Meaning drills (2,208 JLPT N5–N1 kanji), stroke-order animation & canvas writing practice, and Radical Builder (`/games/kanji/radicals`).
- **Textbook Companion (`/books`)**: Interactive workspace for **Genki I**, **Genki II**, and **Minna no Nihongo I** with vocabulary flashcards, grammar notes, kanji writing practice, roleplay/shadowing dialogues, and workbook drills.
- **JLPT Exam Prep (`/games/jlpt`)**: Info Scanner, Instant Reply, Listening Scenes, Paragraph Cloze, Phonetic Traps, Star Scramble, Synonym Match, and Word Usage.
- **Vocabulary, Grammar, Listening & Shiritori**: Dedicated game modes (`/games/vocabulary`, `/games/grammar`, `/games/listening`, `/games/shiritori`) plus Grammar Guides (`/grammar`) and Learning Guides (`/learn`).
- **Immersion & Tools**: Dialogue Quest (`/games/dialogue`), Graded Stories (`/stories`), Local Dictionary & Sentence Analyzer (`/dictionary`), and FSRS Review Hub (`/review`).
- **Day/Night Sakura Themes & Offline PWA**: Responsive mobile-first design (`min-h-dvh`), light/dark themes, and local IndexedDB/Dexie persistence.

---

## Tech Stack

*(Versions from [`package.json`](./package.json))*

| Layer | Technology | Version |
| :--- | :--- | :--- |
| **Framework** | Next.js (App Router, Turbopack) | `^16.4.6` |
| **UI Library** | React & React DOM | `19.3.0` |
| **Language** | TypeScript | `^5` |
| **Styling** | Tailwind CSS & `@tailwindcss/turbopack` | `^4` |
| **Storage & SRS** | Dexie (IndexedDB) & `ts-fsrs` | `^4.4.7` / `^5.4.2` |
| **NLP & MDX** | Kuromoji, `next-mdx-remote`, `gray-matter`, `remark-gfm` | `^0.1.2` / `^6.0.0` |
| **Animation & Icons** | Framer Motion & Lucide React | `^14.14.0` / `^1.61.0` |
| **Testing** | Vitest, Testing Library, `jsdom`, `fake-indexeddb` | `^3.2.7` |

---

## Quick Start

### Prerequisites
- Node.js `22.x` (see `engines.node` in [`package.json`](./package.json))
- npm `10.x` or newer

### Installation & Development

```bash
git clone https://github.com/VinayakSawant859/Kana-game.git
cd Kana-game
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to launch the Hub.

### Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Start the Next.js development server with Turbopack. |
| `npm run build` | Run `prebuild` asset generators and build the production Next.js app. |
| `npm start` | Serve the production build locally. |
| `npm run lint` | Run ESLint across `src/` and `scripts/` (including layering rules). |
| `npm run typecheck` | Run TypeScript type checking (`tsc --noEmit`). |
| `npm test` | Run the Vitest test suite (`src/**/*.test.{ts,tsx}`). |
| `npm run check` | Run `lint`, `typecheck`, and `test` in sequence. |
| `npm run build:kanji-data` | Build partitioned JLPT kanji JSON files into `public/data/v1/kanji/`. |
| `npm run build:radicals` | Build radical charts and kanji memberships into `public/data/v1/radicals/`. |
| `npm run build:grammar-data` | Build JLPT grammar rules and example sentences into `public/data/v1/grammar/`. |
| `npm run build:books` | Build textbook lesson manifests from `src/data/books/*.mdx`. |
| `npm run build:data` | Rebuild all static datasets from `data-raw/` and `src/data/`. |

---

## Project Structure

```text
.
├── data-raw/           # Raw build-time source datasets (never imported by runtime src/)
├── docs/               # Architecture, deployment, asset licenses, and refactor logs
├── public/             # Static assets, audio (.opus/.mp3), Kuromoji dict, built JSON partitions
├── scripts/            # Data-build, audio-synthesis, and DeepL enrichment scripts
└── src/
    ├── app/            # Thin Next.js App Router pages and API routes
    ├── components/     # Shared UI only (ui/, layout/, hub/, icons/)
    ├── data/           # Runtime data loaders, curated MDX/JSON content, *.generated.ts
    ├── engine/         # Shared pure TypeScript utilities (audio, analyzer, homophones, random)
    ├── features/       # Domain feature modules (books, dialogue, grammar, jlpt, kana, kanji, learn, listening, shiritori, stories, vocabulary)
    ├── games/          # Game registry metadata
    ├── hooks/          # Shared React hooks
    └── lib/            # Cross-cutting utilities (game-core, srs, storage, content, fonts)
```

---

## Architecture & Layering Rules

Dependencies flow strictly in one direction:

```text
src/data/  ──▶  engine/ (pure TS)  ──▶  hooks/  ──▶  components/  ──▶  src/app/
```

- Pure TypeScript modules under `src/**/engine/**`, `src/lib/game-core/**`, and `src/data/**` **never** import `react`, `next/*`, `@/components/*`, or `@/hooks/*` (enforced via ESLint `no-restricted-imports` in [`eslint.config.mjs`](./eslint.config.mjs)).
- Full details and data-flow diagrams are in [`docs/architecture.md`](./docs/architecture.md).

---

## Data, Provenance & Licenses

- **Where data lives**:
  - [`data-raw/`](./data-raw/README.md): Raw build-time corpora (`kanji_jlpt_only.json`, `openjlpt/`, `grammar/`, `kanji/`).
  - `public/data/v1/`: Pre-built static JSON partitions fetched lazily by the browser.
  - [`src/data/`](./src/data/README.md): Typed runtime loaders, curated content, and generated manifests (`*.generated.ts`).
- **Regenerating data**: Run `npm run build:data` (or domain-specific `npm run build:*` scripts).
- **Credits & Notices**:
  - **KANJIDIC & EDRDG**: Kanji entries and readings are derived from KANJIDIC (© EDRDG, [CC BY-SA 3.0 / 4.0](https://creativecommons.org/licenses/by-sa/4.0/)).
  - **JLPT Lists**: JLPT N5–N1 level groupings are unofficial community approximations; the JLPT does not publish official vocabulary or kanji lists.
  - **OpenJLPT**: Vocabulary and sentence data derived from [OpenJLPT](https://github.com/evanclan/OpenJLPT) (CC BY-SA 4.0); see [`data-raw/openjlpt/NOTICE.md`](./data-raw/openjlpt/NOTICE.md).
  - **Fonts**: Inter, Noto Sans JP, Noto Serif JP, and Yuji Syuku are self-hosted via `next/font` under the [SIL Open Font License (OFL)](https://openfontlicense.org/).
  - Full asset attribution is in [`docs/ASSETS.md`](./docs/ASSETS.md).

---

## Testing, Deployment & Contributing

- **Testing**: Run `npm test` (Vitest + Testing Library + `fake-indexeddb`). Colocate tests as `*.test.ts(x)` next to the module under test.
- **Deployment**: Configured for zero-config Vercel deployment (`Node 22.x`). See [`docs/DEPLOY.md`](./docs/DEPLOY.md).
- **Adding a Game Mode**: Follow the step-by-step checklist in [`docs/adding-a-game.md`](./docs/adding-a-game.md) and conventions in [`AGENTS.md`](./AGENTS.md).

---

## Roadmap

- Complete **Kanji Reading** interactive mode (`/games/kanji/reading`) with on'yomi/kun'yomi kana typing drills.
- Expand **Textbook Companion** audio coverage and cross-lesson cumulative review decks.
- Add richer **FSRS** analytics and exportable study progress backups.
