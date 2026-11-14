import { ScenarioMeta, DialogueNode } from "../types";

export const JOB_INTERVIEW_SCENARIO_META: ScenarioMeta = {
  id: "job-interview-pr",
  titleJa: "中途採用面接：自己PRと企業文化への適性",
  titleEn: "Mid-Career Job Interview: Self-PR & Cultural Fit",
  level: "N2",
  category: "interview",
  locationJa: "株式会社ミナト・イノベーション（品川オフィス）",
  locationEn: "Minato Innovation Inc. · Shinagawa Office",
  characterNameJa: "松本取締役 ＆ 川口マネージャー",
  characterNameEn: "Director Matsumoto & Manager Kawaguchi",
  characterRoleEn: "Hiring Panel",
  characterAvatar: "👨🏻‍💼",
  voiceSpeakerId: 13, // Aoyama Ryusei
  initialNodeId: "interview-node-1-lounge",
  descriptionJa:
    "品川にあるIT企業の中途採用・最終面接に臨みます。受付ラウンジでの待機姿勢から入室作法、御社と貴社の使い分け、転職理由の本音と建前、先輩社員との意見対立への対処、そして逆質問まで、日本の面接官が重視する協調性と即戦力性を示しましょう。",
  descriptionEn:
    "Step into a final mid-career job interview in Shinagawa. Navigate waiting-lounge etiquette, knock-and-enter manners, concise Self-PR, framing your reason for changing jobs without badmouthing past employers, handling workplace consensus conflicts, and asking an insightful reverse question.",
  backgroundTheme: "office",
  defaultBackgroundKey: "corp-waiting-lounge",
  defaultExpression: "neutral",
  vocabList: [
    { ja: "中途採用", kana: "ちゅうとさいよう", romaji: "chuuto saiyou", en: "mid-career recruitment", partOfSpeech: "noun" },
    { ja: "自己PR", kana: "じこピーアール", romaji: "jiko pii-aaru", en: "self-promotion / personal pitch", partOfSpeech: "noun" },
    { ja: "志望動機", kana: "しぼうどうき", romaji: "shibou douki", en: "motivation for applying", partOfSpeech: "noun" },
    { ja: "転職理由", kana: "てんしょくりゆう", romaji: "tenshoku riyuu", en: "reason for changing jobs", partOfSpeech: "noun" },
    { ja: "御社 / 貴社", kana: "おんしゃ / きしゃ", romaji: "onsha / kisha", en: "your company (spoken / written)", partOfSpeech: "noun" },
    { ja: "前職", kana: "ぜんしょく", romaji: "zenshoku", en: "previous employment / job", partOfSpeech: "noun" },
    { ja: "培う", kana: "つちかう", romaji: "tsuchikau", en: "to cultivate / build up experience", partOfSpeech: "verb" },
    { ja: "即戦力", kana: "そくせんりょく", romaji: "sokusenryoku", en: "immediate contributor", partOfSpeech: "noun" },
    { ja: "根回し", kana: "ねまわし", romaji: "nemawashi", en: "quiet behind-the-scenes consensus building", partOfSpeech: "noun / suru-verb" },
    { ja: "折衷案", kana: "せっちゅうあん", romaji: "secchuuan", en: "compromise proposal", partOfSpeech: "noun" },
    { ja: "報連相", kana: "ほうれんそう", romaji: "hourensou", en: "reporting, contacting, consulting", partOfSpeech: "noun" },
    { ja: "敬意を払う", kana: "けいいをはらう", romaji: "keii o harau", en: "to pay respect to", partOfSpeech: "verb phrase" },
    { ja: "貢献する", kana: "こうけんする", romaji: "kouken suru", en: "to contribute to", partOfSpeech: "verb" },
    { ja: "逆質問", kana: "ぎゃくしつもん", romaji: "gyaku shitsumon", en: "candidate's reverse questions", partOfSpeech: "noun" },
    { ja: "ご縁", kana: "ごえん", romaji: "goen", en: "fortuitous connection / chance match", partOfSpeech: "noun" },
    { ja: "気を引き締める", kana: "きをひきしめる", romaji: "ki o hikishimeru", en: "to brace oneself / focus one's mind", partOfSpeech: "verb phrase" },
  ],
};

export const JOB_INTERVIEW_NODES: Record<string, DialogueNode> = {
  // Turn 1: Corporate Waiting Lounge — HR Rep Sato
  "interview-node-1-lounge": {
    id: "interview-node-1-lounge",
    speakerNameJa: "佐藤（人事担当）",
    speakerNameEn: "Sato (HR Coordinator)",
    speakerRoleEn: "HR Talent Partner",
    speakerAvatar: "👩🏻‍💼",
    characterKey: "sato",
    npcTextJa:
      "（開始十分前に受付ラウンジへ到着すると、人事の佐藤さんが笑顔で案内してくれました。）本日はお越しいただきありがとうございます。最終面接は開発の川口と取締役の松本が担当いたします。準備が整い次第お呼びしますね。",
    npcReadingHiragana:
      "（かいしじゅっぷんまえにうけつけラウンジへとうちゃくすると、じんじのさとうさんがえがおであんないしてくれました。）ほんじつはおこしいただきありがとうございます。さいしゅうめんせつはかいはつのかわぐちととりしまりやくのまつもとがたんとういたします。じゅんびがととのいしだいおよびしますね。",
    npcRomaji:
      "(Kaishi juppun mae ni uketsuke raunji e touchaku suru to, jinji no Satou-san ga egao de annai shite kuremashita.) Honjitsu wa okoshi itadaki arigatou gozaimasu. Saishuu mensetsu wa kaihatsu no Kawaguchi to torishimariyaku no Matsumoto ga tantou itashimasu. Junbi ga totonoi shidai oyobi shimasu ne.",
    npcTextEn:
      "(Arriving ten minutes early at the waiting lounge, HR Rep Sato greets you warmly.) Thank you for coming today. Engineering Manager Kawaguchi and Managing Director Matsumoto will conduct your final interview. We'll call you in as soon as they're ready.",
    speakerVoiceId: 14,
    expression: "neutral",
    backgroundKey: "corp-waiting-lounge",
    choices: [
      {
        id: "ji1-respectful-ready",
        textJa:
          "本日は貴重なお時間をいただき誠にありがとうございます。お呼びいただくまで、こちらで静かにお待ちいたします。",
        readingHiragana:
          "ほんじつはきちょうなおじかんをいただきまことにありがとうございます。およびいただくまで、こちらでしずかにおまちいたします。",
        romaji:
          "Honjitsu wa kichou na ojikan o itadaki makoto ni arigatou gozaimasu. Oyobi itadaku made, kochira de shizuka ni omachi itashimasu.",
        textEn:
          "Thank you very much for granting me your valuable time today. I will wait quietly right here until you call me.",
        tier: "respectful",
        points: 100,
        feedbackJa:
          "面接は受付からすでに始まっています。落ち着いた丁寧な姿勢が人事担当にも好印象です。",
        feedbackEn:
          "Poised and attentive—in Japan, interview assessment starts the moment you greet HR in the lounge.",
        nextNodeId: "interview-node-2a-door-entry",
      },
      {
        id: "ji1-polite-nervous",
        textJa:
          "はい、よろしくお願いいたします。少し緊張していますが、精一杯頑張ります。",
        readingHiragana:
          "はい、よろしくおねがいいたします。すこしきんちょうしていますが、せいいっぱいがんばります。",
        romaji:
          "Hai, yoroshiku onegai itashimasu. Sukoshi kinchou shite imasu ga, seiippai ganbarimasu.",
        textEn:
          "Yes, please look after me. I'm a little nervous, but I'll do my very best.",
        tier: "polite",
        points: 75,
        feedbackJa:
          "素直で礼儀正しい受け答えです。緊張しつつも誠実さが伝わります。",
        feedbackEn:
          "Sincere and polite. Expressing mild nerves while staying courteous makes a pleasant impression.",
        nextNodeId: "interview-node-2a-door-entry",
      },
      {
        id: "ji1-casual-comments",
        textJa:
          "どうも！あ、ここの会社って私服の人が多いんですね。雰囲気ゆるそうで安心しました！",
        readingHiragana:
          "どうも！あ、ここのかいしゃってしふくのひとがおおいんですね。ふんいきゆるそうであんしんしました！",
        romaji:
          "Doumo! A, koko no kaisha tte shifuku no hito ga ooi n desu ne. Fun'iki yurusou de anshin shimashita!",
        textEn:
          "Hey there! Oh, lots of people here wear casual clothes, huh? Glad the vibe seems super chill!",
        tier: "casual",
        points: 20,
        feedbackJa:
          "IT企業であっても「雰囲気がゆるそう」と初対面の人事に軽く言うのは、プロ意識に欠けると見なされます。",
        feedbackEn:
          "Calling a prospective employer 'super chill' ('yurusou') in front of HR looks overly casual, even at a tech firm.",
        nextNodeId: "interview-node-2b-lounge-caution",
      },
    ],
  },

  // Turn 2A: Entering the room & Delivering Self-PR
  "interview-node-2a-door-entry": {
    id: "interview-node-2a-door-entry",
    speakerNameJa: "川口（開発マネージャー）",
    speakerNameEn: "Kawaguchi (Eng. Manager)",
    speakerRoleEn: "Engineering Manager",
    speakerAvatar: "🧑🏻‍💻",
    characterKey: "kawaguchi",
    npcTextJa:
      "（ドアを三回ノックし、「どうぞ」の声で入室します。着席を促され、開発マネージャーの川口さんが切り出しました。）お待たせしました。では早速ですが、これまでのご経歴を踏まえて一分ほどで自己PRをお願いします。",
    npcReadingHiragana:
      "（ドアをさんかいノックし、「どうぞ」のこえでにゅうしつします。ちゃくせきをうながされ、かいはつマネージャーのかわぐちさんがきりだしました。）おまたせしました。ではさっそくですが、これまでのごけいれきをふまえていっぷんほどでじこピーアールをおねがいします。",
    npcRomaji:
      "(Doa o sankai nokku shi, 'Douzo' no koe de nyuushitsu shimasu. Chakuseki o unagasare, kaihatsu maneejaa no Kawaguchi-san ga kiridashimashita.) Omatase shimashita. De wa sassoku desu ga, kore made no gokeireki o fumaete ippun hodo de jiko pii-aaru o onegai shimasu.",
    npcTextEn:
      "(You knock three times, wait for 'Please come in,' and enter. After inviting you to sit, Manager Kawaguchi begins.) Thank you for waiting. Right away, could you give us a one-minute Self-PR highlighting your career background?",
    speakerVoiceId: 11,
    expression: "neutral",
    backgroundKey: "interview-room-door",
    choices: [
      {
        id: "ji2a-respectful-pr",
        textJa:
          "失礼いたします。前職では多国籍チームと顧客の橋渡しを担い、要件整理の見直しで納期遅延を三割削減いたしました。この調整力と課題解決力を御社でも即戦力として活かしたく存じます。",
        readingHiragana:
          "しつれいいいたします。ぜんしょくではたこくせきチームとこきゃくのはしわたしをになぃ、ようけんせいりのみなおしでのうきちえんをさんわりさくげんいたしました。このちょうせいりょくとかだいかいけつりょくをおんしゃでもそくせんりょくとしていかしたくぞんじます。",
        romaji:
          "Shitsurei itashimasu. Zenshoku de wa takokuseki chiimu to kokyaku no hashiwatashi o ninai, youken seiri no minaoshi de nouki chien o sanwari sakugen itashimashita. Kono chouseiryoku to kadai kaiketsuryoku o onsha de mo sokusenryoku to shite ikashitaku zonjimasu.",
        textEn:
          "Thank you. At my previous company I bridged multinational teams and clients, cutting delivery delays by 30% through spec refinement. I hope to bring this coordination and problem-solving strength to your firm as an immediate contributor.",
        tier: "respectful",
        points: 100,
        feedbackJa:
          "完璧な構成です！結論→数字を伴う実績→「御社」への貢献が簡潔に伝わり、川口マネージャーも興味深そうにメモを取っています。",
        feedbackEn:
          "Crisp N2 Self-PR structure: role, quantified 30% impact, spoken 'onsha', and clear value proposition for the hiring team.",
        nextNodeId: "interview-node-3a-reason-deep",
      },
      {
        id: "ji2a-awkward-kisha-ramble",
        textJa:
          "えっと、貴社のサービスが昔から本当に大好きでして！プログラミングも英語も一通りできますし、頑張り屋なところが長所です！",
        readingHiragana:
          "えっと、きしゃのサービスがむかしからほんとうにだいすきでして！プログラミングもえいごもひととおりできますし、がんばりやなところがちょうしょです！",
        romaji:
          "Etto, kisha no saabisu ga mukashi kara hontou ni daisuki deshite! Puroguramingu mo eigo mo hitotoori dekimasu shi, ganbariya na tokoro ga chousho desu!",
        textEn:
          "Um, I've genuinely loved your company's ('kisha') services forever! I can do programming and English pretty well, and my strength is being a hard worker!",
        tier: "awkward",
        points: 35,
        feedbackJa:
          "口頭面接では「貴社」ではなく「御社」を使います。また、具体実績が抜けて抽象的な自己アピールになってしまいました。",
        feedbackEn:
          "Note the classic Japanese interview rule: use 'onsha' when speaking ('kisha' is for writing!), and anchor your pitch with concrete outcomes.",
        nextNodeId: "interview-node-3b-reason-probe",
      },
      {
        id: "ji2a-rude-salary-first",
        textJa:
          "詳しい職歴は書類の通りです。それより、御社の技術環境と私の想定年収レンジが合うか先に確認できますか？",
        readingHiragana:
          "くわしいしょくれきはしょるいのとおりです。それより、おんしゃのぎじゅつかんきょうとわたしのそうていねんしゅうレンジがあうかさきにかくにんできますか？",
        romaji:
          "Kuwashii shokureki wa shorui no toori desu. Sore yori, onsha no gijutsu kankyou to watashi no soutei nenshuu renji ga au ka saki ni kakunin dekimasu ka?",
        textEn:
          "My detailed work history is on my CV. More importantly, can we confirm upfront whether your tech stack and target salary range fit mine?",
        tier: "rude",
        points: -50,
        feedbackJa:
          "日本の採用面接の冒頭で自己PRを拒み条件面を突きつける態度は、協調性を欠くとみなされ厳しく見られます。",
        feedbackEn:
          "Refusing the opening Self-PR to lead with salary demands alienates the panel immediately.",
        nextNodeId: "interview-node-3c-cold-skeptic",
      },
    ],
  },

  // Turn 2B: Recovery after casual lounge remark
  "interview-node-2b-lounge-caution": {
    id: "interview-node-2b-lounge-caution",
    speakerNameJa: "佐藤（人事担当）",
    speakerNameEn: "Sato (HR Coordinator)",
    speakerRoleEn: "HR Talent Partner",
    speakerAvatar: "👩🏻‍💼",
    characterKey: "sato",
    npcTextJa:
      "（佐藤さんは微笑みを保ちつつも、少し声を落として助言してくれました。）……弊社は服装こそ自由ですが、取締役の松本は礼儀や相手への敬意を非常に大切にしております。お呼びしますので、気持ちを改めてお入りくださいね。",
    npcReadingHiragana:
      "（さとうさんはほほえみをたもちつつも、すこしこえをおとしてじょげんしてくれました。）……へいしゃはふくそうこそじゆうですが、とりしまりやくのまつもとはれいぎやあいてへのけいいをひじょうにたいせつにしております。およびしますので、きもちをあらためておはいりくださいね。",
    npcRomaji:
      "(Satou-san wa hohoemi o tamochitsutsu mo, sukoshi koe o otoshite jogen shite kuremashita.) ...Heisha wa fukusou koso jiyuu desu ga, torishimariyaku no Matsumoto wa reigi ya aite e no keii o hijou ni taisetsu ni shite orimasu. Oyobi shimasu node, kimochi o aratamete ohairi kudasai ne.",
    npcTextEn:
      "(Maintaining a polite smile, Sato lowers her voice to offer advice.) ...Our dress code may be casual, yes, but Director Matsumoto places immense value on manners and respect. I'll call you in now, so please compose yourself before entering.",
    speakerVoiceId: 14,
    expression: "troubled",
    backgroundKey: "corp-waiting-lounge",
    choices: [
      {
        id: "ji2b-respectful-composure",
        textJa:
          "ご助言ありがとうございます。気を引き締めて参ります。（入室後）失礼いたします！本日は貴重なお時間を頂戴し、心より感謝申し上げます。",
        readingHiragana:
          "ごじょげんありがとうございます。きをひきしめてまいります。（にゅうしつご）しつれいいたします！ほんじつはきちょうなおじかんをちょうだいし、こころよりかんしゃもうしあげます。",
        romaji:
          "Gojogen arigatou gozaimasu. Ki o hikishimete mairimasu. (Nyuushitsu-go) Shitsurei itashimasu! Honjitsu wa kichou na ojikan o choudai shi, kokoro yori kansha moushiagemasu.",
        textEn:
          "Thank you for the reminder—I will pull myself together. (Entering) Excuse me! Thank you deeply for your time today.",
        tier: "respectful",
        points: 95,
        feedbackJa:
          "人事の助言をすぐ活かし、入室時に背筋を伸ばした美しい挨拶で印象を立て直しました。",
        feedbackEn:
          "Quick adaptation: heeding HR's advice resets the room as you step in cleanly.",
        nextNodeId: "interview-node-3a-reason-deep",
      },
      {
        id: "ji2b-awkward-flat",
        textJa:
          "あ、そうなんですね。気をつけます。……（入室後）あ、失礼します、よろしくお願いします。",
        readingHiragana:
          "あ、そうなんですね。きをつけます。……（にゅうしつご）あ、しつれいします、よろしくおねがいします。",
        romaji:
          "A, sou nan desu ne. Ki o tsukemasu. ...(Nyuushitsu-go) A, shitsurei shimasu, yoroshiku onegai shimasu.",
        textEn:
          "Oh, I see. I'll watch out. ...(Entering) Um, excuse me, nice to meet you.",
        tier: "awkward",
        points: 35,
        feedbackJa:
          "切り替えが不十分なまま入室してしまい、役員陣からやや硬い質問が飛ぶことになります。",
        feedbackEn:
          "Only half-recovered, leading to tighter scrutiny once seated in the boardroom.",
        nextNodeId: "interview-node-3b-reason-probe",
      },
    ],
  },

  // Turn 3A: Director Matsumoto probes job-change reason
  "interview-node-3a-reason-deep": {
    id: "interview-node-3a-reason-deep",
    speakerNameJa: "松本取締役",
    speakerNameEn: "Director Matsumoto",
    speakerRoleEn: "Managing Director",
    speakerAvatar: "👨🏻‍💼",
    characterKey: "matsumoto",
    npcTextJa:
      "（取締役の松本さんが履歴書に目を通しながら、核心を突く質問を投げかけます。）素晴らしいご経験ですね。ただ、前職はまだ二年目ですが、なぜこのタイミングで転職を決断されたのですか？",
    npcReadingHiragana:
      "（とりしまりやくのまつもとさんがりれきしょにめをとおしながら、かくしんをつくしつもんをなげかけます。）すばらしいごけいけんですね。ただ、ぜんしょくはまだにねんめですが、なぜこのタイミングでてんしょくをけつだんされたのですか？",
    npcRomaji:
      "(Torishimariyaku no Matsumoto-san ga rirekisho ni me o tooshi nagara, kakushin o tsuku shitsumon o nagekakemasu.) Subarashii gokeiken desu ne. Tada, zenshoku wa mada ninenme desu ga, naze kono taimingu de tenshoku o ketsudan sareta no desu ka?",
    npcTextEn:
      "(Director Matsumoto scans your resume and asks a pointed question.) Impressive background. However, you're only two years into your previous role—why decide to change jobs right now?",
    speakerVoiceId: 13,
    expression: "thinking",
    backgroundKey: "executive-interview-room",
    choices: [
      {
        id: "ji3a-respectful-forward-vision",
        textJa:
          "前職では受託開発の基礎を深く学ばせていただきましたが、より自社サービスの企画から改善まで一貫して関わりたいという思いが強まり、御社の事業領域で腰を据えて挑戦したく志望いたしました。",
        readingHiragana:
          "ぜんしょくではじゅたくかいはつのきそをふかくまなばせていただきましたが、よりじしゃサービスのきかくからかいぜんまでいっかんしてかかわりたいというおもいがつよまり、おんしゃのじぎょうりょういきでこしをすえてちょうせんしたくしぼういたしました。",
        romaji:
          "Zenshoku de wa jutaku kaihatsu no kiso o fukaku manabasete itadakimashita ga, yori jisha saabisu no kikaku kara kaizen made ikkan shite kakawaritai to iu omoi ga tsuyomari, onsha no jigyou ryouiki de koshi o suete chousen shitaku shibou itashimashita.",
        textEn:
          "At my previous firm I gained strong foundations in contract development, yet my desire grew to stay with an in-house product from planning through iteration—and I want to commit long-term to that challenge in your domain.",
        tier: "respectful",
        points: 100,
        feedbackJa:
          "前職への感謝を伝えつつ、前向きなキャリア軸と「腰を据えて働く」定着力までアピールできた模範解答です。",
        feedbackEn:
          "Textbook mid-career answer: honors your previous company, avoids negativity, and shows long-term commitment ('koshi o suete').",
        nextNodeId: "interview-node-4a-conflict-nemawashi",
      },
      {
        id: "ji3a-polite-growth",
        textJa:
          "新しい技術環境で自分の市場価値をさらに試し、より幅広い業務に携わりたいと考えて転職を決意しました。",
        readingHiragana:
          "あたらしいぎじゅつかんきょうでじぶんのしじょうかちをさらにためし、よりひろばいぎょうむにたずさわりたいとかんがえててんしょくをけついしました。",
        romaji:
          "Atarashii gijutsu kankyou de jibun no shijou kachi o sara ni tameshi, yori hiroi gyoumu ni tazusawaritai to kangaete tenshoku o ketsui shimashita.",
        textEn:
          "I decided to move so I could test my market value in a newer tech environment and take on a broader range of work.",
        tier: "polite",
        points: 70,
        feedbackJa:
          "自然な答えですが、「また別の環境が見つかったら辞めるのでは」という懸念を少し残す表現です。",
        feedbackEn:
          "Honest and polite, though focusing on 'market value' can make directors wonder if you'll leave again soon.",
        nextNodeId: "interview-node-4a-conflict-nemawashi",
      },
      {
        id: "ji3a-awkward-badmouth-boss",
        textJa:
          "正直に申し上げますと、前職の上司が古い考え方で評価基準も不透明だったため、これ以上は成長できないと感じました。",
        readingHiragana:
          "しょうじきにもうしあげますと、ぜんしょくのじょうしがふるいかんがえかたでひょうかきじゅんもふとうめいだったため、これいじょうはせいちょうできないとかんじました。",
        romaji:
          "Shoujiki ni moushiagemasu to, zenshoku no joushi ga furui kangaekata de hyouka kijun mo futoumei datta tame, kore ijou wa seichou dekinai to kanjimashita.",
        textEn:
          "To be candid, my former manager was stuck in old ways with opaque evaluations, so I felt I couldn't grow there anymore.",
        tier: "awkward",
        points: 25,
        feedbackJa:
          "前職や上司への不満をそのまま口にすると、「入社後も他責にするのではないか」と警戒されてしまいます。",
        feedbackEn:
          "Badmouthing a former manager triggers a classic red flag: interviewers wonder if you will complain about them next.",
        nextNodeId: "interview-node-4b-attitude-check",
      },
    ],
  },

  // Turn 3B: Probing why THIS company specifically
  "interview-node-3b-reason-probe": {
    id: "interview-node-3b-reason-probe",
    speakerNameJa: "川口（開発マネージャー）",
    speakerNameEn: "Kawaguchi (Eng. Manager)",
    speakerRoleEn: "Engineering Manager",
    speakerAvatar: "🧑🏻‍💻",
    characterKey: "kawaguchi",
    npcTextJa:
      "（川口マネージャーがやや困惑した様子で尋ねます。）先ほどのお話ですと、少し志望動機が抽象的に感じられました。他社ではなく、なぜ「弊社で」働きたいのか具体的に教えていただけますか。",
    npcReadingHiragana:
      "（かわぐちマネージャーがややこんわくしたようすでたずねます。）さきほどのおはなしですと、すこししぼうどうきがちゅうしょうてきにかんじられました。たしゃではなく、なぜ「へいしゃで」はたらきたいのかぐたいてきにおしえていただけますか。",
    npcRomaji:
      "(Kawaguchi maneejaa ga yaya konwaku shita yousu de tazunemasu.) Sakihodo no ohanashi desu to, sukoshi shibou douki ga chuushouteki ni kanjiraremashita. Tasha de wa naku, naze 'heisha de' hatarakitai no ka gutaiteki ni oshiete itadakemasu ka.",
    npcTextEn:
      "(Kawaguchi looks slightly perplexed.) Your answer just now felt a bit abstract. Could you tell us specifically why you want to work at *our company*, rather than anywhere else?",
    speakerVoiceId: 11,
    expression: "confused",
    backgroundKey: "executive-interview-room",
    choices: [
      {
        id: "ji3b-respectful-research",
        textJa:
          "大変失礼いたしました。先月発表された御社の自治体向けDX事例を拝見し、現場の使いやすさを徹底して追求する姿勢に深く共感し、自身の調整力を活かしたいと考えたためです。",
        readingHiragana:
          "たいへんしつれいいいたしました。せんげつはっぴょうされたおんしゃのじちたいむけディーエックスじれいをはいけんし、げんばのつかいやすさをてっていしてついきゅうするしせいにふかくきょうかんし、じしんのちょうせいりょくをいかしたいとかんがえたためです。",
        romaji:
          "Taihen shitsurei itashimashita. Sengetsu happyou sareta onsha no jichitai-muke dii-ekkusu jirei o haiken shi, genba no tsukaiyasusa o tettei shite tsuikyuu suru shisei ni fukaku kyoukan shi, jishin no chouseiryoku o ikashitai to kangaeta tame desu.",
        textEn:
          "Excuse my lack of clarity. Reading last month's municipal DX case study, I deeply admired your dedication to frontline usability and felt my coordination skills fit that mission directly.",
        tier: "respectful",
        points: 100,
        feedbackJa:
          "企業研究に基づく具体的な事例（自治体DX）を挙げ、見事に挽回しました！川口さんも納得の表情です。",
        feedbackEn:
          "Excellent recovery: citing a specific company case study proves genuine research and commitment.",
        nextNodeId: "interview-node-4a-conflict-nemawashi",
      },
      {
        id: "ji3b-awkward-perks",
        textJa:
          "御社は市場での成長性が高く、リモートワークなど働き方の条件も魅力的だと伺ったからです。",
        readingHiragana:
          "おんしゃはしじょうでのせいちょうせいがたかく、リモートワークなどはたらきかたのじょうけんもみりょくてきだとうかがったからです。",
        romaji:
          "Onsha wa shijou de no seichousei ga takaku, rimooto waaku nado hatarakikata no jouken mo miryokuteki da to ukagatta kara desu.",
        textEn:
          "I heard your company has strong growth potential and attractive perks like remote work.",
        tier: "awkward",
        points: 35,
        feedbackJa:
          "条件面だけを挙げると「入社後にどう貢献したいか」が見えず、役員面接では物足りなく映ります。",
        feedbackEn:
          "Focusing only on perks makes the panel doubt your contribution mindset.",
        nextNodeId: "interview-node-4b-attitude-check",
      },
      {
        id: "ji3b-rude-hedging",
        textJa:
          "他社も並行して受けていますが、最終的に一番条件が合うところで決めようと思っています。",
        readingHiragana:
          "たしゃもへいこうしてうけていますが、さいしゅうてきにいちばんじょうけんがあうところできめようとおもっています。",
        romaji:
          "Tasha mo heikou shite ukete imasu ga, saishuuteki ni ichiban jouken ga au tokoro de kimeyou to omotte imasu.",
        textEn:
          "I'm interviewing elsewhere in parallel too, and I'll just pick whichever place gives the best deal.",
        tier: "rude",
        points: -50,
        feedbackJa:
          "他社と比較していることを率直に言いすぎると、最終面接の場では志望度が低いと判断されます。",
        feedbackEn:
          "Saying you'll just go wherever pays highest signals zero genuine interest during a final interview.",
        nextNodeId: "interview-node-end-failure",
      },
    ],
  },

  // Turn 3C: Recovery from early salary remark
  "interview-node-3c-cold-skeptic": {
    id: "interview-node-3c-cold-skeptic",
    speakerNameJa: "松本取締役",
    speakerNameEn: "Director Matsumoto",
    speakerRoleEn: "Managing Director",
    speakerAvatar: "👨🏻‍💼",
    characterKey: "matsumoto",
    npcTextJa:
      "（松本取締役が眼鏡越しに厳しく見据えます。）……採用条件はもちろん大切ですが、まずは互いの価値観やチームに合うかを見極める場です。その点の認識はいかがでしょうか。",
    npcReadingHiragana:
      "（まつもととりしまりやくがめがねごしにきびしくみすえます。）……さいようじょうけんはもちろんたいせつですが、まずはたがいのかちかんやチームにあうかをみきわめるばです。そのてんのにんしきはいかがでしょうか。",
    npcRomaji:
      "(Matsumoto torishimariyaku ga meganegoshi ni kibishiku misuemasu.) ...Saiyou jouken wa mochiron taisetsu desu ga, mazu wa tagai no kachikan ya chiimu ni au ka o mikiwameru ba desu. Sono ten no ninshiki wa ikaga deshou ka.",
    npcTextEn:
      "(Director Matsumoto fixes a sharp gaze over his glasses.) ...Employment terms matter, of course, but first this is a place to judge mutual values and team fit. What is your view on that?",
    speakerVoiceId: 13,
    expression: "stern",
    backgroundKey: "executive-interview-room",
    choices: [
      {
        id: "ji3c-respectful-reset",
        textJa:
          "ご指摘の通りであり、不躾な切り出し方をして大変失礼いたしました。まずは私が御社のチームでどのような価値を提供できるかをお話しさせてください。",
        readingHiragana:
          "ごしてきのとおりであり、ぶしつけなきりだしかたをしてたいへんしつれいいいたしました。まずはわたしがおんしゃのチームでどのようなかちをていきょうできるかをおはなしさせてください。",
        romaji:
          "Goshiteki no toori de ari, bushitsuke na kiridashikata o shite taihen shitsurei itashimashita. Mazu wa watashi ga onsha no chiimu de dono you na kachi o teikyou dekiru ka o ohanashi sasete kudasai.",
        textEn:
          "You are completely right, and my abrupt opening was rude—please accept my apology. First, let me share what value I can offer your team.",
        tier: "respectful",
        points: 90,
        feedbackJa:
          "「不躾（ぶしつけ）」というN1/N2語彙で自分の非を的確に認め、なんとか軌道修正できました。",
        feedbackEn:
          "Admitting your 'bushitsuke' (impertinent) start gracefully gives you a narrow chance to recover.",
        nextNodeId: "interview-node-4b-attitude-check",
      },
      {
        id: "ji3c-rude-insist",
        textJa:
          "ミスマッチを防ぐためにも、最初に給与と働き方を聞くのは合理的だと思うのですが。",
        readingHiragana:
          "ミスマッチをふせぐためにも、さいしょにきゅうよとはたらきかたをきくのはごうりてきだとおもうのですが。",
        romaji:
          "Misumatchi o fusegu tame ni mo, saisho ni kyuuyo to hatarakikata o kiku no wa gouriteki da to omou no desu ga.",
        textEn:
          "Even to prevent mismatches, asking salary and work style first seems completely logical to me.",
        tier: "rude",
        points: -50,
        feedbackJa:
          "役員の助言に真っ向から反論し、日本企業での協調性が期待できないとして面接終了となりました。",
        feedbackEn:
          "Clashing head-on with an executive over interview etiquette ends your candidacy immediately.",
        nextNodeId: "interview-node-end-failure",
      },
    ],
  },

  // Turn 4A: Senior-Junior conflict & Nemawashi culture question
  "interview-node-4a-conflict-nemawashi": {
    id: "interview-node-4a-conflict-nemawashi",
    speakerNameJa: "川口（開発マネージャー）",
    speakerNameEn: "Kawaguchi (Eng. Manager)",
    speakerRoleEn: "Engineering Manager",
    speakerAvatar: "🧑🏻‍💻",
    characterKey: "kawaguchi",
    npcTextJa:
      "（川口マネージャーが具体的な場面を想定して質問します。）実際にチームへ入ったとして、ベテランの先輩社員があなたの提案した新しい開発手法に難色を示した場合、どう乗り越えますか？",
    npcReadingHiragana:
      "（かわぐちマネージャーがぐたいてきなばめんをそうていしてしつもんします。）じっさいにチームへはいったとして、ベテランのせんぱいしゃいんがあなたのていあんしたあたらしいかいはつしゅほうになんしょくをしめしたばあい、どうのりこえますか？",
    npcRomaji:
      "(Kawaguchi maneejaa ga gutaiteki na bamen o soutei shite shitsumon shimasu.) Jissai ni chiimu e haitta to shite, beteran no senpai shain ga anata no teian shita atarashii kaihatsu shuhou ni nanshoku o shimeshita baai, dou norikoemasu ka?",
    npcTextEn:
      "(Kawaguchi poses a practical scenario.) Suppose once you join the team, a veteran senior colleague resists a new engineering workflow you proposed. How would you overcome that?",
    speakerVoiceId: 11,
    expression: "thinking",
    backgroundKey: "executive-interview-room",
    choices: [
      {
        id: "ji4a-respectful-nemawashi",
        textJa:
          "まずは先輩が長年培われた運用への敬意を払い、個別にお話を伺ってご懸念の背景を理解します。その上で小規模な検証データを共有し、双方が納得できる折衷案をご相談したいです。",
        readingHiragana:
          "まずはせんぱいがながねんつちかわれたうんようへのけいいをはらい、こべつにおはなしをうかがってごけねんのはいけいをりかいします。そのうえでしょうきぼなけんしょうデータをきょうゆうし、そうほうがなっとくできるせっちゅうあんをごそうだんしたいです。",
        romaji:
          "Mazu wa senpai ga naganen tsuchikawareta un'you e no keii o harai, kobetsu ni ohanashi o ukagatte gokenen no haikei o rikai shimasu. Sono ue de shoukibo na kenshou deeta o kyouyuu shi, souhou ga nattoku dekiru secchuuan o gosoudan shitai desu.",
        textEn:
          "First I would pay respect to the practices the senior colleague built over years and talk privately to understand their concerns. Then I'd share small pilot data and explore a mutually agreeable compromise.",
        tier: "respectful",
        points: 100,
        feedbackJa:
          "日本の現場で理想とされる「敬意＋事前の対話（根回し）＋データによる妥協点探し」が見事に両立しています！",
        feedbackEn:
          "Ideal cultural mastery: respecting institutional knowledge, holding 1-on-1 alignment ('nemawashi'), and bridging with pilot metrics.",
        nextNodeId: "interview-node-5a-reverse-question",
      },
      {
        id: "ji4a-polite-escalate",
        textJa:
          "現場同士で対立を深めるのは避けたいので、双方の意見を整理した上で、川口マネージャーにご判断を仰ぎます。",
        readingHiragana:
          "げんばどうしでたいりつをふかめるのはさけたいので、そうほうのいけんをせいりしたうえで、かわぐちマネージャーにごはんだんをあおぎます。",
        romaji:
          "Genba doushi de tairitsu o fukameru no wa saketai node, souhou no iken o seiri shita ue de, Kawaguchi maneejaa ni gohandan o aogimasu.",
        textEn:
          "To avoid deepening friction among peers, I'd organize both viewpoints and ask you as Manager for guidance.",
        tier: "polite",
        points: 70,
        feedbackJa:
          "穏当ですが、まずは当事者間で歩み寄る主体性をもう少し見せると、中堅採用としてさらに魅力的になります。",
        feedbackEn:
          "Safe and polite, though mid-career hires are usually expected to try aligning peers directly before escalating.",
        nextNodeId: "interview-node-5a-reverse-question",
      },
      {
        id: "ji4a-casual-confront",
        textJa:
          "古いやり方は効率が悪いので、全体会議の場で論理的なメリットを示して説得します。",
        readingHiragana:
          "ふるいやりかたはこうりつがわるいので、ぜんたいかいぎのばでろんりてきなメリットをしめしてせっとくします。",
        romaji:
          "Furui yarikata wa kouritsu ga warui node, zentai kaigi no ba de ronriteki na meritto o shimeshite settoku shimasu.",
        textEn:
          "Old methods are inefficient, so I'd prove the logical merits in an all-hands meeting to persuade them.",
        tier: "casual",
        points: 20,
        feedbackJa:
          "全体会議の場で先輩の顔を潰すやり方は、日本の組織文化では激しい摩擦を招くと警戒されます。",
        feedbackEn:
          "Challenging a veteran publicly in a group meeting ('saving face' violation) raises red flags over teamwork.",
        nextNodeId: "interview-node-4b-attitude-check",
      },
    ],
  },

  // Turn 4B: Teamwork & Humility deep probe
  "interview-node-4b-attitude-check": {
    id: "interview-node-4b-attitude-check",
    speakerNameJa: "松本取締役",
    speakerNameEn: "Director Matsumoto",
    speakerRoleEn: "Managing Director",
    speakerAvatar: "👨🏻‍💼",
    characterKey: "matsumoto",
    npcTextJa:
      "（松本取締役が真剣な眼差しで問いかけます。）……当社は個人の突出したスキル以上に、周囲を巻き込む謙虚さとコミュニケーションを重視しています。異なる価値観のメンバーと信頼を築くために何を意識していますか。",
    npcReadingHiragana:
      "（まつもととりしまりやくがしんけんなまなざしでといかけます。）……とうしゃはこじんのとっしゅつしたスキルいじょうに、しゅういをまきこむけんきょさとコミュニケーションをじゅうししています。ことなるかちかんのメンバーとしんらいをきずくためになにをいしきしていますか。",
    npcRomaji:
      "(Matsumoto torishimariyaku ga shinken na manazashi de toikakemasu.) ...Tousha wa kojin no tosshutsu shita sukiru ijou ni, shuui o makikomu kenkyosa to komyunikeeshon o juushi shite imasu. Kotonaru kachikan no menbaa to shinrai o kizuku tame ni nani o ishiki shite imasu ka.",
    npcTextEn:
      "(Director Matsumoto asks earnestly.) ...Beyond individual brilliance, we prioritize humility that brings others along and strong communication. What do you focus on to build trust with colleagues who think differently?",
    speakerVoiceId: 13,
    expression: "stern",
    backgroundKey: "executive-interview-room",
    choices: [
      {
        id: "ji4b-respectful-hourensou",
        textJa:
          "日々の報連相を徹底し、相手の背景や意図を先入観なく汲み取るよう努めています。意見が異なる時ほどこまめに認識を合わせ、小さな約束を必ず守ることを重視しています。",
        readingHiragana:
          "ひびのほうれんそうをてっていし、あいてのはいけいやいとをせんにゅうかんなくくみとるようつとめています。いけんがことなるときほどこまめににんしきをあわせ、ちいさなやくそくをかならずまもることをじゅうししています。",
        romaji:
          "Hibi no hourensou o tettei shi, aite no haikei ya ito o sennyuukan naku kumitoru you tsutomete imasu. Iken ga kotonaru toki hodo komame ni ninshiki o awase, chiisana yakusoku o kanarazu mamoru koto o juushi shite imasu.",
        textEn:
          "I practice thorough daily hourensou and try to grasp others' intent without preconceptions. Especially when opinions differ, I sync expectations often and keep every small promise.",
        tier: "respectful",
        points: 100,
        feedbackJa:
          "実務に根ざした誠実な回答で、松本取締役の警戒心を大きく和らげることができました。",
        feedbackEn:
          "Grounded, humble, and actionable—reassures Director Matsumoto about your collaborative spirit.",
        nextNodeId: "interview-node-5b-last-chance",
      },
      {
        id: "ji4b-awkward-obedient",
        textJa:
          "私はあまり自己主張が強い方ではないので、基本は先輩や上司の方針に黙って従うようにしています。",
        readingHiragana:
          "わたしはあまりじこしゅちょうがつよいほうではないので、きほんはせんぱいやじょうしのほうしんにだまってしたがうようにしています。",
        romaji:
          "Watashi wa amari jiko shuchou ga tsuyoi hou de wa nai node, kihon wa senpai ya joushi no houshin ni damatte shitagau you ni shite imasu.",
        textEn:
          "I'm not very assertive, so mostly I quietly go along with whatever seniors or bosses decide.",
        tier: "awkward",
        points: 30,
        feedbackJa:
          "ただ黙って従うだけでは、自律的な問題提起ができる即戦力として不安視されます。",
        feedbackEn:
          "Pure passive obedience doesn't show the proactive ownership expected of a mid-career hire.",
        nextNodeId: "interview-node-5b-last-chance",
      },
      {
        id: "ji4b-rude-results-only",
        textJa:
          "結局は数字と成果を出せば周りはついてくると思いますので、まずは自分の結果に集中したいです。",
        readingHiragana:
          "けっきょくはすうじとせいかをだせばまわりはついてくるとおもいますので、まずはじぶんのけっかにしゅうちゅうしたいです。",
        romaji:
          "Kekkyoku wa suuji to seika o daseba mawari wa tsuite kuru to omoimasu node, mazu wa jibun no kekka ni shuuchuu shitai desu.",
        textEn:
          "At the end of the day people follow numbers and results, so I prefer focusing on my own output first.",
        tier: "rude",
        points: -50,
        feedbackJa:
          "組織の一体感より個人成果だけを優先する姿勢は、この企業の社風と噛み合わないと判断されました。",
        feedbackEn:
          "Rejecting team cohesion in favor of lone-wolf output conflicts directly with the company's stated values.",
        nextNodeId: "interview-node-end-failure",
      },
    ],
  },

  // Turn 5A: Reverse question on strong path — Elevator Terrace
  "interview-node-5a-reverse-question": {
    id: "interview-node-5a-reverse-question",
    speakerNameJa: "松本取締役",
    speakerNameEn: "Director Matsumoto",
    speakerRoleEn: "Managing Director",
    speakerAvatar: "👨🏻‍💼",
    characterKey: "matsumoto",
    npcTextJa:
      "（和やかな雰囲気のまま面接が終盤に差し掛かり、出口のテラス側へ移動しながら松本取締役が微笑みます。）こちらからの質問は以上です。最後に、佐藤さんから何か逆質問はありますか？",
    npcReadingHiragana:
      "（なごやかなふんいきのままめんせつがしゅうばんにさしかかり、でぐちのテラスがわへいどうしながらまつもととりしまりやくがほほえみます。）こちらからのしつもんはいじょうです。さいごに、さとうさんからなにかぎゃくしつもんはありますか？",
    npcRomaji:
      "(Nagoyaka na fun'iki no mama mensetsu ga shuuban ni sashikakari, deguchi no terasu-gawa e idou shinagara Matsumoto torishimariyaku ga hohoemimasu.) Kochira kara no shitsumon wa ijou desu. Saigo ni, Satou-san kara nanika gyaku shitsumon wa arimasu ka?",
    npcTextEn:
      "(As the interview concludes warmly while walking out past the office terrace, Director Matsumoto smiles.) That covers all our questions. Finally, do you have any questions for us?",
    speakerVoiceId: 13,
    expression: "happy",
    backgroundKey: "office-terrace-exit",
    choices: [
      {
        id: "ji5a-respectful-onboarding",
        textJa:
          "はい、ありがとうございます。もしご縁をいただき入社した場合、最初の三ヶ月間でチームから特に期待される成果や乗り越えるべき課題がございましたら、ぜひお伺いできますでしょうか。",
        readingHiragana:
          "はい、ありがとうございます。もしごえんをいただきにゅうしゃしたばあい、さいしょのさんかげつかんでチームからとくにきたいされるせいかやのりこえるべきかだいがございましたら、ぜひおうかがいできますでしょうか。",
        romaji:
          "Hai, arigatou gozaimasu. Moshi goen o itadaki nyuusha shita baai, saisho no sankagetsu-kan de chiimu kara tokuni kitai sareru seika ya norikoeru beki kadai ga gozaimashitara, zehi oukagai dekimasu deshou ka.",
        textEn:
          "Yes, thank you. If I am fortunate enough to join, what outcomes or early challenges would the team hope to see me address in my first three months?",
        tier: "respectful",
        points: 100,
        feedbackJa:
          "最高の逆質問です！入社後の活躍を見据えた主体的な問いかけに、役員も身を乗り出して答えてくれました。",
        feedbackEn:
          "Gold-standard reverse question: forward-looking, humble ('moshi goen o itadaki'), and focused on early contribution.",
        nextNodeId: "interview-node-end-perfect",
      },
      {
        id: "ji5a-polite-culture",
        textJa:
          "ありがとうございます。開発チーム内の勉強会や知識共有は、普段どのような雰囲気で行われていますか？",
        readingHiragana:
          "ありがとうございます。かいはつチームないのべんきょうかいやちしききょうゆうは、ふだんどのようなふんいきでおこなわれていますか？",
        romaji:
          "Arigatou gozaimasu. Kaihatsu chiimu-nai no benkyoukai ya chishiki kyouyuu wa, fudan dono you na fun'iki de okonawarete imasu ka?",
        textEn:
          "Thank you. What is the usual atmosphere like for internal study sessions and knowledge sharing on the engineering team?",
        tier: "polite",
        points: 75,
        feedbackJa:
          "学習意欲とチーム協調性を示す好印象な質問です。",
        feedbackEn:
          "Friendly, positive question highlighting teamwork and continuous learning.",
        nextNodeId: "interview-node-end-success",
      },
      {
        id: "ji5a-awkward-overtime",
        textJa:
          "特に質問はありません。あ、念のため残業は月平均何時間くらいかだけ教えていただけますか？",
        readingHiragana:
          "とくにしつもんはありません。あ、ねんのためざんぎょうはつきへいきんなんじかんくらいかだけおしえていただけますか？",
        romaji:
          "Tokuni shitsumon wa arimasen. A, nen no tame zangyou wa tsuki heikin nanjikan kurai ka dake oshiete itadakemasu ka?",
        textEn:
          "No particular questions. Oh—just to check, roughly how many hours of overtime per month are typical?",
        tier: "awkward",
        points: 30,
        feedbackJa:
          "最後の最後に「質問なし＋残業時間だけ確認」で終わると、せっかくの熱意が少し薄れてしまいます。",
        feedbackEn:
          "Saying 'no questions' before dropping a blunt overtime query dampens the strong momentum you built.",
        nextNodeId: "interview-node-end-awkward",
      },
    ],
  },

  // Turn 5B: Last wrap-up walk with HR Sato
  "interview-node-5b-last-chance": {
    id: "interview-node-5b-last-chance",
    speakerNameJa: "佐藤（人事担当）",
    speakerNameEn: "Sato (HR Coordinator)",
    speakerRoleEn: "HR Talent Partner",
    speakerAvatar: "👩🏻‍💼",
    characterKey: "sato",
    npcTextJa:
      "（面接を終え、エレベーター前の廊下へ出ると人事の佐藤さんが待っていました。）お疲れ様でした！いかがでしたか？最後になりますが、もし面接官へ補足しておきたい点やご質問があれば今伺っておきますね。",
    npcReadingHiragana:
      "（めんせつをおえ、エレベーターまえのろうかへでるとじんじのさとうさんがまっていました。）おつかれさまでした！いかがでしたか？さいごになりますが、もしめんせつかんへほそくしておきたいてんやごしつもんがあればいまうかがっておきますね。",
    npcRomaji:
      "(Mensetsu o oe, erebeetaa-mae no rouka e deru to jinji no Satou-san ga matte imashita.) Otsukaresama deshita! Ikaga deshita ka? Saigo ni narimasu ga, moshi mensetsukan e hosoku shite okitai ten ya goshitsumon ga areba ima ukagatte okimasu ne.",
    npcTextEn:
      "(Stepping out into the terrace corridor after the interview, HR Sato meets you.) Well done! How did it go? Before you leave, if there is anything you'd like to add or ask the panel, I can pass it along now.",
    speakerVoiceId: 14,
    expression: "neutral",
    backgroundKey: "office-terrace-exit",
    choices: [
      {
        id: "ji5b-respectful-sincerity",
        textJa:
          "ありがとうございます。本日は貴重なお言葉から多くの学びをいただきました。もしご縁をいただけた際は、現場の文化を尊重しつつ一日も早くチームに貢献したいとお伝えいただけますと幸いです。",
        readingHiragana:
          "ありがとうございます。ほんじつはきちょうなおことばからおおくのまなびをいただきました。もしごえんをいただけたさいは、げんばのぶんかをそんちょうしつついちにちもはやくチームにこうけんしたいとおつたえいただけますとさいわいです。",
        romaji:
          "Arigatou gozaimasu. Honjitsu wa kichou na okotoba kara ooku no manabi o itadakimashita. Moshi goen o itadaketa sai wa, genba no bunka o sonchou shitsutsu ichinichi mo hayaku chiimu ni kouken shitai to otsutae itadakemasu to saiwai desu.",
        textEn:
          "Thank you. I learned a great deal from today's feedback. If granted the opportunity, please let them know I will respect the team culture while working to contribute as quickly as possible.",
        tier: "respectful",
        points: 100,
        feedbackJa:
          "佐藤さんの好感を勝ち取り、前向きな推薦コメントを面接官へ繋いでもらえました！",
        feedbackEn:
          "Clever, humble follow-up: HR writes a glowing post-interview note on your behalf.",
        nextNodeId: "interview-node-end-success",
      },
      {
        id: "ji5b-polite-quiet",
        textJa:
          "はい、大丈夫です。今日はお時間をいただき本当にありがとうございました。失礼いたします。",
        readingHiragana:
          "はい、だいじょうぶです。きょうはおじかんをいただきほんとうにありがとうございました。しつれいいいたします。",
        romaji:
          "Hai, daijoubu desu. Kyou wa ojikan o itadaki hontou ni arigatou gozaimasu. Shitsurei itashimasu.",
        textEn:
          "Yes, I'm all set. Thank you very much for today's time. Excuse me.",
        tier: "polite",
        points: 65,
        feedbackJa:
          "礼儀正しく終えられましたが、途中の小さなつまずきを完全に挽回する一言が惜しくも足りませんでした。",
        feedbackEn:
          "Polite exit, though a bit too subdued to completely erase earlier stumbles.",
        nextNodeId: "interview-node-end-awkward",
      },
      {
        id: "ji5b-casual-vent",
        textJa:
          "いやー結構厳しくて疲れましたよ！合否の結果っていつ頃来ますかね？",
        readingHiragana:
          "いやーけっこうきびしくてつかれましたよ！ごうひのけっかっていつごろきますかね？",
        romaji:
          "Iyaa kekkou kibishikute tsukaremashita yo! Gouhi no kekka tte itsugoro kimasu ka ne?",
        textEn:
          "Man, that was pretty tough—I'm wiped! Roughly when do results come out?",
        tier: "casual",
        points: 15,
        feedbackJa:
          "エレベーター前でも人事に本音で愚痴をこぼすのは厳禁です。最後まで見られています。",
        feedbackEn:
          "Complaining to HR in the hallway ('tsukaremashita') proves fatal—every interaction counts until you exit the building.",
        nextNodeId: "interview-node-end-failure",
      },
    ],
  },

  // Endings
  "interview-node-end-perfect": {
    id: "interview-node-end-perfect",
    speakerNameJa: "松本取締役",
    speakerNameEn: "Director Matsumoto",
    speakerRoleEn: "Managing Director",
    speakerAvatar: "👨🏻‍💼",
    characterKey: "matsumoto",
    npcTextJa:
      "（松本取締役が満足げに頷き、力強く言葉を結びました。）素晴らしい視点です。技術力だけでなく周囲と歩調を合わせる姿勢に強く共感しました。ぜひ前向きにご一緒できるよう、早急にご連絡いたします。",
    npcReadingHiragana:
      "（まつもととりしまりやくがまんぞくげにうなずき、ちからづよくことばをむすびました。）すばらしいしてんです。ぎじゅつりょくだけでなくしゅういとほちょうをあわせるしせいにつよくきょうかんしました。ぜひまえむきにごいっしょできるよう、そうきゅうにごれんらくいたします。",
    npcRomaji:
      "(Matsumoto torishimariyaku ga manzokuge ni unazuki, chikarazuyoku kotoba o musubimashita.) Subarashii shiten desu. Gijutsuryoku dake de naku shuui to hochou o awaseru shisei ni tsuyoku kyoukan shimashita. Zehi maemuki ni goissho dekiru you, soukyuu ni gorenraku itashimasu.",
    npcTextEn:
      "(Director Matsumoto nods with genuine satisfaction.) An excellent perspective. We were deeply impressed not only by your technical capability, but your maturity in aligning with those around you. We will contact you promptly toward moving forward together.",
    speakerVoiceId: 13,
    expression: "proud",
    backgroundKey: "office-terrace-exit",
    isEnding: true,
    endingType: "perfect",
    choices: [],
  },
  "interview-node-end-success": {
    id: "interview-node-end-success",
    speakerNameJa: "佐藤（人事担当）",
    speakerNameEn: "Sato (HR Coordinator)",
    speakerRoleEn: "HR Talent Partner",
    speakerAvatar: "👩🏻‍💼",
    characterKey: "sato",
    npcTextJa:
      "（佐藤さんが笑顔でエレベーターのボタンを押してくれます。）しっかりお気持ちをお伝えしておきますね。川口からも「非常に話しやすかった」と聞いておりますので、どうぞ結果をお待ちください！",
    npcReadingHiragana:
      "（さとうさんがえがおでエレベーターのボタンをおしてくれます。）しっかりおきもちをおつたえしておきますね。かわぐちからも「ひじょうにはなしやすかった」ときいておりますので、どうぞけっかをおまちください！",
    npcRomaji:
      "(Satou-san ga egao de erebeetaa no botan o oshite kuremasu.) Shikkari okimochi o otsutae shite okimasu ne. Kawaguchi kara mo 'hijou ni hanashiyasukatta' to kiite orimasu node, douzo kekka o omachi kudasai!",
    npcTextEn:
      "(HR Sato presses the elevator button with a bright smile.) I'll pass that along faithfully. Kawaguchi already told me you were very easy to work with, so please look forward to our reply!",
    speakerVoiceId: 14,
    expression: "happy",
    backgroundKey: "office-terrace-exit",
    isEnding: true,
    endingType: "success",
    choices: [],
  },
  "interview-node-end-awkward": {
    id: "interview-node-end-awkward",
    speakerNameJa: "川口（開発マネージャー）",
    speakerNameEn: "Kawaguchi (Eng. Manager)",
    speakerRoleEn: "Engineering Manager",
    speakerAvatar: "🧑🏻‍💻",
    characterKey: "kawaguchi",
    npcTextJa:
      "（川口マネージャーは少し考え込む様子で頭を下げました。）……本日はありがとうございました。他の候補者様とも比較しながら慎重に検討し、一週間以内にお知らせいたします。",
    npcReadingHiragana:
      "（かわぐちマネージャーはすこしかんがえこむようすであたまをさげました。）……ほんじつはありがとうございました。ほかのこうほしゃさまともひかくしながらしんちょうにけんとうし、いっしゅうかんいないにおしらせいたします。",
    npcRomaji:
      "(Kawaguchi maneejaa wa sukoshi kangaekomu yousu de atama o sagemashita.) ...Honjitsu wa arigatou gozaimasu. Hoka no kouhosha-sama to mo hikaku shinagara shinchou ni kentou shi, isshuukan inai ni oshirase itashimasu.",
    npcTextEn:
      "(Manager Kawaguchi bows while looking thoughtful.) ...Thank you for today. We will weigh everyone carefully alongside the other candidates and let you know within a week.",
    speakerVoiceId: 11,
    expression: "troubled",
    backgroundKey: "office-terrace-exit",
    isEnding: true,
    endingType: "awkward",
    choices: [],
  },
  "interview-node-end-failure": {
    id: "interview-node-end-failure",
    speakerNameJa: "松本取締役",
    speakerNameEn: "Director Matsumoto",
    speakerRoleEn: "Managing Director",
    speakerAvatar: "👨🏻‍💼",
    characterKey: "matsumoto",
    npcTextJa:
      "（松本取締役は静かに資料を閉じました。）……お気持ちは分かりましたが、残念ながら当社が大切にしているチーム文化とは方向性が異なるように見受けられます。今後のご活躍をお祈り申し上げます。",
    npcReadingHiragana:
      "（まつもととりしまりやくはしずかにしりょうをとじました。）……おきもちはわかりましたが、ざんねんながらとうしゃがたいせつにしているチームぶんかとはほうこうせいがことなるようにみうけられます。こんごのごかつやくをおいのりもうしあげます。",
    npcRomaji:
      "(Matsumoto torishimariyaku wa shizuka ni shiryou o tojimashita.) ...Okimochi wa wakarimashita ga, zannen nagara tousha ga taisetsu ni shite iru chiimu bunka to wa houkousei ga kotonaru you ni miukeraremasu. Kongo no gokatsuyaku o oinori moushiagemasu.",
    npcTextEn:
      "(Director Matsumoto quietly closes his binder.) ...I understand your perspective, but unfortunately your priorities seem misaligned with the team culture we uphold here. We wish you well in your future endeavors.",
    speakerVoiceId: 13,
    expression: "disappointed",
    backgroundKey: "executive-interview-room",
    isEnding: true,
    endingType: "failure",
    choices: [],
  },
};
