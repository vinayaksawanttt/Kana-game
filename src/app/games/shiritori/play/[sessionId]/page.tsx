"use client";

import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookmarkPlus, Lightbulb, Volume2, VolumeX, X } from "lucide-react";
import {
  chooseBotWord,
  createShiritoriState,
  getEffectiveEndKana,
  romajiToHiragana,
  useHint as getHintForTurn,
  validateTurn,
  type ShiritoriDictionary,
  type ShiritoriSettings,
  type ShiritoriState,
  type ShiritoriWord,
} from "@/engine/shiritori";
import { loadShiritoriData } from "@/data/shiritori";
import { addVocabularyToSrs } from "@/lib/srs/service";
import { GameLayout } from "@/lib/game-core/layout";

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
    typeof settings.sound === "boolean" && typeof settings.allowUnverified === "boolean";
}

function difficultyLabel(difficulty: ShiritoriSettings["difficulty"]): string {
  return difficulty === "yasashii" ? "やさしい" : difficulty === "futsuu" ? "ふつう" : "おに";
}

function speak(word: ShiritoriWord): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word.kana);
  utterance.lang = "ja-JP";
  window.speechSynthesis.speak(utterance);
}

export default function ShiritoriPlayPage() {
  return (
    <Suspense fallback={<main className="grid min-h-dvh place-items-center bg-[var(--bg)] text-[var(--muted)]">Preparing chain...</main>}>
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
  const [soundOn, setSoundOn] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [savingId, setSavingId] = useState("");
  const [bookmarkMessage, setBookmarkMessage] = useState("");
  const [turnSecondsLeft, setTurnSecondsLeft] = useState(0);
  const [blitzSecondsLeft, setBlitzSecondsLeft] = useState(60);
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ShiritoriState | null>(null);
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
      void loadShiritoriData().then((dictionary) => {
        if (!active) return;
        setSoundOn(settings.sound);
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
    const result = validateTurn(answer, state, game.dictionary);
    if (!result.valid) {
      setAnswerError(result.error);
      if (result.loseByN) setState(result.state);
      return;
    }

    setAnswer("");
    setAnswerError("");
    setHintWord(null);
    setState(result.state);
    if (result.word.meaning === "Unverified word") setBookmarkMessage("Word accepted as unverified");

    if (state.settings.mode === "friend") return;
    const botWord = chooseBotWord(result.state, game.dictionary);
    if (!botWord) {
      setState({ ...result.state, status: "won", message: "The dictionary has no unused word for that kana." });
      return;
    }
    const botState: ShiritoriState = {
      ...result.state,
      chain: [...result.state.chain, { word: botWord, player: "bot" }],
      usedIds: new Set([...result.state.usedIds, botWord.id]),
      nextKana: getEffectiveEndKana(botWord.kana),
    };
    if (botWord.endKana === "ん") {
      setState({ ...botState, status: "won", message: "The dictionary ended on ん. You win!" });
    } else {
      setState(botState);
      if (soundOn) speak(botWord);
    }
  }

  function requestHint() {
    if (!game || !state || state.status !== "playing") return;
    const result = getHintForTurn(state, game.dictionary);
    setState(result.state);
    setHintWord(result.word ?? null);
    if (result.word && !hintedWords.some((word) => word.id === result.word?.id)) {
      setHintedWords((current) => [...current, result.word!]);
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
    return <main className="grid min-h-dvh place-items-center bg-[var(--bg)] text-[var(--muted)]">Preparing chain...</main>;
  }

  const latest = state.chain.at(-1)?.word ?? openingWord;
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
    <GameLayout label="SHIRITORI" glyph="鎖" className="min-h-dvh">
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {state.settings.mode !== "friend" && <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold">{difficultyLabel(state.settings.difficulty)}</span>}
            {state.settings.mode === "friend" && <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold">{state.currentPlayer === "player1" ? "P1 turn" : "P2 turn"}</span>}
            <span className="text-sm font-extrabold">Chain: {state.chain.length}</span>
            {timerLimit > 0 && <span className="min-w-14 text-right text-sm font-bold tabular-nums">{timerRemaining}s</span>}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" aria-label={soundOn ? "Mute pronunciation" : "Unmute pronunciation"} title={soundOn ? "Mute pronunciation" : "Unmute pronunciation"} onClick={() => setSoundOn((enabled) => !enabled)} className="grid size-10 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)]">
              {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
            </button>
            <button type="button" disabled={isEnded} onClick={() => setState((current) => current ? { ...current, status: "gave-up", message: "You ended the chain." } : current)} className="min-h-10 rounded-md border border-[var(--line)] px-3 text-sm font-bold text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-50">Give up</button>
          </div>
        </div>
        {timerLimit > 0 && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--line)]" role="progressbar" aria-label={state.settings.mode === "blitz" ? "Blitz time remaining" : "Turn time remaining"} aria-valuenow={timerRemaining} aria-valuemin={0} aria-valuemax={timerLimit}><div className={`h-full rounded-full transition-[width] duration-300 ${timerRemaining <= 5 ? "bg-[var(--wrong)]" : "bg-[var(--primary)]"}`} style={{ width: `${timerPercent}%` }} /></div>}

        <section className="flex flex-col items-center py-6 text-center sm:py-8" aria-label="Current word">
          <div className="flex items-center justify-center gap-2">
            <h1 className="font-japanese break-keep text-[clamp(3rem,6vw,4.5rem)] leading-tight">{latest.word}</h1>
            <button type="button" aria-label={`Play pronunciation for ${latest.word}`} onClick={() => soundOn && speak(latest)} className="grid size-10 shrink-0 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary)]"><Volume2 size={19} /></button>
          </div>
          <p className="mt-1 font-japanese text-2xl text-[var(--muted)]" aria-label={`Reading ${latest.kana}`}>
            {latest.kana.slice(0, splitAt)}<span className="font-bold text-[var(--primary)] underline decoration-[var(--sakura)] underline-offset-4">{latest.kana.slice(splitAt)}</span>
          </p>
          <p className="mt-2 text-sm italic text-[var(--muted)]">{latest.meaning}</p>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Next word starts with <span className="rounded bg-[var(--sakura-light)] px-2 py-1 font-japanese text-lg normal-case text-[var(--primary)]">{state.nextKana}</span></p>
        </section>

        <div className="mx-auto w-full max-w-3xl">
          {hintWord && (
            <div className="mb-2 flex items-center justify-between gap-3 rounded-lg border border-[var(--sakura)] bg-[var(--sakura-light)] px-3 py-2 text-sm" role="status">
              <button type="button" onClick={() => { setAnswer(hintWord.kana); inputRef.current?.focus(); }} className="min-w-0 text-left"><span className="font-japanese font-bold text-[var(--primary)]">{hintWord.word}</span><span className="ml-2 font-japanese text-[var(--muted)]">{hintWord.kana}</span><span className="ml-2 text-[var(--muted)]">{hintWord.meaning}</span></button>
              <button type="button" aria-label="Dismiss hint" onClick={() => setHintWord(null)} className="grid size-8 shrink-0 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--surface)]"><X size={15} /></button>
            </div>
          )}
          <form onSubmit={submitTurn} className={`flex min-h-14 items-center gap-2 rounded-xl border bg-[var(--surface)] p-1.5 shadow-sm ${answerError ? "border-[var(--wrong)] animate-[kana-shake_400ms_ease-in-out]" : "border-[var(--line)] focus-within:border-[var(--primary)]"}`}>
            <span className="grid min-w-10 place-items-center rounded-lg bg-[var(--sakura-light)] px-2 py-2 font-japanese text-xl font-bold text-[var(--primary)]">{state.nextKana}</span>
            <label className="sr-only" htmlFor="shiritori-answer">Type a Japanese word in romaji or kana</label>
            <input ref={inputRef} id="shiritori-answer" value={answer} onChange={(event) => { setAnswer(event.target.value); setAnswerError(""); }} autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder="Type romaji or kana" disabled={isEnded} className="min-w-0 flex-1 bg-transparent px-1 py-2 font-japanese text-xl outline-none placeholder:font-sans placeholder:text-sm placeholder:text-[var(--muted)]" />
            <span className="hidden rounded bg-[var(--sakura-light)] px-2 py-1 font-japanese text-sm text-[var(--muted)] sm:inline">{romajiToHiragana(answer) || "かな"}</span>
            <button type="button" disabled={state.hintsRemaining === 0 || isEnded} onClick={requestHint} className="flex min-h-10 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-bold text-[var(--muted)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary)] disabled:opacity-40" aria-label={`Use hint, ${state.hintsRemaining} remaining`}><Lightbulb size={17} /><span>{state.hintsRemaining}</span></button>
            <button type="submit" disabled={isEnded || !answer.trim()} className="min-h-10 shrink-0 rounded-lg bg-[var(--primary)] px-3 text-sm font-extrabold text-white hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-45">Play ↵</button>
          </form>
          <p className="mt-1 min-h-5 text-center text-sm text-[var(--wrong)]" role="alert">{answerError}</p>
          <p className="sr-only" aria-live="polite">{bookmarkMessage}</p>
        </div>

        <section className="mx-auto mt-2 w-full max-w-3xl" aria-labelledby="chain-heading">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 id="chain-heading" className="text-sm font-extrabold">The Chain So Far</h2>
            <span className="text-xs text-[var(--muted)]">{state.chain.length} {state.chain.length === 1 ? "word" : "words"}</span>
          </div>
          <div className="max-h-[38dvh] overflow-y-auto rounded-lg border border-[var(--line)] bg-[var(--surface)]">
            {[...state.chain].reverse().map((turn, index) => (
              <article key={`${turn.word.id}-${state.chain.length - index}`} className="flex items-center gap-3 border-b border-[var(--line)] px-3 py-2.5 last:border-b-0 sm:px-4">
                <span className={`grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-extrabold ${turn.player === "player" || turn.player === "player1" ? "bg-[var(--primary)] text-white" : turn.player === "player2" ? "bg-[var(--sakura)] text-[var(--ink)]" : "bg-[var(--sakura-light)] text-[var(--muted)]"}`} aria-label={turn.player === "player1" ? "Player one" : turn.player === "player2" ? "Player two" : turn.player}>
                  {turn.player === "player1" ? "P1" : turn.player === "player2" ? "P2" : turn.player === "bot" ? "BOT" : "YOU"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="font-japanese text-base font-bold">{turn.word.word}</span>
                    <span className="font-japanese text-xs text-[var(--muted)]">{turn.word.kana}</span>
                    <span className="text-xs text-[var(--muted)]">{turn.word.meaning}</span>
                  </div>
                </div>
                <span className="rounded bg-[var(--sakura-light)] px-2 py-1 text-[10px] font-extrabold">N{turn.word.jlpt}</span>
                <button type="button" aria-label={`Play pronunciation for ${turn.word.word}`} onClick={() => soundOn && speak(turn.word)} className="grid size-8 shrink-0 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary)]"><Volume2 size={15} /></button>
                <button type="button" aria-label={savedIds.has(turn.word.id) ? `${turn.word.word} added to FSRS` : `Add ${turn.word.word} to FSRS`} title={savedIds.has(turn.word.id) ? "Added to FSRS" : "Add to FSRS"} disabled={savedIds.has(turn.word.id) || savingId === turn.word.id} onClick={() => void addWordToSrs(turn.word)} className="grid size-8 shrink-0 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary)] disabled:text-[var(--correct)]"><BookmarkPlus size={16} /></button>
              </article>
            ))}
          </div>
        </section>
      </section>

      {isEnded && (
        <div className="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-[rgba(24,12,16,0.58)] p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="shiritori-report-title" className="my-auto w-full max-w-lg rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">Chain complete</p><h2 id="shiritori-report-title" className="mt-1 text-2xl font-extrabold">{state.status === "won" ? "You win" : state.status === "gave-up" ? "Session ended" : state.status === "timed-out" ? "Time is up" : "Chain ended"}</h2><p className="mt-1 text-sm text-[var(--muted)]">{state.message}</p></div>
              <button type="button" aria-label="Change settings" onClick={() => router.push("/games/shiritori")} className="grid size-9 shrink-0 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--sakura-light)]"><ArrowLeft size={17} /></button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-[var(--line)] p-3"><span className="block text-xs text-[var(--muted)]">Chain length</span><strong className="mt-1 block text-2xl">{state.chain.length}</strong></div>
              <div className="rounded-lg border border-[var(--line)] p-3"><span className="block text-xs text-[var(--muted)]">Longest word</span><strong className="mt-1 block font-japanese text-xl">{longest?.word ?? "—"}</strong></div>
            </div>
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-extrabold">JLPT words</h3>
              <div className="flex flex-wrap gap-2">{([1, 2, 3, 4, 5] as const).map((level) => <span key={level} className="rounded-full bg-[var(--sakura-light)] px-3 py-1.5 text-xs font-bold">N{level} · {levelCounts[level] ?? 0}</span>)}</div>
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <button type="button" disabled={!hintedWords.length} onClick={() => void addHintedWords()} className="min-h-11 rounded-lg border border-[var(--line)] px-3 text-sm font-bold hover:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-45">Add missed/hinted words to FSRS</button>
              <button type="button" onClick={playAgain} className="min-h-11 rounded-lg bg-[var(--primary)] px-3 text-sm font-extrabold text-white hover:bg-[var(--primary-hover)]">Play Again</button>
            </div>
            <button type="button" onClick={() => router.push("/games/shiritori")} className="mt-2 min-h-11 w-full rounded-lg px-3 text-sm font-bold text-[var(--muted)] hover:bg-[var(--sakura-light)]">Change Settings</button>
            {hintedWords.length > 0 && <p className="mt-2 text-xs text-[var(--muted)]">{hintedWords.length} hinted {hintedWords.length === 1 ? "word" : "words"} can be added to your review deck.</p>}
          </section>
        </div>
      )}
    </GameLayout>
  );
}
