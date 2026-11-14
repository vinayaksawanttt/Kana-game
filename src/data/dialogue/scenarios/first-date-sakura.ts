import { ScenarioMeta, DialogueNode } from "../types";

export const FIRST_DATE_SAKURA_SCENARIO_META: ScenarioMeta = {
  id: "first-date-sakura",
  titleJa: "再会の午後：数日前に出会った美咲さんとの初デート",
  titleEn: "Afternoon Reunion: First Date with Misaki",
  level: "N1",
  category: "date",
  locationJa: "代官山ギャラリー 〜 中目黒・古民家カフェ＆川沿い",
  locationEn: "Daikanyama Gallery to Nakameguro Café & Canal",
  characterNameJa: "美咲（フリーイラストレーター）",
  characterNameEn: "Misaki (Illustrator)",
  characterRoleEn: "Bookstore Acquaintance",
  characterAvatar: "🌸",
  voiceSpeakerId: 23, // WhiteCUL
  initialNodeId: "date-node-1-meetup",
  descriptionJa:
    "数日前、代官山の書店で落とし物を拾った縁から会話が弾み、連絡先を交換したイラストレーターの美咲さんと初めての午後デートへ。写真展の静かな余白の共有、気難しい古民家カフェのマスターへの振る舞い、敬語を少しずつ崩す距離感、会計の粋な配慮、そして中目黒の夜風の中で次の約束を自然に見つけられるでしょうか。",
  descriptionEn:
    "Three days after helping illustrator Misaki retrieve a dropped sketchbook at a Daikanyama bookstore, you meet for your first date. Share quiet aesthetic reflections at an indie gallery, show warmth toward a gruff kominka café master, read unspoken cues ('honne' vs 'tatemae'), soften stiff Keigo naturally, and catch a subtle invitation along the Meguro canal.",
  backgroundTheme: "cafe",
  defaultBackgroundKey: "daikanyama-station-exit",
  defaultExpression: "happy",
  vocabList: [
    { ja: "縁", kana: "えん", romaji: "en", en: "serendipitous bond / fate", partOfSpeech: "noun" },
    { ja: "余白", kana: "よはく", romaji: "yohaku", en: "breathing room / quiet negative space", partOfSpeech: "noun" },
    { ja: "余韻", kana: "よいん", romaji: "yoin", en: "lingering resonance / aftertaste", partOfSpeech: "noun" },
    { ja: "空気感", kana: "くうきかん", romaji: "kuukikan", en: "subtle atmosphere / emotional texture", partOfSpeech: "noun" },
    { ja: "本音と建前", kana: "ほんねとたてまえ", romaji: "honne to tatemae", en: "true feelings vs polite facade", partOfSpeech: "noun phrase" },
    { ja: "趣がある", kana: "おもむきがある", romaji: "omomuki ga aru", en: "tasteful / full of quiet charm", partOfSpeech: "expression" },
    { ja: "敬語を崩す", kana: "けいごをくずす", romaji: "keigo o kuzusu", en: "soften formal speech into natural warmth", partOfSpeech: "verb phrase" },
    { ja: "気兼ねなく", kana: "きがねなく", romaji: "kigane naku", en: "comfortably / without feeling indebted", partOfSpeech: "adverb" },
    { ja: "配慮", kana: "はいりょ", romaji: "hairyo", en: "thoughtful consideration", partOfSpeech: "noun / suru-verb" },
    { ja: "押し付けがましい", kana: "おしつけがましい", romaji: "oshitsukegamashii", en: "pushy / overly insistent", partOfSpeech: "i-adjective" },
    { ja: "空回りする", kana: "からまわりする", romaji: "karamawari suru", en: "to try too hard and miss the mark", partOfSpeech: "verb" },
    { ja: "粋（いき）", kana: "いき", romaji: "iki", en: "effortlessly graceful / stylish tact", partOfSpeech: "na-adjective / noun" },
    { ja: "心地よい", kana: "ここちよい", romaji: "kokochiyoi", en: "deeply soothing / comfortable", partOfSpeech: "i-adjective" },
    { ja: "何気ない", kana: "なにげない", romaji: "nanigenai", en: "casual / unassuming / understated", partOfSpeech: "i-adjective" },
    { ja: "踏み込む", kana: "ふみこむ", romaji: "fumikomu", en: "step closer emotionally / deepen rapport", partOfSpeech: "verb" },
    { ja: "名残惜しい", kana: "なごりおしい", romaji: "nagorioshii", en: "reluctant to say goodbye", partOfSpeech: "i-adjective" },
  ],
};

export const FIRST_DATE_SAKURA_NODES: Record<string, DialogueNode> = {
  // Turn 1: Daikanyama Station North Exit — Meetup 3 days after bookstore encounter
  "date-node-1-meetup": {
    id: "date-node-1-meetup",
    speakerNameJa: "美咲",
    speakerNameEn: "Misaki",
    speakerRoleEn: "Illustrator",
    speakerAvatar: "🌸",
    characterKey: "misaki",
    npcTextJa:
      "（三日前に代官山の書店で出会った美咲さんが、淡い春色のコートを羽織って改札前で小さく手を振っています。少し照れた様子です。）こんにちは！この間はスケッチブックを拾っていただき本当にありがとうございました。今日、楽しみにしていました。",
    npcReadingHiragana:
      "（みっかまえにだいかんやまのしょてんでであったみさきさんが、あわいはるいろのコートをはおってかいさつまえでちいさくてをふっています。すこしてれたようすです。）こんにちは！このあいだはスケッチブックをひろっていただきほんとうにありがとうございました。きょう、たのしみにしていました。",
    npcRomaji:
      "(Mikka mae ni Daikanyama no shoten de deatta Misaki-san ga, awai haruiro no kooto o haotte kaisatsu-mae de chiisaku te o futte imasu. Sukoshi tereta yousu desu.) Konnichiwa! Kono aida wa sukecchibukku o hirotte itadaki hontou ni arigatou gozaimashita. Kyou, tanoshimi ni shite imashita.",
    npcTextEn:
      "(Outside Daikanyama Station, Misaki—whom you met at a bookstore three days ago—gives a small wave in a soft spring coat, looking faintly shy.) Hello! Thank you again for picking up my sketchbook the other day. I was really looking forward to today.",
    speakerVoiceId: 23,
    expression: "happy",
    backgroundKey: "daikanyama-station-exit",
    choices: [
      {
        id: "fd1-polite-warm",
        textJa:
          "美咲さん、こんにちは！僕の方こそ今日を楽しみにしていました。春風が心地よいですね……その淡い色合いのコート、とてもよくお似合いです。",
        readingHiragana:
          "みさきさん、こんにちは！ぼくのほうこそきょうをたのしみにしていました。はるかぜがここちよいですね……そのあわいいろあいのコート、とてもよくおにあいです。",
        romaji:
          "Misaki-san, konnichiwa! Boku no hou koso kyou o tanoshimi ni shite imashita. Harukaze ga kokochiyoi desu ne... sono awai iroai no kooto, totemo yoku oniai desu.",
        textEn:
          "Hi, Misaki-san! I was just as excited for today. The spring breeze feels lovely, doesn't it... and that soft-toned coat really suits you.",
        tier: "polite",
        points: 100,
        feedbackJa:
          "初デートに最適な自然体の丁寧さと、押し付けがましくないさりげない褒め言葉で、美咲さんの緊張が一気にほぐれました。",
        feedbackEn:
          "Spot-on warmth: understated courtesy paired with an unobtrusive compliment puts Misaki immediately at ease.",
        nextNodeId: "date-node-2a-gallery-warm",
      },
      {
        id: "fd1-respectful-stiff",
        textJa:
          "本日は週末のお忙しい中、貴重なお時間を割いていただき誠にありがとうございます。心より御礼申し上げます。",
        readingHiragana:
          "ほんじつはしゅうまつのおいそがしいなか、きちょうなおじかんをさいていただきまことにありがとうございます。こころよりおんれいもうしあげます。",
        romaji:
          "Honjitsu wa shuumatsu no oisogashii naka, kichou na ojikan o saite itadaki makoto ni arigatou gozaimasu. Kokoro yori onrei moushiagemasu.",
        textEn:
          "Thank you sincerely for sparing valuable time out of your busy weekend today. I offer my deepest gratitude.",
        tier: "respectful",
        points: 65,
        feedbackJa:
          "丁寧ではありますが、少しビジネス商談のような硬さがあり、美咲さんが思わず吹き出してしまいます。",
        feedbackEn:
          "Very polite, yet almost like greeting a corporate client—Misaki chuckles softly at the formality.",
        nextNodeId: "date-node-2b-gallery-stiff",
      },
      {
        id: "fd1-casual-abrupt",
        textJa:
          "おっす！結構待った？お腹空いたし、とりあえずどこか適当な店入ろうぜ。",
        readingHiragana:
          "おっす！けっこうまった？おなかすいたし、とりあえずどこかてきとうなみせはいろうぜ。",
        romaji:
          "Ossu! Kekkou matta? Onaka suita shi, toriaezu dokoka tekitou na mise hairou ze.",
        textEn:
          "Yo! Wait long? I'm starving, let's just duck into whatever spot is nearby.",
        tier: "casual",
        points: 15,
        feedbackJa:
          "三日前に一度会ったばかりの間柄でいきなり雑なタメ口と「適当な店」は、美咲さんを強く警戒させてしまいます。",
        feedbackEn:
          "Dropping into rough slang ('ossu', 'tekitou') on your very first meeting outside a bookstore makes Misaki pull back right away.",
        nextNodeId: "date-node-2c-gallery-guarded",
      },
    ],
  },

  // Turn 2A: Indie Photo Exhibition — Sharing N1 Aesthetic Nuance
  "date-node-2a-gallery-warm": {
    id: "date-node-2a-gallery-warm",
    speakerNameJa: "美咲",
    speakerNameEn: "Misaki",
    speakerRoleEn: "Illustrator",
    speakerAvatar: "🌸",
    characterKey: "misaki",
    npcTextJa:
      "（代官山の小さな写真ギャラリーにて。海辺の霧を写した静かな作品の前で、美咲さんが足を止めました。）……私、この写真家さんの作品の、すべてを説明し切らない「余白」の残し方が好きなんです。見る側の記憶に任せてくれる感じというか……。",
    npcReadingHiragana:
      "（だいかんやまのちいさなしゃしんギャラリーにて。うみべのきりをうつしたしずかなさくひんのまえで、みさきさんがあしをとめました。）……わたし、このしゃしんかさんのさくひんの、すべてをせつめいきらない「よはく」ののこしかたがすきなんです。みるがわのきおくにまかせてくれるかんじというか……。",
    npcRomaji:
      "(Daikanyama no chiisana shashin gyararii nite. Umibe no kiri o utsushita shizuka na sakuhin no mae de, Misaki-san ga ashi o tomemashita.) ...Watashi, kono shashinka-san no sakuhin no, subete o setsumei kiranai 'yohaku' no nokoshikata ga suki nan desu. Miru gawa no kioku ni makasete kureru kanji to iu ka...",
    npcTextEn:
      "(Inside a quiet Daikanyama indie photo gallery, Misaki pauses before a misty coastal print.) ...I love how this photographer doesn't over-explain everything—leaving that quiet 'whitespace' for the viewer's own memories to fill in...",
    speakerVoiceId: 23,
    expression: "thinking",
    backgroundKey: "indie-art-gallery",
    choices: [
      {
        id: "fd2a-respectful-aesthetic",
        textJa:
          "分かります。情報を詰め込みすぎないからこそ、見る人の記憶や余韻が入り込む隙間が生まれますよね。この間書店で少し見えた美咲さんのスケッチにも、どこか似た静かな空気感がありました。",
        readingHiragana:
          "わかります。じょうほうをつめこみすぎないからこそ、みるひとのきおくやよいんがはいりこむすきまがうまれますよね。このあいだしょてんですこしみえたみさきさんのスケッチにも、どこかにたしずかなくうきかんがありました。",
        romaji:
          "Wakarimasu. Jouhou o tsumekomi suginai kara koso, miru hito no kioku ya yoin ga hairikomu sukima ga umaremasu yo ne. Kono aida shoten de sukoshi mieta Misaki-san no sukecchi ni mo, dokoka nita shizuka na kuukikan ga arimashita.",
        textEn:
          "I feel that too. Precisely because it doesn't crowd in too much detail, there's room for the viewer's own resonance to linger. The sketch I caught a glimpse of at the bookstore shared that same quiet atmosphere.",
        tier: "respectful",
        points: 100,
        feedbackJa:
          "感性の共鳴が深まりました！彼女の作品への何気ない観察を自然に織り込んだことで、美咲さんの瞳がパッと輝きます。",
        feedbackEn:
          "Deep emotional resonance: connecting the gallery's 'yohaku' back to noticing her own sketchbook artistry lights up her expression.",
        nextNodeId: "date-node-3a-cafe-entrance",
      },
      {
        id: "fd2a-awkward-literal",
        textJa:
          "あー、たしかに被写体がすごく小さくて、ちょっと寂しい風景ですね。スマホでも撮れそうな構図というか。",
        readingHiragana:
          "あー、たしかにひしゃたいがすごくちいさくて、ちょっとさびしいふうけいですね。スマホでもとれそうなこうずというか。",
        romaji:
          "Aa, tashika ni hishatai ga sugoku chiisakute, chotto sabishii fuukei desu ne. Sumaho de mo toresou na kouzu to iu ka.",
        textEn:
          "Ah, yeah, the subject is tiny so it feels a bit lonely—almost like a framing anyone could snap on a phone.",
        tier: "awkward",
        points: 25,
        feedbackJa:
          "美咲さんが大切にしている芸術観を無自覚に茶化すような言い方になり、会話が少し冷えてしまいました。",
        feedbackEn:
          "Brushing off a piece she loves as 'snap-on-a-phone' creates a subtle chill between you.",
        nextNodeId: "date-node-3b-cafe-cool",
      },
      {
        id: "fd2a-casual-lecture",
        textJa:
          "これ、実は絞り値をかなり絞って露出をわざと下げた典型的な技法なんですよ。専門的に解説しましょうか？",
        readingHiragana:
          "これ、じつはしぼりちをかなりしぼってろしゅつをわざとさげたてんけいてきなぎほうなんですよ。せんもんてきにかいせつしましょうか？",
        romaji:
          "Kore, jitsu wa shiborichi o kanari shibotte roshutsu o waza to sageta tenkeiteki na gihou nan desu yo. Senmonteki ni kaisetsu shimashou ka?",
        textEn:
          "Actually, that's just a textbook narrow-aperture underexposure trick. Want me to break down the technical specs?",
        tier: "casual",
        points: 20,
        feedbackJa:
          "感情を分かち合いたい場面で一方的に「解説」を始めるのは典型的な空回りです。",
        feedbackEn:
          "Delivering an unsolicited technical lecture instead of sharing the mood kills the romantic quiet.",
        nextNodeId: "date-node-3b-cafe-cool",
      },
    ],
  },

  // Turn 2B: Recovery after stiff business Keigo
  "date-node-2b-gallery-stiff": {
    id: "date-node-2b-gallery-stiff",
    speakerNameJa: "美咲",
    speakerNameEn: "Misaki",
    speakerRoleEn: "Illustrator",
    speakerAvatar: "🌸",
    characterKey: "misaki",
    npcTextJa:
      "（ギャラリーへ歩きながら、美咲さんがクスッと笑います。）ふふ、なんだか大事な取引先と商談するみたいで少し緊張しちゃいますよ。……でも実は気になっていたんです、どうしてあの日のあと私を誘おうと思ってくれたんですか？",
    npcReadingHiragana:
      "（ギャラリーへあるきながら、みさきさんがクスッとわらいます。）ふふ、なんだかだいじなとりひきさきとしょうだんするみたいですこしきんちょうしちゃいますよ。……でもじつはきになっていたんです、どうしてあのひのあとわたしをさそおうとおもってくれたんですか？",
    npcRomaji:
      "(Gyararii e aruki nagara, Misaki-san ga kusutto waraimasu.) Fufu, nandaka daiji na torihikisaki to shoudan suru mitai de sukoshi kinchou shichaimasu yo. ...Demo jitsu wa ki ni natte ita n desu, doushite ano hi no ato watashi o sasoou to omotte kureta n desu ka?",
    npcTextEn:
      "(Walking into the gallery, Misaki lets out a soft laugh.) Hehe, talking like we're closing a business deal makes *me* nervous too! ...Actually, I've been curious—what made you want to invite me out after the other day?",
    speakerVoiceId: 23,
    expression: "embarrassed",
    backgroundKey: "indie-art-gallery",
    choices: [
      {
        id: "fd2b-respectful-honesty",
        textJa:
          "すみません、つい緊張して固くなってしまいました。……実はあの日、画集を一ページずつ大切にめくる美咲さんの姿がとても印象的で、もう少しゆっくりお話ししてみたいと思ったんです。",
        readingHiragana:
          "すみません、ついきんちょうしてかたくなってしまいました。……じつはあのひ、がしゅうをいちページずつたいせつにめくるみさきさんのすがたがとてもいんしょうてきで、もうすこしゆっくりおはなししてみたいとおもったんです。",
        romaji:
          "Sumimasen, tsui kinchou shite kataku natte shimaimashita. ...Jitsu wa ano hi, gashuu o ichi-peeji zutsu taisetsu ni mekuru Misaki-san no sugata ga totemo inshouteki de, mou sukoshi yukkuri ohanashi shite mitai to omotta n desu.",
        textEn:
          "Sorry, nerves got the better of me and made me sound stiff. ...Truthfully, seeing how carefully you turned each page of that art monograph stuck with me, and I really wanted a chance to talk with you unhurriedly.",
        tier: "respectful",
        points: 95,
        feedbackJa:
          "素直な照れと誠実な理由を飾らずに伝えたことで、美咲さんの頬がほんのり赤らみました。",
        feedbackEn:
          "Genuine honesty melts the stiffness right away—Misaki smiles warmly at how thoughtfully you noticed her.",
        nextNodeId: "date-node-3a-cafe-entrance",
      },
      {
        id: "fd2b-awkward-evasive",
        textJa:
          "いや、たまたま同じ東横線沿線かなと思って、情報交換がてらお声がけしただけです。",
        readingHiragana:
          "いや、たまたまおなじとうよこせんえんせんかなとおもって、じょうほうこうかんがてらおこえがけしただけです。",
        romaji:
          "Iya, tamatama onaji Touyoko-sen ensen ka na to omotte, jouhou koukan gatera okoegake shita dake desu.",
        textEn:
          "Oh, I just figured we both commute along the Toyoko line, so I reached out to swap neighborhood tips.",
        tier: "awkward",
        points: 30,
        feedbackJa:
          "照れ隠しのつもりが、美咲さんには「恋愛や好意ではない社交辞令」と誤解されてしまいました。",
        feedbackEn:
          "Playing it too safe makes it sound like a dry networking coffee rather than genuine interest.",
        nextNodeId: "date-node-3b-cafe-cool",
      },
    ],
  },

  // Turn 2C: Recovery after overly rough street greeting
  "date-node-2c-gallery-guarded": {
    id: "date-node-2c-gallery-guarded",
    speakerNameJa: "美咲",
    speakerNameEn: "Misaki",
    speakerRoleEn: "Illustrator",
    speakerAvatar: "🌸",
    characterKey: "misaki",
    npcTextJa:
      "（少し距離を置きながら、美咲さんがギャラリーの入口で立ち止まります。）……あの、メッセージでもお伝えした通り、先にこの静かな写真展をゆっくり見てからカフェへ行きたいと思っていたんですが、大丈夫ですか？",
    npcReadingHiragana:
      "（すこしきょりをおきながら、みさきさんがギャラリーのいりぐちでたちどまります。）……あの、メッセージでもおつたえしたとおり、さきにこのしずかなしゃしんてんをゆっくりみてからカフェへいきたいとおもっていたんですが、だいじょうぶですか？",
    npcRomaji:
      "(Sukoshi kyori o oki nagara, Misaki-san ga gyararii no iriguchi de tachidomarimasu.) ...Ano, messeeji de mo otsutae shita toori, saki ni kono shizuka na shashinten o yukkuri mite kara kafe e ikitai to omotte ita n desu ga, daijoubu desu ka?",
    npcTextEn:
      "(Keeping half a step of distance, Misaki stops at the gallery doorway.) ...Um, as I mentioned in my text, I really wanted to browse this quiet exhibition first before going to a café—is that alright with you?",
    speakerVoiceId: 23,
    expression: "confused",
    backgroundKey: "indie-art-gallery",
    choices: [
      {
        id: "fd2c-polite-apologize",
        textJa:
          "あっ、ごめんなさい！つい先走ってしまいました。美咲さんが楽しみにしていた展示、ぜひ急がずゆっくり一緒に見たいです。",
        readingHiragana:
          "あっ、ごめんなさい！ついさきばしってしまいました。みさきさんがたのしみにしていたてんじ、ぜひいそがずゆっくりいっしょにみたいです。",
        romaji:
          "A, gomen nasai! Tsui sakibashitte shimaimashita. Misaki-san ga tanoshimi ni shite ita tenji, zehi isogazu yukkuri issho ni mitai desu.",
        textEn:
          "Ah, I'm sorry! I jumped ahead without thinking. Since you were excited for this exhibit, let's definitely take our time looking at it together.",
        tier: "polite",
        points: 90,
        feedbackJa:
          "すぐ自分の失礼に気づいて相手の希望を尊重できたため、ぎりぎり空気を持ち直しました。",
        feedbackEn:
          "Quick course-correction respects her plans and stabilizes the afternoon.",
        nextNodeId: "date-node-3b-cafe-cool",
      },
      {
        id: "fd2c-rude-complain",
        textJa:
          "こういう静かなギャラリーって少し退屈じゃないですか？早くコーヒー飲みに行きましょうよ。",
        readingHiragana:
          "こういうしずかなギャラリーってすこしたいきつじゃないですか？はやくコーヒーのみにいきましょうよ。",
        romaji:
          "Kou iu shizuka na gyararii tte sukoshi taikutsu ja nai desu ka? Hayaku koohii nomi ni ikimashou yo.",
        textEn:
          "Quiet little galleries like this are kinda dull, aren't they? Let's just hurry up and go grab coffee.",
        tier: "rude",
        points: -50,
        feedbackJa:
          "イラストレーターである彼女の好きな空間を「退屈」と切り捨てた瞬間、デートはそこで終了となりました。",
        feedbackEn:
          "Calling an artist's favorite gallery 'dull' ends the date on the spot.",
        nextNodeId: "date-node-end-failure",
      },
    ],
  },

  // Turn 3A: Kominka Café Entrance — Gruff Master & Honne/Tatemae seating cue
  "date-node-3a-cafe-entrance": {
    id: "date-node-3a-cafe-entrance",
    speakerNameJa: "マスター（古民家カフェ）",
    speakerNameEn: "Master (Kominka Café)",
    speakerRoleEn: "Veteran Café Owner",
    speakerAvatar: "☕",
    characterKey: "master",
    npcTextJa:
      "（ギャラリーを出て裏路地の趣ある古民家カフェへ入ると、白髭のマスターが珈琲豆を挽きながらぶっきらぼうに告げます。風が冷えてきて美咲さんがわずかに肩をすくめましたが、遠慮がちに「どちらでも…」と呟きました。）今は焙煎機の横の狭いカウンターか、日が落ちてきた外向きの縁側しか空いていないよ。どっちにするね？",
    npcReadingHiragana:
      "（ギャラリーをでてうらろじのおもむきあるこみんかカフェへはいると、しろひげのマスターがコーヒーまめをひきながらぶっきらぼうにつげます。かぜがひえてきてみさきさんがわずかにかたをすくめましたが、えんりょがちに「どちらでも…」とつぶやきました。）いまはばいせんきのよこのせまいカウンターか、ひがおちてきたそとむきのえんがわしかあいていないよ。どっちにするね？",
    npcRomaji:
      "(Gyararii o dete uraroji no omomuki aru kominka kafe e hairu to, shirohige no masutaa ga koohii mame o hikinagara bukkirabou ni tsugemasu. Kaze ga hiete kite Misaki-san ga wazuka ni kata o sukumemashita ga, enryogachi ni 'Dochira de mo...' to tsubuyakimashita.) Ima wa baisenki no yoko no semai kauntaa ka, hi ga ochite kita sotomuki no engawa shika aite inai yo. Docchi ni suru ne?",
    npcTextEn:
      "(Stepping from the gallery into a charming old wooden kominka café, the silver-bearded Master speaks gruffly while grinding beans. Misaki shivers slightly from the cooling breeze, yet murmurs politely, 'Whichever you prefer...'.) Right now all I've got open is the tight counter next to the roaster, or the garden veranda where the sun's dropping fast. Which one?",
    speakerVoiceId: 42,
    expression: "neutral",
    backgroundKey: "kominka-cafe-interior",
    choices: [
      {
        id: "fd3a-respectful-honne-cue",
        textJa:
          "マスター、すごく香ばしい焙煎の香りですね！外も少し肌寒くなってきましたし、もしよろしければ暖かい焙煎機の近くのカウンターにお邪魔できますか？美咲さんもそちらの方が冷えませんよね。",
        readingHiragana:
          "マスター、すごくこうばしいばいせんのかおりですね！そともすこしはだざむくなってきましたし、もしよろしければあたたかいばいせんきのちかくのカウンターにおじゃまできますか？みさきさんもそちらのほうがひえませんよね。",
        romaji:
          "Masutaa, sugoku koubashii baisen no kaori desu ne! Soto mo sukoshi hadazamuku natte kimashita shi, moshi yoroshikereba atatakai baisenki no chikaku no kauntaa ni ojama dekimasu ka? Misaki-san mo sochira no hou ga hiemasen yo ne.",
        textEn:
          "Master, that roast aroma is incredible! It's getting brisk outside too—if you don't mind, may we sit at the warm counter near the roaster? That way you won't get chilled, Misaki-san.",
        tier: "respectful",
        points: 100,
        feedbackJa:
          "店員への敬意と、美咲さんの建前「どちらでも」の奥にある本音（寒さへの気遣い）を完璧に読み取りました！マスターまでニヤリと頷きます。",
        feedbackEn:
          "Masterful N1 social radar: honoring the artisan Master while reading Misaki's unspoken chill beneath 'whichever you prefer.'",
        nextNodeId: "date-node-4a-cafe-deep",
      },
      {
        id: "fd3a-awkward-veranda",
        textJa:
          "じゃあ開放的な縁側の席でお願いします！お庭の緑が写真映えしそうですしね！",
        readingHiragana:
          "じゃあかいほうてきなえんがわのせきでおねがいします！おにわのみどりがしゃしんばえしそうですしね！",
        romaji:
          "Jaa kaihou-teki na engawa no seki de onegai shimasu! Oniwa no midori ga shashin-bae shisou desu shi ne!",
        textEn:
          "Then the open veranda seats, please! The garden greenery looks super photogenic!",
        tier: "awkward",
        points: 35,
        feedbackJa:
          "夕暮れの冷える縁側を選んでしまい、美咲さんはコートを羽織ったまま少し寒そうに過ごす羽目になりました。",
        feedbackEn:
          "Missing her shiver, you seat her out in the evening draft just for aesthetics.",
        nextNodeId: "date-node-4b-cafe-chilly",
      },
      {
        id: "fd3a-rude-master",
        textJa:
          "え、普通のテーブル席が空くまで待てないんですか？ちょっと接客が雑じゃないですか。",
        readingHiragana:
          "え、ふつうのテーブルせきがあくまでまてないんですか？ちょっとせっきゃくがざつじゃないですか。",
        romaji:
          "E, futsuu no teeburu seki ga aku made matenai n desu ka? Chotto sekkyaku ga zatsu ja nai desu ka.",
        textEn:
          "Huh, can't we wait for a normal table? Isn't the service here a little rough?",
        tier: "rude",
        points: -50,
        feedbackJa:
          "お店のスタッフに高圧的な態度を取る姿を見て、美咲さんの心は完全に冷めてしまいました。",
        feedbackEn:
          "Snapping at service staff in front of your date instantly destroys any trust.",
        nextNodeId: "date-node-end-failure",
      },
    ],
  },

  // Turn 3B: Café Master smoothly helps thaw awkward tension
  "date-node-3b-cafe-cool": {
    id: "date-node-3b-cafe-cool",
    speakerNameJa: "マスター（古民家カフェ）",
    speakerNameEn: "Master (Kominka Café)",
    speakerRoleEn: "Veteran Café Owner",
    speakerAvatar: "☕",
    characterKey: "master",
    npcTextJa:
      "（古民家カフェのカウンターで、マスターが静かにお湯を落としながら呟きます。）……ふむ、お二人さん、まだ互いに様子見って顔だな。うちの深煎りはな、焦らずゆっくり待ってこそ甘みが出るんだ。お先に季節のブレンドでもどうぞ。",
    npcReadingHiragana:
      "（こみんかカフェのカウンターで、マスターがしずかにおゆをおとしながらつぶやきます。）……ふむ、おふたりさん、まだたがいにようすみってかおだな。うちのふかいりはな、あせらずゆっくりまってこそあまみがでるんだ。おさきにきせつのブレンドでもどうぞ。",
    npcRomaji:
      "(Kominka kafe no kauntaa de, masutaa ga shizuka ni oyu o otoshi nagara tsubuyakimasu.) ...Fumu, ofutarisan, mada tagai ni yousumi tte kao da na. Uchi no fukairi wa na, aserazu yukkuri matte koso amami ga deru nda. Osaki ni kisetsu no burendo de mo douzo.",
    npcTextEn:
      "(At the wooden counter, the Master pours a slow drip and chuckles quietly.) ...Hmm, looks like you two are still cautiously testing the waters. Good dark roast only shows its sweetness when you don't rush. Start with our seasonal blend.",
    speakerVoiceId: 42,
    expression: "thinking",
    backgroundKey: "kominka-cafe-interior",
    choices: [
      {
        id: "fd3b-respectful-humble",
        textJa:
          "マスターのおっしゃる通りですね。今日は背伸びして空回りしていたみたいです……美咲さんのおすすめを聞きながら、ゆっくり味わわせてください。",
        readingHiragana:
          "マスターのおっしゃるとおりですね。きょうはせのびしてからまわりしていたみたいです……みさきさんのおすすめをききながら、ゆっくりあじわわせてください。",
        romaji:
          "Masutaa no ossharu toori desu ne. Kyou wa senobi shite karamawari shite ita mitai desu... Misaki-san no osusume o kiki nagara, yukkuri ajiwawasete kudasai.",
        textEn:
          "You're completely right, Master. I think I've been trying too hard today and spinning my wheels... Let's slow down and hear what Misaki recommends.",
        tier: "respectful",
        points: 95,
        feedbackJa:
          "「空回り」を照れ笑いしながら認めた素直さに、美咲さんも思わずクスッと笑って表情が和らぎました！",
        feedbackEn:
          "Laughing gently at yourself ('senobi shite karamawari') disarms Misaki completely and warms up the whole table.",
        nextNodeId: "date-node-4a-cafe-deep",
      },
      {
        id: "fd3b-awkward-defensive",
        textJa:
          "いや、僕たちは初対面に近いだけですから。コーヒーはブラックで、できるだけ早めにお願いします。",
        readingHiragana:
          "いや、ぼくたちはしょたいめんにちかいだけですから。コーヒーはブラックで、できるだけはやめにおねがいします。",
        romaji:
          "Iya, bokutachi wa shotaimen ni chikai dake desu kara. Koohii wa burakku de, dekiru dake hayame ni onegai shimasu.",
        textEn:
          "Well, we practically just met after all. Black coffee please, as quick as you can.",
        tier: "awkward",
        points: 30,
        feedbackJa:
          "マスターの粋なアシストを突っぱねてしまい、微妙な沈黙が続いてしまいました。",
        feedbackEn:
          "Brushing off the Master's warm icebreaker leaves the conversation cold and stiff.",
        nextNodeId: "date-node-4b-cafe-chilly",
      },
    ],
  },

  // Turn 4A: Counter warmth — Misaki invites softening Keigo
  "date-node-4a-cafe-deep": {
    id: "date-node-4a-cafe-deep",
    speakerNameJa: "美咲",
    speakerNameEn: "Misaki",
    speakerRoleEn: "Illustrator",
    speakerAvatar: "🌸",
    characterKey: "misaki",
    npcTextJa:
      "（焙煎機の柔らかな温もりに包まれ、美咲さんが珈琲カップを両手で包みながら微笑みます。）……不思議ですね。まだ会って二度目なのに、こうしているとすごく心地よいです。あの……よかったら、もう少し敬語を崩してお話ししませんか？",
    npcReadingHiragana:
      "（ばいせんきのやわらかなぬくもりにつつまれ、みさきさんがコーヒーカップをりょうてでつつみながらほほえみます。）……ふしぎですね。まだあってにどめなのに、こうしているとすごくここちよいです。あの……よかったら、もうすこしけいごをくずしておはなししませんか？",
    npcRomaji:
      "(Baisenki no yawaraka na nukumori ni tsutsumare, Misaki-san ga koohii kappu o ryoute de tsutsumi nagara hohoemimasu.) ...Fushigi desu ne. Mada atte nidome na no ni, kou shite iru to sugoku kokochiyoi desu. Ano... yokattara, mou sukoshi keigo o kuzushite ohanashi shimasen ka?",
    npcTextEn:
      "(Wrapped in the gentle warmth near the roaster, Misaki cradles her cup with both hands and smiles.) ...Isn't it funny? This is only the second time we've met, yet sitting like this feels so comfortable. Um... if you'd like, shall we soften our polite speech a little?",
    speakerVoiceId: 23,
    expression: "embarrassed",
    backgroundKey: "kominka-cafe-interior",
    choices: [
      {
        id: "fd4a-respectful-soften",
        textJa:
          "うん、ぜひそうしよう！僕も美咲さんといると全然気を使わなくて楽だし、少しずつ自然な言葉で話せたら嬉しいなと思ってたんだ。",
        readingHiragana:
          "うん、ぜひそうしよう！ぼくもみさきさんといるとぜんぜんきをつかわなくてらくだし、すこしずつしぜんなことばではなせたらうれしいなとおもってたんだ。",
        romaji:
          "Un, zehi sou shiyou! Boku mo Misaki-san to iru to zenzen ki o tsukawanakute raku da shi, sukoshizutsu shizen na kotoba de hanasetara ureshii na to omotteta nda.",
        textEn:
          "Yeah, let's do that! Being around you feels effortless for me too—I was actually hoping we could switch to a warmer, natural tone.",
        tier: "respectful",
        points: 100,
        feedbackJa:
          "相手の歩み寄りに完璧な温度感で応えました！「です・ます」を自然に崩した優しい響きに、二人の距離がぐっと縮みます。",
        feedbackEn:
          "Warm, reciprocated timing: stepping down cleanly into soft natural Japanese draws the two of you noticeably closer.",
        nextNodeId: "date-node-5a-checkout-grace",
      },
      {
        id: "fd4a-polite-gradual",
        textJa:
          "はい、ぜひ。まずは美咲さんから僕への言葉づかいを楽にしていただけたら、僕も合わせやすいかもしれませんね。",
        readingHiragana:
          "はい、ぜひ。まずはみさきさんからぼくへのことばづかいをらくにしていただけたら、ぼくもあわせやすいかもしれませんね。",
        romaji:
          "Hai, zehi. Mazu wa Misaki-san kara boku e no kotobazukai o raku ni shite itadaketara, boku mo awaseyasui kamoshiremasen ne.",
        textEn:
          "Yes, by all means. If you go first and speak more casually with me, it'll be easier for me to follow your lead.",
        tier: "polite",
        points: 70,
        feedbackJa:
          "優しく好意的ですが、少しだけ相手任せに残った「です・ます」が初々しい距離感を作っています。",
        feedbackEn:
          "Sweet and polite, though letting her make the first register shift keeps a slightly cautious pace.",
        nextNodeId: "date-node-5a-checkout-grace",
      },
      {
        id: "fd4a-awkward-refuse",
        textJa:
          "いえ、まだ二度目でお互いよく知らない仲ですので、礼儀として敬語のままにさせていただきます。",
        readingHiragana:
          "いえ、まだにどめでおたがいよくしらないなかですので、れいぎとしてけいごのままにさせていただきます。",
        romaji:
          "Ie, mada nidome de otagai yoku shiranai naka desu node, reigi to shite keigo no mama ni sasete itadakimasu.",
        textEn:
          "No, this is only our second meeting and we barely know each other, so out of propriety let's keep strict Keigo.",
        tier: "awkward",
        points: 20,
        feedbackJa:
          "せっかく美咲さんが勇気を出して提案してくれた歩み寄りを正面から断ってしまい、場に気まずい壁ができてしまいました。",
        feedbackEn:
          "Flatly refusing her warm offer to relax speech builds an awkward wall right back between you.",
        nextNodeId: "date-node-4b-cafe-chilly",
      },
    ],
  },

  // Turn 4B: Chilly drift after missed cues — recovery before departure
  "date-node-4b-cafe-chilly": {
    id: "date-node-4b-cafe-chilly",
    speakerNameJa: "美咲",
    speakerNameEn: "Misaki",
    speakerRoleEn: "Illustrator",
    speakerAvatar: "🌸",
    characterKey: "misaki",
    npcTextJa:
      "（窓の外が薄暗くなり、美咲さんがカップを置いて小さく息をつきました。）……なんだか、今日は少しお互いのリズムが噛み合わない時間もあった気がしますね。そろそろ冷えてきましたし、駅の方へ戻りましょうか。",
    npcReadingHiragana:
      "（まどのそとがうすぐらくなり、みさきさんがカップをおいてちいさくいきをつきました。）……なんだか、きょうはすこしおたがいのリズムがかみあわないじかんもあったきがしますね。そろそろひえてきましたし、えきのほうへもどりましょうか。",
    npcRomaji:
      "(Mado no soto ga usuguraku nari, Misaki-san ga kappu o oite chiisaku iki o tsukimashita.) ...Nandaka, kyou wa sukoshi otagai no rizumu ga kamiawanai jikan mo atta ki ga shimasu ne. Sorosoro hiete kimashita shi, eki no hou e modorimashou ka.",
    npcTextEn:
      "(Outside the window dusk settles, and Misaki sets her cup down with a small sigh.) ...Somehow I feel like our rhythms were a bit out of sync at moments today. It's getting chilly too—shall we head back toward the station?",
    speakerVoiceId: 23,
    expression: "worried",
    backgroundKey: "kominka-cafe-interior",
    choices: [
      {
        id: "fd4b-respectful-sincere-turnaround",
        textJa:
          "ごめんね、美咲さん。今日は僕が緊張して少し空回りしてたみたい。……せめてここは僕に払わせて。駅まで少し川沿いの夜風にあたりながら、最後にゆっくり歩いてもいいかな。",
        readingHiragana:
          "ごめんね、みさきさん。きょうはぼくがきんちょうしてすこしからまわりしてたみたい。……せめてここはぼくにはらわせて。えきまですこしかわぞいのよかぜにあたりながら、さいごにゆっくりあるいてもいいかな。",
        romaji:
          "Gomen ne, Misaki-san. Kyou wa boku ga kinchou shite sukoshi karamawari shiteta mitai. ...Semete koko wa boku ni harawasete. Eki made sukoshi kawazoi no yokaze ni atari nagara, saigo ni yukkuri aruite mo ii ka na.",
        textEn:
          "I'm sorry, Misaki-san. I got too tense earlier and kept missing the mark. ...At least let me cover the café here, and could we walk slowly along the canal back toward the station?",
        tier: "respectful",
        points: 95,
        feedbackJa:
          "誠実に自分の空回りを認め、見返りを求めない優しさで帰りの川沿い散歩を提案できました。",
        feedbackEn:
          "Heartfelt accountability without clinginess wins one quiet chance to walk along the canal together.",
        nextNodeId: "date-node-5b-canal-recover",
      },
      {
        id: "fd4b-awkward-clingy",
        textJa:
          "えっ、もう帰っちゃうんですか？せっかく代官山まで来たのに、僕なにか怒らせるようなこと言いましたか？",
        readingHiragana:
          "えっ、もうかえっちゃうんですか？せっかくだいかんやままできたのに、ぼくなにかおこらせるようなこといいましたか？",
        romaji:
          "E, mou kaecchau n desu ka? Sekkaku Daikanyama made kita no ni, boku nanika okoraseru you na koto iimashita ka?",
        textEn:
          "Wait, you're leaving already? After coming all the way to Daikanyama—did I say something to upset you?",
        tier: "awkward",
        points: 25,
        feedbackJa:
          "相手を問い詰めるような聞き方をしてしまい、美咲さんが困ったように目を伏せました。",
        feedbackEn:
          "Putting her on the spot defensively makes the walk back tense and apologetic.",
        nextNodeId: "date-node-5b-canal-recover",
      },
      {
        id: "fd4b-rude-split-exact",
        textJa:
          "分かりました。じゃあ伝票見ますね……珈琲が七百円でケーキが六百五十円だから、ちょうど千三百五十円いただけますか？",
        readingHiragana:
          "わかりました。じゃあでんぴょうみますね……コーヒーがななひゃくえんでケーキがろっぴゃくごじゅうえんだから、ちょうどせんさんびゃくごじゅうえんいただけますか？",
        romaji:
          "Wakarimashita. Jaa denpyou mimasu ne... koohii ga nanahyaku-en de keeki ga roppyaku-gojuu-en dakara, choudo sen-sanbyaku-gojuu-en itadakemasu ka?",
        textEn:
          "Got it. Let me check the slip... coffee was 700 and cake was 650, so could you give me 1,350 yen exact?",
        tier: "rude",
        points: -50,
        feedbackJa:
          "雰囲気が微妙になった途端に一円単位の割り勘請求をする態度は、恋愛感情の余地を完全に断ち切ります。",
        feedbackEn:
          "Itemizing down to the exact yen the instant the mood cools turns an awkward date into a definitive goodbye.",
        nextNodeId: "date-node-end-failure",
      },
    ],
  },

  // Turn 5A: Wooden Register Checkout — Tactful Japanese bill etiquette
  "date-node-5a-checkout-grace": {
    id: "date-node-5a-checkout-grace",
    speakerNameJa: "マスター（レジ前）",
    speakerNameEn: "Master (At the Register)",
    speakerRoleEn: "Veteran Café Owner",
    speakerAvatar: "☕",
    characterKey: "master",
    npcTextJa:
      "（お会計のため木製のレジ台の前に立つと、美咲さんが急いで財布を取り出し「あっ、自分の分は出します！」と差し出します。マスターは面白そうに二人のやり取りを見守っています。）お会計は合わせて二千八百円になるが……どうするね？",
    npcReadingHiragana:
      "（おかいけいのためもくせいのレジだいのまえにたつと、みさきさんがいそいでさいふをとりだし「あっ、じぶんのぶんはだします！」とさしだします。マスターはおもしろそうにふたりのやりとりをみまもっています。）おかいけいはあわせてにせんはっぴゃくえんになるが……どうするね？",
    npcRomaji:
      "(Okaikei no tame mokusei no rejidai no mae ni tatsu to, Misaki-san ga isoide saifu o toridashi 'A, jibun no bun wa dashimasu!' to sashidashimasu. Masutaa wa omoshirosou ni futari no yaritori o mimamotte imasu.) Okaikei wa awasete nisen-happyaku-en ni naru ga... dou suru ne?",
    npcTextEn:
      "(Standing at the wooden counter register, Misaki quickly pulls out her wallet saying, 'Oh, let me pay for mine!' The Master watches the two of you with amused interest.) Total comes to 2,800 yen together... how are we settling up?",
    speakerVoiceId: 42,
    expression: "happy",
    backgroundKey: "kominka-cafe-interior",
    choices: [
      {
        id: "fd5a-respectful-iki-grace",
        textJa:
          "ここはさっき素敵な写真展を教えてくれたお礼に、僕に出させて。その代わり、次どこかで甘いものを食べるときにお願いしようかな。",
        readingHiragana:
          "ここはさっきすてきなしゃしんてんをおしえてくれたおれいに、ぼくにださせて。そのかわり、つぎどこかであまいものをたべるときにおねがいしようかな。",
        romaji:
          "Koko wa sakki suteki na shashinten o oshiete kureta orei ni, boku ni dasasete. Sono kawari, tsugi dokoka de amai mono o taberu toki ni onegai shiyou ka na.",
        textEn:
          "Let me get this as a thank-you for showing me that wonderful gallery. Instead, maybe you can treat me to sweets next time we go out?",
        tier: "respectful",
        points: 100,
        feedbackJa:
          "完璧な「粋（いき）」な配慮！相手に借りを感じさせず、しかも自然な形で次のデートへの布石を置きました！マスターも満足げに頷きます。",
        feedbackEn:
          "Peak N1 tact ('iki'): spares her feeling indebted while effortlessly planting the seed for a second date.",
        nextNodeId: "date-node-6a-canal-evening",
      },
      {
        id: "fd5a-polite-compromise",
        textJa:
          "お気遣いありがとう。ここはまとめて払っておくから、もしよかったらこの後コンビニで温かいお茶でもご馳走してよ。",
        readingHiragana:
          "おきづかいありがとう。ここはまとめてはらっておくから、もしよかったらこのあとコンビニであたたかいおちゃでもごちそうしてよ。",
        romaji:
          "Okizukai arigatou. Koko wa matomete haratte oku kara, moshi yokattara kono ato konbini de atatakai ocha de mo gochisou shite yo.",
        textEn:
          "Thanks for offering. I'll pay this together—maybe treat me to a warm tea at a convenience store on the walk back if you like.",
        tier: "polite",
        points: 75,
        feedbackJa:
          "気兼ねさせないスマートな妥協案で、美咲さんも嬉しそうに財布をしまいました。",
        feedbackEn:
          "Thoughtful compromise that keeps things breezy and easygoing.",
        nextNodeId: "date-node-6a-canal-evening",
      },
      {
        id: "fd5a-awkward-macho",
        textJa:
          "いいから引っ込めて！こういう時は男が全部払うもんなんだよ。",
        readingHiragana:
          "いいからひっこめて！こういうときはおとこがぜんぶはらうもんなんだよ。",
        romaji:
          "Ii kara hikkomete! Kou iu toki wa otoko ga zenbu harau mon nan da yo.",
        textEn:
          "Put it away! A guy's supposed to pay for everything in situations like this.",
        tier: "awkward",
        points: 30,
        feedbackJa:
          "奢ること自体は悪くなくても、「男が払うもん」という上から目線の言い方が美咲さんを少し萎縮させました。",
        feedbackEn:
          "Even when treating someone, phrasing it as rigid gender pride ('otoko ga harau mon') makes her feel uncomfortable rather than cared for.",
        nextNodeId: "date-node-5b-canal-recover",
      },
    ],
  },

  // Turn 6A: Dusk along Meguro River Canal — Subtle N1 Invitation
  "date-node-6a-canal-evening": {
    id: "date-node-6a-canal-evening",
    speakerNameJa: "美咲",
    speakerNameEn: "Misaki",
    speakerRoleEn: "Illustrator",
    speakerAvatar: "🌸",
    characterKey: "misaki",
    npcTextJa:
      "（提灯の明かりが川面に揺れる中目黒の遊歩道を並んで歩きます。駅の明かりが見えてきた頃、美咲さんが少し歩調を落とし、名残惜しそうに川面を見つめて言いました。）……あの、もし歩くのが嫌じゃなかったらなんですけど……来週の土曜日、谷中で古い和紙や陶器の小さな市があるんですって。",
    npcReadingHiragana:
      "（ちょうちんのあかりがかわもにゆれるなかめぐろのゆうほどうをならんであるきます。えきのあかりがみえてきたころ、みさきさんがすこしほちょうをおとし、なごりおしそうにかわもをみつめていいました。）……あの、もしあるくのがいやじゃなかったらなんですけど……らいしゅうのどようび、やなかでふるいわしやとうきのちいさないちがあるんですって。",
    npcRomaji:
      "(Chouchin no akari ga kawamo ni yureru Nakameguro no yuuhodou o narande arukimasu. Eki no akari ga miete kita koro, Misaki-san ga sukoshi hochou o otoshi, nagorioshisou ni kawamo o mitsumete iimashita.) ...Ano, moshi aruku no ga iya ja nakattara nan desu kedo... raishuu no doyoubi, Yanaka de furui washi ya touki no chiisana ichi ga aru n desu tte.",
    npcTextEn:
      "(Walking side by side along the lantern-lit Meguro River promenade, as Nakameguro station's lights appear ahead, Misaki slows her pace reluctantly and gazes at the water.) ...Um, only if you don't hate slow walks, that is... I heard there's a quiet market for handmade washi paper and ceramics in Yanaka next Saturday.",
    speakerVoiceId: 23,
    expression: "embarrassed",
    backgroundKey: "nakameguro-evening-canal",
    choices: [
      {
        id: "fd6a-respectful-catch-hint",
        textJa:
          "誘ってくれてすごく嬉しいよ。美咲さんとこうしてゆっくり歩く時間、本当に心地よかったから、来週の土曜日ぜひ一緒に行こう。今日は最高の午後をありがとう。",
        readingHiragana:
          "さそってくれてすごくうれしいよ。みさきさんとこうしてゆっくりあるくじかん、ほんとうにここちよかったから、らいしゅうのどようびぜひいっしょにいこう。きょうはさいこうのごごをありがとう。",
        romaji:
          "Sasotte kurete sugoku ureshii yo. Misaki-san to kou shite yukkuri aruku jikan, hontou ni kokochiyokatta kara, raishuu no doyoubi zehi issho ni ikou. Kyou wa saikou no gogo o arigatou.",
        textEn:
          "I'm so glad you brought that up. Walking slowly with you like this has felt genuinely wonderful, so let's definitely go together next Saturday. Thank you for an unforgettable afternoon.",
        tier: "respectful",
        points: 100,
        feedbackJa:
          "見事！日本人が奥ゆかしく投げる「もし嫌じゃなかったら…」のサインを真っ直ぐ温かく受け止め、最高の形で次の約束を結びました！",
        feedbackEn:
          "Pure N1 emotional fluency: catching her shy, understated hint gracefully and affirming both her company and Saturday's plan!",
        nextNodeId: "date-node-end-perfect",
      },
      {
        id: "fd6a-polite-accept",
        textJa:
          "わあ、良さそうですね！ぜひ行きたいです。詳しい待ち合わせ時間、また後ほどメッセージで決めましょう。",
        readingHiragana:
          "わあ、よさそうですね！ぜひいきたいです。くわしいまちあわせじかん、またのちほどメッセージできめましょう。",
        romaji:
          "Waa, yosasou desu ne! Zehi ikitai desu. Kuwashii machiawase jikan, mata nochihodo messeeji de kimemashou.",
        textEn:
          "Oh, that sounds lovely! I'd definitely love to go. Let's figure out the exact meetup time by message later tonight.",
        tier: "polite",
        points: 75,
        feedbackJa:
          "素直で明るく承諾できました。改札前で次の再会が決まり、とても爽やかな締めくくりです。",
        feedbackEn:
          "Bright, clear acceptance—locking in another weekend outing as you reach the station.",
        nextNodeId: "date-node-end-success",
      },
      {
        id: "fd6a-awkward-miss-hint",
        textJa:
          "へえ、谷中って風情がありますよね！僕も今度スケジュールが空いたら一人でのんびり行ってみようかな。",
        readingHiragana:
          "へえ、やなかってふぜいがありますよね！ぼくもこんどスケジュールがあいたらひとりでのんびりいってみようかな。",
        romaji:
          "Hee, Yanaka tte fuzei ga arimasu yo ne! Boku mo kondo sukejuuru ga aitara hitori de nonbiri itte miyou ka na.",
        textEn:
          "Huh, Yanaka sure has old-town charm! Maybe I'll check it out on my own someday when my schedule opens up.",
        tier: "awkward",
        points: 20,
        feedbackJa:
          "せっかくの繊細なデートの誘いに全く気づかず「一人で行く」と返してしまい、美咲さんが寂しそうに微笑みました……。",
        feedbackEn:
          "Painful swing-and-a-miss: failing to read her indirect hint and saying you'll go 'alone' visibly disappoints Misaki.",
        nextNodeId: "date-node-end-awkward",
      },
    ],
  },

  // Turn 5B/6B: Canal recovery walk toward Nakameguro Station
  "date-node-5b-canal-recover": {
    id: "date-node-5b-canal-recover",
    speakerNameJa: "美咲",
    speakerNameEn: "Misaki",
    speakerRoleEn: "Illustrator",
    speakerAvatar: "🌸",
    characterKey: "misaki",
    npcTextJa:
      "（目黒川沿いの冷たい夜風を浴びて駅へ近づくと、美咲さんが少し申し訳なさそうに振り向きます。）……さっきは少し硬い空気にしてしまってごめんなさい。実は私も、初対面に近い二人でどう過ごせばいいか探り探りだったんです。",
    npcReadingHiragana:
      "（めぐろがわぞいのつめたいよかぜをあびてえきへちかづくと、みさきさんがすこしもうしわけなさそうにふりむきます。）……さっきはすこしかたいくうきにしてしまってごめんなさい。じつはわたしも、しょたいめんにちかいふたりでどうすごせばいいかさぐりさぐりだったんです。",
    npcRomaji:
      "(Meguro-gawa-zoi no tsumetai yokaze o abite eki e chikazuku to, Misaki-san ga sukoshi moushiwakenasasou ni furimukimasu.) ...Sakki wa sukoshi katai kuuki ni shite shimatte gomen nasai. Jitsu wa watashi mo, shotaimen ni chikai futari de dou sugoseba ii ka sagurisaguri datta n desu.",
    npcTextEn:
      "(Walking through the crisp breeze by the Meguro canal near the station, Misaki turns looking slightly apologetic.) ...Sorry for making things feel stiff earlier. Honestly, since we barely knew each other, I was feeling my way through how to act too.",
    speakerVoiceId: 23,
    expression: "thinking",
    backgroundKey: "nakameguro-evening-canal",
    choices: [
      {
        id: "fd5b-respectful-zero-pressure",
        textJa:
          "美咲さんが謝ることなんて何もないよ。最初は誰でも探り探りになるよね……でも最後にこうやって夜風に当たりながら本音で話せて本当によかった。今日は来てくれてありがとう、気をつけて帰ってね。",
        readingHiragana:
          "みさきさんがあやまることなんてなにもないよ。さいしょはだれでもさぐりさぐりになるよね……でもさいごにこうやってよかぜにあたりながらほんねではなせてほんとうによかった。きょうはきてくれてありがとう、きをつけてかえってね。",
        romaji:
          "Misaki-san ga ayamaru koto nante nani mo nai yo. Saisho wa dare de mo sagurisaguri ni naru yo ne... demo saigo ni kou yatte yokaze ni atari nagara honne de hanasete hontou ni yokatta. Kyou wa kite kurete arigatou, ki o tsukete kaette ne.",
        textEn:
          "You have nothing at all to apologize for, Misaki. Everyone tests the waters at first... Honestly, being able to walk in the evening air and speak sincerely like this at the end made today worthwhile. Thank you for coming—get home safe.",
        tier: "respectful",
        points: 100,
        feedbackJa:
          "見事な大人の挽回！見返りや無理な挽回を迫らず、誠実さと余裕を示したことで、彼女の心が最後にふっと温まりました。",
        feedbackEn:
          "Mature emotional grace: releasing all pressure while ending on sincere warmth turns a bumpy date back into a fond memory.",
        nextNodeId: "date-node-end-success",
      },
      {
        id: "fd5b-polite-gentle",
        textJa:
          "いえ、僕の方こそ至らない点が多くてすみませんでした。今日はお疲れ様でした。また機会があればよろしくお願いします。",
        readingHiragana:
          "いえ、ぼくのほうこそいたらないてんがおおくてすみませんでした。きょうはおつかれさまでした。またきかいがあればよろしくおねがいします。",
        romaji:
          "Ie, boku no hou koso itaranai ten ga ookute sumimasen deshita. Kyou wa otsukaresama deshita. Mata kikai ga areba yoroshiku onegai shimasu.",
        textEn:
          "Not at all, I was the clumsy one today. Thank you for spending the afternoon with me—hopefully our paths cross again.",
        tier: "polite",
        points: 70,
        feedbackJa:
          "礼儀正しく穏やかに締められましたが、「また機会があれば」は少し儀礼的で余韻を残しました。",
        feedbackEn:
          "Polite and respectful, though 'mata kikai ga areba' leaves things slightly ambiguous.",
        nextNodeId: "date-node-end-awkward",
      },
      {
        id: "fd5b-awkward-pushy-bar",
        textJa:
          "このまま帰るのはもったいないですよ！駅前のバーで一杯だけ飲んで挽回させてください！",
        readingHiragana:
          "このままかえるのはもったいないですよ！えきまえのバーでいっぱいだけのんでばんかいさせてください！",
        romaji:
          "Kono mama kaeru no wa mottainai desu yo! Ekimae no baa de ippai dake nonde bankai sasete kudasai!",
        textEn:
          "It'd be such a waste to end like this! Just come to a bar by the station for one drink and let me make it up to you!",
        tier: "awkward",
        points: 15,
        feedbackJa:
          "相手の「帰りたい」サインを無視して引き止める押し付けがましい態度は、完全に逆効果でした。",
        feedbackEn:
          "Pushing for a second venue ('bar') when she clearly wants to head home breaks the final bit of comfort.",
        nextNodeId: "date-node-end-failure",
      },
    ],
  },

  // Endings
  "date-node-end-perfect": {
    id: "date-node-end-perfect",
    speakerNameJa: "美咲",
    speakerNameEn: "Misaki",
    speakerRoleEn: "Illustrator",
    speakerAvatar: "🌸",
    characterKey: "misaki",
    npcTextJa:
      "（中目黒駅の温かい照明の下、美咲さんは嬉しそうに頬を緩めて小さく手を振りました。）……よかった！じゃあ、来週の土曜日、また楽しみにしてるね。今日は本当にありがとう、また連絡するね！",
    npcReadingHiragana:
      "（なかめぐろえきのあたたかいしょうめいのした、みさきさんはうれしそうにほほをゆるめてちいさくてをふりました。）……よかった！じゃあ、らいしゅうのどようび、またたのしみにしてるね。きょうはほんとうにありがとう、またれんらくするね！",
    npcRomaji:
      "(Nakameguro-eki no atatakai shoumei no shita, Misaki-san wa ureshisou ni hoho o yurumete chiisaku te o furimashita.) ...Yokatta! Jaa, raishuu no doyoubi, mata tanoshimi ni shiteru ne. Kyou wa hontou ni arigatou, mata renraku suru ne!",
    npcTextEn:
      "(Under the warm lights of Nakameguro Station, Misaki beams softly and gives a little wave, naturally keeping her warm casual tone.) ...I'm so glad! Then next Saturday—I'll be looking forward to it. Thank you so much for today, I'll text you soon!",
    speakerVoiceId: 23,
    expression: "proud",
    backgroundKey: "nakameguro-station-lights",
    isEnding: true,
    endingType: "perfect",
    choices: [],
  },
  "date-node-end-success": {
    id: "date-node-end-success",
    speakerNameJa: "美咲",
    speakerNameEn: "Misaki",
    speakerRoleEn: "Illustrator",
    speakerAvatar: "🌸",
    characterKey: "misaki",
    npcTextJa:
      "（駅改札の前で、美咲さんは柔らかな笑顔を見せてお辞儀をしました。）今日は本当にありがとうございました。思っていた以上に温かい時間を過ごせて安心しました。お気をつけてお帰りください！",
    npcReadingHiragana:
      "（えきかいさつのまえで、みさきさんはやわらかなえがおをみせておじぎをしました。）きょうはほんとうにありがとうございました。おもっていたいじょうにあたたかいじかんをすごせてあんしんしました。おきをつけておかえりください！",
    npcRomaji:
      "(Eki kaisatsu no mae de, Misaki-san wa yawaraka na egao o misete ojigi o shimashita.) Kyou wa hontou ni arigatou gozaimashita. Omotte ita ijou ni atatakai jikan o sugosete anshin shimashita. Oki o tsukete okaeri kudasai!",
    npcTextEn:
      "(Before the station ticket gates, Misaki offers a warm smile.) Thank you truly for today. I spent a much warmer afternoon with you than I'd even hoped—have a safe trip home!",
    speakerVoiceId: 23,
    expression: "relieved",
    backgroundKey: "nakameguro-station-lights",
    isEnding: true,
    endingType: "success",
    choices: [],
  },
  "date-node-end-awkward": {
    id: "date-node-end-awkward",
    speakerNameJa: "美咲",
    speakerNameEn: "Misaki",
    speakerRoleEn: "Illustrator",
    speakerAvatar: "🌸",
    characterKey: "misaki",
    npcTextJa:
      "（駅の照明のもと、美咲さんは少し物足りなそうに控えめに微笑みました。）……そうですね、もしご都合が合えば。今日はお付き合いいただきありがとうございました。それでは、失礼いたします。",
    npcReadingHiragana:
      "（えきのしょうめいのもと、みさきさんはすこしものたりなそうにひかえめにほほえみました。）……そうですね、もしごつごうがあえば。きょうはおつきあいいただきありがとうございました。それでは、しつれいいたします。",
    npcRomaji:
      "(Eki no shoumei no moto, Misaki-san wa sukoshi monotarinasou ni hikaeme ni hohoemimashita.) ...Sou desu ne, moshi gotsugou ga aeba. Kyou wa otsukiai itadaki arigatou gozaimashita. Sore de wa, shitsurei itashimasu.",
    npcTextEn:
      "(Under the station lights, Misaki offers a wistful, reserved smile.) ...Right, maybe if timing works out someday. Thank you for spending today with me. Well then, goodbye.",
    speakerVoiceId: 23,
    expression: "troubled",
    backgroundKey: "nakameguro-station-lights",
    isEnding: true,
    endingType: "awkward",
    choices: [],
  },
  "date-node-end-failure": {
    id: "date-node-end-failure",
    speakerNameJa: "美咲",
    speakerNameEn: "Misaki",
    speakerRoleEn: "Illustrator",
    speakerAvatar: "🌸",
    characterKey: "misaki",
    npcTextJa:
      "（美咲さんは足早に改札の方へ向き直り、距離を置いた礼儀正しい声で言いました。）……申し訳ありませんが、今日はこのあたりで失礼させていただきます。今後の連絡もどうかお控えください。",
    npcReadingHiragana:
      "（みさきさんはあしばやにかいさつのほうへむきなおり、きょりをおいたれいぎただしいこえでいいました。）……もうしわけありませんが、きょうはこのあたりでしつれいさせていただきます。こんごのれんらくもどうかおひかえください。",
    npcRomaji:
      "(Misaki-san wa ashibaya ni kaisatsu no hou e mukinaori, kyori o oita reigi tadashii koe de iimashita.) ...Moushiwake arimasen ga, kyou wa kono atari de shitsurei sasete itadakimasu. Kongo no renraku mo douka ohikae kudasai.",
    npcTextEn:
      "(Misaki steps swiftly toward the ticket gates and speaks with cool, distant formality.) ...I'm sorry, but I'll excuse myself here for today. Please refrain from reaching out going forward.",
    speakerVoiceId: 23,
    expression: "disappointed",
    backgroundKey: "nakameguro-station-lights",
    isEnding: true,
    endingType: "failure",
    choices: [],
  },
};
