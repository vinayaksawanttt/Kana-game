# Adding a New Game Mode

Follow these steps to add a new game mode while preserving the layered architecture:

1. **Data (`src/data/`)**:
   - Add raw source datasets in `data-raw/` if needed and a build script in `scripts/` outputting to `public/data/v1/<game>/`.
   - Create a typed lazy loader in `src/data/<game>.ts` and a data integrity test in `src/data/<game>.test.ts`.
2. **Pure Engine (`src/features/<game>/engine/`)**:
   - Implement deck/question generation, answer checking, and scoring as pure TypeScript functions (zero React/Next imports).
   - Add colocated unit tests (`<game>.test.ts`).
3. **Hooks & Components (`src/features/<game>/hooks/`, `src/features/<game>/components/`)**:
   - Build reusable client hooks (`use-*.ts`) and UI components (`PascalCase.tsx`) with colocated tests.
4. **Routes (`src/app/games/<game>/`)**:
   - `page.tsx`: Setup screen using `GameLayout` from `@/components/layout/game-layout`.
   - `play/[sessionId]/page.tsx`: Active session view with `QuitSessionDialog` and `useQuitSessionGuard`.
   - `result/[sessionId]/page.tsx`: Post-session summary and FSRS/mistake-bank integration.
5. **Registry (`src/games/registry.ts`) & Hub (`src/app/page.tsx`)**:
   - Register the game metadata and link it from the hub.
6. **Verify**:
   - Run `npx tsc --noEmit`, `npx eslint src/features/<game>/`, `npx vitest run src/features/<game>/`, and `npm run build`.
