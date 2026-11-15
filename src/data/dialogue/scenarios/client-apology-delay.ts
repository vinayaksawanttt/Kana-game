import { ScenarioMeta, DialogueNode } from "../types";

export const CLIENT_APOLOGY_SCENARIO_META: ScenarioMeta = {
  id: "client-apology-delay",
  titleJa: "取引先訪問：納期遅延のお詫びと信頼回復",
  titleEn: "Client Visit: Apologizing for a Delivery Delay",
  level: "N2",
  category: "client",
  locationJa: "蒼穹テック株式会社・東京本社",
  locationEn: "Sokyu Tech Corp. · Tokyo Headquarters",
  characterNameJa: "長谷川部長 ＆ 斉藤PL",
  characterNameEn: "Manager Hasegawa & Lead Saito",
  characterRoleEn: "Client Leadership",
  characterAvatar: "💼",
  voiceSpeakerId: 21, // Kenzaki Mesuo (Default primary client executive voice)
  initialNodeId: "client-node-1-lobby",
  descriptionJa:
    "システム改修の納期に二日間の遅延が発生し、取引先の蒼穹テックへ緊急のお詫び訪問をすることになりました。受付での振る舞い、廊下での探りへの対応、会議室での誠実な謝罪と代替案の提示を通じて、失墜しかけた信頼を繋ぎ止めましょう。",
  descriptionEn:
    "A critical two-day delay hit your team's system delivery. Visit Sokyu Tech in person—navigate reception etiquette, avoid hallway blame traps, deliver a structured N2 business apology without excuses, and negotiate a realistic recovery schedule.",
  backgroundTheme: "office",
  defaultBackgroundKey: "client-lobby-rain",
  defaultExpression: "neutral",
  vocabList: [
    { ja: "納期", kana: "のうき", romaji: "nouki", en: "delivery deadline", partOfSpeech: "noun" },
    { ja: "遅延", kana: "ちえん", romaji: "chien", en: "delay", partOfSpeech: "noun / suru-verb" },
    { ja: "お詫び", kana: "おわび", romaji: "owabi", en: "formal apology", partOfSpeech: "noun / suru-verb" },
    { ja: "弁解の余地がない", kana: "べんかいのよちがない", romaji: "benkai no yochi ga nai", en: "there is no room for excuses", partOfSpeech: "expression" },
    { ja: "差し支えなければ", kana: "さしつかえなければ", romaji: "sashitsukae nakereba", en: "if you do not mind / if convenient", partOfSpeech: "expression" },
    { ja: "原因究明", kana: "げんいんきゅうめい", romaji: "gen'in kyuumei", en: "root cause investigation", partOfSpeech: "noun" },
    { ja: "再発防止策", kana: "さいはつぼうしさく", romaji: "saihatsu boushisaku", en: "measures to prevent recurrence", partOfSpeech: "noun" },
    { ja: "暫定対応", kana: "ざんていたいおう", romaji: "zantei taiou", en: "interim workaround / response", partOfSpeech: "noun" },
    { ja: "責任転嫁", kana: "せきにんてんか", romaji: "sekinin tenka", en: "shifting blame onto others", partOfSpeech: "noun" },
    { ja: "誠心誠意", kana: "せいしんせいい", romaji: "seishin seii", en: "in complete good faith / wholeheartedly", partOfSpeech: "adverbial noun" },
    { ja: "管理体制", kana: "かんりたいせい", romaji: "kanri taisei", en: "management / oversight structure", partOfSpeech: "noun" },
    { ja: "見通し", kana: "みとおし", romaji: "mitooshi", en: "forecast / outlook", partOfSpeech: "noun" },
    { ja: "進捗報告", kana: "しんちょくほうこく", romaji: "shinchoku houkoku", en: "progress report", partOfSpeech: "noun" },
    { ja: "挽回する", kana: "ばんかいする", romaji: "bankai suru", en: "to recover lost ground / make up for", partOfSpeech: "verb" },
    { ja: "信用を損ねる", kana: "しんようをそこねる", romaji: "shin'you o sokoneru", en: "to damage trust / credibility", partOfSpeech: "verb phrase" },
    { ja: "信頼回復", kana: "しんらいかいふく", romaji: "shinrai kaifuku", en: "restoration of trust", partOfSpeech: "noun" },
  ],
};

export const CLIENT_APOLOGY_NODES: Record<string, DialogueNode> = {
  // Turn 1: Rainy Reception Lobby — Receptionist Yoshimura
  "client-node-1-lobby": {
    id: "client-node-1-lobby",
    speakerNameJa: "吉村（受付）",
    speakerNameEn: "Yoshimura (Reception)",
    speakerRoleEn: "Corporate Receptionist",
    speakerAvatar: "👩🏻‍💼",
    characterKey: "yoshimura",
    npcTextJa:
      "（雨に濡れた傘を畳み、蒼穹テックの受付へ歩み寄ると、受付の吉村さんが静かに一礼しました。）いらっしゃいませ。株式会社アークスのご担当者様ですね。長谷川と斉藤がお待ちしております。",
    npcReadingHiragana:
      "（あめにぬれたかさをたたみ、そうきゅうテックのうけつけへあゆみよると、うけつけのよしむらさんがしずかにいちれいしました。）いらっしゃいませ。かぶしきがいしゃアークスのごたんとうしゃさまですね。はせがわとさいとうがおまちしております。",
    npcRomaji:
      "(Ame ni nureta kasa o tatami, Soukyuu Tekku no uketsuke e ayumiyoru to, uketsuke no Yoshimura-san ga shizuka ni ichirei shimashita.) Irasshaimase. Kabushiki-gaisha Aakusu no gotantousha-sama desu ne. Hasegawa to Saitou ga omachi shite orimasu.",
    npcTextEn:
      "(Folding your wet umbrella, you approach the Sokyu Tech reception desk. Receptionist Yoshimura gives a quiet bow.) Welcome. You are the representative from Arcs Inc., correct? Manager Hasegawa and Mr. Saito are expecting you.",
    speakerVoiceId: 2,
    expression: "neutral",
    backgroundKey: "client-lobby-rain",
    choices: [
      {
        id: "ca1-respectful-greeting",
        textJa:
          "お忙しいところ急なお時間をお取りいただき恐縮です。アークスの佐藤と申します。本日は長谷川部長と斉藤様にお詫びとご説明に伺いました。",
        readingHiragana:
          "お忙しいところきゅうなおじかんをおとりいただききょうしゅくです。アークスのさとうともうします。ほんじつははせがわぶちょうとさいとうさまにおわびとごせつめいにうかがいました。",
        romaji:
          "Oisogashii tokoro kyuu na ojikan o otori itadaki kyoushuku desu. Aakusu no Satou to moushimasu. Honjitsu wa Hasegawa-buchou to Saitou-sama ni owabi to gosetsumei ni ukagaimashita.",
        textEn:
          "I sincerely appreciate you granting us urgent time out of your busy schedule. I am Sato from Arcs. I have come today to apologize and explain matters to Manager Hasegawa and Mr. Saito.",
        tier: "respectful",
        points: 100,
        feedbackJa:
          "非常に模範的な挨拶です。謙譲語「伺う」「申す」とクッション言葉「恐縮です」を自然に使えています。",
        feedbackEn:
          "[Social Distance: Exemplary Keigo] Flawless formal etiquette honoring social hierarchy and professional boundaries. This is a very exemplary greeting. It makes natural use of the humble forms “o-kikau” and “o-musubu,” as well as the cushion phrase “oshibe desu.”",
        nextNodeId: "client-node-2a-hallway-probe",
      },
      {
        id: "ca1-polite-standard",
        textJa:
          "お世話になっております、アークスの佐藤です。本日はお時間をいただきありがとうございます。長谷川部長にお取り次ぎいただけますか。",
        readingHiragana:
          "おせわになっております、アークスのさとうです。ほんじつはおじかんをいただきありがとうございます。はせがわぶちょうにおとりつぎいただけますか。",
        romaji:
          "Osewa ni natte orimasu, Aakusu no Satou desu. Honjitsu wa ojikan o itadaki arigatou gozaimasu. Hasegawa-buchou ni otoritsugi itadakemasu ka.",
        textEn:
          "Thank you for your continued partnership. I am Sato from Arcs. Thank you for seeing us today—could you please announce me to Manager Hasegawa?",
        tier: "polite",
        points: 75,
        feedbackJa:
          "丁寧で問題ありません。「お取り次ぎ」も適切ですが、急な謝罪訪問なのでもう少し恐縮の意を添えると完璧でした。",
        feedbackEn:
          "[Social Distance: Natural Rapport] Maintains ideal social distance with friendly politeness, putting the other person at ease. It’s polite and perfectly fine. “I’ll put you through” is also appropriate, but since this is a sudden apology visit, adding a bit more humility would have made it perfect.",
        nextNodeId: "client-node-2a-hallway-probe",
      },
      {
        id: "ca1-awkward-leak",
        textJa:
          "すみません、システム納品が遅れちゃって謝りに来ました！長谷川さん、もう機嫌悪いですか？",
        readingHiragana:
          "すみません、システムのうひんがおくれちゃってあやまりにきました！はせがわさん、もうきげんわるいですか？",
        romaji:
          "Sumimasen, shisutemu nouhin ga okurechatte ayamari ni kimashita! Hasegawa-san, mou kigen warui desu ka?",
        textEn:
          "Sorry, our delivery got delayed so I ran over to apologize! Is Mr. Hasegawa already in a bad mood?",
        tier: "awkward",
        points: 30,
        feedbackJa:
          "他社の来客もいる受付ロビーでトラブルの詳細や取引先の機嫌を口にするのはNGです。",
        feedbackEn:
          "[Social Distance: Pragmatic Mismatch] The phrasing or timing breaches expected conversational etiquette; adjusting your register keeps the interaction smooth. It is not acceptable to discuss the details of a problem or the mood of a business partner in the reception lobby, where visitors from other companies are also present.",
        nextNodeId: "client-node-2b-lobby-caution",
      },
      {
        id: "ca1-rude-deflect",
        textJa:
          "うちの下請けがミスした件で呼ばれた佐藤です。長谷川さんにも早く会って終わらせたいんですが。",
        readingHiragana:
          "うちのしたうけがミスしたけんでよばれたさとうです。はせがわさんにもはやくあっておわらせたいんですが。",
        romaji:
          "Uchi no shitauke ga misu shita ken de yobareta Satou desu. Hasegawa-san ni mo hayaku atte owarasetai n desu ga.",
        textEn:
          "I'm Sato, called in because our subcontractor messed up. Could we see Hasegawa quickly and get this over with?",
        tier: "rude",
        points: -50,
        feedbackJa:
          "受付から下請けへの責任転嫁と高圧的な態度は致命的です。第一印象で信頼を大きく損ねました。",
        feedbackEn:
          "[Social Distance: Blunt Imperative] Using blunt commands or aggressive phrasing severely breaches social boundaries and alarms your listener; courteous inquiries are essential. Shifting responsibility to subcontractors and adopting a high-handed attitude are fatal mistakes. This has severely damaged trust right from the first impression.",
        nextNodeId: "client-node-2c-lobby-freeze",
      },
    ],
  },

  // Turn 2A: Corridor — Client Project Lead Saito tries a hallway probe
  "client-node-2a-hallway-probe": {
    id: "client-node-2a-hallway-probe",
    speakerNameJa: "斉藤（プロジェクトリーダー）",
    speakerNameEn: "Saito (Project Lead)",
    speakerRoleEn: "Client Project Lead",
    speakerAvatar: "🧑‍💻",
    characterKey: "saito",
    npcTextJa:
      "（案内された廊下で、顔見知りの斉藤リーダーが会議室の前で声を潜めて話しかけてきました。）佐藤さん、お疲れ様です。実は部長、かなりご立腹でして……率直に言って、御社の新しい担当者が設定を壊したというのは本当ですか？",
    npcReadingHiragana:
      "（あんないされたろうかで、かおみしりのさいとうリーダーがかいぎしつのまえでこえをひそめてはなしかけてきました。）さとうさん、おつかれさまです。じつはぶちょう、かなりごりっぷくでして……そっちょくにいって、おんしゃのあたらしいたんとうしゃがせっていをこわしたというのはほんとうですか？",
    npcRomaji:
      "(Annai sareta rouka de, kaomishiri no Saitou riidaa ga kaigishitsu no mae de koe o hisomete hanashikakete kimashita.) Satou-san, otsukaresama desu. Jitsu wa buchou, kanari gorippuku de shite... socchoku ni itte, onsha no atarashii tantousha ga settei o kowashita to iu no wa hontou desu ka?",
    npcTextEn:
      "(Walking down the corridor, Project Lead Saito—whom you know fairly well—lowers his voice outside the boardroom.) Sato-san, thank you for coming. Honestly, Manager Hasegawa is furious... between us, is it true your new junior engineer broke the config?",
    speakerVoiceId: 12,
    expression: "worried",
    backgroundKey: "client-hallway-walk",
    choices: [
      {
        id: "ca2a-respectful-ownership",
        textJa:
          "お気遣いありがとうございます。ただ、個人のせいではなく、弊社の二重チェック体制の甘さが招いた結果でございます。詳細は部長と斉藤様のお揃いの場で、責任を持ってご説明いたします。",
        readingHiragana:
          "おきづかいありがとうございます。ただ、こじんのせいではなく、へいしゃのにじゅうチェックたいせいのあまさがまねいたけっかでございます。しょうさいはぶちょうとさいとうさまのおそろいのばで、せきにんをもってごせつめいいたします。",
        romaji:
          "Okizukai arigatou gozaimasu. Tada, kojin no sei de wa naku, heisha no nijuu chekku taisei no amasa ga maneita kekka de gozaimasu. Shousai wa buchou to Saitou-sama no osoroi no ba de, sekinin o motte gosetsumei itashimasu.",
        textEn:
          "I appreciate your concern, Saito-san. However, this is not an individual's fault—it resulted from weakness in our company's double-check oversight. I will explain everything responsibly in front of both you and Manager Hasegawa.",
        tier: "respectful",
        points: 100,
        feedbackJa:
          "見事な対応です。非公式な場での責任転嫁を避け、組織としての管理責任と説明の一貫性を守りました。",
        feedbackEn:
          "[Social Distance: Exemplary Keigo] Flawless formal etiquette honoring social hierarchy and professional boundaries. That was a masterful response. They avoided shifting blame in an informal setting and upheld the organization’s managerial responsibility and consistency in its explanations.",
        nextNodeId: "client-node-3a-boardroom-fair",
      },
      {
        id: "ca2a-awkward-partial-blame",
        textJa:
          "あー、実は昨日入った若手が本番環境に触ってしまいまして……私からもきつく叱っておきました。",
        readingHiragana:
          "あー、じつはきのうはいったわかてがほんばんかんきょうにさわってしまいまして……わたしからもきつくしかっておきました。",
        romaji:
          "Aa, jitsu wa kinou haitta wakate ga honban kankyou ni sawatte shimaimashite... watashi kara mo kitsuku shikatte okimashita.",
        textEn:
          "Ah, actually a junior who joined just recently touched production... I already scolded them harshly for it.",
        tier: "awkward",
        points: 35,
        feedbackJa:
          "取引先の前で部下や若手を責める発言は、逆に「管理できていない会社」という不信感を与えてしまいます。",
        feedbackEn:
          "[Social Distance: Pragmatic Mismatch] The phrasing or timing breaches expected conversational etiquette; adjusting your register keeps the interaction smooth. Making remarks that criticize subordinates or junior staff in front of business partners will, in fact, create a sense of distrust, giving the impression that the company is “unmanaged.”",
        nextNodeId: "client-node-3b-boardroom-tense",
      },
      {
        id: "ca2a-casual-downplay",
        textJa:
          "いえいえ、大したことないですよ！設定ひとつ直すだけですから、すぐ終わりますって。",
        readingHiragana:
          "いえいえ、たいしたことないですよ！せっていひとつなおすだけですから、すぐおわりますって。",
        romaji:
          "Ieie, taishita koto nai desu yo! Settei hitotsu naosu dake desu kara, sugu owarimasu tte.",
        textEn:
          "No, no, it's really no big deal! It's just one config fix, so it'll be over in a flash.",
        tier: "casual",
        points: 20,
        feedbackJa:
          "相手が深刻視している場面で「大したことない」と軽く扱うのは、状況認識の甘さとして警戒されます。",
        feedbackEn:
          "[Social Distance: Casual Slang] Using informal speech or casual slang breaches interpersonal distance and creates awkwardness; polite forms (desu/masu) maintain comfortable initial boundaries. If you downplay a situation by saying “It’s no big deal” when the other person is taking it seriously, it will be viewed as a lack of situational awareness and cause them to be wary of you.",
        nextNodeId: "client-node-3b-boardroom-tense",
      },
    ],
  },

  // Turn 2B: Recovery after public lobby slip
  "client-node-2b-lobby-caution": {
    id: "client-node-2b-lobby-caution",
    speakerNameJa: "吉村（受付）",
    speakerNameEn: "Yoshimura (Reception)",
    speakerRoleEn: "Corporate Receptionist",
    speakerAvatar: "👩🏻‍💼",
    characterKey: "yoshimura",
    npcTextJa:
      "（吉村さんは周囲の来客に聞こえないよう、少し声を落として会議室前まで案内します。）……佐藤様、他社のお客様もいらっしゃいますので、詳しいご事情は奥の応接室でお話しいただけますと幸いです。斉藤がお出迎えいたします。",
    npcReadingHiragana:
      "（よしむらさんはしゅういのらいきゃくにきこえないよう、すこしこえをおとしてかいぎしつまえまであんないします。）……さとうさま、たしゃのおきゃくさまもいらっしゃいますので、くわしいごじじょうはおくのおうせつしつでおはなしいただけますとさいわいです。さいとうがおでむかえいたします。",
    npcRomaji:
      "(Yoshimura-san wa shuui no raikyaku ni kikoenai you, sukoshi koe o otoshite kaigishitsu-mae made annai shimasu.) ...Satou-sama, tasha no okyakusama mo irasshaimasu node, kuwashii gojijou wa oku no ousetsushitsu de ohanashi itadakemasu to saiwai desu. Saitou ga odemukae itashimasu.",
    npcTextEn:
      "(Lowering her voice so other visitors cannot hear, Yoshimura escorts you toward the inner corridor.) ...Sato-san, as guests from other companies are present, we would appreciate it if you shared the details inside the private meeting room. Mr. Saito will receive you.",
    speakerVoiceId: 2,
    expression: "troubled",
    backgroundKey: "client-hallway-walk",
    choices: [
      {
        id: "ca2b-respectful-recover",
        textJa:
          "配慮に欠け、大変失礼いたしました。ご指摘ありがとうございます。気持ちを切り替え、誠実にお詫び申し上げます。",
        readingHiragana:
          "はいりょにかけ、たいへんしつれいいいたしました。ごしてきありがとうございます。きもちをきりかえ、せいじつにおわびもうしあげます。",
        romaji:
          "Hairyo ni kake, taihen shitsurei itashimashita. Goshiteki arigatou gozaimasu. Kimochi o kirikae, seijitsu ni owabi moushiagemasu.",
        textEn:
          "How inconsiderate of me—I sincerely apologize and thank you for the reminder. I will compose myself and apologize properly inside.",
        tier: "respectful",
        points: 95,
        feedbackJa:
          "指摘を素直に受け入れてすぐ姿勢を正せました。受付の吉村さんの表情も和らぎました。",
        feedbackEn:
          "[Social Distance: Exemplary Keigo] Flawless formal etiquette honoring social hierarchy and professional boundaries. I readily accepted the feedback and corrected my behavior right away. Ms. Yoshimura at the front desk’s expression softened as well.",
        nextNodeId: "client-node-3a-boardroom-fair",
      },
      {
        id: "ca2b-awkward-flustered",
        textJa:
          "あ、すみません。つい焦ってしまって……ではそのまま長谷川部長の所へお願いします。",
        readingHiragana:
          "あ、すみません。ついあせってしまって……ではそのままはせがわぶちょうのところへおねがいします。",
        romaji:
          "A, sumimasen. Tsui asette shimatte... de wa sono mama Hasegawa-buchou no tokoro e onegai shimasu.",
        textEn:
          "Oh, sorry. I just got flustered... please go ahead and take me straight to Manager Hasegawa.",
        tier: "awkward",
        points: 35,
        feedbackJa:
          "悪気はないものの、落ち着きを欠いた印象のまま会議室に入ることになります。",
        feedbackEn:
          "[Social Distance: Pragmatic Mismatch] The phrasing or timing breaches expected conversational etiquette; adjusting your register keeps the interaction smooth. Although you mean no harm, you’ll end up entering the conference room still giving the impression of being flustered.",
        nextNodeId: "client-node-3b-boardroom-tense",
      },
    ],
  },

  // Turn 2C: Recovery after lobby freeze
  "client-node-2c-lobby-freeze": {
    id: "client-node-2c-lobby-freeze",
    speakerNameJa: "斉藤（プロジェクトリーダー）",
    speakerNameEn: "Saito (Project Lead)",
    speakerRoleEn: "Client Project Lead",
    speakerAvatar: "🧑‍💻",
    characterKey: "saito",
    npcTextJa:
      "（異変を聞きつけて斉藤リーダーが受付まで降りてきました。表情は硬く凍りついています。）……佐藤さん、受付で「早く終わらせたい」とはどういうおつもりですか。こちらは金曜日のリリースが懸かっているんですよ。",
    npcReadingHiragana:
      "（いへんをききつけてさいとうリーダーがうけつけまでおりてきました。ひょうじょうはかたくこおりついています。）……さとうさん、うけつけで「はやくおわらせたい」とはどういうおつもりですか。こちらはきんようびのリリースがかかっているんですよ。",
    npcRomaji:
      "(Ihen o kikitsukete Saitou riidaa ga uketsuke made orite kimashita. Hyoujou wa kataku kooritsuite imasu.) ...Satou-san, uketsuke de 'hayaku owarasetai' to wa dou iu otsumori desu ka. Kochira wa kinyoubi no ririisu ga kakatte iru n desu yo.",
    npcTextEn:
      "(Alerted to the commotion, Project Lead Saito comes down to the lobby, expression frozen.) ...Sato-san, what exactly do you mean by wanting to 'get this over with'? Our Friday release is on the line here.",
    speakerVoiceId: 12,
    expression: "stern",
    backgroundKey: "client-lobby-rain",
    choices: [
      {
        id: "ca2c-respectful-retract",
        textJa:
          "ただいまの私の軽率な発言、誠に申し訳ございませんでした。下請けへの責任転嫁など言語道断であり、全て弊社の管理責任でございます。どうかお詫びの機会をいただけますでしょうか。",
        readingHiragana:
          "ただいまのわたしのけいそつなはつげん、まことにもうしわけございませんでした。したうけへのせきにんてんかなどごんごどうだんであり、すべてへいしゃのかんりせきにんでございます。どうかおわびのきかいをいただけますでしょうか。",
        romaji:
          "Tadaima no watashi no keisotsu na hatsugen, makoto ni moushiwake gozaimasen deshita. Shitauke e no sekinin tenka nado gongodoudan de ari, subete heisha no kanri sekinin de gozaimasu. Douka owabi no kikai o itadakemasu deshou ka.",
        textEn:
          "My thoughtless words a moment ago were inexcusable. Shifting blame onto a partner was completely unacceptable—the fault lies entirely in our management. Please grant me the chance to apologize properly.",
        tier: "respectful",
        points: 90,
        feedbackJa:
          "「言語道断」まで踏み込んで明確に発言を撤回したことで、なんとか会議室への面談を繋ぎ止めました。",
        feedbackEn:
          "[Social Distance: Exemplary Keigo] Flawless formal etiquette honoring social hierarchy and professional boundaries. By going so far as to explicitly retract my statement—describing it as “utterly outrageous”—I managed to keep the meeting in the conference room from falling through.",
        nextNodeId: "client-node-3b-boardroom-tense",
      },
      {
        id: "ca2c-rude-double-down",
        textJa:
          "実際の原因が先方にあるのは事実ですし、長々と謝っても仕方ないじゃないですか。",
        readingHiragana:
          "じっさいのげんいんがせんぽうにあるのはじじつですし、ながながとあやまってもしかたないじゃないですか。",
        romaji:
          "Jissai no gen'in ga senpou ni aru no wa jijitsu desu shi, naganaga to ayamatte mo shikatanai ja nai desu ka.",
        textEn:
          "It's a fact that the actual error came from their side—spending forever apologizing doesn't fix anything.",
        tier: "rude",
        points: -50,
        feedbackJa:
          "取引先の前で反省の色を全く見せず、その場で面談打ち切りとなりました。",
        feedbackEn:
          "[Social Distance: Blunt Imperative] Using blunt commands or aggressive phrasing severely breaches social boundaries and alarms your listener; courteous inquiries are essential. He showed absolutely no sign of remorse in front of the client, and the meeting was cut short on the spot.",
        nextNodeId: "client-node-end-failure",
      },
    ],
  },

  // Turn 3A: Executive Boardroom — Fair opening apology to Manager Hasegawa
  "client-node-3a-boardroom-fair": {
    id: "client-node-3a-boardroom-fair",
    speakerNameJa: "長谷川部長",
    speakerNameEn: "Manager Hasegawa",
    speakerRoleEn: "Client Dept. Manager",
    speakerAvatar: "💼",
    characterKey: "hasegawa",
    npcTextJa:
      "（重厚な応接室の扉が開き、長谷川部長が腕を組んで厳しい眼差しを向けます。）……佐藤さん、金曜日の公開まであと三日しかない中で二日の遅れというのは、弊社の検証日程を根底から覆す事態です。どういう経緯なのか、納得できるよう話してもらえますか。",
    npcReadingHiragana:
      "（じゅうこうなおうせつしつのとびらがあき、はせがわぶちょうがうでをくんでびしいまなざしをむけます。）……さとうさん、きんようびのこうかいまであとみっかしかないなかでふつかのおくれというのは、へいしゃのけんしょうにっていをこんていからくつがえすじたいです。どういうけいいなのか、なっとくできるようはなしてもらえますか。",
    npcRomaji:
      "(Juukou na ousetsushitsu no tobira ga aki, Hasegawa-buchou ga ude o kunde kibishii manazashi o mukemasu.) ...Satou-san, kinyoubi no koukai made ato mikka shika nai naka de futsuka no okure to iu no wa, heisha no kenshou nittei o kontei kara kutsugaesu jitai desu. Dou iu keii na no ka, nattoku dekiru you hanashite moraemasu ka.",
    npcTextEn:
      "(Inside the executive boardroom, Manager Hasegawa folds his arms with a severe gaze.) ...Sato-san, a two-day slip with only three days left before Friday's launch upends our entire QA schedule. Can you give me an explanation that makes sense?",
    speakerVoiceId: 21,
    expression: "stern",
    backgroundKey: "executive-meeting-room",
    choices: [
      {
        id: "ca3a-respectful-apology-plan",
        textJa:
          "多大なるご迷惑をおかけし、弁解の余地もございません。心よりお詫び申し上げます。差し支えなければ、まず発生原因と現在の暫定対応案についてご説明させていただけますでしょうか。",
        readingHiragana:
          "ただいなるごめいわくをおかけし、べんかいのよちもございません。こころよりおわびもうしあげます。さしつかえなければ、まずはっせいげんいんとげんざいのざんていたいおうあんについてごせつめいさせていただけますでしょうか。",
        romaji:
          "Tadai naru gomeiwaku o okake shi, benkai no yochi mo gozaimasen. Kokoro yori owabi moushiagemasu. Sashitsukae nakereba, mazu hassei gen'in to genzai no zantei taiouan ni tsuite gosetsumei sasete itadakemasu deshou ka.",
        textEn:
          "We have caused immense inconvenience, and there is no room for excuses. Please accept our deepest apologies. If I may, could I first explain the root cause and our current interim mitigation plan?",
        tier: "respectful",
        points: 100,
        feedbackJa:
          "完璧なN2謝罪フレーズです。言い訳せず非を認めた上で、原因と暫定対応へ簡潔に切り替えた点が評価されます。",
        feedbackEn:
          "[Social Distance: Exemplary Keigo] Flawless formal etiquette honoring social hierarchy and professional boundaries. This is a perfect N2-level apology phrase. It is highly regarded for acknowledging the mistake without making excuses and then concisely moving on to the cause and a provisional solution.",
        nextNodeId: "client-node-4a-mitigation-talk",
      },
      {
        id: "ca3a-polite-rushed",
        textJa:
          "本当に申し訳ございません！今、開発チーム総出で修正しておりますので、金曜日の夕方までには何とか間に合わせるつもりです。",
        readingHiragana:
          "ほんとうにもうしわけございません！いま、かいはつチームそうででしゅうせいしておりますので、きんようびのゆうがたまでにはなんとかまにあわせるつもりです。",
        romaji:
          "Hontou ni moushiwake gozaimasen! Ima, kaihatsu chiimu soude de shuusei shite orimasu node, kinyoubi no yuugata made ni wa nantoka maniawaseru tsumori desu.",
        textEn:
          "We are truly sorry! Our whole dev team is fixing it right now, so we intend to somehow get it done by Friday evening.",
        tier: "polite",
        points: 70,
        feedbackJa:
          "誠意は伝わりますが、「何とか」「つもり」では顧客側の検証計画が立たず、斉藤リーダーからツッコミが入ります。",
        feedbackEn:
          "[Social Distance: Natural Rapport] Maintains ideal social distance with friendly politeness, putting the other person at ease. Although your sincerity comes across, using phrases like “something like” and “I intend to” makes it impossible for the client to formulate a verification plan, prompting Leader Saito to call you out on it.",
        nextNodeId: "client-node-4b-deadline-squeeze",
      },
      {
        id: "ca3a-awkward-vague",
        textJa:
          "今回は非常に複雑な技術的要因と想定外の仕様変更が重なりまして……もう少しご猶予をいただけないでしょうか。",
        readingHiragana:
          "こんかいはひじょうにふくざつなぎじゅつてきよういんとそうていがいのしようへんこうがかさなりまして……もうすこしごゆうよをいただけないでしょうか。",
        romaji:
          "Konkai wa hijou ni fukuzatsu na gijutsuteki youin to souteigai no shiyou henkou ga kasanarimashite... mou sukoshi goyuuyo o itadakenai deshou ka.",
        textEn:
          "This time, highly complex technical factors coincided with unexpected spec adjustments... could we possibly be granted a bit more leeway?",
        tier: "awkward",
        points: 30,
        feedbackJa:
          "謝罪より先に「想定外の仕様変更」を持ち出すと、客側に責任を擦り付けているように響きます。",
        feedbackEn:
          "[Social Distance: Pragmatic Mismatch] The phrasing or timing breaches expected conversational etiquette; adjusting your register keeps the interaction smooth. If you bring up “unexpected specification changes” before apologizing, it sounds like you’re shifting the blame onto the customer.",
        nextNodeId: "client-node-4b-deadline-squeeze",
      },
    ],
  },

  // Turn 3B: Boardroom enters tense due to earlier missteps
  "client-node-3b-boardroom-tense": {
    id: "client-node-3b-boardroom-tense",
    speakerNameJa: "長谷川部長",
    speakerNameEn: "Manager Hasegawa",
    speakerRoleEn: "Client Dept. Manager",
    speakerAvatar: "💼",
    characterKey: "hasegawa",
    npcTextJa:
      "（長谷川部長は机上の契約書に目を落とし、冷ややかな声で切り出します。）斉藤からも聞きましたが、御社内の連絡体制すら怪しいとなれば、金曜の納品も到底信用できません。立て直す具体策はあるのですか。",
    npcReadingHiragana:
      "（はせがわぶちょうはきじょうのけいやくしょにめをおとし、ひややかなこえできりだします。）さいとうからもききましたが、おんしゃないのれんらくたいせいすらあやしいとなれば、きんようののうひんもとうていしんようできません。たてなおすぐたいさくはあるのですか。",
    npcRomaji:
      "(Hasegawa-buchou wa kijou no keiyakusho ni me o otoshi, hiyayaka na koe de kiridashimasu.) Saitou kara mo kikimashita ga, onshanai no renraku taisei sura ayashii to nareba, kinyou no nouhin mo toutei shin'you dekimasen. Tatenaosu gutaisaku wa aru no desu ka.",
    npcTextEn:
      "(Manager Hasegawa looks down at the contract on the table and speaks coldly.) I heard from Saito too—if even your internal coordination is shaky, we cannot possibly trust Friday's delivery. Do you have concrete measures to fix this?",
    speakerVoiceId: 21,
    expression: "annoyed",
    backgroundKey: "executive-meeting-room",
    choices: [
      {
        id: "ca3b-respectful-reset",
        textJa:
          "ご不信を招き誠に申し訳ございません。仰る通り弊社の管理体制に抜かりがございました。私自身が全テスト工程を直接統括し、二重の検証体制へ本日より切り替えました。",
        readingHiragana:
          "ごふしんをまねきまことにもうしわけございません。おっしゃるとおりへいしゃのかんりたいせいにぬかりがございました。わたしじしんがぜんテストこうていをちょくせつとうかつし、にじゅうのけんしょうたいせいへほんじつよりきりかえました。",
        romaji:
          "Gofushin o maneki makoto ni moushiwake gozaimasen. Ossharu toori heisha no kanri taisei ni nukari ga gozaimashita. Watashi jishin ga zen tesuto koutei o chokusetsu toukatsu shi, nijuu no kenshou taisei e honjitsu yori kirikaemashita.",
        textEn:
          "I deeply apologize for causing distrust. As you say, our oversight had serious gaps. Starting today, I have taken direct command of all testing and switched us to a dual-verification workflow.",
        tier: "respectful",
        points: 100,
        feedbackJa:
          "全面的に非を認めたうえで「自分が直接統括する」と具体策を示し、部長を議論のテーブルに引き戻せました。",
        feedbackEn:
          "[Social Distance: Exemplary Keigo] Flawless formal etiquette honoring social hierarchy and professional boundaries. After fully admitting fault, I proposed a concrete solution—stating that “I will oversee this directly”—and was able to bring the department head back to the negotiating table.",
        nextNodeId: "client-node-4a-mitigation-talk",
      },
      {
        id: "ca3b-awkward-empty-bow",
        textJa:
          "とにかく誠心誠意お詫びするしかございません。この通りですので、どうか今回だけはお許しください。",
        readingHiragana:
          "とにかくせいしんせいいおわびするしかございません。このとおりですので、どうかこんかいだけはおゆるしください。",
        romaji:
          "Tonikaku seishin seii owabi suru shika gozaimasen. Kono toori desu node, douka konkai dake wa oyurushi kudasai.",
        textEn:
          "All we can do is apologize wholeheartedly. Please, just this once, forgive us.",
        tier: "awkward",
        points: 35,
        feedbackJa:
          "具体策のない土下座的な謝罪は、ビジネス交渉では「責任放棄」と受け取られかねません。",
        feedbackEn:
          "[Social Distance: Pragmatic Mismatch] The phrasing or timing breaches expected conversational etiquette; adjusting your register keeps the interaction smooth. An apology that amounts to a deep bow without offering concrete solutions may be interpreted as “shirking responsibility” in business negotiations.",
        nextNodeId: "client-node-4c-crisis-ultimatum",
      },
      {
        id: "ca3b-rude-counterargue",
        textJa:
          "急な要件追加もあったので、こちらばかり責められても正直困ります。",
        readingHiragana:
          "きゅうなようけんついかもあったので、こちらばかりせめられてもしょうじきこまります。",
        romaji:
          "Kyuu na youken tsuika mo atta node, kochira bakari semerarete mo shoujiki komarimasu.",
        textEn:
          "There were sudden requirement additions too, so honestly it's unfair to put all the blame on us.",
        tier: "rude",
        points: -50,
        feedbackJa:
          "謝罪の席で取引先に反論してしまい、長谷川部長の怒りが決定的なものになりました。",
        feedbackEn:
          "[Social Distance: Blunt Imperative] Using blunt commands or aggressive phrasing severely breaches social boundaries and alarms your listener; courteous inquiries are essential. I ended up arguing with a business partner during the apology meeting, which made Department Manager Hasegawa’s anger irreparable.",
        nextNodeId: "client-node-end-failure",
      },
    ],
  },

  // Turn 4A: Technical contingency verification with Saito PL
  "client-node-4a-mitigation-talk": {
    id: "client-node-4a-mitigation-talk",
    speakerNameJa: "斉藤（プロジェクトリーダー）",
    speakerNameEn: "Saito (Project Lead)",
    speakerRoleEn: "Client Project Lead",
    speakerAvatar: "🧑‍💻",
    characterKey: "saito",
    npcTextJa:
      "（長谷川部長がわずかに頷くのを見て、斉藤リーダーが工程表を開きました。）……佐藤さん、木曜午前までに主要機能の先行引き渡しを受けられれば、我々も一部検証を前倒しできます。ただ、木曜夜に新たな不具合が出た場合、金曜の公開はどう守りますか？",
    npcReadingHiragana:
      "（はせがわぶちょうがわずかにうなずくのをみて、さいとうリーダーがこうていひょうをひらきました。）……さとうさん、もくようごぜんまでにしゅようきのうのせんこうひきわたしをうけられれば、われわれもいちぶけんしょうをまえだおしできます。ただ、もくようよるにあらたなふぐあいがでたばあい、きんようのこうかいはどうまもりますか？",
    npcRomaji:
      "(Hasegawa-buchou ga wazuka ni unazuku no o mite, Saitou riidaa ga kouteihyou o hirakimashita.) ...Satou-san, mokuyou gozen made ni shuyou kinou no senkou hikiwatashi o ukerarereba, wareware mo ichibu kenshou o maedaoshi dekimasu. Tada, mokuyou yoru ni arata na fuguai ga deta baai, kinyou no koukai wa dou mamorimasu ka?",
    npcTextEn:
      "(Seeing Manager Hasegawa give a slight nod, Saito opens the schedule sheet.) ...Sato-san, if we receive core modules by Thursday morning, our QA can start early. But what happens to Friday's launch if a new bug appears Thursday night?",
    speakerVoiceId: 12,
    expression: "thinking",
    backgroundKey: "executive-meeting-room",
    choices: [
      {
        id: "ca4a-respectful-rollback",
        textJa:
          "その点も想定しております。木曜夜の結合試験で支障が出た場合は即座に旧安定版へ切り戻せる手順を用意し、本日は勿論、金曜まで毎晩十九時に進捗報告書をご提出いたします。",
        readingHiragana:
          "そのてんもそうていしております。もくようよるのけつごうしけんでししょうがでたばあいはそくざにきゅうあんていばんへきりもどせるてじゅんをよういし、ほんじつはもちろん、きんようまでまいばんじゅうくじにしんちょくほうこくしょをごていしゅついたします。",
        romaji:
          "Sono ten mo soutei shite orimasu. Mokuyou yoru no ketsugou shiken de shishou ga deta baai wa sokuza ni kyuu anteiban e kirimodoseru tejun o youi shi, honjitsu wa mochiron, kinyou made maiban juukuji ni shinchoku houkokusho o goteishutsu itashimasu.",
        textEn:
          "We have planned for that contingency. If Thursday night's integration test hits an issue, we have an immediate rollback path to the prior stable build, and we will submit progress reports at 19:00 every evening through Friday.",
        tier: "respectful",
        points: 100,
        feedbackJa:
          "切り戻し計画と定時報告の確約により、技術的・業務的リスクの両方をしっかり抑えられました。",
        feedbackEn:
          "[Social Distance: Exemplary Keigo] Flawless formal etiquette honoring social hierarchy and professional boundaries. By implementing a rollback plan and ensuring regular reporting, we were able to effectively mitigate both technical and operational risks.",
        nextNodeId: "client-node-5a-elevator-final",
      },
      {
        id: "ca4a-polite-allnighter",
        textJa:
          "ご心配には及びません。万が一の時は弊社メンバー総出で徹夜対応し、必ず金曜朝までに直し切ります。",
        readingHiragana:
          "ごしんぱいにはおよびません。まんがいちのときはへいしゃメンバーそうででてつやたいおうし、かならずきんようあさまでになおしきります。",
        romaji:
          "Goshinpai ni wa oyobimasen. Mangaichi no toki wa heisha menbaa soude de tetsuya taiou shi, kanarazu kinyou asa made ni naoshikirimasu.",
        textEn:
          "Please do not worry. In a worst-case scenario our whole team will pull an all-nighter and guarantee it is fixed by Friday morning.",
        tier: "polite",
        points: 70,
        feedbackJa:
          "意気込みは買われますが、精神論や徹夜頼みはプロとしてやや不安を残します。",
        feedbackEn:
          "[Social Distance: Natural Rapport] Maintains ideal social distance with friendly politeness, putting the other person at ease. While I appreciate the enthusiasm, relying on motivational talk and all-nighters leaves me with some reservations as a professional.",
        nextNodeId: "client-node-5b-skeptical-terms",
      },
      {
        id: "ca4a-awkward-uncertain",
        textJa:
          "えっと、今回のテストは今のところ問題なさそうな見通しですので、たぶん大丈夫かと……。",
        readingHiragana:
          "えっと、こんかいのテストはいまのところもんだいなさそうなみとおしですので、たぶんだいじょうぶかと……。",
        romaji:
          "Etto, konkai no tesuto wa ima no tokoro mondai nasasou na mitooshi desu node, tabun daijoubu ka to...",
        textEn:
          "Um, tests look fine so far in our outlook, so it'll probably be okay...",
        tier: "awkward",
        points: 25,
        feedbackJa:
          "「たぶん大丈夫」は危機対応の場で最も避けたい表現です。顧客の警戒感が再び強まりました。",
        feedbackEn:
          "[Social Distance: Pragmatic Mismatch] The phrasing or timing breaches expected conversational etiquette; adjusting your register keeps the interaction smooth. “It’ll probably be okay” is the phrase you most want to avoid in crisis situations. The customer’s wariness has intensified once again.",
        nextNodeId: "client-node-5b-skeptical-terms",
      },
    ],
  },

  // Turn 4B: Deadline squeeze when prior answer was vague
  "client-node-4b-deadline-squeeze": {
    id: "client-node-4b-deadline-squeeze",
    speakerNameJa: "斉藤（プロジェクトリーダー）",
    speakerNameEn: "Saito (Project Lead)",
    speakerRoleEn: "Client Project Lead",
    speakerAvatar: "🧑‍💻",
    characterKey: "saito",
    npcTextJa:
      "（斉藤リーダーが眉をひそめます。）……佐藤さん、「何とかする」「ご配慮を」といった曖昧な言葉では、社内の経営会議に報告が上げられません。具体的な区切りを今この場で示していただけますか。",
    npcReadingHiragana:
      "（さいとうリーダーがまゆをひそめます。）……さとうさん、「なんとかする」「ごはいりょを」といったあいまいなことばでは、しゃないのけいえいかいぎにほうこくがあげられません。ぐたいてきなくぎりをいまこのばでしめしていただけますか。",
    npcRomaji:
      "(Saitou riidaa ga mayu o hisomemasu.) ...Satou-san, 'nantoka suru' ya 'gohairyo o' to itta aimai na kotoba de wa, shanai no keiei kaigi ni houkoku ga ageraremasen. Gutaiteki na kugiri o ima kono ba de shimeshite itadakemasu ka.",
    npcTextEn:
      "(Saito frowns.) ...Sato-san, vague assurances like 'somehow' or 'asking for consideration' won't fly when I report to our executive committee. Can you give us concrete cutoff milestones right now?",
    speakerVoiceId: 12,
    expression: "troubled",
    backgroundKey: "executive-meeting-room",
    choices: [
      {
        id: "ca4b-respectful-milestones",
        textJa:
          "曖昧な表現となり大変失礼いたしました。明日の十五時までに決済関連を先行納品し、残りの画面修正は金曜午前十時を最終期限として、毎晩進捗をご報告いたします。",
        readingHiragana:
          "あいまいなひょうげんとなりたいへんしつれいいいたしました。あすのじゅうごじまでにけっさいかんれんをせんこうのうひんし、のこりのがめんしゅうせいはきんようごぜんじゅうじをさいしゅうきげんとして、まいばんしんちょくをごほうこくいたします。",
        romaji:
          "Aimai na hyougen to nari taihen shitsurei itashimashita. Asu no juugoji made ni kessai kanren o senkou nouhin shi, nokori no gamen shuusei wa kinyou gozen juuji o saishuu kigen to shite, maiban shinchoku o gohoukoku itashimasu.",
        textEn:
          "I apologize for speaking vaguely. We will deliver payment modules early by 15:00 tomorrow, set 10:00 AM Friday as the hard cutoff for remaining UI fixes, and report progress nightly.",
        tier: "respectful",
        points: 100,
        feedbackJa:
          "具体的な時刻と分割納品を即座に約束できたことで、長谷川部長の厳しい表情もわずかに緩みました。",
        feedbackEn:
          "[Social Distance: Exemplary Keigo] Flawless formal etiquette honoring social hierarchy and professional boundaries. Because we were able to immediately commit to a specific deadline and phased delivery, Director Hasegawa’s stern expression softened slightly.",
        nextNodeId: "client-node-5a-elevator-final",
      },
      {
        id: "ca4b-polite-extension-ask",
        textJa:
          "もし可能であれば、来週の月曜朝まで公開日をずらしていただくことは検討いただけないでしょうか。",
        readingHiragana:
          "もしかのうであれば、らいしゅうのげつようあさまでこうかいびをずらしていただくことはけんとういただけないでしょうか。",
        romaji:
          "Moshi kanou de areba, raishuu no getsuyou asa made koukaibi o zurashite itadaku koto wa kentou itadakenai deshou ka.",
        textEn:
          "If at all possible, could you consider shifting the public launch to Monday morning instead?",
        tier: "polite",
        points: 65,
        feedbackJa:
          "現実的な交渉ではありますが、広報予定のある顧客に対していきなり延期を頼むのはかなり苦しい立場になります。",
        feedbackEn:
          "[Social Distance: Natural Rapport] Maintains ideal social distance with friendly politeness, putting the other person at ease. Although this is a realistic negotiation scenario, asking a client who has already scheduled a press event to postpone it out of the blue puts you in a rather difficult position.",
        nextNodeId: "client-node-5b-skeptical-terms",
      },
      {
        id: "ca4b-casual-bravado",
        textJa:
          "そこはプロにお任せください！気合いで金曜に間に合わせますから。",
        readingHiragana:
          "そこはプロにおまかせください！きあいできんようにまにあわせますから。",
        romaji:
          "Soko wa puro ni omakase kudasai! Kiai de kinyou ni maniawasemasu kara.",
        textEn:
          "Leave it to the pros! We'll push through on sheer grit by Friday.",
        tier: "casual",
        points: 15,
        feedbackJa:
          "「気合い」などの根性論は、危機にある取引先をさらに怒らせる結果になります。",
        feedbackEn:
          "[Social Distance: Casual Slang] Using informal speech or casual slang breaches interpersonal distance and creates awkwardness; polite forms (desu/masu) maintain comfortable initial boundaries. A \"grit\" mentality—such as emphasizing \"ki-ai\"—will only further anger a business partner who is already in a crisis.",
        nextNodeId: "client-node-4c-crisis-ultimatum",
      },
    ],
  },

  // Turn 4C: Ultimatum branch when trust nearly breaks
  "client-node-4c-crisis-ultimatum": {
    id: "client-node-4c-crisis-ultimatum",
    speakerNameJa: "長谷川部長",
    speakerNameEn: "Manager Hasegawa",
    speakerRoleEn: "Client Dept. Manager",
    speakerAvatar: "💼",
    characterKey: "hasegawa",
    npcTextJa:
      "（長谷川部長が書類を閉じ、立ち上がりかけます。）……佐藤さん、誠意でも気合いでもなく、我々が求めているのは業務への保証です。この場でお話にならないのであれば、来期以降の契約更新も見直さざるを得ません。",
    npcReadingHiragana:
      "（はせがわぶちょうがしょるいをとじ、たちあがりかけます。）……さとうさん、せいいでもきあいでもなく、われわれがもとめているのはぎょうむへのほしょうです。このばでおはなしにならないのであれば、らいきいこうのけいやくこうしんもみなおさざるをえません。",
    npcRomaji:
      "(Hasegawa-buchou ga shorui o toji, tachiagari kakemasu.) ...Satou-san, seii de mo kiai de mo naku, wareware ga motomete iru no wa gyoumu e no hoshou desu. Kono ba de ohanashi ni naranai no de areba, raiki ikou no keiyaku koushin mo minaosa zaru o emasen.",
    npcTextEn:
      "(Manager Hasegawa closes his folder and starts to rise.) ...Sato-san, we don't want sentiment or grit—we need operational guarantees. If we can't have a serious conversation here, we will be forced to reconsider renewing next term's contract.",
    speakerVoiceId: 21,
    expression: "scolding",
    backgroundKey: "executive-meeting-room",
    choices: [
      {
        id: "ca4c-respectful-written-pledge",
        textJa:
          "厳しいお言葉を重く受け止めております。本日中に正式な原因報告書と再発防止策を文書にて提出し、今後のご判断を真摯に仰ぎたく存じます。まずは今週の挽回に全力を尽くします。",
        readingHiragana:
          "きびしいおことばをおもくうけとめております。ほんじつちゅうにせいしきなげんいんほうこくしょとさいはつぼうしさくをぶんしょにてていしゅつし、こんごのごはんだんをしんしにあおぎたくぞんじます。まずはこんしゅうのばんかいにぜんりょくをつくします。",
        romaji:
          "Kibishii okotoba o omoku uketomete orimasu. Honjitsu-chuu ni seishiki na gen'in houkokusho to saihatsu boushisaku o bunsho nite teishutsu shi, kongo no gohandan o shinshi ni aogitaku zonjimasu. Mazu wa konshuu no bankai ni zenryoku o tsukushimasu.",
        textEn:
          "We take your stern warning to heart. Today we will submit a formal written root-cause report and prevention plan and humbly await your judgment—starting with giving everything to recover this week.",
        tier: "respectful",
        points: 95,
        feedbackJa:
          "最後の一線で文書提出と現実的な挽回姿勢を示し、即座の契約破棄だけは免れました。",
        feedbackEn:
          "[Social Distance: Exemplary Keigo] Flawless formal etiquette honoring social hierarchy and professional boundaries. At the very last moment, we submitted the documents and demonstrated a genuine willingness to make amends, thereby narrowly avoiding immediate termination of the contract.",
        nextNodeId: "client-node-5b-skeptical-terms",
      },
      {
        id: "ca4c-rude-walkout",
        textJa:
          "そこまで仰るのでしたら、これ以上お話ししても平行線ですね。一度社に持ち帰ります。",
        readingHiragana:
          "そこまでおっしゃるのでしたら、これいじょうおはなししてもへいこうせんですね。いちどしゃにもちかえります。",
        romaji:
          "Soko made ossharu no deshitara, kore ijou ohanashi shite mo heikousen desu ne. Ichido sha ni mochikaerimasu.",
        textEn:
          "If that's how you feel, talking further is pointless. I'll take this back to my office.",
        tier: "rude",
        points: -50,
        feedbackJa:
          "お詫び訪問の場で自ら席を立ってしまい、取引関係は完全に破綻しました。",
        feedbackEn:
          "[Social Distance: Blunt Imperative] Using blunt commands or aggressive phrasing severely breaches social boundaries and alarms your listener; courteous inquiries are essential. I stood up on my own during an apology visit, and as a result, our business relationship broke down completely.",
        nextNodeId: "client-node-end-failure",
      },
    ],
  },

  // Turn 5A: Elevator Hall — Hasegawa tests closing accountability
  "client-node-5a-elevator-final": {
    id: "client-node-5a-elevator-final",
    speakerNameJa: "長谷川部長",
    speakerNameEn: "Manager Hasegawa",
    speakerRoleEn: "Client Dept. Manager",
    speakerAvatar: "💼",
    characterKey: "hasegawa",
    npcTextJa:
      "（会議を終え、長谷川部長と斉藤リーダーがエレベーターホールまで見送りに来てくれました。部長は扉の前で足を止め、静かに言います。）……言葉ではなく、行動で信用を取り戻してください。今夜十九時の第一報、待っていますよ。",
    npcReadingHiragana:
      "（かいぎをおえ、はせがわぶちょうとさいとうリーダーがエレベーターホールまでみおくりにきてくれました。ぶちょうはとびらのまえであしをとめ、しずかにいいます。）……ことばではなく、こうどうでしんようをとりもどしてください。こんやじゅうくじのだいいっぽう、まっていますよ。",
    npcRomaji:
      "(Kaigi o oe, Hasegawa-buchou to Saitou riidaa ga erebeetaa hooru made miokuri ni kite kuremashita. Buchou wa tobira no mae de ashi o tome, shizuka ni iimasu.) ...Kotoba de wa naku, koudou de shin'you o torimodoshite kudasai. Konya juukuji no daiippou, matte imasu yo.",
    npcTextEn:
      "(After the meeting, Manager Hasegawa and Saito walk you to the elevator hall. Hasegawa stops before the doors and speaks evenly.) ...Earn back our trust through actions, not words. We'll be waiting for tonight's 19:00 report.",
    speakerVoiceId: 21,
    expression: "neutral",
    backgroundKey: "client-elevator-farewell",
    choices: [
      {
        id: "ca5a-respectful-closing",
        textJa:
          "承知いたしました。必ず十九時までに第一報をお送りし、一歩ずつ信頼回復に努めてまいります。本日はお忙しい中、貴重なお時間をいただき誠にありがとうございました。",
        readingHiragana:
          "しょうちいたしました。かならずじゅうくじまでにだいいっぽうをおおくりし、いっぽずつしんらいかいふくにつとめてまいります。ほんじつはおいそがしいなか、きちょうなおじかんをいただきまことにありがとうございました。",
        romaji:
          "Shouchi itashimashita. Kanarazu juukuji made ni daiippou o ookuri shi, ippo zutsu shinrai kaifuku ni tsutomete mairimasu. Honjitsu wa oisogashii naka, kichou na ojikan o itadaki makoto ni arigatou gozaimasu.",
        textEn:
          "Understood. We will send the first report strictly by 19:00 and work step by step to rebuild your trust. Thank you very much for granting us your valuable time today.",
        tier: "respectful",
        points: 100,
        feedbackJa:
          "最後まで緊張感を保った完璧な締めくくりです。エレベーターの扉が閉まるまで深いお辞儀を崩しませんでした。",
        feedbackEn:
          "[Social Distance: Exemplary Keigo] Flawless formal etiquette honoring social hierarchy and professional boundaries. It was a perfect conclusion that maintained the tension right until the very end. He didn’t break his deep bow until the elevator doors closed.",
        nextNodeId: "client-node-end-perfect",
      },
      {
        id: "ca5a-polite-closing",
        textJa:
          "はい、分かりました。社に戻り次第すぐにメールいたします。今日はありがとうございました。",
        readingHiragana:
          "はい、わかりました。しゃにもどりしだいすぐにメールいたします。きょうはありがとうございました。",
        romaji:
          "Hai, wakarimashita. Sha ni modori shidai sugu ni meeru itashimasu. Kyou wa arigatou gozaimasu.",
        textEn:
          "Yes, understood. I will email as soon as I get back to the office. Thank you for today.",
        tier: "polite",
        points: 75,
        feedbackJa:
          "礼儀正しく終えられました。「承知いたしました」を使えればさらに引き締まった印象になったはずです。",
        feedbackEn:
          "[Social Distance: Natural Rapport] Maintains ideal social distance with friendly politeness, putting the other person at ease. You concluded the conversation politely. If you had used “I understand,” it would have made an even more polished impression.",
        nextNodeId: "client-node-end-success",
      },
      {
        id: "ca5a-awkward-relieved",
        textJa:
          "ふう、ご理解いただけて本当にホッとしました！では失礼します！",
        readingHiragana:
          "ふう、ごりかいいただけてほんとうにホッとしました！ではしつれいします！",
        romaji:
          "Fuu, gorikai itadakete hontou ni hotto shimashita! De wa shitsurei shimasu!",
        textEn:
          "Phew, I'm so relieved you understood! Well then, excuse me!",
        tier: "awkward",
        points: 30,
        feedbackJa:
          "見送りの場で「ホッとした」と気を緩めた態度を見せると、相手の警戒心がぶり返してしまいます。",
        feedbackEn:
          "[Social Distance: Pragmatic Mismatch] The phrasing or timing breaches expected conversational etiquette; adjusting your register keeps the interaction smooth. If you show a relaxed attitude—such as saying “I’m relieved”—while seeing someone off, it will cause the other person’s guard to go back up.",
        nextNodeId: "client-node-end-awkward",
      },
    ],
  },

  // Turn 5B: Elevator Hall with Saito only — Guarded follow-up
  "client-node-5b-skeptical-terms": {
    id: "client-node-5b-skeptical-terms",
    speakerNameJa: "斉藤（プロジェクトリーダー）",
    speakerNameEn: "Saito (Project Lead)",
    speakerRoleEn: "Client Project Lead",
    speakerAvatar: "🧑‍💻",
    characterKey: "saito",
    npcTextJa:
      "（長谷川部長は会議室に残り、斉藤リーダーだけがエレベーター前まで送ってくれました。）……佐藤さん、正直部長はまだ半信半疑です。この後、社に戻られてからどのようなフォローをいただけますか？",
    npcReadingHiragana:
      "（はせがわぶちょうはかいぎしつにのこり、さいとうリーダーだけがエレベーターまえまでおくってくれました。）……さとうさん、しょうじきぶちょうはまだはんしんはんぎです。このあと、しゃにもどられてからどのようなフォローをいただけますか？",
    npcRomaji:
      "(Hasegawa-buchou wa kaigishitsu ni nokori, Saitou riidaa dake ga erebeetaa-mae made okutte kuremashita.) ...Satou-san, shoujiki buchou wa mada hanshinhangi desu. Kono ato, sha ni modorarete kara dono you na foroo o itadakemasu ka?",
    npcTextEn:
      "(Manager Hasegawa remains in the meeting room; Saito alone walks you to the elevator.) ...Honestly, Sato-san, the Manager is still half-skeptical. What kind of follow-up can you send once you get back to your office?",
    speakerVoiceId: 12,
    expression: "worried",
    backgroundKey: "client-elevator-farewell",
    choices: [
      {
        id: "ca5b-respectful-followup",
        textJa:
          "率直に教えていただきありがとうございます。本日十七時までに正式なお詫び状と検証チェックリストを長谷川部長宛にお送りし、明日から定時連絡を欠かさず行います。",
        readingHiragana:
          "そっちょくにおしえていただきありがとうございます。ほんじつじゅうしちじまでにせいしきなおわびじょうとけんしょうチェックリストをはせがわぶちょうあてにおおくりし、あしたからていじれんらくをかかさずおこないます。",
        romaji:
          "Socchoku ni oshiete itadaki arigatou gozaimasu. Honjitsu juushichiji made ni seishiki na owabijou to kenshou chekkurisuto o Hasegawa-buchou ate ni ookuri shi, ashita kara teiji renraku o kakasazu okonaimasu.",
        textEn:
          "Thank you for telling me candidly. By 17:00 today I will send a formal apology letter and QA checklist addressed to Manager Hasegawa, and maintain daily scheduled updates from tomorrow.",
        tier: "respectful",
        points: 100,
        feedbackJa:
          "斉藤リーダーの助言を活かし、具体的な時刻と提出物を明言して信頼を繋ぎ止めました。",
        feedbackEn:
          "[Social Distance: Exemplary Keigo] Flawless formal etiquette honoring social hierarchy and professional boundaries. By following Leader Saito’s advice, I explicitly stated specific deadlines and required submissions, thereby maintaining trust.",
        nextNodeId: "client-node-end-success",
      },
      {
        id: "ca5b-polite-vague",
        textJa:
          "まずは今日の夕方か夜に、状況報告のメールだけ送らせていただきますね。",
        readingHiragana:
          "まずはきょうのゆうがたかよるに、じょうきょうほうこくのメールだけおくらせていただきますね。",
        romaji:
          "Mazu wa kyou no yuugata ka yoru ni, joukyou houkoku no meeru dake okurasete itadakimasu ne.",
        textEn:
          "For starters, I'll send a status email sometime this evening or tonight.",
        tier: "polite",
        points: 65,
        feedbackJa:
          "メールを出す姿勢は良いですが、時刻と形式が曖昧なため、不安が完全には拭えません。",
        feedbackEn:
          "[Social Distance: Natural Rapport] Maintains ideal social distance with friendly politeness, putting the other person at ease. While your willingness to send an email is commendable, the time and format are unclear, so I can’t completely shake my concerns.",
        nextNodeId: "client-node-end-awkward",
      },
      {
        id: "ca5b-awkward-ask-favor",
        textJa:
          "長谷川部長の機嫌が直るよう、斉藤さんからも社内でうまく取りなしていただけませんか？",
        readingHiragana:
          "はせがわぶちょうのきげんがなおるよう、さいとうさんからもしゃないでうまくとりなしていただけませんか？",
        romaji:
          "Hasegawa-buchou no kigen ga naoru you, Saitou-san kara mo shanai de umaku torinashite itadakemasen ka?",
        textEn:
          "Could you put in a good word internally too, Saito-san, so Manager Hasegawa calms down?",
        tier: "awkward",
        points: 20,
        feedbackJa:
          "自分の責任を先方の担当者に丸投げするような頼み方は、斉藤リーダーの信頼まで完全に失います。",
        feedbackEn:
          "[Social Distance: Pragmatic Mismatch] The phrasing or timing breaches expected conversational etiquette; adjusting your register keeps the interaction smooth. Making a request in a way that shifts all responsibility onto the other party’s representative will completely erode even Team Leader Saito’s trust.",
        nextNodeId: "client-node-end-failure",
      },
    ],
  },

  // Endings
  "client-node-end-perfect": {
    id: "client-node-end-perfect",
    speakerNameJa: "長谷川部長",
    speakerNameEn: "Manager Hasegawa",
    speakerRoleEn: "Client Dept. Manager",
    speakerAvatar: "💼",
    characterKey: "hasegawa",
    npcTextJa:
      "（長谷川部長は微かに表情を和らげ、深く一礼を返しました。）……分かった。今日の姿勢を見る限り、まだ任せられると判断しよう。今夜の報告、斉藤と待っている。気をつけて帰りなさい。",
    npcReadingHiragana:
      "（はせがわぶちょうはかすかにひょうじょうをやわらげ、ふかくいちれいをかえしました。）……わかった。きょうのしせいをみるかぎり、まだまかせられるとはんだんしよう。こんやのほうこく、さいとうとまっている。きをつけてかえりなさい。",
    npcRomaji:
      "(Hasegawa-buchou wa kasuka ni hyoujou o yawarage, fukaku ichirei o kaeshimashita.) ...Wakatta. Kyou no shisei o miru kagiri, mada makaserareru to handan shiyou. Konya no houkoku, Saitou to matte iru. Ki o tsukete kaerinasai.",
    npcTextEn:
      "(Manager Hasegawa softens his expression slightly and returns a deep bow.) ...Understood. Judging from how you handled yourself today, we'll trust you with this. Saito and I will await tonight's report. Safe travels back.",
    speakerVoiceId: 21,
    expression: "proud",
    backgroundKey: "client-elevator-farewell",
    isEnding: true,
    endingType: "perfect",
    choices: [],
  },
  "client-node-end-success": {
    id: "client-node-end-success",
    speakerNameJa: "斉藤（プロジェクトリーダー）",
    speakerNameEn: "Saito (Project Lead)",
    speakerRoleEn: "Client Project Lead",
    speakerAvatar: "🧑‍💻",
    characterKey: "saito",
    npcTextJa:
      "（斉藤リーダーは少し安心したように息をつきました。）ありがとうございます。その予定通りに進めていただければ、部長も納得されるはずです。引き続きよろしくお願いいたします。",
    npcReadingHiragana:
      "（さいとうリーダーはすこしあんしんしたようにいきをつきました。）ありがとうございます。そのよていどおりにすすめていただければ、ぶちょうもなっとくされるはずです。ひきつづきよろしくおねがいいたします。",
    npcRomaji:
      "(Saitou riidaa wa sukoshi anshin shita you ni iki o tsukimashita.) Arigatou gozaimasu. Sono yotei doori ni susumete itadakereba, buchou mo nattoku sareru hazu desu. Hikitsuzuki yoroshiku onegai itashimasu.",
    npcTextEn:
      "(Saito lets out a quiet breath of relief.) Thank you. If you execute on that exact schedule, the Manager should come around too. Let's keep working closely together.",
    speakerVoiceId: 12,
    expression: "relieved",
    backgroundKey: "client-elevator-farewell",
    isEnding: true,
    endingType: "success",
    choices: [],
  },
  "client-node-end-awkward": {
    id: "client-node-end-awkward",
    speakerNameJa: "斉藤（プロジェクトリーダー）",
    speakerNameEn: "Saito (Project Lead)",
    speakerRoleEn: "Client Project Lead",
    speakerAvatar: "🧑‍💻",
    characterKey: "saito",
    npcTextJa:
      "（斉藤リーダーは少し困ったように時計を見ました。）……分かりました。ただ、部長は結果と期限を非常に厳しく見られますので、どうか本日中のご連絡だけは確実にお願いします。",
    npcReadingHiragana:
      "（さいとうリーダーはすこしこまったようにとけいをみました。）……わかりました。ただ、ぶちょうはけっかときげんをひじょうにきびしくみられますので、どうかほんじつちゅうのごれんらくだけはかくじつにおねがいします。",
    npcRomaji:
      "(Saitou riidaa wa sukoshi komatta you ni tokei o mimashita.) ...Wakarimashita. Tada, buchou wa kekka to kigen o hijou ni kibishiku miraremasu node, douka honjitsu-chuu no gorenraku dake wa kakujitsu ni onegai shimasu.",
    npcTextEn:
      "(Saito checks his watch looking uneasy.) ...I see. Still, the Manager judges strictly by deadlines and concrete updates—please make sure we get that report today without fail.",
    speakerVoiceId: 12,
    expression: "troubled",
    backgroundKey: "client-elevator-farewell",
    isEnding: true,
    endingType: "awkward",
    choices: [],
  },
  "client-node-end-failure": {
    id: "client-node-end-failure",
    speakerNameJa: "長谷川部長",
    speakerNameEn: "Manager Hasegawa",
    speakerRoleEn: "Client Dept. Manager",
    speakerAvatar: "💼",
    characterKey: "hasegawa",
    npcTextJa:
      "（長谷川部長は冷ややかに席を立ちました。）……これ以上お話を伺う必要はなさそうです。今後の取引につきましては、御社の上席の方へ正式に書面にてご連絡いたします。お引き取りください。",
    npcReadingHiragana:
      "（はせがわぶちょうはひややかにせきをたちました。）……これいじょうおはなしをうかがうひつようはなさそうです。こんごのとりひきにつきましては、おんしゃのじょうせきのかたへせいしきにしょめんにてごれんらくいたします。おひきとりください。",
    npcRomaji:
      "(Hasegawa-buchou wa hiyayaka ni seki o tachimashita.) ...Kore ijou ohanashi o ukagau hitsuyou wa nasasou desu. Kongo no torihiki ni tsukimashite wa, onsha no jouseki no kata e seishiki ni shomen nite gorenraku itashimasu. Ohikitori kudasai.",
    npcTextEn:
      "(Manager Hasegawa rises coldly from his seat.) ...There appears to be no need to hear anything further. Regarding future business, we will formally write to your senior executives. Please see yourself out.",
    speakerVoiceId: 21,
    expression: "disappointed",
    backgroundKey: "executive-meeting-room",
    isEnding: true,
    endingType: "failure",
    choices: [],
  },
};
