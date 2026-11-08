export interface RawN3StoryDefinition {
  id: string;
  slug: string;
  title: string;
  titleRomaji: string;
  titleEn: string;
  category: "Anime & Pop Culture" | "Everyday Life";
  tags: string[];
  paragraphs: Array<{
    sentences: Array<{
      ja: string;
      naturalEn: string;
    }>;
  }>;
  quiz: Array<{
    question: string;
    questionEn: string;
    options: string[];
    optionsEn: string[];
    answerIndex: number;
    explanation: string;
  }>;
}

export const ANIME_STORIES: RawN3StoryDefinition[] = [
  // 1. Attack on Titan (進撃の巨人)
  {
    id: "story-n3-attack-on-titan",
    slug: "attack-on-titan",
    title: "進撃の巨人：壁の向こうの自由",
    titleRomaji: "Shingeki no Kyojin: Kabe no Mukou no Jiyuu",
    titleEn: "Attack on Titan: Freedom Beyond the Walls",
    category: "Anime & Pop Culture",
    tags: ["Anime", "N3", "Fantasy", "Action", "Freedom"],
    paragraphs: [
      {
        sentences: [
          {
            ja: "人類は何百年もの間、巨大な三つの三重の壁の中で暮らすことになっていました。",
            naturalEn: "For hundreds of years, humanity was meant to live inside three concentric, gigantic walls."
          },
          {
            ja: "壁の外側には人を食べる巨人が徘徊しており、人々は外の世界に出ることを恐れていました。",
            naturalEn: "Outside the walls, human-eating Titans roamed, and the citizens lived in fear of venturing beyond."
          },
          {
            ja: "少年エレンは、狭い鳥かごのような壁の中で一生を終えることに強い不満を抱いていました。",
            naturalEn: "A young boy named Eren harbored intense frustration about spending his entire life trapped like a caged bird."
          },
          {
            ja: "彼は親友のアルミンから、壁の向こうには塩で満ちた広大な海があるという話を聞かされて育ちました。",
            naturalEn: "He grew up hearing tales from his best friend Armin of an expansive ocean filled with salt beyond the walls."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "ところがある日、壁の高さを超える超大型巨人が突如として現れ、平穏な日常が破壊されてしまいました。",
            naturalEn: "However, one day, a colossal Titan surpassing the height of the outer wall suddenly appeared, shattering their peaceful routine."
          },
          {
            ja: "壁が破られたせいで、無数の巨人が街になだれ込み、多くの尊い命が失われてしまったのです。",
            naturalEn: "Because the wall was breached, countless Titans poured into the district, causing many precious lives to be lost."
          },
          {
            ja: "目の前で母親を奪われたエレンは、巨人を一匹残らず駆逐することを心に固く誓いました。",
            naturalEn: "Having his mother taken before his very eyes, Eren swore a resolute oath in his heart to exterminate every last Titan."
          },
          {
            ja: "彼は危険を顧みず、壁外の調査を担当する調査兵団に入隊することを決意しました。",
            naturalEn: "Without regard for danger, he resolved to enlist in the Survey Corps, the regiment responsible for expeditions outside the walls."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "調査兵団の訓練は極めて厳しく、立体機動装置を使いこなすために毎日のように訓練を重ねました。",
            naturalEn: "Training in the Survey Corps was exceptionally rigorous, and recruits drilled daily to master the omni-directional mobility gear."
          },
          {
            ja: "恐怖で足がすくむ仲間もいましたが、エレンは困難に直面するたびに自らを奮い立たせました。",
            naturalEn: "Although some comrades froze in sheer terror, Eren rallied his resolve every time he confronted hardship."
          },
          {
            ja: "戦いの最中、彼は思いがけず自らの中に眠る巨人の力に目覚めることになりました。",
            naturalEn: "In the heat of battle, he unexpectedly awakened to the dormant power of a Titan slumbering within himself."
          },
          {
            ja: "周りの人々から怪物として疑われる一方、人類を救う唯一の希望としても注目を集めるようになりました。",
            naturalEn: "While suspected as a monster by some, he simultaneously garnered attention as humanity's sole beacon of hope."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "壁外調査に出発した兵士たちは、霧の中で巨人の奇襲を受けながらも前進を続けました。",
            naturalEn: "The soldiers who embarked on the expedition outside the walls pressed forward despite facing ambush by Titans in the heavy mist."
          },
          {
            ja: "犠牲を伴う戦いが続くうちに、エレンは本当の敵が壁の外の巨人だけではないことに気づき始めました。",
            naturalEn: "As battles entailing profound sacrifice dragged on, Eren began to realize that the true enemy was not solely the Titans beyond the wall."
          },
          {
            ja: "真実を知るためには、どれほど深い絶望を味わおうとも前に進むしかないのです。",
            naturalEn: "To uncover the truth, they had no choice but to advance forward, no matter how deep the despair they had to endure."
          },
          {
            ja: "仲間たちの犠牲を無駄にしないように、彼は握りしめた拳を天に向かって掲げました。",
            naturalEn: "In order not to render his comrades' sacrifices in vain, he raised his clenched fist towards the sky."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "数々の苦難を乗り越えた末に、調査兵団の生き残りたちはついに水平線に広がる青い海に到達しました。",
            naturalEn: "After overcoming myriad tribulations, the survivors of the Survey Corps finally arrived at the blue ocean stretching to the horizon."
          },
          {
            ja: "波打ち際で歓声を上げるアルミンたちに対して、エレンの表情はどこまでも険しいままでした。",
            naturalEn: "In contrast to Armin and the others cheering along the water's edge, Eren's expression remained stern and pensive."
          },
          {
            ja: "海の向こうにいる敵をすべて倒せば、本当に自由になれるのだろうかと彼は静かに問いかけました。",
            naturalEn: "He quietly wondered whether defeating all the adversaries across the sea would genuinely bring them true freedom."
          },
          {
            ja: "自由を求める彼の果てしない旅路は、新たな戦いの幕開けとともに続いていくのでした。",
            naturalEn: "His endless odyssey in pursuit of freedom was set to continue with the dawn of an entirely new struggle."
          }
        ]
      }
    ],
    quiz: [
      {
        question: "エレンが壁の外に出たいと強く願った最大の理由は何ですか。",
        questionEn: "What was the main reason Eren strongly desired to go outside the walls?",
        options: [
          "壁の中の狭い暮らしに不満があり、自由な世界を見たかったから",
          "壁の中で暮らすことが法律で禁止されていたから",
          "巨人と友達になって平和に暮らしたかったから",
          "商売を始めて大金持ちになりたかったから"
        ],
        optionsEn: [
          "He was dissatisfied with living in a confined cage and wanted to see the free world",
          "Living inside the walls was prohibited by law",
          "He wanted to become friends with the Titans and live peacefully",
          "He wanted to start a business and become wealthy"
        ],
        answerIndex: 0,
        explanation: "エレンは狭い鳥かごのような生活に不満を抱き、壁の向こうの自由な世界や海を渇望していました。"
      },
      {
        question: "エレンが巨人をすべて駆逐すると誓ったきっかけは何ですか。",
        questionEn: "What triggered Eren's oath to exterminate all Titans?",
        options: [
          "母親を目の前で巨人に奪われたこと",
          "アルミンに強く勧められたこと",
          "立体機動装置の試験に合格したこと",
          "王様から特別な任務を与えられたこと"
        ],
        optionsEn: [
          "Having his mother taken by a Titan right before his eyes",
          "Being strongly urged by Armin",
          "Passing the examination for omni-directional mobility gear",
          "Being granted a special mission by the king"
        ],
        answerIndex: 0,
        explanation: "壁が破られた際に、目の前で母親を巨人に奪われた強い悲しみと怒りが誓いの原動力となりました。"
      },
      {
        question: "青い海に到達した時、エレンはどのような心境を抱いていましたか。",
        questionEn: "What was Eren's state of mind upon reaching the blue ocean?",
        options: [
          "海の向こうの敵を倒すことで本当に自由になれるのかと疑問を抱いていた",
          "巨人をすべて倒して心から安心し喜んでいた",
          "海の水がしょっぱくないことに驚いていた",
          "これからは船乗りになって世界中を旅しようと決意していた"
        ],
        optionsEn: [
          "He wondered whether defeating the enemies across the sea would truly bring freedom",
          "He was wholeheartedly relieved and delighted that all Titans were slain",
          "He was surprised that the sea water was not salty",
          "He decided to become a sailor and voyage around the globe"
        ],
        answerIndex: 0,
        explanation: "歓声を上げる仲間たちとは対照的に、海の向こうに真の自由があるのかを深く苦悩していました。"
      }
    ]
  },

  // 2. BLEACH (ブリーチ)
  {
    id: "story-n3-bleach",
    slug: "bleach",
    title: "ブリーチ：死神代行と魂の導き",
    titleRomaji: "Buriichi: Shinigami Daikou to Tamashii no Michibiki",
    titleEn: "Bleach: Substitute Soul Reaper and Guidance of Souls",
    category: "Anime & Pop Culture",
    tags: ["Anime", "N3", "Supernatural", "Swords", "Soul Reaper"],
    paragraphs: [
      {
        sentences: [
          {
            ja: "高校生の一護は、幼い頃から人には見えない幽霊が自然と見えてしまう特異な体質の持ち主でした。",
            naturalEn: "High schooler Ichigo possessed an unusual constitution that allowed him to see wandering ghosts unseen by ordinary people."
          },
          {
            ja: "彼は普段通り不良のように見られがちでしたが、困っている霊を見ると放っておけない優しい性格でした。",
            naturalEn: "Though often misperceived as a delinquent on the surface, he was fundamentally kind-hearted and unable to ignore troubled spirits."
          },
          {
            ja: "ある平穏な夜、彼の部屋の窓から黒い着物を着た謎めいた少女が静かに忍び込んできました。",
            naturalEn: "One calm night, an enigmatic young girl clad in black robes quietly stepped through the window of his bedroom."
          },
          {
            ja: "彼女の名はルキアといい、迷える魂を整えてあの世へ送る役目を担う死神だと名乗りました。",
            naturalEn: "She introduced herself as Rukia, a Soul Reaper whose sacred duty was to guide lost souls safely to the afterlife."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "その時、人間の魂を貪り食う恐ろしい悪霊である虚が、一護の家族を標的にして襲来しました。",
            naturalEn: "Just then, a monstrous evil spirit called a Hollow that devours human souls descended, targeting Ichigo's household."
          },
          {
            ja: "家族を守ろうとしたルキアは重傷を負ってしまい、もはや刀を握って戦う力を失いかけていました。",
            naturalEn: "Shielding his family, Rukia sustained grave injuries and was rapidly losing the physical strength to wield her blade."
          },
          {
            ja: "家族を救うためには、一護が死神の力をルキアから受け取るしか選択肢が残されていませんでした。",
            naturalEn: "In order to save his beloved family, no choice remained other than for Ichigo to absorb Rukia's Soul Reaper powers."
          },
          {
            ja: "覚悟を決めて刀の切っ先を胸に突き刺した瞬間、彼は並外れた霊力を持つ死神代行へと姿を変えました。",
            naturalEn: "The moment he steeled his resolve and accepted the blade's tip into his chest, he transformed into a Substitute Soul Reaper of immense spiritual pressure."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "手にした巨大な斬魄刀を一振りするだけで、一護は見事に恐ろしい虚を両断して家族を守り抜きました。",
            naturalEn: "With a solitary swing of the colossal Zanpakutō blade in his grip, Ichigo cleanly severed the terrifying Hollow, protecting his family."
          },
          {
            ja: "しかし力を失ってしまったルキアを助けるため、彼は現世で死神代行としての務めを果たすことになりました。",
            naturalEn: "However, to assist the temporarily weakened Rukia, he was obliged to take up the mantle of a Substitute Soul Reaper in the living world."
          },
          {
            ja: "日中は普通の学生生活を送りつつ、放課後になると街に現れる凶悪な霊と戦う二重生活が始まりました。",
            naturalEn: "While attending ordinary high school during daytime hours, a double life commenced as he battled malicious spirits haunting the town after school."
          },
          {
            ja: "戦いを重ねるうちに、井上織姫や茶渡といったクラスメイトたちも自らの不思議な能力に目覚めていきました。",
            naturalEn: "Through continuous combat, classmates like Orihime Inoue and Chad likewise awakened to their own extraordinary abilities."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "ところが、人間に死神の力を譲渡した罪に問われ、ルキアは尸魂界の掟に従って連行されてしまいました。",
            naturalEn: "However, accused of the capital crime of transferring Soul Reaper powers to a mortal, Rukia was apprehended under the laws of the Soul Society."
          },
          {
            ja: "処刑を免れない彼女を救い出すため、一護たちは厳しい特訓を積んだ上で霊界へ乗り込む決意を固めました。",
            naturalEn: "Determined to rescue her from imminent execution, Ichigo and his allies completed grueling training before plunging into the spirit realm."
          },
          {
            ja: "強力な隊長格の死神たちと刃を交える中で、一護の刀は自らの魂の叫びとともに真の力を解き放ちました。",
            naturalEn: "Crossing blades with formidable Soul Reaper Captains, Ichigo's Zanpakuto unlocked its true power in harmony with the cry of his soul."
          },
          {
            ja: "仲間を想う強い信念があればこそ、どんなに高い壁であっても打ち破ることができると彼は証明したのです。",
            naturalEn: "He proved that so long as one possesses steadfast faith in one's friends, any wall, no matter how towering, can be shattered."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "激戦の末にルキアを救出した一護は、死神たちからも一人の頼もしい戦士として認められるようになりました。",
            naturalEn: "Having successfully rescued Rukia at the culmination of fierce battles, Ichigo earned recognition from the Soul Reapers as an indispensable warrior."
          },
          {
            ja: "彼は大それた正義を振りかざすのではなく、ただ手の届く大切な人々を護るために刀を握り続けます。",
            naturalEn: "Rather than preaching grand declarations of justice, he continues to wield his sword simply to safeguard the precious people within reach."
          },
          {
            ja: "現世と霊界の調和を保つための戦いは、これからも彼の背中を押す仲間たちと共に続いていくのでした。",
            naturalEn: "The battle to maintain harmony between the living world and the spirit realm continues, propelled forward by the comrades at his side."
          }
        ]
      }
    ],
    quiz: [
      {
        question: "一護が死神代行になった直接のきっかけは何ですか。",
        questionEn: "What was the immediate catalyst for Ichigo becoming a Substitute Soul Reaper?",
        options: [
          "家族を虚から救うため、負傷したルキアから死神の力を受け取ったこと",
          "学校の成績優秀者として死神の世界にスカウトされたこと",
          "道端に落ちていた黒い刀を拾って自分のものにしたこと",
          "父親から代々伝わる死神の免許を受け継いだこと"
        ],
        optionsEn: [
          "Receiving Soul Reaper power from the injured Rukia to protect his family from a Hollow",
          "Being scouted by the spirit realm for outstanding academic achievements",
          "Picking up a black sword dropped on the roadside and claiming it",
          "Inheriting a hereditary Soul Reaper license passed down from his father"
        ],
        answerIndex: 0,
        explanation: "襲撃してきた虚から家族を救うため、重傷を負ったルキアの刀を受け入れて死神の力を譲り受けました。"
      },
      {
        question: "ルキアが尸魂界へ連行された理由は何ですか。",
        questionEn: "Why was Rukia apprehended and taken back to the Soul Society?",
        options: [
          "人間に死神の力を譲渡したことが重大な掟違反だったから",
          "現世で高校の授業をサボって怒られたから",
          "一護の斬魄刀を盗んだと疑われたから",
          "虚を退治する任務を完全に放棄したから"
        ],
        optionsEn: [
          "Transferring Soul Reaper power to a human was a grave violation of law",
          "She skipped high school classes in the human world",
          "She was suspected of stealing Ichigo's Zanpakutō",
          "She completely abandoned her duty to eliminate Hollows"
        ],
        answerIndex: 0,
        explanation: "人間に死神の力を譲る行為は尸魂界の厳格な掟に反しており、その重罪のために捕縛されました。"
      },
      {
        question: "一護が戦う原動力として描かれている姿勢はどれですか。",
        questionEn: "Which stance best captures Ichigo's driving motivation for fighting?",
        options: [
          "大それた理想よりも、自分の手が届く大切な仲間や家族を守ること",
          "死神の世界で一番偉い総隊長になって名誉を得ること",
          "世界中のすべての悪霊を一人で支配すること",
          "現世を捨てて霊界の貴族として優雅に暮らすこと"
        ],
        optionsEn: [
          "Protecting precious friends and family within arm's reach rather than boasting grand ideals",
          "Becoming the supreme Head Captain in the Soul Society to win fame",
          "Ruling over all evil spirits in the entire universe single-handedly",
          "Abandoning the human world to live luxuriously as a noble in the spirit realm"
        ],
        answerIndex: 0,
        explanation: "一護は大層な正義を語るのではなく、身近にいる大切な人々を護るために命がけで戦い続けます。"
      }
    ]
  },

  // 3. One Piece (ワンピース)
  {
    id: "story-n3-one-piece",
    slug: "one-piece",
    title: "ワンピース：大航海と仲間の絆",
    titleRomaji: "Wan Piisu: Dai Koukai to Nakama no Kizuna",
    titleEn: "One Piece: Great Voyage and Bonds of Comrades",
    category: "Anime & Pop Culture",
    tags: ["Anime", "N3", "Adventure", "Pirates", "Friendship"],
    paragraphs: [
      {
        sentences: [
          {
            ja: "かつて海賊王と呼ばれた男が残した伝説の財宝を巡って、大海賊時代が幕を開けました。",
            naturalEn: "The Great Pirate Era was set into motion surrounding the legendary treasure left behind by the man once hailed as Pirate King."
          },
          {
            ja: "麦わら帽子を被った少年ルフィは、世界一自由な海賊王になるという夢を胸に小舟で海へと飛び出しました。",
            naturalEn: "A straw-hat-wearing boy named Luffy set out onto the open ocean in a tiny boat, carrying the dream of becoming the freest Pirate King in the world."
          },
          {
            ja: "彼は子供の頃にゴムゴムの実という悪魔の実を食べたおかげで、身体を自在に伸縮させることができました。",
            naturalEn: "Having eaten a Devil Fruit known as the Gum-Gum Fruit in childhood, he gained the power to stretch his limbs at will."
          },
          {
            ja: "海で泳げなくなるという致命的な弱点を背負ったにもかかわらず、彼の冒険への情熱が冷めることはありませんでした。",
            naturalEn: "Despite shouldering the fatal weakness of being unable to swim in water, his fiery passion for grand adventure never cooled."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "偉大なる航路を目指す旅の途中で、ルフィはかけがえのない仲間たちと次々に出会っていきました。",
            naturalEn: "Along the path toward the treacherous Grand Line, Luffy encountered indispensable companions one after another."
          },
          {
            ja: "世界一の大剣豪を目指すゾロや、正確な海図を描くことを夢見る航海士のナミが仲間に加わりました。",
            naturalEn: "Zoro, who aspired to become the world's greatest swordsman, and Nami, a navigator dreaming of charting accurate sea maps, joined the crew."
          },
          {
            ja: "彼らはそれぞれ重い過去や深い傷を抱えていましたが、ルフィの曇りのない笑顔に救われていったのです。",
            naturalEn: "Though each carried a heavy past and deep emotional scars, they found salvation in Luffy's unclouded, resolute smile."
          },
          {
            ja: "「お前の力が必要なんだ」というルフィの真っ直ぐな言葉に対して、仲間たちは命を預ける覚悟を決めました。",
            naturalEn: "In response to Luffy's heartfelt plea of 'I need your strength,' his comrades resolved to entrust him with their very lives."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "荒れ狂う嵐や巨大な海獣を乗り越えながら、麦わらの一味の船は未知の島々へと進路をとりました。",
            naturalEn: "Conquering ferocious squalls and gigantic sea beasts, the Straw Hat crew set their sails toward mysterious, uncharted islands."
          },
          {
            ja: "航海を続けるうちに、凶悪な海賊や政府の冷酷な海軍が彼らの前に立ちはだかりました。",
            naturalEn: "As their voyage unfolded, ruthless pirates and the World Government's cold navy stood menacingly in their path."
          },
          {
            ja: "どんな強敵に打ちのめされそうになっても、ルフィは仲間を守るためなら何度でも立ち上がりました。",
            naturalEn: "No matter how battered by mighty foes, Luffy would rise up again and again if it was to protect his friends."
          },
          {
            ja: "彼にとって海賊王とは偉い権力を持つ者ではなく、海で誰よりも一番自由な存在のことだったのです。",
            naturalEn: "To him, being the Pirate King did not signify possessing political authority, but simply being the freest soul on all the seven seas."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "仲間が理不尽な権力によって囚われた時、一味は世界政府の旗を打ち抜いて宣戦布告を行いました。",
            naturalEn: "When a crewmate was captured by tyrannical authorities, the crew shot straight through the World Government flag, declaring war."
          },
          {
            ja: "常識にとらわれて生きる人々に対して、彼らは信念を貫くことの尊さを全身で示してみせたのです。",
            naturalEn: "To people living bound by mundane conventions, they demonstrated with all their might the noble virtue of remaining true to one's convictions."
          },
          {
            ja: "激しい戦いの中で船が寿命を迎えた際には、涙を流しながら感謝を込めて火を放ち、海へと見送りました。",
            naturalEn: "When their beloved ship reached the end of its life amid fierce battles, they shed tears, expressing boundless gratitude as they set it to rest in flames on the sea."
          },
          {
            ja: "新しい船を手に入れた彼らは、仲間の夢を乗せてさらに険しい海域へと舵を切っていきました。",
            naturalEn: "Securing a new vessel, they steered their helm toward even harsher waters, carrying the dreams of every comrade aboard."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "水平線の彼方には、まだ誰も目にしたことのない奇跡のような景色が今も待っています。",
            naturalEn: "Beyond the distant horizon, miraculous vistas that no mortal eye has yet witnessed await them even now."
          },
          {
            ja: "どんな逆風が吹こうとも、信頼できる仲間と共に笑い合えるなら、彼らの航海が止まることはありません。",
            naturalEn: "No matter how fierce the headwind blows, as long as they can laugh alongside trusted comrades, their voyage will never cease."
          },
          {
            ja: "果てしない冒険の風を受けながら、麦わらの海賊旗は今日も青空の下で力強くはためいています。",
            naturalEn: "Catching the winds of endless adventure, the Straw Hat jolly roger flutters proudly beneath the open blue sky today."
          }
        ]
      }
    ],
    quiz: [
      {
        question: "ルフィが目指している「海賊王」とは、彼にとってどのような存在ですか。",
        questionEn: "What does being the 'Pirate King' mean to Luffy?",
        options: [
          "海で誰よりも一番自由な存在であること",
          "世界中のすべての国を支配する偉い権力者になること",
          "世界で一番豪華な城を建てて贅沢に暮らすこと",
          "誰も逆らえない恐ろしい軍隊を作ること"
        ],
        optionsEn: [
          "Being the single freest person across all the seas",
          "Becoming a grand dictator who rules over every nation on earth",
          "Building the most lavish castle in the world to live in luxury",
          "Assembling a terrifying military force that nobody can oppose"
        ],
        answerIndex: 0,
        explanation: "ルフィにとって海賊王とは、権力や支配ではなく「海で一番自由な者」を意味しています。"
      },
      {
        question: "悪魔の実を食べたことによるルフィの致命的な弱点は何ですか。",
        questionEn: "What is the fatal weakness Luffy incurred from consuming a Devil Fruit?",
        options: [
          "海で泳ぐことができなくなること",
          "肉を食べると身体が縮んでしまうこと",
          "夜になると眠れなくなること",
          "嘘をつくと鼻が長く伸びること"
        ],
        optionsEn: [
          "Becoming entirely unable to swim in water",
          "Shrinking whenever he consumes meat",
          "Being unable to sleep at night",
          "His nose growing longer whenever he tells a lie"
        ],
        answerIndex: 0,
        explanation: "悪魔の実を食べた者は海に嫌われ、泳ぐ能力を永久に失ってしまうという代償を背負います。"
      },
      {
        question: "仲間が連れ去られた時、麦わらの一味は世界政府に対してどのような行動をとりましたか。",
        questionEn: "How did the Straw Hat crew respond to the World Government when their comrade was taken?",
        options: [
          "世界政府の旗を撃ち抜いて堂々と宣戦布告した",
          "身代金を支払って穏便に解決しようとした",
          "仲間を諦めて別の新しい航海士を探した",
          "海軍に降伏して牢屋に入った"
        ],
        optionsEn: [
          "They shot through the World Government flag, openly declaring war",
          "They paid a ransom to resolve the issue peacefully",
          "They abandoned their comrade and searched for a replacement navigator",
          "They surrendered to the Marines and entered prison"
        ],
        answerIndex: 0,
        explanation: "仲間を取り戻すため、世界政府の旗を射抜いて恐れることなく正面から宣戦布告を行いました。"
      }
    ]
  },

  // 4. Naruto (NARUTO -ナルト-)
  {
    id: "story-n3-naruto",
    slug: "naruto",
    title: "ナルト：諦めない心と忍の道",
    titleRomaji: "Naruto: Akiramenai Kokoro to Shinobi no Michi",
    titleEn: "Naruto: The Unyielding Spirit and the Ninja Way",
    category: "Anime & Pop Culture",
    tags: ["Anime", "N3", "Ninja", "Perseverance", "Growth"],
    paragraphs: [
      {
        sentences: [
          {
            ja: "木ノ葉隠れの里に住む少年ナルトは、親のいない孤独な日々を過ごしていました。",
            naturalEn: "A young boy named Naruto living in the Hidden Leaf Village spent his early days in painful solitude without parents."
          },
          {
            ja: "かつて里を壊滅寸前に追い込んだ九尾の妖狐が体内に封印されているせいで、大人たちから冷たく避けられていたのです。",
            naturalEn: "Because the Nine-Tailed Fox that once drove the village to the brink of ruin was sealed inside him, adults shunned him coldly."
          },
          {
            ja: "誰からも認められない悔しさを紛らわせるため、彼は里の岩山に落書きをするなど悪戯ばかりを繰り返していました。",
            naturalEn: "To distract himself from the agony of being unacknowledged by anyone, he constantly pulled pranks like spray-painting the village cliff faces."
          },
          {
            ja: "しかし心の奥底では、いつか里の最高指導者である火影になって全員に自分の存在を認めさせたいと強く願っていました。",
            naturalEn: "Yet deep in his heart, he harbored a fiery ambition to become Hokage, the village's supreme leader, and make everyone recognize him."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "落ちこぼれと呼ばれて忍者学校の卒業試験に何度も落ちたにもかかわらず、彼は決して修行を投げ出しませんでした。",
            naturalEn: "Despite being branded a failure and failing the Ninja Academy graduation exam repeatedly, he never abandoned his training."
          },
          {
            ja: "そんな彼の本気を受け止め、一人の人間として温かく信じてくれたのが担任のイルカ先生でした。",
            naturalEn: "The person who embraced his true earnestness and warmly believed in him as a human being was his academy tutor, Master Iruka."
          },
          {
            ja: "認められた喜びを知ったナルトは、額当てを締め直し、立派な忍者になるための一歩を踏み出しました。",
            naturalEn: "Experiencing the immense joy of being validated, Naruto tied his forehead protector tightly, embarking on the path to becoming a proud shinobi."
          },
          {
            ja: "「まっすぐ自分の言葉は曲げねぇ、それが俺の忍道だ」という信念が、彼の魂の柱となったのです。",
            naturalEn: "The conviction of 'I never go back on my word; that's my ninja way!' became the indestructible bedrock of his soul."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "サスケやサクラと共にカカシ先生の第七班に配属され、数々の過酷な任務をこなすことになりました。",
            naturalEn: "Assigned alongside Sasuke and Sakura to Team 7 under Master Kakashi, he was tasked with executing myriad perilous missions."
          },
          {
            ja: "天才肌のサスケに対して激しいライバル心を燃やしながらも、ナルトは実戦の中で急速な成長を遂げました。",
            naturalEn: "While fueling a fierce rivalry against the prodigy Sasuke, Naruto experienced meteoric growth in the crucible of real combat."
          },
          {
            ja: "伝説の三忍の一人である自来也に弟子入りした彼は、難度の高い忍術である螺旋丸を血のにじむ努力で習得しました。",
            naturalEn: "Apprenticing under Jiraiya, one of the legendary Sannin, he mastered the exceptionally difficult ninjutsu known as Rasengan through blood, sweat, and tears."
          },
          {
            ja: "修業を続けるうちに、彼は体内に眠る九尾の強大なチャクラとも向き合わざるを得なくなっていきました。",
            naturalEn: "As his rigorous discipline continued, he had no choice but to confront the colossal Nine-Tails chakra dormant in his core."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "ところが復讐に囚われたサスケが里を抜け出したことで、二人の絆は大きな試練を迎えることになりました。",
            naturalEn: "However, as Sasuke fell prey to the thirst for vengeance and deserted the village, the bond between the two faced an agonizing ordeal."
          },
          {
            ja: "友を闇から連れ戻すために、ナルトはどんなに傷ついても追い続けることを心に誓いました。",
            naturalEn: "To drag his dearest friend back from the abyss, Naruto vowed in his heart to keep chasing him, no matter how wounded he became."
          },
          {
            ja: "里を滅ぼそうとする強大な敵ペインが襲来した際には、仙術を極めて里の危機を一人で救い出しました。",
            naturalEn: "When the formidable adversary Pain attacked to annihilate the village, Naruto mastered Sage Jutsu and saved the village from destruction single-handedly."
          },
          {
            ja: "かつて彼を化け物として恐れていた村人たちは、英雄として帰還したナルトを歓声と涙で迎え入れたのです。",
            naturalEn: "The villagers who once feared him as an omen greeted Naruto's return as a hero with thunderous applause and tears of gratitude."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "第四次忍界大戦という世界の命運を分ける戦いにおいても、ナルトの諦めない心が全忍の希望となりました。",
            naturalEn: "Even in the Fourth Great Ninja War that weighed the fate of the entire world, Naruto's refusal to surrender became the beacon of hope for all ninja."
          },
          {
            ja: "憎しみの連鎖を断ち切るために敵の悲しみにも耳を傾け、ついに九尾の狐とも真の友情を築き上げました。",
            naturalEn: "To sever the vicious cycle of hatred, he listened to his enemies' sorrow and ultimately forged a genuine friendship with the Nine-Tails itself."
          },
          {
            ja: "夢を疑うことなく歩み続けた少年は、やがて万人に敬愛される立派な火影へと成長を遂げたのでした。",
            naturalEn: "The boy who walked forward without ever doubting his aspirations grew into a noble Hokage revered and beloved by all."
          }
        ]
      }
    ],
    quiz: [
      {
        question: "幼少期のナルトが里の大人たちから避けられていた本当の理由は何ですか。",
        questionEn: "What was the true reason Naruto was avoided by the village adults during his childhood?",
        options: [
          "かつて里を襲った九尾の妖狐が体内に封印されていたから",
          "忍者の試験でいつも不正を働いていたから",
          "他国のスパイとして疑われていたから",
          "里の掟を破って外の世界へ逃げ出したから"
        ],
        optionsEn: [
          "The Nine-Tailed Fox that once attacked the village was sealed inside his body",
          "He was constantly cheating on his ninja examinations",
          "He was suspected of espionage on behalf of a rival country",
          "He broke the village decrees and escaped into the outside world"
        ],
        answerIndex: 0,
        explanation: "里を壊滅寸前に追い込んだ恐ろしい九尾の妖狐をその身に宿していたため、大人たちから忌み嫌われていました。"
      },
      {
        question: "ナルトの生き方の根底にある「忍道」とはどのような信念ですか。",
        questionEn: "What belief embodies the core of Naruto's 'ninja way'?",
        options: [
          "一度口にした自分の言葉は決して曲げず、諦めないこと",
          "任務を達成するためならどんな嘘をついても良いということ",
          "強い者には決して逆らわずに従うこと",
          "お金と権力を手に入れて里を支配すること"
        ],
        optionsEn: [
          "Never going back on one's word and never giving up",
          "Telling any lie necessary as long as the mission succeeds",
          "Always submitting to the strong without resistance",
          "Acquiring wealth and authority to rule the village"
        ],
        answerIndex: 0,
        explanation: "「まっすぐ自分の言葉は曲げねぇ」という不屈の信念こそが、ナルトの人生を導く忍道です。"
      },
      {
        question: "ペインの襲撃から里を救った後、村人たちはナルトをどのように迎えましたか。",
        questionEn: "How did the villagers welcome Naruto after he saved the village from Pain's assault?",
        options: [
          "かつての偏見を改め、英雄として歓声と涙で迎え入れた",
          "さらに恐ろしい化け物として里から追い出した",
          "ナルトの功績を認めず、サスケを褒め称えた",
          "冷たい態度を一切変えずに無視し続けた"
        ],
        optionsEn: [
          "Setting aside past prejudices, they welcomed him as a hero with cheers and tears",
          "Banishing him from the village as an even more terrifying beast",
          "Refusing to acknowledge his deed while praising Sasuke instead",
          "Ignoring him completely without changing their cold demeanor"
        ],
        answerIndex: 0,
        explanation: "命を賭して里を守り抜いたナルトの姿を見て、村人たちは彼を真の英雄として心から讃えました。"
      }
    ]
  },

  // 5. Demon Slayer (鬼滅の刃)
  {
    id: "story-n3-demon-slayer",
    slug: "demon-slayer",
    title: "鬼滅の刃：雪山の誓いと水の呼吸",
    titleRomaji: "Kimetsu no Yaiba: Yukiyama no Chikai to Mizu no Kokyuu",
    titleEn: "Demon Slayer: Mountain Oath and Water Breathing",
    category: "Anime & Pop Culture",
    tags: ["Anime", "N3", "Historical", "Demons", "Family Bond"],
    paragraphs: [
      {
        sentences: [
          {
            ja: "大正時代の雪深い山奥で、炭焼きの少年炭治郎は家族と仲睦まじく暮らしていました。",
            naturalEn: "In the snow-blanketed mountains of the Taisho era, a charcoal-selling youth named Tanjiro lived harmoniously with his family."
          },
          {
            ja: "彼は父親を亡くした家庭を長男として支えるため、町へ炭を売りに出かける心優しい働き者でした。",
            naturalEn: "As the eldest son supporting the household after losing his father, he was a kind and diligent worker who traveled to town to sell charcoal."
          },
          {
            ja: "ある吹雪の翌朝、町から帰宅した炭治郎の目に飛び込んできたのは、血に染まった惨たらしい我が家の姿でした。",
            naturalEn: "The morning after a blizzard, what greeted Tanjiro's eyes upon returning home was the horrific sight of his house soaked in blood."
          },
          {
            ja: "家族全員が鬼に襲われて命を奪われる中、唯一微かに息のあった妹の禰豆子だけを背負って雪山を駆け下りました。",
            naturalEn: "With his entire family slain by a demon, he carried his only surviving sister Nezuko, who barely drew breath, dashing down the snowy peak."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "ところが傷口から鬼の血が入り込んだせいで、禰豆子は凶暴な鬼へと変貌を遂げてしまっていたのです。",
            naturalEn: "However, because demon blood had seeped into her wounds, Nezuko had transformed into a feral demon."
          },
          {
            ja: "襲いかかってくる妹に対して、炭治郎は必死に呼びかけ、彼女の中に眠る家族への愛を呼び覚ましました。",
            naturalEn: "As his sister lunged at him, Tanjiro called out desperately, awakening the love for family slumbering inside her soul."
          },
          {
            ja: "そこへ鬼殺隊の剣士である冨岡義勇が現れ、人を喰らう危険のある禰豆子を刀で斬り捨てようとしました。",
            naturalEn: "At that moment, Giyu Tomioka, a swordsman of the Demon Slayer Corps, appeared and moved to slay Nezuko with his blade."
          },
          {
            ja: "炭治郎は土下座して命乞いをするものの、「生殺与奪の権を他人に握らせるな」と厳しく叱責されました。",
            naturalEn: "Tanjiro prostrated himself in tears, but was sternly reprimanded: 'Never surrender the power over life and death to another!'"
          }
        ]
      },
      {
        sentences: [
          {
            ja: "妹を人間に戻す道を探すため、炭治郎は義勇の言葉に従って狭霧山の鱗滝左近次のもとで修行を始めました。",
            naturalEn: "To seek a means of turning his sister back into human, Tanjiro followed Giyu's guidance to apprentice under Sakonji Urokodaki on Mount Sagiri."
          },
          {
            ja: "山中の罠をかいくぐりながら、彼は剣術の基本である「全集中の呼吸」と「水の呼吸」を体得していきました。",
            naturalEn: "Evading lethal traps across the rugged mountain, he mastered the fundamentals of Total Concentration Breathing and Water Breathing."
          },
          {
            ja: "巨大な岩を一刀両断するという過酷な試練を乗り越え、彼は鬼殺隊の最終選別へと挑むことになりました。",
            naturalEn: "Overcoming the daunting trial of cleaving a massive boulder in two with a single strike, he advanced to challenge the Final Selection."
          },
          {
            ja: "七日間に及ぶ命がけの選別を生き延びた炭治郎は、黒い日輪刀を授かり、正式な隊士として認められました。",
            naturalEn: "Surviving seven grueling days of life-and-death trials, Tanjiro was bestowed a pitch-black Nichirin sword and recognized as an official corps member."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "太陽の光を浴びると消滅してしまう禰豆子のために特製の木箱を作り、彼は妹を背負って任務地へと赴きました。",
            naturalEn: "Crafting a special wooden box for Nezuko, who would perish if touched by sunlight, he set off for mission sites carrying her on his back."
          },
          {
            ja: "道中で出会った臆病だが雷の呼吸を極めた善逸や、猪の皮を被った野性的な伊之助と共に数々の死闘を繰り広げました。",
            naturalEn: "Along his travels, he braved numerous life-and-death clashes alongside Zenitsu, cowardly yet a Thunder master, and the feral, boar-masked Inosuke."
          },
          {
            ja: "倒した鬼に対しても、元は悲しい人間であったことを理解する炭治郎の手のひらは、いつも慈悲の温もりに満ちていました。",
            naturalEn: "Even toward the demons he vanquished, Tanjiro's gentle palm held warm compassion, understanding that they were once sorrowful humans."
          },
          {
            ja: "その優しい心こそが、過酷な戦いの中で仲間たちの冷えた心を溶かす光となっていったのです。",
            naturalEn: "That pure kindness became a radiant light that melted the frozen hearts of comrades amid the unforgiving war."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "すべての元凶である鬼舞辻無惨の打倒と、妹の人間への治癒を目指す戦いは、柱と呼ばれる最強の剣士たちをも巻き込んでいきました。",
            naturalEn: "The campaign to overthrow the progenitor Muzan Kibutsuji and restore Nezuko's humanity eventually drew in the elite Hashira swordsmen."
          },
          {
            ja: "どれほど絶望的な状況に追い込まれようとも、炭治郎は決して諦めることなく前を向き続けました。",
            naturalEn: "No matter how hopeless the circumstances grew, Tanjiro kept looking forward without ever giving in to despair."
          },
          {
            ja: "家族の絆と兄妹の固い誓いを胸に、彼の振るう刃は夜の闇を切り裂いて新しい夜明けを引き寄せるのでした。",
            naturalEn: "Bearing his family's bond and his sibling oath in his heart, the blade he swung slashed through the dark night to usher in a new dawn."
          }
        ]
      }
    ],
    quiz: [
      {
        question: "鬼殺隊の剣士・冨岡義勇が命乞いをする炭治郎に浴びせた言葉は何ですか。",
        questionEn: "What words did the Demon Slayer Giyu Tomioka sternly direct at the pleading Tanjiro?",
        options: [
          "生殺与奪の権を他人に握らせるな",
          "金を出せば妹の命を見逃してやろう",
          "鬼になった者は全員問答無用で斬り捨てる",
          "今すぐ雪山から逃げて二度と姿を見せるな"
        ],
        optionsEn: [
          "Never surrender the power over life and death to another!",
          "If you pay me money, I will spare your sister's life",
          "All who become demons are cut down without question",
          "Run away from this mountain now and never show your face again"
        ],
        answerIndex: 0,
        explanation: "「泣くな、絶望するな。生殺与奪の権を他人に握らせるな」と、弱腰の炭治郎を厳しく叱咤しました。"
      },
      {
        question: "炭治郎が日中の移動時に妹の禰豆子を木箱に入れて背負っている理由は何ですか。",
        questionEn: "Why does Tanjiro carry his sister Nezuko in a wooden box during daytime travels?",
        options: [
          "鬼は日光を浴びると体が消滅してしまうから",
          "禰豆子が歩くのが嫌いで甘えているから",
          "木箱の中に隠しておかないと警察に捕まるから",
          "重い荷物を背負うことで足腰を鍛える修行のため"
        ],
        optionsEn: [
          "Demons disintegrate and perish when exposed to sunlight",
          "Nezuko dislikes walking and wants to be pampered",
          "She would be arrested by the police if not hidden in a box",
          "It is a training method to strengthen his legs by carrying heavy cargo"
        ],
        answerIndex: 0,
        explanation: "鬼は太陽の光を浴びると体が燃えて塵になってしまうため、遮光された特製木箱で守る必要があります。"
      },
      {
        question: "炭治郎が倒した鬼に対して見せる独特の姿勢はどのようなものですか。",
        questionEn: "What unique attitude does Tanjiro exhibit toward the demons he defeats?",
        options: [
          "元は哀しい人間であったことを理解し、慈悲と温もりをもって接する",
          "悪鬼滅殺を誇り、踏みつけにして嘲笑する",
          "鬼の持っている宝物を奪い取る",
          "二度と蘇らないように塩を撒き散らす"
        ],
        optionsEn: [
          "Understanding they were once sorrowful humans, treating them with compassion and warmth",
          "Pridefully trampling and mocking them as eliminated evil",
          "Plundering whatever valuables the demon possessed",
          "Scattering salt so they can never revive again"
        ],
        answerIndex: 0,
        explanation: "炭治郎は鬼を醜い化け物として見下すのではなく、かつて人間であった哀しみに寄り添う深い優しさを持っています。"
      }
    ]
  },

  // 6. Death Note (デスノート)
  {
    id: "story-n3-death-note",
    slug: "death-note",
    title: "デスノート：正義の天秤と頭脳戦",
    titleRomaji: "Desu Nooto: Seigi no Tenbin to Zunousen",
    titleEn: "Death Note: Scales of Justice and Battle of Wits",
    category: "Anime & Pop Culture",
    tags: ["Anime", "N3", "Psychological", "Suspense", "Justice"],
    paragraphs: [
      {
        sentences: [
          {
            ja: "全国模試で常にトップの成績を収める高校生の夜神月は、退屈で腐敗した日常に強い失望を感じていました。",
            naturalEn: "High schooler Light Yagami, who consistently achieved the top score in national mock exams, harbored profound disillusionment toward a boring, corrupted daily life."
          },
          {
            ja: "ある雨上がりの放課後、校庭の芝生の上に落ちていた一冊の黒いノートを偶然見つけることになりました。",
            naturalEn: "One afternoon after the rain cleared, he happened upon a solitary black notebook lying on the schoolyard lawn."
          },
          {
            ja: "表紙に「DEATH NOTE」と記されたその帳面には、名前を書かれた人間は必ず死ぬという奇妙な規則が記されていました。",
            naturalEn: "On that booklet emblazoned with 'DEATH NOTE' upon its cover, strange rules stating that anyone whose name was written would inevitably die were inscribed."
          },
          {
            ja: "最初は単なる悪質な悪戯だと疑ったものの、テレビで報道されていた凶悪犯の名前を試しに書き込んでみました。",
            naturalEn: "Though initially suspecting it to be merely a malicious prank, he tentatively penned down the name of a heinous criminal broadcast on the news."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "四十秒後、犯人が心臓麻痺で死亡したという速報が流れ、月はノートの恐るべき効力に戦慄しました。",
            naturalEn: "Forty seconds later, a breaking report flashed stating that the culprit had died of a heart attack, causing Light to shudder at the notebook's terrifying efficacy."
          },
          {
            ja: "退屈しのぎにノートを落としたと語る死神リュークが彼の前に姿を現した時、月はすでに自らの使命を確信していました。",
            naturalEn: "When the Shinigami Ryuk, who claimed to have dropped the notebook merely out of boredom, materialized before him, Light was already convinced of his destiny."
          },
          {
            ja: "「法で裁けない凶悪犯を根絶やしにして、自分自身が新世界の神になる」という野望を抱くようになったのです。",
            naturalEn: "He began harboring the boundless ambition of 'exterminating evil criminals beyond the law's grasp and becoming the god of a brand-new world.'"
          },
          {
            ja: "裁きの鉄槌を下し続ける彼の存在は、インターネット上で「キラ」と呼ばれ、民衆から崇拝と恐怖の両方を集めました。",
            naturalEn: "His presence, continually dropping the hammer of judgment, came to be known across the internet as 'Kira,' drawing both worship and dread from the populace."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "しかし無差別な連続不審死を看過できない警察組織に対し、世界一の名探偵である「L」が捜査に乗り出しました。",
            naturalEn: "However, facing suspicious serial fatalities that could not be overlooked, the world's greatest detective, 'L,' entered the investigation."
          },
          {
            ja: "Lは生中継のおとり放送を巧みに利用し、キラが日本の関東地方に潜伏している事実を一瞬で見抜いてみせました。",
            naturalEn: "Skilfully utilizing a live decoy television broadcast, L deduced in an instant the undeniable fact that Kira was lurking in Japan's Kanto region."
          },
          {
            ja: "正義を信じる二人の天才による、一歩も引かない極限の頭脳戦がついに火蓋を切ることになったのです。",
            naturalEn: "Between two geniuses who each genuinely believed in justice, a climactic battle of wits where neither yielded a solitary step finally caught fire."
          },
          {
            ja: "月は捜査本部に入り込んでLの弱点を探ろうとし、Lもまた月こそがキラではないかと鋭い疑念の目を向け続けました。",
            naturalEn: "Light infiltrated the task force seeking L's vulnerabilities, while L persistently aimed a sharp eye of suspicion at Light being Kira."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "ノートのルールを巧みに利用した月の心理戦によって、ついにLを追い詰めることに成功しました。",
            naturalEn: "Through Light's psychological warfare skillfully weaponizing the notebook's intricate rules, he finally succeeded in cornering L."
          },
          {
            ja: "しかしLが遺した意志と後継者たちによって、月の完璧だったはずの計画にわずかな綻びが生じ始めました。",
            naturalEn: "Yet through the will left behind by L and his successors, minute fissures began to crack open across Light's supposedly infallible master plan."
          },
          {
            ja: "理想の新世界を創るはずだった正義は、いつしか自分に逆らう者を容赦なく抹殺する独裁へと歪んでいきました。",
            naturalEn: "The justice that was originally meant to birth an ideal world gradually warped into a cold tyranny that mercilessly liquidated any who opposed him."
          },
          {
            ja: "傲慢さに囚われた天才の結末は、静かに死神の瞳に映し出されることになったのでした。",
            naturalEn: "The tragic demise of the genius ensnared by his own hubris was destined to be silently reflected in the gaze of the Shinigami."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "善悪の境界線はどこにあるのかという問いは、ノートが消え去った後も人々の心に重く問いかけられています。",
            naturalEn: "The poignant question of where the boundary between good and evil truly lies continues to weigh heavily on human hearts even after the notebook's departure."
          },
          {
            ja: "絶対的な力を手に入れた時、人間は自らの良心を失わずにいられるのかを物語は静かに語りかけています。",
            naturalEn: "The narrative quietly poses whether a mortal human can retain their conscience when placed in possession of absolute, unchecked power."
          }
        ]
      }
    ],
    quiz: [
      {
        question: "夜神月がデスノートを使って犯罪者を裁こうとした動機は何ですか。",
        questionEn: "What was Light Yagami's motivation for judging criminals using the Death Note?",
        options: [
          "腐敗した世の中の悪人を根絶し、自らが新世界の神になるため",
          "警察から巨額の賞金を獲得するため",
          "死神リュークに脅迫されて仕方がなかったから",
          "失われた親の復讐を果たすため"
        ],
        optionsEn: [
          "To eradicate wrongdoers from a corrupt world and become the god of a new era",
          "To collect a gigantic bounty from the police department",
          "Because he was coerced into doing so by the Shinigami Ryuk",
          "To exact revenge for the loss of his deceased parents"
        ],
        answerIndex: 0,
        explanation: "月は退屈で腐敗した世界を変革するため、悪人を裁いて新世界の神として君臨しようと目論みました。"
      },
      {
        question: "名探偵Lがテレビのおとり放送を使って証明したことは何ですか。",
        questionEn: "What did the detective L prove by utilizing the televised decoy broadcast?",
        options: [
          "キラが日本の関東地方に実在して潜伏していること",
          "キラがアメリカの政府高官であること",
          "デスノートが偽物であり誰も死んでいないこと",
          "キラが未成年の中学生であること"
        ],
        optionsEn: [
          "That Kira genuinely existed and was residing in Japan's Kanto region",
          "That Kira was a high-ranking government official in the United States",
          "That the Death Note was a forgery and nobody had actually perished",
          "That Kira was an underage middle school student"
        ],
        answerIndex: 0,
        explanation: "Lは関東地方限定の偽中継でキラを挑発し、犯人が日本国内、特に関東にいることを一挙に特定しました。"
      },
      {
        question: "この物語が読者に投げかけている根本的なテーマは何ですか。",
        questionEn: "What fundamental theme does this narrative pose to the audience?",
        options: [
          "絶対的な力を得た時、人間が正義の暴走や傲慢を抑えられるかという問い",
          "ノートを拾ったらすぐに警察に届けるべきだという道徳教育",
          "勉強ばかりしていると退屈になるという警告",
          "りんごをたくさん食べると健康になるという事実"
        ],
        optionsEn: [
          "The question of whether humans can resist arrogance and corrupting justice when granted absolute power",
          "A moral lesson that one should immediately hand lost notebooks to the police",
          "A warning that studying too much causes intense boredom",
          "The nutritional fact that eating many apples promotes great health"
        ],
        answerIndex: 0,
        explanation: "正義の名のもとに絶対的な力を振るう危険性と、善悪の境界線の難しさを深く掘り下げた物語です。"
      }
    ]
  },

  // 7. Dragon Ball (ドラゴンボール)
  {
    id: "story-n3-dragon-ball",
    slug: "dragon-ball",
    title: "ドラゴンボール：七つの玉と限界突破",
    titleRomaji: "Doragon Booru: Nanatsu no Tama to Genkai Toppa",
    titleEn: "Dragon Ball: The Seven Orbs and Surpassing Limits",
    category: "Anime & Pop Culture",
    tags: ["Anime", "N3", "Martial Arts", "Adventure", "Growth"],
    paragraphs: [
      {
        sentences: [
          {
            ja: "自然豊かなパオズ山で暮らす尻尾の生えた純朴な少年・孫悟空は、並外れた怪力の持ち主でした。",
            naturalEn: "Living in the lush wilderness of Mount Paozu, an innocent, tail-bearing boy named Son Goku possessed extraordinary superhuman strength."
          },
          {
            ja: "ある日、都会からやってきた少女ブルマと出会ったことで、彼の運命は大きく動き出しました。",
            naturalEn: "One fateful day, upon crossing paths with Bulma, a clever girl hailing from the metropolis, the gears of his destiny began turning dynamically."
          },
          {
            ja: "世界中に散らばる七つのドラゴンボールをすべて集めると、巨大な神龍が現れてどんな願いも一つ叶えてくれるというのです。",
            naturalEn: "It was said that if one gathered all seven Dragon Balls scattered across the world, a giant dragon named Shenron would appear and grant any single wish."
          },
          {
            ja: "祖父の形見である四星球を持っていた悟空は、まだ見ぬ未知の世界を見るために旅立ちを決意しました。",
            naturalEn: "Possessing the Four-Star Ball as a cherished keepsake of his grandfather, Goku resolved to embark on a journey to see an unseen world."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "ドラゴンレーダーの反応を頼りに旅を続けるうちに、砂漠の盗賊ヤムチャなど多彩な人物と巡り会いました。",
            naturalEn: "Relying on the signals of the Dragon Radar as they traveled, they crossed paths with colorful figures including the desert bandit Yamcha."
          },
          {
            ja: "旅を終えた後、悟空は更なる強さを求めて武術の達人である亀仙人の下で修業することになりました。",
            naturalEn: "Following their initial journey, Goku decided to apprentice under Master Roshi, a venerable master of martial arts, in search of greater strength."
          },
          {
            ja: "同門のクリリンと共に重い甲羅を背負い、毎朝の牛乳配達や畑仕事を通して基礎体力を徹底的に鍛え上げました。",
            naturalEn: "Alongside fellow disciple Krillin, he carried heavy turtle shells, thoroughly forging foundational fitness through morning milk deliveries and plowing fields."
          },
          {
            ja: "ただ力任せに戦うのではなく、「よく学び、よく遊び、よく食べ、よく休む」という武道の極意を学んだのです。",
            naturalEn: "Rather than merely relying on raw brute force, he absorbed the deeper martial essence: 'Study well, play well, eat well, and rest well.'"
          }
        ]
      },
      {
        sentences: [
          {
            ja: "世界一の武道家を決める天下一武道会において、悟空は並み居る強豪たちを相手に目覚ましい活躍を見せました。",
            naturalEn: "At the World Martial Arts Tournament that determined the globe's finest fighter, Goku displayed spectacular performance against prominent champions."
          },
          {
            ja: "決勝で敗れたにもかかわらず、自分よりも強い相手が世界にたくさんいることを知った彼は大喜びしました。",
            naturalEn: "Despite suffering defeat in the championship match, he was overjoyed to learn that countless rivals stronger than himself inhabited the world."
          },
          {
            ja: "強敵と戦うこと自体を純粋に楽しむ彼の笑顔は、かつての敵であった天津飯やピッコロの心をも変えていきました。",
            naturalEn: "His beaming smile, purely relishing the joy of clashing with formidable opponents, ended up altering the hearts of former adversaries like Tien and Piccolo."
          },
          {
            ja: "地球を脅かす悪の軍団や宇宙からの侵略者に対しても、彼は仲間たちと共に命がけで立ち向かいました。",
            naturalEn: "Even against evil syndicates endangering Earth and invaders descending from outer space, he stood alongside his friends, risking life and limb."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "強大な宇宙の帝王フリーザとの決戦において、最愛の親友クリリンを目の前で奪われる悲劇に見舞われました。",
            naturalEn: "In the climactic showdown against the mighty galactic emperor Frieza, Goku suffered the tragedy of having his dearest friend Krillin slain right before his eyes."
          },
          {
            ja: "激しい怒りによって眠っていた戦闘民族サイヤ人の血が覚醒し、伝説の超サイヤ人へと変貌を遂げました。",
            naturalEn: "Through incandescent fury, the dormant blood of the warrior race Saiyans awoke, prompting his transformation into the legendary Super Saiyan."
          },
          {
            ja: "黄金のオーラを纏った悟空の圧倒的な力は、宇宙の運命を左右する激闘を制する決定打となったのです。",
            naturalEn: "Goku's overwhelming might enveloped in a radiant golden aura served as the decisive blow in the conflict that decided the fate of the cosmos."
          },
          {
            ja: "しかし強くなってもなお、悟空の根底にあるのは誰かを支配することではなく、自己の限界を超える喜びでした。",
            naturalEn: "Yet even as his power escalated, what laid at Goku's core was never dominating anyone, but simply the joy of transcending his own limitations."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "どれほど絶望的な強敵が現れようとも、悟空は「オラ、ワクワクしてきたぞ」と笑って前を向きます。",
            naturalEn: "No matter how hopelessly formidable an opponent emerged, Goku would look ahead with a grin, declaring 'I'm getting really excited now!'"
          },
          {
            ja: "七つの光る玉が繋いだ仲間たちの絆は、時空や宇宙の境界さえも超えて永遠に輝き続けています。",
            naturalEn: "The bonds forged among companions connected by the seven shining orbs continue to radiate eternally, even transcending space, time, and cosmos."
          }
        ]
      }
    ],
    quiz: [
      {
        question: "孫悟空が亀仙人のもとで学んだ武道の極意はどのようなものですか。",
        questionEn: "What core martial principle did Son Goku learn under Master Roshi?",
        options: [
          "よく学び、よく遊び、よく食べ、よく休むこと",
          "敵を倒すためなら手段を選ばないこと",
          "夜遅くまで寝ずにひたすらパンチの練習をすること",
          "お金をたくさん稼ぐために賞金稼ぎになること"
        ],
        optionsEn: [
          "Study well, play well, eat well, and rest well",
          "Using any unscrupulous means necessary to crush the opponent",
          "Practicing punches relentlessly through the night without sleep",
          "Becoming a bounty hunter to earn vast sums of wealth"
        ],
        answerIndex: 0,
        explanation: "亀仙流の教えは、無理な力づくではなく健全な生活と心身の調和を保ちながら強くなることです。"
      },
      {
        question: "悟空が伝説の「超サイヤ人」へと覚醒した直接のきっかけは何ですか。",
        questionEn: "What was the immediate catalyst for Goku awakening into the legendary 'Super Saiyan'?",
        options: [
          "最愛の親友クリリンをフリーザに目の前で殺された激しい怒り",
          "ドラゴンボールに願いをかけてパワーアップしたこと",
          "毎日休まずに腕立て伏せを一万回達成したこと",
          "亀仙人から特別な秘薬をもらって飲んだこと"
        ],
        optionsEn: [
          "Fierce fury at witnessing his dearest friend Krillin murdered by Frieza before his eyes",
          "Wishing on the Dragon Balls for an instant power boost",
          "Completing ten thousand push-ups every single day without pause",
          "Receiving and drinking a secret elixir brewed by Master Roshi"
        ],
        answerIndex: 0,
        explanation: "理不尽に親友を奪われた激しい怒りと悲しみによって、サイヤ人の眠れる伝説の力が解き放たれました。"
      },
      {
        question: "天下一武道会の決勝で敗れた時、悟空が喜んだ理由は何ですか。",
        questionEn: "Why was Goku delighted when he lost in the finals of the World Martial Arts Tournament?",
        options: [
          "世界には自分よりも強い相手がまだまだたくさんいると知ったから",
          "準優勝の賞金で高級な肉がたくさん買えたから",
          "早く家に帰って昼寝ができるようになったから",
          "審判に気に入られてトロフィーをもらえたから"
        ],
        optionsEn: [
          "He realized there were still countless fighters in the world far stronger than himself",
          "He could buy plenty of gourmet meat with the runner-up prize money",
          "He was finally able to return home early to take a peaceful nap",
          "He was favored by the referee and awarded an honorary trophy"
        ],
        answerIndex: 0,
        explanation: "悟空は負けたことを悔しがるだけでなく、更なる強みと未知の好敵手が存在することに心から胸を躍らせました。"
      }
    ]
  },

  // 8. Fullmetal Alchemist (鋼の錬金術師)
  {
    id: "story-n3-fullmetal-alchemist",
    slug: "fullmetal-alchemist",
    title: "鋼の錬金術師：等価交換の旅路",
    titleRomaji: "Hagane no Renkinjutsushi: Touka Koukan no Tabiji",
    titleEn: "Fullmetal Alchemist: Journey of Equivalent Exchange",
    category: "Anime & Pop Culture",
    tags: ["Anime", "N3", "Science Fantasy", "Brotherhood", "Philosophy"],
    paragraphs: [
      {
        sentences: [
          {
            ja: "錬金術が高度に発達した世界において、その基本原則は「等価交換」という絶対の真理に基づいています。",
            naturalEn: "In a world where alchemy developed to great heights, its fundamental principle rested on the absolute truth of 'Equivalent Exchange.'"
          },
          {
            ja: "何かを得ようとするならば、必ずそれと同等の代価を支払わなければならないという厳しい法則です。",
            naturalEn: "It is a stern law dictating that if one seeks to obtain something, an equal compensation must invariably be rendered."
          },
          {
            ja: "幼いエルリック兄弟、エドワードとアルフォンスは、病気で急逝した最愛の母親を取り戻したい一心でした。",
            naturalEn: "The young Elric brothers, Edward and Alphonse, were consumed by the solitary desire to bring back their beloved mother who passed from illness."
          },
          {
            ja: "錬金術における最大の禁忌とされていた「人体錬成」に手を染めるという過ちを犯してしまったのです。",
            naturalEn: "They committed the fateful mistake of dabbling in 'Human Transmutation,' which was branded the greatest taboo in alchemy."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "錬成は無残にも失敗し、反動によって弟のアルは全身を奪われ、兄のエドは左足を失ってしまいました。",
            naturalEn: "The transmutation failed disastrously; in the rebound, younger brother Al lost his entire body, and elder brother Ed lost his left leg."
          },
          {
            ja: "消えゆく弟の魂をつなぎ止めるため、エドは自らの右腕を犠牲にして巨大な鎧にアルの魂を定着させました。",
            naturalEn: "To tether his vanishing brother's soul, Ed sacrificed his own right arm, binding Alphonse's soul to a colossal suit of armor."
          },
          {
            ja: "「立って歩け、前へ進め。あんたには立派な足がついているじゃないか」と自らを鼓舞し、二人は立ち上がりました。",
            naturalEn: "Inspiring themselves with 'Stand up and walk, move forward; don't you have fine legs of your own?', the two rose again."
          },
          {
            ja: "失った身体を取り戻す手がかりを求めて、エドは最年少で国家錬金術師の資格を取得する道を選んだのです。",
            naturalEn: "Seeking clues to recover their lost physical bodies, Ed chose the arduous path of becoming the youngest State Alchemist in history."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "機械鎧と呼ばれる義手と義足を装着したエドは、「鋼の錬金術師」の二つ名で広く知られるようになりました。",
            naturalEn: "Fitted with prosthetic limbs known as automail, Ed came to be widely known by the moniker 'the Fullmetal Alchemist.'"
          },
          {
            ja: "伝説の増幅器である「賢者の石」を探す旅の途中で、兄弟は各地で様々な人々の温もりと悲哀に触れました。",
            naturalEn: "During their voyage searching for the legendary amplifier, the 'Philosopher's Stone,' the brothers touched upon the warmth and sorrow of diverse people."
          },
          {
            ja: "しかし調査を進めるうちに、賢者の石の原材料が生きた人間そのものであるという恐ろしい真相に突き当たりました。",
            naturalEn: "However, as their investigation deepened, they struck upon the horrific revelation that the raw material for the stone was living humans themselves."
          },
          {
            ja: "他人の命を犠牲にしてまで自分たちの身体を取り戻すことなどできないと、二人は激しく葛藤しました。",
            naturalEn: "The brothers wrestled with profound inner turmoil, declaring that they could never reclaim their bodies at the cost of other people's lives."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "国全体を巨大な錬成陣に見立てて支配を目論む謎の黒幕「お父様」の陰謀が次第に明らかになっていきました。",
            naturalEn: "The conspiracy of a shadowy mastermind known as 'Father,' who intended to treat the entire nation as a gigantic transmutation circle for dominion, unfolded."
          },
          {
            ja: "マスタング大佐をはじめとする信頼できる仲間たちと共に、兄弟は国家規模の危機を阻止すべく立ち向かいました。",
            naturalEn: "Alongside trusted comrades including Colonel Mustang, the brothers stood firm to thwart a catastrophe of nationwide magnitude."
          },
          {
            ja: "神の力を手に入れようと傲慢に振る舞う敵に対して、人間が持つ不完全さと助け合いの尊さを叫び続けました。",
            naturalEn: "Against the foe behaving with reckless arrogance to seize the power of god, they proclaimed the virtue of human imperfection and mutual support."
          },
          {
            ja: "最終決戦においてエドは、弟を取り戻すための最後の代価として、自らの「錬金術を使う能力そのもの」を差し出しました。",
            naturalEn: "In the final showdown, Ed offered his very 'ability to perform alchemy' as the ultimate collateral to reclaim his brother."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "錬金術が使えなくなっても大切な仲間や家族がいるという真理に辿り着いた時、真理の扉は彼を笑顔で称えました。",
            naturalEn: "When he arrived at the realization that he still had precious comrades and family even without alchemy, the Truth praised him with a smile."
          },
          {
            ja: "痛みを知る者だからこそ他人に優しくなれるという教訓を胸に、兄弟の新しい旅が爽やかに始まったのでした。",
            naturalEn: "With the profound lesson that only those who know pain can show true kindness to others, the brothers' new journey began with a refreshing stride."
          }
        ]
      }
    ],
    quiz: [
      {
        question: "エルリック兄弟が身体を失うことになった禁忌の錬金術は何ですか。",
        questionEn: "What taboo alchemical act caused the Elric brothers to lose their bodies?",
        options: [
          "亡くなった母親を蘇らせようとした人体錬成",
          "国家機密の錬成陣を勝手に書き換えたこと",
          "軍の研究所から賢者の石を盗み出したこと",
          "金を大量に錬成して市場を混乱させたこと"
        ],
        optionsEn: [
          "Human Transmutation attempted to revive their deceased mother",
          "Arbitrarily rewriting classified military transmutation circles",
          "Stealing a Philosopher's Stone from a state research facility",
          "Transmuting vast heaps of gold to disrupt the financial market"
        ],
        answerIndex: 0,
        explanation: "死んだ人間を蘇らせようとする「人体錬成」は錬金術最大のタブーであり、重い代償を支払うことになりました。"
      },
      {
        question: "兄弟が探していた「賢者の石」に隠されていた恐ろしい真実とは何ですか。",
        questionEn: "What was the horrifying truth concealed within the 'Philosopher's Stone' they sought?",
        options: [
          "生きた多数の人間の命を原材料にして作られていること",
          "使うと持ち主の記憶がすべて消えてしまうこと",
          "触れたものをすべて猛毒に変えてしまうこと",
          "実はただの赤く染められたガラス玉であること"
        ],
        optionsEn: [
          "It is manufactured using countless living human lives as raw material",
          "Using it wipes away all memories of the wielder",
          "Whatever it touches turns into lethal poison",
          "It is actually merely an ordinary piece of red-dyed glass"
        ],
        answerIndex: 0,
        explanation: "等価交換の代価として、生きた大勢の人間を犠牲にして凝縮された結晶こそが賢者の石の正体でした。"
      },
      {
        question: "エドが弟の身体を取り戻すために最後に真理へ差し出したものは何ですか。",
        questionEn: "What did Ed surrender to the Truth as the final exchange to restore his brother's body?",
        options: [
          "自らの錬金術を使う能力そのもの（真理の扉）",
          "国家錬金術師の銀時計とすべての財産",
          "自分の残されたもう一方の手足",
          "アメストリス国の軍事最高権力"
        ],
        optionsEn: [
          "His very ability to perform alchemy (the Gate of Truth itself)",
          "His State Alchemist silver pocket watch and all financial assets",
          "His remaining physical limbs",
          "The supreme military authority of the nation of Amestris"
        ],
        answerIndex: 0,
        explanation: "「錬金術がなくてもみんながいる」と悟ったエドは、錬金術の力を手放すことで弟の肉体を取り戻しました。"
      }
    ]
  },

  // 9. My Hero Academia (僕のヒーローアカデミア)
  {
    id: "story-n3-my-hero-academia",
    slug: "my-hero-academia",
    title: "僕のヒーローアカデミア：笑顔で救う力",
    titleRomaji: "Boku no Hiiroo Akademia: Egao de Sukuu Chikara",
    titleEn: "My Hero Academia: Power to Save with a Smile",
    category: "Anime & Pop Culture",
    tags: ["Anime", "N3", "Superhero", "School", "Courage"],
    paragraphs: [
      {
        sentences: [
          {
            ja: "世界人口の約八割が何らかの超常能力である「個性」を持って生まれる社会が到来しました。",
            naturalEn: "A society arrived where approximately eighty percent of the global population was born possessing some form of superhuman ability called a 'Quirk.'"
          },
          {
            ja: "人々を脅かす悪質な犯罪者である敵を取り締まるため、「ヒーロー」という憧れの職業が確立されていたのです。",
            naturalEn: "In order to apprehend malicious criminals known as Villains who endangered the public, the revered profession of 'Hero' had been established."
          },
          {
            ja: "少年・緑谷出久は、幼い頃から平和の象徴である最強のヒーロー・オールマイトに熱烈な憧れを抱いていました。",
            naturalEn: "A boy named Izuku Midoriya had harbored ardent admiration since early childhood for All Might, the supreme hero and Symbol of Peace."
          },
          {
            ja: "しかし何の能力も持たない「無個性」として生まれたせいで、周囲からヒーローになる夢を嘲笑され続けていました。",
            naturalEn: "However, having been born 'Quirkless' with no powers whatsoever, his dream of becoming a hero was constantly mocked by those around him."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "ある日、友人の爆豪勝己が恐ろしいヘドロの敵に襲われ、プロのヒーローたちさえ手を出せない事態に陥りました。",
            naturalEn: "One day, when his childhood friend Katsuki Bakugo was attacked by a terrifying Sludge Villain, even professional heroes hesitated to intervene."
          },
          {
            ja: "無個性であるにもかかわらず、出久は考えるよりも先に足が動き、友を救うために現場へと駆け出していました。",
            naturalEn: "Despite being completely Quirkless, Izuku's legs moved before his brain could think, dashing straight into danger to save his friend."
          },
          {
            ja: "その無謀とも言える勇気を目撃したオールマイトは、出久の中に本物のヒーローの資質を見出しました。",
            naturalEn: "Witnessing that courage which might have seemed reckless to others, All Might discerned the unmistakable qualities of a true hero within Izuku."
          },
          {
            ja: "「君はヒーローになれる」という温かい言葉をかけられ、出久は長年堪えてきた涙を一気に溢れさせました。",
            naturalEn: "Hearing the heartwarming declaration 'You can become a hero,' Izuku let tears he had suppressed for years flow uncontrollably."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "世代を超えて受け継がれてきた伝説の個性「ワン・フォー・オール」の後継者として、出久は指名を受けました。",
            naturalEn: "Izuku was chosen as the designated successor to 'One For All,' a legendary Quirk handed down across generations."
          },
          {
            ja: "強大すぎる力に耐えられる身体を作るため、ゴミだらけの海岸を十ヶ月かけて清掃するという過酷な肉体鍛錬を成し遂げました。",
            naturalEn: "To forge a physique capable of withstanding that overwhelming power, he accomplished the grueling physical ordeal of cleaning a trash-filled beach over ten months."
          },
          {
            ja: "名門・雄英高校ヒーロー科の難関入試に見事合格し、志を同じくする多彩なクラスメイトたちと出会うことになりました。",
            naturalEn: "Splendidly passing the daunting entrance exam for the elite U.A. High School Hero Course, he met colorful classmates sharing identical aspirations."
          },
          {
            ja: "力を制御できずに骨折を繰り返しながらも、彼は持ち前の鋭い分析力を駆使して一歩ずつ成長していきました。",
            naturalEn: "Though repeatedly breaking his own bones from failing to control the power, he grew step by step by weaponizing his innate analytical acuity."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "学校への敵連合の奇襲や過酷な林間合宿を通じて、生徒たちは否応なく本物の命がけの戦いに巻き込まれていきました。",
            naturalEn: "Through surprise raids by the League of Villains on campus and a grueling training camp, the students were inevitably swept into real life-or-death warfare."
          },
          {
            ja: "オールマイトが宿敵との決闘で最後の力を使い果たした時、次代の象徴としての重責が出久の小さな肩に託されました。",
            naturalEn: "When All Might exhausted his final embers of power in a fateful duel against his archenemy, the heavy mantle of the next symbol fell upon Izuku's shoulders."
          },
          {
            ja: "誰かを助ける時に恐れを見せず、安心させるような笑顔を浮かべることの難しさと崇高さを彼は痛感しました。",
            naturalEn: "He acutely felt both the immense difficulty and the sublime majesty of flashing a reassuring smile without revealing fear when saving someone."
          },
          {
            ja: "仲間たちとお互いの弱さを補い合いながら、彼らは困難を乗り越えて「最高のヒーロー」への階段を登り始めました。",
            naturalEn: "Compensating for one another's shortcomings alongside his peers, they began climbing the steps toward becoming the greatest heroes."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "「更に向こうへ、プルス・ウルトラ！」という校訓を叫びながら、少年少女たちは今日も未来を切り拓くために走り続けています。",
            naturalEn: "Shouting their school motto 'Further beyond, Plus Ultra!', the young heroes continue sprinting forward today to carve out tomorrow."
          },
          {
            ja: "かつて無力だった少年が流した悔し涙は、今や人々を絶望から救い上げる確かな強さへと変わりました。",
            naturalEn: "The bitter tears once shed by a helpless boy have now transformed into undeniable strength that lifts people out of despair."
          },
          {
            ja: "最高のヒーローになるための彼の物語は、温かい希望の光を放ちながらどこまでも広がっていくのです。",
            naturalEn: "His story of becoming the greatest hero expands limitlessly while casting a warm, radiant light of hope."
          }
        ]
      }
    ],
    quiz: [
      {
        question: "無個性だった緑谷出久がオールマイトに後継者として認められた一番の理由は何ですか。",
        questionEn: "What was the primary reason the Quirkless Izuku Midoriya was recognized as a successor by All Might?",
        options: [
          "危険を顧みず、考えるよりも先に身体が動いて友人を助けに走ったから",
          "学校のテストで学年一番の成績を取ったから",
          "オールマイトのグッズを世界で一番たくさん集めていたから",
          "体格がプロレスラーのように頑丈だったから"
        ],
        optionsEn: [
          "Without regard for danger, his body moved before he could think to save his friend",
          "He secured the top academic score in the school grade examinations",
          "He collected the greatest amount of All Might merchandise in the world",
          "His physique was extraordinarily rugged like a professional wrestler"
        ],
        answerIndex: 0,
        explanation: "「考えるより先に体が動いていた」という自己犠牲と救助の精神こそが、真のヒーローの本質であると認められました。"
      },
      {
        question: "出久が受け継いだ伝説の能力の名前は何ですか。",
        questionEn: "What is the name of the legendary Quirk inherited by Izuku?",
        options: [
          "ワン・フォー・オール",
          "オール・フォー・ワン",
          "爆破",
          "半冷半燃"
        ],
        optionsEn: [
          "One For All",
          "All For One",
          "Explosion",
          "Half-Cold Half-Hot"
        ],
        answerIndex: 0,
        explanation: "世代を超えて力を培い受け継がれてきた聖なる個性が「ワン・フォー・オール」です。"
      },
      {
        question: "オールマイトが大切にしていた、ヒーローとしての真の理想は何ですか。",
        questionEn: "What was the true ideal of a hero cherished by All Might?",
        options: [
          "人々を安心させるため、どんな危機でも笑顔を絶やさずに救い出すこと",
          "敵を完膚なきまでに叩きのめして恐怖を与えること",
          "テレビにたくさん出演して大スターになること",
          "誰にも弱点を見せないように冷徹でいること"
        ],
        optionsEn: [
          "Saving people with an unwavering smile in any crisis to instill reassurance",
          "Beating villains to a pulp to inspire sheer terror",
          "Appearing frequently on television broadcasts to become a major celebrity",
          "Remaining cold and detached so as never to reveal any vulnerability"
        ],
        answerIndex: 0,
        explanation: "救けを求める人々を不安にさせないため、どんな逆境でも笑顔で救い出すことこそが平和の象徴の証です。"
      }
    ]
  },

  // 10. Jujutsu Kaisen (呪術廻戦)
  {
    id: "story-n3-jujutsu-kaisen",
    slug: "jujutsu-kaisen",
    title: "呪術廻戦：後悔のない死と呪いの祓い",
    titleRomaji: "Jujutsu Kaisen: Koukai no Nai Shi to Noroi no Harai",
    titleEn: "Jujutsu Kaisen: Death Without Regret and Exorcising Curses",
    category: "Anime & Pop Culture",
    tags: ["Anime", "N3", "Dark Fantasy", "Sorcery", "Life and Death"],
    paragraphs: [
      {
        sentences: [
          {
            ja: "人間の負の感情から生み出される化け物「呪い」は、人知れず日常の影に潜んで危害を及ぼしていました。",
            naturalEn: "Monstrous entities called 'Curses,' born from the negative emotions of humans, secretly lurked in everyday shadows causing harm."
          },
          {
            ja: "並外れた身体能力を持つ高校生の虎杖悠仁は、入院中だった唯一の肉親である祖父を看取ることになりました。",
            naturalEn: "High schooler Yuji Itadori, blessed with extraordinary athletic prowess, attended the bedside of his hospitalized grandfather, his sole surviving kin."
          },
          {
            ja: "臨終の間際、祖父から「オマエは強いから人を助けろ」「大勢に囲まれて死ね」という遺言を託されました。",
            naturalEn: "On the verge of death, his grandfather entrusted him with a dying wish: 'You're strong, so help people' and 'Die surrounded by others.'"
          },
          {
            ja: "その夜、オカルト研究部の先輩たちが封印の解かれた特級呪物「宿儺の指」を巡る呪いの怪異に巻き込まれてしまいました。",
            naturalEn: "That very night, upperclassmen in the Occult Research Club were swept into a deadly curse crisis surrounding the unsealed special-grade cursed object, 'Sukuna's Finger.'"
          }
        ]
      },
      {
        sentences: [
          {
            ja: "駆けつけた呪術師の伏黒恵と共に戦うものの、強力な呪霊の圧倒的な力の前に絶体絶命の危機に陥りました。",
            naturalEn: "Though fighting alongside Megumi Fushiguro, a jujutsu sorcerer who rushed to the scene, they fell into desperate peril before the curse's overwhelming power."
          },
          {
            ja: "仲間を救う力を得るため、悠仁は猛毒であるはずの宿儺の指を迷うことなく飲み込むという奇策に出ました。",
            naturalEn: "To gain the power necessary to save his companions, Yuji took the audacious gambit of swallowing Sukuna's finger without hesitation despite its lethal toxicity."
          },
          {
            ja: "千年前に君臨した呪いの王・両面宿儺が復活したものの、悠仁は奇跡的にその強大な魂を自らの肉体に抑え込むことに成功しました。",
            naturalEn: "Although Ryomen Sukuna, the King of Curses who reigned a millennium ago, revived, Yuji miraculously succeeded in suppressing that mighty soul within his vessel."
          },
          {
            ja: "呪術界の厳格な規定により即刻処刑が決まったものの、最強の呪術師・五条悟の計らいによって猶予が与えられました。",
            naturalEn: "Although an immediate execution was ordained by the strict jujutsu hierarchy, a reprieve was granted through the intervention of the strongest sorcerer, Satoru Gojo."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "「すべての宿儺の指を取り込んでから死ぬ」という過酷な運命を受け入れ、悠仁は東京都立呪術高等専門学校へ転入しました。",
            naturalEn: "Accepting the grim destiny of 'dying only after consuming every last finger of Sukuna,' Yuji transferred into Tokyo Prefectural Jujutsu High School."
          },
          {
            ja: "同級生の伏黒や釘崎野薔薇と共に、呪力をコントロールして呪いを祓うための厳しい訓練に励むことになりました。",
            naturalEn: "Alongside classmates Fushiguro and Nobara Kugisaki, he threw himself into rigorous training to manipulate cursed energy and exorcise curses."
          },
          {
            ja: "呪霊との壮絶な戦いの中で命を落としかけることもありましたが、悠仁は「自分が生きている意味」を真剣に問い続けました。",
            naturalEn: "Although coming within inches of losing his life in harrowing clashes with cursed spirits, Yuji continuously questioned the true meaning of his existence."
          },
          {
            ja: "救えるはずの人間が目の前で命を散らす無念を味わいながらも、彼の拳は決して止まることはありませんでした。",
            naturalEn: "While tasting the bitter sorrow of having innocent people he could have saved perish right before his eyes, his fists never stopped swinging."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "京都校との交流会や凶悪な特級呪霊たちとの死闘を経て、若い術師たちは目覚ましい進化を遂げていきました。",
            naturalEn: "Through the Goodwill Event with the Kyoto branch and clashes against sinister special-grade curses, the young sorcerers underwent eye-opening evolution."
          },
          {
            ja: "呪力と肉体の衝突が極限に達した瞬間に放たれる「黒閃」を習得し、悠仁は一流の戦士へと駆け上がりました。",
            naturalEn: "Mastering 'Black Flash,' unleashed at the fleeting instant when physical impact and cursed energy collide within a millionth of a second, Yuji ascended into an elite warrior."
          },
          {
            ja: "どんな理不尽な悪意に打ちのめされそうになっても、彼は祖父の言葉通り「後悔のない死」を迎えるために前進しました。",
            naturalEn: "No matter how battered by unreasonable malice, he pressed ahead to meet a 'death without regret,' exactly as his grandfather had bid."
          },
          {
            ja: "仲間と紡ぐ過酷な運命の糸は、闇に覆われた世界を照らす新たな希望の火を灯し続けているのです。",
            naturalEn: "The threads of harsh destiny woven alongside his comrades continue to kindle the fires of new hope illuminating a world shrouded in darkness."
          }
        ]
      },
      {
        sentences: [
          {
            ja: "正しさと間違いが複雑に絡み合う呪術の世界で、少年たちは自らの生き様を証明するために今日も戦い続けています。",
            naturalEn: "In the world of jujutsu where right and wrong intertwine intricately, the youths continue to fight today to prove their own way of life."
          },
          {
            ja: "呪いではなく人間として生き抜くことの重みを噛み締めながら、悠仁は一歩ずつ前へと進んでいきます。",
            naturalEn: "Cherishing the profound weight of living not as a curse but fully as a human being, Yuji advances forward one step at a time."
          },
          {
            ja: "仲間と共に流した血と涙は、決して消えることのない不屈の灯火となって彼らの行く手を照らし続けるのです。",
            naturalEn: "The blood and tears shed alongside comrades become an inextinguishable, unyielding torch illuminating the path ahead."
          }
        ]
      }
    ],
    quiz: [
      {
        question: "虎杖悠仁が特級呪物である「宿儺の指」を自ら飲み込んだ最大の理由は何ですか。",
        questionEn: "What was the main reason Yuji Itadori swallowed the special-grade cursed object 'Sukuna's Finger'?",
        options: [
          "呪霊に襲われている先輩や伏黒を助けるための力を得るため",
          "呪いの王になって世界を支配したかったから",
          "美味しい食べ物だと勘違いして口に入れてしまったから",
          "五条先生から宿題として食べるように命じられたから"
        ],
        optionsEn: [
          "To gain the power necessary to save his upperclassmen and Fushiguro from being killed by the curse",
          "Because he wished to become the King of Curses and rule the globe",
          "Because he mistook it for delicious food and put it into his mouth",
          "Because Master Gojo ordered him to eat it as homework"
        ],
        answerIndex: 0,
        explanation: "絶体絶命の危機において、仲間を救う力を手に入れるために毒物である指を飲み込む決断を下しました。"
      },
      {
        question: "悠仁の生き方に決定的な影響を与えた、祖父の最後の遺言はどのようなものですか。",
        questionEn: "What was the grandfather's final dying wish that decisively influenced Yuji's way of life?",
        options: [
          "オマエは強いから人を助けろ、大勢に囲まれて死ね",
          "一生お金に困らないように公務員を目指せ",
          "他人のことには一切関わらず、自分の命だけを守れ",
          "呪術師の世界から逃げて遠くの外国へ旅立て"
        ],
        optionsEn: [
          "You are strong, so help people; die surrounded by a crowd",
          "Aim to become a civil servant so you never struggle financially",
          "Never meddle in other people's affairs; protect only your own life",
          "Flee from the world of sorcerers and travel to a far-off foreign country"
        ],
        answerIndex: 0,
        explanation: "「人を助けろ」「大勢に囲まれて死ね」という祖父の言葉が、悠仁が呪いに立ち向かう永遠の指針となりました。"
      },
      {
        question: "打撃と呪力が極限のタイミングで衝突した際に発動する、強力な現象の名前は何ですか。",
        questionEn: "What is the name of the potent spatial phenomenon triggered when physical blow and cursed energy collide within a fraction of a second?",
        options: [
          "黒閃（こくせん）",
          "螺旋丸（らせんがん）",
          "月牙天衝（げつがてんしょう）",
          "スマッシュ"
        ],
        optionsEn: [
          "Black Flash (Kokusen)",
          "Rasengan",
          "Getsuga Tensho",
          "Smash"
        ],
        answerIndex: 0,
        explanation: "打撃のインパクトから極めて短い時間内に呪力が衝突することで空間が歪み、黒く輝く現象を「黒閃」と呼びます。"
      }
    ]
  }
];
