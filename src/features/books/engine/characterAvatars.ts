/**
 * Centralized registry for textbook dialogue character avatars.
 * Maps Genki textbook character identifiers and names (English & Japanese)
 * to their corresponding neutral and talking portrait assets.
 *
 * Pure TypeScript (no React or UI dependencies) - safe for engine layering.
 */

export interface CharacterAvatar {
  id: string;
  name: string;
  nameJa: string;
  neutral: string;
  talking: string;
}

export const GENKI_CHARACTER_AVATARS: Record<string, CharacterAvatar> = {
  "mary-hart": {
    id: "mary-hart",
    name: "Mary Hart",
    nameJa: "メアリー・ハート",
    neutral: "/images/characters/mary-hart/neutral.webp",
    talking: "/images/characters/mary-hart/talking.webp",
  },
  "takeshi-kimura": {
    id: "takeshi-kimura",
    name: "Takeshi Kimura",
    nameJa: "木村たけし",
    neutral: "/images/characters/takeshi-kimura/neutral.webp",
    talking: "/images/characters/takeshi-kimura/talking.webp",
  },
  "sora-kim": {
    id: "sora-kim",
    name: "Sora Kim",
    nameJa: "キム・ソラ",
    neutral: "/images/characters/sora-kim/neutral.webp",
    talking: "/images/characters/sora-kim/talking.webp",
  },
  "robert-smith": {
    id: "robert-smith",
    name: "Robert Smith",
    nameJa: "ロバート・スミス",
    neutral: "/images/characters/robert-smith/neutral.webp",
    talking: "/images/characters/robert-smith/talking.webp",
  },
  "john-wang": {
    id: "john-wang",
    name: "John Wang",
    nameJa: "ジョン・ワン",
    neutral: "/images/characters/john-wang/neutral.webp",
    talking: "/images/characters/john-wang/talking.webp",
  },
  "prof-yamashita": {
    id: "prof-yamashita",
    name: "Professor Yamashita",
    nameJa: "山下先生",
    neutral: "/images/characters/prof-yamashita/neutral.webp",
    talking: "/images/characters/prof-yamashita/talking.webp",
  },
  "ken-suzuki": {
    id: "ken-suzuki",
    name: "Ken Suzuki",
    nameJa: "鈴木けん",
    neutral: "/images/characters/ken-suzuki/neutral.webp",
    talking: "/images/characters/ken-suzuki/talking.webp",
  },
  "yui-yamakawa": {
    id: "yui-yamakawa",
    name: "Yui Yamakawa",
    nameJa: "山川ゆい",
    neutral: "/images/characters/yui-yamakawa/neutral.webp",
    talking: "/images/characters/yui-yamakawa/talking.webp",
  },
  "host-father": {
    id: "host-father",
    name: "Host Father",
    nameJa: "お父さん",
    neutral: "/images/characters/host-father/neutral.webp",
    talking: "/images/characters/host-father/talking.webp",
  },
  "host-mother": {
    id: "host-mother",
    name: "Host Mother",
    nameJa: "お母さん",
    neutral: "/images/characters/host-mother/neutral.webp",
    talking: "/images/characters/host-mother/talking.webp",
  },
};

/**
 * Returns a list of all registered character avatars.
 */
export function getAllCharacterAvatars(): CharacterAvatar[] {
  return Object.values(GENKI_CHARACTER_AVATARS);
}

/**
 * Resolves a character portrait avatar by speaker name (English or Japanese) or ID.
 * Supports variations in naming, titles, and honorifics.
 * Returns null if the speaker is an unmapped side character (e.g., Doctor, Hotel staff).
 */
export function getCharacterAvatar(
  speaker?: string | null,
  speakerJa?: string | null
): CharacterAvatar | null {
  const normEn = (speaker || "").toLowerCase().trim();
  const normJa = (speakerJa || "").trim();

  if (!normEn && !normJa) return null;

  // Direct ID match
  if (normEn && GENKI_CHARACTER_AVATARS[normEn]) {
    return GENKI_CHARACTER_AVATARS[normEn];
  }

  // 1. Mary Hart
  if (
    normJa.includes("メアリー") ||
    normEn.includes("mary")
  ) {
    return GENKI_CHARACTER_AVATARS["mary-hart"];
  }

  // 2. Takeshi Kimura
  if (
    normJa.includes("たけし") ||
    normJa.includes("タケシ") ||
    normEn.includes("takeshi") ||
    (normEn.includes("kimura") && !normEn.includes("father") && !normEn.includes("mother"))
  ) {
    return GENKI_CHARACTER_AVATARS["takeshi-kimura"];
  }

  // 3. Sora Kim (also known as Sue Kim in older Genki editions)
  if (
    normJa.includes("ソラ") ||
    normJa.includes("そら") ||
    normJa.includes("スー") ||
    normEn.includes("sora") ||
    normEn.includes("sue")
  ) {
    return GENKI_CHARACTER_AVATARS["sora-kim"];
  }

  // 4. Robert Smith
  if (
    normJa.includes("ロバート") ||
    normEn.includes("robert") ||
    normEn.includes("smith")
  ) {
    return GENKI_CHARACTER_AVATARS["robert-smith"];
  }

  // 5. John Wang
  if (
    normJa.includes("ジョン") ||
    normEn.includes("john") ||
    (normEn.includes("wang") && !normEn.includes("yamakawa"))
  ) {
    return GENKI_CHARACTER_AVATARS["john-wang"];
  }

  // 6. Professor Yamashita
  if (
    normJa.includes("山下") ||
    (normJa.includes("先生") && !normJa.includes("医者")) ||
    normEn.includes("yamashita")
  ) {
    return GENKI_CHARACTER_AVATARS["prof-yamashita"];
  }

  // 7. Ken Suzuki
  if (
    normJa.includes("けん") ||
    normJa.includes("ケン") ||
    normEn.includes("ken") ||
    normJa.includes("鈴木")
  ) {
    return GENKI_CHARACTER_AVATARS["ken-suzuki"];
  }

  // 8. Yui Yamakawa
  if (
    normJa.includes("ゆい") ||
    normJa.includes("ユイ") ||
    normEn.includes("yui") ||
    normJa.includes("山川") ||
    normEn.includes("yamakawa")
  ) {
    return GENKI_CHARACTER_AVATARS["yui-yamakawa"];
  }

  // 9. Host Father (check father before general family)
  if (
    normJa.includes("お父さん") ||
    normJa.includes("おとうさん") ||
    normJa.includes("父") ||
    normEn.includes("father") ||
    normEn.includes("dad")
  ) {
    return GENKI_CHARACTER_AVATARS["host-father"];
  }

  // 10. Host Mother (check mother before general family)
  if (
    normJa.includes("お母さん") ||
    normJa.includes("おかあさん") ||
    normJa.includes("母") ||
    normEn.includes("mother") ||
    normEn.includes("mom")
  ) {
    return GENKI_CHARACTER_AVATARS["host-mother"];
  }

  return null;
}
