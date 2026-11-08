import json
import sys

passages = [
  # -------------------------------------------------------------------------
  # N5 (6 passages, 27 blanks)
  # -------------------------------------------------------------------------
  {
    "id": "n5-exam-favorite-shop-ken",
    "jlpt": 5,
    "sourceType": "exam-speech",
    "titleJa": "「すきな店」のぶんしょう（ケンさん）",
    "titleEn": "Student Speech: 'My Favorite Shop' (Ken-san)",
    "introContextJa": "日本でべんきょうしている学生が「すきな店」のぶんしょうを書いて、クラスのみんなの前で読みました。",
    "introContextEn": "Students studying in Japan wrote short speeches about their favorite shops and read them aloud in class.",
    "paragraphs": [
      {
        "subheadingJa": "（１）ケンさんのぶんしょう",
        "sentences": [
          {
            "sentenceIndex": 0,
            "rawCompletedJa": "わたしは、日本のラーメンがとてもすきです。",
            "en": "I really like Japanese ramen.",
            "segments": [
              { "type": "text", "textJa": "わたしは、日本のラーメンがとてもすきです。" }
            ]
          },
          {
            "sentenceIndex": 1,
            "rawCompletedJa": "国にいたときから、日本のラーメンをたべたいと思っていました。",
            "en": "Ever since I was in my home country, I wanted to eat Japanese ramen.",
            "segments": [
              { "type": "text", "textJa": "国にいたときから、日本のラーメンをたべたいと思っていました。" }
            ]
          },
          {
            "sentenceIndex": 2,
            "rawCompletedJa": "日本へ来てから、駅の近くのラーメン屋へ初めて行きました。",
            "en": "After coming to Japan, I went to a ramen shop near the station for the first time.",
            "segments": [
              { "type": "text", "textJa": "日本へ" },
              { "type": "blank", "blankIndex": 0 },
              { "type": "text", "textJa": "、駅の近くのラーメン屋へ初めて行きました。" }
            ]
          },
          {
            "sentenceIndex": 3,
            "rawCompletedJa": "その店のスープは熱くて、とてもおいしかったです。",
            "en": "The broth of that shop was piping hot and very delicious.",
            "segments": [
              { "type": "blank", "blankIndex": 1 },
              { "type": "text", "textJa": "店のスープは熱くて、とてもおいしかったです。" }
            ]
          },
          {
            "sentenceIndex": 4,
            "rawCompletedJa": "値段も安くて、学生にはうれしいです。",
            "en": "The price is also cheap, which is wonderful for students.",
            "segments": [
              { "type": "text", "textJa": "値段も安くて、学生" },
              { "type": "blank", "blankIndex": 2 },
              { "type": "text", "textJa": "はうれしいです。" }
            ]
          },
          {
            "sentenceIndex": 5,
            "rawCompletedJa": "店にはいつもたくさんの客がいます。",
            "en": "There are always many customers in the shop.",
            "segments": [
              { "type": "text", "textJa": "店にはいつもたくさんの客が" },
              { "type": "blank", "blankIndex": 3 },
              { "type": "text", "textJa": "。" }
            ]
          },
          {
            "sentenceIndex": 6,
            "rawCompletedJa": "みなさんも、今度いっしょに行きませんか。",
            "en": "Everyone, won't you come along with me next time?",
            "segments": [
              { "type": "text", "textJa": "みなさんも、今度いっしょに" },
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
        "category": "deixis-perspective",
        "options": [
          { "id": "opt-1", "ja": "来てから" },
          { "id": "opt-2", "ja": "行ってから" },
          { "id": "opt-3", "ja": "帰ってから" },
          { "id": "opt-4", "ja": "出かけてから" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "The speaker is currently in Japan giving a speech ('日本でべんきょうしている学生'), so movement toward the speaker's current location must use '来てから' (after coming), not '行ってから' (after going).",
        "contextClueQuoteJa": "日本でべんきょうしている学生が"
      },
      {
        "blankIndex": 1,
        "displayNumber": 2,
        "category": "demonstrative",
        "options": [
          { "id": "opt-1", "ja": "この" },
          { "id": "opt-2", "ja": "その" },
          { "id": "opt-3", "ja": "あの" },
          { "id": "opt-4", "ja": "どの" }
        ],
        "correctIndex": 1,
        "discourseRuleEn": "'その' refers anaphorically to the ramen shop mentioned in the immediately preceding sentence ('駅の近くのラーメン屋').",
        "contextClueQuoteJa": "駅の近くのラーメン屋へ初めて行きました"
      },
      {
        "blankIndex": 2,
        "displayNumber": 3,
        "category": "particles-topic",
        "options": [
          { "id": "opt-1", "ja": "に" },
          { "id": "opt-2", "ja": "で" },
          { "id": "opt-3", "ja": "を" },
          { "id": "opt-4", "ja": "から" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Target particle 'に' expresses the affected beneficiary/perspective marker: '学生にはうれしい' (pleasing to/for students).",
        "contextClueQuoteJa": "値段も安くて、学生にはうれしいです"
      },
      {
        "blankIndex": 3,
        "displayNumber": 4,
        "category": "deixis-perspective",
        "options": [
          { "id": "opt-1", "ja": "あります" },
          { "id": "opt-2", "ja": "います" },
          { "id": "opt-3", "ja": "します" },
          { "id": "opt-4", "ja": "なります" }
        ],
        "correctIndex": 1,
        "discourseRuleEn": "'客' (customers) are animate human beings, requiring the existence verb 'います', not inanimate 'あります'.",
        "contextClueQuoteJa": "たくさんの客が"
      },
      {
        "blankIndex": 4,
        "displayNumber": 5,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "行きませんか" },
          { "id": "opt-2", "ja": "行きましたか" },
          { "id": "opt-3", "ja": "行っていますか" },
          { "id": "opt-4", "ja": "行きませんでした" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Addressing classmates with 'みなさんも、今度いっしょに...' forms a future invitation ('Won't you go with me?'), requiring negative-question invitation form '〜ませんか'.",
        "contextClueQuoteJa": "みなさんも、今度いっしょに"
      }
    ]
  },

  # Passage 2: N5 Exam Archetype — Minji's Speech (すきな店 2)
  {
    "id": "n5-exam-favorite-shop-minji",
    "jlpt": 5,
    "sourceType": "exam-speech",
    "titleJa": "「すきな店」のぶんしょう（ミンジさん）",
    "titleEn": "Student Speech: 'My Favorite Shop' (Minji-san)",
    "introContextJa": "ケンさんの次に、ミンジさんが自分のすきなパン屋について話しました。",
    "introContextEn": "Following Ken, Minji spoke about her favorite bakery.",
    "paragraphs": [
      {
        "subheadingJa": "（２）ミンジさんのぶんしょう",
        "sentences": [
          {
            "sentenceIndex": 0,
            "rawCompletedJa": "わたしの寮のとなりに、小さくてかわいいパン屋があります。",
            "en": "Next to my dormitory, there is a small and cute bakery.",
            "segments": [
              { "type": "text", "textJa": "わたしの寮のとなりに、小さくてかわいいパン屋があります。" }
            ]
          },
          {
            "sentenceIndex": 1,
            "rawCompletedJa": "朝７時から開いているので、学校へ行く前にパンを買います。",
            "en": "Because it opens from 7 AM, I buy bread before going to school.",
            "segments": [
              { "type": "text", "textJa": "朝７時から開いているので、学校へ" },
              { "type": "blank", "blankIndex": 0 },
              { "type": "text", "textJa": "にパンを買います。" }
            ]
          },
          {
            "sentenceIndex": 2,
            "rawCompletedJa": "店主のおじいさんはいつも笑顔で、「いってらっしゃい」と言ってくれます。",
            "en": "The grandfather shopkeeper is always smiling and kindly says 'Take care' to me.",
            "segments": [
              { "type": "text", "textJa": "店主のおじいさんはいつも笑顔で、「いってらっしゃい」と" },
              { "type": "blank", "blankIndex": 1 },
              { "type": "text", "textJa": "。" }
            ]
          },
          {
            "sentenceIndex": 3,
            "rawCompletedJa": "だから、わたしはその店が大好きです。",
            "en": "Therefore, I love that shop very much.",
            "segments": [
              { "type": "blank", "blankIndex": 2 },
              { "type": "text", "textJa": "、わたしはその店が大好きです。" }
            ]
          },
          {
            "sentenceIndex": 4,
            "rawCompletedJa": "焼きたてのクロワッサンをぜひ食べてみてください。",
            "en": "Please definitely try eating the freshly baked croissant.",
            "segments": [
              { "type": "text", "textJa": "焼きたてのクロワッサンをぜひ" },
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
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "行く前" },
          { "id": "opt-2", "ja": "行った後" },
          { "id": "opt-3", "ja": "行きながら" },
          { "id": "opt-4", "ja": "行ってから" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Buying morning bread at 7 AM occurs prior to leaving for class, which requires dictionary-form + 前に ('行く前に').",
        "contextClueQuoteJa": "朝７時から開いているので"
      },
      {
        "blankIndex": 1,
        "displayNumber": 2,
        "category": "deixis-perspective",
        "options": [
          { "id": "opt-1", "ja": "言ってくれます" },
          { "id": "opt-2", "ja": "言ってあげます" },
          { "id": "opt-3", "ja": "言ってもらいます" },
          { "id": "opt-4", "ja": "言わせます" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "The shopkeeper performs a heartwarming kind action directed towards the narrator, requiring '〜てくれる' (favor done for me/in-group).",
        "contextClueQuoteJa": "店主のおじいさんはいつも笑顔で"
      },
      {
        "blankIndex": 2,
        "displayNumber": 3,
        "category": "conjunction",
        "options": [
          { "id": "opt-1", "ja": "だから" },
          { "id": "opt-2", "ja": "しかし" },
          { "id": "opt-3", "ja": "それとも" },
          { "id": "opt-4", "ja": "ところで" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "The preceding points (fresh bread, warm greetings) are the direct cause for loving the shop, requiring causative connector 'だから' (therefore/so).",
        "contextClueQuoteJa": "「いってらっしゃい」と言ってくれます"
      },
      {
        "blankIndex": 3,
        "displayNumber": 4,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "食べてみてください" },
          { "id": "opt-2", "ja": "食べてはいけません" },
          { "id": "opt-3", "ja": "食べたくないです" },
          { "id": "opt-4", "ja": "食べ終わりました" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Adverb 'ぜひ' (by all means / definitely) collocate with request/recommendation endings like '〜てみてください' (please try ...).",
        "contextClueQuoteJa": "焼きたてのクロワッサンをぜひ"
      }
    ]
  },

  # Passage 3: N5 Story Scene — School (n5-going-to-school)
  {
    "id": "n5-story-school",
    "jlpt": 5,
    "sourceType": "story-scene",
    "titleJa": "学校の朝（シーン）",
    "titleEn": "Morning at School (Story Scene)",
    "introContextJa": "「学校へ行きます」の物語から、教室での朝の場面です。",
    "introContextEn": "Scene set in the classroom from the graded story 'Going to School'.",
    "linkedStory": {
      "level": "N5",
      "slug": "n5-going-to-school",
      "titleJa": "学校へ行きます",
      "titleEn": "Going to School"
    },
    "paragraphs": [
      {
        "subheadingJa": "教室でのひとコマ",
        "sentences": [
          {
            "sentenceIndex": 0,
            "rawCompletedJa": "朝８時半に教室に入りました。",
            "en": "I entered the classroom at 8:30 in the morning.",
            "segments": [
              { "type": "text", "textJa": "朝８時半に教室に入りました。" }
            ]
          },
          {
            "sentenceIndex": 1,
            "rawCompletedJa": "黒板の前に先生が立っています。",
            "en": "The teacher is standing in front of the blackboard.",
            "segments": [
              { "type": "text", "textJa": "黒板の前に先生が" },
              { "type": "blank", "blankIndex": 0 },
              { "type": "text", "textJa": "。" }
            ]
          },
          {
            "sentenceIndex": 2,
            "rawCompletedJa": "それから、クラスメイトのたけし君にあいさつをしました。",
            "en": "After that, I greeted my classmate Takeshi-kun.",
            "segments": [
              { "type": "blank", "blankIndex": 1 },
              { "type": "text", "textJa": "、クラスメイトのたけし君にあいさつをしました。" }
            ]
          },
          {
            "sentenceIndex": 3,
            "rawCompletedJa": "この教室は広くて、窓から青い空がよく見えます。",
            "en": "This classroom is spacious, and the blue sky is clearly visible from the window.",
            "segments": [
              { "type": "blank", "blankIndex": 2 },
              { "type": "text", "textJa": "教室は広くて、窓から青い空がよく見えます。" }
            ]
          },
          {
            "sentenceIndex": 4,
            "rawCompletedJa": "今日もいっしょに日本語をがんばりましょう。",
            "en": "Let's do our best studying Japanese together today too.",
            "segments": [
              { "type": "text", "textJa": "今日もいっしょに日本語を" },
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
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "立っています" },
          { "id": "opt-2", "ja": "立ちました" },
          { "id": "opt-3", "ja": "立たないです" },
          { "id": "opt-4", "ja": "立ってあります" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Describing the ongoing state observable upon entering requires state-continuation form '〜ています' ('立っています').",
        "contextClueQuoteJa": "朝８時半に教室に入りました"
      },
      {
        "blankIndex": 1,
        "displayNumber": 2,
        "category": "conjunction",
        "options": [
          { "id": "opt-1", "ja": "それから" },
          { "id": "opt-2", "ja": "しかし" },
          { "id": "opt-3", "ja": "なぜなら" },
          { "id": "opt-4", "ja": "ですから" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Chronological continuation of morning actions (entered room -> saw teacher -> and then greeted classmate) uses sequential connector 'それから'.",
        "contextClueQuoteJa": "教室に入りました"
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
        "discourseRuleEn": "The speaker is currently inside this classroom, so the proximal demonstrative 'この' (this) must be used.",
        "contextClueQuoteJa": "教室に入りました"
      },
      {
        "blankIndex": 3,
        "displayNumber": 4,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "がんばりましょう" },
          { "id": "opt-2", "ja": "がんばりました" },
          { "id": "opt-3", "ja": "がんばりません" },
          { "id": "opt-4", "ja": "がんばる前です" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Addressing a group at the start of the day with '今日もいっしょに' (together today as well) requires mutual hortative '〜ましょう' (let's ...).",
        "contextClueQuoteJa": "今日もいっしょに"
      }
    ]
  },

  # Passage 4: N5 Story Scene — Restaurant (n5-at-restaurant)
  {
    "id": "n5-story-restaurant",
    "jlpt": 5,
    "sourceType": "story-scene",
    "titleJa": "日本のレストラン（シーン）",
    "titleEn": "At the Restaurant (Story Scene)",
    "introContextJa": "「レストランで」の物語から、注文とお勘定の場面です。",
    "introContextEn": "Ordering and paying at a traditional Japanese family restaurant.",
    "linkedStory": {
      "level": "N5",
      "slug": "n5-at-restaurant",
      "titleJa": "レストランで",
      "titleEn": "At the Restaurant"
    },
    "paragraphs": [
      {
        "subheadingJa": "注文のとき",
        "sentences": [
          {
            "sentenceIndex": 0,
            "rawCompletedJa": "昼休みに友達と定食屋へ行きました。",
            "en": "During lunch break, I went to a set meal restaurant with a friend.",
            "segments": [
              { "type": "text", "textJa": "昼休みに友達と定食屋へ行きました。" }
            ]
          },
          {
            "sentenceIndex": 1,
            "rawCompletedJa": "魚定食はおいしそうでしたが、肉の定食をたのみました。",
            "en": "The fish set meal looked delicious, but I ordered the meat set meal.",
            "segments": [
              { "type": "text", "textJa": "魚定食はおいしそうでした" },
              { "type": "blank", "blankIndex": 0 },
              { "type": "text", "textJa": "、肉の定食をたのみました。" }
            ]
          },
          {
            "sentenceIndex": 2,
            "rawCompletedJa": "すみません、お水をもう一杯ください。",
            "en": "Excuse me, please give me one more glass of water.",
            "segments": [
              { "type": "text", "textJa": "すみません、お水をもう一杯" },
              { "type": "blank", "blankIndex": 1 },
              { "type": "text", "textJa": "。" }
            ]
          },
          {
            "sentenceIndex": 3,
            "rawCompletedJa": "店員さんはすぐに持ってきてくれました。",
            "en": "The clerk kindly brought it right away.",
            "segments": [
              { "type": "text", "textJa": "店員さんはすぐに持って" },
              { "type": "blank", "blankIndex": 2 },
              { "type": "text", "textJa": "。" }
            ]
          },
          {
            "sentenceIndex": 4,
            "rawCompletedJa": "その料理はあたたかくて、大満足でした。",
            "en": "That meal was warm, and we were very satisfied.",
            "segments": [
              { "type": "blank", "blankIndex": 3 },
              { "type": "text", "textJa": "料理はあたたかくて、大満足でした。" }
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
          { "id": "opt-1", "ja": "が" },
          { "id": "opt-2", "ja": "から" },
          { "id": "opt-3", "ja": "ので" },
          { "id": "opt-4", "ja": "なら" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Contrast between the appealing fish option and the alternative meat choice ordered requires adversative conjunctive particle 'が' (but/although).",
        "contextClueQuoteJa": "魚定食はおいしそうでした"
      },
      {
        "blankIndex": 1,
        "displayNumber": 2,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "ください" },
          { "id": "opt-2", "ja": "あげます" },
          { "id": "opt-3", "ja": "します" },
          { "id": "opt-4", "ja": "あります" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Polite request to restaurant staff for an item follows the standard formula '[Noun]をください'.",
        "contextClueQuoteJa": "すみません、お水をもう一杯"
      },
      {
        "blankIndex": 2,
        "displayNumber": 3,
        "category": "deixis-perspective",
        "options": [
          { "id": "opt-1", "ja": "きてくれました" },
          { "id": "opt-2", "ja": "いってあげました" },
          { "id": "opt-3", "ja": "きてもらいました" },
          { "id": "opt-4", "ja": "いきました" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "The clerk performed a service bringing water to the narrator's table, requiring directional/benefactive '来てくれました' (came and gave me).",
        "contextClueQuoteJa": "店員さんはすぐに"
      },
      {
        "blankIndex": 3,
        "displayNumber": 4,
        "category": "demonstrative",
        "options": [
          { "id": "opt-1", "ja": "この" },
          { "id": "opt-2", "ja": "その" },
          { "id": "opt-3", "ja": "あの" },
          { "id": "opt-4", "ja": "どの" }
        ],
        "correctIndex": 1,
        "discourseRuleEn": "Refers back to the ordered set meal ('肉の定食') mentioned in the conversation, taking the anaphoric demonstrative 'その'.",
        "contextClueQuoteJa": "肉の定食をたのみました"
      }
    ]
  },

  # Passage 5: N5 Diary/Letter Archetype — Weekend Diary
  {
    "id": "n5-exam-weekend-diary",
    "jlpt": 5,
    "sourceType": "diary-letter",
    "titleJa": "日曜日の日記（公園へのおでかけ）",
    "titleEn": "Sunday Diary (Trip to the Park)",
    "introContextJa": "日本語学校の生徒が書いた週末の日記です。",
    "introContextEn": "A weekend diary entry written by a Japanese language school student.",
    "paragraphs": [
      {
        "subheadingJa": "１０月１５日（日）はれ",
        "sentences": [
          {
            "sentenceIndex": 0,
            "rawCompletedJa": "きょうは天気がよかったので、友達と公園へ行きました。",
            "en": "Because the weather was nice today, I went to the park with a friend.",
            "segments": [
              { "type": "text", "textJa": "きょうは天気がよかったので、友達と公園へ行きました。" }
            ]
          },
          {
            "sentenceIndex": 1,
            "rawCompletedJa": "公園にはきれいな花がたくさん咲いていました。",
            "en": "Many pretty flowers were blooming in the park.",
            "segments": [
              { "type": "text", "textJa": "公園にはきれいな花が" },
              { "type": "blank", "blankIndex": 0 },
              { "type": "text", "textJa": "咲いていました。" }
            ]
          },
          {
            "sentenceIndex": 2,
            "rawCompletedJa": "そして、池の近くのベンチでお弁当を食べました。",
            "en": "And then, we ate our boxed lunches on a bench near the pond.",
            "segments": [
              { "type": "blank", "blankIndex": 1 },
              { "type": "text", "textJa": "、池の近くのベンチでお弁当を食べました。" }
            ]
          },
          {
            "sentenceIndex": 3,
            "rawCompletedJa": "あの大きな木の下で昼寝をしている人もいました。",
            "en": "There were also people taking naps under that big tree over there.",
            "segments": [
              { "type": "blank", "blankIndex": 2 },
              { "type": "text", "textJa": "大きな木の下で昼寝をしている人もいました。" }
            ]
          },
          {
            "sentenceIndex": 4,
            "rawCompletedJa": "写真をたくさん撮ってから、夕方５時に帰りました。",
            "en": "After taking many photos, we returned home at 5 PM in the evening.",
            "segments": [
              { "type": "text", "textJa": "写真をたくさん" },
              { "type": "blank", "blankIndex": 3 },
              { "type": "text", "textJa": "、夕方５時に帰りました。" }
            ]
          },
          {
            "sentenceIndex": 5,
            "rawCompletedJa": "とても楽しい一日でした。",
            "en": "It was a very fun day.",
            "segments": [
              { "type": "text", "textJa": "とても" },
              { "type": "blank", "blankIndex": 4 },
              { "type": "text", "textJa": "一日でした。" }
            ]
          }
        ]
      }
    ],
    "blanks": [
      {
        "blankIndex": 0,
        "displayNumber": 1,
        "category": "particles-topic",
        "options": [
          { "id": "opt-1", "ja": "たくさん" },
          { "id": "opt-2", "ja": "あまり" },
          { "id": "opt-3", "ja": "ぜんぜん" },
          { "id": "opt-4", "ja": "少しだけ" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Positive affirmation of a vibrant blossoming park scene requires affirmative quantity adverb 'たくさん' (many), whereas 'あまり' and 'ぜんぜん' require negative verbs.",
        "contextClueQuoteJa": "きれいな花が"
      },
      {
        "blankIndex": 1,
        "displayNumber": 2,
        "category": "conjunction",
        "options": [
          { "id": "opt-1", "ja": "そして" },
          { "id": "opt-2", "ja": "しかし" },
          { "id": "opt-3", "ja": "なぜなら" },
          { "id": "opt-4", "ja": "つまり" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Additive sequential connector 'そして' links observing flowers with having lunch at the park without contrast.",
        "contextClueQuoteJa": "公園にはきれいな花がたくさん咲いていました"
      },
      {
        "blankIndex": 2,
        "displayNumber": 3,
        "category": "demonstrative",
        "options": [
          { "id": "opt-1", "ja": "あの" },
          { "id": "opt-2", "ja": "この" },
          { "id": "opt-3", "ja": "その" },
          { "id": "opt-4", "ja": "どの" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Points to a distant conspicuous tree visible across the park to both narrator and reader, utilizing distal 'あの'.",
        "contextClueQuoteJa": "池の近くのベンチでお弁当を食べました"
      },
      {
        "blankIndex": 3,
        "displayNumber": 4,
        "category": "deixis-perspective",
        "options": [
          { "id": "opt-1", "ja": "撮ってから" },
          { "id": "opt-2", "ja": "撮る前に" },
          { "id": "opt-3", "ja": "撮りながら" },
          { "id": "opt-4", "ja": "撮らなくて" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'〜てから' marks the completed antecedent action: after taking pictures, they headed home in the evening.",
        "contextClueQuoteJa": "夕方５時に帰りました"
      },
      {
        "blankIndex": 4,
        "displayNumber": 5,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "楽しい" },
          { "id": "opt-2", "ja": "楽しくない" },
          { "id": "opt-3", "ja": "楽しかった" },
          { "id": "opt-4", "ja": "楽しければ" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Adnominal modifier modifying noun '一日' requires the non-past attributive form '楽しい一日' (past tense is carried by final copula 'でした').",
        "contextClueQuoteJa": "一日でした"
      }
    ]
  },

  # Passage 6: N5 Story Scene — Supermarket (n5-supermarket-trip)
  {
    "id": "n5-story-supermarket",
    "jlpt": 5,
    "sourceType": "story-scene",
    "titleJa": "スーパーでの夕飯の買い物",
    "titleEn": "Dinner Shopping at Supermarket",
    "introContextJa": "「スーパーでの買い物」の物語から、晩ご飯の材料を選ぶ場面です。",
    "introContextEn": "Picking ingredients for dinner at the local Japanese supermarket.",
    "linkedStory": {
      "level": "N5",
      "slug": "n5-supermarket-trip",
      "titleJa": "スーパーでの買い物",
      "titleEn": "Supermarket Trip"
    },
    "paragraphs": [
      {
        "subheadingJa": "野菜売り場にて",
        "sentences": [
          {
            "sentenceIndex": 0,
            "rawCompletedJa": "今夜はカレーを作りたいです。",
            "en": "I want to make curry tonight.",
            "segments": [
              { "type": "text", "textJa": "今夜はカレーを作りたいです。" }
            ]
          },
          {
            "sentenceIndex": 1,
            "rawCompletedJa": "だから、玉ねぎと人参と牛肉を買いに来ました。",
            "en": "Therefore, I came to buy onions, carrots, and beef.",
            "segments": [
              { "type": "blank", "blankIndex": 0 },
              { "type": "text", "textJa": "、玉ねぎと人参と牛肉を買いに来ました。" }
            ]
          },
          {
            "sentenceIndex": 2,
            "rawCompletedJa": "その人参はとても新鮮で、色がきれいです。",
            "en": "Those carrots are very fresh and have a lovely color.",
            "segments": [
              { "type": "blank", "blankIndex": 1 },
              { "type": "text", "textJa": "人参はとても新鮮で、色がきれいです。" }
            ]
          },
          {
            "sentenceIndex": 3,
            "rawCompletedJa": "牛肉も安くなっていたので、二パック買いました。",
            "en": "The beef was also on sale, so I bought two packs.",
            "segments": [
              { "type": "text", "textJa": "牛肉" },
              { "type": "blank", "blankIndex": 2 },
              { "type": "text", "textJa": "安くなっていたので、二パック買いました。" }
            ]
          },
          {
            "sentenceIndex": 4,
            "rawCompletedJa": "家へ帰ったら、すぐにおいしいカレーを作りましょう。",
            "en": "Once I get home, let's make delicious curry right away.",
            "segments": [
              { "type": "text", "textJa": "家へ帰ったら、すぐにおいしいカレーを" },
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
          { "id": "opt-1", "ja": "だから" },
          { "id": "opt-2", "ja": "でも" },
          { "id": "opt-3", "ja": "しかし" },
          { "id": "opt-4", "ja": "ところで" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Desire to cook curry in sentence 0 is the cause for shopping for curry ingredients, connecting with causal 'だから'.",
        "contextClueQuoteJa": "今夜はカレーを作りたいです"
      },
      {
        "blankIndex": 1,
        "displayNumber": 2,
        "category": "demonstrative",
        "options": [
          { "id": "opt-1", "ja": "その" },
          { "id": "opt-2", "ja": "あの" },
          { "id": "opt-3", "ja": "この" },
          { "id": "opt-4", "ja": "どの" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Refers back to the carrots picked up on the shelf mentioned in the prior sentence, taking anaphoric 'その'.",
        "contextClueQuoteJa": "人参と牛肉を買いに来ました"
      },
      {
        "blankIndex": 2,
        "displayNumber": 3,
        "category": "particles-topic",
        "options": [
          { "id": "opt-1", "ja": "も" },
          { "id": "opt-2", "ja": "は" },
          { "id": "opt-3", "ja": "を" },
          { "id": "opt-4", "ja": "に" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Additive particle 'も' (also) indicates that in addition to vegetables being good, beef was additionally discounted.",
        "contextClueQuoteJa": "とても新鮮で、色がきれいです"
      },
      {
        "blankIndex": 3,
        "displayNumber": 4,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "作りましょう" },
          { "id": "opt-2", "ja": "作りました" },
          { "id": "opt-3", "ja": "作らないです" },
          { "id": "opt-4", "ja": "作った後です" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Self-hortative / resolution ending '作りましょう' (let's cook / I shall cook) expresses joyful intention after returning home.",
        "contextClueQuoteJa": "家へ帰ったら、すぐに"
      }
    ]
  }
]

# -------------------------------------------------------------------------
# N4 (6 passages, 26 blanks)
# -------------------------------------------------------------------------

passages.extend([
  # Passage 7: N4 Diary/Letter Archetype — BBQ Email
  {
    "id": "n4-exam-email-invitation",
    "jlpt": 4,
    "sourceType": "diary-letter",
    "titleJa": "バーベキューのお誘いメール",
    "titleEn": "BBQ Invitation Email",
    "introContextJa": "サークルの先輩から新入生へ送られた週末バーベキューの案内メールです。",
    "introContextEn": "An invitation email sent by a club senior to new members regarding a weekend BBQ.",
    "paragraphs": [
      {
        "subheadingJa": "件名：今週末のバーベキューについて",
        "sentences": [
          {
            "sentenceIndex": 0,
            "rawCompletedJa": "来週の日曜日に、多摩川の河川敷でバーベキューをします。",
            "en": "Next Sunday, we will have a barbecue along the Tamagawa riverbank.",
            "segments": [
              { "type": "text", "textJa": "来週の日曜日に、多摩川の河川敷でバーベキューをします。" }
            ]
          },
          {
            "sentenceIndex": 1,
            "rawCompletedJa": "ところで、当日の天気予報は晴れで、とても暖かくなりそうです。",
            "en": "By the way, the weather forecast for that day is clear and seems like it will be very warm.",
            "segments": [
              { "type": "blank", "blankIndex": 0 },
              { "type": "text", "textJa": "、当日の天気予報は晴れで、とても暖かくなりそうです。" }
            ]
          },
          {
            "sentenceIndex": 2,
            "rawCompletedJa": "参加できる人は、金曜日までに返事を送ってください。",
            "en": "Those who can join, please send a reply by Friday.",
            "segments": [
              { "type": "text", "textJa": "参加できる人は、金曜日までに返事を" },
              { "type": "blank", "blankIndex": 1 },
              { "type": "text", "textJa": "。" }
            ]
          },
          {
            "sentenceIndex": 3,
            "rawCompletedJa": "もし友達も来てくれたら、さらに盛り上がると思います。",
            "en": "If your friends also come along, I think it will be even more exciting.",
            "segments": [
              { "type": "text", "textJa": "もし友達も" },
              { "type": "blank", "blankIndex": 2 },
              { "type": "text", "textJa": "、さらに盛り上がると思います。" }
            ]
          },
          {
            "sentenceIndex": 4,
            "rawCompletedJa": "その日は午後１時に駅の西口で待ち合わせましょう。",
            "en": "On that day, let's meet at the west exit of the station at 1 PM.",
            "segments": [
              { "type": "blank", "blankIndex": 3 },
              { "type": "text", "textJa": "日は午後１時に駅の西口で待ち合わせましょう。" }
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
          { "id": "opt-1", "ja": "ところで" },
          { "id": "opt-2", "ja": "しかし" },
          { "id": "opt-3", "ja": "だから" },
          { "id": "opt-4", "ja": "つまり" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Transitioning from general event announcement to a new topic (weather forecast) requires topic-shifting discourse marker 'ところで' (by the way).",
        "contextClueQuoteJa": "バーベキューをします"
      },
      {
        "blankIndex": 1,
        "displayNumber": 2,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "送ってください" },
          { "id": "opt-2", "ja": "送らせてください" },
          { "id": "opt-3", "ja": "送られてください" },
          { "id": "opt-4", "ja": "送りましょう" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Requesting recipients to submit RSVPs requires polite request directive '〜てください'.",
        "contextClueQuoteJa": "金曜日までに返事を"
      },
      {
        "blankIndex": 2,
        "displayNumber": 3,
        "category": "deixis-perspective",
        "options": [
          { "id": "opt-1", "ja": "来てくれたら" },
          { "id": "opt-2", "ja": "行ってくれたら" },
          { "id": "opt-3", "ja": "来てあげたら" },
          { "id": "opt-4", "ja": "来てもらったら" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Friends joining the host/speaker's gathering represents a welcomed favorable action directed to the speaker's in-group ('来てくれる').",
        "contextClueQuoteJa": "さらに盛り上がると思います"
      },
      {
        "blankIndex": 3,
        "displayNumber": 4,
        "category": "demonstrative",
        "options": [
          { "id": "opt-1", "ja": "その" },
          { "id": "opt-2", "ja": "この" },
          { "id": "opt-3", "ja": "あの" },
          { "id": "opt-4", "ja": "どの" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'その日' anaphorically refers to the previously specified Sunday ('来週の日曜日').",
        "contextClueQuoteJa": "来週の日曜日に"
      }
    ]
  },

  # Passage 8: N4 Exam Archetype — My Hometown Speech
  {
    "id": "n4-exam-speech-my-hometown",
    "jlpt": 4,
    "sourceType": "exam-speech",
    "titleJa": "「私のふるさと」のスピーチ",
    "titleEn": "Speech: 'My Hometown'",
    "introContextJa": "留学生のリンさんが日本語の授業で「私のふるさと」についてスピーチをしました。",
    "introContextEn": "International student Lin gave a speech about her hometown during Japanese class.",
    "paragraphs": [
      {
        "subheadingJa": "リンさんの発表",
        "sentences": [
          {
            "sentenceIndex": 0,
            "rawCompletedJa": "私のふるさとは、山と湖に囲まれた小さな町です。",
            "en": "My hometown is a small town surrounded by mountains and lakes.",
            "segments": [
              { "type": "text", "textJa": "私のふるさとは、山と湖に囲まれた小さな町です。" }
            ]
          },
          {
            "sentenceIndex": 1,
            "rawCompletedJa": "冬はとても寒いですが、雪景色が息をのむほど美しいです。",
            "en": "Winter is very cold, but the snowy landscape is breathtakingly beautiful.",
            "segments": [
              { "type": "text", "textJa": "冬はとても寒い" },
              { "type": "blank", "blankIndex": 0 },
              { "type": "text", "textJa": "、雪景色が息をのむほど美しいです。" }
            ]
          },
          {
            "sentenceIndex": 2,
            "rawCompletedJa": "あそこには古い温泉があり、毎年多くの観光客が訪れます。",
            "en": "Over there, there are historic hot springs, and many tourists visit every year.",
            "segments": [
              { "type": "blank", "blankIndex": 1 },
              { "type": "text", "textJa": "には古い温泉があり、毎年多くの観光客が訪れます。" }
            ]
          },
          {
            "sentenceIndex": 3,
            "rawCompletedJa": "町の人々は親切で、いつも温かく迎えてくれます。",
            "en": "The townsfolk are kind and always welcome visitors warmly.",
            "segments": [
              { "type": "text", "textJa": "町の人々は親切で、いつも温かく" },
              { "type": "blank", "blankIndex": 2 },
              { "type": "text", "textJa": "。" }
            ]
          },
          {
            "sentenceIndex": 4,
            "rawCompletedJa": "皆さんも、機会があればぜひ遊びに来てみてください。",
            "en": "Everyone, if you have a chance, please try visiting by all means.",
            "segments": [
              { "type": "text", "textJa": "皆さんも、機会があればぜひ遊びに" },
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
          { "id": "opt-1", "ja": "ですが" },
          { "id": "opt-2", "ja": "だから" },
          { "id": "opt-3", "ja": "そして" },
          { "id": "opt-4", "ja": "それに" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Contrasting negative severe cold ('寒い') with positive breathtaking beauty ('美しい') requires adversative 'ですが'.",
        "contextClueQuoteJa": "冬はとても寒い"
      },
      {
        "blankIndex": 1,
        "displayNumber": 2,
        "category": "demonstrative",
        "options": [
          { "id": "opt-1", "ja": "あそこ" },
          { "id": "opt-2", "ja": "ここ" },
          { "id": "opt-3", "ja": "そこ" },
          { "id": "opt-4", "ja": "どこ" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Lin is currently delivering the speech in a Tokyo classroom, so her distant hometown in another country is referred to with distal 'あそこ'.",
        "contextClueQuoteJa": "私のふるさとは"
      },
      {
        "blankIndex": 2,
        "displayNumber": 3,
        "category": "deixis-perspective",
        "options": [
          { "id": "opt-1", "ja": "迎えてくれます" },
          { "id": "opt-2", "ja": "迎えてあげます" },
          { "id": "opt-3", "ja": "迎えてもらいます" },
          { "id": "opt-4", "ja": "迎えます" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Townspeople performing kindness toward Lin and her visiting guests is an in-group benefactive ('迎えてくれる').",
        "contextClueQuoteJa": "町の人々は親切で"
      },
      {
        "blankIndex": 3,
        "displayNumber": 4,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "来てみてください" },
          { "id": "opt-2", "ja": "行ってみてください" },
          { "id": "opt-3", "ja": "帰ってみてください" },
          { "id": "opt-4", "ja": "出かけてみてください" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Inviting listeners to come visit Lin's hometown (home base / in-group territory) requires '来てみてください' (come and see).",
        "contextClueQuoteJa": "ぜひ遊びに"
      }
    ]
  },

  # Passage 9: N4 Story Scene — Airport (n4-airport-departure)
  {
    "id": "n4-story-airport",
    "jlpt": 4,
    "sourceType": "story-scene",
    "titleJa": "国際空港での出発（シーン）",
    "titleEn": "Airport Departure Scene",
    "introContextJa": "「空港での出発」の物語から、チェックインカウンターと保安検査場を通過する場面です。",
    "introContextEn": "Passing through the check-in counter and security checkpoint from 'Airport Departure'.",
    "linkedStory": {
      "level": "N4",
      "slug": "n4-airport-departure",
      "titleJa": "空港での出発",
      "titleEn": "Airport Departure"
    },
    "paragraphs": [
      {
        "subheadingJa": "保安検査と搭乗口",
        "sentences": [
          {
            "sentenceIndex": 0,
            "rawCompletedJa": "空港の出発ロビーは、スーツケースを引く人々で賑わっていました。",
            "en": "The departure lobby of the airport was bustling with people pulling suitcases.",
            "segments": [
              { "type": "text", "textJa": "空港の出発ロビーは、スーツケースを引く人々で賑わっていました。" }
            ]
          },
          {
            "sentenceIndex": 1,
            "rawCompletedJa": "まず荷物を預けてから、搭乗券を受け取りました。",
            "en": "First, after checking my luggage, I received my boarding pass.",
            "segments": [
              { "type": "text", "textJa": "まず荷物を" },
              { "type": "blank", "blankIndex": 0 },
              { "type": "text", "textJa": "、搭乗券を受け取りました。" }
            ]
          },
          {
            "sentenceIndex": 2,
            "rawCompletedJa": "それから、保安検査場へ向かいました。",
            "en": "After that, I headed towards the security inspection area.",
            "segments": [
              { "type": "blank", "blankIndex": 1 },
              { "type": "text", "textJa": "、保安検査場へ向かいました。" }
            ]
          },
          {
            "sentenceIndex": 3,
            "rawCompletedJa": "このパスポートを機械にかざすと、ゲートが自動で開きました。",
            "en": "When I held this passport up to the machine, the gate opened automatically.",
            "segments": [
              { "type": "blank", "blankIndex": 2 },
              { "type": "text", "textJa": "パスポートを機械にかざすと、ゲートが自動で開きました。" }
            ]
          },
          {
            "sentenceIndex": 4,
            "rawCompletedJa": "飛行機は定刻通りに出発するはずです。",
            "en": "The airplane is expected to depart on schedule.",
            "segments": [
              { "type": "text", "textJa": "飛行機は定刻通りに出発する" },
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
        "category": "deixis-perspective",
        "options": [
          { "id": "opt-1", "ja": "預けてから" },
          { "id": "opt-2", "ja": "預ける前に" },
          { "id": "opt-3", "ja": "預けながら" },
          { "id": "opt-4", "ja": "預けなくて" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'まず...〜てから' marks the mandatory sequential step: checking luggage must be completed before receiving boarding pass.",
        "contextClueQuoteJa": "まず荷物を"
      },
      {
        "blankIndex": 1,
        "displayNumber": 2,
        "category": "conjunction",
        "options": [
          { "id": "opt-1", "ja": "それから" },
          { "id": "opt-2", "ja": "しかし" },
          { "id": "opt-3", "ja": "なぜなら" },
          { "id": "opt-4", "ja": "けれども" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Advances the procedural sequence from the check-in desk to the next checkpoint (security gate).",
        "contextClueQuoteJa": "搭乗券を受け取りました"
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
        "discourseRuleEn": "The passport held physically in the traveler's hand directly before scanning takes proximal 'この'.",
        "contextClueQuoteJa": "機械にかざすと"
      },
      {
        "blankIndex": 3,
        "displayNumber": 4,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "はずです" },
          { "id": "opt-2", "ja": "つもりです" },
          { "id": "opt-3", "ja": "たいです" },
          { "id": "opt-4", "ja": "ようです" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Expressing logical objective expectation based on the status board ('定刻通り') takes '〜はずです' (should / is expected to).",
        "contextClueQuoteJa": "定刻通りに出発する"
      }
    ]
  },

  # Passage 10: N4 Story Scene — Shinkansen (n4-shinkansen-station)
  {
    "id": "n4-story-shinkansen",
    "jlpt": 4,
    "sourceType": "story-scene",
    "titleJa": "新幹線の車窓から（シーン）",
    "titleEn": "From the Shinkansen Window Scene",
    "introContextJa": "「新幹線での旅」の物語から、東京駅を出発して富士山を眺める場面です。",
    "introContextEn": "Departing Tokyo station and gazing at Mt. Fuji from 'Shinkansen Journey'.",
    "linkedStory": {
      "level": "N4",
      "slug": "n4-shinkansen-station",
      "titleJa": "新幹線での旅",
      "titleEn": "Shinkansen Journey"
    },
    "paragraphs": [
      {
        "subheadingJa": "車内での旅情",
        "sentences": [
          {
            "sentenceIndex": 0,
            "rawCompletedJa": "新幹線は滑るように静かに東京駅のホームを離れました。",
            "en": "The Shinkansen slid quietly away from the Tokyo station platform.",
            "segments": [
              { "type": "text", "textJa": "新幹線は滑るように静かに東京駅のホームを離れました。" }
            ]
          },
          {
            "sentenceIndex": 1,
            "rawCompletedJa": "すると、車内アナウンスが心地よい音楽とともに流れました。",
            "en": "Thereupon, the onboard announcement played along with pleasant chime music.",
            "segments": [
              { "type": "blank", "blankIndex": 0 },
              { "type": "text", "textJa": "、車内アナウンスが心地よい音楽とともに流れました。" }
            ]
          },
          {
            "sentenceIndex": 2,
            "rawCompletedJa": "その声はとても穏やかで、旅の緊張をほぐしてくれました。",
            "en": "That voice was very gentle, easing the tension of my journey.",
            "segments": [
              { "type": "blank", "blankIndex": 1 },
              { "type": "text", "textJa": "声はとても穏やかで、旅の緊張をほぐしてくれました。" }
            ]
          },
          {
            "sentenceIndex": 3,
            "rawCompletedJa": "窓の外を眺めると、遠くに青い富士山がはっきりと見えました。",
            "en": "Looking out the window, blue Mt. Fuji was distinctly visible in the distance.",
            "segments": [
              { "type": "text", "textJa": "窓の外を眺めると、遠くに青い富士山がはっきりと" },
              { "type": "blank", "blankIndex": 2 },
              { "type": "text", "textJa": "。" }
            ]
          },
          {
            "sentenceIndex": 4,
            "rawCompletedJa": "名古屋まではあと一時間ほどで到着するようです。",
            "en": "It appears we will arrive in Nagoya in about an hour.",
            "segments": [
              { "type": "text", "textJa": "名古屋まではあと一時間ほどで到着する" },
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
          { "id": "opt-1", "ja": "すると" },
          { "id": "opt-2", "ja": "しかし" },
          { "id": "opt-3", "ja": "だから" },
          { "id": "opt-4", "ja": "または" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'すると' marks the immediate consequential action triggered right after the train departed the platform.",
        "contextClueQuoteJa": "東京駅のホームを離れました"
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
        "discourseRuleEn": "Refers anaphorically to the announcer's voice heard in the previous sentence ('車内アナウンス').",
        "contextClueQuoteJa": "車内アナウンスが心地よい音楽とともに流れました"
      },
      {
        "blankIndex": 2,
        "displayNumber": 3,
        "category": "particles-topic",
        "options": [
          { "id": "opt-1", "ja": "見えました" },
          { "id": "opt-2", "ja": "見ました" },
          { "id": "opt-3", "ja": "見せました" },
          { "id": "opt-4", "ja": "見られました" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Spontaneous perception of a natural landmark entering the field of view without deliberate effort requires intransitive/potential '見えました'.",
        "contextClueQuoteJa": "青い富士山がはっきりと"
      },
      {
        "blankIndex": 3,
        "displayNumber": 4,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "ようです" },
          { "id": "opt-2", "ja": "そうです" },
          { "id": "opt-3", "ja": "らしいです" },
          { "id": "opt-4", "ja": "はずです" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Sensory conjecture based on the monitor display and train speed uses '〜ようです' (appears / seems to be).",
        "contextClueQuoteJa": "あと一時間ほどで到着する"
      }
    ]
  },

  # Passage 11: N4 Story Scene — Momotaro (n4-momotaro)
  {
    "id": "n4-story-momotaro",
    "jlpt": 4,
    "sourceType": "story-scene",
    "titleJa": "桃太郎の鬼ヶ島への旅立ち（シーン）",
    "titleEn": "Momotaro's Departure for Onigashima",
    "introContextJa": "日本の昔話「桃太郎」から、お供の動物たちにきびだんごを分け与える場面です。",
    "introContextEn": "Momotaro sharing millet dumplings with companions from the fairy tale 'Momotaro'.",
    "linkedStory": {
      "level": "N4",
      "slug": "n4-momotaro",
      "titleJa": "桃太郎",
      "titleEn": "Momotaro"
    },
    "paragraphs": [
      {
        "subheadingJa": "きびだんごとお供の出会い",
        "sentences": [
          {
            "sentenceIndex": 0,
            "rawCompletedJa": "桃太郎はおじいさんとおばあさんに見送られて、村を出発しました。",
            "en": "Momotaro saw farewell to grandfather and grandmother, departing the village.",
            "segments": [
              { "type": "text", "textJa": "桃太郎はおじいさんとおばあさんに見送られて、村を出発しました。" }
            ]
          },
          {
            "sentenceIndex": 1,
            "rawCompletedJa": "おばあさんは日本一のきびだんごを作って持たせてくれました。",
            "en": "Grandmother made Japan's best millet dumplings and let him take them along.",
            "segments": [
              { "type": "text", "textJa": "おばあさんは日本一のきびだんごを" },
              { "type": "blank", "blankIndex": 0 },
              { "type": "text", "textJa": "。" }
            ]
          },
          {
            "sentenceIndex": 2,
            "rawCompletedJa": "道を歩いていると、一匹の犬が駆けて来ました。",
            "en": "While walking along the road, a dog came running toward him.",
            "segments": [
              { "type": "text", "textJa": "道を歩いていると、一匹の犬が駆けて" },
              { "type": "blank", "blankIndex": 1 },
              { "type": "text", "textJa": "。" }
            ]
          },
          {
            "sentenceIndex": 3,
            "rawCompletedJa": "その犬にきびだんごを一つあげると、喜んでお供になりました。",
            "en": "When he gave one millet dumpling to that dog, it gladly became his companion.",
            "segments": [
              { "type": "blank", "blankIndex": 2 },
              { "type": "text", "textJa": "犬にきびだんごを一つあげると、喜んでお供になりました。" }
            ]
          },
          {
            "sentenceIndex": 4,
            "rawCompletedJa": "そして、桃太郎は仲間とともに鬼ヶ島へ向かうことにしました。",
            "en": "And so, Momotaro decided to head for Onigashima together with his comrades.",
            "segments": [
              { "type": "blank", "blankIndex": 3 },
              { "type": "text", "textJa": "、桃太郎は仲間とともに鬼ヶ島へ向かうことにしました。" }
            ]
          },
          {
            "sentenceIndex": 5,
            "rawCompletedJa": "鬼を退治して、村の平和を取り戻さなければなりません。",
            "en": "They must defeat the demons and restore peace to the village.",
            "segments": [
              { "type": "text", "textJa": "鬼を退治して、村の平和を" },
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
        "category": "deixis-perspective",
        "options": [
          { "id": "opt-1", "ja": "作って持たせてくれました" },
          { "id": "opt-2", "ja": "作って持たせてあげました" },
          { "id": "opt-3", "ja": "作って持たせてもらいました" },
          { "id": "opt-4", "ja": "作って持たせました" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Grandmother performed a loving benefactive action for protagonist Momotaro ('持たせてくれた').",
        "contextClueQuoteJa": "おばあさんは日本一のきびだんごを"
      },
      {
        "blankIndex": 1,
        "displayNumber": 2,
        "category": "deixis-perspective",
        "options": [
          { "id": "opt-1", "ja": "来ました" },
          { "id": "opt-2", "ja": "行きました" },
          { "id": "opt-3", "ja": "帰りました" },
          { "id": "opt-4", "ja": "出ました" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Movement is directed toward the narrator/protagonist's point of observation, requiring '駆けて来ました' (came running toward).",
        "contextClueQuoteJa": "一匹の犬が"
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
        "discourseRuleEn": "Anaphoric demonstrative 'その' refers back to the dog introduced in the prior sentence ('一匹の犬').",
        "contextClueQuoteJa": "一匹の犬が駆けて来ました"
      },
      {
        "blankIndex": 3,
        "displayNumber": 4,
        "category": "conjunction",
        "options": [
          { "id": "opt-1", "ja": "そして" },
          { "id": "opt-2", "ja": "しかし" },
          { "id": "opt-3", "ja": "だが" },
          { "id": "opt-4", "ja": "なぜなら" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Additive narrative transition connecting gaining allies to setting out for the demon island.",
        "contextClueQuoteJa": "喜んでお供になりました"
      },
      {
        "blankIndex": 4,
        "displayNumber": 5,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "取り戻さなければなりません" },
          { "id": "opt-2", "ja": "取り戻しても構いません" },
          { "id": "opt-3", "ja": "取り戻さなくてもいいです" },
          { "id": "opt-4", "ja": "取り戻すつもりではありません" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Expressing mission necessity / solemn duty uses obligation form '〜なければなりません' (must restore).",
        "contextClueQuoteJa": "村の平和を"
      }
    ]
  },

  # Passage 12: N4 Exam Archetype — Apartment Waste Sorting Notice
  {
    "id": "n4-exam-notice-apartment",
    "jlpt": 4,
    "sourceType": "diary-letter",
    "titleJa": "マンションのゴミ出しに関するお願い",
    "titleEn": "Notice: Apartment Waste Sorting Rules",
    "introContextJa": "マンションの掲示板に貼られた、住人に向けたルール案内文です。",
    "introContextEn": "A notice posted on the apartment bulletin board instructing residents on garbage rules.",
    "paragraphs": [
      {
        "subheadingJa": "居住者の皆様へのお願い",
        "sentences": [
          {
            "sentenceIndex": 0,
            "rawCompletedJa": "マンションの住人の皆様へ、ゴミの分別についてお知らせします。",
            "en": "To all apartment residents, we announce instructions regarding waste sorting.",
            "segments": [
              { "type": "text", "textJa": "マンションの住人の皆様へ、ゴミの分別についてお知らせします。" }
            ]
          },
          {
            "sentenceIndex": 1,
            "rawCompletedJa": "燃えるゴミは、毎週火曜日と金曜日の朝８時までに出してください。",
            "en": "Please put out burnable trash by 8 AM every Tuesday and Friday.",
            "segments": [
              { "type": "text", "textJa": "燃えるゴミは、毎週火曜日と金曜日の朝８時までに" },
              { "type": "blank", "blankIndex": 0 },
              { "type": "text", "textJa": "。" }
            ]
          },
          {
            "sentenceIndex": 2,
            "rawCompletedJa": "なお、指定のゴミ袋以外で出されたゴミは回収されません。",
            "en": "Furthermore, garbage put out in bags other than designated ones will not be collected.",
            "segments": [
              { "type": "blank", "blankIndex": 1 },
              { "type": "text", "textJa": "、指定のゴミ袋以外で出されたゴミは回収されません。" }
            ]
          },
          {
            "sentenceIndex": 3,
            "rawCompletedJa": "その袋は、近所のスーパーやコンビニで買うことができます。",
            "en": "Those bags can be purchased at local supermarkets and convenience stores.",
            "segments": [
              { "type": "blank", "blankIndex": 2 },
              { "type": "text", "textJa": "袋は、近所のスーパーやコンビニで買うことができます。" }
            ]
          },
          {
            "sentenceIndex": 4,
            "rawCompletedJa": "粗大ゴミを捨てる場合は、事前に管理事務所へ連絡しなければなりません。",
            "en": "When disposing of oversized garbage, you must contact the management office in advance.",
            "segments": [
              { "type": "text", "textJa": "粗大ゴミを捨てる場合は、事前に管理事務所へ" },
              { "type": "blank", "blankIndex": 3 },
              { "type": "text", "textJa": "。" }
            ]
          },
          {
            "sentenceIndex": 5,
            "rawCompletedJa": "皆様のご協力をよろしくお願いいたします。",
            "en": "We appreciate everyone's kind cooperation.",
            "segments": [
              { "type": "text", "textJa": "皆様のご協力をよろしく" },
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
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "出してください" },
          { "id": "opt-2", "ja": "出してもいいです" },
          { "id": "opt-3", "ja": "出してはいけません" },
          { "id": "opt-4", "ja": "出すはずです" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Public rule requests directed to apartment residents use polite directive '〜てください'.",
        "contextClueQuoteJa": "朝８時までに"
      },
      {
        "blankIndex": 1,
        "displayNumber": 2,
        "category": "conjunction",
        "options": [
          { "id": "opt-1", "ja": "なお" },
          { "id": "opt-2", "ja": "しかし" },
          { "id": "opt-3", "ja": "だから" },
          { "id": "opt-4", "ja": "つまり" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "'なお' is the formal administrative conjunction used to add a supplementary condition or caveat to an official instruction.",
        "contextClueQuoteJa": "指定のゴミ袋以外で出されたゴミは回収されません"
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
        "discourseRuleEn": "'その袋' anaphorically points back to '指定のゴミ袋' (the designated bags) just mentioned.",
        "contextClueQuoteJa": "指定のゴミ袋以外で"
      },
      {
        "blankIndex": 3,
        "displayNumber": 4,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "連絡しなければなりません" },
          { "id": "opt-2", "ja": "連絡しても構いません" },
          { "id": "opt-3", "ja": "連絡してはいけません" },
          { "id": "opt-4", "ja": "連絡するつもりです" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Mandatory procedure for bulky item disposal requires obligation form '〜なければなりません'.",
        "contextClueQuoteJa": "事前に管理事務所へ"
      },
      {
        "blankIndex": 4,
        "displayNumber": 5,
        "category": "modality-ending",
        "options": [
          { "id": "opt-1", "ja": "お願いいたします" },
          { "id": "opt-2", "ja": "お願いされます" },
          { "id": "opt-3", "ja": "お願いさせます" },
          { "id": "opt-4", "ja": "お願いしています" }
        ],
        "correctIndex": 0,
        "discourseRuleEn": "Standard Japanese formal business/notice closing salutation formula is 'よろしくお願いいたします'.",
        "contextClueQuoteJa": "皆様のご協力をよろしく"
      }
    ]
  }
])
