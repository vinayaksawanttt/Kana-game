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
            neutral: "/assets/dialogue-quest/directions-mcdonalds/sfx/sato-neutral.opus",
            happy: "/assets/dialogue-quest/directions-mcdonalds/sfx/sato-happy.opus",
            pointing: "/assets/dialogue-quest/directions-mcdonalds/sfx/sato-pointing.opus",
            thinking: "/assets/dialogue-quest/directions-mcdonalds/sfx/sato-thinking.opus",
            surprised: "/assets/dialogue-quest/directions-mcdonalds/sfx/sato-surprised.opus",
            confused: "/assets/dialogue-quest/directions-mcdonalds/sfx/sato-confused.opus",
            embarrased: "/assets/dialogue-quest/directions-mcdonalds/sfx/sato-embarrased.opus",
            embarrassed: "/assets/dialogue-quest/directions-mcdonalds/sfx/sato-embarrased.opus",
            sad: "/assets/dialogue-quest/directions-mcdonalds/sfx/sato-sad.opus",
            goodbye: "/assets/dialogue-quest/directions-mcdonalds/sfx/sato-goodbye.opus",
            backstare: "/assets/dialogue-quest/directions-mcdonalds/sfx/sato-backstare.opus",
            "shibuya-crossing": "/assets/dialogue-quest/directions-mcdonalds/sfx/shibuya-crossing-chime.opus",
            "atmosphere-bonus": "/assets/dialogue-quest/directions-mcdonalds/sfx/atmosphere-bonus.opus",
        },
        dialogueAudio: {
            "node-2-npc-reply-polite": "/assets/dialogue-quest/directions-mcdonalds/dialogue/node-2-npc-reply-polite.opus",
            "node-2-npc-reply-confused": "/assets/dialogue-quest/directions-mcdonalds/dialogue/node-2-npc-reply-confused.opus",
            "node-2-npc-reply-station": "/assets/dialogue-quest/directions-mcdonalds/dialogue/node-2-npc-reply-station.opus",
            "node-2-npc-reply-casual": "/assets/dialogue-quest/directions-mcdonalds/dialogue/node-2-npc-reply-casual.opus",
            "node-2-npc-reply-english": "/assets/dialogue-quest/directions-mcdonalds/dialogue/node-2-npc-reply-english.opus",
            "node-3-npc-directions": "/assets/dialogue-quest/directions-mcdonalds/dialogue/node-3-npc-directions.opus",
            "node-3-npc-walking-time": "/assets/dialogue-quest/directions-mcdonalds/dialogue/node-3-npc-walking-time.opus",
            "node-3-npc-directions-vague": "/assets/dialogue-quest/directions-mcdonalds/dialogue/node-3-npc-directions-vague.opus",
            "node-end-perfect": "/assets/dialogue-quest/directions-mcdonalds/dialogue/node-end-perfect.opus",
            "node-end-success": "/assets/dialogue-quest/directions-mcdonalds/dialogue/node-end-success.opus",
            "node-end-awkward": "/assets/dialogue-quest/directions-mcdonalds/dialogue/node-end-awkward.opus",
            "node-fail-rude": "/assets/dialogue-quest/directions-mcdonalds/dialogue/node-fail-rude.opus",
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
                "/assets/dialogue-quest/farmer-morning-market/sfx/yamada-neutral.opus",
            happy:
                "/assets/dialogue-quest/farmer-morning-market/sfx/yamada-happy.opus",
            proud:
                "/assets/dialogue-quest/farmer-morning-market/sfx/yamada-proud.opus",
            surprised:
                "/assets/dialogue-quest/farmer-morning-market/sfx/yamada-surprised.opus",
            disappointed:
                "/assets/dialogue-quest/farmer-morning-market/sfx/yamada-disappointed.opus",
            goodbye:
                "/assets/dialogue-quest/farmer-morning-market/sfx/yamada-goodbye.opus",
            backstare:
                "/assets/dialogue-quest/farmer-morning-market/sfx/yamada-backstare.opus",
        },
        dialogueAudio: {
            "farmer-node-2-reply-warm":
                "/assets/dialogue-quest/farmer-morning-market/dialogue/farmer-node-2-reply-warm.opus",
            "farmer-node-2-reply-recommend":
                "/assets/dialogue-quest/farmer-morning-market/dialogue/farmer-node-2-reply-recommend.opus",
            "farmer-node-2-reply-discount":
                "/assets/dialogue-quest/farmer-morning-market/dialogue/farmer-node-2-reply-discount.opus",
            "farmer-node-2-reply-annoyed":
                "/assets/dialogue-quest/farmer-morning-market/dialogue/farmer-node-2-reply-annoyed.opus",
            "farmer-node-3-eating-advice":
                "/assets/dialogue-quest/farmer-morning-market/dialogue/farmer-node-3-eating-advice.opus",
            "farmer-node-3-apple-deal":
                "/assets/dialogue-quest/farmer-morning-market/dialogue/farmer-node-3-apple-deal.opus",
            "farmer-node-3-single-portion":
                "/assets/dialogue-quest/farmer-morning-market/dialogue/farmer-node-3-single-portion.opus",
            "farmer-end-perfect":
                "/assets/dialogue-quest/farmer-morning-market/dialogue/farmer-end-perfect.opus",
            "farmer-end-success":
                "/assets/dialogue-quest/farmer-morning-market/dialogue/farmer-end-success.opus",
            "farmer-end-awkward":
                "/assets/dialogue-quest/farmer-morning-market/dialogue/farmer-end-awkward.opus",
            "farmer-fail-rude":
                "/assets/dialogue-quest/farmer-morning-market/dialogue/farmer-fail-rude.opus",
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
                "/assets/dialogue-quest/koban-lost-wallet/sfx/tanaka-neutral.opus",
            relieved:
                "/assets/dialogue-quest/koban-lost-wallet/sfx/tanaka-relieved.opus",
            stern:
                "/assets/dialogue-quest/koban-lost-wallet/sfx/tanaka-stern.opus",
            thinking:
                "/assets/dialogue-quest/koban-lost-wallet/sfx/tanaka-thinking.opus",
            goodbye:
                "/assets/dialogue-quest/koban-lost-wallet/sfx/tanaka-goodbye.opus",
        },
        dialogueAudio: {
            "koban-node-2-polite-inquiry":
                "/assets/dialogue-quest/koban-lost-wallet/dialogue/koban-node-2-polite-inquiry.opus",
            "koban-node-2-urgent-calm":
                "/assets/dialogue-quest/koban-lost-wallet/dialogue/koban-node-2-urgent-calm.opus",
            "koban-node-2-theft-investigate":
                "/assets/dialogue-quest/koban-lost-wallet/dialogue/koban-node-2-theft-investigate.opus",
            "koban-node-2-stern-reprimand":
                "/assets/dialogue-quest/koban-lost-wallet/dialogue/koban-node-2-stern-reprimand.opus",
            "koban-node-3-database-found":
                "/assets/dialogue-quest/koban-lost-wallet/dialogue/koban-node-3-database-found.opus",
            "koban-node-3-further-questions":
                "/assets/dialogue-quest/koban-lost-wallet/dialogue/koban-node-3-further-questions.opus",
            "koban-end-perfect":
                "/assets/dialogue-quest/koban-lost-wallet/dialogue/koban-end-perfect.opus",
            "koban-end-report-filed":
                "/assets/dialogue-quest/koban-lost-wallet/dialogue/koban-end-report-filed.opus",
            "koban-end-investigating":
                "/assets/dialogue-quest/koban-lost-wallet/dialogue/koban-end-investigating.opus",
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
                "/assets/dialogue-quest/teacher-extension/sfx/takahashi-neutral.opus",
            worried:
                "/assets/dialogue-quest/teacher-extension/sfx/takahashi-worried.opus",
            sad:
                "/assets/dialogue-quest/teacher-extension/sfx/takahashi-worried.opus",
            happy:
                "/assets/dialogue-quest/teacher-extension/sfx/takahashi-happy.opus",
            thinking:
                "/assets/dialogue-quest/teacher-extension/sfx/takahashi-thinking.opus",
            scolding:
                "/assets/dialogue-quest/teacher-extension/sfx/takahashi-scolding.opus",
            goodbye:
                "/assets/dialogue-quest/teacher-extension/sfx/takahashi-goodbye.opus",
        },
        dialogueAudio: {
            "teacher-node-1-knock":
                "/assets/dialogue-quest/teacher-extension/dialogue/teacher-node-1-knock.opus",
            "teacher-node-2-listen-warm":
                "/assets/dialogue-quest/teacher-extension/dialogue/teacher-node-2-listen-warm.opus",
            "teacher-node-2-listen-direct":
                "/assets/dialogue-quest/teacher-extension/dialogue/teacher-node-2-listen-direct.opus",
            "teacher-node-2-scold-slang":
                "/assets/dialogue-quest/teacher-extension/dialogue/teacher-node-2-scold-slang.opus",
            "teacher-node-fail-rude":
                "/assets/dialogue-quest/teacher-extension/dialogue/teacher-node-fail-rude.opus",
            "teacher-node-3-grant-extension":
                "/assets/dialogue-quest/teacher-extension/dialogue/teacher-node-3-grant-extension.opus",
            "teacher-node-3-study-advice":
                "/assets/dialogue-quest/teacher-extension/dialogue/teacher-node-3-study-advice.opus",
            "teacher-node-3-clarify-deadline":
                "/assets/dialogue-quest/teacher-extension/dialogue/teacher-node-3-clarify-deadline.opus",
            "teacher-end-perfect":
                "/assets/dialogue-quest/teacher-extension/dialogue/teacher-end-perfect.opus",
            "teacher-end-awkward":
                "/assets/dialogue-quest/teacher-extension/dialogue/teacher-end-awkward.opus",
        },
    },
    "landlord-ac-repair": {
        backgrounds: {
            "landlord-courtyard":
                "/assets/dialogue-quest/landlord-ac-repair/backgrounds/landlord-courtyard.webp",
            "landlord-office":
                "/assets/dialogue-quest/landlord-ac-repair/backgrounds/landlord-office.webp",
            default:
                "/assets/dialogue-quest/landlord-ac-repair/backgrounds/landlord-courtyard.webp",
        },
        characterSprites: {
            neutral:
                "/assets/dialogue-quest/landlord-ac-repair/characters/suzuki-san/neutral.webp",
            worried:
                "/assets/dialogue-quest/landlord-ac-repair/characters/suzuki-san/worried.webp",
            thinking:
                "/assets/dialogue-quest/landlord-ac-repair/characters/suzuki-san/thinking.webp",
            happy:
                "/assets/dialogue-quest/landlord-ac-repair/characters/suzuki-san/happy.webp",
            annoyed:
                "/assets/dialogue-quest/landlord-ac-repair/characters/suzuki-san/annoyed.webp",
            goodbye:
                "/assets/dialogue-quest/landlord-ac-repair/characters/suzuki-san/goodbye.webp",
        },
        sfx: {
            neutral:
                "/assets/dialogue-quest/landlord-ac-repair/sfx/suzuki-neutral.opus",
            worried:
                "/assets/dialogue-quest/landlord-ac-repair/sfx/suzuki-worried.opus",
            thinking:
                "/assets/dialogue-quest/landlord-ac-repair/sfx/suzuki-thinking.opus",
            happy:
                "/assets/dialogue-quest/landlord-ac-repair/sfx/suzuki-happy.opus",
            annoyed:
                "/assets/dialogue-quest/landlord-ac-repair/sfx/suzuki-annoyed.opus",
            goodbye:
                "/assets/dialogue-quest/landlord-ac-repair/sfx/suzuki-goodbye.opus",
        },
        dialogueAudio: {
            "landlord-node-1-greet":
                "/assets/dialogue-quest/landlord-ac-repair/dialogue/landlord-node-1-greet.opus",
            "landlord-node-2-worried-inquiry":
                "/assets/dialogue-quest/landlord-ac-repair/dialogue/landlord-node-2-worried-inquiry.opus",
            "landlord-node-2-ask-room-details":
                "/assets/dialogue-quest/landlord-ac-repair/dialogue/landlord-node-2-ask-room-details.opus",
            "landlord-node-2-annoyed-warning":
                "/assets/dialogue-quest/landlord-ac-repair/dialogue/landlord-node-2-annoyed-warning.opus",
            "landlord-node-3-schedule-confirm":
                "/assets/dialogue-quest/landlord-ac-repair/dialogue/landlord-node-3-schedule-confirm.opus",
            "landlord-node-3-troubleshoot-first":
                "/assets/dialogue-quest/landlord-ac-repair/dialogue/landlord-node-3-troubleshoot-first.opus",
            "landlord-end-perfect":
                "/assets/dialogue-quest/landlord-ac-repair/dialogue/landlord-end-perfect.opus",
            "landlord-end-rescheduled":
                "/assets/dialogue-quest/landlord-ac-repair/dialogue/landlord-end-rescheduled.opus",
            "landlord-end-awkward":
                "/assets/dialogue-quest/landlord-ac-repair/dialogue/landlord-end-awkward.opus",
            "landlord-fail-rude":
                "/assets/dialogue-quest/landlord-ac-repair/dialogue/landlord-fail-rude.opus",
        },
    },
    "employer-shift-request": {
        backgrounds: {
            "cafe-counter-afterhours":
                "/assets/dialogue-quest/employer-shift-request/backgrounds/cafe-counter-afterhours.webp",
            "staff-breakroom":
                "/assets/dialogue-quest/employer-shift-request/backgrounds/staff-breakroom.webp",
            default:
                "/assets/dialogue-quest/employer-shift-request/backgrounds/cafe-counter-afterhours.webp",
        },
        characterSprites: {
            neutral:
                "/assets/dialogue-quest/employer-shift-request/characters/nakamura-san/neutral.webp",
            happy:
                "/assets/dialogue-quest/employer-shift-request/characters/nakamura-san/happy.webp",
            thinking:
                "/assets/dialogue-quest/employer-shift-request/characters/nakamura-san/thinking.webp",
            troubled:
                "/assets/dialogue-quest/employer-shift-request/characters/nakamura-san/troubled.webp",
            stern:
                "/assets/dialogue-quest/employer-shift-request/characters/nakamura-san/stern.webp",
            goodbye:
                "/assets/dialogue-quest/employer-shift-request/characters/nakamura-san/goodbye.webp",
        },
        sfx: {
            neutral:
                "/assets/dialogue-quest/employer-shift-request/sfx/nakamura-neutral.opus",
            happy:
                "/assets/dialogue-quest/employer-shift-request/sfx/nakamura-happy.opus",
            thinking:
                "/assets/dialogue-quest/employer-shift-request/sfx/nakamura-thinking.opus",
            troubled:
                "/assets/dialogue-quest/employer-shift-request/sfx/nakamura-troubled.opus",
            stern:
                "/assets/dialogue-quest/employer-shift-request/sfx/nakamura-stern.opus",
            goodbye:
                "/assets/dialogue-quest/employer-shift-request/sfx/nakamura-goodbye.opus",
        },
        dialogueAudio: {
            "emp-node-1-greet":
                "/assets/dialogue-quest/employer-shift-request/dialogue/emp-node-1-greet.opus",
            "emp-node-2-listen-warm":
                "/assets/dialogue-quest/employer-shift-request/dialogue/emp-node-2-listen-warm.opus",
            "emp-node-2-check-schedule":
                "/assets/dialogue-quest/employer-shift-request/dialogue/emp-node-2-check-schedule.opus",
            "emp-node-2-remind-etiquette":
                "/assets/dialogue-quest/employer-shift-request/dialogue/emp-node-2-remind-etiquette.opus",
            "emp-node-2-stern-warning":
                "/assets/dialogue-quest/employer-shift-request/dialogue/emp-node-2-stern-warning.opus",
            "emp-node-3-approve-praise":
                "/assets/dialogue-quest/employer-shift-request/dialogue/emp-node-3-approve-praise.opus",
            "emp-node-3-check-friday":
                "/assets/dialogue-quest/employer-shift-request/dialogue/emp-node-3-check-friday.opus",
            "emp-node-3-short-staffed":
                "/assets/dialogue-quest/employer-shift-request/dialogue/emp-node-3-short-staffed.opus",
            "emp-end-perfect":
                "/assets/dialogue-quest/employer-shift-request/dialogue/emp-end-perfect.opus",
            "emp-end-approved":
                "/assets/dialogue-quest/employer-shift-request/dialogue/emp-end-approved.opus",
            "emp-end-awkward":
                "/assets/dialogue-quest/employer-shift-request/dialogue/emp-end-awkward.opus",
            "emp-fail-unprofessional":
                "/assets/dialogue-quest/employer-shift-request/dialogue/emp-fail-unprofessional.opus",
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

/**
 * Returns the pre-generated VOICEVOX MP3 path for a player response option (choiceId).
 */
export function getScenarioChoiceAudioUrl(
    scenarioId: string,
    choiceId: string
): string {
    return `/assets/dialogue-quest/${scenarioId}/choices/${choiceId}.opus`;
}

/**
 * Returns the lofi background ambient audio loop MP3 path for a given scenario.
 */
export function getScenarioAmbientAudioUrl(scenarioId: string): string {
    return `/assets/dialogue-quest/${scenarioId}/sfx/ambience.opus`;
}

let activeCharacterSfx: HTMLAudioElement | null = null;

/**
 * Stops any currently playing scenario expressive SFX.
 */
export function stopScenarioSfx(): void {
    if (!activeCharacterSfx) return;
    try {
        activeCharacterSfx.pause();
        activeCharacterSfx.currentTime = 0;
        activeCharacterSfx.src = "";
    } catch {
        // Ignore audio cleanup errors
    } finally {
        activeCharacterSfx = null;
    }
}

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
        if (
            !probe.canPlayType ||
            (!probe.canPlayType('audio/ogg; codecs="opus"') &&
             !probe.canPlayType("audio/ogg") &&
             !probe.canPlayType("audio/webm") &&
             !probe.canPlayType("audio/mpeg"))
        ) {
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
