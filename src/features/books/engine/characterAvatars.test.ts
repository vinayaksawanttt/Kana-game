import { describe, it, expect } from "vitest";
import {
  GENKI_CHARACTER_AVATARS,
  getAllCharacterAvatars,
  getCharacterAvatar,
} from "./characterAvatars";

describe("characterAvatars registry", () => {
  it("registers all 31 Genki characters with both neutral and talking asset paths", () => {
    const all = getAllCharacterAvatars();
    expect(all).toHaveLength(31);

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
      "mana",
      "carlos",
      "naomi",
      "wudi",
      "yasmin",
      "department-manager",
      "doctor",
      "hotel-front-desk-clerk",
      "landlady",
      "old-man",
      "old-woman",
      "passing-stranger",
      "police-officer",
      "restaurant-manager",
      "restaurant-waitress",
      "store-attendant",
      "tanaka",
      "tourist-information-agent",
      "train-station-attendant",
      "everyone",
      "customer",
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
    expect(getCharacterAvatar("Mana")?.id).toBe("mana");
    expect(getCharacterAvatar("Carlos")?.id).toBe("carlos");
    expect(getCharacterAvatar("Naomi")?.id).toBe("naomi");
    expect(getCharacterAvatar("Wudi")?.id).toBe("wudi");
    expect(getCharacterAvatar("Yasmin")?.id).toBe("yasmin");
    expect(getCharacterAvatar("Department manager")?.id).toBe("department-manager");
    expect(getCharacterAvatar("Doctor")?.id).toBe("doctor");
    expect(getCharacterAvatar("Hotel front desk")?.id).toBe("hotel-front-desk-clerk");
    expect(getCharacterAvatar("Landlady")?.id).toBe("landlady");
    expect(getCharacterAvatar("Old man")?.id).toBe("old-man");
    expect(getCharacterAvatar("Old woman")?.id).toBe("old-woman");
    expect(getCharacterAvatar("Stranger")?.id).toBe("passing-stranger");
    expect(getCharacterAvatar("Police")?.id).toBe("police-officer");
    expect(getCharacterAvatar("Manager")?.id).toBe("restaurant-manager");
    expect(getCharacterAvatar("Waitress")?.id).toBe("restaurant-waitress");
    expect(getCharacterAvatar("Restaurant attendant")?.id).toBe("restaurant-waitress");
    expect(getCharacterAvatar("Store attendant")?.id).toBe("store-attendant");
    expect(getCharacterAvatar("Vendor")?.id).toBe("store-attendant");
    expect(getCharacterAvatar("Shop assistant")?.id).toBe("store-attendant");
    expect(getCharacterAvatar("Tanaka")?.id).toBe("tanaka");
    expect(getCharacterAvatar("Information agent")?.id).toBe("tourist-information-agent");
    expect(getCharacterAvatar("Station attendant")?.id).toBe("train-station-attendant");
    expect(getCharacterAvatar("Everyone")?.id).toBe("everyone");
    expect(getCharacterAvatar("Customer")?.id).toBe("customer");
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
    expect(getCharacterAvatar(undefined, "まな")?.id).toBe("mana");
    expect(getCharacterAvatar(undefined, "カルロス")?.id).toBe("carlos");
    expect(getCharacterAvatar(undefined, "なおみ")?.id).toBe("naomi");
    expect(getCharacterAvatar(undefined, "ウディ")?.id).toBe("wudi");
    expect(getCharacterAvatar(undefined, "ヤスミン")?.id).toBe("yasmin");
    expect(getCharacterAvatar(undefined, "部長")?.id).toBe("department-manager");
    expect(getCharacterAvatar(undefined, "医者")?.id).toBe("doctor");
    expect(getCharacterAvatar(undefined, "ホテルの人")?.id).toBe("hotel-front-desk-clerk");
    expect(getCharacterAvatar(undefined, "大家")?.id).toBe("landlady");
    expect(getCharacterAvatar(undefined, "おじいさん")?.id).toBe("old-man");
    expect(getCharacterAvatar(undefined, "おばあさん")?.id).toBe("old-woman");
    expect(getCharacterAvatar(undefined, "知らない人")?.id).toBe("passing-stranger");
    expect(getCharacterAvatar(undefined, "しらないひと")?.id).toBe("passing-stranger");
    expect(getCharacterAvatar(undefined, "警察")?.id).toBe("police-officer");
    expect(getCharacterAvatar(undefined, "店長")?.id).toBe("restaurant-manager");
    expect(getCharacterAvatar(undefined, "店員")?.id).toBe("store-attendant");
    expect(getCharacterAvatar(undefined, "みせのひと")?.id).toBe("store-attendant");
    expect(getCharacterAvatar(undefined, "店の人")?.id).toBe("store-attendant");
    expect(getCharacterAvatar(undefined, "田中")?.id).toBe("tanaka");
    expect(getCharacterAvatar(undefined, "案内所の人")?.id).toBe("tourist-information-agent");
    expect(getCharacterAvatar(undefined, "駅員")?.id).toBe("train-station-attendant");
    expect(getCharacterAvatar(undefined, "みんな")?.id).toBe("everyone");
    expect(getCharacterAvatar(undefined, "客")?.id).toBe("customer");
  });

  it("resolves when speaker and speakerJa are provided together", () => {
    expect(getCharacterAvatar("Mary", "メアリー")?.id).toBe("mary-hart");
    expect(getCharacterAvatar("Takeshi", "たけし")?.id).toBe("takeshi-kimura");
    expect(getCharacterAvatar("Prof. Yamashita", "山下先生")?.id).toBe("prof-yamashita");
    expect(getCharacterAvatar("Host father", "お父さん")?.id).toBe("host-father");
    expect(getCharacterAvatar("Doctor", "医者")?.id).toBe("doctor");
    expect(getCharacterAvatar("Manager", "店長")?.id).toBe("restaurant-manager");
    expect(getCharacterAvatar("Waitress", "店員")?.id).toBe("restaurant-waitress");
    expect(getCharacterAvatar("Vendor", "みせのひと")?.id).toBe("store-attendant");
    expect(getCharacterAvatar("Information agent", "案内所の人")?.id).toBe("tourist-information-agent");
    expect(getCharacterAvatar("Station attendant", "駅員")?.id).toBe("train-station-attendant");
    expect(getCharacterAvatar("Everyone", "みんな")?.id).toBe("everyone");
    expect(getCharacterAvatar("Customer", "客")?.id).toBe("customer");
  });

  it("returns null for unknown / unmapped characters", () => {
    expect(getCharacterAvatar("Narrator", "ナレーション")).toBeNull();
    expect(getCharacterAvatar("Alien", "宇宙人")).toBeNull();
    expect(getCharacterAvatar("Cat", "ねこ")).toBeNull();
    expect(getCharacterAvatar(null, null)).toBeNull();
    expect(getCharacterAvatar("", "")).toBeNull();
  });
});
