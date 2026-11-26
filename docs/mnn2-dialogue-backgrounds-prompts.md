# Minna no Nihongo II — Dialogue Scene Locations & Background Prompts

This guide maps all **25 lessons (Lessons 26–50)** (`会話` Main Dialogues + `練習C` Situational Dialogues) of **Minna no Nihongo II** to their visual locations behind the Textbook Companion dialogue player (`public/images/books/backgrounds/`).

To avoid redundant asset generation:
* **14 lessons** cleanly reuse existing backgrounds from `01`–`60` (IMC Office, Apartment Hallway, Train Station Ticket Gate, Breakroom, Travel Info Office, Suburban Living Room).
* **11 new MNN II backgrounds (`61`–`71`)** cover the signature *Minna no Nihongo II* scenes (Suzuki's Seaside Apartment, Japanese Tea Ceremony Room, TV Studio Interview Set, Kyoto Kinkaku-ji Golden Pavilion, University Admin Office, Himawari Elementary School, Watt & Izumi's Wedding Reception, Power Electric Lobby, Hair Salon, Health Marathon Park, and Speech Contest Auditorium).

---

## Global Style Guidelines

> **Base Style Suffix (built into every prompt below):**
> `Japanese anime visual novel background art, clean modern Slice-of-Life aesthetic, Makoto Shinkai / Kyoto Animation inspired lighting, 16:9 wide aspect ratio, no characters, no people, no text, no watermarks, soft atmospheric depth so foreground UI and dialogue bubbles remain easily readable.`

---

## Part 1: Lesson-by-Lesson Scene Directory (Lessons 26–50)

| Lesson & Title (`会話`) | Main `会話` (`scene-i`) Location | Background Asset (`public/images/books/backgrounds/`) | `練習C` Mini-Scene Reuse |
| :--- | :--- | :--- | :--- |
| **L26 — ごみは どこに 出したら いいですか** | Apartment 4F Hallway & Trash Rules | `apartment-hallway-genkan.webp` *(Reuse)* | `apartment-hallway-genkan` / `07-downtown-street` |
| **L27 — 何でも 作れるんですね** | Yasuo Suzuki's Sunlit Seaside Room | **`61-suzuki-woodshop-room.webp`** *(New)* | `61-suzuki-woodshop-room` / `office-breakroom-lounge` |
| **L28 — 出張も 多いし、試験も あるし……** | Sachiko Ogawa & Miller (Neighborhood) | `08-host-family-evening.webp` *(Reuse)* | `office-breakroom-lounge` / `25-neighborhood-cafe` |
| **L29 — 忘れ物を して しまったんです** | Train Station Ticket Gate & Lost & Found | `station-ticket-gate.webp` *(Reuse)* | `station-ticket-gate` / `22-john-apartment-day` |
| **L30 — 非常袋を 準備して おかないと** | Yasuo Suzuki's Room (Disaster Prep) | `61-suzuki-woodshop-room.webp` *(Reuse)* | `22-john-apartment-day` / `imc-office-day` |
| **L31 — 料理を 習おうと 思って います** | Hiroshi Ogawa & Miller (Apartment) | `22-john-apartment-day.webp` *(Reuse)* | `office-breakroom-lounge` / `20-student-lounge` |
| **L32 — 無理を しない ほうが いいですよ** | IMC / Power Electric Breakroom | `office-breakroom-lounge.webp` *(Reuse)* | `21-hospital-clinic-room` / `office-breakroom-lounge` |
| **L33 — これは どういう 意味ですか** | Sakura University Admin Office | **`65-university-admin-office.webp`** *(New)* | `07-downtown-street` / `65-university-admin-office` |
| **L34 — わたしが した とおりに、して ください** | Traditional Japanese Tea Ceremony Room | **`62-japanese-tea-ceremony-room.webp`** *(New)* | `62-japanese-tea-ceremony-room` / `20-student-lounge` |
| **L35 — どこか いい 所、ありませんか** | Ski Trip Advice / Travel Counter | `28-travel-info-office.webp` *(Reuse)* | `28-travel-info-office` / `19-hokkaido-hotel-lobby` |
| **L36 — 毎日 運動するように して います** | TV Talk Studio Set (80yo Yone Ogawa) | **`63-tv-studio-interview-set.webp`** *(New)* | `63-tv-studio-interview-set` / `office-breakroom-lounge` |
| **L37 — 金閣寺は 14世紀に 建てられました** | Kyoto Kinkaku-ji (Golden Pavilion) | **`64-kyoto-kinkakuji-golden-pavilion.webp`** *(New)* | `64-kyoto-kinkakuji-golden-pavilion` / `44-art-museum-plaza` |
| **L38 — 片づけるのが 好きなんです** | Sakura University Faculty Office | `65-university-admin-office.webp` *(Reuse)* | `29-professor-office` / `office-breakroom-lounge` |
| **L39 — 遅れて、すみません** | IMC Office (Miller & Section Chief Nakamura) | `imc-office-day.webp` *(Reuse)* | `imc-office-day` / `30-station-ticket-gate` |
| **L40 — 友達が できたか どうか、心配です** | Himawari Elementary School Classroom | **`66-elementary-school-classroom.webp`** *(New)* | `66-elementary-school-classroom` / `02-university-classroom` |
| **L41 — ご結婚 おめでとう ございます** | Watt & Izumi Wedding Reception Banquet | **`67-wedding-reception-banquet.webp`** *(New)* | `67-wedding-reception-banquet` / `company-buffet-party` |
| **L42 — ボーナスは 何に 使いますか** | Power Electric / Office Lounge | **`68-power-electric-lobby-dusk.webp`** *(New)* | `68-power-electric-lobby-dusk` / `office-breakroom-lounge` |
| **L43 — 毎日 楽しそうです** | Power Electric Office (Photos of Hans) | `68-power-electric-lobby-dusk.webp` *(Reuse)* | `office-breakroom-lounge` / `07-downtown-street` |
| **L44 — この 写真みたいに して ください** | Modern Japanese Hair Salon | **`69-japanese-hair-salon.webp`** *(New)* | `69-japanese-hair-salon` / `04-tonkatsu-restaurant` |
| **L45 — コースを まちがえた 場合は、どう したら いいですか** | City Park Health Marathon Start Line | **`70-marathon-park-start-line.webp`** *(New)* | `70-marathon-park-start-line` / `28-travel-info-office` |
| **L46 — 先週 直して もらった ばかりなのに、また……** | Apartment Kitchen / Gas Repair Call | `22-john-apartment-day.webp` *(Reuse)* | `22-john-apartment-day` / `30-station-ticket-gate` |
| **L47 — 婚約したそうです** | Power Electric Lobby at Dusk | `68-power-electric-lobby-dusk.webp` *(Reuse)* | `office-breakroom-lounge` / `25-neighborhood-cafe` |
| **L48 — 休ませて いただけませんか** | IMC Office (Miller & Nakamura) | `imc-office-day.webp` *(Reuse)* | `imc-office-day` / `office-breakroom-lounge` |
| **L49 — よろしく お伝え ください** | Himawari Elementary School (Phone) | `66-elementary-school-classroom.webp` *(Reuse)* | `imc-office-day` / `29-professor-office` |
| **L50 — 心から 感謝いたします** | Speech Contest Auditorium Stage | **`71-speech-contest-auditorium.webp`** *(New)* | `71-speech-contest-auditorium` / `company-buffet-party` |

---

## Part 2: Master Prompts for the 11 New MNN II Backgrounds (`61`–`71`)

### 61. `61-suzuki-woodshop-room.webp` (Lessons 27 & 30 — Yasuo Suzuki's Seaside Room)
> **Prompt:**
> `Japanese anime visual novel background art of a bright, sunny Japanese apartment living room on a high floor overlooking the sparkling blue sea in the distance through wide balcony glass doors. Warm handmade wooden bookshelves, a neatly crafted wooden coffee table with a teapot, an emergency preparedness backpack resting neatly by the entryway corner, soft afternoon sunlight streaming across light-oak floors. Makoto Shinkai / Kyoto Animation slice-of-life style, wide 16:9 composition, no people, no characters, no text.`

---

### 62. `62-japanese-tea-ceremony-room.webp` (Lesson 34 — Traditional Japanese Tearoom `茶室`)
> **Prompt:**
> `Japanese anime visual novel background art of a serene traditional Japanese tatami tearoom (chashitsu). Fresh woven green tatami mats, shoji paper sliding screens filtering soft golden daylight, a tokonoma alcove with a simple ink-brush scroll (without legible text) and a seasonal ikebana flower vase, a sunken hearth (ro) with an iron kettle and bamboo tea whisk beside a ceramic matcha bowl on a wooden tray. Kyoto Animation style, wide 16:9 composition, no people, no characters, no text.`

---

### 63. `63-tv-studio-interview-set.webp` (Lesson 36 — Morning TV Talk Studio Set)
> **Prompt:**
> `Japanese anime visual novel background art of a warm, inviting Japanese daytime television talk show studio set. Two comfortable cream armchairs angled around a low glass studio coffee table with flower arrangements, warm wooden acoustic backdrop panels with soft pastel accent lighting, a sleek broadcast studio camera on a tripod softly visible at the edge of the frame, clean studio floor. Modern slice-of-life anime style, wide 16:9 composition, no people, no characters, no text.`

---

### 64. `64-kyoto-kinkakuji-golden-pavilion.webp` (Lesson 37 — Kyoto Kinkaku-ji Golden Pavilion)
> **Prompt:**
> `Japanese anime visual novel background art of Kinkaku-ji (the Golden Pavilion) in Kyoto on a crisp clear afternoon. The three-story gold-leaf temple pavilion shimmering majestically beside Kyoko-chi mirror pond, reflecting clearly in the calm water surrounded by sculpted Japanese black pine trees, stone lanterns, and mossy garden banks under a vivid blue sky with soft white clouds. Makoto Shinkai / Kyoto Animation style, wide 16:9 composition, no people, no characters, no text.`

---

### 65. `65-university-admin-office.webp` (Lessons 33 & 38 — Sakura University Admin Office)
> **Prompt:**
> `Japanese anime visual novel background art of a tidy, sunlit Japanese university administrative and faculty office. Neat wooden and light-grey desks with document trays (kairan circulation folders), organized bookshelves filled with academic binders, a wall calendar without legible text, large windows overlooking green campus zelkova trees in morning light. Kyoto Animation slice-of-life style, wide 16:9 composition, no people, no characters, no text.`

---

### 66. `66-elementary-school-classroom.webp` (Lessons 40 & 49 — Himawari Elementary School)
> **Prompt:**
> `Japanese anime visual novel background art of a warm, sunlit Japanese elementary school classroom in late afternoon. Neat wooden student desks and chairs, a large green chalkboard at the front, colorful student art drawings pinned along the back bulletin board (no legible text), tall windows overlooking a sunny schoolyard and cherry trees, warm nostalgic golden-hour light. Kyoto Animation style, wide 16:9 composition, no people, no characters, no text.`

---

### 67. `67-wedding-reception-banquet.webp` (Lesson 41 — Watt & Izumi's Wedding Reception)
> **Prompt:**
> `Japanese anime visual novel background art of an elegant, joyful Japanese hotel wedding reception banquet hall. Round banquet tables draped in crisp white linen with pastel rose and lily floral centerpieces, sparkling crystal glasses, warm golden chandelier lights reflecting softly on polished walls, tall draped windows glowing with warm celebration ambiance. Makoto Shinkai / Kyoto Animation style, wide 16:9 composition, no people, no characters, no text.`

---

### 68. `68-power-electric-lobby-dusk.webp` (Lessons 42, 43 & 47 — Power Electric Lobby at Dusk)
> **Prompt:**
> `Japanese anime visual novel background art of a sleek modern Japanese corporate office building elevator lobby (Power Electric) at evening dusk. Brushed stainless-steel elevator doors, polished granite floor reflecting warm overhead lights, glass atrium windows showing a twilight city skyline with early evening office lights, indoor ornamental ficus trees. Kyoto Animation slice-of-life style, wide 16:9 composition, no people, no characters, no text.`

---

### 69. `69-japanese-hair-salon.webp` (Lesson 44 — Modern Japanese Hair Salon)
> **Prompt:**
> `Japanese anime visual novel background art of a stylish, cozy modern Japanese neighborhood hair salon (biyoin) in warm daylight. Clean wooden styling stations with tall framed mirrors, sleek leather styling chairs, neat shelves of haircare bottles, fashion magazines on a small side table, potted monstera plant by a sunny glass storefront window. Slice-of-life anime style, wide 16:9 composition, no people, no characters, no text.`

---

### 70. `70-marathon-park-start-line.webp` (Lesson 45 — City Park Health Marathon Course)
> **Prompt:**
> `Japanese anime visual novel background art of a bright, refreshing Japanese city park paved jogging path set up for a community health marathon on a sunny morning. Colorful festival bunting flags strung between green park trees, a neat white tent water-station table with paper cups on the side, orange traffic cones marking the course lane, crisp blue morning sky. Makoto Shinkai / Kyoto Animation style, wide 16:9 composition, no people, no characters, no text.`

---

### 71. `71-speech-contest-auditorium.webp` (Lesson 50 — Japanese Speech Contest Auditorium)
> **Prompt:**
> `Japanese anime visual novel background art of a bright, dignified Japanese civic auditorium stage after an international speech contest. Polished wooden stage floor, a central wooden lectern podium with a microphone and a celebratory floral arrangement on a stand beside it, warm golden stage spotlights illuminating deep-red velvet stage curtains. Kyoto Animation style, wide 16:9 composition, no people, no characters, no text.`
