import type { RawN3StoryDefinition } from "./data-n3-anime";

export const EVERYDAY_STORIES: RawN3StoryDefinition[] = [
  // 1. Hospital Visit (病院での診察)
  {
    id: "story-n3-hospital",
    slug: "hospital",
    title: "病院での診察：初めての総合病院",
    titleRomaji: "Byouin de no Shinsatsu: Hajimete no Sougou Byouin",
    titleEn: "Hospital Visit: First Time at a General Hospital",
    category: "Everyday Life",
    tags: ["Everyday Life", "N3", "Healthcare", "Hospital", "Dialogue"],
    paragraphs: [
      {
        sentences: [
          {
            ja: "朝起きた時から喉の奥が激しく痛み、体温計で熱を測ってみると三十八度五分もありました。",
            naturalEn: "From the moment I awoke in the morning, the back of my throat ached severely, and when I took my temperature with a thermometer, it was 38.5 degrees."
          },
          {
            ja: "風邪をこじらせてはいけないと思い、近所にある大きな総合病院の内科を受診することにしました。",
            naturalEn: "Thinking that I shouldn't let the cold worsen, I decided to consult the internal medicine department of a large nearby general hospital."
          },
          {
            ja: "正面玄関の受付窓口に行くと、親切な職員が「初めての方はこちらの問診票にご記入ください」と案内してくれました。",
            naturalEn: "When I went to the reception counter at the main entrance, a courteous staff member guided me: 'First-time patients, please fill out this medical questionnaire.'"
          },
          {
            ja: "健康保険証を提示した上で、待合室のソファに座り、現在の自覚症状やアレルギーの有無を丁寧に書き込みました。",
            naturalEn: "After presenting my health insurance card, I sat on a sofa in the waiting lounge and meticulously wrote down my current subjective symptoms and any allergies."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "三十分ほど待っているうちに、「三十五番の番号札をお持ちの田中さん、第一診察室へお入りください」とアナウンスが流れました。",
            naturalEn: "While waiting for about thirty minutes, an announcement called: 'Mr. Tanaka holding number ticket 35, please enter Examination Room 1.'"
          },
          {
            ja: "診察室のドアを軽く二回ノックして「失礼します」と挨拶しながら部屋に入ると、温和そうな医師が迎えてくれました。",
            naturalEn: "After lightly knocking twice on the consultation room door and saying 'Excuse me,' I stepped inside and was greeted by a gentle-looking physician."
          },
          {
            ja: "「いつ頃から喉の痛みや発熱が始まりましたか」と尋ねられ、昨日からの症状の経過を順を追って説明しました。",
            naturalEn: "Asked 'Around when did the throat pain and fever commence?', I explained the chronological progression of symptoms starting from yesterday."
          },
          {
            ja: "医師はペンライトで喉の腫れを入念に確認した上で、聴診器を胸と背中に当てて呼吸の音を注意深く聴いてくれました。",
            naturalEn: "After carefully checking the inflammation in my throat with a penlight, the doctor placed a stethoscope against my chest and back to listen intently to my breathing."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "「典型的な急性咽頭炎ですね。喉の炎症を抑える抗生剤と解熱剤を出しておきましょう」と診断が下されました。",
            naturalEn: "'It appears to be a textbook case of acute pharyngitis. Let us prescribe an antibiotic to reduce throat inflammation and an antipyretic for the fever,' he diagnosed."
          },
          {
            ja: "「熱が下がるまでは無理をせず、水分をこまめに補給して安静にするようにしてください」と助言を受けました。",
            naturalEn: "I received advice: 'Please refrain from overworking until your fever abates, stay hydrated frequently, and remain at rest.'"
          },
          {
            ja: "丁寧な診察のおかげで漠然とした不安が和らぎ、医師にお礼を述べて診察室を後にしました。",
            naturalEn: "Thanks to the thorough examination, my vague anxieties eased, and I thanked the physician before departing the examination room."
          },
          {
            ja: "自動精算機で診療費の支払いを済ませると、領収書と一緒に処方箋が機械から発行されました。",
            naturalEn: "Once I finished paying the medical fees at the automated payment machine, a prescription slip was dispensed alongside the receipt."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "病院のすぐ隣にある調剤薬局へ処方箋を持参すると、薬剤師がお薬手帳の確認をしてくれました。",
            naturalEn: "When I brought the prescription slip to the dispensing pharmacy adjacent to the hospital, the pharmacist checked my medicine record handbook."
          },
          {
            ja: "「このお薬は胃に負担がかかることがありますので、必ず食後に多めの水でお飲みください」と服薬指導を受けました。",
            naturalEn: "I received dosage counseling: 'Since this medicine may burden the stomach, please always take it after meals with plenty of water.'"
          },
          {
            ja: "薬局を出た私は、指示通りに栄養のある温かいおかゆを食べて、処方された薬を飲んですぐに布団に入りました。",
            naturalEn: "Leaving the pharmacy, I ate nutritious warm rice porridge as instructed, took the prescribed medication, and immediately climbed into bed."
          },
          {
            ja: "二日ほど十分な休養を取ったおかげで熱も無事に下がり、健康のありがたさを改めて実感することになりました。",
            naturalEn: "Thanks to taking ample rest for about two days, my fever safely broke, and I came to appreciate once again the blessing of good health."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "身体に異変を感じた際には、我慢せずに早めに専門の医療機関に相談することが何よりも大切だと心に留めました。",
            naturalEn: "I etched into my heart that whenever noticing bodily abnormalities, consulting a specialized medical facility early without enduring in silence is most paramount."
          },
          {
            ja: "自分の体を正しく管理し、無理をしない生活習慣を心がけることこそが社会人の基本であると学びました。",
            naturalEn: "I learned that managing one's body properly and keeping in mind lifestyle habits without overworking is the cornerstone of being a working professional."
          }
        ]
      }
    ],
    quiz: [
      {
        question: "診察を受ける前に受付で記入するように案内された書類は何ですか。",
        questionEn: "What document was the patient guided to fill out at the reception before receiving the examination?",
        options: [
          "現在の症状やアレルギーを記入する問診票",
          "病院の会員登録申込書",
          "薬の注文書",
          "海外旅行保険の請求書"
        ],
        optionsEn: [
          "A medical questionnaire detailing current symptoms and allergies",
          "A hospital membership registration form",
          "A medication order form",
          "An overseas travel insurance claim form"
        ],
        answerIndex: 0,
        explanation: "初診受付では、健康保険証の提示とともに症状や体質を申告する「問診票」の記入が求められます。"
      },
      {
        question: "調剤薬局の薬剤師から受けた服薬指導の内容として正しいものはどれですか。",
        questionEn: "Which of the following is correct regarding the dosage instructions given by the pharmacist?",
        options: [
          "胃に負担がかかるため、食後に多めの水で飲むこと",
          "朝起きてすぐに水なしで噛み砕いて飲むこと",
          "お茶やジュースと一緒に一気に飲むこと",
          "熱が出た時だけ夜中に飲むこと"
        ],
        optionsEn: [
          "Take after meals with plenty of water because it may burden the stomach",
          "Chew and swallow without water immediately upon waking in the morning",
          "Drink in one gulp along with tea or juice",
          "Take in the middle of the night only when a fever strikes"
        ],
        answerIndex: 0,
        explanation: "薬剤師からは「胃への負担を防ぐため、必ず食後に多めの水で服用するように」と注意がありました。"
      },
      {
        question: "この体験を通じて語り手が実感した教訓は何ですか。",
        questionEn: "What lesson did the narrator appreciate through this experience?",
        options: [
          "身体の異変を感じたら我慢せず、早めに医療機関を受診することの大切さ",
          "風邪を引いた時は冷たい水をがぶ飲みして運動すること",
          "薬は病院に行かずに通販だけで済ませた方が安上がりだということ",
          "熱があっても休まずに会社へ出勤すべきだということ"
        ],
        optionsEn: [
          "The importance of seeking medical care promptly without enduring pain when feeling unwell",
          "Gulping down cold water and exercising whenever catching a cold",
          "That purchasing medicine online without visiting a doctor is cheaper",
          "That one should report to work without taking leave even with a fever"
        ],
        answerIndex: 0,
        explanation: "体調不良を我慢して悪化させるのではなく、迅速に受診して休養を取る重要性を深く実感しました。"
      }
    ]
  },

  // 2. Post Office Procedures (郵便局での手続き)
  {
    id: "story-n3-post-office",
    slug: "post-office",
    title: "郵便局での手続き：海外への小包発送",
    titleRomaji: "Yuubinkyoku de no Tetsuduki: Kaigai e no Kozutsumi Hassou",
    titleEn: "Post Office Procedures: Sending an International Parcel",
    category: "Everyday Life",
    tags: ["Everyday Life", "N3", "Postal", "Logistics", "Dialogue"],
    paragraphs: [
      {
        sentences: [
          {
            ja: "留学中の親友の誕生日に合わせて、日本の伝統的なお菓子や文房具を詰め合わせた小包を送ることにしました。",
            naturalEn: "To coincide with the birthday of a dear friend studying abroad, I decided to send a care package packed with traditional Japanese snacks and stationery."
          },
          {
            ja: "海外への発送手続きは初めてだったため、段ボール箱を抱えて最寄りの郵便局の窓口を訪ねました。",
            naturalEn: "Since it was my first time shipping overseas, I held the cardboard carton in both arms and visited the counter of the nearest post office."
          },
          {
            ja: "局内に入ると番号札発券機があり、「郵便・国際郵便」のボタンを押して順番を待つことにしました。",
            naturalEn: "Upon entering the branch, there was a ticket dispenser, and I pressed the button for 'Mail & International Mail' to await my turn."
          },
          {
            ja: "番号が呼ばれて指定のカウンターへ向かうと、ベテランの局員が「本日はどのようなご用件でしょうか」と尋ねてくれました。",
            naturalEn: "When my number was summoned and I approached the designated counter, a veteran postal officer asked: 'How may I assist you today?'"
          }
        ]
      },
      {
        sentences: [
          {
            ja: "「オーストラリアに住んでいる友人にプレゼントの荷物を送りたいのですが」と相談を持ちかけました。",
            naturalEn: "I inquired: 'I would like to dispatch a gift parcel to a friend residing in Australia.'"
          },
          {
            ja: "局員は秤の上に小包を載せて計量しながら、「航空便や船便などいくつか方法がございます」と丁寧に説明してくれました。",
            naturalEn: "Placing the parcel onto the scale for weighing, the officer courteously explained: 'We have several methods, such as airmail and surface sea mail.'"
          },
          {
            ja: "「EMS（国際スピード郵便）をご利用いただければ、三日から四日ほどで追跡番号付きでお届けできます」とのことでした。",
            naturalEn: "'If you utilize EMS (Express Mail Service), it will be delivered in roughly three to four days with an online tracking number,' he informed me."
          },
          {
            ja: "友人の誕生日までに確実に届けたかったため、少し料金は高いもののEMSを利用することに決めました。",
            naturalEn: "Wanting it to arrive reliably by my friend's birthday, I opted for EMS despite the somewhat higher postal fee."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "現在、国際郵便では手書きの送り状ではなく、事前にスマートフォンで入力する税関告知書が必要となっています。",
            naturalEn: "Presently for international post, rather than handwritten waybills, an advance customs declaration completed via smartphone is required."
          },
          {
            ja: "局員がタブレット端末の操作方法を優しく教えてくれたおかげで、内容品の品名や個数、価格を英語でスムーズに入力できました。",
            naturalEn: "Thanks to the clerk kindly guiding me through the tablet operations, I smoothly entered the item names, quantities, and values in English."
          },
          {
            ja: "「危険物やスプレー缶、リチウム電池などは一切入っておりませんか」と安全確認のための質問を受けました。",
            naturalEn: "I was asked safety confirmation questions: 'Are there any hazardous materials, aerosol spray cans, or lithium batteries contained within?'"
          },
          {
            ja: "お菓子と手紙だけであることを確認し、印刷されたバーコードラベルを箱の天面にしっかりと貼り付けました。",
            naturalEn: "Confirming that only confectioneries and a letter were enclosed, I firmly affixed the printed barcode label onto the top of the box."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "窓口での手続きを終えるついでに、記念切手のコレクションシートも何枚か購入することにしました。",
            naturalEn: "While wrapping up the counter procedures, I also decided to purchase a few commemorative stamp collector sheets."
          },
          {
            ja: "「追跡番号はこちらのお控えに記載されておりますので、配達状況をご確認いただけます」と領収書を手渡されました。",
            naturalEn: "'The tracking number is printed on this receipt slip, so you may monitor the transit status online,' he said, handing me the receipt."
          },
          {
            ja: "無事に手続きが完了した安堵感に包まれながら、私は郵便局の自動ドアを出て家路につきました。",
            naturalEn: "Enveloped in a deep sense of relief that the procedures concluded smoothly, I exited through the automatic doors and headed home."
          },
          {
            ja: "四日後、友人から「サプライズの荷物が無事に届いたよ、ありがとう！」と嬉しそうなメッセージが届いたのです。",
            naturalEn: "Four days later, a joyful message arrived from my friend: 'The surprise package arrived safely, thank you so much!'"
          }
        ]
      },
      {
        sentences: [
          {
            ja: "言葉や距離の壁を越えて大切な人に気持ちを届ける喜びを、郵便という仕組みを通じて心から実感することができました。",
            naturalEn: "Through the mechanism of the postal network, I was able to truly appreciate the profound joy of delivering heartfelt warmth to a loved one across barriers of language and distance."
          },
          {
            ja: "遠く離れて暮らしていても、手紙や贈り物を交わすことで友情の絆をいつでも温め直すことができるのです。",
            naturalEn: "Even while living far apart, exchanging letters and gifts allows us to rekindle the bonds of friendship anytime."
          }
        ]
      }
    ],
    quiz: [
      {
        question: "語り手がオーストラリアへの発送方法としてEMS（国際スピード郵便）を選んだ理由は何ですか。",
        questionEn: "Why did the narrator choose EMS (Express Mail Service) for shipping to Australia?",
        options: [
          "友人の誕生日までに3〜4日で確実に届き、追跡番号も付いていたから",
          "船便よりも料金が一番安かったから",
          "局員に無理やり契約させられたから",
          "他の発送手段がすべて利用停止になっていたから"
        ],
        optionsEn: [
          "It would arrive reliably within 3-4 days by the friend's birthday and included tracking",
          "It was the cheapest of all methods, even less than surface sea mail",
          "The postal clerk forcibly pressured them into the contract",
          "All other shipping alternatives had been completely suspended"
        ],
        answerIndex: 0,
        explanation: "期日までに確実に送り届けたいという目的があり、迅速さと荷物追跡ができるEMSが最適でした。"
      },
      {
        question: "国際郵便を送る際、現在必須となっている手続きはどれですか。",
        questionEn: "Which procedure is currently mandatory when dispatching international post?",
        options: [
          "内容品の品名や価格を事前に電子的に入力する税関告知書の手続き",
          "荷物の中に必ず現金1万円を入れておくこと",
          "郵便局長と記念写真を撮影すること",
          "荷物をすべて透明なビニール袋に入れ直すこと"
        ],
        optionsEn: [
          "The customs declaration procedure of entering item names and values electronically in advance",
          "Ensuring a 10,000 yen cash bill is enclosed inside the package",
          "Taking a commemorative photograph alongside the postmaster",
          "Repacking all contents into a transparent plastic bag"
        ],
        answerIndex: 0,
        explanation: "国際郵便では安全基準と税関管理のため、スマートフォン等による電子的な税関告知データの事前登録が義務化されています。"
      },
      {
        question: "小包を発送するついでに、語り手が窓口で購入したものは何ですか。",
        questionEn: "What did the narrator purchase at the postal counter while finishing the parcel dispatch?",
        options: [
          "記念切手のコレクションシート",
          "新しい段ボール箱とガムテープ",
          "郵便局限定のレトルトカレー",
          "年賀状の印刷カタログ"
        ],
        optionsEn: [
          "Commemorative stamp collector sheets",
          "Brand-new cardboard cartons and packing tape",
          "Post-office-exclusive instant curry pouches",
          "New Year's greeting card printing catalogs"
        ],
        answerIndex: 0,
        explanation: "「窓口での手続きを終えるついでに、記念切手のコレクションシートも何枚か購入することにしました」と述べられています。"
      }
    ]
  },

  // 3. Ryokan / Hotel Check-in (旅館・ホテルのチェックイン)
  {
    id: "story-n3-hotel-check-in",
    slug: "hotel-check-in",
    title: "旅館のチェックイン：伝統のおもてなしと温泉",
    titleRomaji: "Ryokan no Chekkuin: Dentou no Omotenashi to Onsen",
    titleEn: "Ryokan Check-in: Traditional Hospitality and Hot Springs",
    category: "Everyday Life",
    tags: ["Everyday Life", "N3", "Travel", "Hot Springs", "Hospitality"],
    paragraphs: [
      {
        sentences: [
          {
            ja: "週末の休暇を利用して、古い歴史を持つ山あいの温泉街にある老舗旅館を訪れることにしました。",
            naturalEn: "Taking advantage of the weekend holidays, I decided to visit a venerable historic ryokan located in a mountain hot-spring town."
          },
          {
            ja: "温泉街の細い坂道を登っていくと、立派な瓦屋根と木造の門構えが美しい旅館の玄関が見えてきました。",
            naturalEn: "Climbing the narrow slope of the onsen town, the entrance of the inn, adorned with fine tiled roofs and timber gates, came into view."
          },
          {
            ja: "引き戸を開けて暖簾をくぐると、「いらっしゃいませ、遠路はるばるようこそお越しくださいました」と仲居さんが笑顔で出迎えてくれました。",
            naturalEn: "When I opened the sliding door and passed beneath the noren curtain, a smiling nakai hostess welcomed me: 'Welcome! Thank you for traveling such a long way to visit us.'"
          },
          {
            ja: "玄関で靴を脱いで用意された畳のスリッパに履き替え、帳場と呼ばれるフロントカウンターへ案内されました。",
            naturalEn: "Shedding my shoes in the entryway and slipping into prepared tatami slippers, I was escorted to the front counter known as the chouba."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "宿泊カードに氏名、住所、連絡先を記入すると、フロントの係員が宿泊プランの内容を丁寧に確認してくれました。",
            naturalEn: "As I inscribed my name, address, and contact number onto the registration card, the front desk clerk meticulously verified my accommodation booking."
          },
          {
            ja: "「ご夕食は季節の会席料理をご用意しております。六時半または七時からお選びいただけますが、どちらがよろしいでしょうか」と尋ねられました。",
            naturalEn: "'For dinner, we prepare seasonal kaiseki banquet cuisine. You may select between 6:30 or 7:00; which would you prefer?' I was asked."
          },
          {
            ja: "温泉にゆっくり入ってから食事を楽しみたかったので、七時からの時間帯をお願いすることにしました。",
            naturalEn: "Wanting to luxuriate in the hot springs before savoring dinner, I requested the 7:00 PM sitting."
          },
          {
            ja: "続いて明日の朝食に関しても、和食御膳と洋食プレートのどちらを希望するか好みを伝えることになりました。",
            naturalEn: "Next regarding tomorrow's breakfast, I also conveyed my preference between a traditional Japanese set meal and a Western breakfast plate."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "手続きが済むと、仲居さんが荷物を持って二階の客室「桜の間」まで案内してくれました。",
            naturalEn: "Once procedures concluded, the nakai carried my luggage and guided me to the second-floor guest quarters, the 'Sakura Room.'"
          },
          {
            ja: "い草の清々しい香りが漂う和室に入ると、床の間には季節の花が生けられ、窓からは静かな日本庭園が一望できました。",
            naturalEn: "Stepping into the Japanese-style room scented with fresh rush grass, seasonal blooms decorated the alcove, and a tranquil Japanese garden stretched before the window."
          },
          {
            ja: "仲居さんは急須でお茶を淹れて銘菓の温泉まんじゅうを振る舞いながら、大浴場の利用規則を説明してくれました。",
            naturalEn: "Brewing a pot of green tea and serving a renowned onsen steamed bun, she explained the operating guidelines of the grand communal baths."
          },
          {
            ja: "「大浴場と露天風呂は夜通しご利用いただけますが、午前二時に男女の暖簾が入れ替わることになっております」とのことでした。",
            naturalEn: "'The grand bath and open-air hot springs remain accessible throughout the night, but the men's and women's baths swap curtains at 2:00 AM,' she noted."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "浴衣のサイズを合わせてもらった後、私は早速浴衣と羽織を身にまとい、タオルを片手に露天風呂へと向かいました。",
            naturalEn: "After having my yukata size fitted, I immediately donned the robe and haori jacket, heading toward the open-air bath with a towel in hand."
          },
          {
            ja: "湯船に入る前にかけ湯をして身体を洗い流すという日本の入浴マナーを守り、岩造りの湯舟に静かに身を沈めました。",
            naturalEn: "Adhering to Japanese bathing etiquette of rinsing thoroughly before entering the tub, I quietly submerged my body into the rock pool."
          },
          {
            ja: "澄んだ山の空気を胸いっぱいに吸い込みながら温かい湯に浸かるうちに、日頃の仕事の疲れが綺麗に溶けていくようでした。",
            naturalEn: "Soaking in the steaming spring waters while inhaling the crisp alpine air, the fatigue accumulated from daily work seemed to dissolve away completely."
          },
          {
            ja: "夜には旬の山菜や地元の川魚を使った贅沢な会席料理を堪能し、至福のひとときを過ごすことができました。",
            naturalEn: "At night, I savored a lavish kaiseki banquet featuring seasonal wild mountain herbs and local river fish, basking in pure bliss."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "細やかな気配りと歴史あるもてなしの心に触れ、日本の伝統文化の奥深さを五感で味わう貴重な一日となりました。",
            naturalEn: "Touching upon meticulous attentiveness and centuries-old hospitality, it proved a treasured day to experience the profound depth of Japanese culture with all five senses."
          },
          {
            ja: "心身ともにリフレッシュした私は、明日からの新しい挑戦に向けて前向きな活力を満たすことができました。",
            naturalEn: "Refreshed in both mind and body, I was able to replenish positive vitality toward new endeavors starting tomorrow."
          }
        ]
      }
    ],
    quiz: [
      {
        question: "チェックイン時に語り手が夕食の開始時間を午後七時に指定した理由は何ですか。",
        questionEn: "Why did the narrator choose 7:00 PM as the dinner start time during check-in?",
        options: [
          "食事の前に温泉へゆっくり浸かってリフレッシュしたかったから",
          "仕事の電話会議が午後6時半まで予定されていたから",
          "午後6時半の回が満席で予約できなかったから",
          "お腹が全く空いていなかったから"
        ],
        optionsEn: [
          "Because they wanted to leisurely soak in the hot springs and refresh before dining",
          "Because a business teleconference was scheduled until 6:30 PM",
          "Because the 6:30 PM slot was fully booked and unavailable",
          "Because they were not hungry at all"
        ],
        answerIndex: 0,
        explanation: "「温泉にゆっくり入ってから食事を楽しみたかったので、七時からの時間帯をお願いすることにしました」と書かれています。"
      },
      {
        question: "旅館の温泉大浴場に関する利用規則について、正しい説明はどれですか。",
        questionEn: "Which statement is correct regarding the operating rules of the ryokan's hot spring baths?",
        options: [
          "夜通し利用できるが、午前二時に男女の浴室が入れ替わる規則になっている",
          "夜9時以降は完全消灯となり入浴できない",
          "水着を着用しなければ湯船に入ってはいけない",
          "露天風呂は有料の貸切予約しか受け付けていない"
        ],
        optionsEn: [
          "Baths are open throughout the night, but swap male and female sections at 2:00 AM",
          "Lights out completely at 9:00 PM and entry is barred thereafter",
          "One must wear swimwear to enter the bath waters",
          "The open-air bath only accepts paid private reservations"
        ],
        answerIndex: 0,
        explanation: "仲居さんから「夜通し使えるが、午前二時に男女の暖簾が入れ替わることになっている」と案内されました。"
      },
      {
        question: "日本の温泉において、湯船に入る前に守るべき最も基本的なマナーは何ですか。",
        questionEn: "What is the most fundamental etiquette to observe before stepping into a Japanese hot spring tub?",
        options: [
          "かけ湯をして身体を綺麗に洗い流してから湯船に入ること",
          "タオルを湯船の中に浸けて頭の上に載せること",
          "大きな声で挨拶してから飛び込むこと",
          "冷たい水を湯船に足して温度を下げること"
        ],
        optionsEn: [
          "Rinsing off the body thoroughly with warm water before entering the bath tub",
          "Soaking the towel directly inside the bath water and placing it on one's head",
          "Diving in after shouting a loud greeting to fellow bathers",
          "Adding cold tap water into the tub to cool the overall temperature"
        ],
        answerIndex: 0,
        explanation: "共同の湯を清潔に保つため、湯船に入る前に必ず洗い場で身体を流すのが日本の伝統的な入浴マナーです。"
      }
    ]
  },

  // 4. First Job Interview (初めての就職面接)
  {
    id: "story-n3-job-interview",
    slug: "job-interview",
    title: "初めての就職面接：緊張と自己PR",
    titleRomaji: "Hajimete no Shuushoku Mensetsu: Kinchou to Jiko Pii Aaru",
    titleEn: "First Job Interview: Nervousness and Self-Promotion",
    category: "Everyday Life",
    tags: ["Everyday Life", "N3", "Business", "Interview", "Keigo"],
    paragraphs: [
      {
        sentences: [
          {
            ja: "大学卒業後の進路として強く志望していた貿易会社の採用面接を受ける当日が、ついにやってきました。",
            naturalEn: "The day finally arrived to undergo a hiring interview at a trading firm I strongly aspired to join after university graduation."
          },
          {
            ja: "身だしなみを整えるため、皺一つない紺色のリクルートスーツに身を包み、鏡の前でネクタイの結び目を何度も直しました。",
            naturalEn: "To ensure my grooming was immaculate, I dressed in a wrinkle-free navy recruitment suit and readjusted the knot of my necktie repeatedly before the mirror."
          },
          {
            ja: "日本の就職活動では約束の十分前に到着することが鉄則とされているため、余裕をもってオフィスビルに到着しました。",
            naturalEn: "Because arriving ten minutes before the scheduled appointment is considered an ironclad rule in Japanese job hunting, I arrived at the office tower with plenty of time to spare."
          },
          {
            ja: "受付で「本日十時より面接のお約束をいただいております高橋と申します」と丁寧な敬語で挨拶を行いました。",
            naturalEn: "At the front desk, I greeted in polite keigo: 'I am Takahashi, scheduled for an interview starting at 10:00 today.'"
          }
        ]
      },
      {
        sentences: [
          {
            ja: "控室で順番を待つ間、心臓が早鐘のように高鳴り、手のひらにじっとりと汗が滲んできました。",
            naturalEn: "While awaiting my turn in the anteroom, my heart pounded like a ringing bell, and nervous sweat seeped into my palms."
          },
          {
            ja: "「高橋様、第二面接室へどうぞ」と担当者に案内され、私は深呼吸をして立ち上がりました。",
            naturalEn: "'Mr. Takahashi, please proceed to Interview Room 2,' the coordinator guided, and I stood up after taking a deep breath."
          },
          {
            ja: "面接室の扉の前に立ち、礼儀作法に従って「コン、コン、コン」と落ち着いて三回ノックをしました。",
            naturalEn: "Standing before the door of the interview room, I calmly knocked three times in accordance with proper business etiquette: 'knock, knock, knock.'"
          },
          {
            ja: "室内から「どうぞ」という声が聞こえたのを確認し、「失礼いたします」と発声しながら扉を静かに開けました。",
            naturalEn: "Confirming the response of 'Please come in' from within, I said 'Excuse me' as I quietly turned the door handle."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "椅子の左横に姿勢を正して立ち、面接官三名に向かって三十度の角度で深々と一礼をしました。",
            naturalEn: "Standing upright to the left of the chair, I bowed deeply at a thirty-degree angle toward the three interviewing executives."
          },
          {
            ja: "「お掛けください」と促されるのを待ってから「失礼いたします」と述べて着席しました。",
            naturalEn: "Waiting until prompted with 'Please be seated,' I replied 'Excuse me' before taking my seat."
          },
          {
            ja: "中央に座る人事部長から「まず初めに、三分程度で自己PRと志望動機をお願いします」と質問が投げかけられました。",
            naturalEn: "The HR director seated in the center posed the opening question: 'First of all, please present your self-promotion and motivation for applying in about three minutes.'"
          },
          {
            ja: "私は大学時代に力を注いだ異文化交流イベントの運営経験を挙げ、困難を乗り越えた調整力を熱意を込めて伝えました。",
            naturalEn: "Citing my experience managing intercultural exchange events during university, I passionately conveyed my coordination skills in overcoming obstacles."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "「もし海外支社への転勤を命じられた場合、どのように受け止めますか」という突っ込んだ質問も投げかけられました。",
            naturalEn: "A probing follow-up was also asked: 'If you were ordered to relocate to an overseas branch, how would you respond?'"
          },
          {
            ja: "「新しい環境に恐れず挑戦することこそ私の長所ですので、喜んで責任を果たしたいと存じます」と前向きに即答しました。",
            naturalEn: "I answered immediately in a positive tone: 'Embracing new challenges fearlessly is my greatest strength, so I would gladly fulfill that responsibility.'"
          },
          {
            ja: "面接の最後に「何か質問はありますか」と逆質問を促された際、事前に調べておいた新規事業展開について意欲的な質問を投げかけました。",
            naturalEn: "At the close of the interview when invited for reverse questions with 'Do you have any questions?', I posed an enthusiastic inquiry regarding their new business ventures researched in advance."
          },
          {
            ja: "面接官たちが満足そうに頷く姿を見て、手応えを感じながら「本日は貴重なお時間をいただき、誠にありがとうございました」と退室しました。",
            naturalEn: "Seeing the interviewers nod with satisfaction and feeling a palpable sense of accomplishment, I bowed and exited: 'Thank you very much for your precious time today.'"
          }
        ]
      },
      {
        sentences: [
          {
            ja: "一週間後、ポストに届いた採用内定の通知書を手にした瞬間、努力が報われた喜びに胸が熱くなりました。",
            naturalEn: "A week later, the instant I held the job offer notification letter delivered to my mailbox, my chest warmed with the profound joy of hard work rewarded."
          },
          {
            ja: "面接を通じて得た自信を胸に、春から始まる社会人生活への第一歩を堂々と踏み出したいと誓いました。",
            naturalEn: "Bearing the confidence gained through the interview, I vowed to stride proudly into the first steps of professional life commencing in spring."
          }
        ]
      }
    ],
    quiz: [
      {
        question: "日本の就職面接において、部屋に入る際の正しいノックの回数は何回とされていますか。",
        questionEn: "In Japanese job interviews, how many knocks on the door are considered standard business etiquette?",
        options: [
          "3回（トイレ等の空室確認が2回、面接等の入室は3回）",
          "1回だけ力強く叩く",
          "ノックは一切せずにいきなりドアを開ける",
          "10回以上リズミカルに叩き続ける"
        ],
        optionsEn: [
          "3 times (2 knocks is for checking restroom occupancy, 3 knocks is for formal room entry)",
          "Knocking once with great force",
          "Opening the door immediately without any knocking",
          "Tapping rhythmically over 10 times consecutively"
        ],
        answerIndex: 0,
        explanation: "日本の面接マナーでは、空室確認の2回と区別し、礼儀正しい入室合図として「3回ノック」が基本とされています。"
      },
      {
        question: "面接の最後に行われる「逆質問」の時間において、語り手はどのような質問をしましたか。",
        questionEn: "During the 'reverse question' time at the end of the interview, what inquiry did the narrator make?",
        options: [
          "事前に下調べしておいた会社の新規事業展開に関する意欲的な質問",
          "有給休暇が年間何日取れるかという質問",
          "社員食堂のランチが無料かどうかという質問",
          "特に何もないので何も質問しなかった"
        ],
        optionsEn: [
          "An ambitious question regarding the company's new business ventures researched in advance",
          "An inquiry about how many paid annual leave days are provided",
          "A question about whether the company cafeteria lunch is free of charge",
          "Asking nothing because there were no particular inquiries"
        ],
        answerIndex: 0,
        explanation: "事前に企業研究を行った上で、新規事業の将来展開について質問することで強い入社意欲をアピールしました。"
      },
      {
        question: "面接官から海外支社への転勤可能性を問われた際、語り手はどのように回答しましたか。",
        questionEn: "How did the narrator respond when asked about the possibility of an overseas branch transfer?",
        options: [
          "挑戦こそ自分の長所であり、喜んで責任を果たしたいと前向きに答えた",
          "海外は治安が悪くて怖いので絶対に断ると答えた",
          "給料が三倍になるなら考えても良いと答えた",
          "飛行機が苦手なので日本国内だけで働きたいと答えた"
        ],
        optionsEn: [
          "Answered proactively that challenges are their strength and they would gladly take on the duty",
          "Answered that they would refuse unconditionally because foreign countries are dangerous",
          "Answered that they might consider it if their salary was tripled",
          "Answered that they dislike airplanes and only want to work domestically in Japan"
        ],
        answerIndex: 0,
        explanation: "「新しい環境に恐れず挑戦することこそ私の長所」と前向きな姿勢を明確にアピールしました。"
      }
    ]
  },

  // 5. Convenience Store Part-Time (コンビニのアルバイト)
  {
    id: "story-n3-convenience-store-part-time",
    slug: "convenience-store-part-time",
    title: "コンビニのアルバイト：初めてのレジ研修と接客",
    titleRomaji: "Konbini no Arubaito: Hajimete no Reji Kenshuu to Sekkyaku",
    titleEn: "Convenience Store Part-Time: First Register Training and Customer Service",
    category: "Everyday Life",
    tags: ["Everyday Life", "N3", "Workplace", "Part-Time", "Keigo"],
    paragraphs: [
      {
        sentences: [
          {
            ja: "日本での生活費を補いながら生きた日本語を学ぶため、駅前の二十四時間営業のコンビニでアルバイトを始めました。",
            naturalEn: "To supplement living expenses in Japan while learning living Japanese, I started a part-time job at a 24-hour convenience store in front of the train station."
          },
          {
            ja: "初日のシフトでは、青と白のストライプ柄の制服ユニフォームに身を包み、店長から挨拶の徹底を叩き込まれました。",
            naturalEn: "On my first shift, donning the blue-and-white striped uniform, the store manager drilled the fundamentals of proper greetings into me."
          },
          {
            ja: "自動ドアが開くたびに、「いらっしゃいませ！」と明るく元気な声でお客様を迎えることから業務が始まります。",
            naturalEn: "Whenever the automatic sliding doors parted, our duties commenced by welcoming patrons with a bright, cheerful greeting of 'Irasshaimase!'"
          },
          {
            ja: "コンビニの仕事は単に商品を販売するだけでなく、実に多岐にわたる複雑な作業をこなさなければなりません。",
            naturalEn: "Working in a Japanese convenience store does not merely involve scanning products, but executing an extraordinarily diverse array of complex tasks."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "初めの研修では、先輩アルバイトの佐藤さんについてレジ端末の基本操作を一から習いました。",
            naturalEn: "In the initial training, I shadowed senior part-timer Sato to learn the basic operations of the POS register terminal from scratch."
          },
          {
            ja: "商品のバーコードをスキャナーで読み取る際、「ポイントカードはお持ちでしょうか」と尋ねることが決められています。",
            naturalEn: "When scanning product barcodes with the hand scanner, it is standard protocol to ask: 'Do you possess a store point card?'"
          },
          {
            ja: "さらにお弁当や惣菜を購入されたお客様に対しては、「お弁当は温めますか」と必ず一声かけるルールになっていました。",
            naturalEn: "Furthermore, for customers purchasing bento lunchboxes or prepared delicacies, it was an established rule to always ask: 'Would you like your bento warmed up?'"
          },
          {
            ja: "温めを希望された場合は業務用電子レンジに入れ、秒数ボタンを素早く押して手際よく加熱します。",
            naturalEn: "When heating was requested, we placed it into the commercial microwave, swiftly pressing the duration buttons to heat it deftly."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "「お箸やスプーンはお付けしますか」や「袋はご利用になりますか」といった確認も欠かせません。",
            naturalEn: "Confirmations like 'Would you like chopsticks or a spoon included?' and 'Will you be needing a shopping bag?' were likewise essential."
          },
          {
            ja: "レジ袋が有料化されたため、サイズや枚数をお客様の意向に合わせて選択する気配りが求められます。",
            naturalEn: "Because plastic shopping bags became fee-based, attentiveness was required to select the size and count matching the customer's wishes."
          },
          {
            ja: "夕方の帰宅ラッシュの時間帯になると、レジの前に長い行列ができ、息をつく暇もないほどの忙しさになりました。",
            naturalEn: "When the evening commute rush hour arrived, long lines formed before the cash registers, becoming busy to the point of scarcely having time to catch one's breath."
          },
          {
            ja: "焦って小銭のお釣りを間違えそうになりましたが、佐藤先輩が「落ち着いて一枚ずつ数えれば大丈夫だよ」と優しくフォローしてくれました。",
            naturalEn: "Frazzled, I came close to miscounting coin change, but senior Sato gently backed me up: 'Stay calm; as long as you count one coin at a time, you'll be fine.'"
          }
        ]
      },
      {
        sentences: [
          {
            ja: "接客の合間を縫って、トラックから搬入されたドリンクやおにぎりを棚に並べる「品出し」の作業も行いました。",
            naturalEn: "Stealing moments between customer service, we also performed 'restocking,' arranging bottled beverages and rice balls unloaded from trucks onto shelves."
          },
          {
            ja: "賞味期限が近い商品を一番手前に陳列する「先入れ先出し」のルールを守りながら、手早く補充を済ませました。",
            naturalEn: "Adhering to the 'first-in, first-out' rule of placing products closest to expiration at the very front, we swiftly completed replenishment."
          },
          {
            ja: "退勤時間となり制服を脱いだ瞬間、足の裏には心地よい疲労感が広がり、達成感で満たされていました。",
            naturalEn: "When clock-out time arrived and I took off the uniform, pleasant fatigue spread across the soles of my feet, filled with immense accomplishment."
          },
          {
            ja: "常連のお客様から「ありがとう、また来るね」と笑顔で声をかけてもらえたことが、何よりも嬉しい励みとなりました。",
            naturalEn: "Having a regular patron smile and say 'Thank you, I'll see you again!' became the greatest and most delightful encouragement of all."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "日々の細やかな気配りを通じて、日本の接客文化とおもてなしの精神を体で学べる素晴らしい経験となっています。",
            naturalEn: "Through daily thoughtful attentiveness, it has become a wonderful experience to absorb Japanese customer service culture and hospitality firsthand."
          },
          {
            ja: "これからも笑顔を絶やさず、地域のお客様に愛される店員になれるよう努力を続けていきたいです。",
            naturalEn: "I wish to continue striving without losing my smile so as to become a clerk beloved by the neighborhood patrons."
          }
        ]
      }
    ],
    quiz: [
      {
        question: "お弁当を購入したお客様に対して、レジで必ず確認することになっている質問は何ですか。",
        questionEn: "What question is protocol to always confirm at the register for customers buying a bento lunchbox?",
        options: [
          "「お弁当は温めますか」",
          "「お弁当の具材は何が入っていますか」",
          "「今すぐここで召し上がりますか」",
          "「賞味期限を気にされますか」"
        ],
        optionsEn: [
          "'Would you like your bento warmed up?'",
          "'What ingredients are inside this bento?'",
          "'Will you be eating this right here right now?'",
          "'Do you care about the expiration date?'"
        ],
        answerIndex: 0,
        explanation: "日本のコンビニでは、お弁当やお惣菜を購入した客に対して「温めますか」と尋ねるのが標準的な接客ルールです。"
      },
      {
        question: "商品を棚に並べる品出し作業において守らなければならない「先入れ先出し」とはどのようなルールですか。",
        questionEn: "What does the 'first-in, first-out' rule dictate when restocking goods onto convenience store shelves?",
        options: [
          "賞味期限が近い古い商品を棚の手前に並べること",
          "新しく届いた商品を一番手前に置くこと",
          "重い商品を一番上の棚に置くこと",
          "値段が高い商品を奥の見えない場所に隠すこと"
        ],
        optionsEn: [
          "Arranging older items with closer expiration dates at the very front of the shelf",
          "Placing newly arrived goods at the very front",
          "Placing the heaviest goods on the topmost shelf",
          "Hiding high-priced goods in the hidden back of the shelf"
        ],
        answerIndex: 0,
        explanation: "食品廃棄を防ぐため、先に入荷した（賞味期限の近い）商品を棚の手前に並べて先にお客様に取ってもらう仕組みです。"
      },
      {
        question: "初めてのシフトを終えた語り手にとって、最も大きな励みとなった出来事は何ですか。",
        questionEn: "What event served as the greatest encouragement for the narrator after concluding their first shift?",
        options: [
          "常連のお客様から「ありがとう、また来るね」と笑顔で声をかけてもらったこと",
          "店長から臨時ボーナスをもらったこと",
          "売れ残ったケーキを全部持ち帰れたこと",
          "レジのお金が一円も狂わなかったこと"
        ],
        optionsEn: [
          "A regular customer warmly saying with a smile: 'Thank you, I will come again!'",
          "Receiving an impromptu cash bonus from the store manager",
          "Taking home all the unsold cakes for free",
          "The register tally matching down to the exact single yen"
        ],
        answerIndex: 0,
        explanation: "お客様からの感謝の言葉と笑顔に直接触れられたことが、アルバイトとしての最高のやりがいと励みになりました。"
      }
    ]
  },

  // 6. Station Lost Property Center (駅の忘れ物センター)
  {
    id: "story-n3-lost-property",
    slug: "lost-property",
    title: "駅の忘れ物センター：電車の網棚に忘れた鞄",
    titleRomaji: "Eki no Wasuremono Sentaa: Densha no Amidana ni Wasureta Kaban",
    titleEn: "Station Lost Property Center: Bag Forgotten on the Train Rack",
    category: "Everyday Life",
    tags: ["Everyday Life", "N3", "Train", "Lost and Found", "Problem Solving"],
    paragraphs: [
      {
        sentences: [
          {
            ja: "朝の通勤電車を降りて会社の改札を出た瞬間、手に持っているはずのビジネスバッグがないことに気づいて青ざめました。",
            naturalEn: "The moment I exited the ticket gates at work after alighting from the morning commuter train, my face turned pale realizing the business briefcase I should have been holding was gone."
          },
          {
            ja: "混雑した車内で座席の上の網棚に鞄を載せたまま、読書に夢中になってうっかり置き忘れてしまったのです。",
            naturalEn: "While lost in reading a novel, I had carelessly left the bag resting on the overhead luggage rack in the crowded train carriage."
          },
          {
            ja: "中には仕事で使う重要な書類やノートパソコンが入っており、冷や汗が全身から噴き出してきました。",
            naturalEn: "Inside were crucial work documents and my laptop computer, causing cold sweat to pour from every pore of my body."
          },
          {
            ja: "慌てて駅の改札口へ引き返し、窓口にいた駅員に事情を必死に説明しました。",
            naturalEn: "Hurrying frantically back to the ticket barrier, I desperately explained my predicament to the station attendant on duty."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "「落ち着いてください。乗車された路線と時間帯、電車の特徴を教えていただけますか」と駅員は冷静に対応してくれました。",
            naturalEn: "'Please stay calm. Could you kindly tell me the railway line, time of travel, and features of the train?', the attendant responded placidly."
          },
          {
            ja: "私はスマートフォンの乗換案内アプリの履歴を確認し、「山手線内回りで、新宿駅を八時十五分に発車した電車の四両目です」と正確に答えました。",
            naturalEn: "Checking the trip history in my transit navigation app, I answered accurately: 'Yamanote Line inner loop, 4th carriage of the train departing Shinjuku at 8:15.'"
          },
          {
            ja: "さらに鞄の特徴について、黒色のナイロン製で青いキーホルダーが付いている旨を詳しく伝えました。",
            naturalEn: "Furthermore, regarding the bag's distinctive characteristics, I explained in detail that it was black nylon bearing a blue keyholder."
          },
          {
            ja: "駅員は専用端末で鉄道各駅の忘れ物データベースを迅速に照会してくれました。",
            naturalEn: "The attendant swiftly queried the shared lost-and-found database across railway stations using a specialized terminal."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "「終点の駅で車内点検を行った際、該当するお荷物が保管されたようです。現在、東京駅のお忘れ物センターに届けられています」と告げられました。",
            naturalEn: "'When performing onboard inspection at the terminal station, matching luggage appears to have been secured. It is currently at the Tokyo Station Lost Property Center,' he announced."
          },
          {
            ja: "荷物が盗まれることなく無事に見つかったことを知り、胸を撫で下ろして深く安堵しました。",
            naturalEn: "Learning that my luggage had been safely recovered without being stolen, I stroked my chest in profound relief."
          },
          {
            ja: "会社の上司に連絡を入れて遅延の事情を報告した後、私は電車に乗って東京駅のセンターへと向かいました。",
            naturalEn: "After calling my manager at the company to report the circumstances of my delay, I boarded a train bound for the Tokyo Station Center."
          },
          {
            ja: "センターに到着すると、受領手続きのために本人確認書類として運転免許証の提示を求められました。",
            naturalEn: "Arriving at the center, I was asked to present my driver's license as official identification for retrieval procedures."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "係員が奥の保管庫から黒い鞄を持ってきてくれ、中身のパソコンや財布がそのまま残っているか一つずつ確認しました。",
            naturalEn: "The clerk brought the black briefcase from the storage vault in the back, and we verified one by one whether the laptop and wallet inside were completely intact."
          },
          {
            ja: "何一つ紛失していないことを確認した上で、受け取り台帳に受領の署名と電話番号を記入しました。",
            naturalEn: "Confirming that not a single item was missing, I inscribed my receipt signature and phone number into the register ledger."
          },
          {
            ja: "対応してくれた係員に対し、「迅速に保管していただき、本当に助かりました」と深々と感謝の礼を述べました。",
            naturalEn: "To the attendant who assisted me, I bowed deeply in immense gratitude: 'Thank you so much for securing it so promptly; it truly saved me.'"
          },
          {
            ja: "落としたものがそのまま手元に戻ってくる日本の治安の良さと、鉄道職員の連携の素晴らしさに胸を打たれました。",
            naturalEn: "I was deeply moved by the incredible public safety in Japan where lost possessions return intact, as well as the wonderful coordination among railway staff."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "それ以来、電車から降りる際には必ず座席や網棚を振り返って確認する習慣をつけるようにしています。",
            naturalEn: "Ever since that incident, I make it an unbroken habit to always turn around and double-check my seat and overhead rack before stepping off a train."
          },
          {
            ja: "不注意による失敗を反省すると同時に、支えてくれた人々の親切に対する感謝をいつまでも忘れません。",
            naturalEn: "While reflecting on the blunder born of carelessness, I will never forget my enduring gratitude for the kindness of those who aided me."
          }
        ]
      }
    ],
    quiz: [
      {
        question: "電車の網棚に鞄を忘れた語り手に対し、駅員が確認した情報は何ですか。",
        questionEn: "What information did the station attendant confirm from the narrator who left their bag on the train rack?",
        options: [
          "乗車した路線、時間帯、車両の号車番号、および鞄の特徴",
          "カバンの購入価格とレシート",
          "会社の上司の電話番号と役職",
          "昨晩何時に就寝したかという睡眠時間"
        ],
        optionsEn: [
          "The railway line boarded, time range, train carriage number, and distinctive features of the bag",
          "The purchase price and sales receipt of the briefcase",
          "The phone number and executive title of the company supervisor",
          "Sleeping hours detailing what time they went to bed last night"
        ],
        answerIndex: 0,
        explanation: "忘れ物を迅速に特定するため、乗車路線、発車時刻、号車番号、鞄の色や装飾（青いキーホルダー）を詳細に確認しました。"
      },
      {
        question: "お忘れ物センターで荷物を受け取る際に必要とされた手続きは何ですか。",
        questionEn: "What procedure was required when receiving the luggage at the Lost Property Center?",
        options: [
          "運転免許証などの本人確認書類の提示と受領台帳への署名",
          "保管手数料として現金5万円の支払い",
          "荷物の中身をすべて写真に撮ってSNSに投稿すること",
          "駅長への謝罪文の提出"
        ],
        optionsEn: [
          "Presenting personal ID such as a driver's license and signing the receipt ledger",
          "Paying a cash storage handling fee of 50,000 yen",
          "Photographing all contents inside the bag and posting them to social media",
          "Submitting a formal written letter of apology to the stationmaster"
        ],
        answerIndex: 0,
        explanation: "持ち主本人であることを確認するため、公的な身分証明書の提示と受け取りサインの記入が求められます。"
      },
      {
        question: "この事件を経て、語り手が身につけた新しい習慣は何ですか。",
        questionEn: "What new habit did the narrator cultivate following this event?",
        options: [
          "電車から降りる際に必ず座席や網棚を振り返って確認すること",
          "二度と電車に乗らずに毎日歩いて通勤すること",
          "荷物を一切持たずに手ぶらで会社へ行くこと",
          "網棚に荷物を載せた人を注意して回ること"
        ],
        optionsEn: [
          "Always turning around to inspect the seat and overhead luggage rack before alighting",
          "Never boarding trains again and walking to work on foot daily",
          "Going to the company entirely empty-handed without any luggage",
          "Going around lecturing passengers who place luggage on overhead racks"
        ],
        answerIndex: 0,
        explanation: "二度と忘れ物をしないよう、下車時に網棚や座席を振り返って点検する習慣を徹底するようになりました。"
      }
    ]
  },

  // 7. Apartment Hunting & Viewing (部屋探しと内見)
  {
    id: "story-n3-apartment-hunting",
    slug: "apartment-hunting",
    title: "部屋探しと内見：理想の住まいを見つける",
    titleRomaji: "Heyasagashi to Naiken: Risou no Sumai o Mitsukeru",
    titleEn: "Apartment Hunting & Viewing: Finding the Ideal Home",
    category: "Everyday Life",
    tags: ["Everyday Life", "N3", "Housing", "Real Estate", "Dialogue"],
    paragraphs: [
      {
        sentences: [
          {
            ja: "来月から新しい職場に通勤することになり、会社まで三十分以内で通える賃貸アパートを探すことにしました。",
            naturalEn: "Having been arranged to commute to a new workplace starting next month, I decided to search for a rental apartment within thirty minutes of the company."
          },
          {
            ja: "インターネットの不動産情報サイトで希望条件に合う物件を何件か絞り込み、駅前の不動産屋へ相談に行きました。",
            naturalEn: "Narrowing down several properties matching my desired criteria on an internet real estate portal, I visited an agency in front of the station for consultation."
          },
          {
            ja: "担当の営業スタッフが「予算や間取りのご希望を詳しくお聞かせいただけますか」と図面を広げてくれました。",
            naturalEn: "The sales agent unfolded floor plans: 'Could you please tell me your detailed wishes regarding budget and layout?'"
          },
          {
            ja: "私は「家賃は管理費込みで七万五千円以内、駅から徒歩十分以内の一階以上の部屋を希望します」と条件を伝えました。",
            naturalEn: "I stated my conditions: 'I wish for rent within 75,000 yen including maintenance fees, within a ten-minute walk from the station, on the second floor or higher.'"
          }
        ]
      },
      {
        sentences: [
          {
            ja: "スタッフは何枚かの物件資料を見比べながら、「築浅で南向き、日当たりの良いワンケー（1K）のお部屋がちょうど空きました」と勧めてくれました。",
            naturalEn: "Comparing several property specification sheets, the agent recommended: 'A recently built, south-facing 1K apartment with abundant sunlight just became vacant.'"
          },
          {
            ja: "「百聞は一見に如かずと言いますから、実際に現地へ内見に行ってみましょう」ということになり、社用車で向かいました。",
            naturalEn: "Deciding that 'seeing is believing, so let us go for an on-site property viewing,' we headed over in the agency car."
          },
          {
            ja: "物件は閑静な住宅街に位置しており、駅からの道中にはスーパーやコンビニ、ドラッグストアが揃っていて非常に便利でした。",
            naturalEn: "The property was situated in a quiet residential district, and along the route from the station were supermarkets, convenience stores, and drugstores, making it extremely convenient."
          },
          {
            ja: "オートロック付きのエントランスを通り、エレベーターで三階の角部屋へと案内されました。",
            naturalEn: "Passing through the auto-locking entrance lobby, I was guided by elevator to the corner unit on the third floor."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "部屋に入ると、大きな窓から明るい午後の日差しが差し込み、風通しも良好でした。",
            naturalEn: "Upon entering the apartment, bright afternoon sunlight streamed through the expansive windows, and the ventilation was delightful."
          },
          {
            ja: "メジャーを取り出して冷蔵庫置き場や洗濯機パンの寸法を測り、手持ちの家電製品が収まるかどうかを入念に調べました。",
            naturalEn: "Pulling out a tape measure, I checked the dimensions of the refrigerator space and washing machine tray to see if my appliances would fit."
          },
          {
            ja: "さらに窓を閉めて耳を澄まし、近隣の電車の走行音や道路の騒音が気にならないか遮音性を確かめました。",
            naturalEn: "Furthermore, closing the windows and listening intently, I tested the soundproofing to ensure that running train sounds or traffic noise did not bother me."
          },
          {
            ja: "お風呂とトイレが別々になっているセパレートタイプで、独立洗面台まで完備されている点も大きな魅力でした。",
            naturalEn: "The fact that it was a separate-style layout with detached bath and toilet, fully equipped even with an independent vanity, was a major appeal."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "不動産屋の店舗に戻った後、契約にかかる初期費用の見積書を作成してもらいました。",
            naturalEn: "After returning to the real estate branch, I had an estimate breakdown prepared detailing the upfront initial costs for the contract."
          },
          {
            ja: "家賃の他に、敷金が一ヶ月分、礼金が一ヶ月分、さらに仲介手数料や火災保険料が必要になると説明を受けました。",
            naturalEn: "I was explained that in addition to rent, one month's security deposit, one month's key money, agent commission fees, and fire insurance would be required."
          },
          {
            ja: "条件面でも予算面でも申し分がなかったため、入居審査を申し込むための申込書に署名を行いました。",
            naturalEn: "Because it was flawless in both living conditions and budget aspects, I signed the application form to submit for tenancy screening."
          },
          {
            ja: "「審査には三日ほどかかりますので、結果が出次第すぐにご連絡いたします」と笑顔で見送られました。",
            naturalEn: "'The tenant screening takes about three days, so we will contact you immediately once results emerge,' I was seen off with a smile."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "自分自身の目で確かめて納得のいく住まいを選べたことで、来月からの新生活に対する期待が一気に膨らみました。",
            naturalEn: "Having verified with my own eyes and selected a thoroughly satisfying residence, my anticipation for the brand-new life starting next month swelled boundless."
          },
          {
            ja: "快適なお城となる新しい部屋で、仕事もプライベートも充実した毎日を送りたいと胸を躍らせています。",
            naturalEn: "In my new room that will serve as a comfortable sanctuary, my heart dances with excitement to lead a fulfilling life both professionally and personally."
          }
        ]
      }
    ],
    quiz: [
      {
        question: "語り手が内見の際にメジャーを使って確認したことは何ですか。",
        questionEn: "What did the narrator verify using a tape measure during the property viewing?",
        options: [
          "手持ちの冷蔵庫や洗濯機が指定の置き場に収まるかどうかの寸法",
          "天井の高さが2メートル以上あるかどうか",
          "靴箱に靴が何足入るかという奥行き",
          "ベランダの手すりの太さ"
        ],
        optionsEn: [
          "Dimensions to see whether their refrigerator and washing machine would fit designated spaces",
          "Whether the ceiling height exceeded two meters",
          "The depth of the shoe rack to calculate how many pairs of shoes fit",
          "The thickness of the balcony railing"
        ],
        answerIndex: 0,
        explanation: "手持ちの大型家電が設置スペースにきちんと収まるか、幅や奥行きの実測を行うのは内見時の必須ポイントです。"
      },
      {
        question: "日本の賃貸契約において「敷金（しききん）」とは主にどのような目的のお金ですか。",
        questionEn: "In Japanese rental contracts, what is the primary purpose of the 'shikikin' (security deposit)?",
        options: [
          "退去時の原状回復費用や家賃滞納に備えて大家に預けておく担保金",
          "部屋を貸してくれた大家へのお礼として返還されない謝礼金",
          "不動産仲介会社に支払う成功報酬の手数料",
          "近隣住民に挨拶するために配るお菓子代"
        ],
        optionsEn: [
          "Collateral deposited with the landlord to cover restoration costs upon vacating or rent arrears",
          "A non-refundable monetary gift given to the landlord in gratitude for renting the room",
          "The success fee paid to the real estate intermediary agency",
          "Money for gift sweets distributed to greet nearby neighbors"
        ],
        answerIndex: 0,
        explanation: "敷金は担保金（預け金）であり、修繕費等を差し引いて退去時に返還されます（礼金は返還されないお礼金です）。"
      },
      {
        question: "この部屋を気に入った決め手として挙げられている設備の特徴は何ですか。",
        questionEn: "What equipment feature was cited as a major decisive appeal for liking this apartment?",
        options: [
          "日当たりが良く、お風呂とトイレが別々で独立洗面台が完備されていた点",
          "屋上に大きなプールとサウナが付いていた点",
          "家賃が千円だけで光熱費もタダだった点",
          "家具やテレビが最初から全部プレゼントされた点"
        ],
        optionsEn: [
          "Abundant sunlight, detached bath and toilet, and an independent vanity unit",
          "A large rooftop pool and sauna facility",
          "Rent being only 1,000 yen with utilities entirely free",
          "All furniture and television sets being gifted free from the start"
        ],
        answerIndex: 0,
        explanation: "「南向きで日当たり良好、風呂トイレ別のセパレートで独立洗面台完備」が快適な住まいの決定打となりました。"
      }
    ]
  },

  // 8. Morning Train Delay (朝の電車遅延)
  {
    id: "story-n3-train-delay",
    slug: "train-delay",
    title: "朝の電車遅延：通勤ラッシュのアクシデント",
    titleRomaji: "Asa no Densha Chien: Tsuukin Rasshu no Akushidento",
    titleEn: "Morning Train Delay: Rush Hour Transit Accident",
    category: "Everyday Life",
    tags: ["Everyday Life", "N3", "Commute", "Train", "Workplace Manners"],
    paragraphs: [
      {
        sentences: [
          {
            ja: "朝の通勤ラッシュに揺られながら、私はいつも通り会社の始業時刻の三十分前に着く電車に乗っていました。",
            naturalEn: "Swaying in the morning commuter rush, I was riding the train scheduled to arrive thirty minutes prior to my company's workday start as usual."
          },
          {
            ja: "ところが駅と駅の間のトンネルの中で、突然激しいブレーキ音とともに電車が急停車してしまったのです。",
            naturalEn: "However, inside the tunnel between stations, the train made a sudden emergency stop accompanied by the screeching of sharp brakes."
          },
          {
            ja: "「ただいま前方の中野駅において信号確認を行っているため、運転を見合わせております」と車内アナウンスが流れました。",
            naturalEn: "'Currently, due to a signal inspection taking place ahead at Nakano Station, operations are temporarily suspended,' an onboard announcement broadcast."
          },
          {
            ja: "満員電車の車内には重苦しい空気が漂い、時計を見つめながらため息をつく乗客の姿が目立ち始めました。",
            naturalEn: "A heavy, suffocating atmosphere drifted through the packed train carriage, and passengers sighing while checking their watches became conspicuous."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "十分が経過しても電車が動く気配はなく、九時からの重要な朝会に間に合わない可能性が高まってきました。",
            naturalEn: "Even after ten minutes passed, there was no sign of the train moving, and the probability of missing our crucial 9:00 AM morning meeting soared."
          },
          {
            ja: "社会人として無断遅刻は絶対に許されないため、スマートフォンを取り出して会社の上司に連絡を入れることにしました。",
            naturalEn: "Because unnotified tardiness is strictly impermissible for a working professional, I retrieved my smartphone to contact my supervisor."
          },
          {
            ja: "車内での通話はマナー違反となるため、社内チャットツールを使って迅速に状況を報告しました。",
            naturalEn: "Since speaking on the phone onboard is a breach of etiquette, I swiftly reported the situation using our company chat application."
          },
          {
            ja: "「現在、信号トラブルにより電車が停車中で、運転再開の見込みが立っていません。到着が遅れます」とメッセージを送信しました。",
            naturalEn: "'Currently, the train is halted due to signal trouble with no estimated resumption time. My arrival will be delayed,' I transmitted."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "上司からすぐに「了解しました。安全第一で無理をせず向かってください」と温かい返信が届き、焦る気持ちが落ち着きました。",
            naturalEn: "A reassuring reply arrived promptly from my supervisor: 'Understood. Put safety first and proceed without rushing,' calming my agitated nerves."
          },
          {
            ja: "停車から約二十五分後、ようやく信号が復旧し、電車は徐行運転で次の主要ターミナル駅へと滑り込みました。",
            naturalEn: "Roughly twenty-five minutes after stopping, the signal was finally restored, and the train glided into the next major terminal station at slow speed."
          },
          {
            ja: "駅構内では「他社線への振替輸送を実施しております」と駅員が拡声器で案内を行っていました。",
            naturalEn: "Inside the station concourse, attendants were directing crowds via megaphones: 'Alternative transfer transportation is in effect on other rail lines.'"
          },
          {
            ja: "私は改札口の窓口へ向かい、電車が遅れたことを証明するための「遅延証明書」を駅員から受け取りました。",
            naturalEn: "I headed to the ticket barrier counter and received a 'Delay Certificate' from the station attendant proving the train's delay."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "最近では紙の証明書だけでなく、鉄道会社の公式ウェブサイトから電子版の証明書をダウンロードすることも可能になっています。",
            naturalEn: "Nowadays, alongside paper slips, it has also become possible to download an electronic certificate directly from the railway company's website."
          },
          {
            ja: "地下鉄の振替ルートを利用して迂回した結果、始業時刻から約十五分遅れてオフィスに到着しました。",
            naturalEn: "Bypassing the disruption using the subway's alternative transit route, I arrived at the office roughly fifteen minutes past the official start time."
          },
          {
            ja: "受付を通って部署に入ると、上司や同僚に向かって「電車遅延のため遅れてしまい、大変申し訳ありませんでした」と一礼しました。",
            naturalEn: "Passing reception and entering the department, I bowed to my supervisor and colleagues: 'I apologize profusely for my delay due to train disruptions.'"
          },
          {
            ja: "人事部に遅延証明書を提出したことで、電車の遅れによる正当な遅刻として処理され、ペナルティを受けることはありませんでした。",
            naturalEn: "By submitting the delay certificate to HR, it was officially processed as a justified transit delay without incurring any disciplinary penalty."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "突発的なトラブルに見舞われても、事前の連絡と確実な証明書類の提出を行うことの大切さを学んだ一日となりました。",
            naturalEn: "It proved a day where I learned the paramount importance of prompt advance communication and submitting proper documentation whenever struck by sudden mishaps."
          },
          {
            ja: "どのような予期せぬ状況に遭遇しても、冷静沈着に対処できる責任感をこれからも培っていきたいです。",
            naturalEn: "Whatever unexpected situations I encounter, I wish to continue cultivating the sense of responsibility to cope with cool-headed composure."
          }
        ]
      }
    ],
    quiz: [
      {
        question: "満員電車の中で急停車した際、語り手が上司への連絡手段として電話ではなくチャットを選んだ理由は何ですか。",
        questionEn: "Why did the narrator choose chat over a phone call when contacting their supervisor inside the halted train?",
        options: [
          "日本の電車内での携帯電話による通話はマナー違反とされているから",
          "スマートフォンの通話機能が故障していたから",
          "上司が耳が遠くて電話の声が聞こえないから",
          "チャットの方が文字数が多く打てるから"
        ],
        optionsEn: [
          "Speaking on mobile phones inside Japanese train carriages is considered bad etiquette",
          "The smartphone's telephone calling hardware was broken",
          "The supervisor was hard of hearing and could not hear over the phone",
          "Chat allows typing a greater volume of text characters"
        ],
        answerIndex: 0,
        explanation: "日本の公共交通機関では、車内通話は周囲への迷惑マナー違反となるため、メールやチャットで連絡するのが常識です。"
      },
      {
        question: "電車遅延が原因で会社に遅刻した際、正当な理由であることを会社に証明するために提出する書類は何ですか。",
        questionEn: "What document is submitted to the company to prove that tardiness was due to legitimate train delays?",
        options: [
          "鉄道会社が発行する遅延証明書",
          "電車の切符の半券",
          "駅の看板を撮影した写真",
          "車掌の直筆サイン"
        ],
        optionsEn: [
          "A Delay Certificate (Chien Shoumeisho) issued by the railway company",
          "A train ticket receipt stub",
          "A photograph taken of the station signboard",
          "A handwritten autograph from the train conductor"
        ],
        answerIndex: 0,
        explanation: "鉄道会社が発行する公式な「遅延証明書」（紙またはWEB取得）を提出することで、無断遅刻ではなく免責扱いとなります。"
      },
      {
        question: "電車の運転見合わせ時に、他社線を利用して迂回できる仕組みを何と呼びますか。",
        questionEn: "What is the system called that allows passengers to detour using another railway company's line during service halts?",
        options: [
          "振替輸送（ふりかえゆそう）",
          "特急乗り継ぎ",
          "無料タクシー券",
          "特別快速運転"
        ],
        optionsEn: [
          "Alternative Transfer Transportation (Furikae Yusou)",
          "Express train transit interchange",
          "Complimentary taxi vouchers",
          "Special rapid service dispatch"
        ],
        answerIndex: 0,
        explanation: "運転見合わせ区間の定期券や乗車券を持つ乗客が、指定の迂回ルート（他社線や地下鉄）を追加料金なしで利用できる制度です。"
      }
    ]
  },

  // 9. Surprise Birthday Party (サプライズ誕生日会)
  {
    id: "story-n3-birthday-party",
    slug: "birthday-party",
    title: "サプライズ誕生日会：秘密の計画と友情",
    titleRomaji: "Sapuraizu Tanjoubikai: Himitsu no Keikaku to Yuujou",
    titleEn: "Surprise Birthday Party: Secret Plans and Friendship",
    category: "Everyday Life",
    tags: ["Everyday Life", "N3", "Friendship", "Celebration", "Planning"],
    paragraphs: [
      {
        sentences: [
          {
            ja: "来週の日曜日は、サークルの仲間である健太くんの二十四回目の誕生日を迎えることになっていました。",
            naturalEn: "Next Sunday was set to mark the twenty-fourth birthday of our clubmate Kenta."
          },
          {
            ja: "日頃からみんなを笑わせてくれるムードメーカーの彼のために、友人五人で極秘のサプライズパーティーを企画しました。",
            naturalEn: "For him, who always acted as the mood maker making everyone laugh, five friends organized a top-secret surprise party."
          },
          {
            ja: "本人に計画が漏れないよう、健太くんを除いた専用のグループチャットを作成して綿密な打ち合わせを重ねました。",
            naturalEn: "To prevent the plans from leaking to him, we created a private chat group excluding Kenta and held meticulous discussions."
          },
          {
            ja: "「誕生日の当日は二人だけで軽くカフェに行く約束にして、油断させて会場へ連れ出そう」という作戦に決まりました。",
            naturalEn: "We settled on a strategy: 'Let us make a casual promise to visit a café with just one person on the day, catching him off guard before leading him to the venue.'"
          }
        ]
      },
      {
        sentences: [
          {
            ja: "パーティー会場として、隠れ家風のイタリアンレストランの個室を二週間前から予約しておきました。",
            naturalEn: "As our party venue, we reserved a private dining room at a secluded Italian bistro two weeks in advance."
          },
          {
            ja: "店長と相談し、照明を落とすタイミングや、チョコペンで名前を書いた特製デザートプレートの演出を入念に確認しました。",
            naturalEn: "Consulting with the manager, we carefully checked the timing to dim the lights and the presentation of a special dessert plate inscribed with chocolate lettering."
          },
          {
            ja: "プレゼントとして、彼が以前から欲しがっていた革製の名刺入れと、仲間全員の寄せ書き色紙を用意しました。",
            naturalEn: "As gifts, we prepared a genuine leather business card holder he had long desired, alongside a message board signed by all our friends."
          },
          {
            ja: "誕生日当日、作戦担当の美咲さんが「ちょっと相談したいことがあるから付き合って」と健太くんを誘い出しました。",
            naturalEn: "On the day of his birthday, Misaki, designated for the operation, lured Kenta out: 'I have something to consult you on, so please come along.'"
          }
        ]
      },
      {
        sentences: [
          {
            ja: "他のメンバーは集合時刻の三十分前にレストランの個室に集まり、色とりどりの風船を飾り付けました。",
            naturalEn: "The remaining members gathered in the private dining room thirty minutes prior to the meeting time, decorating the space with colorful balloons."
          },
          {
            ja: "クラッカーを一人一つずつ手に持ち、息を潜めて主役の到着を今か今かと待ち構えました。",
            naturalEn: "Each clutching a party popper in hand, we held our breath, eagerly awaiting the arrival of the guest of honor."
          },
          {
            ja: "部屋のドアが静かに開き、美咲さんに連れられた健太くんが一歩足を踏み入れた瞬間、合図を出しました。",
            naturalEn: "The instant the door opened quietly and Kenta stepped inside led by Misaki, the signal was called."
          },
          {
            ja: "「パン！パン！」とクラッカーの快音が響き渡り、「健太、誕生日おめでとう！」と全員で大歓声を上げました。",
            naturalEn: "'Pop! Pop!' echoed the merry sound of poppers, and everyone erupted into a massive cheer: 'Happy Birthday, Kenta!'"
          }
        ]
      },
      {
        sentences: [
          {
            ja: "何が起きたのか理解できず目を丸くしていた健太くんでしたが、状況を把握すると顔を両手で覆って涙ぐみました。",
            naturalEn: "Not understanding what had unfolded, Kenta's eyes went wide, but once he grasped the situation, he covered his face with both hands, tearing up."
          },
          {
            ja: "「まさかこんな大がかりな準備をしてくれていたなんて、夢にも思わなかったよ」と彼は声を震わせました。",
            naturalEn: "'I never dreamed in a million years that you guys would prepare such an elaborate surprise for me,' he uttered in a trembling voice."
          },
          {
            ja: "部屋の照明がフッと消え、花火がパチパチと火花を散らす豪華なバースデーケーキが運ばれてきました。",
            naturalEn: "The lights flicked off, and a lavish birthday cake crackling with sparkling fountain candles was carried into the room."
          },
          {
            ja: "健太くんが願い事を込めてロウソクの火を一気に吹き消すと、再び割れんばかりの拍手が巻き起こりました。",
            naturalEn: "As Kenta blew out the candle flames in a single breath while making a wish, thunderous applause erupted once more."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "美味しい料理に舌鼓を打ちながら昔の思い出話に花を咲かせ、絆の温かさを心から噛み締める素晴らしい夜となりました。",
            naturalEn: "Relishing delicious cuisine while animatedly reminiscing over old memories, it proved a magnificent night to cherish the heartwarming warmth of true friendship."
          },
          {
            ja: "誰かの笑顔のために心を込めて準備することの尊さを、仲間たち全員で分かち合うことができました。",
            naturalEn: "We were able to share amongst all companions the noble beauty of preparing wholeheartedly for the sake of someone else's joyful smile."
          }
        ]
      }
    ],
    quiz: [
      {
        question: "サプライズパーティーの計画を本人に秘密にしておくため、友人たちが行った工夫は何ですか。",
        questionEn: "What measure did the friends take to keep the surprise party plans a secret from the celebrant?",
        options: [
          "健太くんを除いた専用のグループチャットを作成して打ち合わせをした",
          "電話やメッセージを使わず、手紙の暗号だけでやり取りした",
          "健太くんのスマートフォンを取り上げて使えないようにした",
          "外国語だけで会話して聞き取れないようにした"
        ],
        optionsEn: [
          "Creating a private group chat excluding Kenta to coordinate their meetings",
          "Communicating solely through ciphered letters without using phones or messaging",
          "Confiscating Kenta's smartphone so he could not use it",
          "Speaking only in foreign languages so he could not comprehend"
        ],
        answerIndex: 0,
        explanation: "本人に通知がいかないよう、主役を外した別の秘密グループチャットを作成して準備を進めました。"
      },
      {
        question: "健太くんを会場のレストランまで自然に連れ出すために使った口実（作戦）は何ですか。",
        questionEn: "What pretext was used to naturally lure Kenta to the restaurant venue?",
        options: [
          "「相談したいことがあるから付き合って」とカフェに行くふりをして誘い出した",
          "「レストランで美味しいステーキをご馳走する」と正直に伝えた",
          "「警察署へ一緒に行ってほしい」と嘘をついた",
          "目隠しをして車に乗せて強制的に連れて行った"
        ],
        optionsEn: [
          "Luring him out under the guise of visiting a café with 'I have something to consult you on'",
          "Telling him honestly: 'I will treat you to a delicious steak at a restaurant'",
          "Lying with: 'Please accompany me to the police station'",
          "Blindfolding him and forcibly hauling him into a car"
        ],
        answerIndex: 0,
        explanation: "「相談があるからカフェに行こう」と油断させ、サプライズ会場の個室へ連れ出す作戦を取りました。"
      },
      {
        question: "サプライズを受けた瞬間の健太くんの反応はどのようなものでしたか。",
        questionEn: "What was Kenta's reaction the moment the surprise unfolded?",
        options: [
          "驚いて目を丸くし、事態を把握すると両手で顔を覆って感激の涙を流した",
          "怒り出して部屋から走って逃げてしまった",
          "事前に知っていたと言って冷めた顔をしていた",
          "クラッカーの音に驚いて警察を呼んだ"
        ],
        optionsEn: [
          "His eyes went wide in surprise, and realizing the situation, covered his face with tears of joy",
          "He grew furious and dashed out of the room",
          "He acted completely aloof, claiming he had known all along",
          "He was startled by the poppers and dialed the police"
        ],
        answerIndex: 0,
        explanation: "思いがけない仲間たちの温かい祝福に心底驚き、感激のあまり涙を流して喜んでくれました。"
      }
    ]
  },

  // 10. Office Project Proposal Meeting (企画会議での発表)
  {
    id: "story-n3-office-meeting",
    slug: "office-meeting",
    title: "企画会議での発表：新プロジェクトの提案",
    titleRomaji: "Kikaku Kaigi de no Happyou: Shin Purojekuto no Teian",
    titleEn: "Office Project Proposal Meeting: Presenting a New Venture",
    category: "Everyday Life",
    tags: ["Everyday Life", "N3", "Business", "Presentation", "Meeting"],
    paragraphs: [
      {
        sentences: [
          {
            ja: "入社三年目を迎えた私は、若者向けの新しいオンライン学習サービスの企画リーダーに抜擢されました。",
            naturalEn: "Reaching my third year at the company, I was selected to lead the planning of a brand-new online learning service targeted at young learners."
          },
          {
            ja: "本日の午後二時から、事業部長や各部署の責任者が集まる重要な企画審議会議でプレゼンテーションを行うことになっています。",
            naturalEn: "Starting at 2:00 PM today, I am scheduled to deliver a presentation at a crucial planning review board where department heads gather."
          },
          {
            ja: "会議室の大型モニターの接続テストを入念に行い、出席者全員分の配布資料をテーブルの上に整然と並べました。",
            naturalEn: "I thoroughly performed connection tests on the conference room's large display monitor, neatly arranging handouts on the table for all attendees."
          },
          {
            ja: "何週間も夜遅くまで市場調査と収支計画のシミュレーションを重ねてきただけに、緊張で喉がカラカラに渇いていました。",
            naturalEn: "Having spent weeks working late into the night compiling market research and profit simulations, my throat was parched dry with nerves."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "定刻になり、「それでは定刻となりましたので、新規事業企画会議を開始いたします」と司会が口火を切りました。",
            naturalEn: "As the clock struck, the facilitator opened the proceedings: 'Since the appointed time has arrived, we will begin the new business planning meeting.'"
          },
          {
            ja: "私は立ち上がり、「企画部の高橋です。本日は『次世代型インタラクティブ学習プラットフォーム』についてご説明いたします」と一礼しました。",
            naturalEn: "I stood up and bowed: 'I am Takahashi from the Planning Department. Today, I will present on our next-generation interactive learning platform.'"
          },
          {
            ja: "スライドをめくりながら、現在の語学学習市場が抱える課題や、競合他社にはない自社独自の強みを論理的に説明していきました。",
            naturalEn: "Advancing the slides, I logically laid out the challenges facing the current language-learning market and our proprietary strengths unmatched by rivals."
          },
          {
            ja: "聞き取りやすい発声を心がけ、聞き手の目を見回しながら、単なる機能説明にとどまらず利用者の声や具体的な収益予測を提示しました。",
            naturalEn: "Conscious of maintaining clear pronunciation and making eye contact, I presented user testimonials and concrete revenue forecasts beyond mere features."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "発表を終えて質疑応答に移ると、財務担当の部長から厳しい指摘が飛んできました。",
            naturalEn: "When the presentation ended and transitioned to Q&A, a sharp critique was fired from the finance department director."
          },
          {
            ja: "「企画の独自性は評価できるが、初年度の開発費用に対する投資回収期間が長すぎるのではないか」と問われたのです。",
            naturalEn: "He questioned: 'While I praise the originality of the concept, is not the return-on-investment period too protracted against first-year development costs?'"
          },
          {
            ja: "私はたじろぐことなく、事前に用意していた補足スライドのデータ画面を素早く画面に投影しました。",
            naturalEn: "Without flinching, I quickly projected the supplementary data slide prepared in advance onto the screen."
          },
          {
            ja: "「ご指摘の通り初期投資はかかりますが、クラウドインフラを段階的に導入することで、半年で黒字化が可能です」と根拠を示して回答しました。",
            naturalEn: "'As you rightly point out, initial capital is required; however, by adopting cloud infrastructure in phases, turning profitable within six months is achievable,' I answered with evidence."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "最後に事業部長から「非常によく練られた素晴らしい提案だ。予算を承認するので、来月からの開発を進めてほしい」と承認の言葉をいただきました。",
            naturalEn: "Finally, the general manager bestowed approval: 'It is an exceptionally well-thought-out, splendid proposal. We approve the budget, so proceed with development starting next month.'"
          },
          {
            ja: "張り詰めていた会議室の空気が一気に和らぎ、同僚たちと目を合わせて小さくガッツポーズを交わしました。",
            naturalEn: "The tense atmosphere of the boardroom softened at once, and exchanging subtle fist pumps with colleagues, relief washed over us."
          },
          {
            ja: "会議終了後、私は決定事項や今後のスケジュールをまとめた「議事録」を作成し、その日のうちに関係者全員へメールで共有しました。",
            naturalEn: "Following the meeting, I drafted the 'meeting minutes' summarizing decisions and future schedules, sharing them by email to all stakeholders that same day."
          },
          {
            ja: "念入りな準備と確固たるデータに基づいた説明があればこそ、人を納得させることができるのだと深く実感しました。",
            naturalEn: "I acutely realized that it is precisely thorough preparation and evidence-based explanations that possess the true power to convince others."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "責任あるプロジェクトを成功させるため、チーム一丸となって新たな挑戦へ力強く踏み出す決意を固めました。",
            naturalEn: "To make this responsible project a resounding triumph, I solidified my determination to step vigorously into new challenges united as a team."
          },
          {
            ja: "自らの提案が会社を動かす原動力となる手応えを感じ、ビジネスパーソンとしての大きな成長を実感しています。",
            naturalEn: "Feeling the tangible reward of my own proposal becoming a driving engine that moves the company, I acutely appreciate my immense growth as a business professional."
          }
        ]
      }
    ],
    quiz: [
      {
        question: "質疑応答において財務部長から開発コストの回収期間について厳しい指摘を受けた際、発表者はどのように対応しましたか。",
        questionEn: "How did the presenter handle the sharp critique from the finance director regarding the ROI payback period?",
        options: [
          "事前に用意していた補足データを示し、クラウドの段階導入で半年で黒字化できる根拠を説明した",
          "答えに詰まってしまい、その場で泣き出してしまった",
          "指摘を無視して次の質問者に話を振った",
          "開発費を半分に減らすとその場で勝手に約束した"
        ],
        optionsEn: [
          "Projected supplementary data prepared in advance, demonstrating profitability in six months via phased cloud deployment",
          "Became tongue-tied and broke down into tears on the spot",
          "Ignored the critique and pivoted to the next questioner",
          "Arbitrarily promised on the spot to slash development costs in half"
        ],
        answerIndex: 0,
        explanation: "想定問答として補足資料を準備していたため、根拠のある数値を示して冷静に納得させることができました。"
      },
      {
        question: "会議終了後、発表者がその日のうちに速やかに行った業務は何ですか。",
        questionEn: "What task did the presenter swiftly execute that very day following the conclusion of the meeting?",
        options: [
          "決定事項や今後のスケジュールをまとめた議事録を作成し、関係者全員へメールで共有した",
          "打ち上げのために同僚を連れて飲み会に行った",
          "プレゼン資料をすべてゴミ箱に破棄した",
          "疲れたので上司に言わずにそのまま帰宅した"
        ],
        optionsEn: [
          "Drafted meeting minutes summarizing decisions and schedules, sharing them via email to all stakeholders",
          "Took colleagues out for an evening drinking party celebration",
          "Discarded all presentation slides into the trash bin",
          "Went straight home without informing the supervisor because of exhaustion"
        ],
        answerIndex: 0,
        explanation: "ビジネスの基本として、会議での合意事項を忘れないうちに「議事録」として速やかにまとめて共有しました。"
      },
      {
        question: "このプレゼンテーションの成功を通じて語り手が実感した教訓は何ですか。",
        questionEn: "What key lesson did the narrator appreciate through the success of this presentation?",
        options: [
          "念入りな事前準備と確固たるデータに基づいた説明こそが人を納得させるということ",
          "声の大きさが一番重要であり、データは適当で良いということ",
          "上司にゴマをすっていればどんな企画でも通るということ",
          "プレゼンテーションはできるだけ短くして喋らない方が良いということ"
        ],
        optionsEn: [
          "That thorough advance preparation and evidence-based explanations possess the power to convince people",
          "That volume of voice is most important and data can be careless",
          "That flattering the boss guarantees any proposal will pass",
          "That presentations should be kept as short as possible with minimal speaking"
        ],
        answerIndex: 0,
        explanation: "十分な市場調査と想定質問へのデータ準備こそが、ビジネスにおける提案を成功に導く最大の要因です。"
      }
    ]
  }
];

