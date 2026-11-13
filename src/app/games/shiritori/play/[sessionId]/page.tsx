"use client";

import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookmarkPlus,
  Check,
  Clock,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  chooseBotWord,
  convertRomajiBufferToHiragana,
  createShiritoriState,
  formatShiritoriMeaning,
  getEffectiveEndKana,
  getKanaAliases,
  useHint as getHintForTurn,
  validateTurn,
  type ShiritoriDictionary,
  type ShiritoriSettings,
  type ShiritoriState,
  type ShiritoriWord,
} from "@/engine/shiritori";
import {
  addRecentBotWord,
  addRecentHint,
  getRecentBotWords,
  getRecentHints,
  loadShiritoriData,
} from "@/data/shiritori";
import { addVocabularyToSrs } from "@/lib/srs/service";
import { GameLayout } from "@/lib/game-core/layout";
import { playGameSfx } from "@/lib/game-core/sfx";
import { QuitSessionDialog, useQuitSessionGuard } from "@/lib/game-core/quit-session";
import { SakuraLoader } from "@/components/ui/SakuraLoader";
import { AudioButton } from "@/components/ui/AudioButton";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";

interface StoredShiritoriSession {
  sessionId: string;
  settings: ShiritoriSettings;
}

interface LoadedGame {
  settings: ShiritoriSettings;
  dictionary: ShiritoriDictionary;
  initial: ShiritoriState;
}

const openingWord: ShiritoriWord = {
  id: "shiritori-opening",
  word: "しりとり",
  kana: "しりとり",
  romaji: "shiritori",
  meaning: "word-chain game",
  jlpt: 5,
  startKana: "し",
  endKana: "り",
};

function isSettings(value: unknown): value is ShiritoriSettings {
  if (typeof value !== "object" || value === null) return false;
  const settings = value as Partial<ShiritoriSettings>;
  return (settings.mode === "survival" || settings.mode === "blitz" || settings.mode === "friend") &&
    (settings.difficulty === "yasashii" || settings.difficulty === "futsuu" || settings.difficulty === "oni") &&
    (settings.turnSeconds === 0 || settings.turnSeconds === 15 || settings.turnSeconds === 30) &&
    typeof settings.allowUnverified === "boolean";
}

function difficultyLabel(difficulty: ShiritoriSettings["difficulty"]): string {
  return difficulty === "yasashii" ? "やさしい" : difficulty === "futsuu" ? "ふつう" : "おに";
}

export default function ShiritoriPlayPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
          <SakuraLoader label="Preparing Shiritori Chain..." size="md" />
        </main>
      }
    >
      <ShiritoriPlayContent />
    </Suspense>
  );
}

function ShiritoriPlayContent() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [game, setGame] = useState<LoadedGame | null>(null);
  const [loadError, setLoadError] = useState("");
  const [answer, setAnswer] = useState("");
  const [answerError, setAnswerError] = useState("");
  const [hintWord, setHintWord] = useState<ShiritoriWord | null>(null);
  const [hintedWords, setHintedWords] = useState<ShiritoriWord[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [savingId, setSavingId] = useState("");
  const [bookmarkMessage, setBookmarkMessage] = useState("");
  const [turnSecondsLeft, setTurnSecondsLeft] = useState(0);
  const [blitzSecondsLeft, setBlitzSecondsLeft] = useState(60);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { playVocab } = useJapaneseAudio();
  const lastPlayedTurnIndexRef = useRef<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ShiritoriState | null>(null);
  const isPlaying = state?.status === "playing";
  const { quitDialogOpen, requestQuit, cancelQuit, confirmQuit } = useQuitSessionGuard(Boolean(isPlaying));

  function quitSession() {
    confirmQuit();
    sessionStorage.removeItem(`shiritori-session:${sessionId}`);
    router.replace("/games/shiritori");
  }

  const activeMode = state?.settings.mode;
  const activeStatus = state?.status;
  const turnDuration = state?.settings.turnSeconds;
  const chainLength = state?.chain.length;
  const activePlayer = state?.currentPlayer;

  useEffect(() => {
    let active = true;
    try {
      const raw = sessionStorage.getItem(`shiritori-session:${sessionId}`);
      const parsed = raw ? JSON.parse(raw) as Partial<StoredShiritoriSession> : null;
      if (!parsed || parsed.sessionId !== sessionId || !isSettings(parsed.settings)) {
        router.replace("/games/shiritori");
        return () => { active = false; };
      }
      const settings = parsed.settings;
      if (typeof settings.sound === "boolean") {
        setSoundEnabled(settings.sound);
      } else if (typeof settings.soundEnabled === "boolean") {
        setSoundEnabled(settings.soundEnabled);
      }
      void loadShiritoriData().then((dictionary) => {
        if (!active) return;
        const initial = createShiritoriState(settings, openingWord);
        setGame({ settings, dictionary, initial });
        setState(initial);
      }).catch((error: unknown) => {
        if (!active) return;
        console.error("Could not load Shiritori dictionary.", error);
        setLoadError("The word list could not be loaded. Return to setup and try again.");
      });
    } catch (error) {
      console.error("Could not restore Shiritori session.", error);
      router.replace("/games/shiritori");
    }
    return () => { active = false; };
  }, [router, sessionId]);

  // Auto-play pronunciation for bot turns (opening word and subsequent bot moves)
  useEffect(() => {
    if (!state || !soundEnabled) return;
    const latestTurn = state.chain.at(-1);
    if (!latestTurn) return;
    const currentIndex = state.chain.length - 1;
    if (latestTurn.player === "bot" && lastPlayedTurnIndexRef.current !== currentIndex) {
      lastPlayedTurnIndexRef.current = currentIndex;
      playVocab({ word: latestTurn.word.word, reading: latestTurn.word.kana });
    }
  }, [state, soundEnabled, playVocab]);

  useEffect(() => {
    if (!game || activeStatus !== "playing" || activeMode === "blitz" || !turnDuration) return;
    const duration = turnDuration;
    const deadline = Date.now() + duration * 1000;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTurnSecondsLeft(remaining);
      if (remaining === 0) {
        window.clearInterval(timer);
        setState((current) => current && current.status === "playing" ? { ...current, status: "timed-out", message: "Turn time ran out." } : current);
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [game, activeMode, activePlayer, activeStatus, chainLength, turnDuration]);

  useEffect(() => {
    if (!game || activeStatus !== "playing" || activeMode !== "blitz") return;
    const deadline = Date.now() + 60_000;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setBlitzSecondsLeft(remaining);
      if (remaining === 0) {
        window.clearInterval(timer);
        setState((current) => current && current.status === "playing" ? { ...current, status: "timed-out", message: "The 60-second chain is over." } : current);
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [game, activeMode, activeStatus]);

  useEffect(() => {
    if (state?.status === "playing") inputRef.current?.focus();
  }, [state?.chain.length, state?.currentPlayer, state?.status]);

  function submitTurn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!game || !state || state.status !== "playing") return;
    const finalAnswer = convertRomajiBufferToHiragana(answer, true);
    const result = validateTurn(finalAnswer, state, game.dictionary);
    if (!result.valid) {
      playGameSfx("incorrect-chime");
      setAnswerError(result.error);
      if (result.loseByN) setState(result.state);
      return;
    }

    playGameSfx("correct-chime");
    setAnswer("");
    setAnswerError("");
    setHintWord(null);
    setState(result.state);
    if (result.word.meaning === "Unverified word") setBookmarkMessage("Word accepted as unverified");

    if (state.settings.mode === "friend") return;
    const recentBotIds = new Set(getRecentBotWords());
    const botWord = chooseBotWord(result.state, game.dictionary, recentBotIds);
    if (!botWord) {
      playGameSfx("victory-fanfare");
      setState({ ...result.state, status: "won", message: "The dictionary has no unused word for that kana." });
      return;
    }
    addRecentBotWord(botWord.id);
    const botState: ShiritoriState = {
      ...result.state,
      chain: [...result.state.chain, { word: botWord, player: "bot" }],
      usedIds: new Set([...result.state.usedIds, botWord.id]),
      nextKana: getEffectiveEndKana(botWord.kana),
    };
    if (botWord.endKana === "ん") {
      playGameSfx("victory-fanfare");
      setState({ ...botState, status: "won", message: "The dictionary ended on ん. You win!" });
    } else {
      setState(botState);
    }
  }

  function requestHint() {
    if (!game || !state || state.status !== "playing") return;
    const recentHintIds = new Set([...getRecentHints(), ...hintedWords.map((w) => w.id)]);
    const result = getHintForTurn(state, game.dictionary, recentHintIds);
    setState(result.state);
    setHintWord(result.word ?? null);
    if (result.word) {
      addRecentHint(result.word.id);
      if (!hintedWords.some((word) => word.id === result.word?.id)) {
        setHintedWords((current) => [...current, result.word!]);
      }
    }
  }

  async function addWordToSrs(word: ShiritoriWord) {
    if (savedIds.has(word.id)) return;
    setSavingId(word.id);
    setBookmarkMessage("");
    try {
      await addVocabularyToSrs({ word: word.word, reading: word.kana, meaning: word.meaning, level: `N${word.jlpt}` });
      setSavedIds((current) => new Set(current).add(word.id));
      setBookmarkMessage(`${word.word} added to FSRS`);
    } catch (error) {
      console.error("Could not add Shiritori word to FSRS.", error);
      setBookmarkMessage("Could not save this word");
    } finally {
      setSavingId("");
    }
  }

  async function addHintedWords() {
    if (!hintedWords.length) return;
    await Promise.all(hintedWords.map((word) => addWordToSrs(word)));
  }

  function playAgain() {
    if (!game) return;
    const nextSessionId = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(`shiritori-session:${nextSessionId}`, JSON.stringify({ sessionId: nextSessionId, settings: game.settings }));
    router.push(`/games/shiritori/play/${nextSessionId}`);
  }

  if (loadError) {
    return <main className="grid min-h-dvh place-items-center bg-[var(--bg)] px-5 text-center text-[var(--muted)]"><p>{loadError} <button type="button" className="ml-1 font-bold text-[var(--primary)] underline" onClick={() => router.replace("/games/shiritori")}>Return to setup</button>.</p></main>;
  }
  if (!game || !state) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
        <SakuraLoader label="Preparing Shiritori Chain..." size="md" />
      </main>
    );
  }

  const latest = state.chain.at(-1)?.word ?? openingWord;
  const allowedStarts = getKanaAliases(state.nextKana);
  const requiredLength = state.nextKana.length;
  const splitAt = Math.max(0, latest.kana.length - requiredLength);
  const turnLimit = state.settings.turnSeconds;
  const timerLimit = state.settings.mode === "blitz" ? 60 : turnLimit;
  const timerRemaining = state.settings.mode === "blitz" ? blitzSecondsLeft : turnSecondsLeft;
  const timerPercent = timerLimit ? Math.max(0, (timerRemaining / timerLimit) * 100) : 0;
  const isEnded = state.status !== "playing";
  const longest = [...state.chain].sort((a, b) => [...b.word.kana].length - [...a.word.kana].length)[0]?.word;
  const levelCounts = state.chain.reduce<Record<number, number>>((counts, turn) => {
    counts[turn.word.jlpt] = (counts[turn.word.jlpt] ?? 0) + 1;
    return counts;
  }, {});

  return (
    <GameLayout
      label="SHIRITORI"
      glyph="鎖"
      homeHref="/games/shiritori"
      onNavigateHome={isEnded ? undefined : requestQuit}
      className="min-h-dvh"
    >
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-8 sm:px-6">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {state.settings.mode !== "friend" && (
              <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1 text-xs font-bold text-[var(--ink)]">
                {difficultyLabel(state.settings.difficulty)}
              </span>
            )}
            {state.settings.mode === "friend" && (
              <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1 text-xs font-bold text-[var(--ink)]">
                {state.currentPlayer === "player1" ? "P1 turn" : "P2 turn"}
              </span>
            )}
            <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-extrabold text-[var(--primary)] tabular-nums">
              Chain: {state.chain.length}
            </span>
            {timerLimit > 0 && (
              <span className="inline-flex items-center gap-1 min-w-14 rounded-full border border-[var(--line)] bg-[var(--bg)] px-2.5 py-1 text-xs font-bold text-[var(--ink)] tabular-nums">
                <Clock size={12} className="text-[var(--muted)]" />
                {timerRemaining}s
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={soundEnabled ? "Mute pronunciation" : "Enable pronunciation"}
              aria-pressed={soundEnabled}
              onClick={() => setSoundEnabled((prev) => !prev)}
              className="grid size-10 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary)] transition-colors cursor-pointer"
              title={soundEnabled ? "Sound on (click to mute)" : "Sound muted (click to unmute)"}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button
              type="button"
              disabled={isEnded}
              onClick={() =>
                setState((current) =>
                  current
                    ? { ...current, status: "gave-up", message: "You ended the chain." }
                    : current
                )
              }
              className="min-h-10 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 text-xs font-bold text-[var(--muted)] hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary)] transition-colors disabled:opacity-45 cursor-pointer"
            >
              Give up
            </button>
          </div>
        </div>

        {/* Timer Progress Bar */}
        {timerLimit > 0 && (
          <div
            className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[var(--line)]/60"
            role="progressbar"
            aria-label={state.settings.mode === "blitz" ? "Blitz time remaining" : "Turn time remaining"}
            aria-valuenow={timerRemaining}
            aria-valuemin={0}
            aria-valuemax={timerLimit}
          >
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${
                timerRemaining <= 5 ? "bg-[var(--wrong)]" : "bg-[var(--primary)]"
              }`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>
        )}

        {/* Current Word Spotlight */}
        <section
          className="my-4 flex flex-col items-center rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-center shadow-sm sm:my-6 sm:p-8"
          aria-label="Current word"
        >
          <div className="flex items-center justify-center gap-3">
            <h1 className="font-japanese break-keep text-[clamp(3.25rem,7vw,5rem)] font-extrabold leading-tight text-[var(--ink)]">
              {latest.word}
            </h1>
            <AudioButton
              mode="vocab"
              text={latest.word}
              reading={latest.kana}
              size="md"
              label={`Pronounce ${latest.word}`}
            />
          </div>

          <p
            className="mt-1 font-japanese text-2xl sm:text-3xl text-[var(--muted)]"
            aria-label={`Reading ${latest.kana}`}
          >
            {latest.kana.slice(0, splitAt)}
            <span className="font-bold text-[var(--primary)] bg-[var(--sakura-light)] px-1.5 py-0.5 rounded-lg underline decoration-[var(--sakura)] underline-offset-4">
              {latest.kana.slice(splitAt)}
            </span>
          </p>

          <p className="mt-2 max-w-lg text-sm text-[var(--muted)]">
            {formatShiritoriMeaning(latest)}
          </p>

          {/* Prompt: Next word starts with */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-[var(--primary)]/30 bg-[var(--sakura-light)]/40 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--ink)]">
            <span>Next word starts with</span>
            <span className="rounded-lg bg-[var(--primary)] px-2.5 py-0.5 font-japanese text-lg font-bold normal-case text-white shadow-2xs">
              {state.nextKana}
            </span>
            {allowedStarts.length > 1 && (
              <span className="text-xs font-normal normal-case text-[var(--muted)]">
                (or {allowedStarts.filter((k) => k !== state.nextKana).map((k) => `「${k}」`).join(", ")})
              </span>
            )}
          </div>
        </section>

        {/* Answer Input Command Bar */}
        <div className="mx-auto w-full max-w-3xl">
          {hintWord && (
            <div
              className="mb-2.5 flex items-center justify-between gap-3 rounded-xl border border-[var(--primary)]/40 bg-[var(--sakura-light)]/90 px-3.5 py-2.5 text-sm shadow-xs"
              role="status"
            >
              <div className="flex items-center gap-2 min-w-0">
                <AudioButton
                  mode="vocab"
                  text={hintWord.word}
                  reading={hintWord.kana}
                  size="sm"
                  label={`Pronounce ${hintWord.word}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setAnswer(hintWord.kana);
                    setAnswerError("");
                    inputRef.current?.focus();
                  }}
                  className="min-w-0 text-left transition-opacity hover:opacity-85 cursor-pointer"
                  title="Click to fill into answer"
                >
                  <span className="font-japanese font-bold text-[var(--primary)]">{hintWord.word}</span>
                  <span className="ml-2 font-japanese text-[var(--ink)] font-medium">({hintWord.kana})</span>
                  <span className="ml-2 text-xs text-[var(--muted)] truncate">{formatShiritoriMeaning(hintWord)}</span>
                </button>
              </div>
              <button
                type="button"
                aria-label="Dismiss hint"
                onClick={() => setHintWord(null)}
                className="grid size-8 shrink-0 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          )}

          <form
            onSubmit={submitTurn}
            className={`flex min-h-14 items-center gap-2 rounded-2xl border-2 bg-[var(--surface)] p-2 shadow-sm transition-all ${
              answerError
                ? "border-[var(--wrong)] animate-[kana-shake_400ms_ease-in-out]"
                : "border-[var(--line)] focus-within:border-[var(--primary)] focus-within:shadow-[0_0_0_4px_color-mix(in_srgb,var(--primary)_15%,transparent)]"
            }`}
          >
            <span
              className={`grid min-w-11 place-items-center rounded-xl bg-[var(--primary)] px-2.5 py-2 font-japanese font-bold text-white shadow-2xs ${
                allowedStarts.length > 1 ? "text-sm tracking-tight" : "text-xl"
              }`}
              title={allowedStarts.length > 1 ? `Allowed: ${allowedStarts.join(" or ")}` : undefined}
            >
              {allowedStarts.length > 1 ? allowedStarts.join(" / ") : state.nextKana}
            </span>

            <label className="sr-only" htmlFor="shiritori-answer">
              Type a Japanese word in romaji or kana
            </label>
            <input
              ref={inputRef}
              id="shiritori-answer"
              value={answer}
              onChange={(event) => {
                const converted = convertRomajiBufferToHiragana(event.target.value);
                setAnswer(converted);
                setAnswerError("");
              }}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="Type romaji or kana"
              disabled={isEnded}
              className="min-w-0 flex-1 bg-transparent px-2 py-2 font-japanese text-xl text-[var(--ink)] outline-none placeholder:font-sans placeholder:text-sm placeholder:text-[var(--muted)]"
            />

            <button
              type="button"
              disabled={state.hintsRemaining === 0 || isEnded}
              onClick={requestHint}
              className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 text-xs font-bold text-[var(--muted)] transition-colors hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              aria-label={`Use hint, ${state.hintsRemaining} remaining`}
            >
              <Lightbulb size={15} className="text-[var(--primary)]" />
              <span>{state.hintsRemaining}</span>
            </button>

            <button
              type="submit"
              disabled={isEnded || !answer.trim()}
              className="min-h-10 shrink-0 rounded-xl bg-[var(--primary)] px-4 text-sm font-extrabold text-white shadow-xs transition-all hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
            >
              Play ↵
            </button>
          </form>

          <p className="mt-1.5 min-h-5 text-center text-xs font-semibold text-[var(--wrong)]" role="alert">
            {answerError}
          </p>
          <p className="sr-only" aria-live="polite">{bookmarkMessage}</p>
        </div>

        {/* Chain History */}
        <section className="mx-auto mt-2 w-full max-w-3xl" aria-labelledby="chain-heading">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <h2 id="chain-heading" className="text-sm font-extrabold text-[var(--ink)]">
              The Chain So Far
            </h2>
            <span className="rounded-full bg-[var(--sakura-light)] px-2.5 py-0.5 text-xs font-bold text-[var(--primary)] tabular-nums">
              {state.chain.length} {state.chain.length === 1 ? "word" : "words"}
            </span>
          </div>

          <div className="max-h-[38dvh] overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] divide-y divide-[var(--line)] shadow-2xs">
            {[...state.chain].reverse().map((turn, index) => {
              const isLatestTurn = index === 0;
              return (
                <article
                  key={`${turn.word.id}-${state.chain.length - index}`}
                  className={`flex items-center gap-3 px-3.5 py-3 sm:px-4 transition-colors ${
                    isLatestTurn ? "bg-[var(--sakura-light)]/20" : ""
                  }`}
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-xl text-[10px] font-extrabold shadow-2xs ${
                      turn.player === "player" || turn.player === "player1"
                        ? "bg-[var(--primary)] text-white"
                        : turn.player === "player2"
                          ? "bg-[var(--sakura)] text-[var(--ink)]"
                          : "bg-[var(--line)] text-[var(--muted)]"
                    }`}
                    aria-label={
                      turn.player === "player1"
                        ? "Player one"
                        : turn.player === "player2"
                          ? "Player two"
                          : turn.player
                    }
                  >
                    {turn.player === "player1"
                      ? "P1"
                      : turn.player === "player2"
                        ? "P2"
                        : turn.player === "bot"
                          ? "BOT"
                          : "YOU"}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="font-japanese text-base font-bold text-[var(--ink)]">
                        {turn.word.word}
                      </span>
                      <span className="font-japanese text-xs font-medium text-[var(--primary-fg)]">
                        {turn.word.kana}
                      </span>
                      <span className="text-xs text-[var(--muted)] truncate">
                        {formatShiritoriMeaning(turn.word)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="rounded-md bg-[var(--sakura-light)] px-1.5 py-0.5 text-[10px] font-extrabold text-[var(--primary)]">
                      N{turn.word.jlpt}
                    </span>
                    <AudioButton
                      mode="vocab"
                      text={turn.word.word}
                      reading={turn.word.kana}
                      size="sm"
                      label={`Pronounce ${turn.word.word}`}
                    />
                    <button
                      type="button"
                      aria-label={
                        savedIds.has(turn.word.id)
                          ? `${turn.word.word} added to FSRS`
                          : `Add ${turn.word.word} to FSRS`
                      }
                      title={savedIds.has(turn.word.id) ? "Added to FSRS" : "Add to FSRS"}
                      disabled={savedIds.has(turn.word.id) || savingId === turn.word.id}
                      onClick={() => void addWordToSrs(turn.word)}
                      className="grid size-8 shrink-0 place-items-center rounded-lg border border-[var(--line)] text-[var(--muted)] hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary)] disabled:border-transparent disabled:text-[var(--correct)] transition-colors cursor-pointer"
                    >
                      <BookmarkPlus size={15} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>

      {/* Ending Modal / Game Summary */}
      {isEnded && (
        <div
          className="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="shiritori-report-title"
            className="my-auto w-full max-w-lg rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
                  Chain complete
                </p>
                <h2
                  id="shiritori-report-title"
                  className="mt-1 text-2xl font-extrabold text-[var(--ink)]"
                >
                  {state.status === "won"
                    ? "You win"
                    : state.status === "gave-up"
                      ? "Session ended"
                      : state.status === "timed-out"
                        ? "Time is up"
                        : "Chain ended"}
                </h2>
                <p className="mt-1 text-xs text-[var(--muted)]">{state.message}</p>
              </div>
              <button
                type="button"
                aria-label="Change settings"
                onClick={() => router.push("/games/shiritori")}
                className="grid size-9 shrink-0 place-items-center rounded-full border border-[var(--line)] text-[var(--muted)] hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary)] transition-colors cursor-pointer"
              >
                <ArrowLeft size={16} />
              </button>
            </div>

            {/* Core Metrics: Chain Length & Longest Word */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4 text-center sm:text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Chain length
                </span>
                <strong className="mt-1 block text-3xl font-black text-[var(--primary)] tabular-nums">
                  {state.chain.length}
                </strong>
                <span className="text-[11px] text-[var(--muted)]">words linked</span>
              </div>

              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4 text-center sm:text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Longest word
                </span>
                <strong className="mt-1 block font-japanese text-xl font-bold text-[var(--ink)] truncate">
                  {longest?.word ?? "—"}
                </strong>
                <span className="text-[11px] text-[var(--muted)]">
                  {longest?.kana ? `${[...longest.kana].length} kana` : "—"}
                </span>
              </div>
            </div>

            {/* JLPT Words Distribution */}
            <div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                JLPT words
              </h3>
              <div className="flex flex-wrap gap-2">
                {([1, 2, 3, 4, 5] as const).map((level) => (
                  <span
                    key={level}
                    className="rounded-full bg-[var(--sakura-light)] px-3 py-1.5 text-xs font-bold text-[var(--ink)]"
                  >
                    N{level} · {levelCounts[level] ?? 0}
                  </span>
                ))}
              </div>
            </div>

            {/* Hinted Words Section */}
            {hintedWords.length > 0 && (
              <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3.5">
                <p className="text-xs font-semibold text-[var(--muted)]">
                  {hintedWords.length} hinted {hintedWords.length === 1 ? "word" : "words"} can be added to your review deck.
                </p>
              </div>
            )}

            {/* Primary Action Buttons */}
            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                disabled={!hintedWords.length}
                onClick={() => void addHintedWords()}
                className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 text-xs font-bold text-[var(--ink)] shadow-2xs transition-colors hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)] disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
              >
                <BookmarkPlus size={15} />
                <span>Add missed/hinted words to FSRS</span>
              </button>

              <button
                type="button"
                onClick={playAgain}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-extrabold text-white shadow-sm transition-all hover:bg-[var(--primary-hover)] cursor-pointer"
              >
                <span>Play Again</span>
                <ArrowRight size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => router.push("/games/shiritori")}
              className="mt-2.5 flex min-h-11 w-full items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 text-xs font-bold text-[var(--muted)] transition-colors hover:border-[var(--sakura)] hover:text-[var(--ink)] cursor-pointer"
            >
              Change Settings
            </button>
          </section>
        </div>
      )}
      <QuitSessionDialog open={quitDialogOpen} onCancel={cancelQuit} onConfirm={quitSession} />
    </GameLayout>
  );
}
