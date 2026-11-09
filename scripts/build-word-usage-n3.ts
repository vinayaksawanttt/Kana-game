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

const RAW_N3_ITEMS: RawItemData[] = [
  {
    id: "usage-n3-yobou",
    word: "予防",
    reading: "よぼう",
    romaji: "yobou",
    meanings: ["prevention", "precaution"],
    pos: ["noun", "suru-verb"],
    correct: {
      ja: "インフルエンザの感染を予防するために、外出後は手洗いとうがいを徹底しています。",
      en: "To prevent influenza infection, I thoroughly wash my hands and gargle after going out.",
      exp: "「病気 / 感染 / 事故を予防する」is the natural collocation for taking precautions before adverse events occur.",
    },
    incorrect: [
      {
        ja: "今年の夏休みは予防をしっかりと立てて、家族みんなで沖縄へ旅行する予定です。",
        en: "For this summer vacation, I plan to make precautions firmly and travel to Okinawa with my family.",
        exp: "Unnatural. For travel or schedule itineraries, use「計画」(plan) or「予定」(schedule), not「予防」.",
      },
      {
        ja: "会議で新しい企画について、出席者全員の前で自分の予防をはっきりと述べました。",
        en: "At the meeting regarding the new proposal, I stated my precaution clearly in front of all attendees.",
        exp: "Unnatural. Stating personal views uses「意見」(opinion) or「考え」, not「予防」.",
      },
      {
        ja: "雨が激しく降ってきたので、持っていた大きな傘で荷物を濡れないよう予防しました。",
        en: "Because it began raining heavily, I used my big umbrella to prevent the luggage from getting wet.",
        exp: "Unnatural. Protecting objects from rain uses「防いだ」(shielded/protected) or「守った」, not「予防した」.",
      },
    ],
  },
  {
    id: "usage-n3-inyou",
    word: "引用",
    reading: "いんよう",
    romaji: "inyou",
    meanings: ["quotation", "citation"],
    pos: ["noun", "suru-verb"],
    correct: {
      ja: "レポートを作成するにあたって、有名な学術論文から重要な一節を引用しました。",
      en: "When preparing the report, I cited an important passage from a famous academic paper.",
      exp: "「論文 / 文献 / 記事から引用する」is the standard verb for quoting or citing text from external sources.",
    },
    incorrect: [
      {
        ja: "友人から届いた結婚披露宴の引用の手紙を、とても喜んで受け取りました。",
        en: "I was very pleased to receive the quotation letter for the wedding reception that arrived from my friend.",
        exp: "Unnatural. An event invitation uses「招待状」(invitation letter), not「引用」.",
      },
      {
        ja: "毎朝目覚めたらすぐに、台所で冷たいコップ一杯の新鮮な水を引用しています。",
        en: "Every morning right after waking up, I cite a glass of cold fresh water in the kitchen.",
        exp: "Unnatural. Drinking water uses「飲んでいます」(drinking), not「引用しています」.",
      },
      {
        ja: "彼は英語の長編小説をとても自然で流暢な日本語に引用して出版しました。",
        en: "He quoted the long English novel into very natural and fluent Japanese and published it.",
        exp: "Unnatural. Translating between languages uses「翻訳して」(translated), not「引用して」.",
      },
    ],
  },
  {
    id: "usage-n3-kakaeru",
    word: "抱える",
    reading: "かかえる",
    romaji: "kakaeru",
    meanings: ["to hold in one's arms", "to carry a burden or problem"],
    pos: ["v1", "vt"],
    correct: {
      ja: "彼女はスーパーで買い込んだたくさんの食料品の袋を、両手いっぱいに抱えて歩いていました。",
      en: "She was walking while carrying in both arms full bags of groceries bought at the supermarket.",
      exp: "「荷物を抱える」(hold in arms) or figuratively「問題 / 借金を抱える」(bear a burden/problem) is the natural usage.",
    },
    incorrect: [
      {
        ja: "期末試験が始まる前までに、この分厚い歴史の教科書をすべて抱えなければなりません。",
        en: "Before the final exam begins, I must hold in my arms all of this thick history textbook.",
        exp: "Unnatural. Reading through books uses「読まなければ」(must read) or「頭に入れなければ」, not「抱える」.",
      },
      {
        ja: "駅から自宅までの上り坂の道を、自転車を押しながら十五分ほど抱えました。",
        en: "I held the uphill road from the station to home for about fifteen minutes pushing the bicycle.",
        exp: "Unnatural. Time spent walking or traveling uses「歩きました」(walked) or「かかりました」(took), not「抱えました」.",
      },
      {
        ja: "風邪を引いて高熱が出ていたので、氷嚢で額をしっかりと抱えて休んでいました。",
        en: "Because I had caught a cold and had a high fever, I held my forehead firmly with an ice pack and rested.",
        exp: "Unnatural. Cooling body parts uses「冷やして」(cooled), not「抱えて」.",
      },
    ],
  },
  {
    id: "usage-n3-sakarao",
    word: "逆らう",
    reading: "さからう",
    romaji: "sakarau",
    meanings: ["to go against", "to oppose", "to defy"],
    pos: ["v5u", "vi"],
    correct: {
      ja: "川をボートで漕ぎ上がるとき、強い水の流れに逆らいながら力いっぱい進みました。",
      en: "When rowing up the river by boat, we advanced with all our strength while going against the strong water current.",
      exp: "「流れ / 風 / 命令 / 親の言いつけに逆らう」naturally expresses moving against a current/wind or defying authority.",
    },
    incorrect: [
      {
        ja: "毎朝七時にアラームが鳴ると、布団の中で二度寝することにすぐに逆らいます。",
        en: "Every morning when the alarm sounds at 7:00, I immediately oppose falling back to sleep in the futon.",
        exp: "Unnatural. Resisting temptation uses「こらえます」(endure/resist) or「我慢します」, not「逆らいます」.",
      },
      {
        ja: "友達から借りていた貴重な資料を、約束していた期日通りにきちんと逆らいました。",
        en: "I properly opposed the precious reference materials borrowed from my friend by the promised deadline.",
        exp: "Unnatural. Returning borrowed items uses「返却しました」(returned) or「返しました」, not「逆らいました」.",
      },
      {
        ja: "お腹がすいたので、駅前のパン屋で焼きたてのクロワッサンを二つ逆らいました。",
        en: "Because I was hungry, I opposed two freshly baked croissants at the station bakery.",
        exp: "Unnatural. Purchasing food uses「買いました」(bought), not「逆らいました」.",
      },
    ],
  },
  {
    id: "usage-n3-habuku",
    word: "省く",
    reading: "はぶく",
    romaji: "habuku",
    meanings: ["to omit", "to leave out", "to curtail"],
    pos: ["v5k", "vt"],
    correct: {
      ja: "会議の時間が迫っていたため、前置きの挨拶を省いてすぐに本題の議論に入りました。",
      en: "Because time for the meeting was pressing, we omitted introductory greetings and immediately entered into the main discussion.",
      exp: "「説明 / 手間 / 前置きを省く」collocates with omitting or cutting out unneeded procedures or words.",
    },
    incorrect: [
      {
        ja: "泥遊びをして汚れてしまった子供の靴を、水道水とブラシで綺麗に省きました。",
        en: "I omitted the child's muddy shoes cleanly with tap water and a brush.",
        exp: "Unnatural. Cleaning dirt off objects uses「洗いました」(washed) or「落としました」, not「省きました」.",
      },
      {
        ja: "新しいスーツに着替えてから、会社に出勤するための準備を急いで省きました。",
        en: "After changing into a new suit, I hurriedly omitted the preparations for going to work.",
        exp: "Unnatural. Completing preparations uses「整えました」(completed) or「済ませました」, not「省きました」.",
      },
      {
        ja: "彼は陸上競技の選手の中で走るスピードが飛び抜けて省いていて、常に優勝します。",
        en: "Among the track athletes, his running speed is exceptionally omitted, and he always wins.",
        exp: "Unnatural. Being superior or outstanding uses「優れていて」(superior) or「速くて」, not「省いていて」.",
      },
    ],
  },
  {
    id: "usage-n3-fusegu",
    word: "防ぐ",
    reading: "ふせぐ",
    romaji: "fusegu",
    meanings: ["to prevent", "to defend against", "to ward off"],
    pos: ["v5g", "vt"],
    correct: {
      ja: "冬場の乾燥した季節には、火災の発生を未然に防ぐために徹底的な点検が行われます。",
      en: "In the dry winter season, thorough inspections are conducted to prevent the outbreak of fires beforehand.",
      exp: "「火災 / 事故 / 犯罪 / 寒さを防ぐ」is the standard verb for warding off harm, cold, or accidents.",
    },
    incorrect: [
      {
        ja: "先生が黒板に丁寧に書いた英語の文法規則を、ノートに鉛筆で防ぎました。",
        en: "I defended the English grammar rules that the teacher wrote neatly on the blackboard into my notebook with a pencil.",
        exp: "Unnatural. Taking notes uses「ノートに取りました」(took notes) or「書き留めました」, not「防ぎました」.",
      },
      {
        ja: "夏祭りの屋台で、冷たく冷えたラムネと甘いかき氷を一つずつ防ぎました。",
        en: "At the summer festival stall, I defended a cold ramune and sweet shaved ice one by one.",
        exp: "Unnatural. Buying or eating festival treats uses「買いました」(bought) or「食べました」, not「防ぎました」.",
      },
      {
        ja: "今度の土曜日に高校の同窓会を開く約束を、クラスの幹事と防ぎました。",
        en: "I defended the promise to hold a high school reunion this Saturday with the class organizer.",
        exp: "Unnatural. Making a promise or arrangement uses「交わしました」(exchanged) or「しました」, not「防ぎました」.",
      },
    ],
  },
  {
    id: "usage-n3-maneku",
    word: "招く",
    reading: "まねく",
    romaji: "maneku",
    meanings: ["to invite", "to incur", "to bring about"],
    pos: ["v5k", "vt"],
    correct: {
      ja: "不注意な発言が思わぬ誤解を招いてしまい、相手を不快にさせてしまいました。",
      en: "A careless remark brought about unexpected misunderstandings and made the other party uncomfortable.",
      exp: "「誤解 / 危険 / 事故を招く」(incur/lead to) or「客 / 友人を招く」(invite guests) is the authentic collocation.",
    },
    incorrect: [
      {
        ja: "デパートのレジで買い物をした際、持っていたクレジットカードで代金を招きました。",
        en: "When shopping at the department store cash register, I invited the price with the credit card I had.",
        exp: "Unnatural. Paying money uses「支払いました」(paid) or「払いました」, not「招きました」.",
      },
      {
        ja: "壊れてパンクした自転車を、駅前のサイクルショップに持っていって招いてもらいました。",
        en: "I took the punctured bicycle to the cycle shop in front of the station and had it invited.",
        exp: "Unnatural. Repairing machines uses「修理してもらいました」(had repaired), not「招いてもらいました」.",
      },
      {
        ja: "毎朝早起きをして、健康のために近所の緑豊かな遊歩道を三十分ほど招いています。",
        en: "Waking up early every morning, I invite the neighborhood's leafy promenade for about thirty minutes for health.",
        exp: "Unnatural. Walking or jogging uses「ウォーキングしています」(walking) or「走っています」, not「招いています」.",
      },
    ],
  },
  {
    id: "usage-n3-kentou",
    word: "見当",
    reading: "けんとう",
    romaji: "kentou",
    meanings: ["guess", "estimate", "bearings", "clue"],
    pos: ["noun"],
    correct: {
      ja: "大切な家の鍵をどこで落としたのか、いくら記憶をたどっても全く見当がつきません。",
      en: "No matter how much I trace my memory of where I dropped the important house key, I have no clue at all.",
      exp: "「見当がつく / つかない」(have a clue/guess) and「見当違い」(off the mark) are established idiomatic collocations.",
    },
    incorrect: [
      {
        ja: "天気の良い晴れた日には、私のマンションのベランダから遠くの山々が見当できます。",
        en: "On clear sunny days, distant mountains can be guessed from my apartment balcony.",
        exp: "Unnatural. Seeing visual vistas uses「見えます」(can be seen) or「眺められます」, not「見当できます」.",
      },
      {
        ja: "映画館の自動発券機で、本日公開の新作アクション映画のチケットを見当しました。",
        en: "I guessed the ticket for the new action movie released today at the cinema automatic ticketing machine.",
        exp: "Unnatural. Purchasing tickets uses「購入しました」(purchased) or「買いました」, not「見当しました」.",
      },
      {
        ja: "彼女はとても見当な性格で、誰に対しても分け隔てなく明るい笑顔で接しています。",
        en: "She has a very guess personality and treats anyone with a bright smile without discrimination.",
        exp: "Unnatural. Personality traits use「温和な」(gentle) or「明るい」(cheerful).「見当」is a noun, not an adjective.",
      },
    ],
  },
  {
    id: "usage-n3-reisei",
    word: "冷静",
    reading: "れいせい",
    romaji: "reisei",
    meanings: ["calm", "composed", "cool-headed"],
    pos: ["adj-na", "noun"],
    correct: {
      ja: "非常ベルが突然鳴り響いてもパニックに陥ることなく、冷静に行動して安全に避難しました。",
      en: "Even when the emergency bell rang out suddenly, without falling into a panic, I acted calmly and evacuated safely.",
      exp: "「冷静沈着」「冷静な判断 / 態度」「冷静に対処する」naturally describes maintaining emotional composure.",
    },
    incorrect: [
      {
        ja: "真冬の早朝は外の気温が氷点下まで下がり、頬に触れる風がとても冷静です。",
        en: "In the early morning of midwinter, outdoor temperature drops below freezing, and the wind touching the cheeks is very calm.",
        exp: "Unnatural. Cold thermal air uses「冷たい」(cold/chilly), not「冷静」.「冷静」applies to mental composure.",
      },
      {
        ja: "熱々の焼きたてステーキに、冷蔵庫で冷やした冷静なソースをたっぷりかけました。",
        en: "Over the piping hot freshly grilled steak, I poured plenty of calm sauce chilled in the refrigerator.",
        exp: "Unnatural. Chilled food uses「冷たい」(cold) or「冷製の」(served cold, e.g. 冷製パスタ), not the word「冷静」.",
      },
      {
        ja: "彼は足の運びがとても冷静で、百メートル走のタイムが学年で一番速いです。",
        en: "His foot movement is very calm, and his 100-meter sprint time is the fastest in his grade.",
        exp: "Unnatural. Fast running movements use「素早くて」(swift) or「速くて」, not「冷静」.",
      },
    ],
  },
  {
    id: "usage-n3-kaiteki",
    word: "快適",
    reading: "かいてき",
    romaji: "kaiteki",
    meanings: ["comfortable", "pleasant", "agreeable"],
    pos: ["adj-na", "noun"],
    correct: {
      ja: "新しく改装されたホテルの部屋は静かでベッドの寝心地もよく、非常に快適に過ごせました。",
      en: "The newly renovated hotel room was quiet and the bed was comfortable to sleep on, so I spent my stay extremely pleasantly.",
      exp: "「快適な生活 / 快適なホテル / 快適に過ごす」collocates with physically pleasant, comfortable living environments.",
    },
    incorrect: [
      {
        ja: "今日の日本語能力試験の語彙問題はとても快適で、開始十分で全て解き終わりました。",
        en: "Today's JLPT vocabulary problems were very comfortable, and I finished solving all of them in ten minutes.",
        exp: "Unnatural. Easy exam questions use「簡単で」(easy) or「やさしくて」, not「快適」.",
      },
      {
        ja: "新幹線の走行スピードは非常に快適で、東京から大阪まであっという間でした。",
        en: "The Shinkansen running speed was extremely comfortable, and it took no time from Tokyo to Osaka.",
        exp: "Unnatural. Physical speed uses「速くて」(fast), not「快適」.",
      },
      {
        ja: "このラーメンはスープの出汁と醤油のバランスが快適で、スープを飲み干しました。",
        en: "This ramen's broth balance with soy sauce was comfortable, and I drank all the soup.",
        exp: "Unnatural. Delicious flavor balance uses「絶妙で」(exquisite) or「ちょうどよくて」, not「快適」.",
      },
    ],
  },
  {
    id: "usage-n3-shinsen",
    word: "新鮮",
    reading: "しんせん",
    romaji: "shinsen",
    meanings: ["fresh"],
    pos: ["adj-na", "noun"],
    correct: {
      ja: "海沿いの市場には、今朝漁港で水揚げされたばかりの新鮮な魚介類が所狭しと並んでいます。",
      en: "At the seaside market, fresh seafood just landed at the fishing port this morning is lined up tightly.",
      exp: "「新鮮な魚 / 野菜 / 新鮮な空気 / 新鮮なアイデア」describes newly harvested foods or refreshing, novel impressions.",
    },
    incorrect: [
      {
        ja: "先生による物理の解説はとても新鮮で、難しい数式の意味がすんなり理解できました。",
        en: "The teacher's explanation of physics was very fresh, and the meaning of difficult formulas was understood smoothly.",
        exp: "Unnatural. Clear explanations use「わかりやすくて」(easy to understand) or「明快で」, not「新鮮」.",
      },
      {
        ja: "昨日の数学の宿題プリントはとても新鮮で、解き終わるまでに四時間もかかりました。",
        en: "Yesterday's math homework sheet was very fresh, and it took four hours until I finished solving it.",
        exp: "Unnatural. Tough, demanding homework uses「難しくて」(difficult) or「大変で」, not「新鮮」.",
      },
      {
        ja: "この新型スマートフォンは重量がとても新鮮なので、ポケットに入れても邪魔になりません。",
        en: "Because this new smartphone weight is very fresh, it doesn't get in the way even in a pocket.",
        exp: "Unnatural. Light weight uses「軽くて」(light), not「新鮮」.",
      },
    ],
  },
  {
    id: "usage-n3-guuzen",
    word: "偶然",
    reading: "ぐうぜん",
    romaji: "guuzen",
    meanings: ["coincidence", "by chance"],
    pos: ["adj-na", "adv", "noun"],
    correct: {
      ja: "休日に街の大型書店で本を探していたら、偶然小学校時代の同級生に出会いました。",
      en: "While looking for a book at a large bookstore in town on my day off, I ran into an elementary school classmate by chance.",
      exp: "「偶然出会う / 偶然の一致」is the standard adverb or noun for unexpected happenstance.",
    },
    incorrect: [
      {
        ja: "毎朝同じ時刻の通勤電車に乗ることを、私の生活の偶然として長年続けています。",
        en: "I have continued riding the commuter train at the same time every morning as my life's coincidence for years.",
        exp: "Unnatural. A deliberate routine uses「日課」(daily routine) or「習慣」(habit), not「偶然」.",
      },
      {
        ja: "彼はとても記憶力が抜群で、教科書の英単語を何百個も偶然に暗記しています。",
        en: "He has exceptional memory and coincidently memorized hundreds of English words from the textbook.",
        exp: "Unnatural. Intentional memorization uses「完璧に」(perfectly) or「しっかり」, not「偶然に」.",
      },
      {
        ja: "気象庁の週間予報によると、明日の夕方から夜にかけて偶然に大雨になる見込みです。",
        en: "According to the meteorological agency's weekly forecast, it is expected to rain heavily by coincidence from tomorrow evening.",
        exp: "Unnatural. Weather forecasts use「おそらく」(likely) or「確実に」(surely), not「偶然に」.",
      },
    ],
  },
  {
    id: "usage-n3-jojoni",
    word: "徐々に",
    reading: "じょじょに",
    romaji: "jojoni",
    meanings: ["gradually", "slowly", "step by step"],
    pos: ["adv"],
    correct: {
      ja: "退院後は毎日少しずつ散歩を続け、落ちていた体力を徐々に回復させていきました。",
      en: "After leaving the hospital, I continued taking short walks every day and gradually recovered my weakened physical strength.",
      exp: "「徐々に回復する / 増える / 慣れる」describes a steady, gradual process over time.",
    },
    incorrect: [
      {
        ja: "静まり返った部屋の中で背後から急に大きな物音がして、徐々にびっくりしました。",
        en: "In the completely quiet room, a sudden loud sound came from behind and I was gradually startled.",
        exp: "Unnatural. Sudden shock uses「思わず」(involuntarily) or「とても」(very), not「徐々に」(which requires duration).",
      },
      {
        ja: "開演時間に遅刻しそうだったので、駅の改札口から劇場まで徐々に走りました。",
        en: "Because I was about to be late for the showtime, I gradually ran from the ticket gate to the theater.",
        exp: "Unnatural. Rushing under time pressure uses「急いで」(hurriedly) or「全力で」, not「徐々に」.",
      },
      {
        ja: "この便利な最新掃除機は、ボタンを一度押すだけで徐々に部屋がピカピカになります。",
        en: "With this convenient latest vacuum cleaner, just by pressing one button the room gradually becomes sparkling.",
        exp: "Unnatural. Quick automated results use「あっという間に」(in a flash) or「すぐに」, not「徐々に」.",
      },
    ],
  },
  {
    id: "usage-n3-tsuneni",
    word: "常に",
    reading: "つねに",
    romaji: "tsuneni",
    meanings: ["always", "constantly"],
    pos: ["adv"],
    correct: {
      ja: "医療に従事する看護師として、患者さんの安全と安心を常に最優先に考えています。",
      en: "As a nurse engaged in healthcare, I am constantly considering the safety and peace of mind of patients as top priority.",
      exp: "「常に意識する / 常に考える / 常に心がける」is the natural formal adverb for constant, continuous mindfulness.",
    },
    incorrect: [
      {
        ja: "昨夜は残業続きで極度に疲れていたため、ベッドに横になると常に熟睡しました。",
        en: "Because I was extremely fatigued from continuous overtime last night, when I lay on bed I constantly fell asleep soundly.",
        exp: "Unnatural. Immediate transition uses「すぐに」(immediately) or「あっという間に」, not「常に」.",
      },
      {
        ja: "彼の履いている靴は特注品で、足のサイズがとても常にで普通の店では買えません。",
        en: "The shoes he wears are custom-made, and his foot size is very constantly, so he cannot buy in normal shops.",
        exp: "Unnatural. Size dimensions use「大きくて」(large).「常に」is an adverb and cannot describe size.",
      },
      {
        ja: "パン屋のオーブンから出たばかりのクロワッサンは、生地が常にサクサクして美味しいです。",
        en: "The croissants just out of the bakery oven have constantly crispy pastry and are delicious.",
        exp: "Unnatural. Degree of crispiness uses「とても」(very) or「非常に」, not「常に」.",
      },
    ],
  },
  {
    id: "usage-n3-omowazu",
    word: "思わず",
    reading: "おもわず",
    romaji: "omowazu",
    meanings: ["spontaneously", "unintentionally", "involuntarily"],
    pos: ["adv"],
    correct: {
      ja: "友人のあまりにおかしな冗談を聞いて、静かな図書館の中だったのに思わず笑ってしまいました。",
      en: "Hearing my friend's terribly funny joke, even though we were inside a quiet library, I burst out laughing involuntarily.",
      exp: "「思わず笑ってしまう / 思わず手が出る」is the authentic adverb for spontaneous, instinctive reactions without forethought.",
    },
    incorrect: [
      {
        ja: "明日の朝一番の重要な面接試験に備えて、目覚まし時計を思わず六時に設定しました。",
        en: "In preparation for tomorrow's first important interview test in the morning, I involuntarily set the alarm clock to 6:00.",
        exp: "Unnatural. Purposeful planning uses「しっかり」(firmly) or「前もって」(in advance), not「思わず」.",
      },
      {
        ja: "彼女はとても思わず性格で、初対面の人に対しても礼儀正しく丁寧に自己紹介をします。",
        en: "She has a very involuntary personality and introduces herself politely and courteously even to strangers.",
        exp: "Unnatural. Personality uses「礼儀正しい」(polite) or「真面目な」.「思わず」cannot modify personality as an adjective.",
      },
      {
        ja: "夏休みの宿題の読書感想文を思わず書き終えて、担任の先生に提出しました。",
        en: "I involuntarily finished writing the book review for summer homework and submitted it to my teacher.",
        exp: "Unnatural. Purposeful completion uses「無事に」(successfully) or「予定通り」, not「思わず」.",
      },
    ],
  },
  {
    id: "usage-n3-kaifuku",
    word: "回復",
    reading: "かいふく",
    romaji: "kaifuku",
    meanings: ["recovery", "restoration", "improvement"],
    pos: ["noun", "suru-verb"],
    correct: {
      ja: "数日間の入院治療と十分な休養のおかげで、病気で衰えていた体力がすっかり回復しました。",
      en: "Thanks to several days of inpatient treatment and sufficient rest, my physical strength weakened by illness recovered completely.",
      exp: "「体力が回復する / 景気が回復する / 天候が回復する」is the natural usage for health, economy, or weather restoring to a good state.",
    },
    incorrect: [
      {
        ja: "引っ越し作業を手伝ってくれた親友へのお礼に、デパートで高級なお菓子を回復しました。",
        en: "As thanks to my best friend who helped with moving work, I recovered high-class sweets at the department store.",
        exp: "Unnatural. Giving presents uses「贈りました」(presented) or「買いました」(bought), not「回復しました」.",
      },
      {
        ja: "大学の図書館のカウンターで、期末レポートに必要な参考書籍を三冊回復しました。",
        en: "At the university library counter, I recovered three reference books needed for the final report.",
        exp: "Unnatural. Borrowing books uses「借りました」(borrowed), not「回復しました」.",
      },
      {
        ja: "雨で泥だらけになったスニーカーをブラシで磨いて、新品のように回復しました。",
        en: "I polished the mud-covered sneakers with a brush and recovered them like new.",
        exp: "Unnatural. Cleaning items uses「綺麗にしました」(made clean) or「落としました」, not「回復しました」.",
      },
    ],
  },
  {
    id: "usage-n3-kaiketsu",
    word: "解決",
    reading: "かいけつ",
    romaji: "kaiketsu",
    meanings: ["resolution", "settlement"],
    pos: ["noun", "suru-verb"],
    correct: {
      ja: "近隣住民との間で長年続いていた土地の境界を巡るトラブルが、話し合いによって無事に解決しました。",
      en: "The trouble concerning land boundaries that had continued for years with neighbors was safely resolved through talks.",
      exp: "「問題を解決する / トラブルが解決する / 紛争を解決する」is the natural collocation for resolving disputes, problems, or issues.",
    },
    incorrect: [
      {
        ja: "先生が黒板に書いた試験に出る重要な公式を、急いで手帳に鉛筆で解決しました。",
        en: "I hurriedly resolved the important formulas appearing on the exam written on the board into my notebook with a pencil.",
        exp: "Unnatural. Writing down board notes uses「ノートに書き写しました」(copied down), not「解決しました」.",
      },
      {
        ja: "劇場の開演時間が近づいてきたので、チケット販売機の列に並んで入場券を解決しました。",
        en: "Because the theater showtime approached, I lined up in the ticketing machine queue and resolved admission tickets.",
        exp: "Unnatural. Buying tickets uses「購入しました」(purchased) or「買いました」, not「解決しました」.",
      },
      {
        ja: "真冬の凍えるような寒い朝には、温かいココアを一杯飲んで冷えた体を解決します。",
        en: "On freezing cold mornings in midwinter, I resolve my chilled body by drinking a cup of warm cocoa.",
        exp: "Unnatural. Warming the body uses「温めます」(warm up), not「解決します」.",
      },
    ],
  },
  {
    id: "usage-n3-gokai",
    word: "誤解",
    reading: "ごかい",
    romaji: "gokai",
    meanings: ["misunderstanding"],
    pos: ["noun", "suru-verb"],
    correct: {
      ja: "私の曖昧な返事のせいで相手に大きな誤解を与えてしまったので、急いで事情を説明して誤解を解きました。",
      en: "Because my ambiguous reply gave a big misunderstanding to the other party, I hurriedly explained the circumstances and cleared the misunderstanding.",
      exp: "「誤解を与える / 誤解を招く / 誤解を解く」(clear a misunderstanding) is the classic natural idiom.",
    },
    incorrect: [
      {
        ja: "日本語の検定試験で高得点を取るため、単語帳に載っている漢字の誤解をすべて覚えました。",
        en: "To get a high score on the Japanese proficiency test, I memorized all the kanji misunderstandings listed in the vocabulary book.",
        exp: "Unnatural. The explanation of word semantics is「意味」(meaning) or「語義」, not「誤解」.",
      },
      {
        ja: "明日の理科の実験に必要な実験器具の名前を、黒板のメモから手帳に誤解して写しました。",
        en: "I copied the names of the laboratory equipment needed for tomorrow's science experiment from the board memo into my notebook by misunderstanding.",
        exp: "Unnatural. Copying notes accurately uses「書き写しました」(copied down), not「誤解して写した」.",
      },
      {
        ja: "彼は足の回転がとても誤解で、サッカーの試合で相手ディフェンダーを次々と抜き去りました。",
        en: "His foot turnover is very misunderstanding, and he bypassed opponent defenders one after another in the soccer match.",
        exp: "Unnatural. Fast footwork uses「素早くて」(swift) or「速くて」, not「誤解」.",
      },
    ],
  },
  {
    id: "usage-n3-shoutotsu",
    word: "衝突",
    reading: "しょうとつ",
    romaji: "shoutotsu",
    meanings: ["collision", "clash", "conflict"],
    pos: ["noun", "suru-verb"],
    correct: {
      ja: "見通しの悪い交差点で、無理に右折しようとした乗用車と直進してきたバイクが激しく衝突しました。",
      en: "At the intersection with poor visibility, a car attempting to turn right recklessly and a motorcycle going straight collided violently.",
      exp: "「車が衝突する」(vehicles collide) or figuratively「意見 / 利害が衝突する」(opinions/interests clash) is the authentic usage.",
    },
    incorrect: [
      {
        ja: "夏休みに祖母の田舎の古い日本家屋を久しぶりに衝突して、親戚みんなで集まりました。",
        en: "During summer vacation, I collided with my grandmother's old Japanese house in the countryside for the first time in a while and gathered with relatives.",
        exp: "Unnatural. Visiting homes uses「訪ねて」(visited) or「行って」, not「衝突して」.",
      },
      {
        ja: "部活動で喉がカラカラに渇いたので、学校の自動販売機で冷たいスポーツドリンクを衝突しました。",
        en: "Because my throat was parched in club activities, I collided with a cold sports drink at the school vending machine.",
        exp: "Unnatural. Purchasing beverages uses「買いました」(bought), not「衝突しました」.",
      },
      {
        ja: "明日の遠足の準備のために、お弁当や水筒を忘れないようリュックサックに衝突しました。",
        en: "In preparation for tomorrow's excursion, I collided lunch boxes and water bottles into my backpack so as not to forget.",
        exp: "Unnatural. Packing goods into bags uses「詰めました」(packed) or「入れました」, not「衝突しました」.",
      },
    ],
  },
  {
    id: "usage-n3-sonchou",
    word: "尊重",
    reading: "そんちょう",
    romaji: "sonchou",
    meanings: ["respect", "esteem", "valuing"],
    pos: ["noun", "suru-verb"],
    correct: {
      ja: "多国籍のメンバーが働くチームでは、文化や価値観の違いをお互いに尊重し合う姿勢が欠かせません。",
      en: "In a team where multinational members work, the attitude of mutually respecting differences in cultures and values is indispensable.",
      exp: "「意見 / 人権 / 個性 / 価値観を尊重する」is the standard verb for respecting opinions, human rights, or diverse values.",
    },
    incorrect: [
      {
        ja: "泥だらけになった作業着を洗濯機に入れて、強力な洗剤でしっかりと尊重して洗いました。",
        en: "I put the mud-stained work clothes into the washing machine and washed them firmly with strong detergent respecting.",
        exp: "Unnatural. Washing clothes thoroughly uses「綺麗に」(cleanly) or「念入りに」, not「尊重して」.",
      },
      {
        ja: "彼はとても尊重な足取りで階段を駆け上がり、あっという間に三階の教室に着きました。",
        en: "He ran up the stairs with very respecting steps and reached the third-floor classroom in no time.",
        exp: "Unnatural. Light or swift footwork uses「軽快な」(light-footed/brisk) or「素早い」, not「尊重」.",
      },
      {
        ja: "図書館で借りてきた大好きな推理小説を、週末の休日に熱中して一気に尊重しました。",
        en: "I was absorbed in the favorite mystery novel borrowed from the library and respected it in one go on the weekend holiday.",
        exp: "Unnatural. Reading a book through uses「読み終えました」(finished reading) or「読破しました」, not「尊重しました」.",
      },
    ],
  },
];

console.log("Total N3 raw items:", RAW_N3_ITEMS.length);
if (RAW_N3_ITEMS.length !== 20) {
  throw new Error(`Expected exactly 20 items, found ${RAW_N3_ITEMS.length}`);
}

// Convert to WordUsageItem[] with distributed correctOptionIndex
const n3Items: WordUsageItem[] = RAW_N3_ITEMS.map((raw, itemIdx) => {
  const correctIdx = (itemIdx % 4) as 0 | 1 | 2 | 3;

  const options: WordUsageSentenceOption[] = [];
  let incIdx = 0;
  for (let optIdx = 0; optIdx < 4; optIdx++) {
    const isCorrect = optIdx === correctIdx;
    if (isCorrect) {
      options.push({
        id: `opt-${optIdx + 1}`,
        sentenceJa: raw.correct.ja,
        sentenceEn: raw.correct.en,
        isCorrect: true,
        explanation: raw.correct.exp,
      });
    } else {
      const inc = raw.incorrect[incIdx];
      incIdx++;
      options.push({
        id: `opt-${optIdx + 1}`,
        sentenceJa: inc.ja,
        sentenceEn: inc.en,
        isCorrect: false,
        explanation: inc.exp,
      });
    }
  }

  return {
    id: raw.id,
    level: "N3",
    jlpt: 3,
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

const OUT_FILE = path.join(OUT_DIR, "n3.ts");
const content = `// Curated JLPT N3 Word Usage (語彙・用法 — Mondai 5) items
// Generated from enriched N3 vocabulary source data.

import type { WordUsageItem } from "../wordUsageData";

export const WORD_USAGE_N3_ITEMS: readonly WordUsageItem[] = ${JSON.stringify(
  n3Items,
  null,
  2,
)};
`;

fs.writeFileSync(OUT_FILE, content, "utf-8");
console.log(`Successfully wrote ${n3Items.length} curated N3 items to ${OUT_FILE}`);
