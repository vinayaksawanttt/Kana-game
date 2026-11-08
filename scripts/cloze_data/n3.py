# N3 Passages (7 passages, 32 blanks)

n3_passages = [
  # Passage 13: N3 Exam Archetype — Telework Essay
  {
    "id": "n3-exam-work-telework",
    "jlpt": 3,
    "sourceType": "exam-speech",
    "titleJa": "テレワークの普及とこれからの働き方",
    "titleEn": "Essay: Spread of Telework & Future Workstyles",
    "introContextJa": "ビジネス雑誌に掲載された、在宅勤務の利点と課題についての論説文です。",
    "introContextEn": "An opinion essay published in a business journal discussing advantages and issues of telework.",
    "paragraphs": [
      {
        "subheadingJa": "在宅勤務の功罪",
        "sentences": [
          {
            "sentenceIndex": 0,
            "rawCompletedJa": "近年、ITツールの発展に伴い、在宅勤務を導入する企業が急速に増えています。",
            "en": "In recent years, with the development of IT tools, companies adopting telework have increased rapidly.",
            "segments": [
              { "type": "text", "textJa": "近年、ITツールの発展に伴い、在宅勤務を導入する企業が急速に増えています。" }
            ]
          },
          {
            "sentenceIndex": 1,
            "rawCompletedJa": "通勤の負担が軽減される一方で、社員間のコミュニケーション不足が懸念されています。",
            "en": "While the burden of commuting is reduced, on the other hand, lack of communication among employees is a concern.",
            "segments": [
              { "type": "text", "textJa": "通勤の負担が軽減される" },
              { "type": "blank", "blankIndex": 0 },
              { "type": "text", "textJa": "、社員間のコミュニケーション不足が懸念されています。" }
            ]
          },
          {
            "sentenceIndex": 2,
            "rawCompletedJa": "その問題を解決するために、定期的なオンライン面談を設ける企業もあります。",
            "en": "In order to resolve that issue, some companies establish regular online one-on-one meetings.",
            "segments": [
              { "type": "blank", "blankIndex": 1 },
              { "type": "text", "textJa": "問題を解決するために、定期的なオンライン面談を設ける企業もあります。" }
            ]
          },
          {
            "sentenceIndex": 3,
            "rawCompletedJa": "デジタル技術の活用によって、多様な働き方が実現できるようになったのは確かです。",
            "en": "It is certain that through the utilization of digital technology, diverse ways of working have become possible.",
            "segments": [
              { "type": "text", "textJa": "デジタル技術の活用" },
              { "type": "blank", "blankIndex": 2 },
              { "type": "text", "textJa": "、多様な働き方が実現できるようになったのは確かです。" }
            ]
          },
          {
            "sentenceIndex": 4,
            "rawCompletedJa": "しかし、すべての職種で完全に移行できるわけではありません。",
            "en": "However, it does not mean that every job category can completely transition.",
            "segments": [
              { "type": "text", "textJa": "しかし、すべての職種で完全に移行できる" },
              { "type": "blank", "blankIndex": 3 },
              { "type": "text", "textJa": "。" }
            ]
          },
          {
            "sentenceIndex": 5,
            "rawCompletedJa": "各企業の実情に応じた柔軟な制度設計を進めるべきです。",
            "en": "Companies should advance flexible policy designs in accordance with their actual situations.",
            "segments": [
              { "type": "text", "textJa": "各企業の実情に応じた柔軟な制度設計を進める" },
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
          { "id": "opt-1", "ja": "一方で" },
          { "id": "opt-2", "ja": "ところで" },
          { "id": "opt-3", "ja": "それゆえ" },
          { "id": "opt-4", "ja": "あるいは" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'一方で' introduces the contrasting downside (communication deficit) juxtaposed with the positive advantage (reduced commute).",
        "contextClueQuoteJa": "通勤の負担が軽減される"
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
        "discourseRuleEn": "'その問題' points back anaphorically to the communication deficit dilemma just introduced.",
        "contextClueQuoteJa": "社員間のコミュニケーション不足"
      },
      {
        "blankIndex": 2,
        "displayNumber": 3,
        "category": "particles-topic",
        "options": [
          { "id": "opt-1", "ja": "によって" },
          { "id": "opt-2", "ja": "にとって" },
          { "id": "opt-3", "ja": "に反して" },
          { "id": "opt-4", "ja": "にかけて" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'〜によって' indicates the means/method through which diverse working styles have been accomplished.",
        "contextClueQuoteJa": "デジタル技術の活用"
      },
      {
        "blankIndex": 3,
        "displayNumber": 4,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "わけではありません" },
          { "id": "opt-2", "ja": "わけがありません" },
          { "id": "opt-3", "ja": "はずがありません" },
          { "id": "opt-4", "ja": "にすぎません" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Expresses partial negation ('does not necessarily mean that all jobs can transition') using '〜わけではない'.",
        "contextClueQuoteJa": "すべての職種で完全に"
      },
      {
        "blankIndex": 4,
        "displayNumber": 5,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "べきです" },
          { "id": "opt-2", "ja": "つもりです" },
          { "id": "opt-3", "ja": "そうです" },
          { "id": "opt-4", "ja": "ようです" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Concludes a formal editorial with a strong normative recommendation for corporate leaders using '〜べきだ' (ought to / should).",
        "contextClueQuoteJa": "柔軟な制度設計を進める"
      }
    ]
  },

  # Passage 14: N3 Exam Archetype — Homestay Letter
  {
    "id": "n3-exam-letter-homestay",
    "jlpt": 3,
    "sourceType": "diary-letter",
    "titleJa": "帰国後のホストファミリーへのお礼状",
    "titleEn": "Thank-You Letter to Host Family After Returning Home",
    "introContextJa": "日本での留学を終えて帰国した学生が、お世話になった家族へ送った手紙です。",
    "introContextEn": "A formal thank-you letter sent to a host family by an international student after returning home.",
    "paragraphs": [
      {
        "subheadingJa": "感謝の手紙",
        "sentences": [
          {
            "sentenceIndex": 0,
            "rawCompletedJa": "拝啓　風の涼しい季節となりましたが、皆様いかがお過ごしでしょうか。",
            "en": "Dear hosts, as the season brings cool breezes, how is everyone doing?",
            "segments": [
              { "type": "text", "textJa": "拝啓　風の涼しい季節となりましたが、皆様いかがお過ごしでしょうか。" }
            ]
          },
          {
            "sentenceIndex": 1,
            "rawCompletedJa": "さて、先月は日本滞在中に大変温かく迎えてくださり、本当にありがとうございました。",
            "en": "Well then, thank you so very much for welcoming me so warmly during my stay in Japan last month.",
            "segments": [
              { "type": "blank", "blankIndex": 0 },
              { "type": "text", "textJa": "、先月は日本滞在中に大変温かく" },
              { "type": "blank", "blankIndex": 1 },
              { "type": "text", "textJa": "、本当にありがとうございました。" }
            ]
          },
          {
            "sentenceIndex": 2,
            "rawCompletedJa": "あの京都旅行で一緒に食べた湯豆腐の味は、今でも忘れられません。",
            "en": "The taste of the boiled tofu we ate together on that Kyoto trip is still unforgettable even now.",
            "segments": [
              { "type": "blank", "blankIndex": 2 },
              { "type": "text", "textJa": "京都旅行で一緒に食べた湯豆腐の味は、今でも忘れられません。" }
            ]
          },
          {
            "sentenceIndex": 3,
            "rawCompletedJa": "家族のように接していただいた日々に、心より感謝しております。",
            "en": "I am deeply grateful from the bottom of my heart for the days you treated me like family.",
            "segments": [
              { "type": "text", "textJa": "家族のように接していただいた日々に、心より" },
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
          { "id": "opt-1", "ja": "さて" },
          { "id": "opt-2", "ja": "しかし" },
          { "id": "opt-3", "ja": "だから" },
          { "id": "opt-4", "ja": "つまり" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'さて' is the canonical Japanese letter-writing conjunction transitioning from opening seasonal greetings to the core purpose of the letter.",
        "contextClueQuoteJa": "皆様いかがお過ごしでしょうか"
      },
      {
        "blankIndex": 1,
        "displayNumber": 2,
        "category": "deixis-perspective",
        "options": [
          { "id": "opt-1", "ja": "迎えてくださり" },
          { "id": "opt-2", "ja": "迎えてあげて" },
          { "id": "opt-3", "ja": "迎えていただき" },
          { "id": "opt-4", "ja": "迎えてしまって" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Respectful honorific benefactive bestowed by host parents upon the author uses '〜てくださる' ('迎えてくださり').",
        "contextClueQuoteJa": "大変温かく"
      },
      {
        "blankIndex": 2,
        "displayNumber": 3,
        "category": "demonstrative",
        "options": [
          { "id": "opt-1", "ja": "あの" },
          { "id": "opt-2", "ja": "その" },
          { "id": "opt-3", "ja": "この" },
          { "id": "opt-4", "ja": "どの" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Referencing a shared nostalgic past experience well known to both the sender and the recipients requires distal shared 'あの'.",
        "contextClueQuoteJa": "一緒に食べた湯豆腐の味"
      },
      {
        "blankIndex": 3,
        "displayNumber": 4,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "感謝しております" },
          { "id": "opt-2", "ja": "感謝するはずです" },
          { "id": "opt-3", "ja": "感謝するつもりです" },
          { "id": "opt-4", "ja": "感謝してしまいました" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Humble polite self-expression of continuing heartfelt gratitude takes '心より感謝しております'.",
        "contextClueQuoteJa": "心より"
      }
    ]
  },

  # Passage 15: N3 Story Scene — Hospital Visit
  {
    "id": "story-n3-hospital",
    "jlpt": 3,
    "sourceType": "story-scene",
    "titleJa": "総合病院での診察とアドバイス（シーン）",
    "titleEn": "Hospital Visit & Medical Advice Scene",
    "introContextJa": "「病院での診察」の物語から、医師の診察と服薬指導を受ける場面です。",
    "introContextEn": "Consulting a physician and receiving medication advice from 'Hospital Visit'.",
    "linkedStory": {
      "level": "N3",
      "slug": "story-n3-hospital",
      "titleJa": "病院での診察",
      "titleEn": "Hospital Visit"
    },
    "paragraphs": [
      {
        "subheadingJa": "診察室にて",
        "sentences": [
          {
            "sentenceIndex": 0,
            "rawCompletedJa": "朝から高熱が続いていたため、駅前の総合病院を受診しました。",
            "en": "Because high fever had continued since morning, I saw a doctor at the general hospital in front of the station.",
            "segments": [
              { "type": "text", "textJa": "朝から高熱が続いていたため、駅前の総合病院を受診しました。" }
            ]
          },
          {
            "sentenceIndex": 1,
            "rawCompletedJa": "したがって、まずは血液検査とインフルエンザの検査を受けることになりました。",
            "en": "Accordingly, it was decided that I would first undergo blood tests and an influenza test.",
            "segments": [
              { "type": "blank", "blankIndex": 0 },
              { "type": "text", "textJa": "、まずは血液検査とインフルエンザの検査を受けることになりました。" }
            ]
          },
          {
            "sentenceIndex": 2,
            "rawCompletedJa": "その薬は毎食後に必ず一包ずつ水で飲んでください。",
            "en": "Please take that medicine with water, exactly one packet after every meal.",
            "segments": [
              { "type": "blank", "blankIndex": 1 },
              { "type": "text", "textJa": "薬は毎食後に必ず一包ずつ水で飲んでください。" }
            ]
          },
          {
            "sentenceIndex": 3,
            "rawCompletedJa": "激しい頭痛に対しては、こちらの痛み止めを頓服として処方します。",
            "en": "For severe headaches, I prescribe this painkiller as needed.",
            "segments": [
              { "type": "text", "textJa": "激しい頭痛" },
              { "type": "blank", "blankIndex": 2 },
              { "type": "text", "textJa": "は、こちらの痛み止めを頓服として処方します。" }
            ]
          },
          {
            "sentenceIndex": 4,
            "rawCompletedJa": "今夜は安静にして、無理をしないようにしてください。",
            "en": "Please rest quietly tonight and ensure not to overexert yourself.",
            "segments": [
              { "type": "text", "textJa": "今夜は安静にして、無理をしない" },
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
          { "id": "opt-1", "ja": "したがって" },
          { "id": "opt-2", "ja": "しかし" },
          { "id": "opt-3", "ja": "あるいは" },
          { "id": "opt-4", "ja": "ところで" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'したがって' links the clinical symptom (persistent fever) to the resulting diagnostic decision (blood test).",
        "contextClueQuoteJa": "高熱が続いていたため"
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
        "discourseRuleEn": "Refers anaphorically to the prescribed antipyretic packet handed over by the physician.",
        "contextClueQuoteJa": "毎食後に必ず一包ずつ"
      },
      {
        "blankIndex": 2,
        "displayNumber": 3,
        "category": "particles-topic",
        "options": [
          { "id": "opt-1", "ja": "に対して" },
          { "id": "opt-2", "ja": "について" },
          { "id": "opt-3", "ja": "によって" },
          { "id": "opt-4", "ja": "に応じて" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'〜に対して' marks the target symptom addressed by the prescription countermeasure.",
        "contextClueQuoteJa": "激しい頭痛"
      },
      {
        "blankIndex": 3,
        "displayNumber": 4,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "ようにしてください" },
          { "id": "opt-2", "ja": "はずがありません" },
          { "id": "opt-3", "ja": "つもりです" },
          { "id": "opt-4", "ja": "ことになりました" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Physician's caring medical guidance instructs lifestyle behavior using '〜ようにしてください' (please make sure to...).",
        "contextClueQuoteJa": "無理をしない"
      }
    ]
  },

  # Passage 16: N3 Story Scene — Ryokan Hospitality
  {
    "id": "story-n3-hotel-check-in",
    "jlpt": 3,
    "sourceType": "story-scene",
    "titleJa": "温泉旅館のおもてなし（シーン）",
    "titleEn": "Ryokan Hospitality & Check-in Scene",
    "introContextJa": "「旅館のチェックイン」の物語から、仲居さんの館内案内を受ける場面です。",
    "introContextEn": "Room guide and amenity explanation from 'Ryokan Check-in'.",
    "linkedStory": {
      "level": "N3",
      "slug": "story-n3-hotel-check-in",
      "titleJa": "旅館のチェックイン",
      "titleEn": "Ryokan Hospitality"
    },
    "paragraphs": [
      {
        "subheadingJa": "お部屋へのご案内",
        "sentences": [
          {
            "sentenceIndex": 0,
            "rawCompletedJa": "夕方に温泉街の老舗旅館に到着し、落ち着いた和室に案内されました。",
            "en": "In the evening, I arrived at a long-established inn in the hot spring town and was shown to a calm Japanese-style room.",
            "segments": [
              { "type": "text", "textJa": "夕方に温泉街の老舗旅館に到着し、落ち着いた和室に案内されました。" }
            ]
          },
          {
            "sentenceIndex": 1,
            "rawCompletedJa": "また、大浴場は深夜零時までご自由にご利用いただけます。",
            "en": "In addition, the large communal bath is available for your free use until midnight.",
            "segments": [
              { "type": "blank", "blankIndex": 0 },
              { "type": "text", "textJa": "、大浴場は深夜零時までご自由にご利用いただけます。" }
            ]
          },
          {
            "sentenceIndex": 2,
            "rawCompletedJa": "こちらの鍵とお茶菓子をお部屋にご用意いたしました。",
            "en": "We have prepared this room key and tea sweets in your room.",
            "segments": [
              { "type": "blank", "blankIndex": 1 },
              { "type": "text", "textJa": "鍵とお茶菓子をお部屋にご用意いたしました。" }
            ]
          },
          {
            "sentenceIndex": 3,
            "rawCompletedJa": "清掃作業につき、明朝九時から十時までは大浴場へのご入浴はご遠慮ください。",
            "en": "Due to cleaning work, please refrain from bathing in the large bath from 9 to 10 AM tomorrow morning.",
            "segments": [
              { "type": "text", "textJa": "清掃作業" },
              { "type": "blank", "blankIndex": 2 },
              { "type": "text", "textJa": "、明朝九時から十時までは大浴場へのご入浴はご遠慮ください。" }
            ]
          },
          {
            "sentenceIndex": 4,
            "rawCompletedJa": "ご夕食は午後七時から広間にてご用意することになっております。",
            "en": "Dinner is scheduled to be served in the banquet hall starting from 7 PM.",
            "segments": [
              { "type": "text", "textJa": "ご夕食は午後七時から広間にてご用意する" },
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
          { "id": "opt-1", "ja": "また" },
          { "id": "opt-2", "ja": "しかし" },
          { "id": "opt-3", "ja": "なぜなら" },
          { "id": "opt-4", "ja": "したがって" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'また' smoothly enumerates additional facility information (hot spring hours) to the guest.",
        "contextClueQuoteJa": "落ち着いた和室に案内されました"
      },
      {
        "blankIndex": 1,
        "displayNumber": 2,
        "category": "demonstrative",
        "options": [
          { "id": "opt-1", "ja": "こちらの" },
          { "id": "opt-2", "ja": "そちらの" },
          { "id": "opt-3", "ja": "あちらの" },
          { "id": "opt-4", "ja": "どちらの" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Attendant presents room keys and tea sweets right in front of the guest, requiring polite proximal 'こちらの'.",
        "contextClueQuoteJa": "ご用意いたしました"
      },
      {
        "blankIndex": 2,
        "displayNumber": 3,
        "category": "particles-topic",
        "options": [
          { "id": "opt-1", "ja": "につき" },
          { "id": "opt-2", "ja": "にとって" },
          { "id": "opt-3", "ja": "につれて" },
          { "id": "opt-4", "ja": "に反して" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'〜につき' formal administrative particle stating the official reason/basis for temporary service interruption.",
        "contextClueQuoteJa": "清掃作業"
      },
      {
        "blankIndex": 3,
        "displayNumber": 4,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "ことになっております" },
          { "id": "opt-2", "ja": "ことにしました" },
          { "id": "opt-3", "ja": "はずがありません" },
          { "id": "opt-4", "ja": "つもりでございます" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Expressing scheduled institutional arrangements established by the inn requires '〜ことになっている' ('ことになっております').",
        "contextClueQuoteJa": "広間にてご用意する"
      }
    ]
  },

  # Passage 17: N3 Story Scene — Train Delay
  {
    "id": "story-n3-train-delay",
    "jlpt": 3,
    "sourceType": "story-scene",
    "titleJa": "台風による電車の運転見合わせ（シーン）",
    "titleEn": "Train Suspension Scene During Severe Weather",
    "introContextJa": "「電車の遅延と対応」の物語から、駅構内での緊急アナウンスと振替輸送の場面です。",
    "introContextEn": "Emergency platform announcements and transfer tickets during a train delay from 'Train Delay'.",
    "linkedStory": {
      "level": "N3",
      "slug": "story-n3-train-delay",
      "titleJa": "電車の遅延と対応",
      "titleEn": "Train Delay"
    },
    "paragraphs": [
      {
        "subheadingJa": "ホームでの混乱",
        "sentences": [
          {
            "sentenceIndex": 0,
            "rawCompletedJa": "朝のラッシュ時に駅のホームで通勤電車を待っていました。",
            "en": "During the morning rush hour, I was waiting for the commuter train on the station platform.",
            "segments": [
              { "type": "text", "textJa": "朝のラッシュ時に駅のホームで通勤電車を待っていました。" }
            ]
          },
          {
            "sentenceIndex": 1,
            "rawCompletedJa": "ところが、突然の沿線火災により全線で運転が見合わせとなりました。",
            "en": "However, unexpectedly, operations across all lines were suspended due to a trackside fire.",
            "segments": [
              { "type": "blank", "blankIndex": 0 },
              { "type": "text", "textJa": "、突然の沿線火災により全線で運転が見合わせとなりました。" }
            ]
          },
          {
            "sentenceIndex": 2,
            "rawCompletedJa": "その火災による影響で、復旧には一時間以上かかる見込みです。",
            "en": "Due to the impact of that fire, restoration is expected to take over an hour.",
            "segments": [
              { "type": "blank", "blankIndex": 1 },
              { "type": "text", "textJa": "火災" },
              { "type": "blank", "blankIndex": 2 },
              { "type": "text", "textJa": "影響で、復旧には一時間以上かかる見込みです。" }
            ]
          },
          {
            "sentenceIndex": 3,
            "rawCompletedJa": "大切な会議に遅刻してしまったと焦りましたが、駅員が振替乗車票を配っていました。",
            "en": "I panicked thinking I ended up being late for an important meeting, but station attendants were distributing transfer passes.",
            "segments": [
              { "type": "text", "textJa": "大切な会議に遅刻" },
              { "type": "blank", "blankIndex": 3 },
              { "type": "text", "textJa": "と焦りましたが、駅員が振替乗車票を配っていました。" }
            ]
          },
          {
            "sentenceIndex": 4,
            "rawCompletedJa": "今後も強風によりダイヤが乱れる恐れがあります。",
            "en": "There is a risk that schedules may continue to be disrupted by strong winds.",
            "segments": [
              { "type": "text", "textJa": "今後も強風によりダイヤが乱れる" },
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
          { "id": "opt-1", "ja": "ところが" },
          { "id": "opt-2", "ja": "だから" },
          { "id": "opt-3", "ja": "そして" },
          { "id": "opt-4", "ja": "つまり" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'ところが' expresses an unexpected adverse disruption contradicting the normal routine of waiting for a train.",
        "contextClueQuoteJa": "突然の沿線火災により"
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
        "discourseRuleEn": "'その火災' anaphorically designates the line-side fire mentioned in the emergency broadcast.",
        "contextClueQuoteJa": "突然の沿線火災"
      },
      {
        "blankIndex": 2,
        "displayNumber": 3,
        "category": "particles-topic",
        "options": [
          { "id": "opt-1", "ja": "による" },
          { "id": "opt-2", "ja": "に対する" },
          { "id": "opt-3", "ja": "につれて" },
          { "id": "opt-4", "ja": "に反する" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Attributive cause/origin modifying '影響' uses '〜による' (impact caused by).",
        "contextClueQuoteJa": "火災による影響で"
      },
      {
        "blankIndex": 3,
        "displayNumber": 4,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "してしまった" },
          { "id": "opt-2", "ja": "するはずだ" },
          { "id": "opt-3", "ja": "してみたい" },
          { "id": "opt-4", "ja": "してもいい" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Expresses regrettable negative outcome ('ended up being late') using aspectual '〜てしまう'.",
        "contextClueQuoteJa": "焦りましたが"
      },
      {
        "blankIndex": 4,
        "displayNumber": 5,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "恐れがあります" },
          { "id": "opt-2", "ja": "恐れがありません" },
          { "id": "opt-3", "ja": "わけがありません" },
          { "id": "opt-4", "ja": "つもりです" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Formal warning regarding potential negative danger or risk uses '〜恐れがある' (there is a fear/risk of).",
        "contextClueQuoteJa": "ダイヤが乱れる"
      }
    ]
  },

  # Passage 18: N3 Story Scene — Attack on Titan
  {
    "id": "story-n3-attack-on-titan",
    "jlpt": 3,
    "sourceType": "story-scene",
    "titleJa": "壁の外への決意（シーン）",
    "titleEn": "Survey Corps Resolution Outside the Wall Scene",
    "introContextJa": "「進撃の巨人（Anime Legends）」の物語から、壁の外の真実を求めて馬を駆る場面です。",
    "introContextEn": "Riding horses in search of truth beyond the walls from 'Attack on Titan'.",
    "linkedStory": {
      "level": "N3",
      "slug": "story-n3-attack-on-titan",
      "titleJa": "進撃の巨人",
      "titleEn": "Attack on Titan"
    },
    "paragraphs": [
      {
        "subheadingJa": "壁外調査の幕開け",
        "sentences": [
          {
            "sentenceIndex": 0,
            "rawCompletedJa": "調査兵団の兵士たちは、重い鉄の門が開くのを静かに待っていた。",
            "en": "The soldiers of the Survey Corps quietly waited for the heavy iron gate to open.",
            "segments": [
              { "type": "text", "textJa": "調査兵団の兵士たちは、重い鉄の門が開くのを静かに待っていた。" }
            ]
          },
          {
            "sentenceIndex": 1,
            "rawCompletedJa": "だが、壁の外には冷酷な巨人が待ち構えている。",
            "en": "However, beyond the walls, ruthless titans lay in wait.",
            "segments": [
              { "type": "blank", "blankIndex": 0 },
              { "type": "text", "textJa": "、壁の外には冷酷な巨人が待ち構えている。" }
            ]
          },
          {
            "sentenceIndex": 2,
            "rawCompletedJa": "あのような未知の脅威を前にして、恐怖を感じない者はいなかった。",
            "en": "Faced with that kind of unknown threat, there was no one who did not feel terror.",
            "segments": [
              { "type": "blank", "blankIndex": 1 },
              { "type": "text", "textJa": "未知の脅威を前にして、恐怖を感じない者はいなかった。" }
            ]
          },
          {
            "sentenceIndex": 3,
            "rawCompletedJa": "巨大な危険にもかかわらず、彼らは人類の自由のために馬を走らせた。",
            "en": "Despite the colossal danger, they spurred their horses for the sake of human freedom.",
            "segments": [
              { "type": "text", "textJa": "巨大な危険" },
              { "type": "blank", "blankIndex": 2 },
              { "type": "text", "textJa": "、彼らは人類の自由のために馬を走らせた。" }
            ]
          },
          {
            "sentenceIndex": 4,
            "rawCompletedJa": "どんな犠牲を払っても、前進し続けなければならない。",
            "en": "No matter what sacrifices are made, they must continue moving forward.",
            "segments": [
              { "type": "text", "textJa": "どんな犠牲を払っても、" },
              { "type": "blank", "blankIndex": 3 },
              { "type": "text", "textJa": "。" }
            ]
          },
          {
            "sentenceIndex": 5,
            "rawCompletedJa": "壁の向こうには、誰も見たことのない真実があるに違いない。",
            "en": "Beyond the wall, there must surely exist a truth that no one has ever witnessed.",
            "segments": [
              { "type": "text", "textJa": "壁の向こうには、誰も見たことのない" },
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
          { "id": "opt-1", "ja": "だが" },
          { "id": "opt-2", "ja": "だから" },
          { "id": "opt-3", "ja": "それに" },
          { "id": "opt-4", "ja": "つまり" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Dramatically contrasts the quiet order of soldiers waiting with the terrifying reality outside.",
        "contextClueQuoteJa": "静かに待っていた"
      },
      {
        "blankIndex": 1,
        "displayNumber": 2,
        "category": "demonstrative",
        "options": [
          { "id": "opt-1", "ja": "あのような" },
          { "id": "opt-2", "ja": "このような" },
          { "id": "opt-3", "ja": "そのような" },
          { "id": "opt-4", "ja": "どのような" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'あのような' evokes the horrifying, alien titans outside that exceed mundane human comprehension.",
        "contextClueQuoteJa": "冷酷な巨人が待ち構えている"
      },
      {
        "blankIndex": 2,
        "displayNumber": 3,
        "category": "particles-topic",
        "options": [
          { "id": "opt-1", "ja": "にもかかわらず" },
          { "id": "opt-2", "ja": "に関して" },
          { "id": "opt-3", "ja": "にわたって" },
          { "id": "opt-4", "ja": "につれて" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'〜にもかかわらず' expresses resolute action taken in defiance of mortal danger.",
        "contextClueQuoteJa": "巨大な危険"
      },
      {
        "blankIndex": 3,
        "displayNumber": 4,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "前進し続けなければならない" },
          { "id": "opt-2", "ja": "前進しても構わない" },
          { "id": "opt-3", "ja": "前進するはずがない" },
          { "id": "opt-4", "ja": "前進したところだ" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Strong existential obligation / determination collocated with 'どんな犠牲を払っても' requires '〜なければならない'.",
        "contextClueQuoteJa": "どんな犠牲を払っても"
      },
      {
        "blankIndex": 4,
        "displayNumber": 5,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "真実があるに違いない" },
          { "id": "opt-2", "ja": "真実があるかもしれない" },
          { "id": "opt-3", "ja": "真実があるわけがない" },
          { "id": "opt-4", "ja": "真実があるつもりだ" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Conviction of high certainty based on unwavering faith uses '〜に違いない' (must surely be).",
        "contextClueQuoteJa": "壁の向こうには"
      }
    ]
  },

  # Passage 19: N3 Story Scene — Convenience Store
  {
    "id": "story-n3-convenience-store",
    "jlpt": 3,
    "sourceType": "story-scene",
    "titleJa": "深夜コンビニでの初シフト（シーン）",
    "titleEn": "First Convenience Store Night Shift Scene",
    "introContextJa": "「コンビニ夜勤の体験」の物語から、先輩スタッフと品出しやレジをこなす場面です。",
    "introContextEn": "Restocking shelves and working register during a night shift from 'Convenience Store Part-time'.",
    "linkedStory": {
      "level": "N3",
      "slug": "story-n3-convenience-store-part-time",
      "titleJa": "コンビニのアルバイト",
      "titleEn": "Convenience Store Part-time"
    },
    "paragraphs": [
      {
        "subheadingJa": "深夜のレジと品出し",
        "sentences": [
          {
            "sentenceIndex": 0,
            "rawCompletedJa": "今夜は繁華街のコンビニエンスストアで初めての深夜シフトでした。",
            "en": "Tonight was my very first late-night shift at the convenience store in the downtown district.",
            "segments": [
              { "type": "text", "textJa": "今夜は繁華街のコンビニエンスストアで初めての深夜シフトでした。" }
            ]
          },
          {
            "sentenceIndex": 1,
            "rawCompletedJa": "すると、深夜二時を回った頃に配送トラックが到着しました。",
            "en": "Then, around when 2 AM had passed, the delivery truck arrived.",
            "segments": [
              { "type": "blank", "blankIndex": 0 },
              { "type": "text", "textJa": "、深夜二時を回った頃に配送トラックが到着しました。" }
            ]
          },
          {
            "sentenceIndex": 2,
            "rawCompletedJa": "先輩スタッフに検品のやり方を教えてもらって、一緒に商品を棚に並べました。",
            "en": "Having the senior staff kindly teach me how to inspect arrivals, we arranged products on shelves together.",
            "segments": [
              { "type": "text", "textJa": "先輩スタッフに検品のやり方を" },
              { "type": "blank", "blankIndex": 1 },
              { "type": "text", "textJa": "、一緒に商品を棚に並べました。" }
            ]
          },
          {
            "sentenceIndex": 3,
            "rawCompletedJa": "そのハンディスキャナーを使うと、賞味期限の管理が簡単にできます。",
            "en": "Using that handheld scanner, expiration date management can be done easily.",
            "segments": [
              { "type": "blank", "blankIndex": 2 },
              { "type": "text", "textJa": "ハンディスキャナーを使うと、賞味期限の管理が簡単にできます。" }
            ]
          },
          {
            "sentenceIndex": 4,
            "rawCompletedJa": "実践的な接客を通して、日本の商習慣を肌で学ぶことができました。",
            "en": "Through practical customer service, I was able to learn Japanese business customs firsthand.",
            "segments": [
              { "type": "text", "textJa": "実践的な接客" },
              { "type": "blank", "blankIndex": 3 },
              { "type": "text", "textJa": "、日本の商習慣を肌で学ぶことができました。" }
            ]
          },
          {
            "sentenceIndex": 5,
            "rawCompletedJa": "最初は不安でしたが、自然に笑顔で挨拶できるようになりました。",
            "en": "At first I was anxious, but I became able to greet naturally with a smile.",
            "segments": [
              { "type": "text", "textJa": "最初は不安でしたが、自然に笑顔で挨拶" },
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
          { "id": "opt-1", "ja": "すると" },
          { "id": "opt-2", "ja": "しかし" },
          { "id": "opt-3", "ja": "だから" },
          { "id": "opt-4", "ja": "なぜなら" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'すると' marks the sequential event unfolding as the shift progressed past 2 AM.",
        "contextClueQuoteJa": "深夜二時を回った頃に"
      },
      {
        "blankIndex": 1,
        "displayNumber": 2,
        "category": "deixis-perspective",
        "options": [
          { "id": "opt-1", "ja": "教えてもらって" },
          { "id": "opt-2", "ja": "教えてあげて" },
          { "id": "opt-3", "ja": "教えてくれて" },
          { "id": "opt-4", "ja": "教えさせて" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Narrator receiving guidance from senior colleague takes benefactive '〜てもらう' ('教えてもらって').",
        "contextClueQuoteJa": "先輩スタッフに検品のやり方を"
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
        "discourseRuleEn": "'その' refers anaphorically to the inventory equipment introduced during inspection.",
        "contextClueQuoteJa": "検品のやり方を教えてもらって"
      },
      {
        "blankIndex": 3,
        "displayNumber": 4,
        "category": "particles-topic",
        "options": [
          { "id": "opt-1", "ja": "を通して" },
          { "id": "opt-2", "ja": "にとって" },
          { "id": "opt-3", "ja": "に反して" },
          { "id": "opt-4", "ja": "にわたって" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'〜を通して' indicates the experiential medium through which skills and customs were acquired.",
        "contextClueQuoteJa": "実践的な接客"
      },
      {
        "blankIndex": 4,
        "displayNumber": 5,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "できるようになりました" },
          { "id": "opt-2", "ja": "できるはずがありません" },
          { "id": "opt-3", "ja": "できるつもりでした" },
          { "id": "opt-4", "ja": "できることになりました" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Expresses gradual change of ability through practice ('came to be able to...') using '〜ようになる'.",
        "contextClueQuoteJa": "最初は不安でしたが"
      }
    ]
  }
]
