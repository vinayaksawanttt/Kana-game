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

const RAW_N1_ITEMS: RawItemData[] = [
  // 1. 愛想 (correctIdx: 0)
  {
    id: "usage-n1-aiso",
    word: "愛想",
    reading: "あいそ",
    romaji: "aiso",
    meanings: ["civility", "courtesy", "sociability", "graces"],
    pos: ["noun"],
    correctIdx: 0,
    correct: {
      ja: "彼はいつも笑顔で誰に対しても愛想がよく、職場の同僚やお客さんからとても好かれている。",
      en: "He is always smiling and pleasant to everyone, and is well-liked by colleagues and customers.",
      exp: "「愛想がいい / 愛想を尽かす」is the established idiom for friendly, pleasant interpersonal demeanor or sociability.",
    },
    incorrect: [
      {
        ja: "毎日の生活習慣を愛想して、夜更かしをやめて早起きを心がけるようにした。",
        en: "I civilitied my daily lifestyle habits, quitting staying up late and making an effort to wake up early.",
        exp: "Unnatural. Reforming personal lifestyle habits uses「改善して」(improve) or「改めて」(reform), not「愛想して」.",
      },
      {
        ja: "新しく買ったスマートフォンの愛想がとても綺麗で、写真を撮るのが楽しくなった。",
        en: "The courtesy of my newly purchased smartphone is very beautiful, making taking photos fun.",
        exp: "Unnatural. Display screen or image clarity uses「画面」(screen) or「画質」(image quality), not「愛想」.",
      },
      {
        ja: "会議で出された提案に対して、全員が大きな愛想で拍手をして歓迎した。",
        en: "Toward the proposal made in the meeting, everyone welcomed it with applause and large courtesy.",
        exp: "Unnatural. Welcoming with high spirits uses「歓声」(cheers) or「熱意」(enthusiasm), not「愛想」.",
      },
    ],
  },

  // 2. 合間 (correctIdx: 1)
  {
    id: "usage-n1-aima",
    word: "合間",
    reading: "あいま",
    romaji: "aima",
    meanings: ["interval", "spare time"],
    pos: ["noun"],
    correctIdx: 1,
    correct: {
      ja: "彼は多忙な仕事の合間を縫って、語学の勉強や資格試験の準備を熱心に続けている。",
      en: "Squeezing time between intervals of his busy job, he diligently continues studying languages and preparing for certification exams.",
      exp: "「仕事 / 家事の合間を縫う」is the classic idiomatic collocation for finding spare intervals between continuous activities.",
    },
    incorrect: [
      {
        ja: "電車のドアの合間に荷物が挟まってしまい、発車が数分遅れてしまった。",
        en: "Luggage got caught in the interval of the train door, delaying departure by several minutes.",
        exp: "Unnatural. A physical gap between physical objects uses「隙間」(sukima - physical opening), not temporal「合間」.",
      },
      {
        ja: "昨日の夜からの合間で、庭の植木鉢にきれいな花がたくさん咲いた。",
        en: "In the interval since last night, many pretty flowers bloomed in the garden flowerpot.",
        exp: "Unnatural. Overnight duration uses「一晩のうちに」(over the course of a night) or「短期間で」, not「合間」.",
      },
      {
        ja: "スープの合間に少し塩を足すと、味が引き締まってとても美味しくなった。",
        en: "Adding a little salt to the interval of the soup tightened the flavor and made it delicious.",
        exp: "Unnatural. Adding seasonings uses「隠し味に」(as secret accent) or「仕上げに」(as finishing touch), not「合間に」.",
      },
    ],
  },

  // 3. 敢えて (correctIdx: 2)
  {
    id: "usage-n1-aete",
    word: "敢えて",
    reading: "あえて",
    romaji: "aete",
    meanings: ["dare (to do)", "venture (to do)", "purposely take the risk"],
    pos: ["adverb"],
    correctIdx: 2,
    correct: {
      ja: "反対意見が多いことは重々承知しているが、現状を打開するために私は敢えてこの厳しい提案をする。",
      en: "While fully aware there is much opposition, to break through the current impasse I dare to put forward this harsh proposal.",
      exp: "「敢えて＋動詞」expresses deliberately undertaking an action despite obvious friction, difficulty, or danger.",
    },
    incorrect: [
      {
        ja: "昨夜は疲れていたので、夕食を食べたあと敢えて朝までぐっすり眠った。",
        en: "Because I was tired last night, after eating dinner I dared to sleep soundly until morning.",
        exp: "Unnatural. Sleeping soundly uses「ぐっすり」(soundly) or「そのまま」(straight away).「敢えて」requires daring risk or difficulty.",
      },
      {
        ja: "毎日の散歩を欠かさず続けているので、彼の足腰は敢えて丈夫で元気だ。",
        en: "Continuing daily walks without fail, his legs and lower back are daringly sturdy and healthy.",
        exp: "Unnatural. Being genuinely robust uses「実に」(truly) or「非常に」(very), not「敢えて」.",
      },
      {
        ja: "駅前のベーカリーで焼きたてのパンを敢えて買って、家族みんなで美味しく食べた。",
        en: "I dared to buy freshly baked bread at the bakery in front of the station and enjoyed it with my family.",
        exp: "Unnatural. Going out of one's way for good bread uses「わざわざ」(went out of way to) or「立ち寄って」, not「敢えて」.",
      },
    ],
  },

  // 4. 仰ぐ (correctIdx: 3)
  {
    id: "usage-n1-aogu",
    word: "仰ぐ",
    reading: "あおぐ",
    romaji: "aogu",
    meanings: ["to look up (to)", "to respect", "to seek", "to ask for"],
    pos: ["verb", "godan"],
    correctIdx: 3,
    correct: {
      ja: "不測の事態に直面した現場のリーダーは、独断での判断を避け、本部の指示を仰ぐことにした。",
      en: "Confronted with an unforeseen situation, the on-site leader avoided making arbitrary decisions and decided to seek instructions from headquarters.",
      exp: "「指示 / 指導 / 助力を仰ぐ」is the formal respectful collocation for seeking guidance or decisions from a superior authority.",
    },
    incorrect: [
      {
        ja: "喉が渇いたので、冷たい麦茶を一気にコップ一杯仰ぎました。",
        en: "Being thirsty, I looked up a cup of cold barley tea all in one gulp.",
        exp: "Unnatural. Gulping down a beverage uses「飲み干した」(drank dry) or「あおった」(from 煽る - gulp), not「仰いだ」.",
      },
      {
        ja: "部屋に煙が充満していたので、窓を大きく開けて外の新鮮な空気を仰ぎました。",
        en: "Because the room was filled with smoke, I opened windows wide and looked up the fresh outside air.",
        exp: "Unnatural. Ventilating fresh air uses「取り入れた」(let in) or「吸い込んだ」(inhaled), not「仰いだ」.",
      },
      {
        ja: "パソコンの画面を長時間仰いでいたため、目が疲れて肩も凝ってしまった。",
        en: "Because I looked up at the computer screen for a long time, my eyes grew fatigued and shoulders stiffened.",
        exp: "Unnatural. Gazing at monitors uses「見つめていた」(stared at) or「眺めていた」, not「仰いでいた」.",
      },
    ],
  },

  // 5. 呆気ない (correctIdx: 0)
  {
    id: "usage-n1-akkenai",
    word: "呆気ない",
    reading: "あっけない",
    romaji: "akkenai",
    meanings: ["too quick", "disappointingly short", "anti-climactic"],
    pos: ["i-adj"],
    correctIdx: 0,
    correct: {
      ja: "決勝戦は白熱した大熱戦になると誰もが期待していたが、わずか５分で決着がつき、呆気ない幕切れだった。",
      en: "Everyone expected the final match would be a fiercely heated battle, but it was settled in just 5 minutes, making it an anti-climactic conclusion.",
      exp: "「呆気ない結末 / 幕切れ」expresses a disappointing, anti-climactic ending that falls short of expectations due to brevity.",
    },
    incorrect: [
      {
        ja: "この小説の結末は呆気ないほど感動的で、読者の多くが涙を流した。",
        en: "The conclusion of this novel was anti-climactically touching, bringing many readers to tears.",
        exp: "Unnatural. Heartfelt or tear-evoking endings use「胸を打つほど」(heart-stirring) or「涙を誘うほど」, not「呆気ない」.",
      },
      {
        ja: "彼女は誰に対しても呆気ない態度で接するので、周囲の人々から信頼されている。",
        en: "Because she treats everyone with an anti-climactic attitude, she is trusted by people around her.",
        exp: "Unnatural. Trustworthy frank demeanor uses「裏表のない」(unpretentious) or「誠実な」(sincere), not「呆気ない」.",
      },
      {
        ja: "徹夜で勉強したおかげで、今朝の試験は呆気ない高得点を取ることができた。",
        en: "Thanks to studying all night, I was able to score an anti-climactic high score on this morning's exam.",
        exp: "Unnatural. High test scores use「素晴らしい」(wonderful) or「見事な」(splendid), not「呆気ない」.",
      },
    ],
  },

  // 6. 一概に (correctIdx: 1)
  {
    id: "usage-n1-ichigaini",
    word: "一概に",
    reading: "いちがいに",
    romaji: "ichigaini",
    meanings: ["unconditionally", "as a rule", "sweepingly"],
    pos: ["adverb"],
    correctIdx: 1,
    correct: {
      ja: "都会での暮らしが便利だからといって、地方より必ずしも幸福であるとは一概には言えない。",
      en: "Just because living in the city is convenient, one cannot sweepingly assert that it is necessarily happier than living in the countryside.",
      exp: "「一概に〜とは言えない / 決めつけられない」is the established construction indicating that generalizations cannot be sweepingly made.",
    },
    incorrect: [
      {
        ja: "彼はクラスで一概に成績が優秀で、どの教科でも学年トップの点数を取っている。",
        en: "His academic performance is sweepingly outstanding in class, ranking top in every subject.",
        exp: "Unnatural. Peerless academic excellence uses「圧倒的に」(overwhelmingly) or「ずば抜けて」(by far), not「一概に」.",
      },
      {
        ja: "雨が激しく降り始めたので、グラウンドで練習していた選手たちは一概に部室へ戻った。",
        en: "Because rain began falling heavily, players practicing on the field sweepingly returned to the club room.",
        exp: "Unnatural. Doing an action all together at once uses「一斉に」(all at once) or「全員で」, not「一概に」.",
      },
      {
        ja: "毎朝ジョギングを一概に続けることで、体力がついて風邪をひきにくくなった。",
        en: "By sweepingly continuing jogging every morning, I built stamina and became less prone to colds.",
        exp: "Unnatural. Continuing habits faithfully uses「地道に」(steadily) or「欠かさず」(without fail), not「一概に」.",
      },
    ],
  },

  // 7. 一挙に (correctIdx: 2)
  {
    id: "usage-n1-ikkyoni",
    word: "一挙に",
    reading: "いっきょに",
    romaji: "ikkyoni",
    meanings: ["at a stroke", "in a single swoop", "all at once"],
    pos: ["adverb"],
    correctIdx: 2,
    correct: {
      ja: "話題のドラマが世界中で大ヒットしたことで、無名だった主演俳優は一挙にスターダムへと駆け上がった。",
      en: "Because the talked-about drama became a massive global hit, the previously unknown lead actor rose to stardom at a single stroke.",
      exp: "「一挙に解決する / 知名度が一挙に上がる」denotes achieving drastic change or progress all at once in one major bound.",
    },
    incorrect: [
      {
        ja: "階段を一挙に一段ずつ注意深く降りながら、転ばないように手すりを掴んだ。",
        en: "While descending stairs at a single stroke step-by-step carefully, I gripped the handrail to avoid falling.",
        exp: "Unnatural. Step-by-step careful descent uses「一段ずつていねいに」(carefully one step at a time), not「一挙に」.",
      },
      {
        ja: "毎日の読書を一挙に積み重ねることで、豊かな語彙力と思考力を養うことができる。",
        en: "By piling up daily reading at a single stroke, one can cultivate rich vocabulary and thinking ability.",
        exp: "Unnatural. Gradual daily accumulation uses「コツコツと」(steadily) or「地道に」(tirelessly), opposite of「一挙に」.",
      },
      {
        ja: "彼はとても真面目で、約束の時間を一挙に守って待合場所に到着した。",
        en: "He is very conscientious, keeping appointment times at a single stroke and arriving at the rendezvous.",
        exp: "Unnatural. Punctually keeping appointments uses「正確に」(punctually) or「きちんと」(properly), not「一挙に」.",
      },
    ],
  },

  // 8. 一筋 (correctIdx: 3)
  {
    id: "usage-n1-hitosuji",
    word: "一筋",
    reading: "ひとすじ",
    romaji: "hitosuji",
    meanings: ["devoted to one thing", "earnestly", "straightforwardly", "a ray of"],
    pos: ["noun", "na-adj"],
    correctIdx: 3,
    correct: {
      ja: "祖父は若い頃から六十年間、伝統工芸の陶芸一筋に情熱を注ぎ続けてきた名職人だ。",
      en: "My grandfather is a master craftsman who has poured his passion single-mindedly into traditional ceramic pottery for sixty years since his youth.",
      exp: "「研究 / 芸道一筋」is the classic expression for devoting one's entire heart and soul single-mindedly to one single endeavor.",
    },
    incorrect: [
      {
        ja: "会議が長引いて意見がまとまらないので、まずは一筋の休憩を取ることにした。",
        en: "Because the meeting was dragging on without consensus, we decided to take a single-minded break first.",
        exp: "Unnatural. Taking a short breather uses「一息」(a breather) or「少しの」(short), not「一筋」.",
      },
      {
        ja: "旅行の荷物を軽くするために、着替えの服を一筋に圧縮してバッグに詰めた。",
        en: "To lighten travel luggage, I compressed change of clothes single-mindedly and packed them into the bag.",
        exp: "Unnatural. Compacting luggage uses「コンパクトに」(compactly) or「小さく」(small), not「一筋に」.",
      },
      {
        ja: "彼はとてもおしゃべりで、一度話し始めると一筋に話題が次々と飛んでいく。",
        en: "He is very talkative, and once he starts talking, topics fly one after another single-mindedly.",
        exp: "Unnatural. Jumping haphazardly between topics uses「次々と」(one after another) or「脈絡なく」, not「一筋に」.",
      },
    ],
  },

  // 9. 過密 (correctIdx: 0)
  {
    id: "usage-n1-kamitsu",
    word: "過密",
    reading: "かみつ",
    romaji: "kamitsu",
    meanings: ["crowded", "tightly packed (schedule/traffic)"],
    pos: ["na-adj", "noun"],
    correctIdx: 0,
    correct: {
      ja: "選挙期間中の候補者は、分刻みで全国各地を飛び回る過密なスケジュールをこなしている。",
      en: "During the election campaign period, candidates carry out tightly packed, overcrowded schedules flying across the country minute by minute.",
      exp: "「過密なスケジュール / 過密ダイヤ」is the standard collocation for schedules or timetables packed with excessive density.",
    },
    incorrect: [
      {
        ja: "昨夜の雨で森の空気がとても過密になっており、深呼吸すると心地よかった。",
        en: "Due to last night's rain, the forest air became very tightly packed, feeling pleasant when breathing deeply.",
        exp: "Unnatural. Pure, refreshing air uses「澄んで」(clear) or「爽やかで」(refreshing), not「過密になって」.",
      },
      {
        ja: "彼女が作ったケーキは生クリームが過密で、甘さ控えめでとても美味しかった。",
        en: "The cake she baked had tightly packed fresh cream, moderately sweet and very delicious.",
        exp: "Unnatural. Rich and abundant cream uses「たっぷり使われていて」(plentiful) or「濃厚で」(rich), not「過密で」.",
      },
      {
        ja: "彼は英語の語彙が過密なので、どんな難しいニュースでもスラスラと読める。",
        en: "Because his English vocabulary is tightly packed, he can read any difficult news smoothly.",
        exp: "Unnatural. Having an extensive vocabulary uses「豊富なので」(abundant) or「多彩なので」, not「過密なので」.",
      },
    ],
  },

  // 10. 勧告 (correctIdx: 1)
  {
    id: "usage-n1-kankoku",
    word: "勧告",
    reading: "かんこく",
    romaji: "kankoku",
    meanings: ["counsel", "recommendation", "official advice"],
    pos: ["noun", "suru-verb"],
    correctIdx: 1,
    correct: {
      ja: "労働基準監督署は、長時間の違法残業が常態化していたその企業に対して是正勧告を行った。",
      en: "The Labor Standards Inspection Office issued a formal corrective recommendation to that enterprise where illegal long overtime had become routine.",
      exp: "「是正 / 避難 / 辞職を勧告する」is the formal administrative or institutional term for official recommendations or counsel.",
    },
    incorrect: [
      {
        ja: "友人が風邪をひいて寝込んでいたので、栄養のある温かいおかゆを勧告してあげた。",
        en: "Since my friend was in bed sick with a cold, I recommended nutritious warm rice porridge for them.",
        exp: "Unnatural. Preparing meals for someone uses「作ってあげた」(cooked for) or「振る舞った」(served), not「勧告した」.",
      },
      {
        ja: "駅前の新しいカフェのコーヒーが絶品だったので、同僚にぜひ行くよう勧告しました。",
        en: "Because the coffee at the new station cafe was superb, I recommended to colleagues that they visit.",
        exp: "Unnatural. Recommending a cafe casually uses「勧めた」(recommended), not institutional「勧告した」.",
      },
      {
        ja: "明日の朝早くから新幹線に乗るので、今夜は早く寝るよう自分自身に勧告しました。",
        en: "Since I ride the bullet train early tomorrow morning, I recommended to myself to sleep early tonight.",
        exp: "Unnatural. Reminding or admonishing oneself uses「言い聞かせた」(told oneself) or「決めた」, not「勧告した」.",
      },
    ],
  },

  // 11. 緩和 (correctIdx: 2)
  {
    id: "usage-n1-kanwa",
    word: "緩和",
    reading: "かんわ",
    romaji: "kanwa",
    meanings: ["relief", "mitigation", "relaxation (regulations/tension)"],
    pos: ["noun", "suru-verb"],
    correctIdx: 2,
    correct: {
      ja: "景気回復を後押しするため、政府と中央銀行は金融引き締め政策を見直し、規制の緩和に踏み切った。",
      en: "To bolster economic recovery, the government and central bank reviewed monetary tightening and stepped into the relaxation of regulations.",
      exp: "「規制 / 緊張 / 痛みを緩和する」means softening, relieving, or easing strict regulations, intense pain, or strained tensions.",
    },
    incorrect: [
      {
        ja: "台風が近づいてきたため、港の漁師たちは船が流されないようにロープを強く緩和した。",
        en: "Because a typhoon approached, harbor fishermen strongly relaxed ropes so boats would not drift away.",
        exp: "Unnatural. Securing ropes tightly uses「締め直した」(re-tightened) or「固定した」(fastened), opposite of「緩和した」.",
      },
      {
        ja: "彼女は毎日ジョギングを続けて、体全体の筋力を大幅に緩和することに成功した。",
        en: "Continuing jogging daily, she succeeded in substantially relaxing the muscle strength of her entire body.",
        exp: "Unnatural. Strengthening musculature uses「強化する」(strengthen) or「鍛える」(train), not「緩和する」.",
      },
      {
        ja: "新しいビルの工事現場では、安全基準を緩和するために作業員全員がヘルメットを着用している。",
        en: "At the construction site of the new building, every worker wears a helmet to relax safety standards.",
        exp: "Unnatural. Upholding safety standards uses「守るため」(to observe) or「遵守するため」, not「緩和するため」.",
      },
    ],
  },

  // 12. 享受 (correctIdx: 3)
  {
    id: "usage-n1-kyouju",
    word: "享受",
    reading: "きょうじゅ",
    romaji: "kyouju",
    meanings: ["reception", "acceptance", "enjoyment", "being given"],
    pos: ["noun", "suru-verb"],
    correctIdx: 3,
    correct: {
      ja: "私たちは先人たちのたゆまぬ努力のおかげで、平和で豊かな社会の恩恵を十分に享受している。",
      en: "Thanks to the tireless efforts of our predecessors, we fully enjoy and receive the blessings of a peaceful and prosperous society.",
      exp: "「恩恵 / 自由 / 権利を享受する」means receiving and savoring the benefits, rights, or privileges granted by society or nature.",
    },
    incorrect: [
      {
        ja: "料理長が丹精込めて作ったフランス料理のフルコースを、お腹いっぱい享受しました。",
        en: "I enjoyed the full-course French cuisine prepared wholeheartedly by the head chef to my heart's content.",
        exp: "Unnatural. Savoring gourmet food uses「堪能しました」(relished) or「味わいました」(tasted), not「享受しました」.",
      },
      {
        ja: "祖父は毎朝庭に出て、丹精込めて育てている盆栽の手入れを丹念に享受しています。",
        en: "Every morning my grandfather steps out into the garden and painstakingly enjoys caring for his bonsai.",
        exp: "Unnatural. Tending to plants uses「行っています」(carries out) or「楽しんでいます」(enjoys doing), not「享受しています」.",
      },
      {
        ja: "友人の悩み相談に乗って、的確なアドバイスを心から享受してあげました。",
        en: "Listening to my friend's worries, I whole-heartedly enjoyed giving them precise advice.",
        exp: "Unnatural. Giving advice uses「与えてあげた」(provided) or「送った」(sent), not「享受してあげた」.",
      },
    ],
  },

  // 13. 共鳴 (correctIdx: 0)
  {
    id: "usage-n1-kyoumei",
    word: "共鳴",
    reading: "きょうめい",
    romaji: "kyoumei",
    meanings: ["resonance", "sympathy"],
    pos: ["noun", "suru-verb"],
    correctIdx: 0,
    correct: {
      ja: "その環境保護活動家の崇高な理念に深く共鳴した多くの若者たちが、各地でボランティアとして立ち上がった。",
      en: "Deeply resonating with the environmental activist's noble ideals, many young people stood up as volunteers across various regions.",
      exp: "「思想 / 理念 / 主張に共鳴する」means having one's thoughts and heart resonate in deep sympathetic agreement with another's ideals.",
    },
    incorrect: [
      {
        ja: "スマホの充電ケーブルの接触が悪くなったので、新しいケーブルに共鳴しました。",
        en: "The contact of the smartphone charging cable worsened, so I resonated into a new cable.",
        exp: "Unnatural. Replacing cables uses「買い替えた」(purchased replacement) or「交換した」(exchanged), not「共鳴した」.",
      },
      {
        ja: "今朝は目覚まし時計の音がとても共鳴で、家族全員が一斉に飛び起きた。",
        en: "This morning the sound of the alarm clock was very resonant, so the entire family leaped awake at once.",
        exp: "Unnatural. Piercing or loud alarm sound uses「大きくて」(loud) or「けたたましくて」(shrill), not「共鳴で」.",
      },
      {
        ja: "彼女のピアノの音色はとても共鳴で、聴いているだけで心が落ち着いてくる。",
        en: "Her piano timbre was very resonant, calming the heart just by listening to it.",
        exp: "Unnatural. Soothing or beautiful musical tone uses「澄んでいて」(pure) or「心地よくて」(pleasant), not「共鳴で」.",
      },
    ],
  },

  // 14. 巧妙 (correctIdx: 1)
  {
    id: "usage-n1-koumyou",
    word: "巧妙",
    reading: "こうみょう",
    romaji: "koumyou",
    meanings: ["ingenious", "skillful", "clever", "deft"],
    pos: ["na-adj", "noun"],
    correctIdx: 1,
    correct: {
      ja: "犯行グループは警察の目を欺くため、非常に巧妙な手口を使って不正な資金洗浄を繰り返していた。",
      en: "To deceive the eyes of the police, the crime group repeatedly laundered illegal funds using extremely ingenious techniques.",
      exp: "「巧妙な手口 / 罠 / 仕掛け」is the classic collocation for artfully clever, crafty tricks or techniques designed to elude detection.",
    },
    incorrect: [
      {
        ja: "今年の夏休みは巧妙な計画を立てて、家族みんなで北海道の大自然を満喫した。",
        en: "For this summer vacation, I made an ingenious plan and enjoyed Hokkaido's great nature with my family.",
        exp: "Unnatural. Making thoughtful vacation plans uses「綿密な」(meticulous) or「充実した」(fulfilling), not「巧妙な」(crafty).",
      },
      {
        ja: "彼はとても誠実な人柄で、誰に対しても巧妙に接するので周囲から慕われている。",
        en: "He has a very sincere personality and treats everyone ingeniously, so he is adored by those around him.",
        exp: "Unnatural. Treating people sincerely uses「誠実に」(sincerely) or「温かく」(warmly), not「巧妙に」.",
      },
      {
        ja: "山頂からの景色は巧妙に美しく、見渡す限りの雲海が太陽の光に輝いていた。",
        en: "The view from the summit was ingeniously beautiful, with a sea of clouds as far as the eye could see.",
        exp: "Unnatural. Stunning natural scenery uses「息をのむほど」(breathtakingly) or「神々しいほど」, not「巧妙に」.",
      },
    ],
  },

  // 15. 根拠 (correctIdx: 2)
  {
    id: "usage-n1-konkyo",
    word: "根拠",
    reading: "こんきょ",
    romaji: "konkyo",
    meanings: ["basis", "foundation", "grounds"],
    pos: ["noun"],
    correctIdx: 2,
    correct: {
      ja: "科学的な根拠に基づかない曖昧な噂話を、あたかも事実であるかのように信じ込むのは極めて危険だ。",
      en: "Simplistically believing ambiguous rumors that are not based on scientific basis as if they were fact is extremely dangerous.",
      exp: "「確かな根拠 / 根拠を示す / 根拠に基づく」refers to the factual premise, rationale, or proof supporting an assertion or theory.",
    },
    incorrect: [
      {
        ja: "新しいアパートの家賃を支払うために、駅前の銀行で根拠を下ろしてきました。",
        en: "To pay the rent for the new apartment, I withdrew basis at the bank in front of the station.",
        exp: "Unnatural. Withdrawing funds uses「お金」(money) or「預金」(savings), not「根拠」.",
      },
      {
        ja: "彼女は毎朝庭の花壇に根拠をたっぷり与えて、大切に育てている。",
        en: "Every morning she gives plenty of basis to the flowerbed in the garden and cares for them.",
        exp: "Unnatural. Giving water or plant nourishment uses「水」(water) or「肥料」(fertilizer), not「根拠」.",
      },
      {
        ja: "彼はとても足が速く、100メートル走で学年トップの根拠を叩き出した。",
        en: "He is very fast on his feet, producing the grade-top basis in the 100-meter dash.",
        exp: "Unnatural. Setting a sports race time uses「記録」(record) or「タイム」(time), not「根拠」.",
      },
    ],
  },
];

const n1Items: WordUsageItem[] = RAW_N1_ITEMS.map((raw) => {
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
    level: "N1",
    jlpt: 1,
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

const OUT_FILE = path.join(OUT_DIR, "n1.ts");
const content = `// Curated JLPT N1 Word Usage (語彙・用法 — Mondai 5) items
// Generated from enriched N1 vocabulary source data.

import type { WordUsageItem } from "../wordUsageData";

export const WORD_USAGE_N1_ITEMS: readonly WordUsageItem[] = ${JSON.stringify(
  n1Items,
  null,
  2,
)};
`;

fs.writeFileSync(OUT_FILE, content, "utf-8");
console.log(`Successfully wrote ${n1Items.length} curated N1 items to ${OUT_FILE}`);
