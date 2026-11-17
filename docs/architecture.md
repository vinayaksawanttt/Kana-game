# Architecture Overview

## Layering Rules

The codebase enforces a strict unidirectional dependency flow:

```
data-raw/  ──(scripts/)──▶  public/data/v1/ + src/data/*.generated.ts
                                       │
                                       ▼
src/data/  ──▶  engine/ (pure TS)  ──▶  hooks/  ──▶  components/  ──▶  src/app/
```

1. **Pure TypeScript boundary** (`src/**/engine/**`, `src/lib/game-core/**`, `src/data/**`):
   - **Never** import `react`, `next/*`, `@/components/*`, or `@/hooks/*`.
   - Enforced by ESLint `no-restricted-imports` in `eslint.config.mjs`.
2. **Feature isolation** (`src/features/<domain>/`):
   - Each game or learning domain owns its `engine/`, `hooks/`, `components/`, and colocated `*.test.ts(x)`.
3. **Thin routes** (`src/app/`):
   - Next.js App Router pages compose feature components and hooks without embedding core game algorithms.

## Folder Map

```
data-raw/             Raw build-time datasets (never imported by runtime src/)
docs/                 Architecture, deployment, asset licenses, and refactor logs
public/               Static assets, audio (.opus/.mp3), Kuromoji dict, built JSON partitions
scripts/              Data-build, audio-synthesis, and DeepL enrichment scripts
src/
  app/                Next.js App Router routes & API handlers
  components/
    hub/              Home hub UI
    icons/            SVG icons
    layout/           Shared shell, header, theme/SFX toggles, quit-session dialog
    ui/               Atomic UI primitives (AudioButton, FuriganaText, SakuraLoader, etc.)
  data/               Runtime data loaders, curated MDX/JSON content, *.generated.ts
  engine/             Shared pure TS engines (audio, analyzer, homophones, random)
  features/           Domain modules: books, dialogue, grammar, jlpt, kana, kanji, learn, listening, shiritori, stories, vocabulary
  games/              Game registry metadata
  hooks/              Shared client hooks
  lib/                Cross-cutting utilities (game-core, srs, storage, content, fonts)
```
