# N2 Passages (6 passages, 27 blanks)

n2_passages = [
  # Passage 20: N2 Exam Archetype — AI & Society Column
  {
    "id": "n2-exam-column-ai",
    "jlpt": 2,
    "sourceType": "exam-speech",
    "titleJa": "人工知能の発展と倫理的課題",
    "titleEn": "Column: Artificial Intelligence and Ethical Challenges",
    "introContextJa": "科学論壇に寄稿された、生成AIの普及と人間の創造性に関する論説です。",
    "introContextEn": "An opinion article on the spread of generative AI and human creativity.",
    "paragraphs": [
      {
        "subheadingJa": "技術革新と人間の役割",
        "sentences": [
          {
            "sentenceIndex": 0,
            "rawCompletedJa": "人工知能技術の急速な進化は、ビジネスや教育の現場に劇的な変化をもたらしています。",
            "en": "The rapid evolution of artificial intelligence technology is bringing dramatic changes to business and education.",
            "segments": [
              { "type": "text", "textJa": "人工知能技術の急速な進化は、ビジネスや教育の現場に劇的な変化をもたらしています。" }
            ]
          },
          {
            "sentenceIndex": 1,
            "rawCompletedJa": "とはいえ、生成AIが人間の創作活動を完全に代替できるわけではありません。",
            "en": "Nonetheless, it does not mean that generative AI can completely substitute human creative activities.",
            "segments": [
              { "type": "blank", "blankIndex": 0 },
              { "type": "text", "textJa": "、生成AIが人間の創作活動を完全に代替できるわけではありません。" }
            ]
          },
          {
            "sentenceIndex": 2,
            "rawCompletedJa": "このような技術革新の光と影をめぐって、世界中で活発な議論が交わされています。",
            "en": "Surrounding the light and shadow of this kind of technological innovation, vigorous discussions are being exchanged worldwide.",
            "segments": [
              { "type": "blank", "blankIndex": 1 },
              { "type": "text", "textJa": "技術革新の光と影" },
              { "type": "blank", "blankIndex": 2 },
              { "type": "text", "textJa": "、世界中で活発な議論が交わされています。" }
            ]
          },
          {
            "sentenceIndex": 3,
            "rawCompletedJa": "AIは人間が与えたデータを処理する手段にすぎません。",
            "en": "AI is nothing more than a tool for processing data supplied by humans.",
            "segments": [
              { "type": "text", "textJa": "AIは人間が与えたデータを処理する手段" },
              { "type": "blank", "blankIndex": 3 },
              { "type": "text", "textJa": "。" }
            ]
          },
          {
            "sentenceIndex": 4,
            "rawCompletedJa": "最終的な倫理的判断を下すのは、ほかならぬ人間の良心にほかなりません。",
            "en": "Making the ultimate ethical judgment is nothing other than human conscience itself.",
            "segments": [
              { "type": "text", "textJa": "最終的な倫理的判断を下すのは、ほかならぬ人間の良心" },
              { "type": "blank", "blankIndex": 4 },
              { "type": "text", "textJa": "。" }
            ]
          }
        ]
      }
    ],
    "blanks": [
      {
        "blankIndex": 0,
        "displayNumber": 1,
        "category": "conjunction",
        "options": [
          { "id": "opt-1", "ja": "とはいえ" },
          { "id": "opt-2", "ja": "したがって" },
          { "id": "opt-3", "ja": "それゆえ" },
          { "id": "opt-4", "ja": "あるいは" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'とはいえ' concedes the rapid progress of AI while presenting a critical counter-limitation regarding human creativity.",
        "contextClueQuoteJa": "劇的な変化をもたらしています"
      },
      {
        "blankIndex": 1,
        "displayNumber": 2,
        "category": "demonstrative",
        "options": [
          { "id": "opt-1", "ja": "このような" },
          { "id": "opt-2", "ja": "あのような" },
          { "id": "opt-3", "ja": "どのような" },
          { "id": "opt-4", "ja": "どちらの" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'このような' refers to the contemporary AI trends currently being analyzed in the essay.",
        "contextClueQuoteJa": "人工知能技術の急速な進化"
      },
      {
        "blankIndex": 2,
        "displayNumber": 3,
        "category": "particles-topic",
        "options": [
          { "id": "opt-1", "ja": "をめぐって" },
          { "id": "opt-2", "ja": "にそって" },
          { "id": "opt-3", "ja": "をぬきにして" },
          { "id": "opt-4", "ja": "にかけて" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'〜をめぐって' marks the central topic or point of contention surrounding heated debates.",
        "contextClueQuoteJa": "世界中で活発な議論が"
      },
      {
        "blankIndex": 3,
        "displayNumber": 4,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "にすぎません" },
          { "id": "opt-2", "ja": "に相違ありません" },
          { "id": "opt-3", "ja": "に決まっています" },
          { "id": "opt-4", "ja": "に値します" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'〜にすぎない' emphasizes limitation ('merely a tool and nothing higher').",
        "contextClueQuoteJa": "データを処理する手段"
      },
      {
        "blankIndex": 4,
        "displayNumber": 5,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "にほかなりません" },
          { "id": "opt-2", "ja": "にすぎません" },
          { "id": "opt-3", "ja": "にこしたことはありません" },
          { "id": "opt-4", "ja": "にいたりません" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'〜にほかならない' (nothing other than) asserts with strong conviction paired with 'ほかならぬ'.",
        "contextClueQuoteJa": "ほかならぬ人間の良心"
      }
    ]
  },

  # Passage 21: N2 Exam Archetype — Business Progress Email
  {
    "id": "n2-exam-business-email",
    "jlpt": 2,
    "sourceType": "diary-letter",
    "titleJa": "新規システム改修プロジェクトの進捗ご報告",
    "titleEn": "Business Progress Report: System Migration Project",
    "introContextJa": "IT企業のプロジェクトマネージャーがクライアントの部長へ送信した業務進捗メールです。",
    "introContextEn": "A formal status report email sent by an IT project manager to a client director.",
    "paragraphs": [
      {
        "subheadingJa": "進捗のご報告とお伺い",
        "sentences": [
          {
            "sentenceIndex": 0,
            "rawCompletedJa": "平素は格別のご高配を賜り、厚く御礼申し上げます。",
            "en": "We express our heartfelt gratitude for your exceptional patronage at all times.",
            "segments": [
              { "type": "text", "textJa": "平素は格別のご高配を賜り、厚く御礼申し上げます。" }
            ]
          },
          {
            "sentenceIndex": 1,
            "rawCompletedJa": "つきましては、現在進行中の基幹システム刷新プロジェクトについてご報告いたします。",
            "en": "Regarding this matter, we report on the core system overhaul project currently underway.",
            "segments": [
              { "type": "blank", "blankIndex": 0 },
              { "type": "text", "textJa": "、現在進行中の基幹システム刷新プロジェクトについてご報告いたします。" }
            ]
          },
          {
            "sentenceIndex": 2,
            "rawCompletedJa": "先日の進捗会議にて貴重なご意見をご対応いただき、誠に深謝いたします。",
            "en": "We deeply thank you for accommodating us with valuable feedback at the recent progress meeting.",
            "segments": [
              { "type": "text", "textJa": "先日の進捗会議にて貴重なご意見を" },
              { "type": "blank", "blankIndex": 1 },
              { "type": "text", "textJa": "、誠に深謝いたします。" }
            ]
          },
          {
            "sentenceIndex": 3,
            "rawCompletedJa": "その検証結果を踏まえた改訂スケジュールを添付資料にてお送りいたします。",
            "en": "We send the revised schedule based on those verification results in the attached document.",
            "segments": [
              { "type": "blank", "blankIndex": 2 },
              { "type": "text", "textJa": "検証結果を踏まえた改訂スケジュールを添付資料にてお送りいたします。" }
            ]
          },
          {
            "sentenceIndex": 4,
            "rawCompletedJa": "内容をご確認の上、ご検討いただけますと幸甚に存じます。",
            "en": "We would be deeply obliged if you would kindly review the contents and consider them.",
            "segments": [
              { "type": "text", "textJa": "内容をご確認の上、ご検討いただけますと" },
              { "type": "blank", "blankIndex": 3 },
              { "type": "text", "textJa": "。" }
            ]
          }
        ]
      }
    ],
    "blanks": [
      {
        "blankIndex": 0,
        "displayNumber": 1,
        "category": "conjunction",
        "options": [
          { "id": "opt-1", "ja": "つきましては" },
          { "id": "opt-2", "ja": "もっとも" },
          { "id": "opt-3", "ja": "それにしても" },
          { "id": "opt-4", "ja": "とはいえ" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'つきましては' is the business email connector transitioning from opening formalities to the specific topic at hand.",
        "contextClueQuoteJa": "厚く御礼申し上げます"
      },
      {
        "blankIndex": 1,
        "displayNumber": 2,
        "category": "deixis-perspective",
        "options": [
          { "id": "opt-1", "ja": "ご対応いただき" },
          { "id": "opt-2", "ja": "ご対応さしあげ" },
          { "id": "opt-3", "ja": "ご対応いたし" },
          { "id": "opt-4", "ja": "ご対応なさり" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Humble recognition of client's cooperation receives benefactive honorific '〜ていただく' ('ご対応いただき').",
        "contextClueQuoteJa": "貴重なご意見を"
      },
      {
        "blankIndex": 2,
        "displayNumber": 3,
        "category": "demonstrative",
        "options": [
          { "id": "opt-1", "ja": "その" },
          { "id": "opt-2", "ja": "この" },
          { "id": "opt-3", "ja": "あの" },
          { "id": "opt-4", "ja": "どの" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'その検証結果' refers back to the verification discussed in the recent progress meeting.",
        "contextClueQuoteJa": "先日の進捗会議にて"
      },
      {
        "blankIndex": 3,
        "displayNumber": 4,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "幸甚に存じます" },
          { "id": "opt-2", "ja": "幸いと存じません" },
          { "id": "opt-3", "ja": "遺憾に存じます" },
          { "id": "opt-4", "ja": "結構に存じます" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Highest formal Japanese business polite formula expressing respectful request is '〜幸甚に存じます' (I would be most grateful).",
        "contextClueQuoteJa": "ご検討いただけますと"
      }
    ]
  },

  # Passage 22: N2 Exam Archetype — Food Loss Column
  {
    "id": "n2-exam-essay-environmental",
    "jlpt": 2,
    "sourceType": "exam-speech",
    "titleJa": "食品ロス削減に向けた提言",
    "titleEn": "Essay: Proposals for Reducing Food Loss",
    "introContextJa": "環境経済学者が提言する、賞味期限と流通慣行に関するオピニオン記事です。",
    "introContextEn": "An environmental economics opinion piece discussing food waste and distribution practices.",
    "paragraphs": [
      {
        "subheadingJa": "賞味期限と流通の壁",
        "sentences": [
          {
            "sentenceIndex": 0,
            "rawCompletedJa": "世界的な環境意識の高まりに伴い、食品廃棄の削減が喫緊の課題となっています。",
            "en": "With rising global environmental consciousness, reduction of food waste has become an urgent challenge.",
            "segments": [
              { "type": "text", "textJa": "世界的な環境意識の高まりに伴い、食品廃棄の削減が喫緊の課題となっています。" }
            ]
          },
          {
            "sentenceIndex": 1,
            "rawCompletedJa": "もっとも、食品衛生の安全確保と廃棄削減を両立させるのは容易ではありません。",
            "en": "Granted, achieving both food sanitation safety and waste reduction simultaneously is not easy.",
            "segments": [
              { "type": "blank", "blankIndex": 0 },
              { "type": "text", "textJa": "、食品衛生の安全確保と廃棄削減を両立させるのは容易ではありません。" }
            ]
          },
          {
            "sentenceIndex": 2,
            "rawCompletedJa": "そうした商慣習の是正に向けて、賞味期限の年月表示化が進められています。",
            "en": "Toward correcting that sort of commercial practice, year-month best-by date labelling is being advanced.",
            "segments": [
              { "type": "blank", "blankIndex": 1 },
              { "type": "text", "textJa": "商慣習の是正に向けて、賞味期限の年月表示化が進められています。" }
            ]
          },
          {
            "sentenceIndex": 3,
            "rawCompletedJa": "流通の現状を踏まえて、消費者も過度な鮮度志向を見直さざるを得ません。",
            "en": "Taking into account the current distribution reality, consumers too are compelled to reconsider excessive freshness preferences.",
            "segments": [
              { "type": "text", "textJa": "流通の現状" },
              { "type": "blank", "blankIndex": 2 },
              { "type": "text", "textJa": "、消費者も過度な鮮度志向を" },
              { "type": "blank", "blankIndex": 3 },
              { "type": "text", "textJa": "。" }
            ]
          }
        ]
      }
    ],
    "blanks": [
      {
        "blankIndex": 0,
        "displayNumber": 1,
        "category": "conjunction",
        "options": [
          { "id": "opt-1", "ja": "もっとも" },
          { "id": "opt-2", "ja": "したがって" },
          { "id": "opt-3", "ja": "それゆえ" },
          { "id": "opt-4", "ja": "そこで" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'もっとも' (to be sure / mind you) introduces a pragmatic caveat acknowledging that safety standards complicate simple waste reduction.",
        "contextClueQuoteJa": "喫緊の課題となっています"
      },
      {
        "blankIndex": 1,
        "displayNumber": 2,
        "category": "demonstrative",
        "options": [
          { "id": "opt-1", "ja": "そうした" },
          { "id": "opt-2", "ja": "こうした" },
          { "id": "opt-3", "ja": "ああした" },
          { "id": "opt-4", "ja": "どうした" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'そうした' refers anaphorically to the rigid commercial practices causing excessive disposal.",
        "contextClueQuoteJa": "両立させるのは容易ではありません"
      },
      {
        "blankIndex": 2,
        "displayNumber": 3,
        "category": "particles-topic",
        "options": [
          { "id": "opt-1", "ja": "を踏まえて" },
          { "id": "opt-2", "ja": "をよそにして" },
          { "id": "opt-3", "ja": "を限りに" },
          { "id": "opt-4", "ja": "を抜きにして" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'〜を踏まえて' indicates taking real-world distribution data into full consideration.",
        "contextClueQuoteJa": "流通の現状"
      },
      {
        "blankIndex": 3,
        "displayNumber": 4,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "見直さざるを得ません" },
          { "id": "opt-2", "ja": "見直すわけにはいきません" },
          { "id": "opt-3", "ja": "見直すはずがありません" },
          { "id": "opt-4", "ja": "見直すに違いありません" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'〜ざるを得ない' expresses psychological or ethical compulsion ('cannot help but review / must inevitably rethink').",
        "contextClueQuoteJa": "過度な鮮度志向を"
      }
    ]
  },

  # Passage 23: N2 Exam Archetype — Resignation Greeting
  {
    "id": "n2-exam-letter-resignation",
    "jlpt": 2,
    "sourceType": "diary-letter",
    "titleJa": "退職に伴う感謝のご挨拶",
    "titleEn": "Farewell Greeting on Retirement/Resignation",
    "introContextJa": "長年勤めた企業を退職する社員が、部署の同僚・取引先に送った挨拶状です。",
    "introContextEn": "A formal departure letter sent by an employee resigning after 10 years to colleagues.",
    "paragraphs": [
      {
        "subheadingJa": "退職のご挨拶",
        "sentences": [
          {
            "sentenceIndex": 0,
            "rawCompletedJa": "拝啓　新緑の候、皆様におかれましてはますますご清栄のこととお慶び申し上げます。",
            "en": "Dear Sirs, in this season of fresh greenery, I rejoice in everyone's ever-increasing health and prosperity.",
            "segments": [
              { "type": "text", "textJa": "拝啓　新緑の候、皆様におかれましてはますますご清栄のこととお慶び申し上げます。" }
            ]
          },
          {
            "sentenceIndex": 1,
            "rawCompletedJa": "さて、私儀、今月末をもちまして十年間にわたり勤務した弊社を退職することとなりました。",
            "en": "Now then, on personal matters, as of the end of this month, it has been decided that I will resign from our company where I have worked for 10 years.",
            "segments": [
              { "type": "blank", "blankIndex": 0 },
              { "type": "text", "textJa": "、私儀、今月末をもちまして十年間にわたり勤務した弊社を退職することとなりました。" }
            ]
          },
          {
            "sentenceIndex": 2,
            "rawCompletedJa": "在職中は公私にわたり温かいご指導をくださり、心より御礼申し上げます。",
            "en": "During my tenure, thank you from the bottom of my heart for kindly providing me with warm guidance in both public and private matters.",
            "segments": [
              { "type": "text", "textJa": "在職中は公私にわたり温かい" },
              { "type": "blank", "blankIndex": 1 },
              { "type": "text", "textJa": "、心より御礼申し上げます。" }
            ]
          },
          {
            "sentenceIndex": 3,
            "rawCompletedJa": "この十年間の貴重な経験は、私にとってかけがえのない財産でございます。",
            "en": "The invaluable experience of these past ten years is an irreplaceable asset for me.",
            "segments": [
              { "type": "blank", "blankIndex": 2 },
              { "type": "text", "textJa": "十年間の貴重な経験は、私にとってかけがえのない財産でございます。" }
            ]
          },
          {
            "sentenceIndex": 4,
            "rawCompletedJa": "新たな分野への挑戦にあたり、皆様からいただいた教えを胸に精進してまいる所存です。",
            "en": "On the occasion of taking on a challenge in a new field, I intend to devote myself holding your teachings in my heart.",
            "segments": [
              { "type": "text", "textJa": "新たな分野への挑戦" },
              { "type": "blank", "blankIndex": 3 },
              { "type": "text", "textJa": "、皆様からいただいた教えを胸に精進してまいる所存です。" }
            ]
          },
          {
            "sentenceIndex": 5,
            "rawCompletedJa": "末筆ではございますが、皆様のご健康と貴社のますますのご発展をお祈り申し上げます。",
            "en": "In closing, I pray for everyone's good health and the further prosperity of your company.",
            "segments": [
              { "type": "text", "textJa": "末筆ではございますが、皆様のご健康と貴社のますますのご発展を" },
              { "type": "blank", "blankIndex": 4 },
              { "type": "text", "textJa": "。" }
            ]
          }
        ]
      }
    ],
    "blanks": [
      {
        "blankIndex": 0,
        "displayNumber": 1,
        "category": "conjunction",
        "options": [
          { "id": "opt-1", "ja": "さて" },
          { "id": "opt-2", "ja": "しかし" },
          { "id": "opt-3", "ja": "だから" },
          { "id": "opt-4", "ja": "つまり" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'さて' transitions from formal opening seasonal wishes to the principal statement of resignation.",
        "contextClueQuoteJa": "私儀、今月末をもちまして"
      },
      {
        "blankIndex": 1,
        "displayNumber": 2,
        "category": "deixis-perspective",
        "options": [
          { "id": "opt-1", "ja": "ご指導をくださり" },
          { "id": "opt-2", "ja": "ご指導をさしあげ" },
          { "id": "opt-3", "ja": "ご指導をいたし" },
          { "id": "opt-4", "ja": "ご指導を申しあげ" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Respectful recognition of mentorship received from company superiors uses '〜くださる' ('ご指導をくださり').",
        "contextClueQuoteJa": "温かいご指導を"
      },
      {
        "blankIndex": 2,
        "displayNumber": 3,
        "category": "demonstrative",
        "options": [
          { "id": "opt-1", "ja": "この" },
          { "id": "opt-2", "ja": "その" },
          { "id": "opt-3", "ja": "あの" },
          { "id": "opt-4", "ja": "どの" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Proximal 'この' embraces the narrator's entire decade of accumulated service ending right now.",
        "contextClueQuoteJa": "十年間の貴重な経験"
      },
      {
        "blankIndex": 3,
        "displayNumber": 4,
        "category": "particles-topic",
        "options": [
          { "id": "opt-1", "ja": "にあたり" },
          { "id": "opt-2", "ja": "をぬきにして" },
          { "id": "opt-3", "ja": "に反して" },
          { "id": "opt-4", "ja": "に先立たず" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'〜にあたり' marks the momentous turning point or occasion of embarking on a new professional career.",
        "contextClueQuoteJa": "新たな分野への挑戦"
      },
      {
        "blankIndex": 4,
        "displayNumber": 5,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "お祈り申し上げます" },
          { "id": "opt-2", "ja": "祈るべきです" },
          { "id": "opt-3", "ja": "祈らざるを得ません" },
          { "id": "opt-4", "ja": "祈るつもりです" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Solemn closing benediction in formal epistolary style follows '〜お祈り申し上げます'.",
        "contextClueQuoteJa": "貴社のますますのご発展を"
      }
    ]
  },

  # Passage 24: N2 Exam Archetype — Wooden Architecture Essay
  {
    "id": "n2-exam-cultural-architecture",
    "jlpt": 2,
    "sourceType": "exam-speech",
    "titleJa": "日本の木造建築に見る自然との調和",
    "titleEn": "Essay: Harmony with Nature in Japanese Wooden Architecture",
    "introContextJa": "建築批評誌に掲載された、日本古来の寺社建築と構造美についての評論です。",
    "introContextEn": "An architecture essay analyzing ancient Japanese shrine carpentry and structural aesthetics.",
    "paragraphs": [
      {
        "subheadingJa": "木組みの知恵",
        "sentences": [
          {
            "sentenceIndex": 0,
            "rawCompletedJa": "日本の伝統的な木造建築は、千年以上もの風雪に耐え抜いて今に伝わっています。",
            "en": "Japan's traditional wooden architecture has endured over a thousand years of wind and snow, transmitted to the present day.",
            "segments": [
              { "type": "text", "textJa": "日本の伝統的な木造建築は、千年以上もの風雪に耐え抜いて今に伝わっています。" }
            ]
          },
          {
            "sentenceIndex": 1,
            "rawCompletedJa": "すなわち、釘を一本も使わずに木材同士を複雑に組み合わせる「木組み」の技法です。",
            "en": "Namely, the 'kigumi' joinery technique of intricately interlocking timber without using a single nail.",
            "segments": [
              { "type": "blank", "blankIndex": 0 },
              { "type": "text", "textJa": "、釘を一本も使わずに木材同士を複雑に組み合わせる「木組み」の技法です。" }
            ]
          },
          {
            "sentenceIndex": 2,
            "rawCompletedJa": "その精緻な工法は、高い耐震性のみならず、木材特有の呼吸を促す効果も備えています。",
            "en": "That elaborate construction method possesses not only high earthquake resistance, but also the effect of encouraging wood's natural breathing.",
            "segments": [
              { "type": "blank", "blankIndex": 1 },
              { "type": "text", "textJa": "精緻な工法は、高い耐震性" },
              { "type": "blank", "blankIndex": 2 },
              { "type": "text", "textJa": "、木材特有の呼吸を促す効果も備えています。" }
            ]
          },
          {
            "sentenceIndex": 3,
            "rawCompletedJa": "自然の猛威と共生しようとした先人たちの、類まれなる知恵の結晶に違いありません。",
            "en": "It must undoubtedly be the crystallization of incomparable wisdom from our ancestors who sought to coexist with nature's fury.",
            "segments": [
              { "type": "text", "textJa": "自然の猛威と共生しようとした先人たちの、類まれなる知恵の結晶" },
              { "type": "blank", "blankIndex": 3 },
              { "type": "text", "textJa": "。" }
            ]
          }
        ]
      }
    ],
    "blanks": [
      {
        "blankIndex": 0,
        "displayNumber": 1,
        "category": "conjunction",
        "options": [
          { "id": "opt-1", "ja": "すなわち" },
          { "id": "opt-2", "ja": "しかし" },
          { "id": "opt-3", "ja": "なぜなら" },
          { "id": "opt-4", "ja": "あるいは" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'すなわち' (that is to say / namely) introduces the core structural secret underpinning how the architecture survived a millennium.",
        "contextClueQuoteJa": "千年以上もの風雪に耐え抜いて"
      },
      {
        "blankIndex": 1,
        "displayNumber": 2,
        "category": "demonstrative",
        "options": [
          { "id": "opt-1", "ja": "その" },
          { "id": "opt-2", "ja": "この" },
          { "id": "opt-3", "ja": "あの" },
          { "id": "opt-4", "ja": "どの" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'その' refers anaphorically to the '木組み' joinery method just defined.",
        "contextClueQuoteJa": "「木組み」の技法です"
      },
      {
        "blankIndex": 2,
        "displayNumber": 3,
        "category": "particles-topic",
        "options": [
          { "id": "opt-1", "ja": "のみならず" },
          { "id": "opt-2", "ja": "をぬきにして" },
          { "id": "opt-3", "ja": "に反して" },
          { "id": "opt-4", "ja": "をかぎりに" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'〜のみならず' links earthquake safety with wood breathability ('not only A, but also B').",
        "contextClueQuoteJa": "高い耐震性"
      },
      {
        "blankIndex": 3,
        "displayNumber": 4,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "に違いありません" },
          { "id": "opt-2", "ja": "にすぎません" },
          { "id": "opt-3", "ja": "わけにはいきません" },
          { "id": "opt-4", "ja": "はずがありません" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Expresses strong authorial certainty and aesthetic reverence using '〜に違いない' ('に違いありません').",
        "contextClueQuoteJa": "類まれなる知恵の結晶"
      }
    ]
  },

  # Passage 25: N2 Exam Archetype — Sleep & Memory Science
  {
    "id": "n2-exam-science-sleep",
    "jlpt": 2,
    "sourceType": "exam-speech",
    "titleJa": "睡眠の質と記憶定着のメカニズム",
    "titleEn": "Science Column: Sleep Quality and Memory Consolidation",
    "introContextJa": "神経科学の最新知見を紹介する、学術教養コラムです。",
    "introContextEn": "A neuroscience column explaining non-REM sleep rhythms and memory consolidation.",
    "paragraphs": [
      {
        "subheadingJa": "脳の休息と記憶の定着",
        "sentences": [
          {
            "sentenceIndex": 0,
            "rawCompletedJa": "現代社会において、睡眠不足は個人の健康のみならず経済活動にも悪影響を与えています。",
            "en": "In contemporary society, lack of sleep negatively impacts not only personal health, but also economic activity.",
            "segments": [
              { "type": "text", "textJa": "現代社会において、睡眠不足は個人の健康のみならず経済活動にも悪影響を与えています。" }
            ]
          },
          {
            "sentenceIndex": 1,
            "rawCompletedJa": "したがって、質の高い睡眠を確保することが予防医学の観点からも極めて重要です。",
            "en": "Therefore, securing high quality sleep is extraordinarily vital from the perspective of preventive medicine as well.",
            "segments": [
              { "type": "blank", "blankIndex": 0 },
              { "type": "text", "textJa": "、質の高い睡眠を確保することが予防医学の観点からも極めて重要です。" }
            ]
          },
          {
            "sentenceIndex": 2,
            "rawCompletedJa": "こうした脳波のリズムを通じて、日中に得た記憶が脳内に整理・定着されていきます。",
            "en": "Through these kinds of brainwave rhythms, memories acquired during the daytime become organized and consolidated in the brain.",
            "segments": [
              { "type": "blank", "blankIndex": 1 },
              { "type": "text", "textJa": "脳波のリズム" },
              { "type": "blank", "blankIndex": 2 },
              { "type": "text", "textJa": "、日中に得た記憶が脳内に整理・定着されていきます。" }
            ]
          },
          {
            "sentenceIndex": 3,
            "rawCompletedJa": "睡眠時間を削って勉強や作業を続けることは、学習効率の観点からも推奨するわけにはいきません。",
            "en": "Continuing to study or work while cutting down sleep hours cannot possibly be recommended from the viewpoint of learning efficiency.",
            "segments": [
              { "type": "text", "textJa": "睡眠時間を削って勉強や作業を続けることは、学習効率の観点からも推奨する" },
              { "type": "blank", "blankIndex": 3 },
              { "type": "text", "textJa": "。" }
            ]
          },
          {
            "sentenceIndex": 4,
            "rawCompletedJa": "十分な休息をとることこそが、創造的な思考を生み出す基盤といえます。",
            "en": "Taking sufficient rest is precisely what can be asserted as the foundation for producing creative thinking.",
            "segments": [
              { "type": "text", "textJa": "十分な休息をとることこそが、創造的な思考を生み出す基盤" },
              { "type": "blank", "blankIndex": 4 },
              { "type": "text", "textJa": "。" }
            ]
          }
        ]
      }
    ],
    "blanks": [
      {
        "blankIndex": 0,
        "displayNumber": 1,
        "category": "conjunction",
        "options": [
          { "id": "opt-1", "ja": "したがって" },
          { "id": "opt-2", "ja": "しかし" },
          { "id": "opt-3", "ja": "それどころか" },
          { "id": "opt-4", "ja": "なぜなら" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'したがって' links the broad negative societal fallout of sleep deficit to the medical necessity of sleep hygiene.",
        "contextClueQuoteJa": "経済活動にも悪影響を与えています"
      },
      {
        "blankIndex": 1,
        "displayNumber": 2,
        "category": "demonstrative",
        "options": [
          { "id": "opt-1", "ja": "こうした" },
          { "id": "opt-2", "ja": "そうした" },
          { "id": "opt-3", "ja": "ああした" },
          { "id": "opt-4", "ja": "どうした" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'こうした' refers proximally to the non-REM rhythmic cycles detailed in neurological research.",
        "contextClueQuoteJa": "脳波のリズム"
      },
      {
        "blankIndex": 2,
        "displayNumber": 3,
        "category": "particles-topic",
        "options": [
          { "id": "opt-1", "ja": "を通じて" },
          { "id": "opt-2", "ja": "をはじめ" },
          { "id": "opt-3", "ja": "にそって" },
          { "id": "opt-4", "ja": "に反して" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'〜を通じて' marks the biological channel/process through which synaptic consolidation operates.",
        "contextClueQuoteJa": "脳内に整理・定着されていきます"
      },
      {
        "blankIndex": 3,
        "displayNumber": 4,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "わけにはいきません" },
          { "id": "opt-2", "ja": "はずがありません" },
          { "id": "opt-3", "ja": "に違いありません" },
          { "id": "opt-4", "ja": "つもりはありません" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'〜わけにはいかない' expresses strong professional inhibition ('cannot in good conscience recommend').",
        "contextClueQuoteJa": "推奨する"
      },
      {
        "blankIndex": 4,
        "displayNumber": 5,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "といえます" },
          { "id": "opt-2", "ja": "とはいえません" },
          { "id": "opt-3", "ja": "とおもわれます" },
          { "id": "opt-4", "ja": "とするべきです" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Concluding assertion in a scholarly column uses objective assertive judgment '〜といえる'.",
        "contextClueQuoteJa": "生み出す基盤"
      }
    ]
  }
]
