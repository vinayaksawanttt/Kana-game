"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Volume2,
  Square,
  Sparkles,
  Pause,
  Play,
  Gauge,
} from "lucide-react";
import {
  kanaCharacters,
  type KanaCharacter,
  type KanaScript,
} from "@/data/kana";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";

interface VowelSlot {
  type: "character";
  character: KanaCharacter;
}

interface EmptySlot {
  type: "empty";
  id: string;
}

type Slot = VowelSlot | EmptySlot;

interface GojuonRowDef {
  key: string;
  romajiLabel: string;
  hiraLabel: string;
  kataLabel: string;
  hiraChars: Array<string | null>;
  kataChars: Array<string | null>;
}

const basicRowDefs: GojuonRowDef[] = [
  {
    key: "vowel",
    romajiLabel: "A",
    hiraLabel: "あ行",
    kataLabel: "ア行",
    hiraChars: ["あ", "い", "う", "え", "お"],
    kataChars: ["ア", "イ", "ウ", "エ", "オ"],
  },
  {
    key: "k",
    romajiLabel: "KA",
    hiraLabel: "か行",
    kataLabel: "カ行",
    hiraChars: ["か", "き", "く", "け", "こ"],
    kataChars: ["カ", "キ", "ク", "ケ", "コ"],
  },
  {
    key: "s",
    romajiLabel: "SA",
    hiraLabel: "さ行",
    kataLabel: "サ行",
    hiraChars: ["さ", "し", "す", "せ", "そ"],
    kataChars: ["サ", "シ", "ス", "セ", "ソ"],
  },
  {
    key: "t",
    romajiLabel: "TA",
    hiraLabel: "た行",
    kataLabel: "タ行",
    hiraChars: ["た", "ち", "つ", "て", "と"],
    kataChars: ["タ", "チ", "ツ", "テ", "ト"],
  },
  {
    key: "n",
    romajiLabel: "NA",
    hiraLabel: "な行",
    kataLabel: "ナ行",
    hiraChars: ["な", "に", "ぬ", "ね", "の"],
    kataChars: ["ナ", "ニ", "ヌ", "ネ", "ノ"],
  },
  {
    key: "h",
    romajiLabel: "HA",
    hiraLabel: "は行",
    kataLabel: "ハ行",
    hiraChars: ["は", "ひ", "ふ", "へ", "ほ"],
    kataChars: ["ハ", "ヒ", "フ", "ヘ", "ホ"],
  },
  {
    key: "m",
    romajiLabel: "MA",
    hiraLabel: "ま行",
    kataLabel: "マ行",
    hiraChars: ["ま", "み", "む", "め", "も"],
    kataChars: ["マ", "ミ", "ム", "メ", "モ"],
  },
  {
    key: "y",
    romajiLabel: "YA",
    hiraLabel: "や行",
    kataLabel: "ヤ行",
    hiraChars: ["や", null, "ゆ", null, "よ"],
    kataChars: ["ヤ", null, "ユ", null, "ヨ"],
  },
  {
    key: "r",
    romajiLabel: "RA",
    hiraLabel: "ら行",
    kataLabel: "ラ行",
    hiraChars: ["ら", "り", "る", "れ", "ろ"],
    kataChars: ["ラ", "リ", "ル", "レ", "ロ"],
  },
  {
    key: "w",
    romajiLabel: "WA",
    hiraLabel: "わ行",
    kataLabel: "ワ行",
    hiraChars: ["わ", null, null, null, "を"],
    kataChars: ["ワ", null, null, null, "ヲ"],
  },
  {
    key: "n-sound",
    romajiLabel: "N",
    hiraLabel: "ん",
    kataLabel: "ン",
    hiraChars: ["ん", null, null, null, null],
    kataChars: ["ン", null, null, null, null],
  },
];

const dakutenRowDefs: GojuonRowDef[] = [
  {
    key: "g",
    romajiLabel: "GA",
    hiraLabel: "が行",
    kataLabel: "ガ行",
    hiraChars: ["が", "ぎ", "ぐ", "げ", "ご"],
    kataChars: ["ガ", "ギ", "グ", "ゲ", "ゴ"],
  },
  {
    key: "z",
    romajiLabel: "ZA",
    hiraLabel: "ざ行",
    kataLabel: "ザ行",
    hiraChars: ["ざ", "じ", "ず", "ぜ", "ぞ"],
    kataChars: ["ザ", "ジ", "ズ", "ゼ", "ゾ"],
  },
  {
    key: "d",
    romajiLabel: "DA",
    hiraLabel: "だ行",
    kataLabel: "ダ行",
    hiraChars: ["だ", "ぢ", "づ", "で", "ど"],
    kataChars: ["ダ", "ヂ", "ヅ", "デ", "ド"],
  },
  {
    key: "b",
    romajiLabel: "BA",
    hiraLabel: "ば行",
    kataLabel: "バ行",
    hiraChars: ["ば", "び", "ぶ", "べ", "ぼ"],
    kataChars: ["バ", "ビ", "ブ", "ベ", "ボ"],
  },
  {
    key: "p",
    romajiLabel: "PA",
    hiraLabel: "ぱ行",
    kataLabel: "パ行",
    hiraChars: ["ぱ", "ぴ", "ぷ", "ぺ", "ぽ"],
    kataChars: ["パ", "ピ", "プ", "ペ", "ポ"],
  },
];

interface YoonRowDef {
  key: string;
  romajiLabel: string;
  hiraLabel: string;
  kataLabel: string;
  hiraChars: string[];
  kataChars: string[];
}

const yoonRowDefs: YoonRowDef[] = [
  { key: "ky", romajiLabel: "KYA", hiraLabel: "きゃ行", kataLabel: "キャ行", hiraChars: ["きゃ", "きゅ", "きょ"], kataChars: ["キャ", "キュ", "キョ"] },
  { key: "sh", romajiLabel: "SHA", hiraLabel: "しゃ行", kataLabel: "シャ行", hiraChars: ["しゃ", "しゅ", "しょ"], kataChars: ["シャ", "シュ", "ショ"] },
  { key: "ch", romajiLabel: "CHA", hiraLabel: "ちゃ行", kataLabel: "チャ行", hiraChars: ["ちゃ", "ちゅ", "ちょ"], kataChars: ["チャ", "チュ", "チョ"] },
  { key: "ny", romajiLabel: "NYA", hiraLabel: "にゃ行", kataLabel: "ニャ行", hiraChars: ["にゃ", "にゅ", "にょ"], kataChars: ["ニャ", "ニュ", "ニョ"] },
  { key: "hy", romajiLabel: "HYA", hiraLabel: "ひゃ行", kataLabel: "ヒャ行", hiraChars: ["ひゃ", "ひゅ", "ひょ"], kataChars: ["ヒャ", "ヒュ", "ヒョ"] },
  { key: "my", romajiLabel: "MYA", hiraLabel: "みゃ行", kataLabel: "ミャ行", hiraChars: ["みゃ", "みゅ", "みょ"], kataChars: ["ミャ", "ミュ", "ミョ"] },
  { key: "ry", romajiLabel: "RYA", hiraLabel: "りゃ行", kataLabel: "リャ行", hiraChars: ["りゃ", "りゅ", "りょ"], kataChars: ["リャ", "リュ", "リョ"] },
  { key: "gy", romajiLabel: "GYA", hiraLabel: "ぎゃ行", kataLabel: "ギャ行", hiraChars: ["ぎゃ", "ぎゅ", "ぎょ"], kataChars: ["ギャ", "ギュ", "ギョ"] },
  { key: "j", romajiLabel: "JA", hiraLabel: "じゃ行", kataLabel: "ジャ行", hiraChars: ["じゃ", "じゅ", "じょ"], kataChars: ["ジャ", "ジュ", "ジョ"] },
  { key: "by", romajiLabel: "BYA", hiraLabel: "びゃ行", kataLabel: "ビャ行", hiraChars: ["びゃ", "びゅ", "びょ"], kataChars: ["ビャ", "ビュ", "ビョ"] },
  { key: "py", romajiLabel: "PYA", hiraLabel: "ぴゃ行", kataLabel: "ピャ行", hiraChars: ["ぴゃ", "ぴゅ", "ぴょ"], kataChars: ["ピャ", "ピュ", "ピョ"] },
];

interface ExtendedGroupDef {
  key: string;
  romajiLabel: string;
  desc: string;
  chars: string[];
}

const extendedGroupDefs: ExtendedGroupDef[] = [
  { key: "fa", romajiLabel: "FA", desc: "F sounds", chars: ["ファ", "フィ", "フェ", "フォ"] },
  { key: "ti", romajiLabel: "TI / DI", desc: "T & D affixes", chars: ["ティ", "トゥ", "ディ", "ドゥ", "デュ"] },
  { key: "we", romajiLabel: "WI / WE", desc: "W combinations", chars: ["ウィ", "ウェ", "ウォ"] },
  { key: "she", romajiLabel: "SHE / JE / CHE", desc: "Palatal affricates", chars: ["シェ", "ジェ", "チェ"] },
  { key: "vu", romajiLabel: "VU", desc: "V voiced fricatives", chars: ["ヴァ", "ヴィ", "ヴ", "ヴェ", "ヴォ"] },
  { key: "tsa", romajiLabel: "TSA", desc: "Affricate extensions", chars: ["ツァ", "ツィ", "ツェ", "ツォ"] },
  { key: "ye", romajiLabel: "YE", desc: "Ye diphthong", chars: ["イェ"] },
  { key: "kwa", romajiLabel: "KW", desc: "Velar glide", chars: ["クァ", "クィ", "クェ", "クォ"] },
];

interface ActiveSequence {
  targetKey: string;
  characters: KanaCharacter[];
  currentIndex: number;
  status: "playing" | "paused";
}

export function KanaRevisionSheet({ onClose }: { onClose: () => void }) {
  const [script, setScript] = useState<KanaScript>("hiragana");
  const [showRomaji, setShowRomaji] = useState(false);
  const [activeSection, setActiveSection] = useState<"basic" | "dakuten" | "yoon" | "extended">("basic");
  const [activeSequence, setActiveSequence] = useState<ActiveSequence | null>(null);
  const [activeTileId, setActiveTileId] = useState<string | null>(null);
  const [hoveredCoord, setHoveredCoord] = useState<{ section: "basic" | "dakuten" | "yoon"; rowKey: string; colIndex: number } | null>(null);

  const sequenceRef = useRef<{
    aborted: boolean;
    paused: boolean;
    resumePromiseResolve: (() => void) | null;
    delayPromiseResolve: (() => void) | null;
  }>({
    aborted: false,
    paused: false,
    resumePromiseResolve: null,
    delayPromiseResolve: null,
  });

  const {
    playKana,
    playKanaAsync,
    stopAudio,
    isPlaying,
    activeKey,
    activeChar,
    toKanaAudioKey,
    playbackSpeed = 1,
    setPlaybackSpeed,
  } = useJapaneseAudio();

  useEffect(() => {
    if (!isPlaying) {
      setActiveTileId(null);
    }
  }, [isPlaying]);

  const characterMap = useMemo(() => {
    const map = new Map<string, KanaCharacter>();
    for (const c of kanaCharacters) {
      map.set(`${c.script}:${c.char}`, c);
    }
    return map;
  }, []);

  const basicRows = useMemo(() => {
    return basicRowDefs.map((def) => {
      const chars = script === "hiragana" ? def.hiraChars : def.kataChars;
      const slots: Slot[] = chars.map((char, colIndex) => {
        if (!char) {
          return { type: "empty", id: `${def.key}-empty-${colIndex}` };
        }
        const found = characterMap.get(`${script}:${char}`);
        if (!found) {
          return { type: "empty", id: `${def.key}-missing-${colIndex}` };
        }
        return { type: "character", character: found };
      });

      const validCharacters = slots
        .filter((s): s is VowelSlot => s.type === "character")
        .map((s) => s.character);

      return {
        ...def,
        label: script === "hiragana" ? def.hiraLabel : def.kataLabel,
        slots,
        characters: validCharacters,
      };
    });
  }, [script, characterMap]);

  const dakutenRows = useMemo(() => {
    return dakutenRowDefs.map((def) => {
      const chars = script === "hiragana" ? def.hiraChars : def.kataChars;
      const slots: Slot[] = chars.map((char, colIndex) => {
        if (!char) {
          return { type: "empty", id: `${def.key}-empty-${colIndex}` };
        }
        const found = characterMap.get(`${script}:${char}`);
        if (!found) {
          return { type: "empty", id: `${def.key}-missing-${colIndex}` };
        }
        return { type: "character", character: found };
      });

      const validCharacters = slots
        .filter((s): s is VowelSlot => s.type === "character")
        .map((s) => s.character);

      return {
        ...def,
        label: script === "hiragana" ? def.hiraLabel : def.kataLabel,
        slots,
        characters: validCharacters,
      };
    });
  }, [script, characterMap]);

  const yoonRows = useMemo(() => {
    return yoonRowDefs.map((def) => {
      const chars = script === "hiragana" ? def.hiraChars : def.kataChars;
      const validCharacters = chars
        .map((char) => characterMap.get(`${script}:${char}`))
        .filter((item): item is KanaCharacter => Boolean(item));

      return {
        ...def,
        label: script === "hiragana" ? def.hiraLabel : def.kataLabel,
        characters: validCharacters,
      };
    });
  }, [script, characterMap]);

  const extendedGroups = useMemo(() => {
    if (script !== "katakana") return [];
    return extendedGroupDefs.map((group) => {
      const characters = group.chars
        .map((char) => characterMap.get(`katakana:${char}`))
        .filter((item): item is KanaCharacter => Boolean(item));

      return {
        ...group,
        characters,
      };
    });
  }, [script, characterMap]);

  // Stop any active sequence completely
  const stopSequence = useCallback(() => {
    sequenceRef.current.aborted = true;
    sequenceRef.current.paused = false;
    if (sequenceRef.current.resumePromiseResolve) {
      const r = sequenceRef.current.resumePromiseResolve;
      sequenceRef.current.resumePromiseResolve = null;
      r();
    }
    if (sequenceRef.current.delayPromiseResolve) {
      const r = sequenceRef.current.delayPromiseResolve;
      sequenceRef.current.delayPromiseResolve = null;
      r();
    }
    stopAudio?.();
    setActiveTileId(null);
    setActiveSequence(null);
  }, [stopAudio]);

  // Pause sequence at current spot
  const pauseSequence = useCallback(() => {
    sequenceRef.current.paused = true;
    if (sequenceRef.current.delayPromiseResolve) {
      const r = sequenceRef.current.delayPromiseResolve;
      sequenceRef.current.delayPromiseResolve = null;
      r();
    }
    stopAudio?.();
    setActiveSequence((prev) => (prev ? { ...prev, status: "paused" } : null));
  }, [stopAudio]);

  // Resume sequence from spot
  const resumeSequence = useCallback(() => {
    sequenceRef.current.paused = false;
    setActiveSequence((prev) => (prev ? { ...prev, status: "playing" } : null));
    if (sequenceRef.current.resumePromiseResolve) {
      const r = sequenceRef.current.resumePromiseResolve;
      sequenceRef.current.resumePromiseResolve = null;
      r();
    }
  }, []);

  // Start sequence playback
  const startSequence = useCallback(
    async (targetKey: string, characters: KanaCharacter[], startIndex = 0) => {
      // Abort previous sequence if running
      sequenceRef.current.aborted = true;
      sequenceRef.current.paused = false;
      if (sequenceRef.current.resumePromiseResolve) {
        sequenceRef.current.resumePromiseResolve();
        sequenceRef.current.resumePromiseResolve = null;
      }
      if (sequenceRef.current.delayPromiseResolve) {
        sequenceRef.current.delayPromiseResolve();
        sequenceRef.current.delayPromiseResolve = null;
      }
      stopAudio?.();
      setActiveTileId(null);

      const controller = {
        aborted: false,
        paused: false,
        resumePromiseResolve: null as (() => void) | null,
        delayPromiseResolve: null as (() => void) | null,
      };
      sequenceRef.current = controller;

      setActiveSequence({
        targetKey,
        characters,
        currentIndex: startIndex,
        status: "playing",
      });

      for (let i = startIndex; i < characters.length; i++) {
        if (controller.aborted) break;

        // If paused, wait here until resumed
        if (controller.paused) {
          await new Promise<void>((resolve) => {
            controller.resumePromiseResolve = resolve;
          });
          controller.resumePromiseResolve = null;
          if (controller.aborted) break;
        }

        // Highlight currently spoken character
        setActiveSequence((prev) => (prev ? { ...prev, currentIndex: i, status: "playing" } : null));

        const charItem = characters[i];
        if (playKanaAsync) {
          await playKanaAsync(charItem.char, charItem.romaji[0]);
        } else {
          playKana(charItem.char, charItem.romaji[0]);
        }

        if (controller.aborted) break;

        // If paused right after audio ended
        if (controller.paused) {
          await new Promise<void>((resolve) => {
            controller.resumePromiseResolve = resolve;
          });
          controller.resumePromiseResolve = null;
          if (controller.aborted) break;
        }

        // Rhythmic gap between characters, scaled by playback speed
        if (i < characters.length - 1) {
          const currentSpeed = playbackSpeed || 1;
          const delay = Math.round(300 / currentSpeed);
          await new Promise<void>((resolve) => {
            controller.delayPromiseResolve = resolve;
            setTimeout(() => {
              if (controller.delayPromiseResolve === resolve) {
                controller.delayPromiseResolve = null;
                resolve();
              }
            }, delay);
          });
          if (controller.aborted) break;
        }
      }

      if (sequenceRef.current === controller && !controller.aborted && !controller.paused) {
        setActiveSequence(null);
      }
    },
    [playKanaAsync, playKana, stopAudio, playbackSpeed]
  );

  const handleTilePlay = useCallback(
    (character: KanaCharacter) => {
      if (activeSequence) {
        stopSequence();
      }
      setActiveTileId(character.id);
      playKana(character.char, character.romaji[0]);
    },
    [activeSequence, stopSequence, playKana]
  );

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      sequenceRef.current.aborted = true;
      if (sequenceRef.current.resumePromiseResolve) {
        sequenceRef.current.resumePromiseResolve();
      }
      if (sequenceRef.current.delayPromiseResolve) {
        sequenceRef.current.delayPromiseResolve();
      }
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-3 pb-16 sm:px-6">
      {/* Top Breadcrumb & Controls */}
      <header className="py-6 sm:py-8">
        <button
          type="button"
          onClick={onClose}
          className="group mb-5 inline-flex min-h-10 items-center gap-2 rounded-xl border border-transparent px-3 text-sm font-semibold text-[var(--muted)] transition-colors hover:border-[var(--line)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          Back to practice setup
        </button>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--sakura)]/30 bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary-fg)]">
              <Sparkles size={13} />
              <span>Gojūon · 五十音図</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Revise the Kana
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-[var(--muted)] sm:text-base">
              Explore characters organized strictly across the 5 Japanese vowel columns (A, I, U, E, O). Tap any card to hear its native pronunciation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Script Tab Switcher */}
            <div
              role="tablist"
              aria-label="Kana script"
              className="inline-flex rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-1.5 shadow-xs"
            >
              {(["hiragana", "katakana"] as KanaScript[]).map((option) => {
                const active = script === option;
                return (
                  <button
                    key={option}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setScript(option);
                      stopSequence();
                    }}
                    className={`min-h-10 cursor-pointer rounded-xl px-4 text-sm font-bold capitalize transition-all duration-150 ${
                      active
                        ? "bg-[var(--primary)] text-white shadow-sm"
                        : "text-[var(--muted)] hover:bg-[var(--sakura-light)]/60 hover:text-[var(--ink)]"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {/* Romaji Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={showRomaji}
              onClick={() => setShowRomaji((visible) => !visible)}
              className={`inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border px-4 text-sm font-bold transition-all duration-150 ${
                showRomaji
                  ? "border-[var(--primary)] bg-[var(--sakura-light)]/50 text-[var(--primary-fg)] shadow-xs"
                  : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--sakura)] hover:text-[var(--ink)]"
              }`}
            >
              <span>Romaji</span>
              <span
                aria-hidden="true"
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                  showRomaji ? "bg-[var(--primary)]" : "bg-[var(--line)]"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                    showRomaji ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </span>
            </button>

            {/* Playback Speed Segmented Toggle (1x, 1.5x, 2x) */}
            <div
              role="group"
              aria-label="Playback speed"
              className="inline-flex min-h-11 items-center rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-1 shadow-xs"
            >
              <span className="flex items-center gap-1 px-2.5 text-xs font-bold text-[var(--muted)] select-none">
                <Gauge size={13} />
                <span className="hidden sm:inline">Speed</span>
              </span>
              {([1, 1.5, 2] as const).map((spd) => {
                const active = (playbackSpeed || 1) === spd;
                return (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setPlaybackSpeed?.(spd)}
                    aria-pressed={active}
                    className={`min-h-9 min-w-9 cursor-pointer rounded-xl px-2.5 text-xs font-bold transition-all duration-150 ${
                      active
                        ? "bg-[var(--primary)] text-white shadow-xs"
                        : "text-[var(--muted)] hover:bg-[var(--sakura-light)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {spd}x
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Jump Anchor Tabs (Sticky for seamless navigation) */}
        <nav
          aria-label="Kana sections"
          className="sticky top-0 z-30 -mx-3 mt-6 flex flex-wrap items-center gap-2 border-b border-[var(--line)] bg-[var(--bg)]/95 px-3 py-3 backdrop-blur-md text-xs font-bold text-[var(--muted)] shadow-2xs sm:-mx-6 sm:px-6"
        >
          <button
            type="button"
            onClick={() => {
              setActiveSection("basic");
              scrollToSection("section-basic");
            }}
            className={`rounded-xl px-3 py-1.5 transition-colors ${
              activeSection === "basic"
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "bg-[var(--surface)] hover:bg-[var(--sakura-light)] hover:text-[var(--ink)] border border-[var(--line)]"
            }`}
          >
            Basic (46)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSection("dakuten");
              scrollToSection("section-dakuten");
            }}
            className={`rounded-xl px-3 py-1.5 transition-colors ${
              activeSection === "dakuten"
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "bg-[var(--surface)] hover:bg-[var(--sakura-light)] hover:text-[var(--ink)] border border-[var(--line)]"
            }`}
          >
            Dakuten & Handakuten (25)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSection("yoon");
              scrollToSection("section-yoon");
            }}
            className={`rounded-xl px-3 py-1.5 transition-colors ${
              activeSection === "yoon"
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "bg-[var(--surface)] hover:bg-[var(--sakura-light)] hover:text-[var(--ink)] border border-[var(--line)]"
            }`}
          >
            Yōon (33)
          </button>
          {script === "katakana" && (
            <button
              type="button"
              onClick={() => {
                setActiveSection("extended");
                scrollToSection("section-extended");
              }}
              className={`rounded-xl px-3 py-1.5 transition-colors ${
                activeSection === "extended"
                  ? "bg-[var(--primary)] text-white shadow-xs"
                  : "bg-[var(--surface)] hover:bg-[var(--sakura-light)] hover:text-[var(--ink)] border border-[var(--line)]"
              }`}
            >
              Extended Katakana (29)
            </button>
          )}
        </nav>
      </header>

      {/* Main Sections */}
      <div className="space-y-10">
        {/* 1. BASIC KANA (46 Characters across 5 Vowel Columns) */}
        <section
          id="section-basic"
          aria-label="Basic"
          className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm sm:p-7"
        >
          {/* Section Header */}
          <div className="mb-6 flex flex-col gap-3 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-wide text-[var(--ink)] uppercase sm:text-lg">
                  Basic Kana
                </h2>
                <span className="font-japanese text-xs text-[var(--muted)]">五十音</span>
              </div>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                11 consonant rows harmonized with the 5 core Japanese vowels.
              </p>
            </div>

            {/* Solid Playback Controls (Listen All / Pause / Resume / Stop) */}
            <div className="flex items-center gap-2">
              {activeSequence?.targetKey === "basic-all" ? (
                <div className="flex items-center gap-1.5">
                  {activeSequence.status === "playing" ? (
                    <button
                      type="button"
                      onClick={pauseSequence}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[var(--primary)] bg-[var(--sakura-light)] px-3 text-xs font-bold text-[var(--primary-fg)] transition-colors hover:bg-[var(--sakura)]/30"
                      aria-label="Pause playback"
                    >
                      <Pause size={12} className="fill-current" />
                      <span>Pause</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={resumeSequence}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[var(--primary)] bg-[var(--primary)] px-3 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[var(--primary-hover)]"
                      aria-label="Resume playback"
                    >
                      <Play size={12} className="fill-current" />
                      <span>Resume</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={stopSequence}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 text-xs font-bold text-[var(--ink)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary-fg)]"
                    aria-label="Stop playback"
                  >
                    <Square size={12} className="fill-current text-[var(--primary-fg)]" />
                    <span>Stop</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    startSequence(
                      "basic-all",
                      basicRows.flatMap((r) => r.characters)
                    )
                  }
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 text-xs font-bold text-[var(--ink)] transition-colors hover:border-[var(--primary)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary-fg)]"
                >
                  <Volume2 size={13} className="text-[var(--primary-fg)]" />
                  <span>Listen All</span>
                </button>
              )}
              <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1 text-xs font-bold text-[var(--muted)] tabular-nums">
                46
              </span>
            </div>
          </div>

          {/* 5-Column Vowel Header */}
          <div className="mb-3 grid grid-cols-[38px_1fr] gap-2 sm:grid-cols-[64px_1fr] sm:gap-3.5 select-none">
            <div className="flex items-center justify-center">
              <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-[var(--muted)]">
                Row
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2 sm:gap-3.5 text-center">
              {[
                { latin: "A", kana: script === "hiragana" ? "あ" : "ア", dan: "あ段" },
                { latin: "I", kana: script === "hiragana" ? "い" : "イ", dan: "い段" },
                { latin: "U", kana: script === "hiragana" ? "う" : "ウ", dan: "う段" },
                { latin: "E", kana: script === "hiragana" ? "え" : "エ", dan: "え段" },
                { latin: "O", kana: script === "hiragana" ? "お" : "オ", dan: "お段" },
              ].map((vowel, colIndex) => {
                const isColHighlighted = hoveredCoord?.section === "basic" && hoveredCoord.colIndex === colIndex;
                return (
                  <div
                    key={vowel.latin}
                    className={`flex flex-col items-center justify-center rounded-2xl border py-2 sm:py-2.5 transition-all duration-150 shadow-2xs ${
                      isColHighlighted
                        ? "border-[var(--primary)] bg-[var(--sakura-light)] ring-1 ring-[var(--primary)]/40 scale-[1.03] shadow-xs"
                        : "border-[var(--line)]/70 bg-[var(--bg)]"
                    }`}
                  >
                    <span className={`text-xs sm:text-sm font-black tracking-widest ${isColHighlighted ? "text-[var(--primary)]" : "text-[var(--primary-fg)]"}`}>
                      {vowel.latin}
                    </span>
                    <span className="font-japanese text-[11px] font-semibold text-[var(--muted)] sm:text-xs">
                      {vowel.kana}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 11 Consonant Rows (Each Row has strictly 5 Cards / Slots) */}
          <div className="space-y-2 sm:space-y-3">
            {basicRows.map((row) => {
              const isThisRowSequence = activeSequence?.targetKey === row.key;
              const isRowHighlighted = hoveredCoord?.section === "basic" && hoveredCoord.rowKey === row.key;
              return (
                <div
                  key={row.key}
                  className={`grid grid-cols-[38px_1fr] items-center gap-2 sm:grid-cols-[64px_1fr] sm:gap-3.5 rounded-2xl p-1 transition-colors ${
                    isRowHighlighted ? "bg-[var(--sakura-light)]/20" : ""
                  }`}
                >
                  {/* Row Header & Audio Trigger */}
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className={`text-[11px] sm:text-xs font-black tracking-wider transition-colors ${
                      isRowHighlighted ? "text-[var(--primary-fg)] scale-105" : "text-[var(--ink)]"
                    }`}>
                      {row.romajiLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (isThisRowSequence) {
                          if (activeSequence.status === "playing") {
                            pauseSequence();
                          } else {
                            resumeSequence();
                          }
                        } else {
                          startSequence(row.key, row.characters);
                        }
                      }}
                      title={
                        isThisRowSequence
                          ? activeSequence.status === "playing"
                            ? "Pause row"
                            : "Resume row"
                          : `Play row ${row.romajiLabel}`
                      }
                      aria-label={
                        isThisRowSequence
                          ? activeSequence.status === "playing"
                            ? `Pause row ${row.romajiLabel}`
                            : `Resume row ${row.romajiLabel}`
                          : `Play row ${row.romajiLabel}`
                      }
                      className={`flex size-6 cursor-pointer items-center justify-center rounded-lg border transition-all sm:size-7 ${
                        isThisRowSequence
                          ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs"
                          : "border-[var(--line)]/70 bg-[var(--bg)] text-[var(--muted)] hover:border-[var(--primary)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary-fg)]"
                      }`}
                    >
                      {isThisRowSequence ? (
                        activeSequence.status === "playing" ? (
                          <Pause size={10} className="fill-current animate-pulse" />
                        ) : (
                          <Play size={10} className="fill-current" />
                        )
                      ) : (
                        <Volume2 size={12} />
                      )}
                    </button>
                  </div>

                  {/* 5 Cards Row */}
                  <div className="grid grid-cols-5 gap-2 sm:gap-3.5">
                    {row.slots.map((slot, colIndex) => {
                      if (slot.type === "empty") {
                        return <EmptyTile key={slot.id} />;
                      }
                      const isSequenceCurrent =
                        activeSequence !== null &&
                        activeSequence.characters[activeSequence.currentIndex]?.id === slot.character.id;
                      const isSingleAudioPlaying =
                        activeSequence === null &&
                        isPlaying &&
                        (activeTileId
                          ? activeTileId === slot.character.id
                          : activeChar
                          ? slot.character.char === activeChar
                          : activeKey === toKanaAudioKey(slot.character.char, slot.character.romaji[0]));
                      const isActive = isSequenceCurrent || isSingleAudioPlaying;
                      const isPaused = isSequenceCurrent && activeSequence.status === "paused";

                      return (
                        <div
                          key={slot.character.id}
                          onMouseEnter={() => setHoveredCoord({ section: "basic", rowKey: row.key, colIndex })}
                          onMouseLeave={() => setHoveredCoord(null)}
                          className="w-full"
                        >
                          <KanaTile
                            character={slot.character}
                            showRomaji={showRomaji}
                            isActive={isActive}
                            isPaused={isPaused}
                            onPlay={() => handleTilePlay(slot.character)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 2. DAKUTEN & HANDAKUTEN (25 Characters across 5 Vowel Columns) */}
        <section
          id="section-dakuten"
          aria-label="Dakuten & Handakuten"
          className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm sm:p-7"
        >
          {/* Section Header */}
          <div className="mb-6 flex flex-col gap-3 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-wide text-[var(--ink)] uppercase sm:text-lg">
                  Dakuten & Handakuten
                </h2>
                <span className="font-japanese text-xs text-[var(--muted)]">濁音・半濁音</span>
              </div>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Voiced (`゛`) and semi-voiced (`゜`) consonants, 5 cards per row.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeSequence?.targetKey === "dakuten-all" ? (
                <div className="flex items-center gap-1.5">
                  {activeSequence.status === "playing" ? (
                    <button
                      type="button"
                      onClick={pauseSequence}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[var(--primary)] bg-[var(--sakura-light)] px-3 text-xs font-bold text-[var(--primary-fg)] transition-colors hover:bg-[var(--sakura)]/30"
                      aria-label="Pause playback"
                    >
                      <Pause size={12} className="fill-current" />
                      <span>Pause</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={resumeSequence}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[var(--primary)] bg-[var(--primary)] px-3 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[var(--primary-hover)]"
                      aria-label="Resume playback"
                    >
                      <Play size={12} className="fill-current" />
                      <span>Resume</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={stopSequence}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 text-xs font-bold text-[var(--ink)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary-fg)]"
                    aria-label="Stop playback"
                  >
                    <Square size={12} className="fill-current text-[var(--primary-fg)]" />
                    <span>Stop</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    startSequence(
                      "dakuten-all",
                      dakutenRows.flatMap((r) => r.characters)
                    )
                  }
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 text-xs font-bold text-[var(--ink)] transition-colors hover:border-[var(--primary)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary-fg)]"
                >
                  <Volume2 size={13} className="text-[var(--primary-fg)]" />
                  <span>Listen All</span>
                </button>
              )}
              <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1 text-xs font-bold text-[var(--muted)] tabular-nums">
                25
              </span>
            </div>
          </div>

          {/* 5-Column Vowel Header */}
          <div className="mb-3 grid grid-cols-[38px_1fr] gap-2 sm:grid-cols-[64px_1fr] sm:gap-3.5 select-none">
            <div className="flex items-center justify-center">
              <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-[var(--muted)]">
                Row
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2 sm:gap-3.5 text-center">
              {[
                { latin: "A", kana: script === "hiragana" ? "あ" : "ア" },
                { latin: "I", kana: script === "hiragana" ? "い" : "イ" },
                { latin: "U", kana: script === "hiragana" ? "う" : "ウ" },
                { latin: "E", kana: script === "hiragana" ? "え" : "エ" },
                { latin: "O", kana: script === "hiragana" ? "お" : "オ" },
              ].map((vowel, colIndex) => {
                const isColHighlighted = hoveredCoord?.section === "dakuten" && hoveredCoord.colIndex === colIndex;
                return (
                  <div
                    key={vowel.latin}
                    className={`flex flex-col items-center justify-center rounded-2xl border py-2 sm:py-2.5 transition-all duration-150 shadow-2xs ${
                      isColHighlighted
                        ? "border-[var(--primary)] bg-[var(--sakura-light)] ring-1 ring-[var(--primary)]/40 scale-[1.03] shadow-xs"
                        : "border-[var(--line)]/70 bg-[var(--bg)]"
                    }`}
                  >
                    <span className={`text-xs sm:text-sm font-black tracking-widest ${isColHighlighted ? "text-[var(--primary)]" : "text-[var(--primary-fg)]"}`}>
                      {vowel.latin}
                    </span>
                    <span className="font-japanese text-[11px] font-semibold text-[var(--muted)] sm:text-xs">
                      {vowel.kana}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5 Consonant Rows */}
          <div className="space-y-2 sm:space-y-3">
            {dakutenRows.map((row) => {
              const isThisRowSequence = activeSequence?.targetKey === row.key;
              const isRowHighlighted = hoveredCoord?.section === "dakuten" && hoveredCoord.rowKey === row.key;
              return (
                <div
                  key={row.key}
                  className={`grid grid-cols-[38px_1fr] items-center gap-2 sm:grid-cols-[64px_1fr] sm:gap-3.5 rounded-2xl p-1 transition-colors ${
                    isRowHighlighted ? "bg-[var(--sakura-light)]/20" : ""
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className={`text-[11px] sm:text-xs font-black tracking-wider transition-colors ${
                      isRowHighlighted ? "text-[var(--primary-fg)] scale-105" : "text-[var(--ink)]"
                    }`}>
                      {row.romajiLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (isThisRowSequence) {
                          if (activeSequence.status === "playing") {
                            pauseSequence();
                          } else {
                            resumeSequence();
                          }
                        } else {
                          startSequence(row.key, row.characters);
                        }
                      }}
                      title={
                        isThisRowSequence
                          ? activeSequence.status === "playing"
                            ? "Pause row"
                            : "Resume row"
                          : `Play row ${row.romajiLabel}`
                      }
                      aria-label={
                        isThisRowSequence
                          ? activeSequence.status === "playing"
                            ? `Pause row ${row.romajiLabel}`
                            : `Resume row ${row.romajiLabel}`
                          : `Play row ${row.romajiLabel}`
                      }
                      className={`flex size-6 cursor-pointer items-center justify-center rounded-lg border transition-all sm:size-7 ${
                        isThisRowSequence
                          ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs"
                          : "border-[var(--line)]/70 bg-[var(--bg)] text-[var(--muted)] hover:border-[var(--primary)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary-fg)]"
                      }`}
                    >
                      {isThisRowSequence ? (
                        activeSequence.status === "playing" ? (
                          <Pause size={10} className="fill-current animate-pulse" />
                        ) : (
                          <Play size={10} className="fill-current" />
                        )
                      ) : (
                        <Volume2 size={12} />
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-5 gap-2 sm:gap-3.5">
                    {row.slots.map((slot, colIndex) => {
                      if (slot.type === "empty") {
                        return <EmptyTile key={slot.id} />;
                      }
                      const isSequenceCurrent =
                        activeSequence !== null &&
                        activeSequence.characters[activeSequence.currentIndex]?.id === slot.character.id;
                      const isSingleAudioPlaying =
                        activeSequence === null &&
                        isPlaying &&
                        (activeTileId
                          ? activeTileId === slot.character.id
                          : activeChar
                          ? slot.character.char === activeChar
                          : activeKey === toKanaAudioKey(slot.character.char, slot.character.romaji[0]));
                      const isActive = isSequenceCurrent || isSingleAudioPlaying;
                      const isPaused = isSequenceCurrent && activeSequence.status === "paused";

                      return (
                        <div
                          key={slot.character.id}
                          onMouseEnter={() => setHoveredCoord({ section: "dakuten", rowKey: row.key, colIndex })}
                          onMouseLeave={() => setHoveredCoord(null)}
                          className="w-full"
                        >
                          <KanaTile
                            character={slot.character}
                            showRomaji={showRomaji}
                            isActive={isActive}
                            isPaused={isPaused}
                            onPlay={() => handleTilePlay(slot.character)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. YŌON (33 Contracted Syllables across 3 Columns: -ya, -yu, -yo) */}
        <section
          id="section-yoon"
          aria-label="Yōon"
          className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm sm:p-7"
        >
          {/* Section Header */}
          <div className="mb-6 flex flex-col gap-3 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-wide text-[var(--ink)] uppercase sm:text-lg">
                  Contracted Sounds (Yōon)
                </h2>
                <span className="font-japanese text-xs text-[var(--muted)]">拗音</span>
              </div>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Small `ゃ`, `ゅ`, `ょ` contractions, strictly 3 columns (-ya, -yu, -yo).
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeSequence?.targetKey === "yoon-all" ? (
                <div className="flex items-center gap-1.5">
                  {activeSequence.status === "playing" ? (
                    <button
                      type="button"
                      onClick={pauseSequence}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[var(--primary)] bg-[var(--sakura-light)] px-3 text-xs font-bold text-[var(--primary-fg)] transition-colors hover:bg-[var(--sakura)]/30"
                      aria-label="Pause playback"
                    >
                      <Pause size={12} className="fill-current" />
                      <span>Pause</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={resumeSequence}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[var(--primary)] bg-[var(--primary)] px-3 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[var(--primary-hover)]"
                      aria-label="Resume playback"
                    >
                      <Play size={12} className="fill-current" />
                      <span>Resume</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={stopSequence}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 text-xs font-bold text-[var(--ink)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary-fg)]"
                    aria-label="Stop playback"
                  >
                    <Square size={12} className="fill-current text-[var(--primary-fg)]" />
                    <span>Stop</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    startSequence(
                      "yoon-all",
                      yoonRows.flatMap((r) => r.characters)
                    )
                  }
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 text-xs font-bold text-[var(--ink)] transition-colors hover:border-[var(--primary)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary-fg)]"
                >
                  <Volume2 size={13} className="text-[var(--primary-fg)]" />
                  <span>Listen All</span>
                </button>
              )}
              <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1 text-xs font-bold text-[var(--muted)] tabular-nums">
                33
              </span>
            </div>
          </div>

          {/* 3-Column Header */}
          <div className="mb-3 grid grid-cols-[38px_1fr] gap-2 sm:grid-cols-[64px_1fr] sm:gap-3.5 select-none">
            <div className="flex items-center justify-center">
              <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-[var(--muted)]">
                Row
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3.5 text-center">
              {[
                { latin: "YA", kana: script === "hiragana" ? "ゃ" : "ャ" },
                { latin: "YU", kana: script === "hiragana" ? "ゅ" : "ュ" },
                { latin: "YO", kana: script === "hiragana" ? "ょ" : "ョ" },
              ].map((vowel, colIndex) => {
                const isColHighlighted = hoveredCoord?.section === "yoon" && hoveredCoord.colIndex === colIndex;
                return (
                  <div
                    key={vowel.latin}
                    className={`flex flex-col items-center justify-center rounded-2xl border py-2 sm:py-2.5 transition-all duration-150 shadow-2xs ${
                      isColHighlighted
                        ? "border-[var(--primary)] bg-[var(--sakura-light)] ring-1 ring-[var(--primary)]/40 scale-[1.03] shadow-xs"
                        : "border-[var(--line)]/70 bg-[var(--bg)]"
                    }`}
                  >
                    <span className={`text-xs sm:text-sm font-black tracking-widest ${isColHighlighted ? "text-[var(--primary)]" : "text-[var(--primary-fg)]"}`}>
                      +{vowel.latin}
                    </span>
                    <span className="font-japanese text-[11px] font-semibold text-[var(--muted)] sm:text-xs">
                      +{vowel.kana}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 11 Yōon Rows (3 Cards per Row) */}
          <div className="space-y-2 sm:space-y-3">
            {yoonRows.map((row) => {
              const isThisRowSequence = activeSequence?.targetKey === row.key;
              const isRowHighlighted = hoveredCoord?.section === "yoon" && hoveredCoord.rowKey === row.key;
              return (
                <div
                  key={row.key}
                  className={`grid grid-cols-[38px_1fr] items-center gap-2 sm:grid-cols-[64px_1fr] sm:gap-3.5 rounded-2xl p-1 transition-colors ${
                    isRowHighlighted ? "bg-[var(--sakura-light)]/20" : ""
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className={`text-[11px] sm:text-xs font-black tracking-wider transition-colors ${
                      isRowHighlighted ? "text-[var(--primary-fg)] scale-105" : "text-[var(--ink)]"
                    }`}>
                      {row.romajiLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (isThisRowSequence) {
                          if (activeSequence.status === "playing") {
                            pauseSequence();
                          } else {
                            resumeSequence();
                          }
                        } else {
                          startSequence(row.key, row.characters);
                        }
                      }}
                      title={
                        isThisRowSequence
                          ? activeSequence.status === "playing"
                            ? "Pause row"
                            : "Resume row"
                          : `Play row ${row.romajiLabel}`
                      }
                      aria-label={
                        isThisRowSequence
                          ? activeSequence.status === "playing"
                            ? `Pause row ${row.romajiLabel}`
                            : `Resume row ${row.romajiLabel}`
                          : `Play row ${row.romajiLabel}`
                      }
                      className={`flex size-6 cursor-pointer items-center justify-center rounded-lg border transition-all sm:size-7 ${
                        isThisRowSequence
                          ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs"
                          : "border-[var(--line)]/70 bg-[var(--bg)] text-[var(--muted)] hover:border-[var(--primary)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary-fg)]"
                      }`}
                    >
                      {isThisRowSequence ? (
                        activeSequence.status === "playing" ? (
                          <Pause size={10} className="fill-current animate-pulse" />
                        ) : (
                          <Play size={10} className="fill-current" />
                        )
                      ) : (
                        <Volume2 size={12} />
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
                    {row.characters.map((character, colIndex) => {
                      const isSequenceCurrent =
                        activeSequence !== null &&
                        activeSequence.characters[activeSequence.currentIndex]?.id === character.id;
                      const isSingleAudioPlaying =
                        activeSequence === null &&
                        isPlaying &&
                        (activeTileId
                          ? activeTileId === character.id
                          : activeChar
                          ? character.char === activeChar
                          : activeKey === toKanaAudioKey(character.char, character.romaji[0]));
                      const isActive = isSequenceCurrent || isSingleAudioPlaying;
                      const isPaused = isSequenceCurrent && activeSequence.status === "paused";

                      return (
                        <div
                          key={character.id}
                          onMouseEnter={() => setHoveredCoord({ section: "yoon", rowKey: row.key, colIndex })}
                          onMouseLeave={() => setHoveredCoord(null)}
                          className="w-full"
                        >
                          <KanaTile
                            character={character}
                            showRomaji={showRomaji}
                            isActive={isActive}
                            isPaused={isPaused}
                            onPlay={() => handleTilePlay(character)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. EXTENDED KATAKANA (Only visible when Katakana is selected) */}
        {script === "katakana" && extendedGroups.length > 0 && (
          <section
            id="section-extended"
            aria-label="Extended Katakana"
            className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm sm:p-7"
          >
            <div className="mb-6 flex flex-col gap-3 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold tracking-wide text-[var(--ink)] uppercase sm:text-lg">
                    Extended Katakana
                  </h2>
                  <span className="font-japanese text-xs text-[var(--muted)]">特殊音・外来語</span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  Modern Katakana loanword combinations for foreign sounds (F, V, TI, DI, etc.).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1 text-xs font-bold text-[var(--muted)] tabular-nums">
                  29
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {extendedGroups.map((group) => (
                <div
                  key={group.key}
                  className="rounded-2xl border border-[var(--line)]/60 bg-[var(--bg)] p-3.5 sm:p-4"
                >
                  <div className="mb-3 flex items-center justify-between border-b border-[var(--line)]/50 pb-2">
                    <span className="text-xs font-black tracking-wider text-[var(--primary-fg)]">
                      {group.romajiLabel}
                    </span>
                    <span className="text-[11px] font-semibold text-[var(--muted)]">{group.desc}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-2.5">
                    {group.characters.map((character) => {
                      const active =
                        activeSequence === null &&
                        isPlaying &&
                        (activeTileId
                          ? activeTileId === character.id
                          : activeChar
                          ? character.char === activeChar
                          : activeKey === toKanaAudioKey(character.char, character.romaji[0]));
                      return (
                        <div key={character.id} className="w-[calc(20%-8px)] min-w-[54px] flex-1">
                          <KanaTile
                            character={character}
                            showRomaji={showRomaji}
                            isActive={active}
                            isPaused={false}
                            onPlay={() => handleTilePlay(character)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

/**
 * Clean, tactile, high-contrast flashcard tile for individual Kana character.
 */
function KanaTile({
  character,
  showRomaji,
  isActive,
  isPaused,
  onPlay,
}: {
  character: KanaCharacter;
  showRomaji: boolean;
  isActive: boolean;
  isPaused: boolean;
  onPlay: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={`Play pronunciation for ${character.char}`}
      className={`group relative flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-2xl border p-1 text-center transition-all duration-150 select-none active:scale-90 ${
        isActive
          ? isPaused
            ? "border-[var(--primary)]/70 bg-[var(--sakura-light)]/60 ring-2 ring-[var(--primary)]/50 shadow-xs"
            : "border-[var(--primary)] bg-[var(--sakura-light)] ring-2 ring-[var(--primary)] shadow-md scale-[1.02]"
          : "border-[var(--line)] bg-[var(--bg)] hover:-translate-y-0.5 hover:border-[var(--primary)] hover:bg-[var(--sakura-light)]/40 hover:shadow-sm"
      }`}
    >
      {/* Corner Audio / Status Indicator */}
      <div
        className={`absolute top-1.5 right-1.5 transition-all ${
          isActive
            ? "opacity-100 text-[var(--primary-fg)]"
            : "opacity-0 group-hover:opacity-100 text-[var(--muted)]/70 group-hover:text-[var(--primary-fg)]"
        }`}
      >
        {isPaused ? (
          <Pause size={10} className="fill-current text-[var(--primary-fg)]" />
        ) : (
          <div className="flex items-center gap-0.5">
            <Volume2 size={11} className={isActive ? "animate-pulse" : ""} />
            {isActive && (
              <span className="flex items-end gap-0.5 h-2">
                <span className="w-0.5 h-1 bg-[var(--primary-fg)] animate-pulse rounded-full" />
                <span className="w-0.5 h-2 bg-[var(--primary-fg)] animate-pulse delay-75 rounded-full" />
                <span className="w-0.5 h-1.5 bg-[var(--primary-fg)] animate-pulse delay-150 rounded-full" />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Character Glyph */}
      <span
        className={`font-japanese font-medium transition-transform duration-150 group-hover:scale-105 leading-none ${
          character.char.length > 1
            ? "text-xl sm:text-2xl"
            : "text-2xl sm:text-3xl lg:text-4xl"
        } ${isActive ? "text-[var(--primary-fg)]" : "text-[var(--ink)]"}`}
      >
        {character.char}
      </span>

      {/* Romaji Badge (height preserved to prevent layout shifts) */}
      <div className="mt-1.5 flex h-4 items-center justify-center">
        {showRomaji && (
          <span className="rounded-full bg-[var(--surface)] px-2 py-0.2 text-[10px] font-bold tracking-wide uppercase text-[var(--muted)] border border-[var(--line)]/60 group-hover:border-[var(--primary)]/40 group-hover:text-[var(--primary-fg)] transition-colors sm:text-[11px] shadow-2xs">
            {character.romaji[0]}
          </span>
        )}
      </div>
    </button>
  );
}

/**
 * Placeholder card for non-existent Gojūon positions (e.g. empty slots in Ya, Wa, N rows).
 */
function EmptyTile() {
  return (
    <div
      aria-hidden="true"
      className="flex aspect-square w-full items-center justify-center rounded-2xl border-2 border-dashed border-[var(--line)]/40 bg-[var(--surface)]/20 opacity-30 select-none pointer-events-none"
    >
      <span className="text-xs font-bold text-[var(--muted)]">—</span>
    </div>
  );
}
