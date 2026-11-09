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

const RAW_N4_ITEMS: RawItemData[] = [
  {
    id: "usage-n4-annai",
    word: "案内",
    reading: "あんない",
    romaji: "annai",
    meanings: ["guidance", "showing around"],
    pos: ["noun", "suru-verb"],
    correct: {
      ja: "友人が東京に遊びに来たので、有名な観光地を案内しました。",
      en: "A friend came to Tokyo to visit, so I showed them around famous sightseeing spots.",
      exp: "「案内する」is naturally used for guiding people around a city, building, or tourist destination (街や観光地を案内する).",
    },
    incorrect: [
      {
        ja: "来週のパーティーで、新しいクラスメートに私を案内してください。",
        en: "At next week's party, please introduce me to the new classmates.",
        exp: "Unnatural. Use「紹介する」(introduce) when introducing a person to someone else, not「案内する」.",
      },
      {
        ja: "この文法書は日本語の助詞の使い方をとても案内しています。",
        en: "This grammar book explains the use of Japanese particles very well.",
        exp: "Unnatural. Use「説明している」(explaining) or「解説している」, not「案内している」.",
      },
      {
        ja: "道が分からないので、交番の警察官に駅までの案内を尋ねました。",
        en: "Since I didn't know the way, I asked the police officer at the police box for directions to the station.",
        exp: "Unnatural. Use「道を尋ねる」(ask the way) or「行き方を聞く」, not「案内を尋ねる」.",
      },
    ],
  },
  {
    id: "usage-n4-sewa",
    word: "世話",
    reading: "せわ",
    romaji: "sewa",
    meanings: ["care", "looking after"],
    pos: ["noun", "suru-verb"],
    correct: {
      ja: "両親が旅行に出かけている間、一人で妹の世話をしました。",
      en: "While my parents were away on a trip, I looked after my younger sister by myself.",
      exp: "「世話をする」is the natural collocation for taking care of people or pets (子供/妹/ペットの世話をする).",
    },
    incorrect: [
      {
        ja: "仕事が忙しすぎて、自分の趣味の時間が全然世話できません。",
        en: "I am too busy with work and cannot make any time for my hobbies.",
        exp: "Unnatural. Use「作れません」(cannot make time) or「取れません」, not「世話できません」.",
      },
      {
        ja: "先生に難しい漢字の正しい書き順を世話してもらいました。",
        en: "I had the teacher teach me the correct stroke order for difficult kanji.",
        exp: "Unnatural. Use「教えてもらいました」(had them teach me), not「世話してもらいました」.",
      },
      {
        ja: "明日の重要な社内会議の世話は私が担当することになっています。",
        en: "I am scheduled to be in charge of the preparations for tomorrow's important company meeting.",
        exp: "Unnatural. Use「準備」(preparation) or「進行」(facilitation/moderating), not「世話」.",
      },
    ],
  },
  {
    id: "usage-n4-enryo",
    word: "遠慮",
    reading: "えんりょ",
    romaji: "enryo",
    meanings: ["reserve", "holding back", "hesitation"],
    pos: ["noun", "suru-verb"],
    correct: {
      ja: "料理はたくさん用意してありますから、どうぞ遠慮しないで召し上がってください。",
      en: "There is plenty of food prepared, so please eat as much as you like without holding back.",
      exp: "「遠慮しないで〜する」is the natural phrase for politely inviting someone to help themselves without hesitating.",
    },
    incorrect: [
      {
        ja: "彼はいつも時間に遠慮するので、集合場所に遅れて来ます。",
        en: "He is always sloppy with time, so he arrives late to the meeting point.",
        exp: "Unnatural. Use「時間にルーズ」(careless with time) or「時間を守らない」, not「遠慮する」.",
      },
      {
        ja: "突然雨が降ってきたので、傘を遠慮して小走りで駅へ向かいました。",
        en: "Since it suddenly began raining, I gave up on an umbrella and trotted to the station.",
        exp: "Unnatural. Use「あきらめて」(gave up) or「持たずに」(without carrying), not「遠慮して」.",
      },
      {
        ja: "この図書館の自習室はとても遠慮で、静かに集中できます。",
        en: "The study room in this library is very quiet, so you can concentrate peacefully.",
        exp: "Unnatural. Use「静か」(quiet) or「落ち着いている」.「遠慮」cannot describe the atmosphere of a room.",
      },
    ],
  },
  {
    id: "usage-n4-renraku",
    word: "連絡",
    reading: "れんらく",
    romaji: "renraku",
    meanings: ["contact", "getting in touch"],
    pos: ["noun", "suru-verb"],
    correct: {
      ja: "電車の遅延で遅れそうだったので、すぐに上司に電話で連絡しました。",
      en: "Because I seemed likely to be late due to a train delay, I immediately contacted my supervisor by phone.",
      exp: "「連絡する」collocates with getting in touch by phone or email (電話/メールで連絡する).",
    },
    incorrect: [
      {
        ja: "私たちの大学から隣の駅までは直通バスで連絡しています。",
        en: "Our university is connected to the neighboring station by a direct bus service.",
        exp: "Unnatural. Use「つながっています」(connected) or「結ばれています」, not「連絡しています」.",
      },
      {
        ja: "先生が出した難しいクイズに誰も正しく連絡できませんでした。",
        en: "Nobody was able to answer correctly the difficult quiz that the teacher gave.",
        exp: "Unnatural. Use「答えられませんでした」(could not answer), not「連絡できませんでした」.",
      },
      {
        ja: "このスイッチを押すと、玄関の明かりが自動で連絡します。",
        en: "When you press this switch, the entrance light turns on automatically.",
        exp: "Unnatural. Use「つきます」(turns on), not「連絡します」.",
      },
    ],
  },
  {
    id: "usage-n4-soudan",
    word: "相談",
    reading: "そうだん",
    romaji: "soudan",
    meanings: ["consultation", "discussion"],
    pos: ["noun", "suru-verb"],
    correct: {
      ja: "将来の大学進学について、担任の先生に相談に乗ってもらいました。",
      en: "I had my homeroom teacher consult with me regarding my future university entrance.",
      exp: "「相談に乗る / 相談する」is the natural idiom for seeking advice or consulting on important personal matters.",
    },
    incorrect: [
      {
        ja: "図書館の閲覧席で、一人で静かに歴史の小説を相談しています。",
        en: "In the reading seat of the library, I am quietly reading a history novel alone.",
        exp: "Unnatural. Use「読んでいます」(reading), not「相談しています」.",
      },
      {
        ja: "昨日の夕方に友達と相談をかけて、一緒に晩ご飯を食べました。",
        en: "Yesterday evening I invited my friend and had dinner together.",
        exp: "Unnatural. Use「声をかけて」(reached out/invited) or「約束をして」, not「相談をかけて」.",
      },
      {
        ja: "明日の天気予報をインターネットで相談したら、晴れだそうです。",
        en: "When I checked tomorrow's weather forecast on the internet, it said it will be sunny.",
        exp: "Unnatural. Use「調べたら」(looked up/checked), not「相談したら」.",
      },
    ],
  },
  {
    id: "usage-n4-koshou",
    word: "故障",
    reading: "こしょう",
    romaji: "koshou",
    meanings: ["breakdown", "mechanical malfunction"],
    pos: ["noun", "suru-verb"],
    correct: {
      ja: "急に冷蔵庫が故障して冷えなくなったので、修理業者を呼びました。",
      en: "The refrigerator suddenly broke down and stopped cooling, so I called a repair technician.",
      exp: "「故障する」applies strictly to machines, appliances, or vehicles breaking down (機械や車が故障する).",
    },
    incorrect: [
      {
        ja: "階段から滑り落ちて右足を故障してしまいました。",
        en: "I slipped down the stairs and injured my right leg.",
        exp: "Unnatural. Human body parts do not「故障する」; use「怪我をして」(injured) or「痛めて」.",
      },
      {
        ja: "些細な喧嘩が原因で、長年の親友との友情が故障してしまった。",
        en: "Due to a trivial fight, my long-standing friendship with my best friend broke apart.",
        exp: "Unnatural. Use「壊れてしまった」(broke down) or「ひびが入ってしまった」for human relationships, not「故障」.",
      },
      {
        ja: "明日のレポート提出の締め切りに故障しないよう、夜遅くまで書いた。",
        en: "To not miss tomorrow's report submission deadline, I wrote until late at night.",
        exp: "Unnatural. Use「遅れないよう」(not be late) or「間に合うよう」, not「故障しないよう」.",
      },
    ],
  },
  {
    id: "usage-n4-yakusoku",
    word: "約束",
    reading: "やくそく",
    romaji: "yakusoku",
    meanings: ["promise", "appointment"],
    pos: ["noun", "suru-verb"],
    correct: {
      ja: "今日の午後、駅前の喫茶店で友達と会う約束があります。",
      en: "This afternoon, I have an appointment to meet a friend at the cafe in front of the station.",
      exp: "「会う約束がある / 約束を守る」is the natural phrasing for having an agreement or appointment with someone.",
    },
    incorrect: [
      {
        ja: "毎朝早く起きて三十分走る約束を五年間続けています。",
        en: "I have continued the habit of waking up early every morning to run for thirty minutes for five years.",
        exp: "Unnatural. For personal routines, use「習慣」(habit) or「日課」(daily routine), not「約束」.",
      },
      {
        ja: "この電車の定期券の約束期限は来月の末日までです。",
        en: "The validity period of this train commuter pass lasts until the end of next month.",
        exp: "Unnatural. Use「有効期限」(expiration/validity date), not「約束期限」.",
      },
      {
        ja: "先生が試験の模範解答を黒板に約束してくれました。",
        en: "The teacher wrote out the model answers for the exam on the blackboard.",
        exp: "Unnatural. Use「書いてくれました」(wrote for us) or「示してくれました」, not「約束してくれました」.",
      },
    ],
  },
  {
    id: "usage-n4-yotei",
    word: "予定",
    reading: "よてい",
    romaji: "yotei",
    meanings: ["plan", "schedule"],
    pos: ["noun", "suru-verb"],
    correct: {
      ja: "来月の大型連休には、家族みんなで北海道へ旅行する予定です。",
      en: "During the long holiday next month, I plan to travel to Hokkaido with my entire family.",
      exp: "「〜する予定だ / 予定がある」expresses one's scheduled intentions or itinerary.",
    },
    incorrect: [
      {
        ja: "天気予報の予定によると、明日の夕方から雨が降るそうです。",
        en: "According to the weather forecast's prediction, it will rain from tomorrow evening.",
        exp: "Unnatural. Weather forecasts use「予報」(forecast) or「発表」, not「予定」.",
      },
      {
        ja: "頭痛薬を飲んだら、十五分ほどで痛みが予定しました。",
        en: "After taking the headache medicine, the pain subsided in about fifteen minutes.",
        exp: "Unnatural. Use「治まりました」(subsided) or「消えました」, not「予定しました」.",
      },
      {
        ja: "電車の中に財布を忘れて、予定して駅員室へ駆け込みました。",
        en: "I left my wallet in the train and rushed into the station master's office in a panic.",
        exp: "Unnatural. Use「慌てて」(in a panic/fluster) or「急いで」, not「予定して」.",
      },
    ],
  },
  {
    id: "usage-n4-shuukan",
    word: "習慣",
    reading: "しゅうかん",
    romaji: "shuukan",
    meanings: ["custom", "habit"],
    pos: ["noun"],
    correct: {
      ja: "毎朝起きたらコップ一杯の白湯を飲むことを習慣にしています。",
      en: "I make it a habit to drink a glass of warm water when I wake up every morning.",
      exp: "「〜を習慣にしている / 国の習慣」is the natural expression for personal habits or cultural customs.",
    },
    incorrect: [
      {
        ja: "昨日の数学の期末テストはとても習慣で、時間が足りませんでした。",
        en: "Yesterday's math final exam was very difficult, and I ran out of time.",
        exp: "Unnatural. Use「難しくて」(difficult) or「大変で」, not「習慣で」.",
      },
      {
        ja: "知らない英語の言葉があったので、電子辞書の習慣を引きました。",
        en: "Because there was an English word I didn't know, I consulted the electronic dictionary.",
        exp: "Unnatural. Use「辞書を引く」(look up in dictionary).「習慣」cannot replace a dictionary entry.",
      },
      {
        ja: "彼はとても習慣が良くて、いつもみんなに親切に接しています。",
        en: "He has a very good personality and always treats everyone kindly.",
        exp: "Unnatural. Use「性格」(personality) or「人柄」(character), not「習慣」.",
      },
    ],
  },
  {
    id: "usage-n4-keiken",
    word: "経験",
    reading: "けいけん",
    romaji: "keiken",
    meanings: ["experience"],
    pos: ["noun", "suru-verb"],
    correct: {
      ja: "学生時代に一人で海外をバックパッカーとして旅した経験は貴重です。",
      en: "The experience of traveling abroad alone as a backpacker during my student days is precious.",
      exp: "「〜した経験がある / 貴重な経験」expresses firsthand life experiences.",
    },
    incorrect: [
      {
        ja: "昨日の夜、本屋で買ったとてもおもしろい経験を読みました。",
        en: "Last night, I read a very interesting novel that I bought at the bookstore.",
        exp: "Unnatural. Use「小説」(novel) or「本」(book), not「経験」.",
      },
      {
        ja: "明日の期末試験に備えて、テキストの経験を五十問解きました。",
        en: "In preparation for tomorrow's final exam, I solved fifty problems from the textbook.",
        exp: "Unnatural. Use「問題」(problems/questions), not「経験」.",
      },
      {
        ja: "台風の大雨で川の経験が急激に上がり、避難勧告が出ました。",
        en: "Due to heavy rain from the typhoon, the river's water level rose rapidly.",
        exp: "Unnatural. Use「水位」(water level), not「経験」.",
      },
    ],
  },
  {
    id: "usage-n4-iken",
    word: "意見",
    reading: "いけん",
    romaji: "iken",
    meanings: ["opinion", "view"],
    pos: ["noun"],
    correct: {
      ja: "新しい企画について、会議の場で出席者全員に自分の意見を述べました。",
      en: "I stated my own opinion regarding the new proposal to all attendees at the meeting.",
      exp: "「意見を述べる / 言う / 聞く」is the natural collocation for expressing or hearing opinions.",
    },
    incorrect: [
      {
        ja: "高熱が続いて苦しかったので、医者にもらった意見を飲みました。",
        en: "Because my high fever continued and was painful, I took the medicine prescribed by the doctor.",
        exp: "Unnatural. Use「薬」(medicine), not「意見」.",
      },
      {
        ja: "日本語の意見をきれいに発音できるよう、毎日シャドーイングしています。",
        en: "To pronounce Japanese sounds beautifully, I shadow every day.",
        exp: "Unnatural. Use「発音」(pronunciation) or「アクセント」, not「意見」.",
      },
      {
        ja: "このアパートは南向きで窓が大きいので、部屋の意見がとても良いです。",
        en: "Because this apartment faces south with large windows, the room's daylight is very good.",
        exp: "Unnatural. Use「日当たり」(sunlight) or「居心地」(comfort), not「意見」.",
      },
    ],
  },
  {
    id: "usage-n4-tsugou",
    word: "都合",
    reading: "つごう",
    romaji: "tsugou",
    meanings: ["convenience", "circumstances"],
    pos: ["noun"],
    correct: {
      ja: "明日の午後二時は急な用事で都合が悪いので、三時にずらしていただけますか。",
      en: "Tomorrow at 2:00 PM is inconvenient due to sudden business, so could we push it to 3:00 PM?",
      exp: "「都合がいい / 悪い / をつける」is the standard expression for scheduling convenience.",
    },
    incorrect: [
      {
        ja: "彼は足の都合がとても速く、短距離走でいつも学年一位になります。",
        en: "His feet are very fast, and he always takes first place in sprints in his grade.",
        exp: "Unnatural. Use「足が速い」(fast runner), not「都合」.",
      },
      {
        ja: "この味噌汁はだしの都合がちょうどよくて、とてもおいしいです。",
        en: "This miso soup's broth seasoning is just right and very delicious.",
        exp: "Unnatural. Use「加減」(balance/seasoning level), not「都合」.",
      },
      {
        ja: "買ったばかりの革靴の都合がきつくて、歩くと痛いです。",
        en: "The size of the leather shoes I just bought is too tight, and it hurts when I walk.",
        exp: "Unnatural. Use「サイズ」(size) or「幅」(width), not「都合」.",
      },
    ],
  },
  {
    id: "usage-n4-mukaeru",
    word: "迎える",
    reading: "むかえる",
    romaji: "mukaeru",
    meanings: ["to welcome", "to meet", "to greet"],
    pos: ["v1", "vt"],
    correct: {
      ja: "海外の姉妹校からやって来た留学生たちを、空港のロビーで笑顔で迎えました。",
      en: "We welcomed with smiles the international exchange students arriving from our sister school overseas at the airport lobby.",
      exp: "「客 / 人 / 新年を迎える」is the natural usage for meeting or welcoming arriving people or milestones.",
    },
    incorrect: [
      {
        ja: "毎朝六時半に目覚まし時計を迎えて、すぐにベッドから起きます。",
        en: "Every morning at 6:30 I stop the alarm clock and get out of bed immediately.",
        exp: "Unnatural. Use「止めて」(turn off/stop), not「迎えて」.",
      },
      {
        ja: "来週の発表に必要な専門書を図書館のカウンターで迎えました。",
        en: "I borrowed the specialized book needed for next week's presentation at the library counter.",
        exp: "Unnatural. Use「借りました」(borrowed), not「迎えました」.",
      },
      {
        ja: "暗い廊下のスイッチを押すと、天井の照明を迎えました。",
        en: "When I pressed the switch in the dark hallway, the ceiling light turned on.",
        exp: "Unnatural. Use「つきました」(turned on), not「迎えました」.",
      },
    ],
  },
  {
    id: "usage-n4-todokeru",
    word: "届ける",
    reading: "とどける",
    romaji: "todokeru",
    meanings: ["to deliver", "to turn in", "to report"],
    pos: ["v1", "vt"],
    correct: {
      ja: "道で拾った落とし物の鍵を、すぐに最寄りの交番へ届けました。",
      en: "I immediately turned in the lost keys I found on the street to the nearest police box.",
      exp: "「落とし物を届ける / 荷物を届ける」is the natural collocation for turning in lost property or delivering packages.",
    },
    incorrect: [
      {
        ja: "田舎の祖母に出す手紙を、駅前の赤いポストに届けました。",
        en: "I dropped the letter to my grandmother in the countryside into the red postbox in front of the station.",
        exp: "Unnatural. Use「入れました」(dropped in/posted) or「投函しました」, not「届けました」.",
      },
      {
        ja: "電車の切符を駅の自動券売機で二枚届けました。",
        en: "I purchased two train tickets at the station's automatic ticket machine.",
        exp: "Unnatural. Use「買いました」(bought) or「購入しました」, not「届けました」.",
      },
      {
        ja: "先生が話した大事な連絡事項を忘れないように手帳に届けました。",
        en: "I wrote down the important notices the teacher spoke about in my notebook so as not to forget.",
        exp: "Unnatural. Use「メモしました」(noted down) or「書き留めました」, not「届けました」.",
      },
    ],
  },
  {
    id: "usage-n4-tsutaeru",
    word: "伝える",
    reading: "つたえる",
    romaji: "tsutaeru",
    meanings: ["to convey", "to pass on a message"],
    pos: ["v1", "vt"],
    correct: {
      ja: "課長がお戻りになったら、明日の会議の時間変更をお伝えいただけますか。",
      en: "When the section chief returns, could you please convey to him the schedule change for tomorrow's meeting?",
      exp: "「言葉 / 気持ち / 伝言を伝える」collocates with passing on a message or communicating intent.",
    },
    incorrect: [
      {
        ja: "一階のロビーから重い段ボール箱を階段で三階まで伝えました。",
        en: "I carried the heavy cardboard box from the first floor lobby up the stairs to the third floor.",
        exp: "Unnatural. Use「運びました」(carried/transported), not「伝えました」.",
      },
      {
        ja: "夜遅くに部屋に入って、壁のスイッチを押して電気を伝えました。",
        en: "I entered the room late at night, pressed the wall switch, and turned on the light.",
        exp: "Unnatural. Use「つけました」(turned on), not「伝えました」.",
      },
      {
        ja: "動かなくなった古い腕時計を時計屋さんに持っていって伝えました。",
        en: "I took the stopped old wristwatch to the watchmaker and had it repaired.",
        exp: "Unnatural. Use「直してもらいました」(had it repaired), not「伝えました」.",
      },
    ],
  },
  {
    id: "usage-n4-oru",
    word: "折る",
    reading: "おる",
    romaji: "oru",
    meanings: ["to break", "to snap", "to fold"],
    pos: ["v5r", "vt"],
    correct: {
      ja: "手紙を丁寧に三つに折ってから、封筒の中に入れました。",
      en: "I neatly folded the letter into three parts and then put it inside the envelope.",
      exp: "「紙を折る / 枝を折る」naturally means folding paper or snapping a rigid object like a twig.",
    },
    incorrect: [
      {
        ja: "鍵を忘れて家に入れないので、玄関のドアを折って開けました。",
        en: "Because I forgot my key and couldn't enter the house, I unlocked the front door.",
        exp: "Unnatural. Use「開けました」(opened) or「壊して」(forced open), not「折って」.",
      },
      {
        ja: "風邪を引いたので、食後に水で粉薬を折って飲みました。",
        en: "Because I caught a cold, I swallowed the powdered medicine with water after the meal.",
        exp: "Unnatural. Use「飲んだ」(took medicine), not「折って」.",
      },
      {
        ja: "鉛筆の先が丸くなったので、ナイフで上手に折りました。",
        en: "Since the tip of the pencil became blunt, I skillfully sharpened it with a knife.",
        exp: "Unnatural. Use「削りました」(sharpened), not「折りました」.",
      },
    ],
  },
  {
    id: "usage-n4-taoreru",
    word: "倒れる",
    reading: "たおれる",
    romaji: "taoreru",
    meanings: ["to fall over", "to collapse"],
    pos: ["v1", "vi"],
    correct: {
      ja: "昨夜の猛烈な台風の風によって、庭の古い大木が道路側に倒れました。",
      en: "Due to the fierce typhoon winds last night, the old large tree in the garden fell over onto the road side.",
      exp: "「木 / ビル / 人が倒れる」is the natural intransitive verb for standing objects falling over.",
    },
    incorrect: [
      {
        ja: "濡れた階段で足を滑らせて、下まで一気に倒れてしまいました。",
        en: "I slipped on the wet stairs and fell all the way to the bottom.",
        exp: "Unnatural. Use「転げ落ちて」(tumbled down) or「落ちて」, not「倒れて」.",
      },
      {
        ja: "夕方になると、西の山の向こうに太陽がゆっくりと倒れました。",
        en: "In the evening, the sun slowly sank behind the mountains in the west.",
        exp: "Unnatural. Use「沈みました」(sank/set), not「倒れました」.",
      },
      {
        ja: "お湯が沸いたので、やかんに急須のお茶を倒しました。",
        en: "Because the water boiled, I poured tea into the teapot.",
        exp: "Unnatural. Use「注ぎました」(poured), not「倒しました」.",
      },
    ],
  },
  {
    id: "usage-n4-ochiru",
    word: "落ちる",
    reading: "おちる",
    romaji: "ochiru",
    meanings: ["to fall", "to drop"],
    pos: ["v1", "vi"],
    correct: {
      ja: "上着のポケットに穴が開いていたせいで、鍵が道に落ちてしまいました。",
      en: "Because there was a hole in my jacket pocket, the keys fell onto the road.",
      exp: "「物が落ちる / 試験に落ちる」naturally describes objects falling downward or failing an exam.",
    },
    incorrect: [
      {
        ja: "お湯を沸かしたら、十五分でお風呂がちょうどよく落ちました。",
        en: "After boiling the water, the bath became just right in fifteen minutes.",
        exp: "Unnatural. Use「沸きました」(boiled/ready), not「落ちました」.",
      },
      {
        ja: "学校から帰ってすぐに、宿題を全部落ちてから遊びに行きました。",
        en: "As soon as I came home from school, I finished all my homework and went to play.",
        exp: "Unnatural. Use「終わらせて」(finished) or「済ませて」, not「落ちて」.",
      },
      {
        ja: "電車が終点に着くと、すべてのドアが一斉に落ちました。",
        en: "When the train arrived at the final stop, all doors opened at once.",
        exp: "Unnatural. Use「開きました」(opened), not「落ちました」.",
      },
    ],
  },
  {
    id: "usage-n4-hirou",
    word: "拾う",
    reading: "ひろう",
    romaji: "hirou",
    meanings: ["to pick up", "to find"],
    pos: ["v5u", "vt"],
    correct: {
      ja: "駅のホームを歩いていたら、足元に千円札が落ちていたので拾いました。",
      en: "While walking on the station platform, a 1,000-yen bill had dropped at my feet, so I picked it up.",
      exp: "「落ちている物を拾う / タクシーを拾う」is the standard verb for picking up something off the ground.",
    },
    incorrect: [
      {
        ja: "メニューを見て、レストランで一番人気のランチ定食を拾いました。",
        en: "Looking at the menu, I chose the most popular lunch set at the restaurant.",
        exp: "Unnatural. Use「選びました」(chose) or「注文しました」(ordered), not「拾いました」.",
      },
      {
        ja: "図書館で借りた本を汚さないように、丁寧に両手で拾いました。",
        en: "So as not to dirty the book borrowed from the library, I held it carefully with both hands.",
        exp: "Unnatural. Use「持ちました」(held) or「扱いました」(handled), not「拾いました」.",
      },
      {
        ja: "部屋の空気が少しこもっていたので、窓を大きく拾いました。",
        en: "Because the room air was a little stuffy, I opened the window wide.",
        exp: "Unnatural. Use「開けました」(opened), not「拾いました」.",
      },
    ],
  },
  {
    id: "usage-n4-kazaru",
    word: "飾る",
    reading: "かざる",
    romaji: "kazaru",
    meanings: ["to decorate", "to display"],
    pos: ["v5r", "vt"],
    correct: {
      ja: "来週のお客さんの訪問に合わせて、玄関に季節の花を生けて飾りました。",
      en: "In preparation for the guests' visit next week, I arranged and displayed seasonal flowers at the entrance.",
      exp: "「花 / 絵 / 部屋を飾る」is the natural collocation for adorning or displaying decoratives.",
    },
    incorrect: [
      {
        ja: "外で泥んこになって遊んだので、汚れた服を洗濯機で飾りました。",
        en: "Because I played outside and got muddy, I washed the dirty clothes in the washing machine.",
        exp: "Unnatural. Use「洗いました」(washed), not「飾りました」.",
      },
      {
        ja: "冬の朝はとても冷え込むので、厚手のセーターを飾って学校へ行きます。",
        en: "Because winter mornings are very cold, I wear a thick sweater to go to school.",
        exp: "Unnatural. Use「着て」(wear), not「飾って」.",
      },
      {
        ja: "朝食を食べそびれたので、途中のコンビニでパンを二つ飾りました。",
        en: "Since I missed breakfast, I bought two buns at a convenience store along the way.",
        exp: "Unnatural. Use「買いました」(bought) or「食べました」, not「飾りました」.",
      },
    ],
  },
  {
    id: "usage-n4-nakunaru",
    word: "亡くなる",
    reading: "なくなる",
    romaji: "nakunaru",
    meanings: ["to pass away", "to die (honorific/polite)"],
    pos: ["v5r", "vi"],
    correct: {
      ja: "大好きな祖母は、家族に見守られながら九十五歳で安らかに亡くなりました。",
      en: "My beloved grandmother passed away peacefully at age ninety-five while watched over by family.",
      exp: "「亡くなる」is the polite and respectful verb strictly for human passing (people dying).",
    },
    incorrect: [
      {
        ja: "買い物をしすぎて、財布の中にあったお小遣いがすべて亡くなりました。",
        en: "Because I shopped too much, all the pocket money in my wallet ran out.",
        exp: "Unnatural. For things running out, write「無くなりました」(ran out), never「亡くなりました」.",
      },
      {
        ja: "机の上に置いておいたはずの自転車の鍵がどこかへ亡くなりました。",
        en: "The bicycle key that should have been on the desk disappeared somewhere.",
        exp: "Unnatural. Use「消えた」(disappeared) or「無くなった」(lost/vanished), not「亡くなった」.",
      },
      {
        ja: "宿題のプリントが風で飛んで亡くなったので、先生にもう一度もらいました。",
        en: "Because the homework sheet blew away in the wind and was lost, I got another from the teacher.",
        exp: "Unnatural. Use「無くなった」(was lost), not the kanji「亡くなった」.",
      },
    ],
  },
  {
    id: "usage-n4-sodateru",
    word: "育てる",
    reading: "そだてる",
    romaji: "sodateru",
    meanings: ["to raise", "to bring up", "to grow"],
    pos: ["v1", "vt"],
    correct: {
      ja: "祖父母は田舎の広い畑で、有機野菜や果物を大切に育てています。",
      en: "My grandparents are carefully raising organic vegetables and fruits in a spacious field in the countryside.",
      exp: "「子供 / 野菜 / ペットを育てる」is the natural transitive verb for nurturing children or cultivating plants.",
    },
    incorrect: [
      {
        ja: "毎朝、家の近くの公園まで飼い犬を育てて散歩しています。",
        en: "Every morning, I take my pet dog to the nearby park for a walk.",
        exp: "Unnatural. Use「連れて」(take along), not「育てて」.",
      },
      {
        ja: "脚がぐらついていた古い木の椅子を自分で育てて使えるようにしました。",
        en: "I repaired the wobbly old wooden chair myself so that it could be used.",
        exp: "Unnatural. Use「修理して」(repaired) or「直して」, not「育てて」.",
      },
      {
        ja: "先生に出された難しい算数の計算の答えを頭の中で育てました。",
        en: "I calculated the answer to the difficult arithmetic problem given by the teacher in my head.",
        exp: "Unnatural. Use「計算しました」(calculated) or「考えました」, not「育てました」.",
      },
    ],
  },
  {
    id: "usage-n4-nareru",
    word: "慣れる",
    reading: "なれる",
    romaji: "nareru",
    meanings: ["to get used to", "to grow accustomed"],
    pos: ["v1", "vi"],
    correct: {
      ja: "日本で一人暮らしを始めて三か月が経ち、自炊の生活にもだいぶ慣れました。",
      en: "Three months have passed since I started living alone in Japan, and I have grown quite accustomed to cooking for myself.",
      exp: "「環境 / 生活 / 仕事に慣れる」is the standard verb for becoming accustomed to situations or habits.",
    },
    incorrect: [
      {
        ja: "子どもの頃からの夢だった電車の運転士についに慣れました。",
        en: "I finally became a train driver, which had been my dream since childhood.",
        exp: "Unnatural. For becoming an occupation, write「なれました」(成れた - became), not「慣れました」.",
      },
      {
        ja: "スーパーで買った荷物が重すぎて、片手で慣れることができません。",
        en: "The groceries bought at the supermarket were too heavy to carry with one hand.",
        exp: "Unnatural. Use「持つ」(hold/carry), not「慣れる」.",
      },
      {
        ja: "掛け時計の電池が切れてしまったので、秒針が慣れなくなりました。",
        en: "Because the wall clock's battery ran out, the second hand stopped moving.",
        exp: "Unnatural. Use「動かなくなりました」(stopped moving), not「慣れなくなりました」.",
      },
    ],
  },
  {
    id: "usage-n4-maniau",
    word: "間に合う",
    reading: "まにあう",
    romaji: "maniau",
    meanings: ["to be in time for", "to suffice"],
    pos: ["v5u", "vi"],
    correct: {
      ja: "朝の渋滞で焦りましたが、全力で走って飛行機の出発時刻に間に合いました。",
      en: "I was panicked by the morning traffic jam, but I ran at full speed and made it in time for the flight's departure time.",
      exp: "「時間 / 電車に間に合う」is the natural expression for arriving before a scheduled deadline.",
    },
    incorrect: [
      {
        ja: "彼女の着ている青いワンピースは、彼女の雰囲気にとても間に合っています。",
        en: "The blue dress she is wearing suits her atmosphere very well.",
        exp: "Unnatural. Use「似合っています」(suits/matches), not「間に合っています」.",
      },
      {
        ja: "みんなでいろいろなアイデアを出し合って、旅行の行き先が間に合いました。",
        en: "Everyone shared various ideas together, and the travel destination was decided.",
        exp: "Unnatural. Use「決まりました」(was decided), not「間に合いました」.",
      },
      {
        ja: "この辞書は例文が豊富に掲載されていて、とても説明が間に合っています。",
        en: "This dictionary is packed with abundant examples, and its explanations are very clear.",
        exp: "Unnatural. Use「わかりやすい」(easy to understand) or「詳しい」(detailed), not「間に合っている」.",
      },
    ],
  },
  {
    id: "usage-n4-tazuneru",
    word: "訪ねる",
    reading: "たずねる",
    romaji: "tazuneru",
    meanings: ["to visit", "to call on"],
    pos: ["v1", "vt"],
    correct: {
      ja: "連休を利用して京都を訪れ、昔お世話になった恩師の家を訪ねました。",
      en: "Taking advantage of the consecutive holidays, I visited Kyoto and called on my former mentor's home.",
      exp: "「人の家 / 史跡を訪ねる」means visiting a person's home or a place.",
    },
    incorrect: [
      {
        ja: "道に迷ってしまったので、近くの交番で駅までの近道を訪ねました。",
        en: "Because I lost my way, I asked for the shortcut to the station at the nearby police box.",
        exp: "Unnatural. Use「尋ねました」(asked - 尋ねる), not the kanji「訪ねる」(visit).",
      },
      {
        ja: "映画が始まる直前に、売店で温かいミルクティーを訪ねました。",
        en: "Just before the movie started, I bought a hot milk tea at the concession stand.",
        exp: "Unnatural. Use「買いました」(bought) or「注文しました」, not「訪ねました」.",
      },
      {
        ja: "毎晩寝る前に、ベッドの上で短編小説を三十ページほど訪ねます。",
        en: "Every night before sleeping, I read about thirty pages of short stories on the bed.",
        exp: "Unnatural. Use「読みます」(read), not「訪ねます」.",
      },
    ],
  },
  {
    id: "usage-n4-suberu",
    word: "滑る",
    reading: "すべる",
    romaji: "suberu",
    meanings: ["to slip", "to slide"],
    pos: ["v5r", "vi"],
    correct: {
      ja: "雨上がりの階段が濡れていて、足が滑って危うく転びそうになりました。",
      en: "The stairs after the rain were wet, and my foot slipped so that I almost fell over.",
      exp: "「足 / 道が滑る」is the natural expression for slipping on ice, water, or oil.",
    },
    incorrect: [
      {
        ja: "小鳥たちが気持ちよさそうに春の青空を滑っています。",
        en: "The small birds are flying pleasantly through the blue spring sky.",
        exp: "Unnatural. Use「飛んでいます」(flying), not「滑っています」.",
      },
      {
        ja: "夏休みの暑い午後に、冷蔵庫で冷やした麦茶をゴクゴク滑りました。",
        en: "On a hot summer afternoon, I gulped down barley tea cooled in the refrigerator.",
        exp: "Unnatural. Use「飲みました」(drank), not「滑りました」.",
      },
      {
        ja: "先生が黒板に白いチョークを滑って今日の宿題を書きました。",
        en: "The teacher wrote today's homework on the blackboard using white chalk.",
        exp: "Unnatural. Use「チョークを使って」(using chalk) or「走らせて」, not「滑って」.",
      },
    ],
  },
  {
    id: "usage-n4-harau",
    word: "払う",
    reading: "はらう",
    romaji: "harau",
    meanings: ["to pay", "to brush off"],
    pos: ["v5u", "vt"],
    correct: {
      ja: "スーパーのレジで、買った日用品の代金を電子マネーで払いました。",
      en: "At the supermarket cash register, I paid for the daily goods I bought using electronic money.",
      exp: "「代金 / お金 / 税金を払う」is the standard verb for paying money for goods or services.",
    },
    incorrect: [
      {
        ja: "換気のために窓を開けて、外の新鮮な空気を部屋に払いました。",
        en: "I opened the window for ventilation and brought fresh outdoor air into the room.",
        exp: "Unnatural. Use「入れました」(let in), not「払いました」.",
      },
      {
        ja: "誕生日のお祝いとして、妹に可愛いぬいぐるみを払いました。",
        en: "As a birthday celebration, I gave my younger sister a cute stuffed animal.",
        exp: "Unnatural. Use「あげました」(gave) or「プレゼントしました」, not「払いました」.",
      },
      {
        ja: "駅の自動券売機で、成田空港までの特急券を二枚払いました。",
        en: "I bought two limited express tickets to Narita Airport at the station automatic ticket machine.",
        exp: "Unnatural. Use「買いました」(bought) or「購入しました」, not「払いました」.",
      },
    ],
  },
  {
    id: "usage-n4-kowareru",
    word: "壊れる",
    reading: "こわれる",
    romaji: "kowareru",
    meanings: ["to break", "to be broken"],
    pos: ["v1", "vi"],
    correct: {
      ja: "長年愛用していたパソコンが突然壊れて、電源が入らなくなりました。",
      en: "The personal computer I had used fondly for years suddenly broke, and the power wouldn't turn on.",
      exp: "「機械 / 時計 / 椅子が壊れる」is the natural intransitive verb for devices or physical objects breaking.",
    },
    incorrect: [
      {
        ja: "真冬の強い寒波によって、庭の池の水が一晩で壊れました。",
        en: "Due to the strong cold wave in midwinter, the water in the garden pond froze overnight.",
        exp: "Unnatural. Use「凍りました」(froze), not「壊れました」.",
      },
      {
        ja: "近所のパン屋で買った焼きたてのフランスパンが壊れておいしいです。",
        en: "The freshly baked French bread bought at the neighborhood bakery is crispy and delicious.",
        exp: "Unnatural. Use「香ばしくて」(fragrant/crisp) or「サクサクして」, not「壊れて」.",
      },
      {
        ja: "全力で階段を駆け上がったので、心臓が壊れて息ができません。",
        en: "Because I dashed up the stairs at full speed, I was out of breath.",
        exp: "Unnatural. Use「息が切れて」(out of breath) or「苦しくて」, not「壊れて」.",
      },
    ],
  },
  {
    id: "usage-n4-wareru",
    word: "割れる",
    reading: "われる",
    romaji: "wareru",
    meanings: ["to break", "to shatter", "to crack"],
    pos: ["v1", "vi"],
    correct: {
      ja: "テーブルの上から滑り落ちたガラスの花瓶が、床で粉々に割れました。",
      en: "The glass vase that slipped off the table shattered into pieces on the floor.",
      exp: "「皿 / ガラス / 窓が割れる」naturally describes brittle objects like glass or ceramics shattering.",
    },
    incorrect: [
      {
        ja: "工作の授業で、色画用紙をハサミで四角くきれいに割りました。",
        en: "In arts and crafts class, I cut the colored construction paper neatly into squares with scissors.",
        exp: "Unnatural. Use「切りました」(cut), not「割りました」.",
      },
      {
        ja: "教科書の大事なページに折り目を割って、印をつけました。",
        en: "I folded a crease on an important page of the textbook to mark it.",
        exp: "Unnatural. Use「つけて」(put a crease) or「折って」, not「割って」.",
      },
      {
        ja: "自転車の空気入れを使って、タイヤに空気をしっかりと割りました。",
        en: "Using the bicycle air pump, I pumped air firmly into the tire.",
        exp: "Unnatural. Use「入れました」(pumped/put in), not「割りました」.",
      },
    ],
  },
  {
    id: "usage-n4-yogoreru",
    word: "汚れる",
    reading: "よごれる",
    romaji: "yogoreru",
    meanings: ["to get dirty"],
    pos: ["v1", "vi"],
    correct: {
      ja: "雨上がりのグラウンドでサッカーをしたので、ユニフォームが泥でひどく汚れました。",
      en: "Because we played soccer on the field after the rain, the uniform got terribly dirty with mud.",
      exp: "「服 / 手 / 部屋が汚れる」is the standard verb for surfaces or garments getting dirty.",
    },
    incorrect: [
      {
        ja: "引っ越しの重い荷物を運びすぎて、腰と背中の筋肉が汚れました。",
        en: "Because I carried too many heavy moving boxes, my lower back and back muscles got sore.",
        exp: "Unnatural. Use「痛みました」(hurt) or「疲れました」(got tired), not「汚れました」.",
      },
      {
        ja: "街灯の少ない暗い夜道を歩くときは、周りが汚れて見えにくいです。",
        en: "When walking on dark night streets with few streetlights, the surroundings are dark and hard to see.",
        exp: "Unnatural. Use「暗くて」(dark), not「汚れて」.",
      },
      {
        ja: "毎朝欠かさずストレッチ体操をして、体の柔軟性を汚れています。",
        en: "I do stretching exercises without fail every morning to maintain my body's flexibility.",
        exp: "Unnatural. Use「高めています」(increasing) or「保っています」, not「汚れています」.",
      },
    ],
  },
  {
    id: "usage-n4-yorokobu",
    word: "喜ぶ",
    reading: "よろこぶ",
    romaji: "yorokobu",
    meanings: ["to be glad", "to rejoice"],
    pos: ["v5b", "vi", "vt"],
    correct: {
      ja: "欲しがっていたおもちゃをプレゼントすると、甥っ子は飛び跳ねて喜びました。",
      en: "When I gave him the toy he had been wanting as a present, my nephew jumped up and was delighted.",
      exp: "「人が喜ぶ / 成功を喜ぶ」naturally expresses feeling or showing happiness and joy.",
    },
    incorrect: [
      {
        ja: "昨日の午後から雨が強く喜んで、近くの小川が増水しました。",
        en: "Since yesterday afternoon, rain fell heavily and the nearby stream flooded.",
        exp: "Unnatural. Use「降って」(fell/rained heavily), not「喜んで」.",
      },
      {
        ja: "パソコンのバッテリーが切れて、突然画面が真っ暗に喜んでしまいました。",
        en: "The laptop battery died and the screen suddenly went completely dark.",
        exp: "Unnatural. Use「消えて」(went off/disappeared), not「喜んで」.",
      },
      {
        ja: "授業のチャイムが鳴ったので、生徒たちが教室へ喜んで走りました。",
        en: "Because the class chime rang, the students ran in a hurry to the classroom.",
        exp: "Unnatural. Use「急いで」(in a hurry), not「喜んで」.",
      },
    ],
  },
  {
    id: "usage-n4-okoru",
    word: "怒る",
    reading: "おこる",
    romaji: "okoru",
    meanings: ["to get angry", "to scold"],
    pos: ["v5r", "vi"],
    correct: {
      ja: "約束の時間を一時間も無断で遅刻してしまい、待っていた友達にひどく怒られました。",
      en: "I was an hour late for our appointment without notice, and my waiting friend got terribly angry at me.",
      exp: "「人に怒る / 怒られる」is the standard verb for getting angry or being scolded.",
    },
    incorrect: [
      {
        ja: "毎朝六時に怒って、愛犬と一緒に近所を三十分散歩します。",
        en: "Every morning I wake up at six and take a thirty-minute walk in the neighborhood with my dog.",
        exp: "Unnatural. Use「起きて」(wake up), not「怒って」.",
      },
      {
        ja: "お腹がペコペコだったので、台所で急いで焼きそばを怒りました。",
        en: "Because I was starving, I hurriedly made fried noodles in the kitchen.",
        exp: "Unnatural. Use「作りました」(made/cooked), not「怒りました」.",
      },
      {
        ja: "このパズルはとても簡単ですから、小さな子どもでもすぐに怒れます。",
        en: "Because this puzzle is very easy, even small children can solve it right away.",
        exp: "Unnatural. Use「解けます」(can solve), not「怒れます」.",
      },
    ],
  },
  {
    id: "usage-n4-ayamaru",
    word: "謝る",
    reading: "あやまる",
    romaji: "ayamaru",
    meanings: ["to apologize"],
    pos: ["v5r", "vi", "vt"],
    correct: {
      ja: "不注意で隣の人の足を踏んでしまったので、頭を下げてすぐに謝りました。",
      en: "Because I carelessly stepped on the neighbor's foot, I bowed my head and apologized immediately.",
      exp: "「人に謝る / 迷惑を謝る」collocates with apologizing for an offense or mistake.",
    },
    incorrect: [
      {
        ja: "仕事中に友人から電話がかかってきましたが、忙しくて謝れませんでした。",
        en: "A phone call came from a friend during work, but I was busy and couldn't answer.",
        exp: "Unnatural. Use「出られませんでした」(could not answer), not「謝れませんでした」.",
      },
      {
        ja: "日本語の作文の文法の間違いを、放課後に先生に謝ってもらいました。",
        en: "I had the teacher correct the grammatical mistakes in my Japanese essay after school.",
        exp: "Unnatural. Use「直してもらいました」(had them correct), not「謝ってもらいました」.",
      },
      {
        ja: "この駅の改札機にICカードをタッチすると、自動で扉が謝ります。",
        en: "When you touch your IC card to the ticket gate at this station, the gate doors open automatically.",
        exp: "Unnatural. Use「開きます」(opens), not「謝ります」.",
      },
    ],
  },
  {
    id: "usage-n4-sawagu",
    word: "騒ぐ",
    reading: "さわぐ",
    romaji: "sawagu",
    meanings: ["to make noise", "to cause a commotion"],
    pos: ["v5g", "vi"],
    correct: {
      ja: "病院の待合室では他の患者さんの迷惑になりますから、大声で騒いではいけません。",
      en: "In the hospital waiting room, it bothers other patients, so you must not make noise in a loud voice.",
      exp: "「大声で騒ぐ / 酒を飲んで騒ぐ」is the standard verb for causing a clamor or making unruly noise.",
    },
    incorrect: [
      {
        ja: "風邪をこじらせてしまい、喉が激しく騒いで水も飲み込めません。",
        en: "I worsened my cold, and my throat hurts so severely that I can't even swallow water.",
        exp: "Unnatural. Use「痛くて」(hurts), not「騒いで」.",
      },
      {
        ja: "昨夜はベッドでぐっすり騒いだので、今朝は気分爽快に起きられました。",
        en: "I slept soundly in bed last night, so I was able to wake up feeling refreshed this morning.",
        exp: "Unnatural. Use「眠ったので」(slept), not「騒いだので」.",
      },
      {
        ja: "週末に部屋の隅々までほうきで騒いで、ピカピカにしました。",
        en: "On the weekend, I swept every corner of the room with a broom and made it sparkling clean.",
        exp: "Unnatural. Use「掃除して」(cleaned) or「掃いて」(swept), not「騒いで」.",
      },
    ],
  },
  {
    id: "usage-n4-odoroku",
    word: "驚く",
    reading: "おどろく",
    romaji: "odoroku",
    meanings: ["to be surprised", "to be astonished"],
    pos: ["v5k", "vi"],
    correct: {
      ja: "静かな夜道で背後から突然大きなクラクションが鳴り、心臓が止まるほど驚きました。",
      en: "A sudden loud horn sounded from behind on a quiet night street, and I was so surprised my heart almost stopped.",
      exp: "「ニュース / 音 / 事実に驚く」is the natural intransitive verb for being surprised or astonished.",
    },
    incorrect: [
      {
        ja: "頭痛がひどいので、近くのドラッグストアでよく効く痛み止めを驚きました。",
        en: "Because my headache was terrible, I bought an effective painkiller at the nearby drugstore.",
        exp: "Unnatural. Use「買いました」(bought), not「驚きました」.",
      },
      {
        ja: "明日の朝一番のフライトに乗り遅れないよう、目覚ましを五時に驚きました。",
        en: "So as not to miss the first flight tomorrow morning, I set the alarm clock for five o'clock.",
        exp: "Unnatural. Use「セットしました」(set) or「かけました」, not「驚きました」.",
      },
      {
        ja: "部屋の温度が高くなってきたので、エアコンのリモコンで冷房を驚きました。",
        en: "Because the room temperature became high, I turned on the cooling with the air conditioner remote.",
        exp: "Unnatural. Use「つけました」(turned on), not「驚きました」.",
      },
    ],
  },
  {
    id: "usage-n4-hidoi",
    word: "ひどい",
    reading: "ひどい",
    romaji: "hidoi",
    meanings: ["terrible", "severe", "harsh"],
    pos: ["adj-i"],
    correct: {
      ja: "昨晩はひどい雨と雷のせいで、町全体の電車が完全に運転を見合わせました。",
      en: "Due to terrible rain and thunder last night, trains across the whole town completely suspended operations.",
      exp: "「ひどい雨 / 風 / 扱い / 渋滞」collocates with extreme, harsh, or terrible conditions.",
    },
    incorrect: [
      {
        ja: "母が焼いてくれたチョコレートケーキは甘くてとてもひどい味でした。",
        en: "The chocolate cake that my mother baked for me was sweet and tasted very delicious.",
        exp: "Unnatural. Use「おいしい」(delicious), not「ひどい」.",
      },
      {
        ja: "先生はいつでもひどい笑顔で生徒たちの質問に親身に答えてくれます。",
        en: "The teacher always answers students' questions warmly with a wonderful smile.",
        exp: "Unnatural. Use「優しい」(kind/gentle) or「素敵な」(wonderful), not「ひどい」.",
      },
      {
        ja: "今日は雲一つない快晴で、空が澄み渡っていてひどい景色です。",
        en: "Today is clear without a single cloud, the sky is clear, and it's a beautiful scenery.",
        exp: "Unnatural. Use「素晴らしい」(splendid) or「きれいな」(beautiful), not「ひどい」.",
      },
    ],
  },
  {
    id: "usage-n4-nigai",
    word: "苦い",
    reading: "にがい",
    romaji: "nigai",
    meanings: ["bitter"],
    pos: ["adj-i"],
    correct: {
      ja: "病院で処方された粉薬はとても苦いので、いつも水と一緒に一気に飲みます。",
      en: "The powdered medicine prescribed by the hospital is very bitter, so I always drink it in one gulp with water.",
      exp: "「薬 / コーヒー / 野菜が苦い」describes the bitter taste quality, or figuratively a bitter experience (苦い経験).",
    },
    incorrect: [
      {
        ja: "真冬の北風が吹く夜は、肌に突き刺さるように苦いです。",
        en: "On nights when the midwinter north wind blows, it feels piercingly cold on the skin.",
        exp: "Unnatural. Use「冷たい」(cold) or「厳しい」(severe), not「苦い」.",
      },
      {
        ja: "このスーツケースは本がぎっしり詰まっていて、一人で運ぶのは苦いです。",
        en: "This suitcase is packed full of books, and it is impossible to carry alone.",
        exp: "Unnatural. Use「無理です」(impossible) or「重いです」(heavy), not「苦いです」.",
      },
      {
        ja: "彼女は足が苦いので、百メートル走でいつも学年トップになります。",
        en: "She is fast on her feet, so she always takes top in her grade in the 100-meter dash.",
        exp: "Unnatural. Use「足が速い」(fast), not「苦い」.",
      },
    ],
  },
  {
    id: "usage-n4-asai",
    word: "浅い",
    reading: "あさい",
    romaji: "asai",
    meanings: ["shallow"],
    pos: ["adj-i"],
    correct: {
      ja: "この小川は水深が浅いので、小さな子どもたちが安心して水遊びをしています。",
      en: "Because this brook is shallow, small children are playing safely in the water.",
      exp: "「川 / 皿 / 眠り / 経験が浅い」collocates with shallow water depth, light sleep, or brief experience.",
    },
    incorrect: [
      {
        ja: "彼は日本語を習い始めたばかりで、まだ知っている単語が浅いです。",
        en: "He has just started learning Japanese, so the words he knows are still few.",
        exp: "Unnatural. Use「少ない」(few), not「浅い」.",
      },
      {
        ja: "この半袖シャツは生地の色が浅くて、どんなズボンにも合わせやすいです。",
        en: "This short-sleeved shirt's fabric color is light and easy to match with any trousers.",
        exp: "Unnatural. Use「薄い」(light/pale color), not「浅い」.",
      },
      {
        ja: "早朝に目覚ましが鳴って起きたとき、頭がとても浅くてすっきりしていました。",
        en: "When I woke up to the alarm in the early morning, my head was very clear and refreshed.",
        exp: "Unnatural. Use「冴えていて」(clear-headed), not「浅くて」.",
      },
    ],
  },
  {
    id: "usage-n4-yawarakai",
    word: "柔らかい",
    reading: "やわらかい",
    romaji: "yawarakai",
    meanings: ["soft", "tender"],
    pos: ["adj-i"],
    correct: {
      ja: "焼きたての食パンはふっくらとしていて、手でちぎるととても柔らかいです。",
      en: "Freshly baked bread is fluffy, and when torn by hand, it is very soft.",
      exp: "「パン / 肉 / 布団が柔らかい」naturally describes soft textures or tender foods.",
    },
    incorrect: [
      {
        ja: "先生の歴史の講義は解説が柔らかくて、初心者でもすぐに頭に入ります。",
        en: "The teacher's history lecture explanation is easy to understand, so even beginners grasp it immediately.",
        exp: "Unnatural. Use「わかりやすい」(easy to understand) or「明快で」, not「柔らかくて」.",
      },
      {
        ja: "昨日の英語の単語テストは思ったより柔らかくて、簡単に満点が取れました。",
        en: "Yesterday's English vocabulary test was easier than expected, and I easily got a perfect score.",
        exp: "Unnatural. Use「簡単で」(easy) or「やさしくて」, not「柔らかくて」.",
      },
      {
        ja: "このノートパソコンは本体がとても柔らかいので、片手で楽に持ち運べます。",
        en: "Because this laptop body is very light, you can easily carry it with one hand.",
        exp: "Unnatural. Use「軽くて」(lightweight) or「薄くて」, not「柔らかい」.",
      },
    ],
  },
  {
    id: "usage-n4-komakai",
    word: "細かい",
    reading: "こまかい",
    romaji: "komakai",
    meanings: ["small", "fine", "detailed"],
    pos: ["adj-i"],
    correct: {
      ja: "自動販売機で飲み物を買いたいので、千円札を細かいお金にくずしてもらえませんか。",
      en: "I want to buy a drink at the vending machine, so could you break this 1,000-yen bill into small change for me?",
      exp: "「細かいお金 / 細かい字 / 細かいルール」is the natural expression for small coins/change or fine details.",
    },
    incorrect: [
      {
        ja: "真冬のグラウンドは風が細かくて、手足の指先がかじかんでしまいます。",
        en: "The wind on the midwinter field is strong and piercing, freezing the fingertips and toes.",
        exp: "Unnatural. Use「強くて」(strong) or「冷たくて」, not「細かくて」.",
      },
      {
        ja: "彼の弟はクラスで一番背が細かくて、いつも前列の席に座っています。",
        en: "His younger brother is the shortest in the class and always sits in the front row seats.",
        exp: "Unnatural. Use「背が低い」(short in height), not「背が細かい」.",
      },
      {
        ja: "このトマトスープは塩加減が細かくて、後味がとてもさっぱりしています。",
        en: "This tomato soup's seasoning is delicate, and its aftertaste is very refreshing.",
        exp: "Unnatural. Use「絶妙で」(exquisite) or「上品で」(delicate), not「細かくて」.",
      },
    ],
  },
  {
    id: "usage-n4-sakan",
    word: "盛ん",
    reading: "さかん",
    romaji: "sakan",
    meanings: ["thriving", "popular", "actively conducted"],
    pos: ["adj-na"],
    correct: {
      ja: "この地域では温暖な気候を利用して、昔から温室での果物栽培が盛んです。",
      en: "In this region, fruit cultivation in greenhouses has been actively flourishing since old times taking advantage of the mild climate.",
      exp: "「スポーツ / 産業 / 交流が盛んだ」naturally expresses activities, trades, or movements flourishing actively.",
    },
    incorrect: [
      {
        ja: "外は大雨が盛んに降っていて、傘をさして歩いても靴まで濡れてしまいます。",
        en: "Outside, heavy rain is falling fiercely, and even walking with an umbrella gets down to your shoes wet.",
        exp: "Unnatural. Rain intensity uses「激しく」(fiercely) or「ひどく」, never「盛んに」.",
      },
      {
        ja: "駅員さんがとても盛んな声で乗客に注意を呼びかけていました。",
        en: "The station attendant was calling out warnings to passengers in a very loud voice.",
        exp: "Unnatural. Voices use「大きな声」(loud voice) or「元気な声」, not「盛んな声」.",
      },
      {
        ja: "真冬の教室はエアコンの暖房が盛んに効いていて、とても暖かいです。",
        en: "In the midwinter classroom, the heating is working well, and it is very warm.",
        exp: "Unnatural. Effectiveness uses「よく効いている」(working well), not「盛んに」.",
      },
    ],
  },
  {
    id: "usage-n4-fukuzatsu",
    word: "複雑",
    reading: "ふくざつ",
    romaji: "fukuzatsu",
    meanings: ["complex", "complicated"],
    pos: ["adj-na"],
    correct: {
      ja: "新宿駅の地下街は構造がとても複雑で、初めて訪れた人はすぐに迷ってしまいます。",
      en: "The structure of the Shinjuku Station underground mall is very complicated, and first-time visitors easily get lost.",
      exp: "「構造 / 手続き / 事情が複雑だ」expresses intricate structures, procedures, or complex emotions.",
    },
    incorrect: [
      {
        ja: "果樹園でもぎたてのリンゴはとても複雑で、甘い果汁が溢れてきます。",
        en: "Freshly picked apples from the orchard are very fresh, overflowing with sweet fruit juice.",
        exp: "Unnatural. Fresh fruits use「新鮮」(fresh) or「みずみずしい」, not「複雑」.",
      },
      {
        ja: "彼女はとても複雑な人柄で、誰にでも明るく親切に挨拶をします。",
        en: "She has a cheerful personality and greets anyone brightly and kindly.",
        exp: "Unnatural. Use「明るい」(cheerful) or「親しみやすい」.「複雑」implies troublesome or difficult to understand.",
      },
      {
        ja: "風で電車が複雑に揺れたので、つり革を両手でしっかり掴まりました。",
        en: "The train swayed violently due to the wind, so I held tightly to the strap with both hands.",
        exp: "Unnatural. Violent swaying uses「激しく」(fiercely) or「大きく」, not「複雑に」.",
      },
    ],
  },
  {
    id: "usage-n4-teinei",
    word: "丁寧",
    reading: "ていねい",
    romaji: "teinei",
    meanings: ["polite", "courteous", "careful"],
    pos: ["adj-na"],
    correct: {
      ja: "ホテルのフロント係が、周辺の観光マップを広げて丁寧に道順を教えてくれました。",
      en: "The hotel front-desk clerk spread out the neighborhood tourist map and politely and thoroughly gave me directions.",
      exp: "「丁寧な言葉遣い / 丁寧に教える / 丁寧な仕事」expresses polite manners, scrupulous care, or thorough attention.",
    },
    incorrect: [
      {
        ja: "彼は陸上部のエースで、走るスピードが誰よりも丁寧で速いです。",
        en: "He is the ace of the track club, and his running speed is faster than anyone else's.",
        exp: "Unnatural. Running speed uses「速い」(fast), not「丁寧」.",
      },
      {
        ja: "洋食屋のコーンスープはとても丁寧で、パンにつけて食べると最高です。",
        en: "The corn soup at the Western restaurant is very delicious, and it's best eaten by dipping bread in it.",
        exp: "Unnatural. Food taste uses「おいしい」(delicious) or「濃厚」(rich), not「丁寧」.",
      },
      {
        ja: "春の高原は風が丁寧で、散歩しているととても心地よいです。",
        en: "The wind on the spring plateau is gentle and feels very pleasant when walking.",
        exp: "Unnatural. Breezes use「穏やか」(calm) or「心地よい」, not「丁寧」.",
      },
    ],
  },
  {
    id: "usage-n4-sukkari",
    word: "すっかり",
    reading: "すっかり",
    romaji: "sukkari",
    meanings: ["completely", "totally"],
    pos: ["adv"],
    correct: {
      ja: "日々の忙しい仕事に追われていて、友人の結婚式の記念日をすっかり忘れていました。",
      en: "Caught up in busy daily work, I had completely forgotten my friend's wedding anniversary.",
      exp: "「すっかり忘れる / すっかり良くなる」is the natural adverb for total change or complete lapse of memory.",
    },
    incorrect: [
      {
        ja: "昨夜はベッドに入ってから朝まで一度も起きず、すっかり眠りました。",
        en: "Last night I didn't wake up once from entering bed until morning, and slept soundly.",
        exp: "Unnatural. Sleeping soundly uses「ぐっすり眠る」(soundly asleep), not「すっかり」.",
      },
      {
        ja: "店で試着したジーンズのウエストが、私の体型にすっかり合いました。",
        en: "The waist of the jeans I tried on at the store fit my body type perfectly.",
        exp: "Unnatural. Fitting a size perfectly uses「ぴったり」(perfect fit), not「すっかり」.",
      },
      {
        ja: "急ぎの用事があったので、駅までの下り坂をすっかり歩いていきました。",
        en: "Because I had urgent business, I walked fast down the slope to the station.",
        exp: "Unnatural. Walking briskly uses「早足で」(at a fast pace) or「急いで」, not「すっかり」.",
      },
    ],
  },
  {
    id: "usage-n4-hakkiri",
    word: "はっきり",
    reading: "はっきり",
    romaji: "hakkiri",
    meanings: ["clearly", "distinctly"],
    pos: ["adv", "suru-verb"],
    correct: {
      ja: "眼鏡を新しく買い替えたら、遠くの黒板の細かい文字まではっきり見えるようになりました。",
      en: "After replacing my glasses with new ones, I became able to clearly see even fine characters on the distant blackboard.",
      exp: "「はっきり見える / はっきり言う / はっきり覚えている」collocates with seeing, stating, or remembering clearly.",
    },
    incorrect: [
      {
        ja: "一日中重い荷物を運ぶ力仕事をしたので、身体中がはっきり疲れました。",
        en: "Because I did physical labor carrying heavy goods all day, my whole body was terribly tired.",
        exp: "Unnatural. Weariness intensity uses「ひどく」(terribly) or「とても」(very), not「はっきり」.",
      },
      {
        ja: "週末にクラスメートと待ち合わせをして、はっきりと映画館へ行きました。",
        en: "On the weekend I met up with my classmates and went to the movie theater together.",
        exp: "Unnatural. Doing an action in company uses「一緒に」(together), not「はっきりと」.",
      },
      {
        ja: "もぎたての完熟イチゴを食べたら、果汁がはっきり甘くて驚きました。",
        en: "When I ate the freshly picked ripe strawberry, the juice was very sweet and surprised me.",
        exp: "Unnatural. Taste sweetness uses「とても甘い」(very sweet) or「すごく」, not「はっきり」.",
      },
    ],
  },
];

console.log("Total raw items:", RAW_N4_ITEMS.length);
if (RAW_N4_ITEMS.length !== 45) {
  throw new Error(`Expected exactly 45 items, found ${RAW_N4_ITEMS.length}`);
}

// Convert to WordUsageItem[] with distributed correctOptionIndex
const n4Items: WordUsageItem[] = RAW_N4_ITEMS.map((raw, itemIdx) => {
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
    level: "N4",
    jlpt: 4,
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

const OUT_FILE = path.join(OUT_DIR, "n4.ts");
const content = `// Curated JLPT N4 Word Usage (語彙・用法 — Mondai 5) items
// Generated from enriched N4 vocabulary source data.

import type { WordUsageItem } from "../wordUsageData";

export const WORD_USAGE_N4_ITEMS: readonly WordUsageItem[] = ${JSON.stringify(
  n4Items,
  null,
  2,
)};
`;

fs.writeFileSync(OUT_FILE, content, "utf-8");
console.log(`Successfully wrote ${n4Items.length} curated N4 items to ${OUT_FILE}`);
