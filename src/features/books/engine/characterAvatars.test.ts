import { describe, it, expect } from "vitest";
import {
  GENKI_CHARACTER_AVATARS,
  MNN_CHARACTER_CAST,
  MNN_SERVICE_ROLES,
  getAllCharacterAvatars,
  getAllMnnCharacterProfiles,
  getCharacterAvatar,
  getMnnCharacterProfile,
} from "./characterAvatars";

describe("characterAvatars registry", () => {
  it("registers all 53 character avatars across Genki and Minna no Nihongo", () => {
    const all = getAllCharacterAvatars();
    expect(all).toHaveLength(53);

    const expectedGenkiIds = [
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

    for (const id of expectedGenkiIds) {
      const char = GENKI_CHARACTER_AVATARS[id];
      expect(char).toBeDefined();
      expect(char.neutral).toBe(`/images/characters/${id}/neutral.webp`);
      expect(char.talking).toBe(`/images/characters/${id}/talking.webp`);
    }

    const expectedServiceRoles = [
      "bank-clerk",
      "post-office-clerk",
      "real-estate-agent",
      "taxi-driver",
    ];

    for (const id of expectedServiceRoles) {
      const char = MNN_SERVICE_ROLES[id];
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

  it("registers all 18 Minna no Nihongo I characters with offline AivisSpeech speakers and avatar paths", () => {
    const mnnAll = getAllMnnCharacterProfiles();
    expect(mnnAll).toHaveLength(18);

    for (const profile of mnnAll) {
      expect(MNN_CHARACTER_CAST[profile.id]).toBeDefined();
      expect(profile.aivisSpeaker.length).toBeGreaterThan(0);
      expect(profile.aivisStyleId).toBeGreaterThan(0);
      expect(profile.neutral).toMatch(/^\/images\/characters\/[^/]+\/neutral\.webp$/);
      expect(profile.talking).toMatch(/^\/images\/characters\/[^/]+\/talking\.webp$/);
    }

    expect(getMnnCharacterProfile("Miller", "ミラー")?.id).toBe("mike-miller");
    expect(getMnnCharacterProfile("Sato", "佐藤")?.id).toBe("keiko-sato");
    expect(getMnnCharacterProfile("Yamada", "山田")?.id).toBe("ichiro-yamada");
    expect(getMnnCharacterProfile("Tomoko", "山田友子")?.id).toBe("tomoko-yamada");
    expect(getMnnCharacterProfile("Santos", "サントス")?.id).toBe("jose-santos");
    expect(getMnnCharacterProfile("Maria", "マリア")?.id).toBe("maria-santos");
    expect(getMnnCharacterProfile("Karina", "カリナ")?.id).toBe("karina");
    expect(getMnnCharacterProfile("Wang Xue", "ワン")?.id).toBe("wang-xue");
    expect(getMnnCharacterProfile("Matsumoto", "松本")?.id).toBe("tadashi-matsumoto");
    expect(getMnnCharacterProfile("Yoshiko", "松本良子")?.id).toBe("yoshiko-matsumoto");
    expect(getMnnCharacterProfile("Izumi Kimura", "木村いずみ")?.id).toBe("izumi-kimura");
    expect(getMnnCharacterProfile("Watt", "ワット")?.id).toBe("john-watt");
    expect(getMnnCharacterProfile("Schmidt", "シュミット")?.id).toBe("karl-schmidt");
    expect(getMnnCharacterProfile("Lee", "イー")?.id).toBe("lee-jinju");
    expect(getMnnCharacterProfile("Teresa", "テレーザ")?.id).toBe("teresa-santos");
    expect(getMnnCharacterProfile("Taro", "山田太郎")?.id).toBe("taro-yamada");
    expect(getMnnCharacterProfile("Gupta", "グプタ")?.id).toBe("gupta");
    expect(getMnnCharacterProfile("Thawaphon", "タワポン")?.id).toBe("thawaphon");
  });

  it("resolves Minna no Nihongo characters and service roles through getCharacterAvatar", () => {
    // 18 MNN cast
    expect(getCharacterAvatar("Miller", "ミラー")?.id).toBe("mike-miller");
    expect(getCharacterAvatar("Karina", "カリナ")?.id).toBe("karina");
    expect(getCharacterAvatar("Santos", "サントス")?.id).toBe("jose-santos");
    expect(getCharacterAvatar("Maria", "マリア")?.id).toBe("maria-santos");
    expect(getCharacterAvatar("Teresa", "テレーザ")?.id).toBe("teresa-santos");
    expect(getCharacterAvatar("Schmidt", "シュミット")?.id).toBe("karl-schmidt");
    expect(getCharacterAvatar("Watt", "ワット")?.id).toBe("john-watt");
    expect(getCharacterAvatar("Lee", "イー")?.id).toBe("lee-jinju");
    expect(getCharacterAvatar("Gupta", "グプタ")?.id).toBe("gupta");
    expect(getCharacterAvatar("Thawaphon", "タワポン")?.id).toBe("thawaphon");

    // 4 MNN service roles
    expect(getCharacterAvatar("Bank Clerk", "銀行員")?.id).toBe("bank-clerk");
    expect(getCharacterAvatar(undefined, "銀行員")?.id).toBe("bank-clerk");
    expect(getCharacterAvatar("Post Office Clerk", "郵便局員")?.id).toBe("post-office-clerk");
    expect(getCharacterAvatar(undefined, "郵便局の人")?.id).toBe("post-office-clerk");
    expect(getCharacterAvatar("Real Estate Agent", "不動産屋")?.id).toBe("real-estate-agent");
    expect(getCharacterAvatar(undefined, "不動産")?.id).toBe("real-estate-agent");
    expect(getCharacterAvatar("Taxi Driver", "運転手")?.id).toBe("taxi-driver");
    expect(getCharacterAvatar(undefined, "タクシーの運転手")?.id).toBe("taxi-driver");
  });
});
