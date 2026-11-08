export type TrapCategory =
  | "keigo-mismatch"
  | "homophone-trap"
  | "register-mismatch"
  | "wrong-intent"
  | "grammar-tense-trap";

export interface RawInstantReplyOption {
  ja: string;
  isCorrect: boolean;
  trapType?: TrapCategory;
  explanation: string;
}

export interface RawInstantReplyItem {
  id: string;
  jlpt: 5 | 4 | 3 | 2 | 1;
  category?: "quick-response" | "situational-utterance";
  situationContext: string;
  speakerRole: string;
  promptJa: string;
  options: [RawInstantReplyOption, RawInstantReplyOption, RawInstantReplyOption];
}

// 150 authentic JLPT/NAT Mondai 4/5 Quick Response dialogue triads
// N5: 35, N4: 35, N3: 35, N2: 25, N1: 20
export const RAW_INSTANT_REPLY_ITEMS: RawInstantReplyItem[] = [
  // --- N5 (35 items) ---
  {
    id: "reply-n5-01",
    jlpt: 5,
    situationContext: "On a train",
    speakerRole: "Passenger",
    promptJa: "すみません、この席、空いていますか？",
    options: [
      { ja: "ええ、どうぞ。空いていますよ。", isCorrect: true, explanation: "Natural polite permission stating the seat is open." },
      { ja: "いいえ、座りません。", isCorrect: false, trapType: "wrong-intent", explanation: "Answers about yourself sitting, but the other person asked if the seat was unoccupied." },
      { ja: "どういたしまして。", isCorrect: false, trapType: "register-mismatch", explanation: "Means 'You are welcome', which makes no sense before a favor or thanks." }
    ]
  },
  {
    id: "reply-n5-02",
    jlpt: 5,
    situationContext: "Leaving the house",
    speakerRole: "Family member",
    promptJa: "いってきます！",
    options: [
      { ja: "いってらっしゃい、気をつけてね。", isCorrect: true, explanation: "Standard set response to someone leaving home." },
      { ja: "おかえりなさい。", isCorrect: false, trapType: "wrong-intent", explanation: "Said to someone returning home, not leaving." },
      { ja: "ごちそうさまでした。", isCorrect: false, trapType: "register-mismatch", explanation: "Said after finishing a meal, not when someone leaves." }
    ]
  },
  {
    id: "reply-n5-03",
    jlpt: 5,
    situationContext: "Returning home",
    speakerRole: "Family member",
    promptJa: "ただいま！",
    options: [
      { ja: "おかえりなさい、お疲れ様。", isCorrect: true, explanation: "Standard set response welcoming someone home." },
      { ja: "いってらっしゃい。", isCorrect: false, trapType: "wrong-intent", explanation: "Said when someone leaves the house, not when returning." },
      { ja: "いただきます。", isCorrect: false, trapType: "register-mismatch", explanation: "Said before eating a meal." }
    ]
  },
  {
    id: "reply-n5-04",
    jlpt: 5,
    situationContext: "At a classmate's desk",
    speakerRole: "Classmate",
    promptJa: "そのペン、ちょっと借りてもいい？",
    options: [
      { ja: "うん、どうぞ使って。", isCorrect: true, explanation: "Casual polite consent giving permission to use the pen." },
      { ja: "はい、借りました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense 'I borrowed it', but the speaker is asking for permission now." },
      { ja: "いいえ、貸してください。", isCorrect: false, trapType: "wrong-intent", explanation: "Asks them to lend to you instead of granting permission." }
    ]
  },
  {
    id: "reply-n5-05",
    jlpt: 5,
    situationContext: "In a hallway",
    speakerRole: "Sick colleague",
    promptJa: "熱があるので、今日は早く帰ります。",
    options: [
      { ja: "お大事に。無理しないでね。", isCorrect: true, explanation: "The standard phrase of caring said to someone sick or unwell." },
      { ja: "ごちそうさまでした。", isCorrect: false, trapType: "wrong-intent", explanation: "Set meal greeting, completely out of context." },
      { ja: "はじめまして、よろしく。", isCorrect: false, trapType: "register-mismatch", explanation: "First-meeting introduction greeting." }
    ]
  },
  {
    id: "reply-n5-06",
    jlpt: 5,
    situationContext: "After finishing dinner",
    speakerRole: "Host",
    promptJa: "料理、たくさん召し上がりましたね。",
    options: [
      { ja: "はい、とてもおいしかったです。ごちそうさまでした。", isCorrect: true, explanation: "Polite gratitude after eating." },
      { ja: "いいえ、いただきます。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "'Itadakimasu' is only said before eating, not after finishing." },
      { ja: "おめでとうございます。", isCorrect: false, trapType: "wrong-intent", explanation: "Congratulations greeting, inappropriate for finishing a meal." }
    ]
  },
  {
    id: "reply-n5-07",
    jlpt: 5,
    situationContext: "At an office door",
    speakerRole: "Coworker",
    promptJa: "お先に失礼します。",
    options: [
      { ja: "お疲れ様でした。気をつけて。", isCorrect: true, explanation: "Standard workplace reply to someone leaving work before you." },
      { ja: "すみません、失礼しました。", isCorrect: false, trapType: "wrong-intent", explanation: "Apology for a mistake, not a response to a coworker leaving." },
      { ja: "いってきます。", isCorrect: false, trapType: "register-mismatch", explanation: "Said by the person leaving home/office for an errand." }
    ]
  },
  {
    id: "reply-n5-08",
    jlpt: 5,
    situationContext: "At a cafe",
    speakerRole: "Friend",
    promptJa: "コーヒーのおかわりはいかがですか？",
    options: [
      { ja: "ありがとうございます。いただきます。", isCorrect: true, explanation: "Polite acceptance of a second cup of coffee." },
      { ja: "はい、コーヒーです。", isCorrect: false, trapType: "wrong-intent", explanation: "Simply defines what it is rather than accepting or declining." },
      { ja: "いいえ、飲みました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Unnatural refusal sounding like 'No, I already drank'." }
    ]
  },
  {
    id: "reply-n5-09",
    jlpt: 5,
    situationContext: "In the street",
    speakerRole: "Stranger",
    promptJa: "駅への道を教えていただけませんか？",
    options: [
      { ja: "ええ、この道をまっすぐ行くとありますよ。", isCorrect: true, explanation: "Clear, helpful directions given in response." },
      { ja: "いいえ、教えませんでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense 'No, I didn't teach you', rude and ungrammatical." },
      { ja: "はい、行ってまいります。", isCorrect: false, trapType: "wrong-intent", explanation: "Humble phrase for leaving on an errand yourself." }
    ]
  },
  {
    id: "reply-n5-10",
    jlpt: 5,
    situationContext: "Classroom",
    speakerRole: "Teacher",
    promptJa: "宿題はもう出しましたか？",
    options: [
      { ja: "すみません、まだ出していません。", isCorrect: true, explanation: "Natural polite admission that homework is not yet submitted." },
      { ja: "はい、宿題を出します。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Non-past tense 'I will submit', doesn't answer whether it was submitted already." },
      { ja: "いいえ、出しました。", isCorrect: false, trapType: "wrong-intent", explanation: "Contradicts itself by saying 'No, I submitted it'." }
    ]
  },
  {
    id: "reply-n5-11",
    jlpt: 5,
    situationContext: "Station platform",
    speakerRole: "Friend",
    promptJa: "電車、もうすぐ来ますね。",
    options: [
      { ja: "そうですね、混んでいないといいですね。", isCorrect: true, explanation: "Agrees with the statement and adds a natural thought." },
      { ja: "いいえ、来ませんでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense 'didn't come', but the train is arriving now." },
      { ja: "ごめんください。", isCorrect: false, trapType: "register-mismatch", explanation: "Greeting when visiting someone's house, not waiting for a train." }
    ]
  },
  {
    id: "reply-n5-12",
    jlpt: 5,
    situationContext: "Department store",
    speakerRole: "Clerk",
    promptJa: "いらっしゃいませ。何かお探しですか？",
    options: [
      { ja: "あ、見ているだけです。ありがとう。", isCorrect: true, explanation: "Standard polite response 'Just looking, thank you'." },
      { ja: "はい、探しません。", isCorrect: false, trapType: "wrong-intent", explanation: "Blunt refusal 'Yes, I do not search'." },
      { ja: "どういたしまして、どうぞ。", isCorrect: false, trapType: "register-mismatch", explanation: "Said in response to thanks, out of place here." }
    ]
  },
  {
    id: "reply-n5-13",
    jlpt: 5,
    situationContext: "Library",
    speakerRole: "Librarian",
    promptJa: "この本は二週間借りられますよ。",
    options: [
      { ja: "分かりました。ありがとうございます。", isCorrect: true, explanation: "Polite acknowledgement of the borrowing rules." },
      { ja: "いいえ、貸してください。", isCorrect: false, trapType: "wrong-intent", explanation: "Asks them to lend it when they just explained the loan period." },
      { ja: "お邪魔します。", isCorrect: false, trapType: "register-mismatch", explanation: "Phrase for entering someone's home, not borrowing a book." }
    ]
  },
  {
    id: "reply-n5-14",
    jlpt: 5,
    situationContext: "Rainy street",
    speakerRole: "Friend",
    promptJa: "雨が降ってきましたね。傘、持っていますか？",
    options: [
      { ja: "はい、折りたたみ傘があります。", isCorrect: true, explanation: "Direct, helpful confirmation of having an umbrella." },
      { ja: "いいえ、雨が降りました。", isCorrect: false, trapType: "wrong-intent", explanation: "States that it rained rather than answering about having an umbrella." },
      { ja: "傘をさしませんでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense 'I didn't open an umbrella', doesn't answer if you have one." }
    ]
  },
  {
    id: "reply-n5-15",
    jlpt: 5,
    situationContext: "Luggage check",
    speakerRole: "Friend",
    promptJa: "荷物、重そうですね。手伝いましょうか？",
    options: [
      { ja: "助かります、ありがとうございます！", isCorrect: true, explanation: "Standard warm acceptance of an offer to help." },
      { ja: "はい、手伝います。", isCorrect: false, trapType: "wrong-intent", explanation: "Confuses the speaker roles, answering 'Yes, I will help'." },
      { ja: "いいえ、重くありませんでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense 'it was not heavy', but you are carrying it right now." }
    ]
  },
  {
    id: "reply-n5-16",
    jlpt: 5,
    situationContext: "Elevator",
    speakerRole: "Colleague",
    promptJa: "何階まで行かれますか？",
    options: [
      { ja: "５階をお願いします。", isCorrect: true, explanation: "Standard polite request for an elevator floor." },
      { ja: "５階に行きました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense 'I went to the 5th floor'." },
      { ja: "階段で行きます。", isCorrect: false, trapType: "wrong-intent", explanation: "Unnatural inside an elevator you just stepped into." }
    ]
  },
  {
    id: "reply-n5-17",
    jlpt: 5,
    situationContext: "Office reception",
    speakerRole: "Receptionist",
    promptJa: "田中様ですね。少々お待ちください。",
    options: [
      { ja: "はい、分かりました。", isCorrect: true, explanation: "Standard polite consent to wait a moment." },
      { ja: "いいえ、待ちません。", isCorrect: false, trapType: "wrong-intent", explanation: "Rude refusal to wait." },
      { ja: "どういたしまして。", isCorrect: false, trapType: "register-mismatch", explanation: "Phrased as 'You're welcome', inappropriate here." }
    ]
  },
  {
    id: "reply-n5-18",
    jlpt: 5,
    situationContext: "At a party",
    speakerRole: "Host",
    promptJa: "田中さん、もう一杯いかがですか？",
    options: [
      { ja: "いえ、もう十分いただきました。", isCorrect: true, explanation: "Polite refusal saying you've had enough." },
      { ja: "はい、もう一杯飲みました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense 'Yes, I drank another cup'." },
      { ja: "ごちそうさまを言います。", isCorrect: false, trapType: "wrong-intent", explanation: "Unnatural descriptive phrasing rather than responding." }
    ]
  },
  {
    id: "reply-n5-19",
    jlpt: 5,
    situationContext: "Classroom",
    speakerRole: "Friend",
    promptJa: "昨日のテスト、難しかったね。",
    options: [
      { ja: "うん、特に漢字が難しかったよ。", isCorrect: true, explanation: "Agrees naturally and specifies what was difficult." },
      { ja: "いいえ、難しくなります。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Future tense 'it will become difficult', but the test was yesterday." },
      { ja: "テストをしませんでした。", isCorrect: false, trapType: "wrong-intent", explanation: "Claims you didn't take it when the friend assumes you did." }
    ]
  },
  {
    id: "reply-n5-20",
    jlpt: 5,
    situationContext: "Gift giving",
    speakerRole: "Friend",
    promptJa: "これ、旅行のお土産です。どうぞ。",
    options: [
      { ja: "わあ、嬉しい！ありがとうございます。", isCorrect: true, explanation: "Enthusiastic and polite acceptance of a souvenir." },
      { ja: "はい、お土産をあげます。", isCorrect: false, trapType: "wrong-intent", explanation: "Confuses giver and receiver: 'I will give a souvenir'." },
      { ja: "いいえ、要りませんでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense refusal, extremely blunt and awkward." }
    ]
  },
  {
    id: "reply-n5-21",
    jlpt: 5,
    situationContext: "Dining out",
    speakerRole: "Friend",
    promptJa: "今夜、一緒にラーメンを食べに行かない？",
    options: [
      { ja: "いいね、ぜひ行こう！", isCorrect: true, explanation: "Natural enthusiastic acceptance of a casual invitation." },
      { ja: "はい、ラーメンを食べました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense 'I ate ramen', doesn't answer about tonight." },
      { ja: "いいえ、食べに行きませんよ。", isCorrect: false, trapType: "register-mismatch", explanation: "Unnaturally sharp and aggressive refusal for a friendly invite." }
    ]
  },
  {
    id: "reply-n5-22",
    jlpt: 5,
    situationContext: "At a counter",
    speakerRole: "Clerk",
    promptJa: "お支払いは現金ですか、カードですか？",
    options: [
      { ja: "カードでお願いします。", isCorrect: true, explanation: "Direct selection of payment method." },
      { ja: "はい、支払いました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense 'I paid', but you are at the register now." },
      { ja: "いいえ、お金がありません。", isCorrect: false, trapType: "wrong-intent", explanation: "Claims to have zero money, inappropriate at checkout." }
    ]
  },
  {
    id: "reply-n5-23",
    jlpt: 5,
    situationContext: "Meeting someone",
    speakerRole: "New acquaintance",
    promptJa: "はじめまして、山田です。よろしくお願いします。",
    options: [
      { ja: "佐藤です。こちらこそよろしくお願いします。", isCorrect: true, explanation: "Standard reciprocated first-meeting introduction." },
      { ja: "お邪魔します。", isCorrect: false, trapType: "register-mismatch", explanation: "Phrase for visiting someone's house." },
      { ja: "どういたしまして。", isCorrect: false, trapType: "wrong-intent", explanation: "Means 'You are welcome', inappropriate when introduced." }
    ]
  },
  {
    id: "reply-n5-24",
    jlpt: 5,
    situationContext: "On the phone",
    speakerRole: "Caller",
    promptJa: "もしもし、田中先生はいらっしゃいますか？",
    options: [
      { ja: "はい、少々お待ちください。", isCorrect: true, explanation: "Polite acknowledgement and holding for the teacher." },
      { ja: "いいえ、いらっしゃいませんでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense 'they were not here', instead of current absence." },
      { ja: "はい、田中先生が来ました。", isCorrect: false, trapType: "register-mismatch", explanation: "Lacks appropriate phone etiquette." }
    ]
  },
  {
    id: "reply-n5-25",
    jlpt: 5,
    situationContext: "In the morning",
    speakerRole: "Neighbor",
    promptJa: "おはようございます！今日もいい天気ですね。",
    options: [
      { ja: "おはようございます。暖かくて気持ちいいですね。", isCorrect: true, explanation: "Returns the morning greeting and agrees about the weather." },
      { ja: "おやすみなさい。", isCorrect: false, trapType: "wrong-intent", explanation: "Said before sleeping at night, not in the morning." },
      { ja: "さようなら、また明日。", isCorrect: false, trapType: "register-mismatch", explanation: "Parting farewell, awkward as an immediate reply to a greeting." }
    ]
  },
  {
    id: "reply-n5-26",
    jlpt: 5,
    situationContext: "Hospital lobby",
    speakerRole: "Doctor",
    promptJa: "お薬は毎食後、忘れずに飲んでくださいね。",
    options: [
      { ja: "はい、分かりました。気をつけます。", isCorrect: true, explanation: "Polite consent and reassurance to follow medical instructions." },
      { ja: "いいえ、飲みませんでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense 'I didn't drink', misses the future instruction." },
      { ja: "お大事にどうぞ。", isCorrect: false, trapType: "wrong-intent", explanation: "Said to the patient, not by the patient to the doctor." }
    ]
  },
  {
    id: "reply-n5-27",
    jlpt: 5,
    situationContext: "Airport arrival",
    speakerRole: "Friend",
    promptJa: "飛行機、疲れたでしょう？",
    options: [
      { ja: "ええ、少し疲れましたが、大丈夫です。", isCorrect: true, explanation: "Natural polite reply validating the concern." },
      { ja: "はい、疲れましょう。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Volitional 'Let us be tired', completely nonsensical." },
      { ja: "いいえ、飛行機に乗りました。", isCorrect: false, trapType: "wrong-intent", explanation: "Simply repeats taking the plane rather than fatigue state." }
    ]
  },
  {
    id: "reply-n5-28",
    jlpt: 5,
    situationContext: "Bus stop",
    speakerRole: "Elderly person",
    promptJa: "すみません、このバスは市役所へ行きますか？",
    options: [
      { ja: "はい、行きますよ。次が市役所です。", isCorrect: true, explanation: "Helpful, clear confirmation of the bus route." },
      { ja: "いいえ、行きました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense 'it went', ambiguous and unhelpful." },
      { ja: "どういたしまして。", isCorrect: false, trapType: "register-mismatch", explanation: "Said in response to thank-you, not a question." }
    ]
  },
  {
    id: "reply-n5-29",
    jlpt: 5,
    situationContext: "Classroom",
    speakerRole: "Teacher",
    promptJa: "質問がある人は手を挙げてください。",
    options: [
      { ja: "はい、先生、この言葉の意味を教えてください。", isCorrect: true, explanation: "Raises hand and asks a specific, polite question." },
      { ja: "いいえ、質問がありませんでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense 'there was no question', unnatural phrasing." },
      { ja: "手を挙げました。", isCorrect: false, trapType: "wrong-intent", explanation: "Narration of your action rather than asking the question." }
    ]
  },
  {
    id: "reply-n5-30",
    jlpt: 5,
    situationContext: "At a friend's house",
    speakerRole: "Friend",
    promptJa: "外は寒いから、中に入って温まって。",
    options: [
      { ja: "ありがとう、お邪魔します。", isCorrect: true, explanation: "Standard gratitude and set phrase for entering a home." },
      { ja: "はい、寒かったです。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense 'it was cold', ignores the invitation inside." },
      { ja: "いいえ、温まりませんでした。", isCorrect: false, trapType: "wrong-intent", explanation: "Contradictory and blunt refusal." }
    ]
  },
  {
    id: "reply-n5-31",
    jlpt: 5,
    situationContext: "Shopping",
    speakerRole: "Clerk",
    promptJa: "レシートはご利用になりますか？",
    options: [
      { ja: "はい、お願いします。", isCorrect: true, explanation: "Standard polite acceptance of a receipt." },
      { ja: "いいえ、レシートでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Nonsensical 'It was a receipt'." },
      { ja: "どういたしまして。", isCorrect: false, trapType: "register-mismatch", explanation: "You are welcome phrase, out of place." }
    ]
  },
  {
    id: "reply-n5-32",
    jlpt: 5,
    situationContext: "Leaving work",
    speakerRole: "Boss",
    promptJa: "山田さん、今日の会議の資料、まだかな？",
    options: [
      { ja: "すみません、すぐにお持ちします！", isCorrect: true, explanation: "Prompt, responsible response to prepare materials immediately." },
      { ja: "はい、資料でした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense 'it was materials', makes no sense." },
      { ja: "いいえ、会議はありません。", isCorrect: false, trapType: "wrong-intent", explanation: "Contradicts the boss about the existence of the meeting." }
    ]
  },
  {
    id: "reply-n5-33",
    jlpt: 5,
    situationContext: "Walking outside",
    speakerRole: "Friend",
    promptJa: "ちょっと歩き疲れたね。あそこで休もうか。",
    options: [
      { ja: "賛成！冷たいお茶でも飲もう。", isCorrect: true, explanation: "Enthusiastic agreement with a suggested rest break." },
      { ja: "いいえ、休みましたよ。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense 'we rested', contradicts the current tiredness." },
      { ja: "ごちそうさまでした。", isCorrect: false, trapType: "register-mismatch", explanation: "Post-meal phrase, completely unrelated." }
    ]
  },
  {
    id: "reply-n5-34",
    jlpt: 5,
    situationContext: "At a restaurant",
    speakerRole: "Waiter",
    promptJa: "ご注文はお決まりですか？",
    options: [
      { ja: "すみません、もう少し時間をください。", isCorrect: true, explanation: "Polite request for a few more minutes to decide." },
      { ja: "はい、決めましたでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Ungrammatical double past tense." },
      { ja: "お会計をお願いします。", isCorrect: false, trapType: "wrong-intent", explanation: "Asks for the bill before ordering." }
    ]
  },
  {
    id: "reply-n5-35",
    jlpt: 5,
    situationContext: "Leaving a shop",
    speakerRole: "Shopkeeper",
    promptJa: "ありがとうございました！またお越しください。",
    options: [
      { ja: "どうも、ありがとうございました。", isCorrect: true, explanation: "Natural polite parting gratitude from a customer." },
      { ja: "いってらっしゃい。", isCorrect: false, trapType: "wrong-intent", explanation: "Shopkeeper says this to people leaving home, not customer to shopkeeper." },
      { ja: "いただきます。", isCorrect: false, trapType: "register-mismatch", explanation: "Meal start greeting, irrelevant here." }
    ]
  },

  // --- N4 (35 items) ---
  {
    id: "reply-n4-01",
    jlpt: 4,
    situationContext: "At the office",
    speakerRole: "Supervisor",
    promptJa: "この書類のコピー、１０部お願いできる？",
    options: [
      { ja: "かしこまりました。すぐにコピーしてまいります。", isCorrect: true, explanation: "Polite, prompt acceptance of a task using business register." },
      { ja: "ええ、お願いされました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Passive past tense 'I was requested', lacks willingness to act." },
      { ja: "いいえ、コピーを頼んでください。", isCorrect: false, trapType: "wrong-intent", explanation: "Tells the supervisor to ask someone else." }
    ]
  },
  {
    id: "reply-n4-02",
    jlpt: 4,
    situationContext: "In the kitchen",
    speakerRole: "Roommate",
    promptJa: "ケーキを冷蔵庫に入れておいたよ。食べていいからね。",
    options: [
      { ja: "わあ、ありがとう！後でいただくね。", isCorrect: true, explanation: "Warm gratitude using humble verb itadaku." },
      { ja: "はい、入れてあげました。", isCorrect: false, trapType: "wrong-intent", explanation: "Claims you did them a favor of putting it in." },
      { ja: "食べさせてあげます。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Causative-giving 'I will let you eat it', condescending." }
    ]
  },
  {
    id: "reply-n4-03",
    jlpt: 4,
    situationContext: "Office hallway",
    speakerRole: "Manager",
    promptJa: "明日の午後、ちょっと時間取れるかな？",
    options: [
      { ja: "はい、２時以降でしたらいつでも大丈夫です。", isCorrect: true, explanation: "Direct, helpful confirmation of your availability." },
      { ja: "いいえ、時間を取ってあげません。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Insulting 'I will not give you my time' using ageru." },
      { ja: "午後になりました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "States that it became afternoon, ignoring the scheduling request." }
    ]
  },
  {
    id: "reply-n4-04",
    jlpt: 4,
    situationContext: "Meeting room",
    speakerRole: "Colleague",
    promptJa: "エアコンの温度、少し下げてもかまいませんか？",
    options: [
      { ja: "ええ、どうぞ。ちょっと暑いと思っていました。", isCorrect: true, explanation: "Agrees with the temperature adjustment politely." },
      { ja: "はい、下げてくださいませんでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past negative honorific, completely contradicts the context." },
      { ja: "いいえ、下げましょう。", isCorrect: false, trapType: "wrong-intent", explanation: "Says 'No, let us lower it', logically inconsistent." }
    ]
  },
  {
    id: "reply-n4-05",
    jlpt: 4,
    situationContext: "Desk area",
    speakerRole: "Coworker",
    promptJa: "ペンを忘れてしまって…一本貸してもらえませんか？",
    options: [
      { ja: "いいですよ、この青いペンを使ってください。", isCorrect: true, explanation: "Willingly lends a pen." },
      { ja: "はい、借りてもらいました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Confuses giving/receiving direction with past tense." },
      { ja: "どういたしまして、貸しましょう。", isCorrect: false, trapType: "register-mismatch", explanation: "Says 'You are welcome' before the favor has occurred." }
    ]
  },
  {
    id: "reply-n4-06",
    jlpt: 4,
    situationContext: "After a presentation",
    speakerRole: "Mentor",
    promptJa: "今日の発表、とても分かりやすかったよ。",
    options: [
      { ja: "本当ですか？そう言っていただけて安心しました。", isCorrect: true, explanation: "Humble gratitude and relief in response to praise." },
      { ja: "はい、分かりやすかったです。", isCorrect: false, trapType: "register-mismatch", explanation: "Overly boastful and self-congratulatory in Japanese." },
      { ja: "いいえ、発表しませんでした。", isCorrect: false, trapType: "wrong-intent", explanation: "Claims you didn't present when you just did." }
    ]
  },
  {
    id: "reply-n4-07",
    jlpt: 4,
    situationContext: "Station ticket gate",
    speakerRole: "Friend",
    promptJa: "切符、どこに入れたか分からなくなっちゃった。",
    options: [
      { ja: "落ち着いてポケットやカバンを探してみて。", isCorrect: true, explanation: "Sympathetic and constructive advice to calm down and look." },
      { ja: "はい、分かりましたよ。", isCorrect: false, trapType: "wrong-intent", explanation: "Answers as if you were the one who lost the ticket." },
      { ja: "切符を買ってくれました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Says someone bought you a ticket, irrelevant." }
    ]
  },
  {
    id: "reply-n4-08",
    jlpt: 4,
    situationContext: "Library desk",
    speakerRole: "Student",
    promptJa: "すみません、このパソコンの使い方を教えてもらえませんか？",
    options: [
      { ja: "ええ、いいですよ。まずここにログインしてください。", isCorrect: true, explanation: "Agrees to help and provides the first instruction." },
      { ja: "はい、教えてあげられました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Awkward potential past tense with ageru." },
      { ja: "いいえ、使わせてください。", isCorrect: false, trapType: "wrong-intent", explanation: "Asks them to let you use it instead." }
    ]
  },
  {
    id: "reply-n4-09",
    jlpt: 4,
    situationContext: "Inviting to cinema",
    speakerRole: "Friend",
    promptJa: "今週の土曜日、映画のチケットが２枚あるんだけど、行かない？",
    options: [
      { ja: "ぜひ行きたい！誘ってくれてありがとう。", isCorrect: true, explanation: "Warm acceptance and thanks for the invitation." },
      { ja: "はい、土曜日でした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense 'it was Saturday', misses the invite." },
      { ja: "チケットをあげましたよ。", isCorrect: false, trapType: "wrong-intent", explanation: "Claims you gave them the tickets." }
    ]
  },
  {
    id: "reply-n4-10",
    jlpt: 4,
    situationContext: "Office pantry",
    speakerRole: "Colleague",
    promptJa: "コーヒーを淹れ直したところですが、一杯いかがですか？",
    options: [
      { ja: "ちょうど飲みたかったんです。いただきます！", isCorrect: true, explanation: "Expresses perfect timing and humble acceptance." },
      { ja: "はい、淹れ直しました。", isCorrect: false, trapType: "wrong-intent", explanation: "Claims you made the coffee instead." },
      { ja: "いいえ、コーヒーを淹れましょう。", isCorrect: false, trapType: "register-mismatch", explanation: "Offers to brew coffee when fresh coffee is already available." }
    ]
  },
  {
    id: "reply-n4-11",
    jlpt: 4,
    situationContext: "Asking direction",
    speakerRole: "Tourist",
    promptJa: "すみません、博物館へはどう行けばいいでしょうか？",
    options: [
      { ja: "あそこの角を右に曲がると、すぐ見えますよ。", isCorrect: true, explanation: "Clear directions given with conditional/locational markers." },
      { ja: "はい、博物館へ行きました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense 'I went', doesn't give directions." },
      { ja: "行かないほうがいいです。", isCorrect: false, trapType: "wrong-intent", explanation: "Abrupt discouragement without context." }
    ]
  },
  {
    id: "reply-n4-12",
    jlpt: 4,
    situationContext: "Borrowing bicycle",
    speakerRole: "Neighbor",
    promptJa: "少しの間、自転車を使わせていただいてもよろしいですか？",
    options: [
      { ja: "ええ、構いませんよ。鍵は玄関にあります。", isCorrect: true, explanation: "Grants permission courteously." },
      { ja: "はい、使わせてあげます。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Unnatural and arrogant phrasing towards a neighbor." },
      { ja: "いいえ、乗ってきました。", isCorrect: false, trapType: "wrong-intent", explanation: "Irrelevant statement that you rode it." }
    ]
  },
  {
    id: "reply-n4-13",
    jlpt: 4,
    situationContext: "Expressing apology",
    speakerRole: "Friend",
    promptJa: "約束の時間に遅れちゃって本当にごめんなさい！",
    options: [
      { ja: "大丈夫だよ、私もさっき着いたばかりだから。", isCorrect: true, explanation: "Comforting reassuring reply to a friend's apology." },
      { ja: "はい、遅れましたね。", isCorrect: false, trapType: "register-mismatch", explanation: "Cold and blunt confirmation rather than smoothing things over." },
      { ja: "どういたしまして、急いで。", isCorrect: false, trapType: "wrong-intent", explanation: "Says you are welcome followed by an order to hurry." }
    ]
  },
  {
    id: "reply-n4-14",
    jlpt: 4,
    situationContext: "Post-workout",
    speakerRole: "Gym partner",
    promptJa: "今日のトレーニング、かなりきつかったですね。",
    options: [
      { ja: "そうですね、でもいい汗をかきましたね。", isCorrect: true, explanation: "Empathetic agreement with positive spin." },
      { ja: "はい、きつくありませんでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Direct contradiction using awkward past negative." },
      { ja: "お疲れ様を言いました。", isCorrect: false, trapType: "wrong-intent", explanation: "Descriptive narration instead of engaging." }
    ]
  },
  {
    id: "reply-n4-15",
    jlpt: 4,
    situationContext: "Luggage carried",
    speakerRole: "Senior coworker",
    promptJa: "その重い荷物、僕が車まで運んでおくよ。",
    options: [
      { ja: "すみません、助かります。よろしくお願いします。", isCorrect: true, explanation: "Polite gratitude and acceptance of a senior's help." },
      { ja: "はい、運んであげてください。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Using 'te agete kudasai' to a senior is extremely disrespectful." },
      { ja: "いいえ、運び終わりました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Claims the task is done when you are still holding the box." }
    ]
  },
  {
    id: "reply-n4-16",
    jlpt: 4,
    situationContext: "At a doctor's clinic",
    speakerRole: "Nurse",
    promptJa: "お熱を測りますので、体温計を脇に挟んでください。",
    options: [
      { ja: "はい、分かりました。", isCorrect: true, explanation: "Simple, compliant confirmation to a medical request." },
      { ja: "いいえ、測らせてください。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Asks permission to measure the nurse's temperature." },
      { ja: "熱がありましたでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Ungrammatical past construction." }
    ]
  },
  {
    id: "reply-n4-17",
    jlpt: 4,
    situationContext: "Classroom end",
    speakerRole: "Teacher",
    promptJa: "プリントが足りない人は手を挙げてください。",
    options: [
      { ja: "先生、こちらの列に３枚足りません。", isCorrect: true, explanation: "Clear notification of the shortage." },
      { ja: "はい、足りていました。", isCorrect: false, trapType: "wrong-intent", explanation: "Says there was enough when the prompt asked who is short." },
      { ja: "プリントをあげました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Claims you gave out prints." }
    ]
  },
  {
    id: "reply-n4-18",
    jlpt: 4,
    situationContext: "Store return",
    speakerRole: "Customer",
    promptJa: "サイズが合わなかったので、交換していただけますか？",
    options: [
      { ja: "かしこまりました。レシートをお持ちでしょうか？", isCorrect: true, explanation: "Professional retail clerk response requesting the receipt." },
      { ja: "いいえ、交換してあげません。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Rude refusal with 'te ageru'." },
      { ja: "はい、サイズが合いました。", isCorrect: false, trapType: "wrong-intent", explanation: "Directly contradicts the customer's issue." }
    ]
  },
  {
    id: "reply-n4-19",
    jlpt: 4,
    situationContext: "Rain forecast",
    speakerRole: "Mother",
    promptJa: "夕方から雨が降るそうだから、傘を持っていきなさい。",
    options: [
      { ja: "うん、分かった。持っていくね。", isCorrect: true, explanation: "Casual obedient response to family advice." },
      { ja: "はい、雨が降らせました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Causative 'I made it rain', nonsensical." },
      { ja: "いいえ、傘でしたよ。", isCorrect: false, trapType: "wrong-intent", explanation: "Irrelevant copula statement." }
    ]
  },
  {
    id: "reply-n4-20",
    jlpt: 4,
    situationContext: "Shared project",
    speakerRole: "Team member",
    promptJa: "今日の予定、何時からミーティングだったっけ？",
    options: [
      { ja: "確か、午後３時から大会議室だったと思うよ。", isCorrect: true, explanation: "Helpful recall of the meeting time and room." },
      { ja: "はい、ミーティングでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense doesn't answer the time." },
      { ja: "いいえ、何時ではありません。", isCorrect: false, trapType: "wrong-intent", explanation: "Nonsensical answer to a 'nanji' question." }
    ]
  },
  {
    id: "reply-n4-21",
    jlpt: 4,
    situationContext: "Train ticket office",
    speakerRole: "Clerk",
    promptJa: "指定席と自由席、どちらになさいますか？",
    options: [
      { ja: "指定席を一枚お願いします。", isCorrect: true, explanation: "Direct selection of the reserved seat option." },
      { ja: "はい、席になりました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Nonsensical 'it became a seat'." },
      { ja: "どちらもいません。", isCorrect: false, trapType: "wrong-intent", explanation: "Uses 'imasen' (animate) instead of selecting ticket type." }
    ]
  },
  {
    id: "reply-n4-22",
    jlpt: 4,
    situationContext: "Office request",
    speakerRole: "Boss",
    promptJa: "この報告書、目を通しておいてくれる？",
    options: [
      { ja: "承知いたしました。本日中に確認いたします。", isCorrect: true, explanation: "Proper business acknowledgement with kenjougo." },
      { ja: "はい、目を通してあげます。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Disrespectful 'te ageru' used towards one's superior." },
      { ja: "いいえ、報告書でした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Irrelevant statement." }
    ]
  },
  {
    id: "reply-n4-23",
    jlpt: 4,
    situationContext: "Friend's cooking",
    speakerRole: "Host friend",
    promptJa: "口に合うかどうか分からないけど、食べてみて。",
    options: [
      { ja: "おいしそう！遠慮なくいただきます。", isCorrect: true, explanation: "Standard polite appreciation before trying someone's food." },
      { ja: "はい、口に合いませんでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Insulting past tense statement before even tasting it." },
      { ja: "いいえ、食べさせません。", isCorrect: false, trapType: "wrong-intent", explanation: "Nonsensical refusal." }
    ]
  },
  {
    id: "reply-n4-24",
    jlpt: 4,
    situationContext: "After an exam",
    speakerRole: "Classmate",
    promptJa: "もう少し勉強しておけばよかったなあ。",
    options: [
      { ja: "同感だよ。次のテストに向けて頑張ろう。", isCorrect: true, explanation: "Sympathizes with the regret and encourages for the future." },
      { ja: "はい、よく勉強しましたね。", isCorrect: false, trapType: "wrong-intent", explanation: "Contradicts their stated regret of not studying enough." },
      { ja: "勉強させられました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Unsolicited passive complaint." }
    ]
  },
  {
    id: "reply-n4-25",
    jlpt: 4,
    situationContext: "Meeting someone at cafe",
    speakerRole: "Friend",
    promptJa: "待たせちゃってごめんね！道が混んでいて。",
    options: [
      { ja: "ううん、気にしないで。席取っておいたよ。", isCorrect: true, explanation: "Warm reassurance and thoughtful preparation." },
      { ja: "はい、待たせてあげました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Nonsensical arrogant phrasing 'I allowed you to make me wait'." },
      { ja: "道が混んでいましたでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Ungrammatical double past." }
    ]
  },
  {
    id: "reply-n4-26",
    jlpt: 4,
    situationContext: "Phone message",
    speakerRole: "Colleague",
    promptJa: "課長にお電話があった旨、伝えておきましょうか？",
    options: [
      { ja: "ありがとうございます、お願いできますか。", isCorrect: true, explanation: "Polite gratitude accepting the colleague's offer to pass a message." },
      { ja: "はい、伝えてあげましょう。", isCorrect: false, trapType: "wrong-intent", explanation: "Confuses who is delivering the message." },
      { ja: "いいえ、電話が鳴りました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Irrelevant statement." }
    ]
  },
  {
    id: "reply-n4-27",
    jlpt: 4,
    situationContext: "Travel planning",
    speakerRole: "Friend",
    promptJa: "来月の温泉旅行、宿の予約はどうする？",
    options: [
      { ja: "僕がネットで予約しておくよ。", isCorrect: true, explanation: "Proactively volunteers to handle the booking." },
      { ja: "はい、温泉に行きました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense doesn't resolve next month's reservation." },
      { ja: "宿を泊まらせてください。", isCorrect: false, trapType: "wrong-intent", explanation: "Grammatically distorted causative phrasing." }
    ]
  },
  {
    id: "reply-n4-28",
    jlpt: 4,
    situationContext: "Borrowed book return",
    speakerRole: "Friend",
    promptJa: "先週借りた本、すごく面白かったよ！ありがとう。",
    options: [
      { ja: "気に入ってくれて嬉しいよ。いつでもまた貸すね。", isCorrect: true, explanation: "Pleasure in response to someone enjoying a book you lent." },
      { ja: "はい、借りましたよ。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Confuses lender and borrower." },
      { ja: "本を読ませてあげました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Arrogant causative-giving construction." }
    ]
  },
  {
    id: "reply-n4-29",
    jlpt: 4,
    situationContext: "Grocery store checkout",
    speakerRole: "Cashier",
    promptJa: "ポイントカードはお持ちですか？",
    options: [
      { ja: "あ、持っていません。大丈夫です。", isCorrect: true, explanation: "Standard polite answer when you don't have a reward card." },
      { ja: "はい、持ちました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense 'I held it', instead of state 'motte imasu'." },
      { ja: "どういたしまして。", isCorrect: false, trapType: "register-mismatch", explanation: "Irrelevant reply to a question." }
    ]
  },
  {
    id: "reply-n4-30",
    jlpt: 4,
    situationContext: "Apartment maintenance",
    speakerRole: "Landlord",
    promptJa: "明日の朝、水道の点検に伺ってもよろしいですか？",
    options: [
      { ja: "はい、午前中なら在宅しておりますので大丈夫です。", isCorrect: true, explanation: "Confirms availability politely with kenjougo 'zaitaku shite orimasu'." },
      { ja: "いいえ、点検にいらっしゃってください。", isCorrect: false, trapType: "wrong-intent", explanation: "Contradictory negative with honorific." },
      { ja: "水道がありました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Irrelevant statement." }
    ]
  },
  {
    id: "reply-n4-31",
    jlpt: 4,
    situationContext: "Lost item",
    speakerRole: "Station master",
    promptJa: "こちらの黒い傘でお間違いありませんか？",
    options: [
      { ja: "あ、それです！見つかってよかったです。", isCorrect: true, explanation: "Relieved confirmation that it is indeed your umbrella." },
      { ja: "はい、間違えました。", isCorrect: false, trapType: "wrong-intent", explanation: "Means 'Yes, I made a mistake', admitting fault instead of confirming." },
      { ja: "いいえ、傘でした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Unnatural past copula." }
    ]
  },
  {
    id: "reply-n4-32",
    jlpt: 4,
    situationContext: "Lunch invite",
    speakerRole: "Coworker",
    promptJa: "お昼、新しくできたパスタ屋さんに行ってみない？",
    options: [
      { ja: "いいね、気になっていたんだ。行こう！", isCorrect: true, explanation: "Enthusiastic agreement with interest in the new spot." },
      { ja: "はい、パスタを食べさせました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Causative 'I made someone eat pasta'." },
      { ja: "パスタができましたでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Ungrammatical double past." }
    ]
  },
  {
    id: "reply-n4-33",
    jlpt: 4,
    situationContext: "Health inquiry",
    speakerRole: "Coworker",
    promptJa: "風邪の具合、少しは良くなりましたか？",
    options: [
      { ja: "ええ、薬のおかげですっかり良くなりました。", isCorrect: true, explanation: "Appreciative confirmation of recovery." },
      { ja: "はい、良くなりませんでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Contradicts 'yes' with 'it didn't get better'." },
      { ja: "お大事にどうぞ。", isCorrect: false, trapType: "wrong-intent", explanation: "Phrased as a wish to the other person." }
    ]
  },
  {
    id: "reply-n4-34",
    jlpt: 4,
    situationContext: "Luggage storage",
    speakerRole: "Hotel clerk",
    promptJa: "チェックイン前にお荷物をお預かりしましょうか？",
    options: [
      { ja: "助かります、スーツケースをお願いします。", isCorrect: true, explanation: "Grateful acceptance of hotel luggage holding." },
      { ja: "はい、預かってあげてください。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Inappropriate 'te ageru' used towards staff." },
      { ja: "いいえ、預かりました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Claims the luggage was already deposited." }
    ]
  },
  {
    id: "reply-n4-35",
    jlpt: 4,
    situationContext: "Farewell after meeting",
    speakerRole: "Client",
    promptJa: "本日はお忙しい中、ありがとうございました。",
    options: [
      { ja: "こちらこそ、有意義なお時間をありがとうございました。", isCorrect: true, explanation: "Proper polite business reciprocation." },
      { ja: "いいえ、忙しくありませんでしたよ。", isCorrect: false, trapType: "register-mismatch", explanation: "Too casual and discounts the client's polite formula." },
      { ja: "どういたしまして、また来てください。", isCorrect: false, trapType: "wrong-intent", explanation: "Overly informal and patronizing to a client." }
    ]
  },

  // --- N3 (35 items) ---
  {
    id: "reply-n3-01",
    jlpt: 3,
    situationContext: "At work",
    speakerRole: "Boss",
    promptJa: "山田君、企画書の締め切り、金曜まで延ばせそう？",
    options: [
      { ja: "なんとか金曜の夕方までには仕上げます。", isCorrect: true, explanation: "Professional commitment to meet the revised Friday deadline." },
      { ja: "はい、金曜日に延ばされました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Passive past tense states it as a past fact rather than an active commitment." },
      { ja: "いいえ、延ばしてあげません。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Rude and arrogant 'te ageru' to a supervisor." }
    ]
  },
  {
    id: "reply-n3-02",
    jlpt: 3,
    situationContext: "Office reception",
    speakerRole: "Client",
    promptJa: "恐れ入りますが、鈴木部長はいらっしゃいますでしょうか？",
    options: [
      { ja: "あいにく鈴木は席を外しております。", isCorrect: true, explanation: "Correct humble kenjougo omitting title for one's own manager." },
      { ja: "鈴木部長はいらっしゃいませんでした。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Using honorifics like 'buchou' and 'irassharu' for your in-group manager to an outside client is a classic JLPT trap." },
      { ja: "はい、鈴木がまいりました。", isCorrect: false, trapType: "wrong-intent", explanation: "States that Suzuki arrived, rather than whether he is currently present." }
    ]
  },
  {
    id: "reply-n3-03",
    jlpt: 3,
    situationContext: "Colleague conversation",
    speakerRole: "Colleague",
    promptJa: "悪いけど、この資料コピーしといてくれない？",
    options: [
      { ja: "了解、何部刷っておけばいい？", isCorrect: true, explanation: "Natural casual agreement asking for page count." },
      { ja: "うん、コピーしてあげられたよ。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Potential past tense boasting before doing the action." },
      { ja: "いいえ、刷らせてください。", isCorrect: false, trapType: "wrong-intent", explanation: "Asks permission to print instead." }
    ]
  },
  {
    id: "reply-n3-04",
    jlpt: 3,
    situationContext: "Party invitation",
    speakerRole: "Colleague",
    promptJa: "今週の飲み会、山田さんも来られるといいんだけど。",
    options: [
      { ja: "今のところ参加できる予定ですよ！", isCorrect: true, explanation: "Confirms planned attendance cheerfully." },
      { ja: "はい、来させてあげます。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Arrogant causative-giving 'I will allow myself to come'." },
      { ja: "いいえ、飲み会に来ました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense doesn't answer about this week's event." }
    ]
  },
  {
    id: "reply-n3-05",
    jlpt: 3,
    situationContext: "Borrowing reference document",
    speakerRole: "Colleague",
    promptJa: "この専門書、今週中にお返しすれば大丈夫ですか？",
    options: [
      { ja: "ええ、急ぎませんので来週でも構いませんよ。", isCorrect: true, explanation: "Generous reassurance about the return timeline." },
      { ja: "はい、返してあげました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Confuses who lent and who borrowed." },
      { ja: "いいえ、返させます。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Causative 'I will make you return it', unnaturally hostile." }
    ]
  },
  {
    id: "reply-n3-06",
    jlpt: 3,
    situationContext: "Project review",
    speakerRole: "Senior",
    promptJa: "この部分、もう少し詳しく説明したほうが伝わりやすいんじゃない？",
    options: [
      { ja: "なるほど、具体例を追加して修正してみます。", isCorrect: true, explanation: "Receptive agreement and action plan based on feedback." },
      { ja: "はい、説明したほうが伝わりませんでした。", isCorrect: false, trapType: "wrong-intent", explanation: "Illogical contradiction." },
      { ja: "詳しく説明させられました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Complaining passive 'I was forced to explain'." }
    ]
  },
  {
    id: "reply-n3-07",
    jlpt: 3,
    situationContext: "Computer trouble",
    speakerRole: "Coworker",
    promptJa: "パソコンがフリーズしちゃって、データ消えたかも…",
    options: [
      { ja: "自動保存されてるかもしれないから、一度再起動してみたら？", isCorrect: true, explanation: "Calm, practical advice proposing an autosave check." },
      { ja: "はい、消えてしまいましたね。", isCorrect: false, trapType: "register-mismatch", explanation: "Cold and unhelpful confirmation." },
      { ja: "データを消してあげました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Means you deleted their data as a favor!" }
    ]
  },
  {
    id: "reply-n3-08",
    jlpt: 3,
    situationContext: "Restaurant bill",
    speakerRole: "Senior colleague",
    promptJa: "今日は僕が誘ったんだから、ごちそうさせてよ。",
    options: [
      { ja: "えっ、本当ですか？ごちそうになります！", isCorrect: true, explanation: "Standard polite acceptance of a treat from a senior." },
      { ja: "はい、ごちそうしてあげてください。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Using 'te agete' to a senior offering a treat is rude." },
      { ja: "いいえ、ごちそうさまでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Said after eating, not when the bill is presented." }
    ]
  },
  {
    id: "reply-n3-09",
    jlpt: 3,
    situationContext: "Expressing apology for noise",
    speakerRole: "Apartment neighbor",
    promptJa: "昨晩は荷物の整理で物音が響いてしまい、失礼いたしました。",
    options: [
      { ja: "いえいえ、全然気になりませんでしたから大丈夫ですよ。", isCorrect: true, explanation: "Warm neighborly courtesy downplaying the disturbance." },
      { ja: "はい、響かせてあげました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Bizarre causative-giving statement." },
      { ja: "物音がしませんでしたでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Ungrammatical double past." }
    ]
  },
  {
    id: "reply-n3-10",
    jlpt: 3,
    situationContext: "Job interview prep",
    speakerRole: "Friend",
    promptJa: "明日の面接、緊張するだろうけど自信持ってね！",
    options: [
      { ja: "ありがとう、落ち着いて全力を尽くしてくるよ。", isCorrect: true, explanation: "Encouraged, confident response." },
      { ja: "はい、緊張させました。", isCorrect: false, trapType: "wrong-intent", explanation: "Causative 'I made them nervous'." },
      { ja: "いいえ、面接を受けませんでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense doesn't match tomorrow's interview." }
    ]
  },
  {
    id: "reply-n3-11",
    jlpt: 3,
    situationContext: "Telephone message",
    speakerRole: "Secretary",
    promptJa: "先ほど山田様より、折り返しお電話がほしいとのことでした。",
    options: [
      { ja: "分かりました。すぐにこちらからかけ直します。", isCorrect: true, explanation: "Standard professional callback promise." },
      { ja: "はい、折り返させてあげます。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Arrogant 'te ageru' used in business context." },
      { ja: "いいえ、電話がありました。", isCorrect: false, trapType: "wrong-intent", explanation: "Irrelevant statement." }
    ]
  },
  {
    id: "reply-n3-12",
    jlpt: 3,
    situationContext: "Colleague looking pale",
    speakerRole: "Colleague",
    promptJa: "顔色悪いよ、少し横になったらどう？",
    options: [
      { ja: "ありがとう、お言葉に甘えて少し休ませてもらうね。", isCorrect: true, explanation: "Humble idiom 'okotoba ni amaete' accepting kindness." },
      { ja: "はい、横にならせてあげます。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Arrogant phrasing." },
      { ja: "いいえ、顔色でした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Nonsensical response." }
    ]
  },
  {
    id: "reply-n3-13",
    jlpt: 3,
    situationContext: "Conference scheduling",
    speakerRole: "Client",
    promptJa: "もしよろしければ、打ち合わせの時間を３０分ほど早められませんか？",
    options: [
      { ja: "はい、その時間でしたら問題ございません。", isCorrect: true, explanation: "Accommodates the client's schedule change smoothly." },
      { ja: "いいえ、早めてあげられません。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Blunt refusal using 'te ageru'." },
      { ja: "打ち合わせが終わりました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense 'the meeting ended'." }
    ]
  },
  {
    id: "reply-n3-14",
    jlpt: 3,
    situationContext: "Borrowing umbrella",
    speakerRole: "Coworker",
    promptJa: "急に降ってきたね。僕の傘、入っていく？",
    options: [
      { ja: "助かる！駅まで一緒に入れてもらっていい？", isCorrect: true, explanation: "Gratefully shares the umbrella." },
      { ja: "はい、傘に入れてあげましょう。", isCorrect: false, trapType: "wrong-intent", explanation: "Confuses who owns the umbrella." },
      { ja: "いいえ、濡れませんでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense doesn't answer the offer." }
    ]
  },
  {
    id: "reply-n3-15",
    jlpt: 3,
    situationContext: "Coffee shop line",
    speakerRole: "Barista",
    promptJa: "店内でお召し上がりですか、お持ち帰りですか？",
    options: [
      { ja: "店内でお願いします。", isCorrect: true, explanation: "Standard choice for dine-in." },
      { ja: "はい、召し上がります。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Using honorific meshiaagaru for oneself is an official JLPT trap." },
      { ja: "お持ち帰られました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Awkward passive past." }
    ]
  },
  {
    id: "reply-n3-16",
    jlpt: 3,
    situationContext: "Seminar feedback",
    speakerRole: "Colleague",
    promptJa: "今日のセミナー、期待していたほどではなかったね。",
    options: [
      { ja: "確かに、知っている内容が多かったね。", isCorrect: true, explanation: "Agrees thoughtfully with specific reason." },
      { ja: "はい、期待していましたでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Ungrammatical double past." },
      { ja: "いいえ、セミナーがありませんでした。", isCorrect: false, trapType: "wrong-intent", explanation: "Contradicts reality." }
    ]
  },
  {
    id: "reply-n3-17",
    jlpt: 3,
    situationContext: "Submitting report",
    speakerRole: "Staff",
    promptJa: "部長、こちらの書類をご確認いただけますでしょうか？",
    options: [
      { ja: "分かった、後でじっくり見せてもらうよ。", isCorrect: true, explanation: "Manager's natural response agreeing to look it over." },
      { ja: "はい、確認してくださいました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Confuses honorific directions." },
      { ja: "いいえ、書類を見せませんでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense statement." }
    ]
  },
  {
    id: "reply-n3-18",
    jlpt: 3,
    situationContext: "Visiting someone's office",
    speakerRole: "Host manager",
    promptJa: "遠いところをわざわざお越しいただき、恐縮です。",
    options: [
      { ja: "とんでもございません。こちらこそお招きいただき感謝申し上げます。", isCorrect: true, explanation: "Elegant business humility brushing off trouble." },
      { ja: "はい、お越ししました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Applying sonkeigo 'o-koshi' to one's own arrival." },
      { ja: "どういたしまして、遠かったです。", isCorrect: false, trapType: "register-mismatch", explanation: "Bluntly complaining about the distance." }
    ]
  },
  {
    id: "reply-n3-19",
    jlpt: 3,
    situationContext: "Dinner preference",
    speakerRole: "Friend",
    promptJa: "何か食べられないものや苦手なものはある？",
    options: [
      { ja: "甲殻類のアレルギーがあるから、エビやカニはダメなんだ。", isCorrect: true, explanation: "Clear dietary restriction explanation." },
      { ja: "はい、苦手になりませんでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Awkward past negative." },
      { ja: "全部食べてあげます。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Arrogant tone." }
    ]
  },
  {
    id: "reply-n3-20",
    jlpt: 3,
    situationContext: "Gift refusal check",
    speakerRole: "Acquaintance",
    promptJa: "つまらないものですが、どうぞお納めください。",
    options: [
      { ja: "お気遣いいただき、恐れ入ります。ありがたく頂戴します。", isCorrect: true, explanation: "Formal appreciative receipt of a present." },
      { ja: "本当につまらないですね。", isCorrect: false, trapType: "register-mismatch", explanation: "Takes the humble set phrase literally and insults the giver." },
      { ja: "はい、納めさせてあげました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Disrespectful causative." }
    ]
  },
  {
    id: "reply-n3-21",
    jlpt: 3,
    situationContext: "Missed call",
    speakerRole: "Friend",
    promptJa: "さっき電話くれた？手が離せなくて出られなかったんだ。",
    options: [
      { ja: "うん、大した用事じゃないから後でLINEするね。", isCorrect: true, explanation: "Relaxed friendly reply reassuring no emergency." },
      { ja: "はい、出させてあげました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Arrogant construction." },
      { ja: "電話が鳴りませんでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Contradicts fact." }
    ]
  },
  {
    id: "reply-n3-22",
    jlpt: 3,
    situationContext: "Office request",
    speakerRole: "Colleague",
    promptJa: "企画のアイデア、何か思いついたら教えてね。",
    options: [
      { ja: "分かった。いい案が浮かんだらすぐに共有するよ。", isCorrect: true, explanation: "Cooperative promise to share ideas." },
      { ja: "はい、思いつかせました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Causative past error." },
      { ja: "教えてあげないよ。", isCorrect: false, trapType: "register-mismatch", explanation: "Hostile refusal." }
    ]
  },
  {
    id: "reply-n3-23",
    jlpt: 3,
    situationContext: "Schedule conflict",
    speakerRole: "Colleague",
    promptJa: "せっかくですが、その日はあいにく先約がございまして…",
    options: [
      { ja: "そうでしたか、ではまたの機会にぜひお願いします。", isCorrect: true, explanation: "Graceful response to an indirect polite refusal." },
      { ja: "先約を取り消してください。", isCorrect: false, trapType: "wrong-intent", explanation: "Rude demand to cancel prior commitments." },
      { ja: "はい、先約でした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Meaningless copula." }
    ]
  },
  {
    id: "reply-n3-24",
    jlpt: 3,
    situationContext: "Hotel checkout",
    speakerRole: "Guest",
    promptJa: "とても快適に過ごせました。お世話になりました。",
    options: [
      { ja: "ご満足いただけて光栄です。またのお越しをお待ちしております。", isCorrect: true, explanation: "Proper hotel hospitality reply." },
      { ja: "どういたしまして、世話をしました。", isCorrect: false, trapType: "register-mismatch", explanation: "Unprofessional and blunt." },
      { ja: "いいえ、快適ではありませんでした。", isCorrect: false, trapType: "wrong-intent", explanation: "Contradicts the guest's compliment." }
    ]
  },
  {
    id: "reply-n3-25",
    jlpt: 3,
    situationContext: "Train ticket gate delay",
    speakerRole: "Passenger",
    promptJa: "ICカードをタッチしたのにゲートが開きません。",
    options: [
      { ja: "チャージの残高が不足しているかもしれません。精算機でご確認ください。", isCorrect: true, explanation: "Clear station staff explanation of balance shortage." },
      { ja: "はい、開きませんでしたですね。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Ungrammatical phrasing." },
      { ja: "タッチさせてあげました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Inappropriate." }
    ]
  },
  {
    id: "reply-n3-26",
    jlpt: 3,
    situationContext: "Offering ride",
    speakerRole: "Coworker",
    promptJa: "雨がひどいから、駅まで車で送っていこうか？",
    options: [
      { ja: "本当？すごく助かる、お言葉に甘えちゃうね。", isCorrect: true, explanation: "Warm casual gratitude accepting a ride." },
      { ja: "はい、送ってあげてください。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Demanding 'te ageru'." },
      { ja: "車を運転させました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Causative past error." }
    ]
  },
  {
    id: "reply-n3-27",
    jlpt: 3,
    situationContext: "Coffee refill request",
    speakerRole: "Customer",
    promptJa: "コーヒーのおかわり、無料でしたっけ？",
    options: [
      { ja: "はい、２杯目までは無料でご利用いただけます。", isCorrect: true, explanation: "Clear store policy explanation." },
      { ja: "いいえ、無料ではありませんでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense doesn't answer current policy." },
      { ja: "おかわりを飲ませてあげます。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Arrogant tone." }
    ]
  },
  {
    id: "reply-n3-28",
    jlpt: 3,
    situationContext: "Expressing condolence",
    speakerRole: "Friend",
    promptJa: "愛犬が亡くなったと聞いて…本当に悲しいね。",
    options: [
      { ja: "ありがとう、気にかけてくれて心が救われるよ。", isCorrect: true, explanation: "Appreciative response to sympathy." },
      { ja: "おめでとうございます。", isCorrect: false, trapType: "wrong-intent", explanation: "Horrible error congratulating a loss." },
      { ja: "犬が亡くなりましたでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Ungrammatical." }
    ]
  },
  {
    id: "reply-n3-29",
    jlpt: 3,
    situationContext: "Job interview inquiry",
    speakerRole: "Candidate",
    promptJa: "結果の通知はいつ頃いただけますでしょうか？",
    options: [
      { ja: "合否にかかわらず、一週間以内にメールにてご連絡いたします。", isCorrect: true, explanation: "Standard HR timeline reply." },
      { ja: "はい、通知してあげます。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Disrespectful 'te ageru'." },
      { ja: "結果を通知しました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense doesn't fit." }
    ]
  },
  {
    id: "reply-n3-30",
    jlpt: 3,
    situationContext: "Project deadline extension",
    speakerRole: "Team leader",
    promptJa: "クライアントから仕様変更の要望が入ったよ。",
    options: [
      { ja: "えっ、締め切りに影響が出ないかスケジュールを確認しましょう。", isCorrect: true, explanation: "Responsible project management response." },
      { ja: "仕様を変更させてあげました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Arrogant." },
      { ja: "はい、変更でした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Incomplete." }
    ]
  },
  {
    id: "reply-n3-31",
    jlpt: 3,
    situationContext: "Asking for feedback",
    speakerRole: "Colleague",
    promptJa: "このプレゼン資料、直したほうがいいところはあるかな？",
    options: [
      { ja: "グラフの数字をもう少し大きくしたほうが見やすいと思うよ。", isCorrect: true, explanation: "Constructive design suggestion." },
      { ja: "はい、直しましたでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Ungrammatical." },
      { ja: "直させてあげません。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Hostile." }
    ]
  },
  {
    id: "reply-n3-32",
    jlpt: 3,
    situationContext: "Post-meeting dinner",
    speakerRole: "Client",
    promptJa: "次回はぜひ私どものオフィスへもお立ち寄りください。",
    options: [
      { ja: "ありがとうございます。ぜひ伺わせていただきます。", isCorrect: true, explanation: "Humble promise to visit." },
      { ja: "はい、お立ち寄りなさってください。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Directs client to visit instead." },
      { ja: "立ち寄りました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense." }
    ]
  },
  {
    id: "reply-n3-33",
    jlpt: 3,
    situationContext: "Apology for omission",
    speakerRole: "Junior staff",
    promptJa: "確認漏れがあり、ご迷惑をおかけして申し訳ありませんでした。",
    options: [
      { ja: "今後は再発防止のためにチェックリストを徹底してくださいね。", isCorrect: true, explanation: "Firm but constructive managerial coaching." },
      { ja: "はい、迷惑でしたよ。", isCorrect: false, trapType: "register-mismatch", explanation: "Blunt emotional complaint." },
      { ja: "確認させられました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Passive error." }
    ]
  },
  {
    id: "reply-n3-34",
    jlpt: 3,
    situationContext: "Borrowing tools",
    speakerRole: "Neighbor",
    promptJa: "庭の手入れをしたいのですが、ハサミを拝借できますか？",
    options: [
      { ja: "どうぞ、使い終わったら元の場所に戻しておいてくださいね。", isCorrect: true, explanation: "Friendly consent with return condition." },
      { ja: "はい、拝借してください。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Uses kenjougo haishaku on the other party." },
      { ja: "ハサミがありました。", isCorrect: false, trapType: "wrong-intent", explanation: "Doesn't grant permission." }
    ]
  },
  {
    id: "reply-n3-35",
    jlpt: 3,
    situationContext: "Project wrap-up",
    speakerRole: "Manager",
    promptJa: "みんなのおかげで無事にリリースできたよ。お疲れ様！",
    options: [
      { ja: "チーム全員で頑張った甲斐がありましたね！", isCorrect: true, explanation: "Heartfelt celebration of teamwork using '~kai ga atta'." },
      { ja: "はい、リリースさせてあげました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Arrogant." },
      { ja: "リリースしましたでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Grammar mistake." }
    ]
  },

  // --- N2 (25 items) ---
  {
    id: "reply-n2-01",
    jlpt: 2,
    situationContext: "Business phone",
    speakerRole: "Client",
    promptJa: "恐れ入りますが、企画部の佐藤様にお取り次ぎ願えますでしょうか？",
    options: [
      { ja: "かしこまりました。企画部の佐藤におつなぎいたします。", isCorrect: true, explanation: "Correct humble business phone etiquette, dropping title for internal staff." },
      { ja: "はい、佐藤部長様がいらっしゃいます。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Dual honorific error using 'buchou-sama' and 'irassharu' for an internal coworker to a client." },
      { ja: "佐藤にお取り次ぎなさいます。", isCorrect: false, trapType: "wrong-intent", explanation: "Confuses sonkeigo with action you perform." }
    ]
  },
  {
    id: "reply-n2-02",
    jlpt: 2,
    situationContext: "Client contract discussion",
    speakerRole: "Client",
    promptJa: "今回の契約条件について、持ち帰ってご検討いただけますか？",
    options: [
      { ja: "承知いたしました。社内で慎重に検討のうえ、週明けにご回答申し上げます。", isCorrect: true, explanation: "Polite formal agreement with timeline commitment." },
      { ja: "はい、ご検討なさってください。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Tells the client to consider it rather than yourself." },
      { ja: "持ち帰ってあげました。", isCorrect: false, trapType: "register-mismatch", explanation: "Rude 'te ageru' in executive business dialogue." }
    ]
  },
  {
    id: "reply-n2-03",
    jlpt: 2,
    situationContext: "Executive meeting",
    speakerRole: "Director",
    promptJa: "この新製品のマーケティング戦略、君ならどう進めるかね？",
    options: [
      { ja: "まずは若年層へのSNSプロモーションを軸に展開すべきかと存じます。", isCorrect: true, explanation: "Formal business proposal using kenjougo '~to zonjimasu'." },
      { ja: "はい、進めてあげましょう。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Disrespectful offer to director." },
      { ja: "戦略が進みませんでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Doesn't answer the forward-looking strategic question." }
    ]
  },
  {
    id: "reply-n2-04",
    jlpt: 2,
    situationContext: "Interview inquiry",
    speakerRole: "Interviewer",
    promptJa: "前職でのご経験は、当社の業務にどのように活かせるとお考えですか？",
    options: [
      { ja: "培った顧客折衝力を活かし、新規開拓に貢献できると自負しております。", isCorrect: true, explanation: "Strong, professional interview articulation using 'jifu shite orimasu'." },
      { ja: "活かさせてあげたいと思います。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Arrogant tone in job interview." },
      { ja: "業務を活かしましたでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Ungrammatical." }
    ]
  },
  {
    id: "reply-n2-05",
    jlpt: 2,
    situationContext: "Visiting partner company",
    speakerRole: "Host executive",
    promptJa: "遠路はるばるお越しいただき、誠にありがとうございます。",
    options: [
      { ja: "滅相もございません。貴重なお時間を割いていただき、こちらこそ御礼申し上げます。", isCorrect: true, explanation: "Flawless business humility brushing aside praise or gratitude." },
      { ja: "はい、お越ししました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Applying sonkeigo 'o-koshi' to oneself." },
      { ja: "どういたしまして、大変でした。", isCorrect: false, trapType: "register-mismatch", explanation: "Complaining about travel effort to a host." }
    ]
  },
  {
    id: "reply-n2-06",
    jlpt: 2,
    situationContext: "Budget negotiation",
    speakerRole: "Partner",
    promptJa: "予算の都合上、なんとか５％ほどお値引きいただけないでしょうか？",
    options: [
      { ja: "厳しい条件ではございますが、数量次第で前向きに調整させていただきます。", isCorrect: true, explanation: "Diplomatic commercial response balancing constraint and conditional compromise." },
      { ja: "いいえ、値引きしてあげられません。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Rude refusal with 'te ageru'." },
      { ja: "予算を値引きしました。", isCorrect: false, trapType: "wrong-intent", explanation: "Grammatically confused." }
    ]
  },
  {
    id: "reply-n2-07",
    jlpt: 2,
    situationContext: "Document review request",
    speakerRole: "Manager",
    promptJa: "こちらの企画書、ご意見を伺いたいのですが、拝見願えますか？",
    options: [
      { ja: "喜んで拝読いたします。明日の午前中までにお戻ししますね。", isCorrect: true, explanation: "Humble acceptance 'haidoku itashimasu' with turnaround time." },
      { ja: "はい、ご覧になってください。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Tells the requester to look at it." },
      { ja: "拝見させてあげます。", isCorrect: false, trapType: "register-mismatch", explanation: "Confused honorific." }
    ]
  },
  {
    id: "reply-n2-08",
    jlpt: 2,
    situationContext: "Business delay apology",
    speakerRole: "Supplier",
    promptJa: "部品の調達が遅れており、納期に間に合いそうにありません。",
    options: [
      { ja: "それは困りましたね。至急、代替案をご提示いただけますか？", isCorrect: true, explanation: "Firm professional requirement for contingency options." },
      { ja: "はい、間に合いました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Contradicts the notification of delay." },
      { ja: "納期を遅らせてあげましょう。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Condescending." }
    ]
  },
  {
    id: "reply-n2-09",
    jlpt: 2,
    situationContext: "Reception desk",
    speakerRole: "Visitor",
    promptJa: "午後２時に営業部長の松本様とお約束をいただいているスミスの者ですが。",
    options: [
      { ja: "お待ちしておりました。松本に申し伝えますので、こちらでお掛けになってお待ちください。", isCorrect: true, explanation: "Humble internal reporting 'moushitsutaemasu' and polite customer seating." },
      { ja: "はい、松本様をお呼びします。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Adding 'sama' to an internal coworker when speaking to a visitor." },
      { ja: "松本はお約束をなさいました。", isCorrect: false, trapType: "wrong-intent", explanation: "Awkward honorific formulation." }
    ]
  },
  {
    id: "reply-n2-10",
    jlpt: 2,
    situationContext: "Consulting advice",
    speakerRole: "Colleague",
    promptJa: "このプロジェクト、思い切って方針を転換すべきじゃないでしょうか？",
    options: [
      { ja: "リスクも伴いますが、現状の停滞を打開するには検討に値しますね。", isCorrect: true, explanation: "Sophisticated analytical agreement." },
      { ja: "はい、転換させられました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Complaining passive." },
      { ja: "方針を転換してあげましょう。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Inappropriate." }
    ]
  },
  {
    id: "reply-n2-11",
    jlpt: 2,
    situationContext: "Gift refusal check",
    speakerRole: "Client",
    promptJa: "ささやかなものですが、皆様で召し上がっていただければ幸いです。",
    options: [
      { ja: "温かいお心遣いをいただき恐縮です。皆でありがたく頂戴いたします。", isCorrect: true, explanation: "Flawless corporate gratitude and humble acceptance." },
      { ja: "はい、召し上がります。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Using sonkeigo for oneself." },
      { ja: "ささやかでしたね。", isCorrect: false, trapType: "register-mismatch", explanation: "Insulting literal interpretation." }
    ]
  },
  {
    id: "reply-n2-12",
    jlpt: 2,
    situationContext: "Project bottleneck",
    speakerRole: "Engineer",
    promptJa: "サーバーの負荷が想定を超えており、このままではダウンしかねません。",
    options: [
      { ja: "ただちに緊急メンテナンスを告知し、トラフィック制限をかけましょう。", isCorrect: true, explanation: "Decisive operational reaction to risk '~kane nai'." },
      { ja: "はい、ダウンしませんでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense." },
      { ja: "サーバーをダウンさせてあげます。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Sabotage-sounding misinterpretation." }
    ]
  },
  {
    id: "reply-n2-13",
    jlpt: 2,
    situationContext: "Business inquiry",
    speakerRole: "Client",
    promptJa: "御社の新しいセキュリティサービスについて、資料をご送付願えますか？",
    options: [
      { ja: "かしこまりました。本日中にPDF資料をメールにてお送りいたします。", isCorrect: true, explanation: "Prompt, courteous confirmation of dispatch." },
      { ja: "はい、送付してあげます。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Disrespectful." },
      { ja: "資料が送付されました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Doesn't promise action." }
    ]
  },
  {
    id: "reply-n2-14",
    jlpt: 2,
    situationContext: "Career advice",
    speakerRole: "Mentor",
    promptJa: "失敗を恐れて行動しないことこそ、最大の損失になりかねないよ。",
    options: [
      { ja: "胸に刺さります。一歩踏み出す勇気を持って挑戦してみます。", isCorrect: true, explanation: "Deeply appreciative reflection on wisdom." },
      { ja: "はい、損失になりましたでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Ungrammatical." },
      { ja: "失敗させてあげます。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Nonsensical." }
    ]
  },
  {
    id: "reply-n2-15",
    jlpt: 2,
    situationContext: "Negotiation settlement",
    speakerRole: "Partner company",
    promptJa: "本件、この条件で合意ということでよろしいでしょうか？",
    options: [
      { ja: "異議ございません。双方合意のもとで契約書面を作成いたしましょう。", isCorrect: true, explanation: "Formal legal and commercial assent." },
      { ja: "はい、合意してあげました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Condescending." },
      { ja: "合意がありませんでした。", isCorrect: false, trapType: "wrong-intent", explanation: "Contradictory." }
    ]
  },
  {
    id: "reply-n2-16",
    jlpt: 2,
    situationContext: "Workplace scheduling",
    speakerRole: "Executive",
    promptJa: "来週の取締役会、資料の準備は滞りなく進んでいるかね？",
    options: [
      { ja: "はい、役員各位への事前配布を含め、万全を期しております。", isCorrect: true, explanation: "Reassuring, sophisticated executive reporting." },
      { ja: "準備を進めさせてあげました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Arrogant." },
      { ja: "滞りましたでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Ungrammatical." }
    ]
  },
  {
    id: "reply-n2-17",
    jlpt: 2,
    situationContext: "Expressing apology",
    speakerRole: "Colleague",
    promptJa: "私の独断で進めてしまったばかりに、ご迷惑をおかけしました。",
    options: [
      { ja: "結果オーライですし、今後は事前にチームへ共有してくれれば大丈夫だよ。", isCorrect: true, explanation: "Fair, balanced leadership coaching." },
      { ja: "はい、迷惑でしたね。", isCorrect: false, trapType: "register-mismatch", explanation: "Harsh." },
      { ja: "独断をさせました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Confused." }
    ]
  },
  {
    id: "reply-n2-18",
    jlpt: 2,
    situationContext: "Business visit",
    speakerRole: "Client",
    promptJa: "近くまで参りましたので、ご挨拶だけでもと思いお寄りしました。",
    options: [
      { ja: "まあ、わざわざお立ち寄りくださり恐縮です！どうぞ中へお入りください。", isCorrect: true, explanation: "Welcoming hospitality appreciating an unscheduled visit." },
      { ja: "はい、参られましたね。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Using humble mairu for guest." },
      { ja: "挨拶をしてあげます。", isCorrect: false, trapType: "register-mismatch", explanation: "Rude." }
    ]
  },
  {
    id: "reply-n2-19",
    jlpt: 2,
    situationContext: "Contract review",
    speakerRole: "Legal counsel",
    promptJa: "第５条の免責条項ですが、この文面ではリスクを回避しきれません。",
    options: [
      { ja: "ご指摘ありがとうございます。損害賠償の上限を明記する形で修正案を作成します。", isCorrect: true, explanation: "Constructive legal response incorporating feedback." },
      { ja: "はい、回避してあげました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Disrespectful." },
      { ja: "リスクがありませんでした。", isCorrect: false, trapType: "wrong-intent", explanation: "Ignores the legal warning." }
    ]
  },
  {
    id: "reply-n2-20",
    jlpt: 2,
    situationContext: "Executive departure",
    speakerRole: "Boss",
    promptJa: "ちょっと空港まで役員をお見送りに行ってくるよ。",
    options: [
      { ja: "承知いたしました。道中お気をつけて行ってらっしゃいませ。", isCorrect: true, explanation: "Respectful send-off." },
      { ja: "はい、見送られてください。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Ungrammatical passive." },
      { ja: "役員を見送ってあげました。", isCorrect: false, trapType: "register-mismatch", explanation: "Arrogant." }
    ]
  },
  {
    id: "reply-n2-21",
    jlpt: 2,
    situationContext: "Project risk",
    speakerRole: "Auditor",
    promptJa: "このデータを見る限り、目標達成は極めて困難と言わざるを得ません。",
    options: [
      { ja: "真摯に受け止め、早急に挽回策を取りまとめてご報告いたします。", isCorrect: true, explanation: "Responsible accountability under scrutiny." },
      { ja: "はい、困難と言わせてください。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Bizarre causative." },
      { ja: "目標を達成しましたでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Ungrammatical." }
    ]
  },
  {
    id: "reply-n2-22",
    jlpt: 2,
    situationContext: "Job offer",
    speakerRole: "Recruiter",
    promptJa: "ぜひ我が社の未来を共に創る中核メンバーとしてお迎えしたいと考えております。",
    options: [
      { ja: "身に余る高いご評価をいただき光栄に存じます。前向きに検討させていただきます。", isCorrect: true, explanation: "Modest, appreciative response to an executive offer." },
      { ja: "はい、迎えてあげますよ。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Arrogant." },
      { ja: "メンバーになりましたでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Grammar error." }
    ]
  },
  {
    id: "reply-n2-23",
    jlpt: 2,
    situationContext: "Quality assurance",
    speakerRole: "QA Manager",
    promptJa: "微細な不具合ではありますが、このまま出荷するわけにはまいりません。",
    options: [
      { ja: "品質第一ですので同感です。原因究明と改修を最優先で進めましょう。", isCorrect: true, explanation: "Total agreement with quality standards." },
      { ja: "はい、出荷してあげました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Disrespectful." },
      { ja: "不具合が出荷されました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Passive confusion." }
    ]
  },
  {
    id: "reply-n2-24",
    jlpt: 2,
    situationContext: "Client relations",
    speakerRole: "Client",
    promptJa: "いつも迅速かつ丁寧なご対応をいただき、大変助かっております。",
    options: [
      { ja: "もったいないお言葉です。今後ともご期待に沿えるよう尽力いたします。", isCorrect: true, explanation: "Deep business humility and ongoing commitment." },
      { ja: "はい、丁寧にしてあげました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Arrogant 'te ageru'." },
      { ja: "どういたしまして、大変でした。", isCorrect: false, trapType: "register-mismatch", explanation: "Blunt." }
    ]
  },
  {
    id: "reply-n2-25",
    jlpt: 2,
    situationContext: "Year-end gathering",
    speakerRole: "Executive",
    promptJa: "今年一年の皆の奮闘に心から敬意を表したい。",
    options: [
      { ja: "温かいお言葉をありがとうございます。来期も一丸となって邁進いたします。", isCorrect: true, explanation: "Inspiring collective response to leadership praise." },
      { ja: "敬意を表させてあげます。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Inappropriate." },
      { ja: "奮闘しましたでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Ungrammatical." }
    ]
  },

  // --- N1 (20 items) ---
  {
    id: "reply-n1-01",
    jlpt: 1,
    situationContext: "Boardroom negotiation",
    speakerRole: "Managing Director",
    promptJa: "今回の提携話、先方の真意を測りかねているのだが、どう見るかね？",
    options: [
      { ja: "表向きの条件のみならず、背後にある資本関係まで精査したうえで判断すべきかと存じます。", isCorrect: true, explanation: "Astute strategic analysis fitting high-level executive counsel." },
      { ja: "はい、真意を測ってあげました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Disrespectful 'te ageru' in boardroom register." },
      { ja: "提携が測られました。", isCorrect: false, trapType: "wrong-intent", explanation: "Ungrammatical and logically incoherent." }
    ]
  },
  {
    id: "reply-n1-02",
    jlpt: 1,
    situationContext: "Diplomatic crisis management",
    speakerRole: "Chief Executive",
    promptJa: "不祥事の公表にあたっては、世論の反発を招きかねない点に細心の注意を払わねばならん。",
    options: [
      { ja: "おっしゃる通り、情報の透明性と誠意ある謝罪姿勢を一貫させることが肝要かと存じます。", isCorrect: true, explanation: "Formal crisis management synthesis using 'kanyou'." },
      { ja: "はい、反発を招いてあげましょう。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Nonsensical." },
      { ja: "世論が反発しましたでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Ungrammatical double past." }
    ]
  },
  {
    id: "reply-n1-03",
    jlpt: 1,
    situationContext: "High-level reception",
    speakerRole: "Distinguished Guest",
    promptJa: "本日はこのような盛大な宴にお招きに預かり、身に余る光栄に存じます。",
    options: [
      { ja: "ご多忙の折、ご臨席を賜りましたこと、主催者一同心より御礼申し上げます。", isCorrect: true, explanation: "Top-tier ceremonial Japanese matching 'o-maneki ni azukari' with 'go-rinseki o tamawari'." },
      { ja: "はい、お招きになられましたね。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Confuses who invited whom." },
      { ja: "どういたしまして、盛大でしたよ。", isCorrect: false, trapType: "register-mismatch", explanation: "Crude and bragging." }
    ]
  },
  {
    id: "reply-n1-04",
    jlpt: 1,
    situationContext: "Academic dispute",
    speakerRole: "Professor",
    promptJa: "君の仮説は新規性に富むが、実証データの裏付けなくして学界を納得させるのは難しかろう。",
    options: [
      { ja: "ご指摘を真摯に受け止め、追試による統計的有意性の検証に全力を注ぐ所存です。", isCorrect: true, explanation: "Academic humility and rigorous scientific commitment." },
      { ja: "はい、納得させてあげました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Arrogant." },
      { ja: "データが裏付けましたでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Ungrammatical." }
    ]
  },
  {
    id: "reply-n1-05",
    jlpt: 1,
    situationContext: "M&A advisory",
    speakerRole: "Lead Partner",
    promptJa: "デューデリジェンスの結果次第では、買収価格の再交渉も辞さない構えで臨むべきだ。",
    options: [
      { ja: "同感です。潜在的偶発債務のリスクを徹底的に洗い出し、毅然とした姿勢で交渉に臨みます。", isCorrect: true, explanation: "M&A acumen aligning with the partner's firm negotiation stance." },
      { ja: "はい、再交渉を辞してあげましょう。", isCorrect: false, trapType: "wrong-intent", explanation: "Misunderstands 'jisanai' (will not hesitate) as declining." },
      { ja: "買収価格が再交渉されました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Past tense." }
    ]
  },
  {
    id: "reply-n1-06",
    jlpt: 1,
    situationContext: "Philosophical leadership",
    speakerRole: "Senior Statesman",
    promptJa: "目先の利害にとらわれることなく、大所高所からの判断を下すことこそ肝要である。",
    options: [
      { ja: "銘記いたします。組織の長期的存立基盤を見据え、信念を持って決断してまいります。", isCorrect: true, explanation: "Profound acknowledgement 'meiki itashimasu' embracing broad perspective." },
      { ja: "はい、判断を下させてあげました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Inappropriate." },
      { ja: "大所高所になりましたでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Nonsensical." }
    ]
  },
  {
    id: "reply-n1-07",
    jlpt: 1,
    situationContext: "Contractual ambiguity",
    speakerRole: "General Counsel",
    promptJa: "解釈の余地を残す文言を看過するわけにはいかないので、厳密に推敲してください。",
    options: [
      { ja: "承知いたしました。曖昧さを一切排除した条文に練り直して再提出いたします。", isCorrect: true, explanation: "Rigorous legal compliance response." },
      { ja: "看過してあげましょう。", isCorrect: false, trapType: "wrong-intent", explanation: "Suggests overlooking the ambiguity, which is the exact opposite." },
      { ja: "文言が推敲されましたでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Ungrammatical." }
    ]
  },
  {
    id: "reply-n1-08",
    jlpt: 1,
    situationContext: "Artistic critique",
    speakerRole: "Conductor",
    promptJa: "譜面通りの正確な音符の再現にとどまらず、行間に潜む情念を紡ぎ出してほしい。",
    options: [
      { ja: "心して音と向き合い、作品に込められた作曲者の魂を表現できるよう精進いたします。", isCorrect: true, explanation: "Artistic commitment responding to musical depth." },
      { ja: "はい、情念を紡ぎ出してあげました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Rude." },
      { ja: "譜面通りでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Ignores the artistic instruction." }
    ]
  },
  {
    id: "reply-n1-09",
    jlpt: 1,
    situationContext: "Corporate restructuring",
    speakerRole: "Board Chair",
    promptJa: "いかなる痛みを伴おうとも、構造改革の断行なくして弊社の再生はあり得ない。",
    options: [
      { ja: "覚悟の上で改革に身を投じる所存です。全社的な合意形成にも尽力いたします。", isCorrect: true, explanation: "Unyielding resolve aligning with painful reform." },
      { ja: "はい、再生させてあげます。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Arrogant." },
      { ja: "構造改革が痛みましたでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Nonsensical." }
    ]
  },
  {
    id: "reply-n1-10",
    jlpt: 1,
    situationContext: "Honorary farewell",
    speakerRole: "Retiring Mentor",
    promptJa: "長年にわたり不肖の私を支えてくださった皆様に、衷心より感謝申し上げます。",
    options: [
      { ja: "先生の温かいご薫陶があったからこそ今日の私どもがございます。心より御礼申し上げます。", isCorrect: true, explanation: "Top-tier classical gratitude honoring a mentor's guidance ('kunpou')." },
      { ja: "はい、支えてあげましたよ。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Disrespectful." },
      { ja: "感謝を申し上げさせられました。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Passive error." }
    ]
  },
  {
    id: "reply-n1-11",
    jlpt: 1,
    situationContext: "Economic forecasting",
    speakerRole: "Chief Economist",
    promptJa: "為替の乱高下に加え、地政学的リスクを勘案すると、楽観視は禁物と言わざるを得ません。",
    options: [
      { ja: "市場の変動シナリオを重層的に策定し、万全のリスクヘッジを講じる必要がありますね。", isCorrect: true, explanation: "Financial literacy acknowledging systemic risk." },
      { ja: "はい、楽観視してあげましょう。", isCorrect: false, trapType: "wrong-intent", explanation: "Opposite." },
      { ja: "為替が禁物でした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Meaningless." }
    ]
  },
  {
    id: "reply-n1-12",
    jlpt: 1,
    situationContext: "Patent litigation",
    speakerRole: "Patent Attorney",
    promptJa: "相手方の請求は言いがかりに過ぎませんが、司法判断を仰ぐとなれば長期化は避けられません。",
    options: [
      { ja: "本訴の準備と並行して、早期和解の道筋も探る二重の構えで臨みましょう。", isCorrect: true, explanation: "Pragmatic dual litigation strategy." },
      { ja: "はい、言いがかりをつけてあげます。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Bizarre." },
      { ja: "司法判断が仰がれましたでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Ungrammatical." }
    ]
  },
  {
    id: "reply-n1-13",
    jlpt: 1,
    situationContext: "Public relations",
    speakerRole: "PR Director",
    promptJa: "記者の執拗な追及に対しても、感情的な反論は慎み、論理的整合性を保つことが鉄則です。",
    options: [
      { ja: "承知いたしました。事実関係の淡々とした説明に終始し、失言を排します。", isCorrect: true, explanation: "Flawless crisis PR composure." },
      { ja: "はい、反論してあげました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Opposite of instructions." },
      { ja: "鉄則になりましたでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Grammar mistake." }
    ]
  },
  {
    id: "reply-n1-14",
    jlpt: 1,
    situationContext: "Scholarly peer review",
    speakerRole: "Reviewer",
    promptJa: "論旨の展開はおおむね妥当と認められるものの、先行研究への目配りがやや手薄ではないか。",
    options: [
      { ja: "ご尤もなご指摘です。関連文献を網羅的に再検討し、論拠を補強いたします。", isCorrect: true, explanation: "Academic peer review responsiveness." },
      { ja: "はい、妥当ではありませんでした。", isCorrect: false, trapType: "wrong-intent", explanation: "Self-contradicting." },
      { ja: "手薄にさせてあげました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Nonsensical." }
    ]
  },
  {
    id: "reply-n1-15",
    jlpt: 1,
    situationContext: "Environmental audit",
    speakerRole: "Lead Inspector",
    promptJa: "基準値こそ辛うじて下回っているものの、抜本的な排出削減策を講じる余地は十分にある。",
    options: [
      { ja: "ご下問を重く受け止め、設備の刷新を含めた中長期ロードマップを早急に策定します。", isCorrect: true, explanation: "Corporate compliance dedication." },
      { ja: "はい、下回ってあげました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Rude." },
      { ja: "基準値でしたでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Ungrammatical." }
    ]
  },
  {
    id: "reply-n1-16",
    jlpt: 1,
    situationContext: "Ceremonial conferment",
    speakerRole: "Chairman",
    promptJa: "多年にわたる学術振興への格別なるご功績を讃え、ここに栄誉を称揚いたします。",
    options: [
      { ja: "身に余る栄誉を賜り、畏友諸賢ならびにご支援くださった皆様に厚く御礼申し上げます。", isCorrect: true, explanation: "Formal laureate gratitude." },
      { ja: "はい、功績を讃えさせてあげます。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Confuses roles." },
      { ja: "栄誉でしたよ。", isCorrect: false, trapType: "register-mismatch", explanation: "Insulting." }
    ]
  },
  {
    id: "reply-n1-17",
    jlpt: 1,
    situationContext: "Government hearing",
    speakerRole: "Committee Chair",
    promptJa: "参考人のご見解は傾聴に値しますが、現行法制との整合性はいかに担保されるおつもりか。",
    options: [
      { ja: "法改正の猶予期間を設けた段階的移行措置を導入することで、法秩序との調和は可能と考えます。", isCorrect: true, explanation: "High-level constitutional and legislative policy reasoning." },
      { ja: "はい、整合性を担保してあげます。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Arrogant." },
      { ja: "見解が傾聴されましたでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Ungrammatical." }
    ]
  },
  {
    id: "reply-n1-18",
    jlpt: 1,
    situationContext: "Architectural design",
    speakerRole: "Master Architect",
    promptJa: "構造の合理性を追求するあまり、空間の醸し出す詩情を損なっては本末転倒だよ。",
    options: [
      { ja: "胸に刻みます。光と陰影の移ろいが生み出す情緒的な陰影美を今一度追求してみます。", isCorrect: true, explanation: "Deep aesthetic and structural synthesis." },
      { ja: "はい、本末転倒でしたね。", isCorrect: false, trapType: "register-mismatch", explanation: "Superficial." },
      { ja: "合理性を追求させてあげました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Inappropriate." }
    ]
  },
  {
    id: "reply-n1-19",
    jlpt: 1,
    situationContext: "International summit",
    speakerRole: "Ambassador",
    promptJa: "多国間対話の停滞を打開すべく、貴国におかれましても格段のご尽力を賜りたく存じます。",
    options: [
      { ja: "国際協調の理念に則り、架け橋としての役割を全うすべく微力を尽くす所存でございます。", isCorrect: true, explanation: "Diplomatic commitment using 'biryoku o tsukusu'." },
      { ja: "はい、尽力してあげましょう。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Crude." },
      { ja: "対話が停滞しましたでした。", isCorrect: false, trapType: "grammar-tense-trap", explanation: "Ungrammatical." }
    ]
  },
  {
    id: "reply-n1-20",
    jlpt: 1,
    situationContext: "Final project evaluation",
    speakerRole: "Executive Sponsor",
    promptJa: "いかなる逆境にあっても初心を貫徹した諸君の気概には、深く敬意を表する次第である。",
    options: [
      { ja: "温かいご激励を胸に刻み、次なる挑戦に向けて一層の精進を重ねてまいります。", isCorrect: true, explanation: "Inspirational commitment to ongoing excellence." },
      { ja: "初心を貫徹させてあげました。", isCorrect: false, trapType: "keigo-mismatch", explanation: "Arrogant." },
      { ja: "逆境でしたよ。", isCorrect: false, trapType: "register-mismatch", explanation: "Inappropriate." }
    ]
  }
,
{
  "id": "utterance-n5-01",
  "jlpt": 5,
  "category": "situational-utterance",
  "situationContext": "電車の中で、お年寄りに席をゆずります。何と言いますか。",
  "speakerRole": "⬇ You (あなた)",
  "promptJa": "電車の中で、お年寄りに席をゆずります。何と言いますか。",
  "options": [
    {
      "ja": "どうぞ、ここに座ってください。",
      "isCorrect": true,
      "explanation": "Natural polite offer inviting someone to take your seat."
    },
    {
      "ja": "どうもすみませんでした。",
      "isCorrect": false,
      "trapType": "wrong-intent",
      "explanation": "Apologizing instead of offering your seat."
    },
    {
      "ja": "失礼しました。",
      "isCorrect": false,
      "trapType": "register-mismatch",
      "explanation": "Standard apology phrase, not an invitation to sit."
    }
  ]
},
{
  "id": "utterance-n5-02",
  "jlpt": 5,
  "category": "situational-utterance",
  "situationContext": "同僚より先に会社を出て帰ります。何と言いますか。",
  "speakerRole": "⬇ You (あなた)",
  "promptJa": "同僚より先に会社を出て帰ります。何と言いますか。",
  "options": [
    {
      "ja": "お先に失礼します。",
      "isCorrect": true,
      "explanation": "Standard phrase spoken when leaving the workplace before colleagues."
    },
    {
      "ja": "お疲れ様でした、また明日。",
      "isCorrect": false,
      "trapType": "wrong-intent",
      "explanation": "Said to others who are leaving or general goodbye."
    },
    {
      "ja": "いってまいります。",
      "isCorrect": false,
      "trapType": "register-mismatch",
      "explanation": "Said when stepping out on business with intention to return."
    }
  ]
},
{
  "id": "utterance-n5-03",
  "jlpt": 5,
  "category": "situational-utterance",
  "situationContext": "友達に傘を借りたいです。何と言いますか。",
  "speakerRole": "⬇ You (あなた)",
  "promptJa": "友達に傘を借りたいです。何と言いますか。",
  "options": [
    {
      "ja": "この傘、ちょっと貸してくれる？",
      "isCorrect": true,
      "explanation": "Natural casual request asking a friend to lend an umbrella."
    },
    {
      "ja": "この傘、ちょっと借りてくれる？",
      "isCorrect": false,
      "trapType": "grammar-tense-trap",
      "explanation": "Confuses 貸す (lend) and 借りる (borrow)."
    },
    {
      "ja": "この傘、使ってもいいよ。",
      "isCorrect": false,
      "trapType": "wrong-intent",
      "explanation": "Offers your umbrella instead of asking to borrow theirs."
    }
  ]
},
{
  "id": "utterance-n5-04",
  "jlpt": 5,
  "category": "situational-utterance",
  "situationContext": "先生の研究室に入ります。何と言いますか。",
  "speakerRole": "⬇ You (あなた)",
  "promptJa": "先生の研究室に入ります。何と言いますか。",
  "options": [
    {
      "ja": "失礼します。",
      "isCorrect": true,
      "explanation": "Set formal greeting when entering a professor or superior's room."
    },
    {
      "ja": "ごめんください。",
      "isCorrect": false,
      "trapType": "register-mismatch",
      "explanation": "Said when visiting someone's home entrance, not an office."
    },
    {
      "ja": "おじゃましません。",
      "isCorrect": false,
      "trapType": "grammar-tense-trap",
      "explanation": "Negative greeting makes no sense upon entering."
    }
  ]
},
{
  "id": "utterance-n5-05",
  "jlpt": 5,
  "category": "situational-utterance",
  "situationContext": "ご飯をごちそうになりました。食べた後で何と言いますか。",
  "speakerRole": "⬇ You (あなた)",
  "promptJa": "ご飯をごちそうになりました。食べた後で何と言いますか。",
  "options": [
    {
      "ja": "ごちそうさまでした。とてもおいしかったです。",
      "isCorrect": true,
      "explanation": "Standard gratitude expressed after finishing a meal."
    },
    {
      "ja": "いただきます。",
      "isCorrect": false,
      "trapType": "wrong-intent",
      "explanation": "Spoken before starting to eat, not after."
    },
    {
      "ja": "お待たせしました。",
      "isCorrect": false,
      "trapType": "register-mismatch",
      "explanation": "Said when keeping someone waiting."
    }
  ]
},
{
  "id": "utterance-n5-06",
  "jlpt": 5,
  "category": "situational-utterance",
  "situationContext": "相手の言ったことがよく聞こえませんでした。何と言いますか。",
  "speakerRole": "⬇ You (あなた)",
  "promptJa": "相手の言ったことがよく聞こえませんでした。何と言いますか。",
  "options": [
    {
      "ja": "すみません、もう一度言ってください。",
      "isCorrect": true,
      "explanation": "Polite request to repeat what was just said."
    },
    {
      "ja": "はい、わかりました。",
      "isCorrect": false,
      "trapType": "wrong-intent",
      "explanation": "Claims understanding when you actually could not hear."
    },
    {
      "ja": "大きな声で話さないでください。",
      "isCorrect": false,
      "trapType": "register-mismatch",
      "explanation": "Rude request telling the other person not to speak loudly."
    }
  ]
},
{
  "id": "utterance-n5-07",
  "jlpt": 5,
  "category": "situational-utterance",
  "situationContext": "店で靴を履いてみたいです。店員に何と言いますか。",
  "speakerRole": "⬇ You (あなた)",
  "promptJa": "店で靴を履いてみたいです。店員に何と言いますか。",
  "options": [
    {
      "ja": "これを履いてみてもいいですか。",
      "isCorrect": true,
      "explanation": "Polite permission request using 〜てみてもいいですか."
    },
    {
      "ja": "これを履いてあげましょうか。",
      "isCorrect": false,
      "trapType": "grammar-tense-trap",
      "explanation": "Offers to put shoes on the clerk (〜てあげる)."
    },
    {
      "ja": "これを履かなければなりませんか。",
      "isCorrect": false,
      "trapType": "wrong-intent",
      "explanation": "Asks if trying them on is a mandatory obligation."
    }
  ]
},
{
  "id": "utterance-n5-08",
  "jlpt": 5,
  "category": "situational-utterance",
  "situationContext": "道で時間を尋ねます。何と言いますか。",
  "speakerRole": "⬇ You (あなた)",
  "promptJa": "道で時間を尋ねます。何と言いますか。",
  "options": [
    {
      "ja": "すみません、今何時ですか。",
      "isCorrect": true,
      "explanation": "Standard polite inquiry asking for the current time."
    },
    {
      "ja": "あのう、時間はありますか。",
      "isCorrect": false,
      "trapType": "wrong-intent",
      "explanation": "Asks if the passerby has spare time, not the clock time."
    },
    {
      "ja": "時間を教えてあげますよ。",
      "isCorrect": false,
      "trapType": "grammar-tense-trap",
      "explanation": "Says you will tell them the time instead of asking."
    }
  ]
},
{
  "id": "utterance-n4-01",
  "jlpt": 4,
  "category": "situational-utterance",
  "situationContext": "約束の時間に遅れそうです。電話で何と言いますか。",
  "speakerRole": "⬇ You (あなた)",
  "promptJa": "約束の時間に遅れそうです。電話で何と言いますか。",
  "options": [
    {
      "ja": "申し訳ありません、十分ほど遅れそうです。",
      "isCorrect": true,
      "explanation": "Courteous apology with estimated delay notice using 〜そうです."
    },
    {
      "ja": "十分待ってくださいませんか。",
      "isCorrect": false,
      "trapType": "wrong-intent",
      "explanation": "Orders the counterpart to wait without offering an apology."
    },
    {
      "ja": "早く来てください。",
      "isCorrect": false,
      "trapType": "register-mismatch",
      "explanation": "Commands the other person to arrive early."
    }
  ]
},
{
  "id": "utterance-n4-02",
  "jlpt": 4,
  "category": "situational-utterance",
  "situationContext": "重い荷物を持っている人を手伝いたいです。何と言いますか。",
  "speakerRole": "⬇ You (あなた)",
  "promptJa": "重い荷物を持っている人を手伝いたいです。何と言いますか。",
  "options": [
    {
      "ja": "お持ちしましょうか。",
      "isCorrect": true,
      "explanation": "Polite humble offer of assistance using お〜しましょうか."
    },
    {
      "ja": "持ってください。",
      "isCorrect": false,
      "trapType": "grammar-tense-trap",
      "explanation": "Asks them to carry instead of offering help."
    },
    {
      "ja": "持ってあげてください。",
      "isCorrect": false,
      "trapType": "wrong-intent",
      "explanation": "Tells someone else to carry the luggage."
    }
  ]
},
{
  "id": "utterance-n4-03",
  "jlpt": 4,
  "category": "situational-utterance",
  "situationContext": "シャッターを押してもらいたいです。何と言いますか。",
  "speakerRole": "⬇ You (あなた)",
  "promptJa": "シャッターを押してもらいたいです。何と言いますか。",
  "options": [
    {
      "ja": "すみません、シャッターを押していただけませんか。",
      "isCorrect": true,
      "explanation": "Courteous request using 〜ていただけませんか."
    },
    {
      "ja": "シャッターを押してあげましょうか。",
      "isCorrect": false,
      "trapType": "grammar-tense-trap",
      "explanation": "Offers to take their photo instead of asking."
    },
    {
      "ja": "写真を撮っても構いませんか。",
      "isCorrect": false,
      "trapType": "wrong-intent",
      "explanation": "Asks permission for you to take a photo of the area."
    }
  ]
},
{
  "id": "utterance-n4-04",
  "jlpt": 4,
  "category": "situational-utterance",
  "situationContext": "ペンを借りたいです。隣の人に何と言いますか。",
  "speakerRole": "⬇ You (あなた)",
  "promptJa": "ペンを借りたいです。隣の人に何と言いますか。",
  "options": [
    {
      "ja": "すみません、ペンを少しお借りしてもよろしいですか。",
      "isCorrect": true,
      "explanation": "Respectful borrowing permission using お借りしてもよろしいですか."
    },
    {
      "ja": "ペンを少しお貸ししてもよろしいですか。",
      "isCorrect": false,
      "trapType": "grammar-tense-trap",
      "explanation": "Confuses お借りする (I borrow) and お貸しする (I lend)."
    },
    {
      "ja": "ペンを使ってあげてください。",
      "isCorrect": false,
      "trapType": "wrong-intent",
      "explanation": "Tells them to use your pen."
    }
  ]
},
{
  "id": "utterance-n4-05",
  "jlpt": 4,
  "category": "situational-utterance",
  "situationContext": "課長に書類を見てほしいです。何と言いますか。",
  "speakerRole": "⬇ You (あなた)",
  "promptJa": "課長に書類を見てほしいです。何と言いますか。",
  "options": [
    {
      "ja": "課長、この書類を見ていただけないでしょうか。",
      "isCorrect": true,
      "explanation": "Respectful business request to a superior using 〜ていただけないでしょうか."
    },
    {
      "ja": "課長、この書類をご覧になりましょうか。",
      "isCorrect": false,
      "trapType": "keigo-mismatch",
      "explanation": "Corrupt keigo mixing honorific and self-offer."
    },
    {
      "ja": "課長、この書類を見せてあげます。",
      "isCorrect": false,
      "trapType": "register-mismatch",
      "explanation": "Patronizing tone saying you will show it to them."
    }
  ]
},
{
  "id": "utterance-n4-06",
  "jlpt": 4,
  "category": "situational-utterance",
  "situationContext": "名前を呼ばれて診察室に入ります。何と言いますか。",
  "speakerRole": "⬇ You (あなた)",
  "promptJa": "名前を呼ばれて診察室に入ります。何と言いますか。",
  "options": [
    {
      "ja": "失礼いたします。",
      "isCorrect": true,
      "explanation": "Standard polite entrance greeting when entering doctor's exam room."
    },
    {
      "ja": "お待たせいたしました。",
      "isCorrect": false,
      "trapType": "wrong-intent",
      "explanation": "The doctor or host says this, not the entering patient."
    },
    {
      "ja": "ご苦労様でした。",
      "isCorrect": false,
      "trapType": "keigo-mismatch",
      "explanation": "Patronizing phrase spoken only by superiors to subordinates."
    }
  ]
},
{
  "id": "utterance-n3-01",
  "jlpt": 3,
  "category": "situational-utterance",
  "situationContext": "会議で意見を言いたいです。何と言いますか。",
  "speakerRole": "⬇ You (あなた)",
  "promptJa": "会議で意見を言いたいです。何と言いますか。",
  "options": [
    {
      "ja": "恐れ入りますが、一言よろしいでしょうか。",
      "isCorrect": true,
      "explanation": "Proper business cushion phrase requesting permission to speak."
    },
    {
      "ja": "私の話を聞いてください。",
      "isCorrect": false,
      "trapType": "register-mismatch",
      "explanation": "Far too blunt and assertive for a formal meeting."
    },
    {
      "ja": "お話し申し上げます。",
      "isCorrect": false,
      "trapType": "keigo-mismatch",
      "explanation": "Unnatural phrasing before starting an opinion."
    }
  ]
},
{
  "id": "utterance-n3-02",
  "jlpt": 3,
  "category": "situational-utterance",
  "situationContext": "取引先の田中様からお電話です。部長に何と言いますか。",
  "speakerRole": "⬇ You (あなた)",
  "promptJa": "取引先の田中様からお電話です。部長に何と言いますか。",
  "options": [
    {
      "ja": "ABC商事の田中様から一番にお電話が入っております。",
      "isCorrect": true,
      "explanation": "Standard business protocol for announcing an incoming client call."
    },
    {
      "ja": "田中さんが電話したいと言っています。",
      "isCorrect": false,
      "trapType": "register-mismatch",
      "explanation": "Lacks professional business honorific register."
    },
    {
      "ja": "田中様をお電話にお呼びしました。",
      "isCorrect": false,
      "trapType": "grammar-tense-trap",
      "explanation": "Reverses the direction of who placed the call."
    }
  ]
},
{
  "id": "utterance-n3-03",
  "jlpt": 3,
  "category": "situational-utterance",
  "situationContext": "気分が悪いので早く帰りたいです。上司に何と言いますか。",
  "speakerRole": "⬇ You (あなた)",
  "promptJa": "気分が悪いので早く帰りたいです。上司に何と言いますか。",
  "options": [
    {
      "ja": "申し訳ありません、熱があるので本日はお先に失礼してもよろしいでしょうか。",
      "isCorrect": true,
      "explanation": "Polite request for early departure citing condition and asking permission."
    },
    {
      "ja": "気分が悪いので帰らせてくださいませんか。",
      "isCorrect": false,
      "trapType": "register-mismatch",
      "explanation": "Overly demanding causal imperative towards a superior."
    },
    {
      "ja": "本日はお暇をいただかれますか。",
      "isCorrect": false,
      "trapType": "keigo-mismatch",
      "explanation": "Ungrammatical misuse of honorific forms."
    }
  ]
},
{
  "id": "utterance-n3-04",
  "jlpt": 3,
  "category": "situational-utterance",
  "situationContext": "来客にお茶を差し出します。何と言いますか。",
  "speakerRole": "⬇ You (あなた)",
  "promptJa": "来客にお茶を差し出します。何と言いますか。",
  "options": [
    {
      "ja": "どうぞ、お熱いうちに召し上がってください。",
      "isCorrect": true,
      "explanation": "Respectful encouragement to enjoy tea using sonkeigo 召し上がる."
    },
    {
      "ja": "どうぞ、お熱いうちにいただいてください。",
      "isCorrect": false,
      "trapType": "keigo-mismatch",
      "explanation": "いただく is humble (kenjōgo) and cannot be applied to a client."
    },
    {
      "ja": "冷めないように早く飲んでください。",
      "isCorrect": false,
      "trapType": "register-mismatch",
      "explanation": "Rude imperative directing a guest."
    }
  ]
},
{
  "id": "utterance-n3-05",
  "jlpt": 3,
  "category": "situational-utterance",
  "situationContext": "上司からの依頼を丁重に断りたいです。何と言いますか。",
  "speakerRole": "⬇ You (あなた)",
  "promptJa": "上司からの依頼を丁重に断りたいです。何と言いますか。",
  "options": [
    {
      "ja": "大変恐縮ですが、ただいま別の急ぎの案件を抱えておりまして、お引き受けいたしかねます。",
      "isCorrect": true,
      "explanation": "Quintessential business refusal using cushion and 〜いたしかねます."
    },
    {
      "ja": "忙しいので今はできません。",
      "isCorrect": false,
      "trapType": "register-mismatch",
      "explanation": "Blunt informal refusal unsuitable for a superior."
    },
    {
      "ja": "その仕事はお断り申し上げられます。",
      "isCorrect": false,
      "trapType": "keigo-mismatch",
      "explanation": "Grammatically corrupt double-honorific passive blend."
    }
  ]
},
{
  "id": "utterance-n3-06",
  "jlpt": 3,
  "category": "situational-utterance",
  "situationContext": "結婚式で新郎新婦のご両親に挨拶します。何と言いますか。",
  "speakerRole": "⬇ You (あなた)",
  "promptJa": "結婚式で新郎新婦のご両親に挨拶します。何と言いますか。",
  "options": [
    {
      "ja": "本日は誠におめでとうございます。心よりお慶び申し上げます。",
      "isCorrect": true,
      "explanation": "Highest formal ceremonial congratulatory greeting."
    },
    {
      "ja": "ご苦労様でした。本当によかったですね。",
      "isCorrect": false,
      "trapType": "keigo-mismatch",
      "explanation": "ご苦労様 is patronizing and forbidden to hosts."
    },
    {
      "ja": "お世話様でした。お幸せになってください。",
      "isCorrect": false,
      "trapType": "register-mismatch",
      "explanation": "Inappropriate conversational blend for a wedding."
    }
  ]
}
];
