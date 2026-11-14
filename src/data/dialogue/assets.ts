import { isSfxEnabled } from "@/lib/game-core/sfx";

/**
 * Visual Novel Asset Registry for Dialogue Quest
 * Maps scenario locations and character expressions to asset paths.
 */

export interface ScenarioAssetManifest {
    backgrounds: Record<string, string>;
    characterSprites: Record<string, string>;
    sfx?: Record<string, string>;
    dialogueAudio?: Record<string, string>;
}

export const DIALOGUE_ASSET_MANIFESTS: Record<string, ScenarioAssetManifest> = {
    "directions-mcdonalds": {
        backgrounds: {
            "shibuya-square": "/assets/dialogue-quest/directions-mcdonalds/background/shibuya-square.webp",
            "station-entrance": "/assets/dialogue-quest/directions-mcdonalds/background/station-entrance.webp",
            "mcdonalds-store": "/assets/dialogue-quest/directions-mcdonalds/background/mcdonalds-store.webp",
            default: "/assets/dialogue-quest/directions-mcdonalds/background/shibuya-square.webp",
        },
        characterSprites: {
            neutral: "/assets/dialogue-quest/directions-mcdonalds/characters/sato-san/neutral.webp",
            happy: "/assets/dialogue-quest/directions-mcdonalds/characters/sato-san/happy.webp",
            pointing: "/assets/dialogue-quest/directions-mcdonalds/characters/sato-san/pointing.webp",
            thinking: "/assets/dialogue-quest/directions-mcdonalds/characters/sato-san/thinking.webp",
            surprised: "/assets/dialogue-quest/directions-mcdonalds/characters/sato-san/surprised.webp",
            confused: "/assets/dialogue-quest/directions-mcdonalds/characters/sato-san/confused.webp",
            embarrased: "/assets/dialogue-quest/directions-mcdonalds/characters/sato-san/embarrased.webp",
            embarrassed: "/assets/dialogue-quest/directions-mcdonalds/characters/sato-san/embarrased.webp",
            sad: "/assets/dialogue-quest/directions-mcdonalds/characters/sato-san/sad.webp",
            goodbye: "/assets/dialogue-quest/directions-mcdonalds/characters/sato-san/goodbye.webp",
            backstare: "/assets/dialogue-quest/directions-mcdonalds/characters/sato-san/backstare.webp",
        },
        sfx: {
            neutral: "/assets/dialogue-quest/directions-mcdonalds/sfx/sato-neutral.mp3",
            happy: "/assets/dialogue-quest/directions-mcdonalds/sfx/sato-happy.mp3",
            pointing: "/assets/dialogue-quest/directions-mcdonalds/sfx/sato-pointing.mp3",
            thinking: "/assets/dialogue-quest/directions-mcdonalds/sfx/sato-thinking.mp3",
            surprised: "/assets/dialogue-quest/directions-mcdonalds/sfx/sato-surprised.mp3",
            confused: "/assets/dialogue-quest/directions-mcdonalds/sfx/sato-confused.mp3",
            embarrased: "/assets/dialogue-quest/directions-mcdonalds/sfx/sato-embarrased.mp3",
            embarrassed: "/assets/dialogue-quest/directions-mcdonalds/sfx/sato-embarrased.mp3",
            sad: "/assets/dialogue-quest/directions-mcdonalds/sfx/sato-sad.mp3",
            goodbye: "/assets/dialogue-quest/directions-mcdonalds/sfx/sato-goodbye.mp3",
            backstare: "/assets/dialogue-quest/directions-mcdonalds/sfx/sato-backstare.mp3",
            "shibuya-crossing": "/assets/dialogue-quest/directions-mcdonalds/sfx/shibuya-crossing-chime.mp3",
            "atmosphere-bonus": "/assets/dialogue-quest/directions-mcdonalds/sfx/atmosphere-bonus.mp3",
        },
        dialogueAudio: {
            "node-2-npc-reply-polite": "/assets/dialogue-quest/directions-mcdonalds/dialogue/node-2-npc-reply-polite.mp3",
            "node-2-npc-reply-confused": "/assets/dialogue-quest/directions-mcdonalds/dialogue/node-2-npc-reply-confused.mp3",
            "node-2-npc-reply-station": "/assets/dialogue-quest/directions-mcdonalds/dialogue/node-2-npc-reply-station.mp3",
            "node-2-npc-reply-casual": "/assets/dialogue-quest/directions-mcdonalds/dialogue/node-2-npc-reply-casual.mp3",
            "node-2-npc-reply-english": "/assets/dialogue-quest/directions-mcdonalds/dialogue/node-2-npc-reply-english.mp3",
            "node-3-npc-directions": "/assets/dialogue-quest/directions-mcdonalds/dialogue/node-3-npc-directions.mp3",
            "node-3-npc-walking-time": "/assets/dialogue-quest/directions-mcdonalds/dialogue/node-3-npc-walking-time.mp3",
            "node-3-npc-directions-vague": "/assets/dialogue-quest/directions-mcdonalds/dialogue/node-3-npc-directions-vague.mp3",
            "node-end-perfect": "/assets/dialogue-quest/directions-mcdonalds/dialogue/node-end-perfect.mp3",
            "node-end-success": "/assets/dialogue-quest/directions-mcdonalds/dialogue/node-end-success.mp3",
            "node-end-awkward": "/assets/dialogue-quest/directions-mcdonalds/dialogue/node-end-awkward.mp3",
            "node-fail-rude": "/assets/dialogue-quest/directions-mcdonalds/dialogue/node-fail-rude.mp3",
        },
    },
    "farmer-morning-market": {
        backgrounds: {
            "morning-market-overview":
                "/assets/dialogue-quest/farmer-morning-market/background/morning-market-overview.webp",
            "produce-stall-close":
                "/assets/dialogue-quest/farmer-morning-market/background/produce-stall-close.webp",
            default:
                "/assets/dialogue-quest/farmer-morning-market/background/morning-market-overview.webp",
        },
        characterSprites: {
            neutral:
                "/assets/dialogue-quest/farmer-morning-market/characters/yamada-san/neutral.webp",
            happy:
                "/assets/dialogue-quest/farmer-morning-market/characters/yamada-san/happy.webp",
            proud:
                "/assets/dialogue-quest/farmer-morning-market/characters/yamada-san/proud.webp",
            surprised:
                "/assets/dialogue-quest/farmer-morning-market/characters/yamada-san/surprised.webp",
            disappointed:
                "/assets/dialogue-quest/farmer-morning-market/characters/yamada-san/disappointed.webp",
            goodbye:
                "/assets/dialogue-quest/farmer-morning-market/characters/yamada-san/goodbye.webp",
            backstare:
                "/assets/dialogue-quest/farmer-morning-market/characters/yamada-san/backstare.webp",
        },
        sfx: {
            neutral:
                "/assets/dialogue-quest/farmer-morning-market/sfx/yamada-neutral.mp3",
            happy:
                "/assets/dialogue-quest/farmer-morning-market/sfx/yamada-happy.mp3",
            proud:
                "/assets/dialogue-quest/farmer-morning-market/sfx/yamada-proud.mp3",
            surprised:
                "/assets/dialogue-quest/farmer-morning-market/sfx/yamada-surprised.mp3",
            disappointed:
                "/assets/dialogue-quest/farmer-morning-market/sfx/yamada-disappointed.mp3",
            goodbye:
                "/assets/dialogue-quest/farmer-morning-market/sfx/yamada-goodbye.mp3",
            backstare:
                "/assets/dialogue-quest/farmer-morning-market/sfx/yamada-backstare.mp3",
        },
        dialogueAudio: {
            "farmer-node-2-reply-warm":
                "/assets/dialogue-quest/farmer-morning-market/dialogue/farmer-node-2-reply-warm.mp3",
            "farmer-node-2-reply-recommend":
                "/assets/dialogue-quest/farmer-morning-market/dialogue/farmer-node-2-reply-recommend.mp3",
            "farmer-node-2-reply-discount":
                "/assets/dialogue-quest/farmer-morning-market/dialogue/farmer-node-2-reply-discount.mp3",
            "farmer-node-2-reply-annoyed":
                "/assets/dialogue-quest/farmer-morning-market/dialogue/farmer-node-2-reply-annoyed.mp3",
            "farmer-node-3-eating-advice":
                "/assets/dialogue-quest/farmer-morning-market/dialogue/farmer-node-3-eating-advice.mp3",
            "farmer-node-3-apple-deal":
                "/assets/dialogue-quest/farmer-morning-market/dialogue/farmer-node-3-apple-deal.mp3",
            "farmer-node-3-single-portion":
                "/assets/dialogue-quest/farmer-morning-market/dialogue/farmer-node-3-single-portion.mp3",
            "farmer-end-perfect":
                "/assets/dialogue-quest/farmer-morning-market/dialogue/farmer-end-perfect.mp3",
            "farmer-end-success":
                "/assets/dialogue-quest/farmer-morning-market/dialogue/farmer-end-success.mp3",
            "farmer-end-awkward":
                "/assets/dialogue-quest/farmer-morning-market/dialogue/farmer-end-awkward.mp3",
            "farmer-fail-rude":
                "/assets/dialogue-quest/farmer-morning-market/dialogue/farmer-fail-rude.mp3",
        },
    },
    "koban-lost-wallet": {
        backgrounds: {
            "koban-exterior":
                "/assets/dialogue-quest/koban-lost-wallet/backgrounds/koban-exterior.webp",
            "koban-interior":
                "/assets/dialogue-quest/koban-lost-wallet/backgrounds/koban-interior.webp",
            default:
                "/assets/dialogue-quest/koban-lost-wallet/backgrounds/koban-exterior.webp",
        },
        characterSprites: {
            neutral:
                "/assets/dialogue-quest/koban-lost-wallet/characters/Tanaka-san/neutral.webp",
            relieved:
                "/assets/dialogue-quest/koban-lost-wallet/characters/Tanaka-san/relived.webp",
            relived:
                "/assets/dialogue-quest/koban-lost-wallet/characters/Tanaka-san/relived.webp",
            stern:
                "/assets/dialogue-quest/koban-lost-wallet/characters/Tanaka-san/stern.webp",
            thinking:
                "/assets/dialogue-quest/koban-lost-wallet/characters/Tanaka-san/thinking.webp",
            goodbye:
                "/assets/dialogue-quest/koban-lost-wallet/characters/Tanaka-san/goodbye.webp",
        },
        sfx: {
            neutral:
                "/assets/dialogue-quest/koban-lost-wallet/sfx/tanaka-neutral.mp3",
            relieved:
                "/assets/dialogue-quest/koban-lost-wallet/sfx/tanaka-relieved.mp3",
            stern:
                "/assets/dialogue-quest/koban-lost-wallet/sfx/tanaka-stern.mp3",
            thinking:
                "/assets/dialogue-quest/koban-lost-wallet/sfx/tanaka-thinking.mp3",
            goodbye:
                "/assets/dialogue-quest/koban-lost-wallet/sfx/tanaka-goodbye.mp3",
        },
        dialogueAudio: {
            "koban-node-2-polite-inquiry":
                "/assets/dialogue-quest/koban-lost-wallet/dialogue/koban-node-2-polite-inquiry.mp3",
            "koban-node-2-urgent-calm":
                "/assets/dialogue-quest/koban-lost-wallet/dialogue/koban-node-2-urgent-calm.mp3",
            "koban-node-2-theft-investigate":
                "/assets/dialogue-quest/koban-lost-wallet/dialogue/koban-node-2-theft-investigate.mp3",
            "koban-node-2-stern-reprimand":
                "/assets/dialogue-quest/koban-lost-wallet/dialogue/koban-node-2-stern-reprimand.mp3",
            "koban-node-3-database-found":
                "/assets/dialogue-quest/koban-lost-wallet/dialogue/koban-node-3-database-found.mp3",
            "koban-node-3-further-questions":
                "/assets/dialogue-quest/koban-lost-wallet/dialogue/koban-node-3-further-questions.mp3",
            "koban-end-perfect":
                "/assets/dialogue-quest/koban-lost-wallet/dialogue/koban-end-perfect.mp3",
            "koban-end-report-filed":
                "/assets/dialogue-quest/koban-lost-wallet/dialogue/koban-end-report-filed.mp3",
            "koban-end-investigating":
                "/assets/dialogue-quest/koban-lost-wallet/dialogue/koban-end-investigating.mp3",
        },
    },
    "teacher-extension": {
        backgrounds: {
            "faculty-room-corridor":
                "/assets/dialogue-quest/teacher-extension/backgrounds/faculty-room-corridor.webp",
            "faculty-desk-closeup":
                "/assets/dialogue-quest/teacher-extension/backgrounds/faculty-office.webp",
            "faculty-office":
                "/assets/dialogue-quest/teacher-extension/backgrounds/faculty-office.webp",
            default:
                "/assets/dialogue-quest/teacher-extension/backgrounds/faculty-room-corridor.webp",
        },
        characterSprites: {
            neutral:
                "/assets/dialogue-quest/teacher-extension/characters/takahashi-san/neutral.webp",
            worried:
                "/assets/dialogue-quest/teacher-extension/characters/takahashi-san/sad.webp",
            sad:
                "/assets/dialogue-quest/teacher-extension/characters/takahashi-san/sad.webp",
            happy:
                "/assets/dialogue-quest/teacher-extension/characters/takahashi-san/happy.webp",
            thinking:
                "/assets/dialogue-quest/teacher-extension/characters/takahashi-san/thinking.webp",
            scolding:
                "/assets/dialogue-quest/teacher-extension/characters/takahashi-san/scolding.webp",
            goodbye:
                "/assets/dialogue-quest/teacher-extension/characters/takahashi-san/goodbye.webp",
        },
        sfx: {
            neutral:
                "/assets/dialogue-quest/teacher-extension/sfx/takahashi-neutral.mp3",
            worried:
                "/assets/dialogue-quest/teacher-extension/sfx/takahashi-worried.mp3",
            sad:
                "/assets/dialogue-quest/teacher-extension/sfx/takahashi-worried.mp3",
            happy:
                "/assets/dialogue-quest/teacher-extension/sfx/takahashi-happy.mp3",
            thinking:
                "/assets/dialogue-quest/teacher-extension/sfx/takahashi-thinking.mp3",
            scolding:
                "/assets/dialogue-quest/teacher-extension/sfx/takahashi-scolding.mp3",
            goodbye:
                "/assets/dialogue-quest/teacher-extension/sfx/takahashi-goodbye.mp3",
        },
        dialogueAudio: {
            "teacher-node-1-knock":
                "/assets/dialogue-quest/teacher-extension/dialogue/teacher-node-1-knock.mp3",
            "teacher-node-2-listen-warm":
                "/assets/dialogue-quest/teacher-extension/dialogue/teacher-node-2-listen-warm.mp3",
            "teacher-node-2-listen-direct":
                "/assets/dialogue-quest/teacher-extension/dialogue/teacher-node-2-listen-direct.mp3",
            "teacher-node-2-scold-slang":
                "/assets/dialogue-quest/teacher-extension/dialogue/teacher-node-2-scold-slang.mp3",
            "teacher-node-fail-rude":
                "/assets/dialogue-quest/teacher-extension/dialogue/teacher-node-fail-rude.mp3",
            "teacher-node-3-grant-extension":
                "/assets/dialogue-quest/teacher-extension/dialogue/teacher-node-3-grant-extension.mp3",
            "teacher-node-3-study-advice":
                "/assets/dialogue-quest/teacher-extension/dialogue/teacher-node-3-study-advice.mp3",
            "teacher-node-3-clarify-deadline":
                "/assets/dialogue-quest/teacher-extension/dialogue/teacher-node-3-clarify-deadline.mp3",
            "teacher-end-perfect":
                "/assets/dialogue-quest/teacher-extension/dialogue/teacher-end-perfect.mp3",
            "teacher-end-awkward":
                "/assets/dialogue-quest/teacher-extension/dialogue/teacher-end-awkward.mp3",
        },
    },
};

/**
 * Returns the resolved background image URL for a given scenario and node.
 * If not yet provided with PNG assets, returns undefined to trigger procedural SVG background.
 */
export function getScenarioBackgroundUrl(
    scenarioId: string,
    backgroundKey?: string
): string | undefined {
    const manifest = DIALOGUE_ASSET_MANIFESTS[scenarioId];
    if (!manifest) return undefined;

    if (backgroundKey && manifest.backgrounds[backgroundKey]) {
        return manifest.backgrounds[backgroundKey];
    }

    return manifest.backgrounds.default || Object.values(manifest.backgrounds)[0];
}

/**
 * Returns the resolved character sprite PNG URL for a given scenario and expression.
 * If not yet provided with PNG assets, returns undefined to trigger avatar fallback.
 */
export function getScenarioCharacterSpriteUrl(
    scenarioId: string,
    expression?: string
): string | undefined {
    const manifest = DIALOGUE_ASSET_MANIFESTS[scenarioId];
    if (!manifest) return undefined;

    const key = expression?.toLowerCase() || "neutral";
    return manifest.characterSprites[key] || manifest.characterSprites.neutral;
}

/**
 * Returns the resolved character expressive SFX URL for a given scenario and expression/event.
 */
export function getScenarioSfxUrl(
    scenarioId: string,
    key: string
): string | undefined {
    const manifest = DIALOGUE_ASSET_MANIFESTS[scenarioId];
    if (!manifest || !manifest.sfx) return undefined;

    const lookupKey = key.toLowerCase();
    return manifest.sfx[lookupKey];
}

export function getScenarioDialogueAudioUrl(
    scenarioId: string,
    nodeId: string
): string | undefined {
    const manifest = DIALOGUE_ASSET_MANIFESTS[scenarioId];
    if (!manifest || !manifest.dialogueAudio) return undefined;

    return manifest.dialogueAudio[nodeId];
}

let activeCharacterSfx: HTMLAudioElement | null = null;

/**
 * Non-blocking play of a scenario expressive SFX.
 * Safe in SSR and headless environments.
 */
export function playScenarioSfx(
    scenarioId: string,
    key: string,
    volume = 0.75
): void {
    if (!isSfxEnabled()) return;
    if (typeof window === "undefined" || typeof Audio === "undefined") return;
    const url = getScenarioSfxUrl(scenarioId, key);
    if (!url) return;

    try {
        const probe = new Audio();
        if (!probe.canPlayType || !probe.canPlayType("audio/mpeg")) {
            return;
        }
        if (key !== "atmosphere-bonus" && activeCharacterSfx) {
            activeCharacterSfx.pause();
            activeCharacterSfx.currentTime = 0;
        }
        const audio = new Audio(url);
        audio.volume = Math.max(0, Math.min(1, volume));
        if (key !== "atmosphere-bonus") {
            activeCharacterSfx = audio;
        }
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => { });
        }
    } catch {
        // Ignore audio initialization errors
    }
}
