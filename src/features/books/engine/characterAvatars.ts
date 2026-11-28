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

export interface MnnCharacterProfile extends CharacterAvatar {
  country: string;
  countryJa: string;
  affiliation: string;
  affiliationJa: string;
  age?: number;
  aivisSpeaker: string;
  aivisModelUuid: string;
  aivisSpeakerUuid: string;
  aivisStyleId: number;
  aivisStyleName: string;
  speedScale: number;
  pitchScale: number;
}

/**
 * All 18 official recurring characters from Minna no Nihongo I (登場人物, pp. x–xi),
 * linked 1-to-1 to our 18 local offline AivisSpeech Engine speakers and avatar assets.
 */
export const MNN_CHARACTER_CAST: Record<string, MnnCharacterProfile> = {
  "mike-miller": {
    id: "mike-miller",
    name: "Mike Miller",
    nameJa: "マイク・ミラー",
    country: "USA",
    countryJa: "アメリカ",
    affiliation: "IMC Employee",
    affiliationJa: "IMCの社員",
    age: 28,
    aivisSpeaker: "fumifumi",
    aivisModelUuid: "71e72188-2726-4739-9aa9-39567396fb2a",
    aivisSpeakerUuid: "754d769b-7128-4172-964e-b10945d55e39",
    aivisStyleId: 606865152,
    aivisStyleName: "ノーマル",
    speedScale: 1.0,
    pitchScale: 0.0,
    neutral: "/images/characters/mike-miller/neutral.webp",
    talking: "/images/characters/mike-miller/talking.webp",
  },
  "keiko-sato": {
    id: "keiko-sato",
    name: "Keiko Sato",
    nameJa: "佐藤けい子",
    country: "Japan",
    countryJa: "日本",
    affiliation: "IMC Employee",
    affiliationJa: "IMCの社員",
    aivisSpeaker: "金苗(かなえ)",
    aivisModelUuid: "1a322ad9-6b7e-4a6d-8d0b-c4cd264538dc",
    aivisSpeakerUuid: "08845b19-25d5-4f7e-b88f-b04acc80320d",
    aivisStyleId: 1238228481,
    aivisStyleName: "ノーマル",
    speedScale: 1.0,
    pitchScale: 0.0,
    neutral: "/images/characters/keiko-sato/neutral.webp",
    talking: "/images/characters/keiko-sato/talking.webp",
  },
  "ichiro-yamada": {
    id: "ichiro-yamada",
    name: "Ichiro Yamada",
    nameJa: "山田一郎",
    country: "Japan",
    countryJa: "日本",
    affiliation: "IMC Employee",
    affiliationJa: "IMCの社員",
    age: 38,
    aivisSpeaker: "銀芽(ぎんが)",
    aivisModelUuid: "052bb693-112b-45be-b498-8e05aa9d6e5e",
    aivisSpeakerUuid: "90b0a81e-8da4-4a42-93b7-71f675722be9",
    aivisStyleId: 38453057,
    aivisStyleName: "通常",
    speedScale: 1.0,
    pitchScale: 0.0,
    neutral: "/images/characters/ichiro-yamada/neutral.webp",
    talking: "/images/characters/ichiro-yamada/talking.webp",
  },
  "tomoko-yamada": {
    id: "tomoko-yamada",
    name: "Tomoko Yamada",
    nameJa: "山田友子",
    country: "Japan",
    countryJa: "日本",
    affiliation: "Bank Employee",
    affiliationJa: "銀行員",
    aivisSpeaker: "F2",
    aivisModelUuid: "25b39db7-5757-47ef-9fe4-2b7aff328a18",
    aivisSpeakerUuid: "a8e3a11e-82ee-4ad9-925d-bdf6c2c2e43c",
    aivisStyleId: 1670137088,
    aivisStyleName: "ノーマル",
    speedScale: 0.98,
    pitchScale: 0.0,
    neutral: "/images/characters/tomoko-yamada/neutral.webp",
    talking: "/images/characters/tomoko-yamada/talking.webp",
  },
  "jose-santos": {
    id: "jose-santos",
    name: "Jose Santos",
    nameJa: "ジョゼ・サントス",
    country: "Brazil",
    countryJa: "ブラジル",
    affiliation: "Brazil Air Employee",
    affiliationJa: "ブラジルエアーの社員",
    age: 39,
    aivisSpeaker: "M1",
    aivisModelUuid: "d7255c2c-ddd0-425a-808c-662cd94c7f41",
    aivisSpeakerUuid: "e824adad-993c-4d2f-8415-0f551ccbe548",
    aivisStyleId: 2051283136,
    aivisStyleName: "ノーマル",
    speedScale: 1.0,
    pitchScale: 0.0,
    neutral: "/images/characters/jose-santos/neutral.webp",
    talking: "/images/characters/jose-santos/talking.webp",
  },
  "maria-santos": {
    id: "maria-santos",
    name: "Maria Santos",
    nameJa: "マリア・サントス",
    country: "Brazil",
    countryJa: "ブラジル",
    affiliation: "Homemaker",
    affiliationJa: "主婦",
    aivisSpeaker: "まお",
    aivisModelUuid: "a59cb814-0083-4369-8542-f51a29e72af7",
    aivisSpeakerUuid: "e756b8e4-b606-4e15-99b1-3f9c6a1b2317",
    aivisStyleId: 888753763,
    aivisStyleName: "おちつき",
    speedScale: 0.97,
    pitchScale: 0.0,
    neutral: "/images/characters/maria-santos/neutral.webp",
    talking: "/images/characters/maria-santos/talking.webp",
  },
  "karina": {
    id: "karina",
    name: "Karina",
    nameJa: "カリナ",
    country: "Indonesia",
    countryJa: "インドネシア",
    affiliation: "Fuji University Student",
    affiliationJa: "富士大学の学生",
    age: 24,
    aivisSpeaker: "まい",
    aivisModelUuid: "e9339137-2ae3-4d41-9394-fb757a7e61e6",
    aivisSpeakerUuid: "41b7785f-35cc-4089-a360-dd8a63da5e75",
    aivisStyleId: 1431611904,
    aivisStyleName: "ノーマル",
    speedScale: 1.0,
    pitchScale: 0.0,
    neutral: "/images/characters/karina/neutral.webp",
    talking: "/images/characters/karina/talking.webp",
  },
  "wang-xue": {
    id: "wang-xue",
    name: "Wang Xue",
    nameJa: "ワン・シュエ",
    country: "China",
    countryJa: "中国",
    affiliation: "Kobe Hospital Doctor",
    affiliationJa: "神戸病院の医者",
    age: 29,
    aivisSpeaker: "yukyu",
    aivisModelUuid: "1f04a608-916c-4d9e-bf6e-b9da5c176f85",
    aivisSpeakerUuid: "0bdd27c6-4b80-4f0f-a8b3-7a603e317f45",
    aivisStyleId: 1099751712,
    aivisStyleName: "デフォルト",
    speedScale: 0.98,
    pitchScale: 0.0,
    neutral: "/images/characters/wang-xue/neutral.webp",
    talking: "/images/characters/wang-xue/talking.webp",
  },
  "tadashi-matsumoto": {
    id: "tadashi-matsumoto",
    name: "Tadashi Matsumoto",
    nameJa: "松本正",
    country: "Japan",
    countryJa: "日本",
    affiliation: "IMC Department Manager",
    affiliationJa: "IMCの部長",
    aivisSpeaker: "阿井田 茂",
    aivisModelUuid: "47e53151-a378-46f3-abee-ce13aa07feb1",
    aivisSpeakerUuid: "561e4e59-3bc9-4726-9028-44a3c12a6f1d",
    aivisStyleId: 1310138976,
    aivisStyleName: "ノーマル",
    speedScale: 0.96,
    pitchScale: 0.0,
    neutral: "/images/characters/tadashi-matsumoto/neutral.webp",
    talking: "/images/characters/tadashi-matsumoto/talking.webp",
  },
  "yoshiko-matsumoto": {
    id: "yoshiko-matsumoto",
    name: "Yoshiko Matsumoto",
    nameJa: "松本良子",
    country: "Japan",
    countryJa: "日本",
    affiliation: "Homemaker",
    affiliationJa: "主婦",
    aivisSpeaker: "まお",
    aivisModelUuid: "a59cb814-0083-4369-8542-f51a29e72af7",
    aivisSpeakerUuid: "e756b8e4-b606-4e15-99b1-3f9c6a1b2317",
    aivisStyleId: 888753763,
    aivisStyleName: "おちつき",
    speedScale: 0.94,
    pitchScale: -0.04,
    neutral: "/images/characters/yoshiko-matsumoto/neutral.webp",
    talking: "/images/characters/yoshiko-matsumoto/talking.webp",
  },
  "izumi-kimura": {
    id: "izumi-kimura",
    name: "Izumi Kimura",
    nameJa: "木村いずみ",
    country: "Japan",
    countryJa: "日本",
    affiliation: "Announcer",
    affiliationJa: "アナウンサー",
    aivisSpeaker: "F1",
    aivisModelUuid: "6acf95e8-11a9-414e-aa9c-6dbebf9113ca",
    aivisSpeakerUuid: "d60b4ea8-dc91-4b9f-99df-2a9fd480db6c",
    aivisStyleId: 1236214272,
    aivisStyleName: "ノーマル",
    speedScale: 1.0,
    pitchScale: 0.0,
    neutral: "/images/characters/izumi-kimura/neutral.webp",
    talking: "/images/characters/izumi-kimura/talking.webp",
  },
  "john-watt": {
    id: "john-watt",
    name: "John Watt",
    nameJa: "ジョン・ワット",
    country: "UK",
    countryJa: "イギリス",
    affiliation: "Sakura University Professor",
    affiliationJa: "さくら大学の先生",
    age: 45,
    aivisSpeaker: "Shinjou Tomoharu",
    aivisModelUuid: "098d4e66-2faf-4a00-889c-a1d2f05bde78",
    aivisSpeakerUuid: "85b2a5f7-ef71-4c4c-846d-71fe8d7b6fa9",
    aivisStyleId: 562825248,
    aivisStyleName: "ノーマル",
    speedScale: 0.97,
    pitchScale: 0.0,
    neutral: "/images/characters/john-watt/neutral.webp",
    talking: "/images/characters/john-watt/talking.webp",
  },
  "karl-schmidt": {
    id: "karl-schmidt",
    name: "Karl Schmidt",
    nameJa: "カール・シュミット",
    country: "Germany",
    countryJa: "ドイツ",
    affiliation: "Power Electric Engineer",
    affiliationJa: "パワー電気のエンジニア",
    age: 52,
    aivisSpeaker: "猩々博士 (雑談ボイス)",
    aivisModelUuid: "70a875a9-feae-41e6-a586-8cf9e47c6c0b",
    aivisSpeakerUuid: "6dd8366d-b928-4d60-ac41-b3010c85c08e",
    aivisStyleId: 5306848,
    aivisStyleName: "ノーマル",
    speedScale: 0.97,
    pitchScale: 0.0,
    neutral: "/images/characters/karl-schmidt/neutral.webp",
    talking: "/images/characters/karl-schmidt/talking.webp",
  },
  "lee-jinju": {
    id: "lee-jinju",
    name: "Lee Jin-ju",
    nameJa: "イー・ジンジュ",
    country: "South Korea",
    countryJa: "韓国",
    affiliation: "AKC Researcher",
    affiliationJa: "AKCの研究者",
    age: 35,
    aivisSpeaker: "morioki",
    aivisModelUuid: "baaae3c0-7b22-4605-8ba5-80c959b41a48",
    aivisSpeakerUuid: "396a746d-742f-4e43-b722-1182a7fab9af",
    aivisStyleId: 497929760,
    aivisStyleName: "ノーマル",
    speedScale: 1.0,
    pitchScale: 0.0,
    neutral: "/images/characters/lee-jinju/neutral.webp",
    talking: "/images/characters/lee-jinju/talking.webp",
  },
  "teresa-santos": {
    id: "teresa-santos",
    name: "Teresa Santos",
    nameJa: "テレーザ・サントス",
    country: "Brazil",
    countryJa: "ブラジル",
    affiliation: "Elementary School Student (9 yrs)",
    affiliationJa: "小学生（9歳）",
    age: 9,
    aivisSpeaker: "まお",
    aivisModelUuid: "a59cb814-0083-4369-8542-f51a29e72af7",
    aivisSpeakerUuid: "e756b8e4-b606-4e15-99b1-3f9c6a1b2317",
    aivisStyleId: 888753762,
    aivisStyleName: "あまあま",
    speedScale: 1.02,
    pitchScale: 0.03,
    neutral: "/images/characters/teresa-santos/neutral.webp",
    talking: "/images/characters/teresa-santos/talking.webp",
  },
  "taro-yamada": {
    id: "taro-yamada",
    name: "Taro Yamada",
    nameJa: "山田太郎",
    country: "Japan",
    countryJa: "日本",
    affiliation: "Elementary School Student (8 yrs)",
    affiliationJa: "小学生（8歳）",
    age: 8,
    aivisSpeaker: "コハク",
    aivisModelUuid: "22e8ed77-94fe-4ef2-871f-a86f94e9a579",
    aivisSpeakerUuid: "5680ac39-43c9-487a-bc3e-018c0d29cc38",
    aivisStyleId: 1878365376,
    aivisStyleName: "ノーマル",
    speedScale: 1.03,
    pitchScale: 0.04,
    neutral: "/images/characters/taro-yamada/neutral.webp",
    talking: "/images/characters/taro-yamada/talking.webp",
  },
  "gupta": {
    id: "gupta",
    name: "Gupta",
    nameJa: "グプタ",
    country: "India",
    countryJa: "インド",
    affiliation: "IMC Employee",
    affiliationJa: "IMCの社員",
    age: 42,
    aivisSpeaker: "M2",
    aivisModelUuid: "d1a7446f-230d-4077-afdf-923eddabe53c",
    aivisSpeakerUuid: "6c831a4b-a90c-4a88-9083-b473c25f69ec",
    aivisStyleId: 1368642336,
    aivisStyleName: "ノーマル",
    speedScale: 0.99,
    pitchScale: 0.0,
    neutral: "/images/characters/gupta/neutral.webp",
    talking: "/images/characters/gupta/talking.webp",
  },
  "thawaphon": {
    id: "thawaphon",
    name: "Thawaphon",
    nameJa: "タワポン",
    country: "Thailand",
    countryJa: "タイ",
    affiliation: "Japanese Language School / Sakura University Student",
    affiliationJa: "日本語学校／さくら大学の学生",
    age: 19,
    aivisSpeaker: "コハク",
    aivisModelUuid: "22e8ed77-94fe-4ef2-871f-a86f94e9a579",
    aivisSpeakerUuid: "5680ac39-43c9-487a-bc3e-018c0d29cc38",
    aivisStyleId: 1878365376,
    aivisStyleName: "ノーマル",
    speedScale: 1.0,
    pitchScale: 0.0,
    neutral: "/images/characters/thawaphon/neutral.webp",
    talking: "/images/characters/thawaphon/talking.webp",
  },
  // Minna no Nihongo II (初級 II, Lessons 26–50) Official Cast Additions (登場人物 pp. x–xi)
  "yasuo-suzuki": {
    id: "yasuo-suzuki",
    name: "Yasuo Suzuki",
    nameJa: "鈴木康男",
    country: "Japan",
    countryJa: "日本",
    affiliation: "IMC Employee",
    affiliationJa: "IMCの社員",
    aivisSpeaker: "澤原 玄二郎",
    aivisModelUuid: "2e1fdde8-d089-42d7-b64f-cf89952b1bdc",
    aivisSpeakerUuid: "accf08c8-0237-485f-98af-20b71cf2121b",
    aivisStyleId: 2029042368,
    aivisStyleName: "ノーマル",
    speedScale: 1.0,
    pitchScale: 0.0,
    neutral: "/images/characters/yasuo-suzuki/neutral.webp",
    talking: "/images/characters/yasuo-suzuki/talking.webp",
  },
  "akiko-nakamura": {
    id: "akiko-nakamura",
    name: "Akiko Nakamura",
    nameJa: "中村秋子",
    country: "Japan",
    countryJa: "日本",
    affiliation: "IMC Sales Section Chief",
    affiliationJa: "IMCの営業課長",
    aivisSpeaker: "F1",
    aivisModelUuid: "6acf95e8-11a9-414e-aa9c-6dbebf9113ca",
    aivisSpeakerUuid: "d60b4ea8-dc91-4b9f-99df-2a9fd480db6c",
    aivisStyleId: 1236214272,
    aivisStyleName: "ノーマル",
    speedScale: 0.98,
    pitchScale: 0.0,
    neutral: "/images/characters/akiko-nakamura/neutral.webp",
    talking: "/images/characters/akiko-nakamura/talking.webp",
  },
  "hiroshi-ogawa": {
    id: "hiroshi-ogawa",
    name: "Hiroshi Ogawa",
    nameJa: "小川博",
    country: "Japan",
    countryJa: "日本",
    affiliation: "Mike Miller's Neighbor",
    affiliationJa: "マイク・ミラーの隣人",
    aivisSpeaker: "M1",
    aivisModelUuid: "d7255c2c-ddd0-425a-808c-662cd94c7f41",
    aivisSpeakerUuid: "e824adad-993c-4d2f-8415-0f551ccbe548",
    aivisStyleId: 2051283136,
    aivisStyleName: "ノーマル",
    speedScale: 0.98,
    pitchScale: 0.0,
    neutral: "/images/characters/hiroshi-ogawa/neutral.webp",
    talking: "/images/characters/hiroshi-ogawa/talking.webp",
  },
  "yone-ogawa": {
    id: "yone-ogawa",
    name: "Yone Ogawa",
    nameJa: "小川よね",
    country: "Japan",
    countryJa: "日本",
    affiliation: "Hiroshi Ogawa's Mother",
    affiliationJa: "小川博の母",
    aivisSpeaker: "まお",
    aivisModelUuid: "a59cb814-0083-4369-8542-f51a29e72af7",
    aivisSpeakerUuid: "e756b8e4-b606-4e15-99b1-3f9c6a1b2317",
    aivisStyleId: 888753763,
    aivisStyleName: "おちつき",
    speedScale: 0.90,
    pitchScale: -0.05,
    neutral: "/images/characters/yone-ogawa/neutral.webp",
    talking: "/images/characters/yone-ogawa/talking.webp",
  },
  "sachiko-ogawa": {
    id: "sachiko-ogawa",
    name: "Sachiko Ogawa",
    nameJa: "小川幸子",
    country: "Japan",
    countryJa: "日本",
    affiliation: "Company Employee",
    affiliationJa: "会社員",
    aivisSpeaker: "F2",
    aivisModelUuid: "25b39db7-5757-47ef-9fe4-2b7aff328a18",
    aivisSpeakerUuid: "a8e3a11e-82ee-4ad9-925d-bdf6c2c2e43c",
    aivisStyleId: 1670137088,
    aivisStyleName: "ノーマル",
    speedScale: 0.98,
    pitchScale: 0.0,
    neutral: "/images/characters/sachiko-ogawa/neutral.webp",
    talking: "/images/characters/sachiko-ogawa/talking.webp",
  },
  "klara-schmidt": {
    id: "klara-schmidt",
    name: "Klara Schmidt",
    nameJa: "クララ・シュミット",
    country: "Germany",
    countryJa: "ドイツ",
    affiliation: "German Language Teacher",
    affiliationJa: "ドイツ語の教師",
    aivisSpeaker: "まお",
    aivisModelUuid: "a59cb814-0083-4369-8542-f51a29e72af7",
    aivisSpeakerUuid: "e756b8e4-b606-4e15-99b1-3f9c6a1b2317",
    aivisStyleId: 888753763,
    aivisStyleName: "おちつき",
    speedScale: 0.97,
    pitchScale: 0.0,
    neutral: "/images/characters/klara-schmidt/neutral.webp",
    talking: "/images/characters/klara-schmidt/talking.webp",
  },
  "chiseko-ito": {
    id: "chiseko-ito",
    name: "Chiseko Ito",
    nameJa: "伊藤ちせ子",
    country: "Japan",
    countryJa: "日本",
    affiliation: "Himawari Elementary School Teacher (Hans Schmidt's Homeroom Teacher)",
    affiliationJa: "ひまわり小学校の教師、ハンス・シュミットの担任",
    aivisSpeaker: "morioki",
    aivisModelUuid: "baaae3c0-7b22-4605-8ba5-80c959b41a48",
    aivisSpeakerUuid: "396a746d-742f-4e43-b722-1182a7fab9af",
    aivisStyleId: 497929760,
    aivisStyleName: "ノーマル",
    speedScale: 0.98,
    pitchScale: 0.0,
    neutral: "/images/characters/chiseko-ito/neutral.webp",
    talking: "/images/characters/chiseko-ito/talking.webp",
  },
  "akemi-watanabe": {
    id: "akemi-watanabe",
    name: "Akemi Watanabe",
    nameJa: "渡辺あけみ",
    country: "Japan",
    countryJa: "日本",
    affiliation: "Power Electric Employee",
    affiliationJa: "パワー電気の社員",
    aivisSpeaker: "金苗(かなえ)",
    aivisModelUuid: "1a322ad9-6b7e-4a6d-8d0b-c4cd264538dc",
    aivisSpeakerUuid: "08845b19-25d5-4f7e-b88f-b04acc80320d",
    aivisStyleId: 1238228481,
    aivisStyleName: "ノーマル",
    speedScale: 1.0,
    pitchScale: 0.0,
    neutral: "/images/characters/akemi-watanabe/neutral.webp",
    talking: "/images/characters/akemi-watanabe/talking.webp",
  },
  "toru-takahashi": {
    id: "toru-takahashi",
    name: "Toru Takahashi",
    nameJa: "高橋透",
    country: "Japan",
    countryJa: "日本",
    affiliation: "Power Electric Employee",
    affiliationJa: "パワー電気の社員",
    aivisSpeaker: "yukyu",
    aivisModelUuid: "1f04a608-916c-4d9e-bf6e-b9da5c176f85",
    aivisSpeakerUuid: "0bdd27c6-4b80-4f0f-a8b3-7a603e317f45",
    aivisStyleId: 1099751712,
    aivisStyleName: "デフォルト",
    speedScale: 1.0,
    pitchScale: 0.0,
    neutral: "/images/characters/toru-takahashi/neutral.webp",
    talking: "/images/characters/toru-takahashi/talking.webp",
  },
  "makiko-hayashi": {
    id: "makiko-hayashi",
    name: "Makiko Hayashi",
    nameJa: "林真紀子",
    country: "Japan",
    countryJa: "日本",
    affiliation: "Power Electric Employee",
    affiliationJa: "パワー電気の社員",
    aivisSpeaker: "まい",
    aivisModelUuid: "e9339137-2ae3-4d41-9394-fb757a7e61e6",
    aivisSpeakerUuid: "41b7785f-35cc-4089-a360-dd8a63da5e75",
    aivisStyleId: 1431611904,
    aivisStyleName: "ノーマル",
    speedScale: 1.0,
    pitchScale: 0.0,
    neutral: "/images/characters/makiko-hayashi/neutral.webp",
    talking: "/images/characters/makiko-hayashi/talking.webp",
  },
  "hans-schmidt": {
    id: "hans-schmidt",
    name: "Hans Schmidt",
    nameJa: "ハンス",
    country: "Germany",
    countryJa: "ドイツ",
    affiliation: "Elementary School Student (12 yrs), Son of Karl & Klara Schmidt",
    affiliationJa: "小学生 12歳、カールとクララ・シュミットの息子",
    age: 12,
    aivisSpeaker: "コハク",
    aivisModelUuid: "22e8ed77-94fe-4ef2-871f-a86f94e9a579",
    aivisSpeakerUuid: "5680ac39-43c9-487a-bc3e-018c0d29cc38",
    aivisStyleId: 1878365376,
    aivisStyleName: "ノーマル",
    speedScale: 1.02,
    pitchScale: 0.02,
    neutral: "/images/characters/hans-schmidt/neutral.webp",
    talking: "/images/characters/hans-schmidt/talking.webp",
  },
  "prof-mori": {
    id: "prof-mori",
    name: "Prof. Mori",
    nameJa: "森",
    country: "Japan",
    countryJa: "日本",
    affiliation: "Professor at Sakura University",
    affiliationJa: "さくら大学 教授",
    aivisSpeaker: "猩々博士",
    aivisModelUuid: "935e3e0b-6a0a-4a57-a52f-8d0a2b367d14",
    aivisSpeakerUuid: "c3605b4f-35f3-4d9d-8f99-0b822a2a8981",
    aivisStyleId: 5306848,
    aivisStyleName: "ノーマル",
    speedScale: 0.98,
    pitchScale: 0.0,
    neutral: "/images/characters/prof-mori/neutral.webp",
    talking: "/images/characters/prof-mori/talking.webp",
  },
  hirota: {
    id: "hirota",
    name: "Hirota",
    nameJa: "広田",
    country: "Japan",
    countryJa: "日本",
    affiliation: "Student at Sakura University",
    affiliationJa: "さくら大学の学生",
    aivisSpeaker: "コハク",
    aivisModelUuid: "22e8ed77-94fe-4ef2-871f-a86f94e9a579",
    aivisSpeakerUuid: "5680ac39-43c9-487a-bc3e-018c0d29cc38",
    aivisStyleId: 1878365376,
    aivisStyleName: "ノーマル",
    speedScale: 1.0,
    pitchScale: 0.0,
    neutral: "/images/characters/hirota/neutral.webp",
    talking: "/images/characters/hirota/talking.webp",
  },
  sano: {
    id: "sano",
    name: "Sano",
    nameJa: "佐野",
    country: "Japan",
    countryJa: "日本",
    affiliation: "Homemaker",
    affiliationJa: "主婦",
    aivisSpeaker: "まお",
    aivisModelUuid: "4b669051-199e-4c72-9754-2b7496d78304",
    aivisSpeakerUuid: "f5129d2c-80e6-4918-b5d4-3708d1f597d4",
    aivisStyleId: 888753763,
    aivisStyleName: "おちつき",
    speedScale: 0.98,
    pitchScale: 0.0,
    neutral: "/images/characters/sano/neutral.webp",
    talking: "/images/characters/sano/talking.webp",
  },
  nomura: {
    id: "nomura",
    name: "Nomura",
    nameJa: "野村",
    country: "Japan",
    countryJa: "日本",
    affiliation: "Homemaker (Miller's Downstairs Neighbor)",
    affiliationJa: "主婦",
    aivisSpeaker: "F2",
    aivisModelUuid: "9088823c-3f20-48aa-95ee-86a0761fc9c1",
    aivisSpeakerUuid: "7e5499a0-6e89-4ea2-a791-9a1760f8f61d",
    aivisStyleId: 1670137088,
    aivisStyleName: "ノーマル",
    speedScale: 1.0,
    pitchScale: 0.0,
    neutral: "/images/characters/nomura/neutral.webp",
    talking: "/images/characters/nomura/talking.webp",
  },
  ikeda: {
    id: "ikeda",
    name: "Ikeda",
    nameJa: "池田",
    country: "Japan",
    countryJa: "日本",
    affiliation: "Brazil Air Employee",
    affiliationJa: "ブラジルエアーの社員",
    aivisSpeaker: "澤原 玄二郎",
    aivisModelUuid: "31d05fa0-a6f6-4120-90b3-5ec71f72b118",
    aivisSpeakerUuid: "6bb49e93-78c2-46c0-a4c6-2c308be9128d",
    aivisStyleId: 2029042368,
    aivisStyleName: "ノーマル",
    speedScale: 1.0,
    pitchScale: 0.0,
    neutral: "/images/characters/ikeda/neutral.webp",
    talking: "/images/characters/ikeda/talking.webp",
  },
  linlin: {
    id: "linlin",
    name: "Linlin",
    nameJa: "リンリン",
    country: "China",
    countryJa: "中国",
    affiliation: "Wang Xue's Niece (6 yrs)",
    affiliationJa: "ワン・シュエの姪",
    age: 6,
    aivisSpeaker: "まい",
    aivisModelUuid: "e9339137-2ae3-4d41-9394-fb757a7e61e6",
    aivisSpeakerUuid: "41b7785f-35cc-4089-a360-dd8a63da5e75",
    aivisStyleId: 1431611904,
    aivisStyleName: "ノーマル",
    speedScale: 1.0,
    pitchScale: 0.02,
    neutral: "/images/characters/linlin/neutral.webp",
    talking: "/images/characters/linlin/talking.webp",
  },
};

export const MNN_SERVICE_ROLES: Record<string, CharacterAvatar> = {
  "supermarket-clerk": {
    id: "supermarket-clerk",
    name: "Supermarket Clerk",
    nameJa: "係員",
    neutral: "/images/characters/supermarket-clerk/neutral.webp",
    talking: "/images/characters/supermarket-clerk/talking.webp",
  },
  "speaker-a": {
    id: "speaker-a",
    name: "Speaker A",
    nameJa: "話者A",
    neutral: "/images/characters/speaker-a/neutral.webp",
    talking: "/images/characters/speaker-a/talking.webp",
  },
  "speaker-b": {
    id: "speaker-b",
    name: "Speaker B",
    nameJa: "話者B",
    neutral: "/images/characters/speaker-b/neutral.webp",
    talking: "/images/characters/speaker-b/talking.webp",
  },
  "bank-clerk": {
    id: "bank-clerk",
    name: "Bank Clerk",
    nameJa: "銀行員",
    neutral: "/images/characters/bank-clerk/neutral.webp",
    talking: "/images/characters/bank-clerk/talking.webp",
  },
  "post-office-clerk": {
    id: "post-office-clerk",
    name: "Post Office Clerk",
    nameJa: "郵便局員",
    neutral: "/images/characters/post-office-clerk/neutral.webp",
    talking: "/images/characters/post-office-clerk/talking.webp",
  },
  "real-estate-agent": {
    id: "real-estate-agent",
    name: "Real Estate Agent",
    nameJa: "不動産屋",
    neutral: "/images/characters/real-estate-agent/neutral.webp",
    talking: "/images/characters/real-estate-agent/talking.webp",
  },
  "taxi-driver": {
    id: "taxi-driver",
    name: "Taxi Driver",
    nameJa: "運転手",
    neutral: "/images/characters/taxi-driver/neutral.webp",
    talking: "/images/characters/taxi-driver/talking.webp",
  },
  "caretaker": {
    id: "caretaker",
    name: "Apartment Caretaker",
    nameJa: "管理人",
    neutral: "/images/characters/caretaker/neutral.webp",
    talking: "/images/characters/caretaker/talking.webp",
  },
  "man": {
    id: "man",
    name: "Passerby Man",
    nameJa: "男の人",
    neutral: "/images/characters/man/neutral.webp",
    talking: "/images/characters/man/talking.webp",
  },
  "woman": {
    id: "woman",
    name: "Passerby Woman",
    nameJa: "女の人",
    neutral: "/images/characters/woman/neutral.webp",
    talking: "/images/characters/woman/talking.webp",
  },
  "receptionist": {
    id: "receptionist",
    name: "Receptionist",
    nameJa: "受付",
    neutral: "/images/characters/receptionist/neutral.webp",
    talking: "/images/characters/receptionist/talking.webp",
  },
  "reporter": {
    id: "reporter",
    name: "Reporter",
    nameJa: "レポーター",
    neutral: "/images/characters/reporter/neutral.webp",
    talking: "/images/characters/reporter/talking.webp",
  },
  "host": {
    id: "host",
    name: "Host / MC",
    nameJa: "司会者",
    neutral: "/images/characters/host/neutral.webp",
    talking: "/images/characters/host/talking.webp",
  },
  "librarian": {
    id: "librarian",
    name: "Librarian",
    nameJa: "図書館の人",
    neutral: "/images/characters/librarian/neutral.webp",
    talking: "/images/characters/librarian/talking.webp",
  },
  "nurse": {
    id: "nurse",
    name: "Nurse",
    nameJa: "看護師",
    neutral: "/images/characters/nurse/neutral.webp",
    talking: "/images/characters/nurse/talking.webp",
  },
  "kobayashi": {
    id: "kobayashi",
    name: "Kobayashi",
    nameJa: "小林",
    neutral: "/images/characters/kobayashi/neutral.webp",
    talking: "/images/characters/kobayashi/talking.webp",
  },
  "nakamura": {
    id: "nakamura",
    name: "Nakamura",
    nameJa: "中村",
    neutral: "/images/characters/nakamura/neutral.webp",
    talking: "/images/characters/nakamura/talking.webp",
  },
  "lopez": {
    id: "lopez",
    name: "Lopez",
    nameJa: "ロペス",
    neutral: "/images/characters/lopez/neutral.webp",
    talking: "/images/characters/lopez/talking.webp",
  },
  "university-staff": {
    id: "university-staff",
    name: "University Staff",
    nameJa: "大学職員",
    neutral: "/images/characters/university-staff/neutral.webp",
    talking: "/images/characters/university-staff/talking.webp",
  },
  "hairdresser": {
    id: "hairdresser",
    name: "Hairdresser",
    nameJa: "美容師",
    neutral: "/images/characters/hairdresser/neutral.webp",
    talking: "/images/characters/hairdresser/talking.webp",
  },
  "tour-guide": {
    id: "tour-guide",
    name: "Tour Guide",
    nameJa: "ガイド",
    neutral: "/images/characters/tour-guide/neutral.webp",
    talking: "/images/characters/tour-guide/talking.webp",
  },
  "university-president": {
    id: "university-president",
    name: "University President",
    nameJa: "学長",
    neutral: "/images/characters/university-president/neutral.webp",
    talking: "/images/characters/university-president/talking.webp",
  },
};

export function getAllMnnCharacterProfiles(): MnnCharacterProfile[] {
  return Object.values(MNN_CHARACTER_CAST);
}

export function getMnnCharacterProfile(
  speaker?: string | null,
  speakerJa?: string | null
): MnnCharacterProfile | null {
  const normEn = (speaker || "").toLowerCase().trim();
  const normJa = (speakerJa || "").trim();

  if (!normEn && !normJa) return null;
  if (normEn && MNN_CHARACTER_CAST[normEn]) return MNN_CHARACTER_CAST[normEn];

  if (normJa.includes("ミラー") || normEn.includes("miller")) return MNN_CHARACTER_CAST["mike-miller"];
  if (normJa.includes("佐藤") || normJa.includes("さとう") || normEn.includes("sato")) return MNN_CHARACTER_CAST["keiko-sato"];
  if (normJa.includes("友子") || normJa.includes("ともこ") || normEn.includes("tomoko")) return MNN_CHARACTER_CAST["tomoko-yamada"];
  if (normJa.includes("太郎") || normJa.includes("たろう") || normEn.includes("taro")) return MNN_CHARACTER_CAST["taro-yamada"];
  if (normJa.includes("山田") || normJa.includes("やまだ") || normEn.includes("yamada")) return MNN_CHARACTER_CAST["ichiro-yamada"];
  if (normJa.includes("テレーザ") || normEn.includes("teresa")) return MNN_CHARACTER_CAST["teresa-santos"];
  if (normJa.includes("マリア") || normEn.includes("maria")) return MNN_CHARACTER_CAST["maria-santos"];
  if (normJa.includes("サントス") || normJa.includes("ジョゼ") || normEn.includes("santos") || normEn.includes("jose")) return MNN_CHARACTER_CAST["jose-santos"];
  if (normJa.includes("カリナ") || normEn.includes("karina")) return MNN_CHARACTER_CAST["karina"];
  if (normJa.includes("ワン・シュエ") || (normJa.includes("ワン") && !normJa.includes("ジョン")) || normEn.includes("wang xue")) return MNN_CHARACTER_CAST["wang-xue"];
  if (normJa.includes("松本良子") || normJa.includes("良子") || normEn.includes("yoshiko")) return MNN_CHARACTER_CAST["yoshiko-matsumoto"];
  if (normJa.includes("松本") || normJa.includes("まつもと") || normEn.includes("matsumoto")) return MNN_CHARACTER_CAST["tadashi-matsumoto"];
  if (normJa.includes("木村いずみ") || normJa.includes("いずみ") || normJa.includes("アナウンサー") || normEn.includes("izumi") || normEn === "announcer") return MNN_CHARACTER_CAST["izumi-kimura"];
  if (normJa.includes("ワット") || normEn.includes("watt")) return MNN_CHARACTER_CAST["john-watt"];
  if (normJa.includes("クララ") || normEn.includes("klara") || normEn.includes("clara")) return MNN_CHARACTER_CAST["klara-schmidt"];
  if (normJa.includes("ハンス") || normEn.includes("hans")) return MNN_CHARACTER_CAST["hans-schmidt"];
  if (normJa.includes("シュミット") || normEn.includes("schmidt")) return MNN_CHARACTER_CAST["karl-schmidt"];
  if (normJa.includes("イー") || normJa.includes("ジンジュ") || normEn.includes("jin-ju") || normEn.includes("jinju") || normEn === "lee" || normEn === "ii") return MNN_CHARACTER_CAST["lee-jinju"];
  if (normJa.includes("グプタ") || normEn.includes("gupta")) return MNN_CHARACTER_CAST["gupta"];
  if (normJa.includes("タワポン") || normEn.includes("thawaphon") || normEn.includes("tawapon")) return MNN_CHARACTER_CAST["thawaphon"];
  if (normJa.includes("鈴木康男") || normJa.includes("康男") || normEn.includes("yasuo") || normJa === "鈴木" || normEn === "suzuki") return MNN_CHARACTER_CAST["yasuo-suzuki"];
  if (normJa.includes("中村秋子") || normJa.includes("秋子") || normEn.includes("akiko") || (normJa.includes("課長") && !normJa.includes("部長"))) return MNN_CHARACTER_CAST["akiko-nakamura"];
  if (normJa.includes("小川よね") || normJa.includes("よね") || normEn.includes("yone")) return MNN_CHARACTER_CAST["yone-ogawa"];
  if (normJa.includes("小川幸子") || normJa.includes("幸子") || normEn.includes("sachiko")) return MNN_CHARACTER_CAST["sachiko-ogawa"];
  if (normJa.includes("小川博") || normJa.includes("小川") || normEn.includes("hiroshi") || normEn.includes("ogawa")) return MNN_CHARACTER_CAST["hiroshi-ogawa"];
  if (normJa.includes("伊藤") || normJa.includes("ちせ子") || normEn.includes("chiseko") || normEn.includes("ito")) return MNN_CHARACTER_CAST["chiseko-ito"];
  if (normJa.includes("渡辺") || normJa.includes("あけみ") || normEn.includes("akemi") || normEn.includes("watanabe")) return MNN_CHARACTER_CAST["akemi-watanabe"];
  if (normJa.includes("高橋") || normJa.includes("透") || normEn.includes("toru") || normEn.includes("takahashi")) return MNN_CHARACTER_CAST["toru-takahashi"];
  if (normJa.includes("林") || normJa.includes("真紀子") || normEn.includes("makiko") || normEn.includes("hayashi")) return MNN_CHARACTER_CAST["makiko-hayashi"];
  if (normJa.includes("森") || normEn.includes("mori")) return MNN_CHARACTER_CAST["prof-mori"];
  if (normJa.includes("広田") || normEn.includes("hirota")) return MNN_CHARACTER_CAST["hirota"];
  if (normJa.includes("佐野") || normEn.includes("sano")) return MNN_CHARACTER_CAST["sano"];
  if (normJa.includes("野村") || normEn.includes("nomura")) return MNN_CHARACTER_CAST["nomura"];
  if (normJa.includes("池田") || normEn.includes("ikeda")) return MNN_CHARACTER_CAST["ikeda"];
  if (normJa.includes("リンリン") || normEn.includes("linlin")) return MNN_CHARACTER_CAST["linlin"];

  return null;
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
  "mana": {
    id: "mana",
    name: "Mana",
    nameJa: "まな",
    neutral: "/images/characters/mana/neutral.webp",
    talking: "/images/characters/mana/talking.webp",
  },
  "carlos": {
    id: "carlos",
    name: "Carlos",
    nameJa: "カルロス",
    neutral: "/images/characters/carlos/neutral.webp",
    talking: "/images/characters/carlos/talking.webp",
  },
  "naomi": {
    id: "naomi",
    name: "Naomi",
    nameJa: "なおみ",
    neutral: "/images/characters/naomi/neutral.webp",
    talking: "/images/characters/naomi/talking.webp",
  },
  "wudi": {
    id: "wudi",
    name: "Wudi",
    nameJa: "ウディ",
    neutral: "/images/characters/wudi/neutral.webp",
    talking: "/images/characters/wudi/talking.webp",
  },
  "yasmin": {
    id: "yasmin",
    name: "Yasmin",
    nameJa: "ヤスミン",
    neutral: "/images/characters/yasmin/neutral.webp",
    talking: "/images/characters/yasmin/talking.webp",
  },
  "department-manager": {
    id: "department-manager",
    name: "Department Manager",
    nameJa: "部長",
    neutral: "/images/characters/department-manager/neutral.webp",
    talking: "/images/characters/department-manager/talking.webp",
  },
  "doctor": {
    id: "doctor",
    name: "Doctor",
    nameJa: "医者",
    neutral: "/images/characters/doctor/neutral.webp",
    talking: "/images/characters/doctor/talking.webp",
  },
  "hotel-front-desk-clerk": {
    id: "hotel-front-desk-clerk",
    name: "Hotel Front Desk Clerk",
    nameJa: "ホテルの人",
    neutral: "/images/characters/hotel-front-desk-clerk/neutral.webp",
    talking: "/images/characters/hotel-front-desk-clerk/talking.webp",
  },
  "landlady": {
    id: "landlady",
    name: "Landlady",
    nameJa: "大家",
    neutral: "/images/characters/landlady/neutral.webp",
    talking: "/images/characters/landlady/talking.webp",
  },
  "old-man": {
    id: "old-man",
    name: "Old Man",
    nameJa: "おじいさん",
    neutral: "/images/characters/old-man/neutral.webp",
    talking: "/images/characters/old-man/talking.webp",
  },
  "old-woman": {
    id: "old-woman",
    name: "Old Woman",
    nameJa: "おばあさん",
    neutral: "/images/characters/old-woman/neutral.webp",
    talking: "/images/characters/old-woman/talking.webp",
  },
  "passing-stranger": {
    id: "passing-stranger",
    name: "Passing Stranger",
    nameJa: "知らない人",
    neutral: "/images/characters/passing-stranger/neutral.webp",
    talking: "/images/characters/passing-stranger/talking.webp",
  },
  "police-officer": {
    id: "police-officer",
    name: "Police Officer",
    nameJa: "警察",
    neutral: "/images/characters/police-officer/neutral.webp",
    talking: "/images/characters/police-officer/talking.webp",
  },
  "restaurant-manager": {
    id: "restaurant-manager",
    name: "Restaurant Manager",
    nameJa: "店長",
    neutral: "/images/characters/restaurant-manager/neutral.webp",
    talking: "/images/characters/restaurant-manager/talking.webp",
  },
  "restaurant-waitress": {
    id: "restaurant-waitress",
    name: "Restaurant Waitress",
    nameJa: "店員",
    neutral: "/images/characters/restaurant-waitress/neutral.webp",
    talking: "/images/characters/restaurant-waitress/talking.webp",
  },
  "store-attendant": {
    id: "store-attendant",
    name: "Store Attendant",
    nameJa: "店の人",
    neutral: "/images/characters/store-attendant/neutral.webp",
    talking: "/images/characters/store-attendant/talking.webp",
  },
  "tanaka": {
    id: "tanaka",
    name: "Tanaka",
    nameJa: "田中",
    neutral: "/images/characters/tanaka/neutral.webp",
    talking: "/images/characters/tanaka/talking.webp",
  },
  "tourist-information-agent": {
    id: "tourist-information-agent",
    name: "Tourist Information Agent",
    nameJa: "案内所の人",
    neutral: "/images/characters/tourist-information-agent/neutral.webp",
    talking: "/images/characters/tourist-information-agent/talking.webp",
  },
  "train-station-attendant": {
    id: "train-station-attendant",
    name: "Train Station Attendant",
    nameJa: "駅員",
    neutral: "/images/characters/train-station-attendant/neutral.webp",
    talking: "/images/characters/train-station-attendant/talking.webp",
  },
  "everyone": {
    id: "everyone",
    name: "Everyone",
    nameJa: "みんな",
    neutral: "/images/characters/everyone/neutral.webp",
    talking: "/images/characters/everyone/talking.webp",
  },
  "customer": {
    id: "customer",
    name: "Customer",
    nameJa: "客",
    neutral: "/images/characters/customer/neutral.webp",
    talking: "/images/characters/customer/talking.webp",
  },
};

/**
 * Returns a list of all registered character avatars.
 */
export function getAllCharacterAvatars(): CharacterAvatar[] {
  return [
    ...Object.values(GENKI_CHARACTER_AVATARS),
    ...Object.values(MNN_CHARACTER_CAST),
    ...Object.values(MNN_SERVICE_ROLES),
  ];
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
  if (normEn && MNN_CHARACTER_CAST[normEn]) {
    return MNN_CHARACTER_CAST[normEn];
  }
  if (normEn && MNN_SERVICE_ROLES[normEn]) {
    return MNN_SERVICE_ROLES[normEn];
  }

  // Minna no Nihongo I cast match (check specific MNN characters before general Genki surname rules)
  const mnnProfile = getMnnCharacterProfile(speaker, speakerJa);
  if (mnnProfile) {
    return mnnProfile;
  }

  // Minna no Nihongo I service roles
  if (
    normJa.includes("銀行員") ||
    normJa.includes("ぎんこういん") ||
    normEn.includes("bank clerk") ||
    normEn.includes("bank teller")
  ) {
    return MNN_SERVICE_ROLES["bank-clerk"];
  }

  if (
    normJa.includes("郵便局員") ||
    normJa.includes("ゆうびんきょくいん") ||
    normJa.includes("郵便局の人") ||
    normEn.includes("post office clerk") ||
    normEn.includes("postal clerk")
  ) {
    return MNN_SERVICE_ROLES["post-office-clerk"];
  }

  if (
    normJa.includes("不動産屋") ||
    normJa.includes("ふどうさんや") ||
    normJa.includes("不動産") ||
    normEn.includes("real estate")
  ) {
    return MNN_SERVICE_ROLES["real-estate-agent"];
  }

  if (
    normJa.includes("運転手") ||
    normJa.includes("うんてんしゅ") ||
    normJa.includes("タクシー") ||
    normEn.includes("taxi driver") ||
    normEn.includes("cab driver") ||
    normEn === "driver"
  ) {
    return MNN_SERVICE_ROLES["taxi-driver"];
  }

  // Supporting Roles: Caretaker, Receptionist, Reporter, Host, Librarian, Nurse, etc.
  if (
    normJa.includes("管理人") ||
    normJa.includes("かんりにん") ||
    normEn.includes("caretaker") ||
    normEn.includes("superintendent")
  ) {
    return MNN_SERVICE_ROLES["caretaker"];
  }

  if (
    normJa.includes("受付") ||
    normJa.includes("うけつけ") ||
    normEn.includes("receptionist") ||
    (normEn.includes("front desk") && !normEn.includes("hotel")) ||
    normEn.includes("clinic reception") ||
    normEn === "reception"
  ) {
    return MNN_SERVICE_ROLES["receptionist"];
  }

  if (
    normJa.includes("レポーター") ||
    normJa.includes("記者") ||
    normEn.includes("reporter") ||
    normEn.includes("interviewer")
  ) {
    return MNN_SERVICE_ROLES["reporter"];
  }

  if (
    normJa.includes("司会") ||
    normJa.includes("しかい") ||
    (normEn.includes("host") && !normEn.includes("father") && !normEn.includes("mother")) ||
    normEn.includes("mc")
  ) {
    return MNN_SERVICE_ROLES["host"];
  }

  if (
    normJa.includes("図書館") ||
    normJa.includes("としょかん") ||
    normEn.includes("librarian")
  ) {
    return MNN_SERVICE_ROLES["librarian"];
  }

  if (
    normJa.includes("看護師") ||
    normJa.includes("かんごし") ||
    normJa.includes("看護婦") ||
    normEn.includes("nurse")
  ) {
    return MNN_SERVICE_ROLES["nurse"];
  }

  if (
    normJa.includes("小林") ||
    normJa.includes("こばやし") ||
    normEn.includes("kobayashi")
  ) {
    return MNN_SERVICE_ROLES["kobayashi"];
  }

  if (
    normJa.includes("中村") ||
    normJa.includes("なかむら") ||
    normEn.includes("nakamura")
  ) {
    return MNN_SERVICE_ROLES["nakamura"];
  }

  if (
    normJa.includes("ロペス") ||
    normEn.includes("lopez")
  ) {
    return MNN_SERVICE_ROLES["lopez"];
  }

  if (
    normJa.includes("大学職員") ||
    normEn.includes("university staff")
  ) {
    return MNN_SERVICE_ROLES["university-staff"];
  }

  if (
    normJa.includes("美容師") ||
    normEn.includes("hairdresser")
  ) {
    return MNN_SERVICE_ROLES["hairdresser"];
  }

  if (
    normJa.includes("ガイド") ||
    normEn === "guide" ||
    normEn.includes("tour guide")
  ) {
    return MNN_SERVICE_ROLES["tour-guide"];
  }

  if (
    normJa.includes("学長") ||
    normEn.includes("university president")
  ) {
    return MNN_SERVICE_ROLES["university-president"];
  }

  if (
    normJa.includes("係員") ||
    normEn.includes("supermarket clerk")
  ) {
    return MNN_SERVICE_ROLES["supermarket-clerk"];
  }

  if (normEn === "staff") {
    return GENKI_CHARACTER_AVATARS["store-attendant"];
  }

  if (
    normJa.includes("男の人") ||
    normJa.includes("おとこのひと") ||
    normEn === "man" ||
    normEn === "a man" ||
    normEn.includes("passerby man")
  ) {
    return MNN_SERVICE_ROLES["man"];
  }

  if (
    normJa.includes("女の人") ||
    normJa.includes("おんなのひと") ||
    normEn === "woman" ||
    normEn === "a woman" ||
    normEn.includes("passerby woman")
  ) {
    return MNN_SERVICE_ROLES["woman"];
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

  // 11. Mana (Mary's host sister)
  if (
    normJa.includes("まな") ||
    normJa.includes("マナ") ||
    (normEn.includes("mana") && !normEn.includes("manager"))
  ) {
    return GENKI_CHARACTER_AVATARS["mana"];
  }

  // 12. Carlos
  if (
    normJa.includes("カルロス") ||
    normEn.includes("carlos")
  ) {
    return GENKI_CHARACTER_AVATARS["carlos"];
  }

  // 13. Naomi
  if (
    normJa.includes("なおみ") ||
    normJa.includes("ナオミ") ||
    normEn.includes("naomi")
  ) {
    return GENKI_CHARACTER_AVATARS["naomi"];
  }

  // 14. Wudi
  if (
    normJa.includes("ウディ") ||
    normJa.includes("うでぃ") ||
    normEn.includes("wudi")
  ) {
    return GENKI_CHARACTER_AVATARS["wudi"];
  }

  // 15. Yasmin
  if (
    normJa.includes("ヤスミン") ||
    normJa.includes("やすみん") ||
    normEn.includes("yasmin")
  ) {
    return GENKI_CHARACTER_AVATARS["yasmin"];
  }

  // 16. Department Manager (check before restaurant manager)
  if (
    normJa.includes("部長") ||
    normJa.includes("ぶちょう") ||
    normEn.includes("department manager") ||
    (normEn.includes("manager") && normEn.includes("department")) ||
    normEn === "boss"
  ) {
    return GENKI_CHARACTER_AVATARS["department-manager"];
  }

  // 17. Restaurant Manager
  if (
    normJa.includes("店長") ||
    normJa.includes("てんちょう") ||
    normEn.includes("restaurant manager") ||
    (normEn.includes("manager") && !normEn.includes("department"))
  ) {
    return GENKI_CHARACTER_AVATARS["restaurant-manager"];
  }

  // 18. Doctor
  if (
    normJa.includes("医者") ||
    normJa.includes("いしゃ") ||
    normJa.includes("医師") ||
    normEn.includes("doctor") ||
    normEn.includes("physician")
  ) {
    return GENKI_CHARACTER_AVATARS["doctor"];
  }

  // 19. Hotel Front Desk Clerk
  if (
    normJa.includes("ホテル") ||
    normEn.includes("hotel")
  ) {
    return GENKI_CHARACTER_AVATARS["hotel-front-desk-clerk"];
  }

  // 20. Landlady
  if (
    normJa.includes("大家") ||
    normJa.includes("おおや") ||
    normEn.includes("landlady") ||
    normEn.includes("landlord")
  ) {
    return GENKI_CHARACTER_AVATARS["landlady"];
  }

  // 21. Old Man
  if (
    normJa.includes("おじいさん") ||
    normJa.includes("おじいちゃん") ||
    normEn.includes("old man") ||
    normEn.includes("elderly man")
  ) {
    return GENKI_CHARACTER_AVATARS["old-man"];
  }

  // 22. Old Woman
  if (
    normJa.includes("おばあさん") ||
    normJa.includes("おばあちゃん") ||
    normEn.includes("old woman") ||
    normEn.includes("elderly woman")
  ) {
    return GENKI_CHARACTER_AVATARS["old-woman"];
  }

  // 23. Passing Stranger
  if (
    normJa.includes("知らない人") ||
    normJa.includes("しらないひと") ||
    normEn.includes("stranger")
  ) {
    return GENKI_CHARACTER_AVATARS["passing-stranger"];
  }

  // 24. Police Officer
  if (
    normJa.includes("警察") ||
    normJa.includes("けいさつ") ||
    normJa.includes("お巡り") ||
    normJa.includes("おまわり") ||
    normEn.includes("police")
  ) {
    return GENKI_CHARACTER_AVATARS["police-officer"];
  }

  // 25. Restaurant Waitress (check waitress / restaurant attendant before general store attendant)
  if (
    normJa.includes("ウェイトレス") ||
    normJa.includes("ウェイター") ||
    normEn.includes("waitress") ||
    normEn.includes("waiter") ||
    (normEn.includes("restaurant") && (normEn.includes("attendant") || normEn.includes("staff")))
  ) {
    return GENKI_CHARACTER_AVATARS["restaurant-waitress"];
  }

  // 26. Store Attendant / Vendor / Shop Assistant
  if (
    normJa.includes("店の人") ||
    normJa.includes("みせのひと") ||
    normJa.includes("店員") ||
    normEn.includes("store attendant") ||
    normEn.includes("shop assistant") ||
    normEn.includes("vendor") ||
    normEn.includes("clerk") ||
    normEn.includes("salesperson")
  ) {
    return GENKI_CHARACTER_AVATARS["store-attendant"];
  }

  // 27. Tanaka
  if (
    normJa.includes("田中") ||
    normJa.includes("たなか") ||
    normEn.includes("tanaka")
  ) {
    return GENKI_CHARACTER_AVATARS["tanaka"];
  }

  // 28. Tourist Information Agent
  if (
    normJa.includes("案内所") ||
    normJa.includes("あんないじょ") ||
    normEn.includes("information agent") ||
    normEn.includes("tourist information") ||
    normEn.includes("travel information")
  ) {
    return GENKI_CHARACTER_AVATARS["tourist-information-agent"];
  }

  // 29. Train Station Attendant
  if (
    normJa.includes("駅員") ||
    normJa.includes("えきいん") ||
    normEn.includes("station attendant") ||
    normEn.includes("train station")
  ) {
    return GENKI_CHARACTER_AVATARS["train-station-attendant"];
  }

  // 30. Everyone / All / Group (e.g. Genki friends barbecue)
  if (
    normJa.includes("みんな") ||
    normJa.includes("全員") ||
    normJa.includes("ぜんいん") ||
    normEn.includes("everyone") ||
    normEn.includes("everybody") ||
    normEn.includes("all")
  ) {
    return GENKI_CHARACTER_AVATARS["everyone"];
  }

  // 31. Customer (Restaurant patron / Diner)
  if (
    normJa.includes("客") ||
    normJa.includes("きゃく") ||
    normEn.includes("customer") ||
    normEn.includes("diner") ||
    normEn.includes("patron") ||
    normEn.includes("guest")
  ) {
    return GENKI_CHARACTER_AVATARS["customer"];
  }

  // 32. Generic Speaker A / B & Practice Roleplay Defaults
  if (
    normEn === "a" ||
    normEn === "speaker a" ||
    normJa === "a" ||
    normJa === "話者a" ||
    normEn === "junior" ||
    normEn === "employee" ||
    normEn === "student" ||
    normJa === "後輩" ||
    normJa === "社員" ||
    normJa === "学生"
  ) {
    return MNN_SERVICE_ROLES["speaker-a"];
  }

  if (
    normEn === "b" ||
    normEn === "speaker b" ||
    normJa === "b" ||
    normJa === "話者b" ||
    normEn === "colleague" ||
    normEn === "friend" ||
    normEn === "senior" ||
    normJa === "同僚" ||
    normJa === "友人" ||
    normJa === "先輩"
  ) {
    return MNN_SERVICE_ROLES["speaker-b"];
  }

  return null;
}
