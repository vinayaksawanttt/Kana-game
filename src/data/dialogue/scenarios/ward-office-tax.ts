import { ScenarioMeta, DialogueNode } from "../types";

export const WARD_OFFICE_TAX_SCENARIO_META: ScenarioMeta = {
  id: "ward-office-tax",
  titleJa: "区役所窓口：住民税・年金特例免除の複雑な相談",
  titleEn: "Ward Office: Complex Residence Tax & Pension Deferral",
  level: "N1",
  category: "wardoffice",
  locationJa: "世田谷区役所・納税課／国民年金相談窓口",
  locationEn: "Setagaya Ward Office · Tax & National Pension Counters",
  characterNameJa: "小幡係長 ＆ 古賀・高橋",
  characterNameEn: "Section Chief Obata, Koga & Takahashi",
  characterRoleEn: "Municipal Officials",
  characterAvatar: "🏛️",
  voiceSpeakerId: 29, // No.7
  initialNodeId: "tax-node-1-kiosk",
  descriptionJa:
    "離職に伴い収入が急減したにもかかわらず、前年所得に基づく高額な住民税納付書が届きました。さらに離職票の発行遅れや副業所得の扱い、四日後に迫る口座振替停止、国民年金の特例免除まで複数の行政手続きが絡み合います。制度上の要件を正確に踏まえ、担当者・係長と建設的に折衝しましょう。",
  descriptionEn:
    "After losing employment, a steep residence tax bill based on prior-year income arrives—with your separation certificate delayed, mixed freelance income, an automatic bank debit in four days, and National Pension exemption also needed. Navigate municipal bureaucracy with N1 administrative precision.",
  backgroundTheme: "civic",
  defaultBackgroundKey: "ward-entrance-kiosk",
  defaultExpression: "neutral",
  vocabList: [
    { ja: "住民税", kana: "じゅうみんぜい", romaji: "juuminzei", en: "municipal residence tax", partOfSpeech: "noun" },
    { ja: "前年所得課税", kana: "ぜんねんしょとくかぜい", romaji: "zennen shotoku kazei", en: "taxation based on prior year's income", partOfSpeech: "noun" },
    { ja: "徴収猶予", kana: "ちょうしゅうゆうよ", romaji: "choushuu yuuyo", en: "deferral of tax collection", partOfSpeech: "noun" },
    { ja: "減免制度", kana: "げんめんせいど", romaji: "genmen seido", en: "tax reduction / exemption system", partOfSpeech: "noun" },
    { ja: "分割納付（分納）", kana: "ぶんかつのうふ（ぶんのう）", romaji: "bunkatsu noufu (bunnoo)", en: "installment tax payment", partOfSpeech: "noun" },
    { ja: "離職票", kana: "りしょくひょう", romaji: "rishokuhyou", en: "official employment separation certificate", partOfSpeech: "noun" },
    { ja: "疎明資料", kana: "そめいしりょう", romaji: "somei shiryou", en: "prima facie supporting evidence", partOfSpeech: "noun" },
    { ja: "雑所得", kana: "ざっしょとく", romaji: "zasshotoku", en: "miscellaneous / side freelance income", partOfSpeech: "noun" },
    { ja: "口座振替", kana: "こうざふりかえ", romaji: "kouza furikae", en: "automatic bank account debit", partOfSpeech: "noun" },
    { ja: "督促状", kana: "とくそくじょう", romaji: "tokusokujou", en: "official overdue payment demand", partOfSpeech: "noun" },
    { ja: "延滞金", kana: "えんたいきん", romaji: "entaikin", en: "delinquency penalty / late interest", partOfSpeech: "noun" },
    { ja: "特例免除", kana: "とくれいめんじょ", romaji: "tokurei menjo", en: "special statutory exemption (for job loss)", partOfSpeech: "noun" },
    { ja: "追納", kana: "ついのう", romaji: "tsuinou", en: "retroactive pension contribution payment", partOfSpeech: "noun / suru-verb" },
    { ja: "公平性", kana: "こうへいせい", romaji: "kouheisei", en: "fairness / impartiality across citizens", partOfSpeech: "noun" },
    { ja: "管轄", kana: "かんかつ", romaji: "kankatsu", en: "administrative jurisdiction", partOfSpeech: "noun" },
    { ja: "庁内連携", kana: "ちょうないれんけい", romaji: "chounai renkei", en: "inter-departmental office coordination", partOfSpeech: "noun" },
  ],
};

export const WARD_OFFICE_TAX_NODES: Record<string, DialogueNode> = {
  // Turn 1: Ward Office Entrance Kiosk — Lobby Guide Takahashi
  "tax-node-1-kiosk": {
    id: "tax-node-1-kiosk",
    speakerNameJa: "高橋（総合案内係）",
    speakerNameEn: "Takahashi (Civic Lobby Guide)",
    speakerRoleEn: "Civic Information Guide",
    speakerAvatar: "🧾",
    characterKey: "takahashi",
    npcTextJa:
      "（月曜朝の混雑した世田谷区役所ロビーで、総合案内の高橋さんが番号札発券機の前で声をかけてくれました。）おはようございます。本日はどのようなご用件でしょうか？窓口が細かく分かれておりますのでご案内いたします。",
    npcReadingHiragana:
      "（げつようあさのこんざつしたせたがやくやくしょロビーで、そうごうあんないのたかはしさんがばんごうふだはっけんきのまえでこえをかけてくれました。）おはようございます。ほんじつはどのようなごようけんでしょうか？まどぐちがこまかくわかれておりますのでごあんないいたします。",
    npcRomaji:
      "(Getsuyou asa no konzatshita Setagaya kuyakusho robii de, sougou annai no Takahashi-san ga bangoufuda hakkenki no mae de koe o kakete kuremashita.) Ohayou gozaimasu. Honjitsu wa dono you na goyouken deshou ka? Madoguchi ga komakaku wakarete orimasu node goannai itashimasu.",
    npcTextEn:
      "(At the bustling Setagaya Ward Office lobby on Monday morning, civic guide Takahashi greets you beside the ticket kiosk.) Good morning. What brings you in today? Our departments are strictly divided, so let me direct you to the right counter.",
    speakerVoiceId: 8,
    expression: "neutral",
    backgroundKey: "ward-entrance-kiosk",
    choices: [
      {
        id: "wo1-respectful-precise",
        textJa:
          "恐れ入ります。先月離職し収入が激減したため、住民税の徴収猶予や分納のご相談と、国民年金の特例免除の手続きを併せて進めたいのですが、先にどちらの窓口へ向かうべきでしょうか。",
        readingHiragana:
          "おそれいります。せんげつりしょくししゅうにゅうがげきげんしたため、じゅうみんぜいのちょうしゅうゆうよやぶんのうのごそうだんと、こくみんねんきんのとくれいめんじょのてつづきをあわせてすすめたいのですが、さきにどちらのまどぐちへむかうべきでしょうか。",
        romaji:
          "Osoreirimasu. Sengetsu rishoku shi shuunyuu ga gekigen shita tame, juuminzei no choushuu yuuyo ya bunnoo no gosoudan to, kokumin nenkin no tokurei menjo no tetsuzuki o awasete susumetai no desu ga, saki ni dochira no madoguchi e mukau beki deshou ka.",
        textEn:
          "Excuse me. Because I left employment last month and my income dropped sharply, I'd like to consult on residence tax collection deferral or installments alongside National Pension special exemption—which counter should I visit first?",
        tier: "respectful",
        points: 100,
        feedbackJa:
          "要件を的確な行政用語で整理して伝えたため、納税課十四番窓口へスムーズに案内されました。",
        feedbackEn:
          "[Social Distance: Exemplary Keigo] Flawless formal etiquette honoring social hierarchy and professional boundaries. Because I organized and conveyed the requirements using precise administrative terminology, I was smoothly directed to Counter No. 14 in the Tax Payment Division.",
        nextNodeId: "tax-node-2a-counter-docs",
      },
      {
        id: "wo1-polite-general",
        textJa:
          "おはようございます。先月会社を退職して今期の住民税の支払いが厳しいのと、年金の免除手続きもしたいのですが、どこで相談できますか？",
        readingHiragana:
          "おはようございます。せんげつかいしゃをたいしょくしてこんきのじゅうみんぜいのしはらいがきびしいのと、ねんきんのめんじょてつづきもしたいのですが、どこでそうだんできますか？",
        romaji:
          "Ohayou gozaimasu. Sengetsu kaisha o taishoku shite konki no juuminzei no shiharai ga kibishii no to, nenkin no menjo tetsuzuki mo shitai no desu ga, doko de soudan dekimasu ka?",
        textEn:
          "Good morning. I left my job last month so this term's residence tax is hard to pay, and I also want to apply for pension exemption—where can I talk about both?",
        tier: "polite",
        points: 75,
        feedbackJa:
          "丁寧で分かりやすい質問です。まずは納税課へ案内してもらえました。",
        feedbackEn:
          "[Social Distance: Natural Rapport] Maintains ideal social distance with friendly politeness, putting the other person at ease. The questions were polite and easy to understand. First, I was directed to the Tax Division.",
        nextNodeId: "tax-node-2a-counter-docs",
      },
      {
        id: "wo1-rude-vent",
        textJa:
          "無職になったのに何で去年の高い税金を請求するんですか！払えるわけがないから最初から責任者を呼んでください。",
        readingHiragana:
          "むしょくになったのになんできょねんのたかいぜいきんをせいきゅうするんですか！はらえるわけがないからさいしょからせきにんしゃをよんでください。",
        romaji:
          "Mushoku ni natta no ni nande kyonen no takai zeikin o seikyuu suru n desu ka! Haraeru wake ga nai kara saisho kara sekininsha o yonde kudasai.",
        textEn:
          "Why am I billed steep taxes from last year when I'm unemployed?! I can't pay this—bring a supervisor out right now!",
        tier: "rude",
        points: -45,
        feedbackJa:
          "総合案内係は制度を決める立場ではありません。初手から怒鳴り立てると警戒されてしまいます。",
        feedbackEn:
          "[Social Distance: Blunt Imperative] Using blunt commands or aggressive phrasing severely breaches social boundaries and alarms your listener; courteous inquiries are essential. The general information desk is not in a position to make policy decisions. If you start yelling right off the bat, people will become wary of you.",
        nextNodeId: "tax-node-2b-kiosk-calm",
      },
    ],
  },

  // Turn 2A: Tax Counter #14 — Junior Clerk Koga
  "tax-node-2a-counter-docs": {
    id: "tax-node-2a-counter-docs",
    speakerNameJa: "古賀（納税課窓口）",
    speakerNameEn: "Koga (Tax Counter Clerk)",
    speakerRoleEn: "Tax Counter Staff",
    speakerAvatar: "🗂️",
    characterKey: "koga",
    npcTextJa:
      "（十四番窓口の古賀さんが書類を確認し、マニュアル通り淡々と告げます。）住民税は前年所得課税ですので、現在無職でも課税額自体は変わりません。減免や猶予の相談には、前職の「離職票」の原本が必須となりますが、お持ちですか？",
    npcReadingHiragana:
      "（じゅうよんばんまどぐちのこがさんがしょるいをかくにんし、マニュアルどおりたんたんとつげます。）じゅうみんぜいはぜんねんしょとくかぜいですので、げんざいむしょくでもかぜいがくじたいはかわりません。げんめんやゆうよのそうだんには、ぜんしょくの「りしょくひょう」のげんぽんがひっすとなりますが、おもちですか？",
    npcRomaji:
      "(Juuyonban madoguchi no Koga-san ga shorui o kakunin shi, manyuaru doori tantan to tsugemasu.) Juuminzei wa zennen shotoku kazei desu node, genzai mushoku de mo kazeigaku jitai wa kawarimasen. Genmen ya yuuyo no soudan ni wa, zenshoku no 'rishokuhyou' no genpon ga hissu to narimasu ga, omochi desu ka?",
    npcTextEn:
      "(At Counter 14, clerk Koga checks your form and speaks strictly by the book.) Residence tax is assessed on prior-year income, so being unemployed now does not alter the tax itself. To consult on reductions or deferrals, an original 'separation certificate' is required—do you have it?",
    speakerVoiceId: 12,
    expression: "thinking",
    backgroundKey: "tax-counter-window",
    choices: [
      {
        id: "wo2a-respectful-alternative-docs",
        textJa:
          "ご説明ありがとうございます。あいにく前職からの離職票発行が来週まで遅れておりまして、代わりに退職証明書と通帳の写し、確定申告書の控えを持参いたしました。これらを疎明資料として仮受付や上席の方との個別相談をご検討いただけないでしょうか。",
        readingHiragana:
          "ごせつめいありがとうございます。あいにくぜんしょくからのりしょくひょうはっこうがらいしゅうまでおくれておりまして、かわりにたいしょくしょうめいしょとつうちょうのうつし、かくていしんこくしょのひかえをじさんいたしました。これらをそめいしりょうとしてかりうけつけやじょうせきのかたとのこべつそうだんをごけんとういただけないでしょうか。",
        romaji:
          "Gosetsumei arigatou gozaimasu. Ainiku zenshoku kara no rishokuhyou hakkou ga raishuu made okurete orimashite, kawari ni taishoku shoumeisho to tsuuchou no utsushi, kakutei shinkokusho no hikae o jisan itashimashita. Korera o somei shiryou to shite kariuketsuke ya jouseki no kata to no kobetsu soudan o gokentou itadakenai deshou ka.",
        textEn:
          "Thank you for explaining. Unfortunately my ex-employer delayed issuing the separation certificate until next week, so I brought a resignation notice, bank passbook copies, and my tax return copy instead. Could these serve as supporting evidence for provisional filing or a supervisor review?",
        tier: "respectful",
        points: 100,
        feedbackJa:
          "「疎明資料（そめいしりょう）」「仮受付」という的確な行政概念を使い、若手のマニュアル対応を超えて個室相談へ繋げました！",
        feedbackEn:
          "[Social Distance: Exemplary Keigo] Flawless formal etiquette honoring social hierarchy and professional boundaries. By using precise administrative terms such as “supporting documents” and “provisional acceptance,” I was able to move beyond the standard, by-the-book responses of junior staff and guide the client to a private consultation room!",
        nextNodeId: "tax-node-3a-booth-obata",
      },
      {
        id: "wo2a-polite-ask-supervisor",
        textJa:
          "離職票がまだ会社から届いていないのですが、退職届や通帳しか持っていません。この状況で何とか相談できる上の方はおられませんか？",
        readingHiragana:
          "りしょくひょうがまだかいしゃからとどいていないのですが、たいしょくとどけやつうちょうしかもっていません。このじょうきょうでなんとかそうだんできるうえのかたはおられませんか？",
        romaji:
          "Rishokuhyou ga mada kaisha kara todoite inai no desu ga, taishoku todoke ya tsuuchou shika motte imasen. Kono joukyou de nantoka soudan dekiru ue no kata wa oraremasen ka?",
        textEn:
          "My separation certificate hasn't arrived from the company yet; I only have my resignation letter and bankbook. Is there a senior officer who could discuss options with me?",
        tier: "polite",
        points: 70,
        feedbackJa:
          "冷静に上席への取り次ぎをお願いできたため、小幡係長が奥の相談ブースに招いてくれました。",
        feedbackEn:
          "[Social Distance: Natural Rapport] Maintains ideal social distance with friendly politeness, putting the other person at ease. Because I was able to calmly ask to be connected to a senior manager, Section Chief Obata invited me into the consultation booth in the back.",
        nextNodeId: "tax-node-3a-booth-obata",
      },
      {
        id: "wo2a-awkward-give-up",
        textJa:
          "そうなんですね……離職票がないなら今日は出直すしかないですよね。延滞金がついても仕方ないか……。",
        readingHiragana:
          "そうなんですね……りしょくひょうがないならきょうはでなおすしかないですよね。えんたいきんがついてもしかたないか……。",
        romaji:
          "Sou nan desu ne... rishokuhyou ga nai nara kyou wa denaosu shika nai desu yo ne. Entaikin ga tsuite mo shikatanai ka...",
        textEn:
          "I see... if there's no separation certificate I guess I have no choice but to come back another day, even if late penalties pile up...",
        tier: "awkward",
        points: 25,
        feedbackJa:
          "窓口で相談を諦めてしまうと口座引き落とし日までに間に合わなくなります。古賀さんが引き止めてくれます。",
        feedbackEn:
          "[Social Distance: Pragmatic Mismatch] The phrasing or timing breaches expected conversational etiquette; adjusting your register keeps the interaction smooth. If you give up on consulting at the service counter, you won’t make it in time for the direct debit date. Ms. Koga will try to talk you out of it.",
        nextNodeId: "tax-node-3b-counter-stall",
      },
    ],
  },

  // Turn 2B: Recovery after lobby outburst
  "tax-node-2b-kiosk-calm": {
    id: "tax-node-2b-kiosk-calm",
    speakerNameJa: "高橋（総合案内係）",
    speakerNameEn: "Takahashi (Civic Lobby Guide)",
    speakerRoleEn: "Civic Information Guide",
    speakerAvatar: "🧾",
    characterKey: "takahashi",
    npcTextJa:
      "（高橋さんは落ち着いた声でなだめます。）お気持ちはお察しいたします。住民税の課税自体は法律で決まっておりますが、納付方法や猶予のご相談は十四番の個別窓口で承っております。落ち着いてお話しいただけますか？",
    npcReadingHiragana:
      "（たかはしさんはおちついたこえでなだめます。）おきもちはおさっしいたします。じゅうみんぜいのかぜいじたいはほうりつできまっておりますが、のうふほうほうやゆうよのごそうだんはじゅうよんばんのこべつまどぐちでうけたまわっております。おちついておはなしいただけますか？",
    npcRomaji:
      "(Takahashi-san wa ochitsuita koe de nadamemasu.) Okimochi wa osasshi itashimasu. Juuminzei no kazei jitai wa houritsu de kimatte orimasu ga, noufu houhou ya yuuyo no gosoudan wa juuyonban no kobetsu madoguchi de uketamawatte orimasu. Ochitsuite ohanashi itadakemasu ka?",
    npcTextEn:
      "(Takahashi calmly de-escalates.) I understand how stressful this feels. The tax assessment itself is statutory, yes, yet options for payment scheduling and deferral are handled quietly at Counter 14. Will you let us look at your case calmly?",
    speakerVoiceId: 8,
    expression: "troubled",
    backgroundKey: "ward-entrance-kiosk",
    choices: [
      {
        id: "wo2b-respectful-apologize",
        textJa:
          "取り乱して大変失礼いたしました。前年所得課税の仕組みは承知の上で、現在手元資金が逼迫している事情を丁寧にご説明し、分割や猶予の道を探りたいと存じます。",
        readingHiragana:
          "とりみだしてたいへんしつれいいいたしました。ぜんねんしょとくかぜいのしくみはしょうちのうえで、げんざいてもしきんがひっぱくしているじじょうをていねいにごせつめいし、ぶんかつやゆうよのみちをさぐりたいとぞんじます。",
        romaji:
          "Torimidashite taihen shitsurei itashimashita. Zennen shotoku kazei no shikumi wa shouchi no ue de, genzai temoto shikin ga hippaku shite iru jijou o teinei ni gosetsumei shi, bunkatsu ya yuuyo no michi o saguritai to zonjimasu.",
        textEn:
          "I deeply apologize for losing my composure. Understanding prior-year taxation, I'd like to calmly explain my tight cash situation and explore deferral or installments.",
        tier: "respectful",
        points: 95,
        feedbackJa:
          "即座に非を認めて「逼迫している事情」を落ち着いて説明できたため、そのまま個室相談へ通されました。",
        feedbackEn:
          "[Social Distance: Exemplary Keigo] Flawless formal etiquette honoring social hierarchy and professional boundaries. Because I immediately admitted my mistake and calmly explained my “urgent circumstances,” I was escorted directly to a private consultation room.",
        nextNodeId: "tax-node-3a-booth-obata",
      },
      {
        id: "wo2b-rude-keep-arguing",
        textJa:
          "法律がおかしいんじゃないですか！とにかく今すぐ免除してくれないと困るんです。",
        readingHiragana:
          "ほうりつがおかしいんじゃないですか！とにかくいますぐめんじょしてくれないとこまるんです。",
        romaji:
          "Houritsu ga okashii n ja nai desu ka! Tonikaku ima sugu menjo shite kurenai to komaru n desu.",
        textEn:
          "Isn't the law itself broken?! Either way, if you don't cancel the bill right now I'm in trouble!",
        tier: "rude",
        points: -50,
        feedbackJa:
          "対話に応じず制度批判を続けたため、これ以上の個別相談が困難と判断されました。",
        feedbackEn:
          "[Social Distance: Blunt Imperative] Using blunt commands or aggressive phrasing severely breaches social boundaries and alarms your listener; courteous inquiries are essential. Because you continued to criticize the system without engaging in dialogue, it was determined that further individual consultations would be difficult.",
        nextNodeId: "tax-node-end-failure",
      },
    ],
  },

  // Turn 3A: Private Consultation Booth — Section Chief Obata spots freelance nuance
  "tax-node-3a-booth-obata": {
    id: "tax-node-3a-booth-obata",
    speakerNameJa: "小幡係長（納税課）",
    speakerNameEn: "Section Chief Obata (Tax)",
    speakerRoleEn: "Tax & Deferral Section Chief",
    speakerAvatar: "🏛️",
    characterKey: "obata",
    npcTextJa:
      "（個室の相談ブースで、小幡係長が確定申告書の控えに目を留めました。）……事情は把握しました。ただ拝見すると、昨年度は給与以外にフリーランスの雑所得もかなり計上されていますね。この場合、自動的な「非自発的失業者向けの減免要件」には完全には合致しない可能性がありますが、どう申請されますか？",
    npcReadingHiragana:
      "（こしつのそうだんブースで、おばたかかりちょうがかくていしんこくしょのひかえにめをとめました。）……じじょうははあくしました。ただはいけんすると、さくねんどはきゅうよいがいにフリーランスのざっしょとくもかなりけいじょうされていますね。このばあい、じどうてきな「ひじはつてきしつぎょうしゃむけのげんめんようけん」にはかんぜんにはがっちしないかのうせいがありますが、どうしんせいされますか？",
    npcRomaji:
      "(Koshitsu no soudan buusu de, Obata kakarichou ga kakutei shinkokusho no hikae ni me o tomemashita.) ...Jijou wa haaku shimashita. Tada haiken suru to, sakunendo wa kyuuyo igai ni furiiransu no zasshotoku mo kanari keijou sarete imasu ne. Kono baai, jidouteki na 'hijihakuteki shitsugyousha-muke no genmen youken' ni wa kanzen ni wa gacchi shinai kanousei ga arimasu ga, dou shinsei saremasu ka?",
    npcTextEn:
      "(In the private consultation booth, Section Chief Obata pauses on your tax return copy.) ...I see the situation. Notice, however, you also declared sizable freelance miscellaneous income alongside salary last year. That may disqualify automatic involuntary-unemployment tax reduction—how do you wish to apply?",
    speakerVoiceId: 29,
    expression: "neutral",
    backgroundKey: "private-consultation-booth",
    choices: [
      {
        id: "wo3a-respectful-deferral-nuance",
        textJa:
          "ご指摘ありがとうございます。雑所得分の兼ね合いで減免要件を満たさない可能性も踏まえ、まずは納付が著しく困難である事情に基づく一年以内の「徴収猶予」、および無理のない分割納付へ切り替えたいと存じます。家計収支表も作成してまいりました。",
        readingHiragana:
          "ごしてきありがとうございます。ざっしょとくぶんのかねあいでげんめんようけんをみたさないかのうせいもふまえ、まずはのうふがいちじるしくこんなんであるじじょうにもとづくいちねんいないの「ちょうしゅうゆうよ」、およびむりのないぶんかつのうふへきりかえたいとぞんじます。かけいしゅうしひょうもさくせいしてまいりました。",
        romaji:
          "Goshiteki arigatou gozaimasu. Zasshotokubun no kaneai de genmen youken o mitasanai kanousei mo fumae, mazu wa noufu ga ichijirushiku konnan de aru jijou ni motozuku ichinen inai no 'choushuu yuuyo', oyobi muri no nai bunkatsu noufu e kirikaetai to zonjimasu. Kakei shuushi-hyou mo sakusei shite mairimashita.",
        textEn:
          "Thank you for pointing that out. Given that freelance income may prevent statutory reduction, I'd like to apply under livelihood hardship for up to one year of collection deferral ('choushuu yuuyo') paired with manageable installments. I even brought a monthly cash-flow sheet.",
        tier: "respectful",
        points: 100,
        feedbackJa:
          "見事なN1法制度理解！「減免」と「徴収猶予」を明確に区別し、家計収支表まで用意した姿勢に小幡係長が感心しています。",
        feedbackEn:
          "[Social Distance: Exemplary Keigo] Flawless formal etiquette honoring social hierarchy and professional boundaries. An excellent understanding of the N1 legal system! Section Chief Obata is impressed by the student’s ability to clearly distinguish between “reductions/exemptions” and “payment deferrals,” as well as their thorough preparation, which even included a household budget sheet.",
        nextNodeId: "tax-node-4a-installment-plan",
      },
      {
        id: "wo3a-awkward-demand-exemption",
        textJa:
          "そんな細かい違いは関係ありません！今は無職なんですから、例外として全額免除を適用してください！",
        readingHiragana:
          "そんなこまかいちがいはかんけいありません！いまはむしょくなんですから、れいがいとしてぜんがくめんじょをてきようしてください！",
        romaji:
          "Sonna komakai chigai wa kankei arimasen! Ima wa mushoku nan desu kara, reigai to shite zengaku menjo o tekiyou shite kudasai!",
        textEn:
          "Technical distinctions like that don't matter! I'm unemployed right now—apply a full exemption as an exception!",
        tier: "awkward",
        points: 30,
        feedbackJa:
          "行政担当者に法令外の「例外適用」を迫るのは逆効果です。公平性の原則について厳しく諭されます。",
        feedbackEn:
          "[Social Distance: Pragmatic Mismatch] The phrasing or timing breaches expected conversational etiquette; adjusting your register keeps the interaction smooth. Pressuring government officials to grant “exceptions” outside the scope of the law is counterproductive. You will be sternly admonished regarding the principle of fairness.",
        nextNodeId: "tax-node-4b-obata-lecture",
      },
      {
        id: "wo3a-casual-beg-leniency",
        textJa:
          "そこを何とかお目こぼしいただけませんか？今までずっと真面目に納めてきたんですから。",
        readingHiragana:
          "そこをなんとかおめこぼしいただけませんか？いままでずっとまじめにおさめてきたんですから。",
        romaji:
          "Soko o nantoka omekoboshi itadakemasen ka? Ima made zutto majime ni osamete kita n desu kara.",
        textEn:
          "Couldn't you please overlook that detail? I've paid diligently up to now after all.",
        tier: "casual",
        points: 20,
        feedbackJa:
          "「お目こぼし」は公的手続きでは絶対に使えない不適切な表現です。",
        feedbackEn:
          "[Social Distance: Casual Slang] Using informal speech or casual slang breaches interpersonal distance and creates awkwardness; polite forms (desu/masu) maintain comfortable initial boundaries. “Omekoshi” is an inappropriate expression that must never be used in official procedures.",
        nextNodeId: "tax-node-4b-obata-lecture",
      },
    ],
  },

  // Turn 3B: Clerk Koga halts player from walking out before auto-debit
  "tax-node-3b-counter-stall": {
    id: "tax-node-3b-counter-stall",
    speakerNameJa: "古賀（納税課窓口）",
    speakerNameEn: "Koga (Tax Counter Clerk)",
    speakerRoleEn: "Tax Counter Staff",
    speakerAvatar: "🗂️",
    characterKey: "koga",
    npcTextJa:
      "（立ち上がろうとするあなたを古賀さんが慌てて呼び止めました。）あっ、少々お待ちください！システム上、あと四日で今期分の口座振替が実行されます。このまま未納になると延滞金だけでなく督促状が出てしまいますので、係長に繋ぎましょうか？",
    npcReadingHiragana:
      "（たちあがろうとするあなたをこがさんがあわててよびとめました。）あっ、しょうしょうおまちください！システムじょう、あとよっかでこんきぶんのこうざふりかえがじっこうされます。このままみのうになるとえんたいきんだけでなくとくそくじょうがでてしまいますので、かかりちょうにつなぎましょうか？",
    npcRomaji:
      "(Tachiagarou to suru anata o Koga-san ga awatete yobitome mashita.) A, shoushou omachi kudasai! Shisutemu-jou, ato yokka de konkibun no kouza furikae ga jikkou saremasu. Kono mama minou ni naru to entaikin dake de naku tokusokujou ga dete shimaimasu node, kakarichou ni tsunagimashou ka?",
    npcTextEn:
      "(As you prepare to leave, Koga quickly stops you.) Wait just a moment! In our system, automatic bank debit runs in four days. If it bounces unpaid, you'll get not just late interest but a formal demand letter—shall I escalate this to my Section Chief?",
    speakerVoiceId: 12,
    expression: "worried",
    backgroundKey: "tax-counter-window",
    choices: [
      {
        id: "wo3b-respectful-accept-help",
        textJa:
          "ご親切に教えていただき感謝いたします。督促状の発行は避けたく、ぜひ小幡係長に振替停止と分割納付の手続きをご相談させてください。",
        readingHiragana:
          "ごしんせつにおしえていただきかんしゃいたします。とくそくじょうのはっこうはさけたく、ぜひおばたかかりちょうにふりかえていしとぶんかつのうふのてつづきをごそうだんさせてください。",
        romaji:
          "Goshinsetsu ni oshiete itadaki kansha itashimasu. Tokusokujou no hakkou wa saketaku, zehi Obata kakarichou ni furikae teishi to bunkatsu noufu no tetsuzuki o gosoudan sasete kudasai.",
        textEn:
          "Thank you for catching that—that was so thoughtful. I definitely want to avoid a formal demand notice, so please let me consult Chief Obata on stopping the auto-debit and arranging installments.",
        tier: "respectful",
        points: 95,
        feedbackJa:
          "助言をすぐ受け入れて最悪の事態を回避し、小幡係長との分割協議へ進むことができました。",
        feedbackEn:
          "[Social Distance: Exemplary Keigo] Flawless formal etiquette honoring social hierarchy and professional boundaries. By immediately accepting the advice, we were able to avoid the worst-case scenario and proceed to the settlement negotiations with Section Chief Obata.",
        nextNodeId: "tax-node-4a-installment-plan",
      },
      {
        id: "wo3b-awkward-indifferent",
        textJa:
          "あ、そうなんですか……でも今日はもう疲れたので、督促状が届いてから考えます。",
        readingHiragana:
          "あ、そうなんですか……でもきょうはもうつかれたので、とくそくじょうがとどいてからかんがえます。",
        romaji:
          "A, sou nan desu ka... demo kyou wa mou tsukareta node, tokusokujou ga todoite kara kangaemasu.",
        textEn:
          "Oh, really... well I'm already tired today, so I'll deal with it once the overdue letter arrives.",
        tier: "awkward",
        points: 20,
        feedbackJa:
          "手続きを先延ばしにしたまま帰宅してしまい、滞納扱いとなる非常にまずい結果になりました。",
        feedbackEn:
          "[Social Distance: Pragmatic Mismatch] The phrasing or timing breaches expected conversational etiquette; adjusting your register keeps the interaction smooth. I went home without completing the necessary procedures, which resulted in my payment being marked as overdue—a very unfortunate outcome.",
        nextNodeId: "tax-node-end-awkward",
      },
    ],
  },

  // Turn 4A: Installment calculation, Bank Debit Halt & National Pension Interplay
  "tax-node-4a-installment-plan": {
    id: "tax-node-4a-installment-plan",
    speakerNameJa: "小幡係長（納税課）",
    speakerNameEn: "Section Chief Obata (Tax)",
    speakerRoleEn: "Tax & Deferral Section Chief",
    speakerAvatar: "🏛️",
    characterKey: "obata",
    npcTextJa:
      "（小幡係長は家計表を見て大きく頷きました。）これほど明確に収支を出していただければ審査しやすいです。あと四日で口座振替日が迫っていますが、引き落とし停止の届出、延滞金の扱い、そして国民年金の免除手続きの三点をどう進められますか？",
    npcReadingHiragana:
      "（おばたかかりちょうはかけいひょうをみておおきくうなずきました。）これほどめいかくにしゅうしをだしていただければしんさしやすいです。あとよっかでこうざふりかえびがせまっていますが、ひきおとしていしのとどけで、えんたいきんのあつかい、そしてこくみんねんきんのめんじょてつづきのさんてんをどうすすめられますか？",
    npcRomaji:
      "(Obata kakarichou wa kakeihyou o mite ookiku unazukimashita.) Kore hodo meikaku ni shuushi o dashite itadakereba shinsa shiyasui desu. Ato yokka de kouza furikaebi ga sematte imasu ga, hikiotoshi teishi no todokede, entaikin no atsukai, soshite kokumin nenkin no menjo tetsuzuki no santen o dou susumeraremasu ka?",
    npcTextEn:
      "(Section Chief Obata nods approvingly over your budget sheet.) Having such clear income-and-expense figures makes our review far smoother. With auto-debit only four days away, how do you want to coordinate stopping the bank draft, delinquency interest rules, and your National Pension exemption?",
    speakerVoiceId: 29,
    expression: "thinking",
    backgroundKey: "private-consultation-booth",
    choices: [
      {
        id: "wo4a-respectful-comprehensive",
        textJa:
          "まず本日中に口座振替の停止届と分納計画書を提出して無用の延滞リスクを防ぎます。その足で年金窓口へも伺い、退職に伴う特例免除の申請と将来の追納による年金額回復の兼ね合いまで確認したいと存じます。",
        readingHiragana:
          "まずほんじつちゅうにこうざふりかえのていしとどけとぶんのうけいかくしょをていしゅつしてむようのえんたいリスクをふせぎます。そのあしでねんきんまどぐちへもうかがい、たいしょくにともなうとくれいめんじょのしんせいとしょうらいのついのうによるねんきんがくかいふくのかねあいまでかくにんしたいとぞんじます。",
        romaji:
          "Mazu honjitsu-chuu ni kouza furikae no teishi todoke to bunnoo keikakusho o teishutsu shite muyou no entai risuku o fusegimasu. Sono ashi de nenkin madoguchi e mo ukagai, taishoku ni tomonau tokurei menjo no shinsei to shourai no tsuinou ni yoru nenkingaku kaifuku no kaneai made kakunin shitai to zonjimasu.",
        textEn:
          "First I'll file both the auto-debit halt form and installment schedule today to prevent avoidable delinquency. Then I'll head straight to the Pension counter to file special unemployment exemption and confirm future retroactive ('tsuinou') catch-up options.",
        tier: "respectful",
        points: 100,
        feedbackJa:
          "完璧な実務対応です！住民税と年金の管轄の違いと長期的な追納メリットまで見通した回答に、係長自ら年金課への連絡票を書いてくれました。",
        feedbackEn:
          "[Social Distance: Exemplary Keigo] Flawless formal etiquette honoring social hierarchy and professional boundaries. This was a perfect professional response! The answer took into account the differences in jurisdiction between resident tax and pension, as well as the long-term benefits of making back payments—so much so that the section chief personally filled out a referral form to the Pension Division.",
        nextNodeId: "tax-node-5a-pension-handoff",
      },
      {
        id: "wo4a-polite-focused",
        textJa:
          "ぜひ本日中に引き落としを止めていただき、月々一万円ずつの分割納付をお願いしたいです。年金の手続きはその後に回ります。",
        readingHiragana:
          "ぜひほんじつちゅうにひきおとしをとめていただき、つきづきいちまんえんずつのぶんかつのうふをおねがいしたいです。ねんきんのてつづきはそのあとにまわります。",
        romaji:
          "Zehi honjitsu-chuu ni hikiotoshi o tomete itadaki, tsukizuki ichiman-en zutsu no bunkatsu noufu o onegai shitai desu. Nenkin no tetsuzuki wa sono ato ni mawarimasu.",
        textEn:
          "Please stop the bank debit today and approve monthly 10,000-yen installments. I will head over to the pension counter right afterward.",
        tier: "polite",
        points: 75,
        feedbackJa:
          "現実的で丁寧な回答です。月額の確認も含め、年金窓口へ引き継がれました。",
        feedbackEn:
          "[Social Distance: Natural Rapport] Maintains ideal social distance with friendly politeness, putting the other person at ease. This is a realistic and polite response. The matter, including confirmation of the monthly amount, has been referred to the pension office.",
        nextNodeId: "tax-node-5a-pension-handoff",
      },
      {
        id: "wo4a-awkward-ignore-debit",
        textJa:
          "口座にはもう残高がないので、引き落としは勝手に止まりますよね？分割の用紙だけもらっておきます。",
        readingHiragana:
          "こうざにはもうざんだかがないので、ひきおとしはかってにとまりますよね？ぶんかつのようしだけもらっておきます。",
        romaji:
          "Kouza ni wa mou zandaka ga nai node, hikiotoshi wa katte ni tomarimasu yo ne? Bunkatsu no youshi dake moratte okimasu.",
        textEn:
          "The account's practically empty anyway, so won't the auto-debit fail and stop automatically? I'll just take the installment form.",
        tier: "awkward",
        points: 30,
        feedbackJa:
          "残高不足による引き落とし不能は「滞納事故」として記録され、自動督促の原因になります。",
        feedbackEn:
          "[Social Distance: Pragmatic Mismatch] The phrasing or timing breaches expected conversational etiquette; adjusting your register keeps the interaction smooth. A failed debit due to insufficient funds is recorded as a “delinquency incident” and triggers an automatic collection notice.",
        nextNodeId: "tax-node-5b-debit-warning",
      },
    ],
  },

  // Turn 4B: Lecture on taxpayer fairness after demanding exceptions
  "tax-node-4b-obata-lecture": {
    id: "tax-node-4b-obata-lecture",
    speakerNameJa: "小幡係長（納税課）",
    speakerNameEn: "Section Chief Obata (Tax)",
    speakerRoleEn: "Tax & Deferral Section Chief",
    speakerAvatar: "🏛️",
    characterKey: "obata",
    npcTextJa:
      "（小幡係長が姿勢を正し、静かかつ毅然と言い切ります。）お困りの事情は重々理解しますが、他の納税者との公平性を保つため、法律上の要件を外れた恣意的な免除は一切認められません。現実的に支払える月額を提示してご相談いただけますか。",
    npcReadingHiragana:
      "（おばたかかりちょうがしせいをただし、しずかかつきぜんといいきります。）おこまりのじじょうはじゅうじゅうりかいしますが、ほかののうぜいしゃとのこうへいせいをたもつため、ほうりつじょうのようけんをはずれたしいてきなめんじょはいっさいみとめられません。げんじつてきにしはらえるげつがくをていじしてごそうだんいただけますか。",
    npcRomaji:
      "(Obata kakarichou ga shisei o tadashi, shizuka katsu kizen to iikirimasu.) Okomari no jijou wa juujuu rikai shimasu ga, hoka no nouzeisha to no kouheisei o tamotsu tame, houritsujou no youken o hazureta shiiteki na menjo wa issai mitomeraremasen. Genjitsuteki ni shiharaeru getsugaku o teiji shite gosoudan itadakemasu ka.",
    npcTextEn:
      "(Section Chief Obata straightens up and speaks calmly but firmly.) I fully appreciate your hardship, yet to uphold fairness with all other taxpayers, arbitrary exemptions outside statutory criteria cannot be granted. Will you propose a realistic monthly payment?",
    speakerVoiceId: 29,
    expression: "stern",
    backgroundKey: "private-consultation-booth",
    choices: [
      {
        id: "wo4b-respectful-pivot",
        textJa:
          "誠に申し訳ございませんでした。公平性の原則については重々承知いたしました。現在の生活費を精査した現実的な分納額と猶予申請書で、改めてご審査をお願いできますでしょうか。",
        readingHiragana:
          "まことにもうしわけございませんでした。こうへいせいのげんそくについてはじゅうじゅうしょうちいたしました。げんざいのせいかつひをせいさしたげんじつてきなぶんのうがくとゆうよしんせいしょで、あらためてごしんさをおねがいできますでしょうか。",
        romaji:
          "Makoto ni moushiwake gozaimasen deshita. Kouheisei no gensoku ni tsuite wa juujuu shouchi itashimashita. Genzai no seikatsuhi o seisa shita genjitsuteki na bunnoogaku to yuuyo shinseisho de, aratamete goshinsa o onegai dekimasu deshou ka.",
        textEn:
          "My sincere apologies. I completely understand the principle of taxpayer fairness. May I resubmit my request using a realistic monthly installment figure grounded in my living expenses?",
        tier: "respectful",
        points: 100,
        feedbackJa:
          "法令の原則を正面から受け入れ、現実的な分納計画へ切り替えたことで係長も審査に応じてくれました。",
        feedbackEn:
          "[Social Distance: Exemplary Keigo] Flawless formal etiquette honoring social hierarchy and professional boundaries. By fully accepting the principles of the law and switching to a realistic installment payment plan, the section chief agreed to review our request.",
        nextNodeId: "tax-node-5a-pension-handoff",
      },
      {
        id: "wo4b-rude-bureaucracy",
        textJa:
          "典型的なお役所仕事で、市民の窮状に全く融通が利かないんですね。もう結構です。",
        readingHiragana:
          "てんけいてきなおやくしょしごとで、しみんのきゅうじょうにまったくゆうずうがきかないんですね。もうけっこうです。",
        romaji:
          "Tenkeiteki na oyakusho shigoto de, shimin no kyuujou ni mattaku yuuzuu ga kikanai n desu ne. Mou kekkou desu.",
        textEn:
          "Classic bureaucratic rigidity—completely heartless to residents in crisis. Forget it, I'm done.",
        tier: "rude",
        points: -50,
        feedbackJa:
          "相談を決裂させて席を立ってしまい、住民税の猶予も年金の免除も未処理のままとなってしまいました。",
        feedbackEn:
          "[Social Distance: Blunt Imperative] Using blunt commands or aggressive phrasing severely breaches social boundaries and alarms your listener; courteous inquiries are essential. I walked out of the meeting in a huff, leaving both the deferral of my resident tax and the exemption from my pension payments unresolved.",
        nextNodeId: "tax-node-end-failure",
      },
    ],
  },

  // Turn 5A: Inter-department handoff to Pension Desk — Civic Guide Takahashi returns
  "tax-node-5a-pension-handoff": {
    id: "tax-node-5a-pension-handoff",
    speakerNameJa: "高橋（案内・庁内連携担当）",
    speakerNameEn: "Takahashi (Inter-Dept. Liaison)",
    speakerRoleEn: "Civic Liaison Staff",
    speakerAvatar: "🧾",
    characterKey: "takahashi",
    npcTextJa:
      "（納税課から隣りの国民年金窓口へ移動すると、高橋さんが小幡係長からの庁内連携メモを手渡してくれました。）お待たせしました！年金窓口でも退職特例免除の受付準備が整いました。なお、来週届く予定の「離職票原本」の補完提出と、追納の十年期限の確認がお済みになれば本日のお手続きは完了です。",
    npcReadingHiragana:
      "（のうぜいかからとなりのこくみんねんきんまどぐちへいどうすると、たかはしさんがおばたかかりちょうからのちょうないれんけいメモをてわたしてくれました。）おまたせしました！ねんきんまどぐちでもたいしょくとくれいめんじょのうけつけじゅんびがととのいました。なお、らいしゅうとどくよていの「りしょくひょうげんぽん」のほかんていしゅつと、ついのうのじゅうねんきげんのかくにんがおすみになればほんじつのおてつづきはかんりょうです。",
    npcRomaji:
      "(Nouzeika kara tonari no kokumin nenkin madoguchi e idou suru to, Takahashi-san ga Obata kakarichou kara no chounai renkei memo o tewatashite kuremashita.) Omatase shimashita! Nenkin madoguchi de mo taishoku tokurei menjo no uketsuke junbi ga totonoimashita. Nao, raishuu todoku yotei no 'rishokuhyou genpon' no hokan teishutsu to, tsuinou no juunen kigen no kakunin ga osumi ni nareba honjitsu no otetsuzuki wa kanryou desu.",
    npcTextEn:
      "(Moving from Tax to the adjacent National Pension desk, Takahashi hands over Chief Obata's internal liaison memo.) Thank you for waiting! The Pension desk is ready to accept your special unemployment exemption. Once we confirm the supplemental submission deadline for next week's original separation certificate and the 10-year 'tsuinou' catch-up window, everything today is complete.",
    speakerVoiceId: 8,
    expression: "happy",
    backgroundKey: "pension-desk-exit",
    choices: [
      {
        id: "wo5a-respectful-final-verify",
        textJa:
          "ご連携いただき心より御礼申し上げます。本日は仮受付をしていただき、来週金曜までに必ず離職票の原本を補完提出いたします。追納の猶予期間につきましても確認いたしましたので、収入回復後に検討いたします。",
        readingHiragana:
          "ごれんけいいただきこころよりおんれいもうしあげます。ほんじつはかりうけつけをしていただき、らいしゅうきんようまでにかならずりしょくひょうのげんぽんをほかんていしゅついたします。ついのうのゆうよきかんにつきましてもかくにんいたしましたので、しゅうにゅうかいふくごにけんとういたします。",
        romaji:
          "Gorenkei itadaki kokoro yori onrei moushiagemasu. Honjitsu wa kariuketsuke o shite itadaki, raishuu kinyou made ni kanarazu rishokuhyou no genpon o hokan teishutsu itashimasu. Tsuinou no yuuyo kikan ni tsukimashite mo kakunin itashimashita node, shuunyuu kaifuku-go ni kentou itashimasu.",
        textEn:
          "Thank you sincerely for coordinating across departments. I appreciate today's provisional filing and will submit the original separation certificate without fail by next Friday. I also note the 10-year catch-up option once my income recovers.",
        tier: "respectful",
        points: 100,
        feedbackJa:
          "仮受付、補完提出期限の確約、年金追納への見通しまで隙のない締めくくりです！",
        feedbackEn:
          "[Social Distance: Exemplary Keigo] Flawless formal etiquette honoring social hierarchy and professional boundaries. From provisional acceptance to a firm deadline for submitting supplementary materials and a clear outlook on retroactive pension payments—it’s a flawless conclusion!",
        nextNodeId: "tax-node-end-perfect",
      },
      {
        id: "wo5a-polite-confirm",
        textJa:
          "丁寧に引き継いでくださりありがとうございます。来週会社から離職票が届いたら、必ずすぐ持ってきますね。",
        readingHiragana:
          "ていねいにひきついでくださりありがとうございます。らいしゅうかいしゃからりしょくひょうがとどいたら、かならずすぐもってきますね。",
        romaji:
          "Teinei ni hikitsuide kudasari arigatou gozaimasu. Raishuu kaisha kara rishokuhyou ga todoitara, kanarazu sugu motte kimasu ne.",
        textEn:
          "Thank you for handing everything over so smoothly. Once my company sends the separation certificate next week, I'll bring it right back.",
        tier: "polite",
        points: 75,
        feedbackJa:
          "全ての要点を押さえて無事に両窓口の手続きを完了できました。",
        feedbackEn:
          "[Social Distance: Natural Rapport] Maintains ideal social distance with friendly politeness, putting the other person at ease. I was able to successfully complete the procedures at both counters, covering all the key points.",
        nextNodeId: "tax-node-end-success",
      },
      {
        id: "wo5a-awkward-skip-pension",
        textJa:
          "住民税の分割だけで安心しました！年金の手続きはまた来月時間がある時に出直しますね。",
        readingHiragana:
          "じゅうみんぜいのぶんかつだけであんしんしました！ねんきんのてつづきはまたらいげつじかんがあるときにでなおしますね。",
        romaji:
          "Juuminzei no bunkatsu dake de anshin shimashita! Nenkin no tetsuzuki wa mata raigetsu jikan ga aru toki ni denaoshimasu ne.",
        textEn:
          "Getting tax installments settled is relief enough! I'll come back next month when I have time for the pension paperwork.",
        tier: "awkward",
        points: 25,
        feedbackJa:
          "せっかく庁内連携までしてもらったのに年金免除を先送りすると、未納期間が発生しかねません。",
        feedbackEn:
          "[Social Distance: Pragmatic Mismatch] The phrasing or timing breaches expected conversational etiquette; adjusting your register keeps the interaction smooth. Even though we’ve gone to the trouble of coordinating with other departments, postponing the pension exemption could result in a period of non-payment.",
        nextNodeId: "tax-node-end-awkward",
      },
    ],
  },

  // Turn 5B: Exit warning when player ignored auto-debit risk
  "tax-node-5b-debit-warning": {
    id: "tax-node-5b-debit-warning",
    speakerNameJa: "古賀（納税課窓口）",
    speakerNameEn: "Koga (Tax Counter Clerk)",
    speakerRoleEn: "Tax Counter Staff",
    speakerAvatar: "🗂️",
    characterKey: "koga",
    npcTextJa:
      "（出口へ向かうあなたを古賀さんが追いかけてきました。）あの、やはり一言お伝えしておきます！残高不足で引き落としが失敗すると、自動的にシステムから督促状が発送され、今後の信用情報にも影響しかねません。今すぐ停止届だけ出されませんか？",
    npcReadingHiragana:
      "（でぐちへむかうあなたをこがさんがおいかけてきました。）あの、やはりひとことおつたえしておきます！ざんだかぶそくでひきおとしがしっぱいすると、じどうてきにシステムからとくそくじょうがはっそうされ、こんごのしんようじょうほうにもえいきょうしかねません。いますぐていしとどけだけだされませんか？",
    npcRomaji:
      "(Deguchi e mukau anata o Koga-san ga oikakete kimashita.) Ano, yahari hitokoto otsutae shite okimasu! Zandaka busoku de hikiotoshi ga shippai suru to, jidouteki ni shisutemu kara tokusokujou ga hassou sare, kongo no shin'you jouhou ni mo eikyou shikanemasen. Ima sugu teishi todoke dake dasaremasen ka?",
    npcTextEn:
      "(Koga hurries after you near the exit counter.) Excuse me—I really should warn you! If an auto-debit bounces for insufficient balance, the system automatically mails a demand notice and it can affect standing. Won't you file just the debit-halt form right now?",
    speakerVoiceId: 12,
    expression: "troubled",
    backgroundKey: "pension-desk-exit",
    choices: [
      {
        id: "wo5b-respectful-turnback",
        textJa:
          "わざわざ追いかけてご忠告くださりありがとうございます！危機感が甘かったです。今すぐ口座振替の停止届と分納申請を済ませてまいります。",
        readingHiragana:
          "わざわざおいかけてごちゅうこくくださりありがとうございます！ききかんがあまかったです。いますぐこうざふりかえのていしとどけとぶんのうしんせいをすませてまいります。",
        romaji:
          "Wazawaza oikakete gochuukoku kudasari arigatou gozaimasu! Kikikan ga amakatta desu. Ima sugu kouza furikae no teishi todoke to bunnoo shinsei o sumasete mairimasu.",
        textEn:
          "Thank you for running after me to warn me! I underestimated the urgency—let me fill out the bank-debit halt and installment forms right away.",
        tier: "respectful",
        points: 95,
        feedbackJa:
          "ぎりぎりでアドバイスを受け止め、無用な督促状発行を防げました！",
        feedbackEn:
          "[Social Distance: Exemplary Keigo] Flawless formal etiquette honoring social hierarchy and professional boundaries. I managed to take the advice just in the nick of time and prevented an unnecessary reminder notice from being issued!",
        nextNodeId: "tax-node-end-success",
      },
      {
        id: "wo5b-awkward-dismiss",
        textJa:
          "お気遣いは嬉しいですが、今日はもう次の予定がありますので失礼します。",
        readingHiragana:
          "おきづかいはうれしいですが、きょうはもうつぎのよていがありますのでしつれいします。",
        romaji:
          "Okizukai wa ureshii desu ga, kyou wa mou tsugi no yotei ga arimasu node shitsurei shimasu.",
        textEn:
          "I appreciate your concern, really, but I have another appointment today—excuse me.",
        tier: "awkward",
        points: 20,
        feedbackJa:
          "担当者の親切な警告すら聞き入れず帰宅し、後日督促状が届く結果となりました。",
        feedbackEn:
          "[Social Distance: Pragmatic Mismatch] The phrasing or timing breaches expected conversational etiquette; adjusting your register keeps the interaction smooth. Ignoring even the staff member’s kind warning, I went home, and as a result, a reminder notice arrived a few days later.",
        nextNodeId: "tax-node-end-awkward",
      },
    ],
  },

  // Endings
  "tax-node-end-perfect": {
    id: "tax-node-end-perfect",
    speakerNameJa: "小幡係長（納税課）",
    speakerNameEn: "Section Chief Obata (Tax)",
    speakerRoleEn: "Tax & Deferral Section Chief",
    speakerAvatar: "🏛️",
    characterKey: "obata",
    npcTextJa:
      "（見送りに顔を出した小幡係長が温かく微笑みます。）これほど制度を正確に調べ、事前資料まで揃えてこられる方はなかなかおられません。再就職までの間、区役所もしっかりサポートいたしますのでご安心ください。",
    npcReadingHiragana:
      "（みおくりにかおをだしたおばたかかりちょうがあたたかくほほえみます。）これほどせいどをせいかくにしらべ、じぜんしりょうまでそろえてこられるかたはなかなかおられません。さいしゅうしょくまでのあいだ、くやくしょもしっかりサポートいたしますのでごあんしんください。",
    npcRomaji:
      "(Miokuri ni kao o dashita Obata kakarichou ga atatakaku hohoemimasu.) Kore hodo seido o seikaku ni shirabe, jizen shiryou made soroete korareru kata wa nakanaka oraremasen. Saishuushoku made no aida, kuyakusho mo shikkari sapooto itashimasu node goanshin kudasai.",
    npcTextEn:
      "(Section Chief Obata steps out briefly to see you off with a warm smile.) Few citizens research the statutes so carefully and prepare supporting records upfront. Until you're back on your feet, the ward office has you properly covered.",
    speakerVoiceId: 29,
    expression: "proud",
    backgroundKey: "pension-desk-exit",
    isEnding: true,
    endingType: "perfect",
    choices: [],
  },
  "tax-node-end-success": {
    id: "tax-node-end-success",
    speakerNameJa: "高橋（総合案内係）",
    speakerNameEn: "Takahashi (Civic Lobby Guide)",
    speakerRoleEn: "Civic Information Guide",
    speakerAvatar: "🧾",
    characterKey: "takahashi",
    npcTextJa:
      "（高橋さんが控えのファイルを手渡してくれます。）お疲れ様でした！住民税の停止・分納とあわせて大事な手続きが無事進みましたね。来週の離職票提出もお忘れなく。応援しております！",
    npcReadingHiragana:
      "（たかはしさんがひかえのファイルをてわたしてくれます。）おつかれさまでした！じゅうみんぜいのていし・ぶんのうとあわせてだいじなてつづきがぶじすすみましたね。らいしゅうのりしょくひょうていしゅつもおわすれなく。おうえんしております！",
    npcRomaji:
      "(Takahashi-san ga hikae no fairu o tewatashite kuremasu.) Otsukaresama deshita! Juuminzei no teishi, bunnoo to awasete daiji na tetsuzuki ga buji susumimashita ne. Raishuu no rishokuhyou teishutsu mo owasure naku. Ouen shite orimasu!",
    npcTextEn:
      "(Takahashi hands you a folder of stamped copies.) Well done! With the auto-debit halt and installment filing in motion, your crucial paperwork is safely on track. Just don't forget next week's separation certificate—rooting for you!",
    speakerVoiceId: 8,
    expression: "relieved",
    backgroundKey: "pension-desk-exit",
    isEnding: true,
    endingType: "success",
    choices: [],
  },
  "tax-node-end-awkward": {
    id: "tax-node-end-awkward",
    speakerNameJa: "古賀（納税課窓口）",
    speakerNameEn: "Koga (Tax Counter Clerk)",
    speakerRoleEn: "Tax Counter Staff",
    speakerAvatar: "🗂️",
    characterKey: "koga",
    npcTextJa:
      "（古賀さんは少し心配そうに見送ります。）……分かりました。手続きが未完了のままですと来週以降に督促や未納通知が届く恐れがありますので、なるべく早めにもう一度お越しくださいね。",
    npcReadingHiragana:
      "（こがさんはすこししんぱいそうにみおくります。）……わかりました。てつづきがみかんりょうのままですとらいしゅういこうにとくそくやみのうつうちがとどくおそれがありますので、なるべくはやめにもういちどおこしくださいね。",
    npcRomaji:
      "(Koga-san wa sukoshi shinpaisou ni miokurimasu.) ...Wakarimashita. Tetsuzuki ga mikanryou no mama desu to raishuu ikou ni tokusoku ya minou tsuuchi ga todoku osore ga arimasu node, narubeku hayame ni mou ichido okoshi kudasai ne.",
    npcTextEn:
      "(Koga watches you depart looking troubled.) ...Understood. Leaving filings unfinished risks overdue notices from next week onward, so please come back as soon as you can.",
    speakerVoiceId: 12,
    expression: "troubled",
    backgroundKey: "pension-desk-exit",
    isEnding: true,
    endingType: "awkward",
    choices: [],
  },
  "tax-node-end-failure": {
    id: "tax-node-end-failure",
    speakerNameJa: "小幡係長（納税課）",
    speakerNameEn: "Section Chief Obata (Tax)",
    speakerRoleEn: "Tax & Deferral Section Chief",
    speakerAvatar: "🏛️",
    characterKey: "obata",
    npcTextJa:
      "（小幡係長は静かに書類をファイルへ戻しました。）……大変遺憾ですが、制度上の手続きにご協力いただけない限り、これ以上のご提案はいたしかねます。後日発送される正式な通知に従ってご対応ください。",
    npcReadingHiragana:
      "（おばたかかりちょうはしずかにしょるいをファイルへもどしました。）……たいへんいかんですが、せいどじょうのてつづきにごきょうりょくいただけないかぎり、これいじょうのごていあんはいたしかねます。ごじつはっそうされるせいしきなつうちにしたがってごたいおうください。",
    npcRomaji:
      "(Obata kakarichou wa shizuka ni shorui o fairu e modoshimashita.) ...Taihen ikan desu ga, seidojou no tetsuzuki ni gokyouryoku itadakenai kagiri, kore ijou no goteian wa itashikanemasu. Gojitsu hassou sareru seishiki na tsuuchi ni shitagatte gotaiou kudasai.",
    npcTextEn:
      "(Obata quietly places the file back into the folder.) ...Regrettably, unless you cooperate within statutory procedures, we cannot propose further options. Please respond to the formal notice mailed later.",
    speakerVoiceId: 29,
    expression: "disappointed",
    backgroundKey: "private-consultation-booth",
    isEnding: true,
    endingType: "failure",
    choices: [],
  },
};
