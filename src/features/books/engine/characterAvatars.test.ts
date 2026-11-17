import { describe, it, expect } from "vitest";
import {
  GENKI_CHARACTER_AVATARS,
  getAllCharacterAvatars,
  getCharacterAvatar,
} from "./characterAvatars";

describe("characterAvatars registry", () => {
  it("registers all 10 Genki characters with both neutral and talking asset paths", () => {
    const all = getAllCharacterAvatars();
    expect(all).toHaveLength(10);

    const expectedIds = [
      "mary-hart",
      "takeshi-kimura",
      "sora-kim",
      "robert-smith",
      "john-wang",
      "prof-yamashita",
      "ken-suzuki",
      "yui-yamakawa",
      "host-father",
      "host-mother",
    ];

    for (const id of expectedIds) {
      const char = GENKI_CHARACTER_AVATARS[id];
      expect(char).toBeDefined();
      expect(char.neutral).toBe(`/images/characters/${id}/neutral.webp`);
      expect(char.talking).toBe(`/images/characters/${id}/talking.webp`);
    }
  });

  it("resolves characters by English name variations", () => {
    expect(getCharacterAvatar("Mary")?.id).toBe("mary-hart");
    expect(getCharacterAvatar("Mary Hart")?.id).toBe("mary-hart");
    expect(getCharacterAvatar("Takeshi")?.id).toBe("takeshi-kimura");
    expect(getCharacterAvatar("Takeshi Kimura")?.id).toBe("takeshi-kimura");
    expect(getCharacterAvatar("Sora")?.id).toBe("sora-kim");
    expect(getCharacterAvatar("Sora Kim")?.id).toBe("sora-kim");
    expect(getCharacterAvatar("Sue")?.id).toBe("sora-kim");
    expect(getCharacterAvatar("Robert")?.id).toBe("robert-smith");
    expect(getCharacterAvatar("Robert Smith")?.id).toBe("robert-smith");
    expect(getCharacterAvatar("John")?.id).toBe("john-wang");
    expect(getCharacterAvatar("John Wang")?.id).toBe("john-wang");
    expect(getCharacterAvatar("Prof. Yamashita")?.id).toBe("prof-yamashita");
    expect(getCharacterAvatar("Professor Yamashita")?.id).toBe("prof-yamashita");
    expect(getCharacterAvatar("Ken")?.id).toBe("ken-suzuki");
    expect(getCharacterAvatar("Ken Suzuki")?.id).toBe("ken-suzuki");
    expect(getCharacterAvatar("Yui")?.id).toBe("yui-yamakawa");
    expect(getCharacterAvatar("Yui Yamakawa")?.id).toBe("yui-yamakawa");
    expect(getCharacterAvatar("Host father")?.id).toBe("host-father");
    expect(getCharacterAvatar("Host mother")?.id).toBe("host-mother");
  });

  it("resolves characters by Japanese name variations", () => {
    expect(getCharacterAvatar(undefined, "メアリー")?.id).toBe("mary-hart");
    expect(getCharacterAvatar(undefined, "たけし")?.id).toBe("takeshi-kimura");
    expect(getCharacterAvatar(undefined, "木村たけし")?.id).toBe("takeshi-kimura");
    expect(getCharacterAvatar(undefined, "ソラ")?.id).toBe("sora-kim");
    expect(getCharacterAvatar(undefined, "スー")?.id).toBe("sora-kim");
    expect(getCharacterAvatar(undefined, "ロバート")?.id).toBe("robert-smith");
    expect(getCharacterAvatar(undefined, "ジョン")?.id).toBe("john-wang");
    expect(getCharacterAvatar(undefined, "山下先生")?.id).toBe("prof-yamashita");
    expect(getCharacterAvatar(undefined, "けん")?.id).toBe("ken-suzuki");
    expect(getCharacterAvatar(undefined, "鈴木")?.id).toBe("ken-suzuki");
    expect(getCharacterAvatar(undefined, "ゆい")?.id).toBe("yui-yamakawa");
    expect(getCharacterAvatar(undefined, "お父さん")?.id).toBe("host-father");
    expect(getCharacterAvatar(undefined, "お母さん")?.id).toBe("host-mother");
  });

  it("resolves when speaker and speakerJa are provided together", () => {
    expect(getCharacterAvatar("Mary", "メアリー")?.id).toBe("mary-hart");
    expect(getCharacterAvatar("Takeshi", "たけし")?.id).toBe("takeshi-kimura");
    expect(getCharacterAvatar("Prof. Yamashita", "山下先生")?.id).toBe("prof-yamashita");
    expect(getCharacterAvatar("Host father", "お父さん")?.id).toBe("host-father");
  });

  it("returns null for unknown / side characters", () => {
    expect(getCharacterAvatar("Doctor", "医者")).toBeNull();
    expect(getCharacterAvatar("Everyone", "みんな")).toBeNull();
    expect(getCharacterAvatar("Hotel front desk", "ホテルの人")).toBeNull();
    expect(getCharacterAvatar("Old woman", "おばあさん")).toBeNull();
    expect(getCharacterAvatar("Vendor", "みせのひと")).toBeNull();
    expect(getCharacterAvatar("Stranger", "しらないひと")).toBeNull();
    expect(getCharacterAvatar(null, null)).toBeNull();
    expect(getCharacterAvatar("", "")).toBeNull();
  });
});
