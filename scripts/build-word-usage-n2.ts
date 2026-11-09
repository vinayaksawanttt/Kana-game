import fs from "node:fs";
import path from "node:path";
import type { WordUsageItem, WordUsageSentenceOption } from "../src/data/jlpt/wordUsageData";

interface RawItemData {
  id: string;
  word: string;
  reading: string;
  romaji: string;
  meanings: string[];
  pos: string[];
  correctIdx: 0 | 1 | 2 | 3;
  correct: {
    ja: string;
    en: string;
    exp: string;
  };
  incorrect: Array<{
    ja: string;
    en: string;
    exp: string;
  }>;
}

const RAW_N2_ITEMS: RawItemData[] = [
  // 1. あいまい (correctIdx: 0)
  {
    id: "usage-n2-aimai",
    word: "あいまい",
    reading: "あいまい",
    romaji: "aimai",
    meanings: ["vague", "ambiguous"],
    pos: ["na-adj", "noun"],
    correctIdx: 0,
    correct: {
      ja: "彼の発言はあいまいな点が多いため、賛成なのか反対なのか判断がつかない。",
      en: "Because there are many vague points in his statement, it is impossible to judge whether he agrees or disagrees.",
      exp: "「あいまいな返事 / 態度 / 表現」is the standard usage for matters that lack clarity or distinct intention.",
    },
    incorrect: [
      {
        ja: "昨夜はぐっすり眠ったので、今朝はとてもあいまいに目覚めることができた。",
        en: "Because I slept soundly last night, I was able to wake up very ambiguously this morning.",
        exp: "Unnatural. Waking up refreshed uses「すっきり」(refreshed) or「爽快に」(soukai ni), not「あいまい」.",
      },
      {
        ja: "このカメラはとてもあいまいな画質で、遠くの文字までくっきりと写る。",
        en: "This camera has very ambiguous image quality, capturing even distant text clearly.",
        exp: "Unnatural. High or clear image definition uses「鮮明な」(clear) or「高精細な」, not「あいまい」.",
      },
      {
        ja: "スープの味が少しあいまいで物足りないので、塩と胡椒を少し足してみた。",
        en: "The soup's taste was a bit ambiguous and unsatisfactory, so I added some salt and pepper.",
        exp: "Unnatural. Bland or thin flavor uses「薄い」(light/bland) or「ぼんやりした」, not「あいまい」.",
      },
    ],
  },

  // 2. 補う (correctIdx: 1)
  {
    id: "usage-n2-oginau",
    word: "補う",
    reading: "おぎなう",
    romaji: "oginau",
    meanings: ["to compensate for", "to supplement"],
    pos: ["verb", "godan"],
    correctIdx: 1,
    correct: {
      ja: "退職による人手不足を補うため、来月から新しいアルバイトを３名採用することにした。",
      en: "To make up for the labor shortage caused by retirements, we decided to hire three new part-time workers from next month.",
      exp: "「不足 / 赤字 / 欠点を補う」is the authentic collocation for covering a deficit or shortage.",
    },
    incorrect: [
      {
        ja: "パソコンのデータが消えてしまわないように、毎日外付けハードディスクに補っています。",
        en: "To prevent computer data from being lost, I supplement it to an external hard drive every day.",
        exp: "Unnatural. Backing up data uses「保存する」(save) or「バックアップを取る」(back up), not「補う」.",
      },
      {
        ja: "電車が事故で遅れたため、駅員に遅延証明書を補ってもらいました。",
        en: "Because the train was delayed due to an accident, I had the station staff supplement a delay certificate.",
        exp: "Unnatural. Having a formal certificate issued uses「発行してもらう」(issue) or「出してもらう」, not「補う」.",
      },
      {
        ja: "部屋が乾燥していると感じたので、加湿器をつけて部屋の湿度を補いました。",
        en: "Feeling that the room was dry, I turned on the humidifier to supplement the humidity.",
        exp: "Unnatural. Increasing room humidity uses「上げた」(raised) or「保った」(maintained), not「補う」.",
      },
    ],
  },

  // 3. 厚かましい (correctIdx: 2)
  {
    id: "usage-n2-atsukamashii",
    word: "厚かましい",
    reading: "あつかましい",
    romaji: "atsukamashii",
    meanings: ["impudent", "shameless", "brazen"],
    pos: ["i-adj"],
    correctIdx: 2,
    correct: {
      ja: "初対面の人に対して個人的な給料の金額を聞くなんて、ずいぶん厚かましい態度だ。",
      en: "Asking a stranger for their personal salary amount on the very first meeting is quite an impudent attitude.",
      exp: "「厚かましい態度 / お願い」describes brazen, shameless behavior that disregards social boundaries.",
    },
    incorrect: [
      {
        ja: "冬の寒さに耐えるために、とても厚かましいウールのコートを着て出かけました。",
        en: "To endure the winter cold, I went out wearing a very impudent wool coat.",
        exp: "Unnatural. Heavy, thick fabric uses「厚手の」(thick) or「分厚い」(bulky), not「厚かましい」.",
      },
      {
        ja: "友人の結婚式に招待されたので、厚かましいお祝いの言葉を心を込めて贈りました。",
        en: "Invited to my friend's wedding, I wholeheartedly sent impudent congratulatory remarks.",
        exp: "Unnatural. Warm and cordial greetings use「温かい」(warm) or「心のこもった」(heartfelt), not「厚かましい」.",
      },
      {
        ja: "新しいビルの壁は厚かましいコンクリートで作られており、地震にも強い構造です。",
        en: "The walls of the new building are made of impudent concrete, giving it a structure resistant to earthquakes.",
        exp: "Unnatural. Thick and solid concrete uses「分厚い」(thick) or「頑丈な」(sturdy), not「厚かましい」.",
      },
    ],
  },

  // 4. あてはまる (correctIdx: 3)
  {
    id: "usage-n2-atehamaru",
    word: "あてはまる",
    reading: "あてはまる",
    romaji: "atehamaru",
    meanings: ["to be applicable", "to fulfill"],
    pos: ["verb", "godan"],
    correctIdx: 3,
    correct: {
      ja: "アンケートの質問を読んで、自分自身の性格や状況にあてはまる項目にチェックを入れてください。",
      en: "Please read the questionnaire items and check the options that apply to your own personality or situation.",
      exp: "「条件 / 規則 / 状況にあてはまる」expresses matching or fitting formal criteria or categories.",
    },
    incorrect: [
      {
        ja: "パズルの最後のピースが枠の隙間にぴったりとあてはまって、ようやく完成した。",
        en: "The last piece of the puzzle applied neatly into the opening of the frame, finally completing it.",
        exp: "Unnatural. Physical objects fitting into spaces uses「はまった」(fit into) or「収まった」, not「あてはまった」.",
      },
      {
        ja: "急な雨が降ってきたので、近くのカフェの軒下にあてはまって雨宿りをした。",
        en: "Sudden rain started falling, so I applied under the eaves of a nearby cafe to take shelter.",
        exp: "Unnatural. Ducking under shelter uses「駆け込んだ」(ran into) or「入った」, not「あてはまった」.",
      },
      {
        ja: "壁にポスターを貼るために、両面テープを四隅にていねいにあてはめました。",
        en: "To hang the poster on the wall, I applied double-sided tape carefully to all four corners.",
        exp: "Unnatural. Affixing tape uses「貼った」(pasted) or「つけた」(attached), not「あてはめた」.",
      },
    ],
  },

  // 5. あふれる (correctIdx: 3)
  {
    id: "usage-n2-afureru",
    word: "あふれる",
    reading: "あふれる",
    romaji: "afureru",
    meanings: ["to flood", "to overflow", "to brim over"],
    pos: ["verb", "ichidan"],
    correctIdx: 3,
    correct: {
      ja: "彼女の歌声は会場中の観客を魅了し、演奏が終わると客席は熱気と感動にあふれていた。",
      en: "Her singing voice captivated the audience throughout the hall, and when the performance ended, the seating was brimming with enthusiasm and emotion.",
      exp: "「自信 / 活気 / 感動にあふれる」is used when spaces or people are filled to the point of overflowing with feelings or energy.",
    },
    incorrect: [
      {
        ja: "風邪をひいて喉が痛いので、病院で処方された薬を水であふれるように飲み込みました。",
        en: "Having caught a cold and with a sore throat, I swallowed the prescribed medicine as if overflowing with water.",
        exp: "Unnatural. Taking medicine with plenty of water uses「多めの水で」(with plenty of water), not「あふれる」.",
      },
      {
        ja: "セール初日のデパートの前には、開店の１時間前から長い行列があふれて並んでいました。",
        en: "In front of the department store on the first day of the sale, a long queue was overflowing and lining up from an hour before opening.",
        exp: "Unnatural. A queue forming uses「できていた」(had formed) or「続いていた」(continued), not「あふれて」.",
      },
      {
        ja: "今年の夏休みは家族旅行の計画があふれていて、今からどこへ行こうか迷っています。",
        en: "For this summer vacation, family travel plans are overflowing, and I am wondering where to go.",
        exp: "Unnatural. Having numerous plans uses「たくさんあって」(many) or「目白押しで」(packed full), not「あふれて」.",
      },
    ],
  },

  // 6. 改める (correctIdx: 0)
  {
    id: "usage-n2-aratameru",
    word: "改める",
    reading: "あらためる",
    romaji: "aratameru",
    meanings: ["to change", "to alter", "to reform", "to revise"],
    pos: ["verb", "ichidan"],
    correctIdx: 0,
    correct: {
      ja: "今回の大きな失敗を機に、仕事に対する普段の姿勢や生活習慣を根本から改めるべきだ。",
      en: "Taking this major failure as an opportunity, you should fundamentally alter your daily attitude toward work and your lifestyle habits.",
      exp: "「態度 / 習慣 / 規則を改める」means correcting, reforming, or altering something for the better.",
    },
    incorrect: [
      {
        ja: "引っ越しをすることになったので、来週新しいアパートの部屋をきれいに改めます。",
        en: "Since I will be moving, next week I will alter my new apartment room cleanly.",
        exp: "Unnatural. Cleaning up a room uses「掃除する」(clean) or「片付ける」(tidy up), not「改める」.",
      },
      {
        ja: "図書館で借りた本の返却期限が過ぎてしまったので、窓口に行って本を改めました。",
        en: "Because the return deadline for the library book had passed, I went to the counter and altered the book.",
        exp: "Unnatural. Returning borrowed books uses「返却した」(returned) or「返した」, not「改めた」.",
      },
      {
        ja: "スマートフォンの充電が切れてしまったので、カフェで急速充電器を改めました。",
        en: "Because my smartphone ran out of charge, I altered a fast charger at a cafe.",
        exp: "Unnatural. Borrowing or using a charger uses「借りた」(borrowed) or「使った」(used), not「改めた」.",
      },
    ],
  },

  // 7. 安易 (correctIdx: 1)
  {
    id: "usage-n2-an-i",
    word: "安易",
    reading: "あんい",
    romaji: "an-i",
    meanings: ["easy-going", "careless", "simplistic"],
    pos: ["na-adj", "noun"],
    correctIdx: 1,
    correct: {
      ja: "インターネット上の不確かな情報を安易に信じ込んで他人に拡散するのは非常に危険だ。",
      en: "Simplistically believing unverified information on the internet and spreading it to others is extremely dangerous.",
      exp: "「安易な考え / 安易に引き受ける」connotes thoughtless, superficial, or irresponsible carelessness.",
    },
    incorrect: [
      {
        ja: "この日本語の試験問題はとても安易だったので、受験者全員が満点を取ることができました。",
        en: "These Japanese exam questions were very easy-going, so every test-taker was able to get a perfect score.",
        exp: "Unnatural. Exam difficulty being low uses「平易な」(simple) or「易しい / 簡単な」(easy), not「安易」(careless).",
      },
      {
        ja: "毎日の散歩は体への負担が少なく、誰でも安易に始められる健康的な運動です。",
        en: "Daily walking places little burden on the body and is healthy exercise anyone can start thoughtlessly.",
        exp: "Unnatural. Readily or casually starting exercise uses「手軽に」(readily) or「気軽に」(casually), not「安易に」.",
      },
      {
        ja: "このスマートフォンの操作画面は直感的で、高齢者でも安易に使いこなせます。",
        en: "This smartphone's user interface is intuitive, so even seniors can easily master it without thinking.",
        exp: "Unnatural. Operating a device with ease uses「容易に」(easily) or「簡単に」, not「安易に」.",
      },
    ],
  },

  // 8. 案外 (correctIdx: 2)
  {
    id: "usage-n2-angai",
    word: "案外",
    reading: "あんがい",
    romaji: "angai",
    meanings: ["unexpectedly"],
    pos: ["adverb", "na-adj"],
    correctIdx: 2,
    correct: {
      ja: "難しいと聞いていた資格試験だったが、過去問題をしっかり解いていたので案外すんなり合格できた。",
      en: "Although I had heard the certification exam was difficult, because I had thoroughly solved past problems, I passed unexpectedly smoothly.",
      exp: "「案外＋動詞 / 形容詞」is used when the actual result turns out different from initial expectations or predictions.",
    },
    incorrect: [
      {
        ja: "事故の原因について詳しく調べた結果、警察から案外な報告書が提出されました。",
        en: "As a result of thoroughly investigating the cause of the accident, an unexpected report was submitted by the police.",
        exp: "Unnatural. Official investigative reports use「詳細な」(detailed) or「公式な」(official), not「案外な」.",
      },
      {
        ja: "彼はとても真面目で責任感が強く、会社で誰からも案外に信頼されている社員です。",
        en: "He is very diligent with a strong sense of responsibility, an employee unexpectedly trusted by everyone.",
        exp: "Unnatural. Being deeply trusted uses「厚く」(deeply) or「非常に」(extremely), not「案外に」.",
      },
      {
        ja: "明日の天気予報によると、午後から案外な大雨が降る恐れがあるそうです。",
        en: "According to tomorrow's weather forecast, there is a risk of unexpected heavy rain falling in the afternoon.",
        exp: "Unnatural. Severe, intense rainfall uses「激しい」(violent/intense) or「猛烈な」, not「案外な」.",
      },
    ],
  },

  // 9. 催促 (correctIdx: 3)
  {
    id: "usage-n2-saisoku",
    word: "催促",
    reading: "さいそく",
    romaji: "saisoku",
    meanings: ["request", "demand", "urge (action)", "press for"],
    pos: ["noun", "suru-verb"],
    correctIdx: 3,
    correct: {
      ja: "締め切りを過ぎても原稿が届かないため、作家の担当編集者は電話で提出を催促した。",
      en: "Since the manuscript had not arrived even past the deadline, the editor in charge phoned to urge its submission.",
      exp: "「提出 / 返済 / 返事を催促する」means pressing someone to promptly execute an overdue action or payment.",
    },
    incorrect: [
      {
        ja: "毎朝ジョギングを始める前に、怪我を防止するために準備運動を催促しています。",
        en: "Every morning before starting jogging, I urge warm-up exercises to prevent injury.",
        exp: "Unnatural. Performing warm-ups uses「行う」(perform) or「している」(do), not「催促している」.",
      },
      {
        ja: "駅前の新しいレストランの料理はとても美味しく、友達にも行くよう催促しました。",
        en: "The food at the new restaurant in front of the station was delicious, so I urged my friends to go.",
        exp: "Unnatural. Recommending a restaurant uses「勧めた」(recommended), not「催促した」.",
      },
      {
        ja: "彼は来週のプレゼンテーションに向けて、資料の準備を催促に進めています。",
        en: "Heading toward next week's presentation, he is advancing the preparation of materials urgingly.",
        exp: "Unnatural. Advancing tasks steadily or swiftly uses「着実に」(steadily) or「急いで」(hurriedly), not「催促に」.",
      },
    ],
  },

  // 10. 縮小 (correctIdx: 2)
  {
    id: "usage-n2-shukushou",
    word: "縮小",
    reading: "しゅくしょう",
    romaji: "shukushou",
    meanings: ["reduction", "curtailment"],
    pos: ["noun", "suru-verb"],
    correctIdx: 2,
    correct: {
      ja: "長引く不況の影響を受けて、会社は新規事業の規模を縮小し、固定費を抑える方針を決めた。",
      en: "Affected by the prolonged recession, the company decided on a policy of scaling down the new business and curbing fixed costs.",
      exp: "「事業 / 規模 / 予算を縮小する」is the natural antonym of「拡大」(expansion), denoting reducing scale or dimensions.",
    },
    incorrect: [
      {
        ja: "毎日の勉強時間を30分から2時間に縮小して、JLPTの合格を目指して努力しています。",
        en: "I reduced daily study time from 30 minutes to 2 hours, making efforts aiming to pass the JLPT.",
        exp: "Unnatural. Increasing time uses「増やして」(increased) or「延長して」, not「縮小して」(which means decrease, not increase).",
      },
      {
        ja: "洗濯物を強い直射日光の下に干したため、お気に入りのセーターの色が縮小してしまった。",
        en: "Because I hung the laundry in strong direct sunlight, the color of my favorite sweater reduced.",
        exp: "Unnatural. Fabric colors fading uses「色あせて」(faded) or「薄くなって」, not「縮小して」.",
      },
      {
        ja: "駅から自宅までの距離を縮小するために、来月新しい自転車を購入するつもりです。",
        en: "To reduce the distance from the station to my home, I intend to purchase a new bicycle next month.",
        exp: "Unnatural. Shortening commuting duration uses「通勤時間を短縮する」(shorten time). Physical distance cannot be「縮小」.",
      },
    ],
  },

  // 11. 普及 (correctIdx: 0)
  {
    id: "usage-n2-fukyuu",
    word: "普及",
    reading: "ふきゅう",
    romaji: "fukyuu",
    meanings: ["diffusion", "spread", "popularization"],
    pos: ["noun", "suru-verb"],
    correctIdx: 0,
    correct: {
      ja: "スマートフォンや高速通信網の普及によって、どこにいても世界中のニュースを即座に確認できるようになった。",
      en: "With the spread and diffusion of smartphones and high-speed communication networks, it has become possible to check world news instantly from anywhere.",
      exp: "「製品 / 技術 / 制度が普及する」refers to technologies, appliances, or customs becoming widely adopted throughout society.",
    },
    incorrect: [
      {
        ja: "昨夜からの大雨で川の水位が普及し、避難警報が市役所から発令された。",
        en: "Due to heavy rain since last night, river water levels diffused, and an evacuation warning was issued.",
        exp: "Unnatural. Water level rising uses「上昇し」(rose) or「増水し」(swelled), not「普及し」.",
      },
      {
        ja: "彼女はピアノの演奏技術が普及しており、国際コンクールで何度も優勝している。",
        en: "Her piano performance technique has diffused, and she has won international competitions many times.",
        exp: "Unnatural. Superb mastery of musical technique uses「優れており」(superior) or「卓越しており」, not「普及しており」.",
      },
      {
        ja: "長い登山道を歩き続けて足の筋肉が普及したため、山小屋で一晩休むことにした。",
        en: "Continuing to walk along the long mountain trail, my leg muscles diffused, so I rested at the lodge.",
        exp: "Unnatural. Muscle fatigue or soreness uses「疲労した」(fatigued) or「張った」(tightened), not「普及した」.",
      },
    ],
  },

  // 12. 鈍い (correctIdx: 1)
  {
    id: "usage-n2-nibui",
    word: "鈍い",
    reading: "にぶい",
    romaji: "nibui",
    meanings: ["dull", "slow", "sluggish"],
    pos: ["i-adj"],
    correctIdx: 1,
    correct: {
      ja: "徹夜続きで寝不足のせいか、今朝は頭の回転や身体の反応がいつもより鈍い。",
      en: "Perhaps because of lack of sleep from staying up all night, my mental sharpness and physical reflexes are duller than usual this morning.",
      exp: "「反応 / 痛み / 動きが鈍い」expresses dulled sensitivity, sluggish reflexes, or lack of sharpness.",
    },
    incorrect: [
      {
        ja: "毎朝の散歩のおかげで、祖父の足腰は年齢のわりにとても鈍くて元気です。",
        en: "Thanks to daily walks, my grandfather's legs and lower back are very dull for his age and healthy.",
        exp: "Unnatural. Being robust and strong uses「丈夫で」(sturdy) or「達者で」(in good health), not「鈍くて」.",
      },
      {
        ja: "この最新型のノートパソコンは処理速度が非常に鈍く、重い動画編集も快適に行えます。",
        en: "This latest laptop's processing speed is extremely dull, allowing heavy video editing comfortably.",
        exp: "Unnatural. Fast processing speeds use「速く」(fast) or「俊敏で」, not「鈍く」(which means slow).",
      },
      {
        ja: "彼女は色彩感覚がとても鈍いので、描いた絵はいつも鮮やかで人々の目を引きます。",
        en: "Because her sense of color is very dull, the paintings she creates are always vivid and catch people's eyes.",
        exp: "Unnatural. Keen aesthetic sensitivity uses「鋭い」(keen/sharp), not「鈍い」(blunt/dull).",
      },
    ],
  },

  // 13. 引き受ける (correctIdx: 1)
  {
    id: "usage-n2-hikiukeru",
    word: "引き受ける",
    reading: "ひきうける",
    romaji: "hikiukeru",
    meanings: ["to undertake", "to take on", "to accept"],
    pos: ["verb", "ichidan"],
    correctIdx: 1,
    correct: {
      ja: "先輩が急な病気で入院してしまったため、彼が担当していた大型プロジェクトの責任者を私が引き受けることになった。",
      en: "Because my senior was suddenly hospitalized due to illness, I took on the role of leader for the large-scale project he had been handling.",
      exp: "「仕事 / 役目 / 責任を引き受ける」means consenting to undertake duties, projects, or responsibilities.",
    },
    incorrect: [
      {
        ja: "会議の開始時間になってもクライアントが現れなかったので、受付まで車で引き受けに行きました。",
        en: "Because the client didn't show up even at meeting time, I drove to reception to undertake them.",
        exp: "Unnatural. Going to greet or pick up someone uses「出迎えに」(go to greet/meet), not「引き受けに」.",
      },
      {
        ja: "郵便局の窓口へ行って、海外に住んでいる友人からの小包を笑顔で引き受けました。",
        en: "I went to the post office counter and smilingly undertook a parcel from a friend living abroad.",
        exp: "Unnatural. Receiving physical packages uses「受け取りました」(received), not「引き受けました」.",
      },
      {
        ja: "街で偶然高校時代の担任の先生を見かけたので、大きな声で引き受けて挨拶を交わしました。",
        en: "I spotted my high school homeroom teacher in town by chance, so I undertook loudly and greeted him.",
        exp: "Unnatural. Calling out to someone uses「呼び止めて」(called out to) or「声をかけて」, not「引き受けて」.",
      },
    ],
  },

  // 14. 強引 (correctIdx: 2)
  {
    id: "usage-n2-gouin",
    word: "強引",
    reading: "ごういん",
    romaji: "gouin",
    meanings: ["overbearing", "coercive", "pushy", "high-handed"],
    pos: ["na-adj", "noun"],
    correctIdx: 2,
    correct: {
      ja: "周囲の反対意見に全く耳を貸さず、自分の企画を強引に進めようとするやり方は反発を招くだけだ。",
      en: "Refusing to listen to dissenting opinions around you and trying to push your plan forward in a high-handed manner will only invite backlash.",
      exp: "「強引なやり方 / 強引に進める」connotes forcefully imposing one's will despite opposition or lack of consensus.",
    },
    incorrect: [
      {
        ja: "このビルは強引な鉄筋コンクリートで建てられているため、震度7の地震でもびくともしません。",
        en: "Because this building was constructed with overbearing reinforced concrete, it won't budge even in an intensity-7 quake.",
        exp: "Unnatural. Physically sturdy building material uses「頑丈な」(sturdy) or「強固な」(solid), not「強引な」.",
      },
      {
        ja: "彼の英語力は非常に強引で、ネイティブスピーカーとも対等にディスカッションができます。",
        en: "His English ability is extremely overbearing, allowing him to discuss as equals with native speakers.",
        exp: "Unnatural. Fluent and high language proficiency uses「流暢で」(fluent) or「高くて」, not「強引で」.",
      },
      {
        ja: "赤ちゃんが夜中に強引に泣き叫んだので、お母さんは抱っこしてあやしました。",
        en: "The baby cried out overbearingly in the middle of the night, so the mother picked him up and soothed him.",
        exp: "Unnatural. Crying loudly or violently uses「激しく」(intensely) or「大声で」(loudly), not「強引に」.",
      },
    ],
  },

  // 15. 地味 (correctIdx: 3)
  {
    id: "usage-n2-jimi",
    word: "地味",
    reading: "じみ",
    romaji: "jimi",
    meanings: ["plain", "simple", "subdued", "modest"],
    pos: ["na-adj", "noun"],
    correctIdx: 3,
    correct: {
      ja: "就職活動の面接では、派手な服装を避けて、黒や紺を基調とした地味なスーツを選ぶのが一般的だ。",
      en: "In job hunting interviews, it is standard to avoid flashy clothing and choose a plain suit based on black or navy.",
      exp: "「地味な服装 / 色 / 暮らし」denotes understated, quiet, unobtrusive simplicity, opposed to「派手」(flashy).",
    },
    incorrect: [
      {
        ja: "昨夜のパーティーは世界的スターが多数参加し、とても地味で華やかな雰囲気でした。",
        en: "Last night's party had many international stars participating and had a very plain and glamorous atmosphere.",
        exp: "Unnatural. A glamorous, lavish gala atmosphere uses「豪華で」(luxurious) or「華やかな」, the opposite of「地味」.",
      },
      {
        ja: "彼は最新のスマートフォンを誰よりも早く地味に購入して、毎日自慢しています。",
        en: "He plainly purchased the latest smartphone faster than anyone else and boasts about it daily.",
        exp: "Unnatural. Buying something ahead of others uses「いち早く」(promptly) or「真っ先に」, not「地味に」.",
      },
      {
        ja: "富士山の山頂から眺めたご来光は、息をのむほど地味で素晴らしい光景でした。",
        en: "The sunrise viewed from the summit of Mount Fuji was a breathtakingly plain and magnificent scene.",
        exp: "Unnatural. A majestic, breathtaking vista uses「壮大で」(grand) or「雄大な」(magnificent), not「地味で」.",
      },
    ],
  },

  // 16. 思いがけない (correctIdx: 0)
  {
    id: "usage-n2-omogakenai",
    word: "思いがけない",
    reading: "おもいがけない",
    romaji: "omoigakenai",
    meanings: ["unexpected", "unforeseen"],
    pos: ["i-adj"],
    correctIdx: 0,
    correct: {
      ja: "旅行先の小さなカフェで、偶然にも中学時代の親友にバッタリ再会するという思いがけない出来事があった。",
      en: "At a small café during my travels, there was an unexpected occurrence where I bumped into my best friend from middle school by coincidence.",
      exp: "「思いがけない出来事 / 知らせ / 出会い」expresses occurrences that were completely unpredicted or fortuitous.",
    },
    incorrect: [
      {
        ja: "明日のプレゼンのために、思いがけない資料を徹夜で隅々まで完璧に作成しました。",
        en: "For tomorrow's presentation, I stayed up all night and perfectly prepared unexpected materials to the corners.",
        exp: "Unnatural. Thoroughly prepared documents use「綿密な」(meticulous) or「十分な」(thorough), not「思いがけない」.",
      },
      {
        ja: "この問題は公式さえ覚えていれば思いがけなく解けるので、焦らずに計算してください。",
        en: "As long as you remember the formula, this problem can be solved unexpectedly, so calculate calmly.",
        exp: "Unnatural. Solving problems easily uses「簡単に」(easily) or「難なく」(without trouble), not「思いがけなく」.",
      },
      {
        ja: "彼女は思いがけない笑顔を浮かべながら、毎朝明るい声でクラスメートに挨拶します。",
        en: "Floating an unexpected smile, she greets classmates with a bright voice every morning.",
        exp: "Unnatural. Beaming cheerful smile uses「爽やかな」(refreshing) or「満面の」(beaming), not「思いがけない」.",
      },
    ],
  },

  // 17. 気配 (correctIdx: 1)
  {
    id: "usage-n2-kehai",
    word: "気配",
    reading: "けはい",
    romaji: "kehai",
    meanings: ["indication", "sign", "presence"],
    pos: ["noun"],
    correctIdx: 1,
    correct: {
      ja: "夜遅く古い洋館の前を通りかかったが、明かりもついておらず、人のいる気配は全く感じられなかった。",
      en: "I passed in front of the old Western-style mansion late at night, but no lights were on, and not the slightest sign of human presence could be felt.",
      exp: "「人の気配 / 秋の気配 / 気配を感じる」refers to subtle sensory traces or perceived atmospheric presence.",
    },
    incorrect: [
      {
        ja: "来週から始まる海外旅行のために、スーツケースに荷物を詰める気配を整えています。",
        en: "For the overseas trip starting next week, I am putting together the presence of packing luggage into the suitcase.",
        exp: "Unnatural. Making travel arrangements uses「準備」(preparations) or「支度」(readiness), not「気配」.",
      },
      {
        ja: "先生が黒板に書いた数学の公式の気配をノートに丁寧に書き写しました。",
        en: "I carefully transcribed the presence of the mathematical formula written on the blackboard into my notebook.",
        exp: "Unnatural. Transcribing written text uses「内容」(contents) or「数式」(formulas), not「気配」.",
      },
      {
        ja: "毎日の筋力トレーニングのおかげで、重い荷物も楽に持ち上げられる気配がつきました。",
        en: "Thanks to daily weight training, the presence of easily lifting heavy luggage attached.",
        exp: "Unnatural. Developing physical strength uses「筋力」(muscle strength) or「体力」(stamina), not「気配」.",
      },
    ],
  },

  // 18. 対策 (correctIdx: 2)
  {
    id: "usage-n2-taisaku",
    word: "対策",
    reading: "たいさく",
    romaji: "taisaku",
    meanings: ["countermeasure", "counter-plan"],
    pos: ["noun"],
    correctIdx: 2,
    correct: {
      ja: "台風の上陸に備えて、自治体は河川の氾濫を防ぐための水害対策を迅速に講じた。",
      en: "In preparation for the typhoon's landfall, the municipality swiftly implemented flood countermeasures to prevent rivers from overflowing.",
      exp: "「事故 / 感染 / 不況の対策を立てる・講じる」is the formal standard collocation for measures against risks and crises.",
    },
    incorrect: [
      {
        ja: "来週の友達の誕生日パーティーのために、みんなでサプライズの対策を秘密で計画しています。",
        en: "For my friend's birthday party next week, everyone is secretly planning surprise countermeasures.",
        exp: "Unnatural. Planning a celebratory surprise event uses「企画」(planning) or「演出」(staging), not「対策」.",
      },
      {
        ja: "映画館の大画面で鑑賞したハリウッドのアクション対策は、迫力満点で感動した。",
        en: "The Hollywood action countermeasure viewed on the cinema's large screen was full of impact and moving.",
        exp: "Unnatural. Blockbuster action movies use「大作」(blockbuster/masterpiece), not「対策」.",
      },
      {
        ja: "新しい料理のレシピを覚えるために、有名シェフの料理対策に毎日通っています。",
        en: "To learn new cooking recipes, I attend a famous chef's cooking countermeasure every day.",
        exp: "Unnatural. Cooking classes use「料理教室」(cooking classes) or「講習」(course), not「対策」.",
      },
    ],
  },

  // 19. 反映 (correctIdx: 3)
  {
    id: "usage-n2-han-ei",
    word: "反映",
    reading: "はんえい",
    romaji: "han-ei",
    meanings: ["reflection", "influence"],
    pos: ["noun", "suru-verb"],
    correctIdx: 3,
    correct: {
      ja: "市民アンケートで集まった多数の貴重な意見は、来年度の都市再開発計画にしっかりと反映される予定だ。",
      en: "The numerous valuable opinions collected in the citizen survey are scheduled to be firmly reflected in next year's urban redevelopment plan.",
      exp: "「意見 / 世論 / 景気を反映する」means causing influences, attitudes, or data to be visibly incorporated into plans or realities.",
    },
    incorrect: [
      {
        ja: "鏡の前に立って、自分の着ている新しい洋服のサイズが反映しているか確認しました。",
        en: "Standing in front of the mirror, I checked whether the size of the new clothes I was wearing was reflecting.",
        exp: "Unnatural. Checking if clothes fit uses「合っているか」(suits/fits), not「反映しているか」.",
      },
      {
        ja: "昨日の夜はぐっすり眠ったので、今朝の体調はとても元気に反映しています。",
        en: "Because I slept soundly last night, my physical condition this morning is reflecting very healthily.",
        exp: "Unnatural. Excellent health condition uses「快調です」(in great shape) or「良好です」, not「反映している」.",
      },
      {
        ja: "毎朝庭の草花にたっぷり水を反映させると、きれいな花を咲かせてくれます。",
        en: "Reflecting plenty of water onto garden plants each morning makes them bloom beautiful flowers.",
        exp: "Unnatural. Watering flowers uses「与えると」(give) or「まくと」(sprinkle), not「反映させる」.",
      },
    ],
  },

  // 20. あらすじ (correctIdx: 0)
  {
    id: "usage-n2-arasuji",
    word: "あらすじ",
    reading: "あらすじ",
    romaji: "arasuji",
    meanings: ["outline", "summary", "synopsis"],
    pos: ["noun"],
    correctIdx: 0,
    correct: {
      ja: "本屋で小説を選ぶときは、まず裏表紙に書いてあるあらすじを読んでから買うかどうか決めることにしている。",
      en: "When choosing a novel at a bookstore, I make it a rule to first read the synopsis written on the back cover before deciding whether to buy it.",
      exp: "「小説 / 映画 / 劇のあらすじ」specifically refers to the summary plot outline of a narrative work.",
    },
    incorrect: [
      {
        ja: "新しい料理を作るために、レシピ本に書かれた食材のあらすじを順番に計量しました。",
        en: "To cook a new dish, I weighed the synopses of ingredients written in the recipe book in sequence.",
        exp: "Unnatural. Ingredient portions use「分量」(portions/quantities) or「分量表」, not「あらすじ」.",
      },
      {
        ja: "駅前の交番へ行って、落としてしまった財布のあらすじを警察官に詳しく説明しました。",
        en: "I went to the police box in front of the station and explained the synopsis of my lost wallet in detail.",
        exp: "Unnatural. External physical description of lost items uses「特徴」(features) or「形状」(shape), not「あらすじ」.",
      },
      {
        ja: "毎月の電気代や水道代のあらすじを家計簿に記入して、無駄な支出を削っています。",
        en: "I enter the synopses of monthly electricity and water bills into the household ledger, cutting wasteful expenses.",
        exp: "Unnatural. Itemized financial billing statements use「明細」(breakdown) or「金額」(amounts), not「あらすじ」.",
      },
    ],
  },
];

const n2Items: WordUsageItem[] = RAW_N2_ITEMS.map((raw) => {
  const correctIdx = raw.correctIdx;
  const incorrectQueue = [...raw.incorrect];
  const options: WordUsageSentenceOption[] = [];

  for (let i = 0; i < 4; i++) {
    if (i === correctIdx) {
      options.push({
        id: `opt-${i + 1}`,
        sentenceJa: raw.correct.ja,
        sentenceEn: raw.correct.en,
        isCorrect: true,
        explanation: raw.correct.exp,
      });
    } else {
      const inc = incorrectQueue.shift()!;
      options.push({
        id: `opt-${i + 1}`,
        sentenceJa: inc.ja,
        sentenceEn: inc.en,
        isCorrect: false,
        explanation: inc.exp,
      });
    }
  }

  return {
    id: raw.id,
    level: "N2",
    jlpt: 2,
    word: raw.word,
    reading: raw.reading,
    romaji: raw.romaji,
    meanings: raw.meanings,
    pos: raw.pos,
    correctOptionIndex: correctIdx,
    options: options as [
      WordUsageSentenceOption,
      WordUsageSentenceOption,
      WordUsageSentenceOption,
      WordUsageSentenceOption,
    ],
  };
});

const OUT_DIR = path.join(process.cwd(), "src", "data", "jlpt", "word_usage");
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const OUT_FILE = path.join(OUT_DIR, "n2.ts");
const content = `// Curated JLPT N2 Word Usage (語彙・用法 — Mondai 5) items
// Generated from enriched N2 vocabulary source data.

import type { WordUsageItem } from "../wordUsageData";

export const WORD_USAGE_N2_ITEMS: readonly WordUsageItem[] = ${JSON.stringify(
  n2Items,
  null,
  2,
)};
`;

fs.writeFileSync(OUT_FILE, content, "utf-8");
console.log(`Successfully wrote ${n2Items.length} curated N2 items to ${OUT_FILE}`);
