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
    "client-apology-delay": {
        backgrounds: {
            "client-lobby-rain":
                "/assets/dialogue-quest/client-apology-delay/backgrounds/client-lobby-rain.webp",
            "client-hallway-walk":
                "/assets/dialogue-quest/client-apology-delay/backgrounds/client-hallway-walk.webp",
            "executive-meeting-room":
                "/assets/dialogue-quest/client-apology-delay/backgrounds/executive-meeting-room.webp",
            "client-elevator-farewell":
                "/assets/dialogue-quest/client-apology-delay/backgrounds/client-elevator-farewell.webp",
            default:
                "/assets/dialogue-quest/client-apology-delay/backgrounds/client-lobby-rain.webp",
        },
        characterSprites: {
            neutral:
                "/assets/dialogue-quest/client-apology-delay/characters/hasegawa/neutral.webp",
            stern:
                "/assets/dialogue-quest/client-apology-delay/characters/hasegawa/stern.webp",
            annoyed:
                "/assets/dialogue-quest/client-apology-delay/characters/hasegawa/annoyed.webp",
            scolding:
                "/assets/dialogue-quest/client-apology-delay/characters/hasegawa/scolding.webp",
            proud:
                "/assets/dialogue-quest/client-apology-delay/characters/hasegawa/proud.webp",
            disappointed:
                "/assets/dialogue-quest/client-apology-delay/characters/hasegawa/disappointed.webp",
            "yoshimura-neutral":
                "/assets/dialogue-quest/client-apology-delay/characters/yoshimura/neutral.webp",
            "yoshimura-troubled":
                "/assets/dialogue-quest/client-apology-delay/characters/yoshimura/troubled.webp",
            "saito-neutral":
                "/assets/dialogue-quest/client-apology-delay/characters/saito/neutral.webp",
            "saito-worried":
                "/assets/dialogue-quest/client-apology-delay/characters/saito/worried.webp",
            "saito-stern":
                "/assets/dialogue-quest/client-apology-delay/characters/saito/stern.webp",
            "saito-thinking":
                "/assets/dialogue-quest/client-apology-delay/characters/saito/thinking.webp",
            "saito-troubled":
                "/assets/dialogue-quest/client-apology-delay/characters/saito/troubled.webp",
            "saito-relieved":
                "/assets/dialogue-quest/client-apology-delay/characters/saito/relieved.webp",
            "hasegawa-neutral":
                "/assets/dialogue-quest/client-apology-delay/characters/hasegawa/neutral.webp",
            "hasegawa-stern":
                "/assets/dialogue-quest/client-apology-delay/characters/hasegawa/stern.webp",
            "hasegawa-annoyed":
                "/assets/dialogue-quest/client-apology-delay/characters/hasegawa/annoyed.webp",
            "hasegawa-scolding":
                "/assets/dialogue-quest/client-apology-delay/characters/hasegawa/scolding.webp",
            "hasegawa-proud":
                "/assets/dialogue-quest/client-apology-delay/characters/hasegawa/proud.webp",
            "hasegawa-disappointed":
                "/assets/dialogue-quest/client-apology-delay/characters/hasegawa/disappointed.webp",
        },
        sfx: {
            // Character-prefixed expressive sounds
            "hasegawa-neutral":
                "/assets/dialogue-quest/client-apology-delay/sfx/hasegawa-neutral.opus",
            "hasegawa-stern":
                "/assets/dialogue-quest/client-apology-delay/sfx/hasegawa-stern.opus",
            "hasegawa-annoyed":
                "/assets/dialogue-quest/client-apology-delay/sfx/hasegawa-annoyed.opus",
            "hasegawa-scolding":
                "/assets/dialogue-quest/client-apology-delay/sfx/hasegawa-scolding.opus",
            "hasegawa-proud":
                "/assets/dialogue-quest/client-apology-delay/sfx/hasegawa-proud.opus",
            "hasegawa-disappointed":
                "/assets/dialogue-quest/client-apology-delay/sfx/hasegawa-disappointed.opus",
            "saito-neutral":
                "/assets/dialogue-quest/client-apology-delay/sfx/saito-neutral.opus",
            "saito-worried":
                "/assets/dialogue-quest/client-apology-delay/sfx/saito-worried.opus",
            "saito-stern":
                "/assets/dialogue-quest/client-apology-delay/sfx/saito-stern.opus",
            "saito-thinking":
                "/assets/dialogue-quest/client-apology-delay/sfx/saito-thinking.opus",
            "saito-troubled":
                "/assets/dialogue-quest/client-apology-delay/sfx/saito-troubled.opus",
            "saito-relieved":
                "/assets/dialogue-quest/client-apology-delay/sfx/saito-relieved.opus",
            "yoshimura-neutral":
                "/assets/dialogue-quest/client-apology-delay/sfx/yoshimura-neutral.opus",
            "yoshimura-troubled":
                "/assets/dialogue-quest/client-apology-delay/sfx/yoshimura-troubled.opus",
            // Direct expression fallbacks
            neutral:
                "/assets/dialogue-quest/client-apology-delay/sfx/neutral.opus",
            stern:
                "/assets/dialogue-quest/client-apology-delay/sfx/stern.opus",
            annoyed:
                "/assets/dialogue-quest/client-apology-delay/sfx/annoyed.opus",
            scolding:
                "/assets/dialogue-quest/client-apology-delay/sfx/scolding.opus",
            proud:
                "/assets/dialogue-quest/client-apology-delay/sfx/proud.opus",
            disappointed:
                "/assets/dialogue-quest/client-apology-delay/sfx/disappointed.opus",
            worried:
                "/assets/dialogue-quest/client-apology-delay/sfx/worried.opus",
            thinking:
                "/assets/dialogue-quest/client-apology-delay/sfx/thinking.opus",
            troubled:
                "/assets/dialogue-quest/client-apology-delay/sfx/troubled.opus",
            relieved:
                "/assets/dialogue-quest/client-apology-delay/sfx/relieved.opus",
            // Scene SFX
            "elevator-chime":
                "/assets/dialogue-quest/client-apology-delay/sfx/elevator-chime.opus",
            "door-knock":
                "/assets/dialogue-quest/client-apology-delay/sfx/door-knock.opus",
            "rain-on-window":
                "/assets/dialogue-quest/client-apology-delay/sfx/rain-on-window.opus",
            "briefcase-latch":
                "/assets/dialogue-quest/client-apology-delay/sfx/briefcase-latch.opus",
            ambience:
                "/assets/dialogue-quest/client-apology-delay/sfx/ambience.opus",
        },
        dialogueAudio: {
            "client-node-1-lobby":
                "/assets/dialogue-quest/client-apology-delay/dialogue/client-node-1-lobby.opus",
            "client-node-2a-hallway-probe":
                "/assets/dialogue-quest/client-apology-delay/dialogue/client-node-2a-hallway-probe.opus",
            "client-node-2b-lobby-caution":
                "/assets/dialogue-quest/client-apology-delay/dialogue/client-node-2b-lobby-caution.opus",
            "client-node-2c-lobby-freeze":
                "/assets/dialogue-quest/client-apology-delay/dialogue/client-node-2c-lobby-freeze.opus",
            "client-node-3a-boardroom-fair":
                "/assets/dialogue-quest/client-apology-delay/dialogue/client-node-3a-boardroom-fair.opus",
            "client-node-3b-boardroom-tense":
                "/assets/dialogue-quest/client-apology-delay/dialogue/client-node-3b-boardroom-tense.opus",
            "client-node-4a-mitigation-talk":
                "/assets/dialogue-quest/client-apology-delay/dialogue/client-node-4a-mitigation-talk.opus",
            "client-node-4b-deadline-squeeze":
                "/assets/dialogue-quest/client-apology-delay/dialogue/client-node-4b-deadline-squeeze.opus",
            "client-node-4c-crisis-ultimatum":
                "/assets/dialogue-quest/client-apology-delay/dialogue/client-node-4c-crisis-ultimatum.opus",
            "client-node-5a-elevator-final":
                "/assets/dialogue-quest/client-apology-delay/dialogue/client-node-5a-elevator-final.opus",
            "client-node-5b-skeptical-terms":
                "/assets/dialogue-quest/client-apology-delay/dialogue/client-node-5b-skeptical-terms.opus",
            "client-node-end-perfect":
                "/assets/dialogue-quest/client-apology-delay/dialogue/client-node-end-perfect.opus",
            "client-node-end-success":
                "/assets/dialogue-quest/client-apology-delay/dialogue/client-node-end-success.opus",
            "client-node-end-awkward":
                "/assets/dialogue-quest/client-apology-delay/dialogue/client-node-end-awkward.opus",
            "client-node-end-failure":
                "/assets/dialogue-quest/client-apology-delay/dialogue/client-node-end-failure.opus",
        },
    },
    "job-interview-pr": {
        backgrounds: {
            "corp-waiting-lounge":
                "/assets/dialogue-quest/job-interview-pr/backgrounds/corp-waiting-lounge.webp",
            "interview-room-door":
                "/assets/dialogue-quest/job-interview-pr/backgrounds/interview-room-door.webp",
            "executive-interview-room":
                "/assets/dialogue-quest/job-interview-pr/backgrounds/executive-interview-room.webp",
            "office-terrace-exit":
                "/assets/dialogue-quest/job-interview-pr/backgrounds/office-terrace-exit.webp",
            default:
                "/assets/dialogue-quest/job-interview-pr/backgrounds/corp-waiting-lounge.webp",
        },
        characterSprites: {
            // Default card cover & lead sprite (Director Matsumoto)
            neutral:
                "/assets/dialogue-quest/job-interview-pr/characters/matsumoto/neutral.webp",
            happy:
                "/assets/dialogue-quest/job-interview-pr/characters/matsumoto/happy.webp",
            proud:
                "/assets/dialogue-quest/job-interview-pr/characters/matsumoto/proud.webp",
            stern:
                "/assets/dialogue-quest/job-interview-pr/characters/matsumoto/stern.webp",
            thinking:
                "/assets/dialogue-quest/job-interview-pr/characters/matsumoto/thinking.webp",
            disappointed:
                "/assets/dialogue-quest/job-interview-pr/characters/matsumoto/disappointed.webp",
            // Matsumoto multi-character prefixed keys
            "matsumoto-neutral":
                "/assets/dialogue-quest/job-interview-pr/characters/matsumoto/neutral.webp",
            "matsumoto-happy":
                "/assets/dialogue-quest/job-interview-pr/characters/matsumoto/happy.webp",
            "matsumoto-proud":
                "/assets/dialogue-quest/job-interview-pr/characters/matsumoto/proud.webp",
            "matsumoto-stern":
                "/assets/dialogue-quest/job-interview-pr/characters/matsumoto/stern.webp",
            "matsumoto-thinking":
                "/assets/dialogue-quest/job-interview-pr/characters/matsumoto/thinking.webp",
            "matsumoto-disappointed":
                "/assets/dialogue-quest/job-interview-pr/characters/matsumoto/disappointed.webp",
            // Kawaguchi
            "kawaguchi-neutral":
                "/assets/dialogue-quest/job-interview-pr/characters/kawaguchi/neutral.webp",
            "kawaguchi-confused":
                "/assets/dialogue-quest/job-interview-pr/characters/kawaguchi/confused.webp",
            "kawaguchi-thinking":
                "/assets/dialogue-quest/job-interview-pr/characters/kawaguchi/thinking.webp",
            "kawaguchi-troubled":
                "/assets/dialogue-quest/job-interview-pr/characters/kawaguchi/troubled.webp",
            // Sato
            "sato-neutral":
                "/assets/dialogue-quest/job-interview-pr/characters/sato/neutral.webp",
            "sato-happy":
                "/assets/dialogue-quest/job-interview-pr/characters/sato/happy.webp",
            "sato-troubled":
                "/assets/dialogue-quest/job-interview-pr/characters/sato/troubled.webp",
        },
        sfx: {
            // Character-prefixed expressive sounds
            "matsumoto-neutral":
                "/assets/dialogue-quest/job-interview-pr/sfx/matsumoto-neutral.opus",
            "matsumoto-thinking":
                "/assets/dialogue-quest/job-interview-pr/sfx/matsumoto-thinking.opus",
            "matsumoto-stern":
                "/assets/dialogue-quest/job-interview-pr/sfx/matsumoto-stern.opus",
            "matsumoto-happy":
                "/assets/dialogue-quest/job-interview-pr/sfx/matsumoto-happy.opus",
            "matsumoto-proud":
                "/assets/dialogue-quest/job-interview-pr/sfx/matsumoto-proud.opus",
            "matsumoto-disappointed":
                "/assets/dialogue-quest/job-interview-pr/sfx/matsumoto-disappointed.opus",
            "kawaguchi-neutral":
                "/assets/dialogue-quest/job-interview-pr/sfx/kawaguchi-neutral.opus",
            "kawaguchi-confused":
                "/assets/dialogue-quest/job-interview-pr/sfx/kawaguchi-confused.opus",
            "kawaguchi-thinking":
                "/assets/dialogue-quest/job-interview-pr/sfx/kawaguchi-thinking.opus",
            "kawaguchi-troubled":
                "/assets/dialogue-quest/job-interview-pr/sfx/kawaguchi-troubled.opus",
            "sato-neutral":
                "/assets/dialogue-quest/job-interview-pr/sfx/sato-neutral.opus",
            "sato-troubled":
                "/assets/dialogue-quest/job-interview-pr/sfx/sato-troubled.opus",
            "sato-happy":
                "/assets/dialogue-quest/job-interview-pr/sfx/sato-happy.opus",
            // Direct expression fallbacks
            neutral:
                "/assets/dialogue-quest/job-interview-pr/sfx/neutral.opus",
            thinking:
                "/assets/dialogue-quest/job-interview-pr/sfx/thinking.opus",
            stern:
                "/assets/dialogue-quest/job-interview-pr/sfx/stern.opus",
            happy:
                "/assets/dialogue-quest/job-interview-pr/sfx/happy.opus",
            proud:
                "/assets/dialogue-quest/job-interview-pr/sfx/proud.opus",
            disappointed:
                "/assets/dialogue-quest/job-interview-pr/sfx/disappointed.opus",
            confused:
                "/assets/dialogue-quest/job-interview-pr/sfx/confused.opus",
            troubled:
                "/assets/dialogue-quest/job-interview-pr/sfx/troubled.opus",
            // Scene SFX
            "door-knock":
                "/assets/dialogue-quest/job-interview-pr/sfx/door-knock.opus",
            "chair-sit":
                "/assets/dialogue-quest/job-interview-pr/sfx/chair-sit.opus",
            "notepad-pen":
                "/assets/dialogue-quest/job-interview-pr/sfx/notepad-pen.opus",
            "terrace-breeze":
                "/assets/dialogue-quest/job-interview-pr/sfx/terrace-breeze.opus",
            ambience:
                "/assets/dialogue-quest/job-interview-pr/sfx/ambience.opus",
        },
        dialogueAudio: {
            "interview-node-1-lounge":
                "/assets/dialogue-quest/job-interview-pr/dialogue/interview-node-1-lounge.opus",
            "interview-node-2a-door-entry":
                "/assets/dialogue-quest/job-interview-pr/dialogue/interview-node-2a-door-entry.opus",
            "interview-node-2b-lounge-caution":
                "/assets/dialogue-quest/job-interview-pr/dialogue/interview-node-2b-lounge-caution.opus",
            "interview-node-3a-reason-deep":
                "/assets/dialogue-quest/job-interview-pr/dialogue/interview-node-3a-reason-deep.opus",
            "interview-node-3b-reason-probe":
                "/assets/dialogue-quest/job-interview-pr/dialogue/interview-node-3b-reason-probe.opus",
            "interview-node-3c-cold-skeptic":
                "/assets/dialogue-quest/job-interview-pr/dialogue/interview-node-3c-cold-skeptic.opus",
            "interview-node-4a-conflict-nemawashi":
                "/assets/dialogue-quest/job-interview-pr/dialogue/interview-node-4a-conflict-nemawashi.opus",
            "interview-node-4b-attitude-check":
                "/assets/dialogue-quest/job-interview-pr/dialogue/interview-node-4b-attitude-check.opus",
            "interview-node-5a-reverse-question":
                "/assets/dialogue-quest/job-interview-pr/dialogue/interview-node-5a-reverse-question.opus",
            "interview-node-5b-last-chance":
                "/assets/dialogue-quest/job-interview-pr/dialogue/interview-node-5b-last-chance.opus",
            "interview-node-end-perfect":
                "/assets/dialogue-quest/job-interview-pr/dialogue/interview-node-end-perfect.opus",
            "interview-node-end-success":
                "/assets/dialogue-quest/job-interview-pr/dialogue/interview-node-end-success.opus",
            "interview-node-end-awkward":
                "/assets/dialogue-quest/job-interview-pr/dialogue/interview-node-end-awkward.opus",
            "interview-node-end-failure":
                "/assets/dialogue-quest/job-interview-pr/dialogue/interview-node-end-failure.opus",
        },
    },
    "ward-office-tax": {
        backgrounds: {
            "ward-entrance-kiosk":
                "/assets/dialogue-quest/ward-office-tax/backgrounds/ward-entrance-kiosk.webp",
            "tax-counter-window":
                "/assets/dialogue-quest/ward-office-tax/backgrounds/tax-counter-window.webp",
            "private-consultation-booth":
                "/assets/dialogue-quest/ward-office-tax/backgrounds/private-consultation-booth.webp",
            "pension-desk-exit":
                "/assets/dialogue-quest/ward-office-tax/backgrounds/pension-desk-exit.webp",
            default:
                "/assets/dialogue-quest/ward-office-tax/backgrounds/ward-entrance-kiosk.webp",
        },
        characterSprites: {
            // Default card cover & lead sprite (Section Chief Obata)
            neutral:
                "/assets/dialogue-quest/ward-office-tax/characters/obata/neutral.webp",
            thinking:
                "/assets/dialogue-quest/ward-office-tax/characters/obata/thinking.webp",
            stern:
                "/assets/dialogue-quest/ward-office-tax/characters/obata/stern.webp",
            proud:
                "/assets/dialogue-quest/ward-office-tax/characters/obata/proud.webp",
            disappointed:
                "/assets/dialogue-quest/ward-office-tax/characters/obata/disappointed.webp",
            // Obata multi-character prefixed keys
            "obata-neutral":
                "/assets/dialogue-quest/ward-office-tax/characters/obata/neutral.webp",
            "obata-thinking":
                "/assets/dialogue-quest/ward-office-tax/characters/obata/thinking.webp",
            "obata-stern":
                "/assets/dialogue-quest/ward-office-tax/characters/obata/stern.webp",
            "obata-proud":
                "/assets/dialogue-quest/ward-office-tax/characters/obata/proud.webp",
            "obata-disappointed":
                "/assets/dialogue-quest/ward-office-tax/characters/obata/disappointed.webp",
            // Takahashi
            "takahashi-neutral":
                "/assets/dialogue-quest/ward-office-tax/characters/takahashi/neutral.webp",
            "takahashi-happy":
                "/assets/dialogue-quest/ward-office-tax/characters/takahashi/happy.webp",
            "takahashi-relieved":
                "/assets/dialogue-quest/ward-office-tax/characters/takahashi/relieved.webp",
            "takahashi-troubled":
                "/assets/dialogue-quest/ward-office-tax/characters/takahashi/troubled.webp",
            // Koga
            "koga-neutral":
                "/assets/dialogue-quest/ward-office-tax/characters/koga/neutral.webp",
            "koga-thinking":
                "/assets/dialogue-quest/ward-office-tax/characters/koga/thinking.webp",
            "koga-troubled":
                "/assets/dialogue-quest/ward-office-tax/characters/koga/troubled.webp",
            "koga-worried":
                "/assets/dialogue-quest/ward-office-tax/characters/koga/worried.webp",
        },
        sfx: {
            // Character-prefixed expressive sounds
            "takahashi-neutral":
                "/assets/dialogue-quest/ward-office-tax/sfx/takahashi-neutral.opus",
            "takahashi-troubled":
                "/assets/dialogue-quest/ward-office-tax/sfx/takahashi-troubled.opus",
            "takahashi-happy":
                "/assets/dialogue-quest/ward-office-tax/sfx/takahashi-happy.opus",
            "takahashi-relieved":
                "/assets/dialogue-quest/ward-office-tax/sfx/takahashi-relieved.opus",
            "koga-neutral":
                "/assets/dialogue-quest/ward-office-tax/sfx/koga-neutral.opus",
            "koga-thinking":
                "/assets/dialogue-quest/ward-office-tax/sfx/koga-thinking.opus",
            "koga-worried":
                "/assets/dialogue-quest/ward-office-tax/sfx/koga-worried.opus",
            "koga-troubled":
                "/assets/dialogue-quest/ward-office-tax/sfx/koga-troubled.opus",
            "obata-neutral":
                "/assets/dialogue-quest/ward-office-tax/sfx/obata-neutral.opus",
            "obata-thinking":
                "/assets/dialogue-quest/ward-office-tax/sfx/obata-thinking.opus",
            "obata-stern":
                "/assets/dialogue-quest/ward-office-tax/sfx/obata-stern.opus",
            "obata-proud":
                "/assets/dialogue-quest/ward-office-tax/sfx/obata-proud.opus",
            "obata-disappointed":
                "/assets/dialogue-quest/ward-office-tax/sfx/obata-disappointed.opus",
            // Direct expression fallbacks
            neutral:
                "/assets/dialogue-quest/ward-office-tax/sfx/neutral.opus",
            troubled:
                "/assets/dialogue-quest/ward-office-tax/sfx/troubled.opus",
            happy:
                "/assets/dialogue-quest/ward-office-tax/sfx/happy.opus",
            relieved:
                "/assets/dialogue-quest/ward-office-tax/sfx/relieved.opus",
            thinking:
                "/assets/dialogue-quest/ward-office-tax/sfx/thinking.opus",
            worried:
                "/assets/dialogue-quest/ward-office-tax/sfx/worried.opus",
            stern:
                "/assets/dialogue-quest/ward-office-tax/sfx/stern.opus",
            proud:
                "/assets/dialogue-quest/ward-office-tax/sfx/proud.opus",
            disappointed:
                "/assets/dialogue-quest/ward-office-tax/sfx/disappointed.opus",
            // Scene SFX
            "ticket-beep":
                "/assets/dialogue-quest/ward-office-tax/sfx/ticket-beep.opus",
            "paper-stamp":
                "/assets/dialogue-quest/ward-office-tax/sfx/paper-stamp.opus",
            "counter-bell":
                "/assets/dialogue-quest/ward-office-tax/sfx/counter-bell.opus",
            "booth-door":
                "/assets/dialogue-quest/ward-office-tax/sfx/booth-door.opus",
            ambience:
                "/assets/dialogue-quest/ward-office-tax/sfx/ambience.opus",
        },
        dialogueAudio: {
            "tax-node-1-kiosk":
                "/assets/dialogue-quest/ward-office-tax/dialogue/tax-node-1-kiosk.opus",
            "tax-node-2a-counter-docs":
                "/assets/dialogue-quest/ward-office-tax/dialogue/tax-node-2a-counter-docs.opus",
            "tax-node-2b-kiosk-calm":
                "/assets/dialogue-quest/ward-office-tax/dialogue/tax-node-2b-kiosk-calm.opus",
            "tax-node-3a-booth-obata":
                "/assets/dialogue-quest/ward-office-tax/dialogue/tax-node-3a-booth-obata.opus",
            "tax-node-3b-counter-stall":
                "/assets/dialogue-quest/ward-office-tax/dialogue/tax-node-3b-counter-stall.opus",
            "tax-node-4a-installment-plan":
                "/assets/dialogue-quest/ward-office-tax/dialogue/tax-node-4a-installment-plan.opus",
            "tax-node-4b-obata-lecture":
                "/assets/dialogue-quest/ward-office-tax/dialogue/tax-node-4b-obata-lecture.opus",
            "tax-node-5a-pension-handoff":
                "/assets/dialogue-quest/ward-office-tax/dialogue/tax-node-5a-pension-handoff.opus",
            "tax-node-5b-debit-warning":
                "/assets/dialogue-quest/ward-office-tax/dialogue/tax-node-5b-debit-warning.opus",
            "tax-node-end-perfect":
                "/assets/dialogue-quest/ward-office-tax/dialogue/tax-node-end-perfect.opus",
            "tax-node-end-success":
                "/assets/dialogue-quest/ward-office-tax/dialogue/tax-node-end-success.opus",
            "tax-node-end-awkward":
                "/assets/dialogue-quest/ward-office-tax/dialogue/tax-node-end-awkward.opus",
            "tax-node-end-failure":
                "/assets/dialogue-quest/ward-office-tax/dialogue/tax-node-end-failure.opus",
        },
    },
    "first-date-sakura": {
        backgrounds: {
            "daikanyama-station":
                "/assets/dialogue-quest/first-date-sakura/backgrounds/daikanyama-station.webp",
            "daikanyama-station-exit":
                "/assets/dialogue-quest/first-date-sakura/backgrounds/daikanyama-station-exit.webp",
            "indie-art-gallery":
                "/assets/dialogue-quest/first-date-sakura/backgrounds/indie-art-gallery.webp",
            "kominka-cafe-interior":
                "/assets/dialogue-quest/first-date-sakura/backgrounds/kominka-cafe-interior.webp",
            "nakameguro-evening-canal":
                "/assets/dialogue-quest/first-date-sakura/backgrounds/nakameguro-evening-canal.webp",
            "nakameguro-station-lights":
                "/assets/dialogue-quest/first-date-sakura/backgrounds/nakameguro-station-lights.webp",
            default:
                "/assets/dialogue-quest/first-date-sakura/backgrounds/daikanyama-station-exit.webp",
        },
        characterSprites: {
            // Default card cover & lead sprite (Misaki)
            neutral:
                "/assets/dialogue-quest/first-date-sakura/characters/misaki/neutral.webp",
            happy:
                "/assets/dialogue-quest/first-date-sakura/characters/misaki/happy.webp",
            thinking:
                "/assets/dialogue-quest/first-date-sakura/characters/misaki/thinking.webp",
            embarrassed:
                "/assets/dialogue-quest/first-date-sakura/characters/misaki/embarrassed.webp",
            embarrased:
                "/assets/dialogue-quest/first-date-sakura/characters/misaki/embarrassed.webp",
            confused:
                "/assets/dialogue-quest/first-date-sakura/characters/misaki/confused.webp",
            worried:
                "/assets/dialogue-quest/first-date-sakura/characters/misaki/worried.webp",
            proud:
                "/assets/dialogue-quest/first-date-sakura/characters/misaki/proud.webp",
            relieved:
                "/assets/dialogue-quest/first-date-sakura/characters/misaki/relieved.webp",
            troubled:
                "/assets/dialogue-quest/first-date-sakura/characters/misaki/troubled.webp",
            disappointed:
                "/assets/dialogue-quest/first-date-sakura/characters/misaki/disappointed.webp",
            // Misaki multi-character prefixed keys
            "misaki-neutral":
                "/assets/dialogue-quest/first-date-sakura/characters/misaki/neutral.webp",
            "misaki-happy":
                "/assets/dialogue-quest/first-date-sakura/characters/misaki/happy.webp",
            "misaki-thinking":
                "/assets/dialogue-quest/first-date-sakura/characters/misaki/thinking.webp",
            "misaki-embarrassed":
                "/assets/dialogue-quest/first-date-sakura/characters/misaki/embarrassed.webp",
            "misaki-embarrased":
                "/assets/dialogue-quest/first-date-sakura/characters/misaki/embarrassed.webp",
            "misaki-confused":
                "/assets/dialogue-quest/first-date-sakura/characters/misaki/confused.webp",
            "misaki-worried":
                "/assets/dialogue-quest/first-date-sakura/characters/misaki/worried.webp",
            "misaki-proud":
                "/assets/dialogue-quest/first-date-sakura/characters/misaki/proud.webp",
            "misaki-relieved":
                "/assets/dialogue-quest/first-date-sakura/characters/misaki/relieved.webp",
            "misaki-troubled":
                "/assets/dialogue-quest/first-date-sakura/characters/misaki/troubled.webp",
            "misaki-disappointed":
                "/assets/dialogue-quest/first-date-sakura/characters/misaki/disappointed.webp",
            // Kominka Kissaten Master
            "master-neutral":
                "/assets/dialogue-quest/first-date-sakura/characters/master/neutral.webp",
            "master-thinking":
                "/assets/dialogue-quest/first-date-sakura/characters/master/thinking.webp",
            "master-happy":
                "/assets/dialogue-quest/first-date-sakura/characters/master/happy.webp",
        },
        sfx: {
            // Character-prefixed expressive sounds
            "misaki-happy":
                "/assets/dialogue-quest/first-date-sakura/sfx/misaki-happy.opus",
            "misaki-thinking":
                "/assets/dialogue-quest/first-date-sakura/sfx/misaki-thinking.opus",
            "misaki-embarrassed":
                "/assets/dialogue-quest/first-date-sakura/sfx/misaki-embarrassed.opus",
            "misaki-confused":
                "/assets/dialogue-quest/first-date-sakura/sfx/misaki-confused.opus",
            "misaki-worried":
                "/assets/dialogue-quest/first-date-sakura/sfx/misaki-worried.opus",
            "misaki-proud":
                "/assets/dialogue-quest/first-date-sakura/sfx/misaki-proud.opus",
            "misaki-relieved":
                "/assets/dialogue-quest/first-date-sakura/sfx/misaki-relieved.opus",
            "misaki-troubled":
                "/assets/dialogue-quest/first-date-sakura/sfx/misaki-troubled.opus",
            "misaki-disappointed":
                "/assets/dialogue-quest/first-date-sakura/sfx/misaki-disappointed.opus",
            "master-neutral":
                "/assets/dialogue-quest/first-date-sakura/sfx/master-neutral.opus",
            "master-thinking":
                "/assets/dialogue-quest/first-date-sakura/sfx/master-thinking.opus",
            "master-happy":
                "/assets/dialogue-quest/first-date-sakura/sfx/master-happy.opus",
            // Direct expression fallbacks
            happy:
                "/assets/dialogue-quest/first-date-sakura/sfx/happy.opus",
            thinking:
                "/assets/dialogue-quest/first-date-sakura/sfx/thinking.opus",
            embarrassed:
                "/assets/dialogue-quest/first-date-sakura/sfx/embarrassed.opus",
            confused:
                "/assets/dialogue-quest/first-date-sakura/sfx/confused.opus",
            worried:
                "/assets/dialogue-quest/first-date-sakura/sfx/worried.opus",
            proud:
                "/assets/dialogue-quest/first-date-sakura/sfx/proud.opus",
            relieved:
                "/assets/dialogue-quest/first-date-sakura/sfx/relieved.opus",
            troubled:
                "/assets/dialogue-quest/first-date-sakura/sfx/troubled.opus",
            disappointed:
                "/assets/dialogue-quest/first-date-sakura/sfx/disappointed.opus",
            neutral:
                "/assets/dialogue-quest/first-date-sakura/sfx/neutral.opus",
            // Scene SFX
            "station-chime":
                "/assets/dialogue-quest/first-date-sakura/sfx/station-chime.opus",
            "cafe-bell":
                "/assets/dialogue-quest/first-date-sakura/sfx/cafe-bell.opus",
            "coffee-pour":
                "/assets/dialogue-quest/first-date-sakura/sfx/coffee-pour.opus",
            "canal-breeze":
                "/assets/dialogue-quest/first-date-sakura/sfx/canal-breeze.opus",
            ambience:
                "/assets/dialogue-quest/first-date-sakura/sfx/ambience.opus",
        },
        dialogueAudio: {
            "date-node-1-meetup":
                "/assets/dialogue-quest/first-date-sakura/dialogue/date-node-1-meetup.opus",
            "date-node-2a-gallery-warm":
                "/assets/dialogue-quest/first-date-sakura/dialogue/date-node-2a-gallery-warm.opus",
            "date-node-2b-gallery-stiff":
                "/assets/dialogue-quest/first-date-sakura/dialogue/date-node-2b-gallery-stiff.opus",
            "date-node-2c-gallery-guarded":
                "/assets/dialogue-quest/first-date-sakura/dialogue/date-node-2c-gallery-guarded.opus",
            "date-node-3a-cafe-entrance":
                "/assets/dialogue-quest/first-date-sakura/dialogue/date-node-3a-cafe-entrance.opus",
            "date-node-3b-cafe-cool":
                "/assets/dialogue-quest/first-date-sakura/dialogue/date-node-3b-cafe-cool.opus",
            "date-node-4a-cafe-deep":
                "/assets/dialogue-quest/first-date-sakura/dialogue/date-node-4a-cafe-deep.opus",
            "date-node-4b-cafe-chilly":
                "/assets/dialogue-quest/first-date-sakura/dialogue/date-node-4b-cafe-chilly.opus",
            "date-node-5a-checkout-grace":
                "/assets/dialogue-quest/first-date-sakura/dialogue/date-node-5a-checkout-grace.opus",
            "date-node-6a-canal-evening":
                "/assets/dialogue-quest/first-date-sakura/dialogue/date-node-6a-canal-evening.opus",
            "date-node-5b-canal-recover":
                "/assets/dialogue-quest/first-date-sakura/dialogue/date-node-5b-canal-recover.opus",
            "date-node-end-perfect":
                "/assets/dialogue-quest/first-date-sakura/dialogue/date-node-end-perfect.opus",
            "date-node-end-success":
                "/assets/dialogue-quest/first-date-sakura/dialogue/date-node-end-success.opus",
            "date-node-end-awkward":
                "/assets/dialogue-quest/first-date-sakura/dialogue/date-node-end-awkward.opus",
            "date-node-end-failure":
                "/assets/dialogue-quest/first-date-sakura/dialogue/date-node-end-failure.opus",
        },
    },
    "genki-little-asia": {
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
    },
    "genki-department-manager": {
        backgrounds: {
            "executive-meeting-room":
                "/assets/dialogue-quest/client-apology-delay/backgrounds/executive-meeting-room.webp",
            default:
                "/assets/dialogue-quest/client-apology-delay/backgrounds/executive-meeting-room.webp",
        },
        characterSprites: {
            neutral:
                "/assets/dialogue-quest/client-apology-delay/characters/hasegawa/neutral.webp",
            stern:
                "/assets/dialogue-quest/client-apology-delay/characters/hasegawa/stern.webp",
            annoyed:
                "/assets/dialogue-quest/client-apology-delay/characters/hasegawa/annoyed.webp",
            scolding:
                "/assets/dialogue-quest/client-apology-delay/characters/hasegawa/scolding.webp",
            proud:
                "/assets/dialogue-quest/client-apology-delay/characters/hasegawa/proud.webp",
            disappointed:
                "/assets/dialogue-quest/client-apology-delay/characters/hasegawa/disappointed.webp",
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
    expression?: string,
    characterKey?: string
): string | undefined {
    const manifest = DIALOGUE_ASSET_MANIFESTS[scenarioId];
    if (!manifest) return undefined;

    const key = expression?.toLowerCase() || "neutral";
    if (characterKey) {
        const charKey = characterKey.toLowerCase();
        const multiSprite =
            manifest.characterSprites[`${charKey}-${key}`] ||
            manifest.characterSprites[`${charKey}-neutral`];
        if (multiSprite) return multiSprite;
    }

    return manifest.characterSprites[key] || manifest.characterSprites.neutral;
}

/**
 * Returns the resolved character expressive SFX URL for a given scenario and expression/event.
 */
export function getScenarioSfxUrl(
    scenarioId: string,
    key: string,
    characterKey?: string
): string | undefined {
    const manifest = DIALOGUE_ASSET_MANIFESTS[scenarioId];
    if (!manifest || !manifest.sfx) return undefined;

    const lookupKey = key.toLowerCase();
    if (characterKey) {
        const charKey = `${characterKey.toLowerCase()}-${lookupKey}`;
        if (manifest.sfx[charKey]) return manifest.sfx[charKey];
    }
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
 * Ambient audio sources for cross-browser compatibility
 */
export interface ScenarioAmbientAudioSources {
    opus: string;
    mp3: string;
}

/**
 * Returns both Opus and MP3 audio paths for scenario background ambience.
 * Used for cross-browser fallback (e.g. Safari / WebKit lacking Ogg Opus support).
 */
export function getScenarioAmbientAudioSources(scenarioId: string): ScenarioAmbientAudioSources {
    return {
        opus: `/assets/dialogue-quest/${scenarioId}/sfx/ambience.opus`,
        mp3: `/assets/dialogue-quest/${scenarioId}/sfx/ambience.mp3`,
    };
}

/**
 * Returns the lofi background ambient audio loop Opus path for a given scenario.
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
    volume = 0.75,
    characterKey?: string
): void {
    if (!isSfxEnabled()) return;
    if (typeof window === "undefined" || typeof Audio === "undefined") return;
    const url = getScenarioSfxUrl(scenarioId, key, characterKey);
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
