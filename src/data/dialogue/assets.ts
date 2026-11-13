/**
 * Visual Novel Asset Registry for Dialogue Quest
 * Maps scenario locations and character expressions to asset paths.
 */

export interface ScenarioAssetManifest {
  backgrounds: Record<string, string>;
  characterSprites: Record<string, string>;
  sfx?: Record<string, string>;
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

/**
 * Non-blocking play of a scenario expressive SFX.
 * Safe in SSR and headless environments.
 */
export function playScenarioSfx(
  scenarioId: string,
  key: string,
  volume = 0.5
): void {
  if (typeof window === "undefined" || typeof Audio === "undefined") return;
  const url = getScenarioSfxUrl(scenarioId, key);
  if (!url) return;

  try {
    const probe = new Audio();
    if (!probe.canPlayType || !probe.canPlayType("audio/mpeg")) {
      return;
    }
    const audio = new Audio(url);
    audio.volume = Math.max(0, Math.min(1, volume));
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  } catch {
    // Ignore audio initialization errors
  }
}
