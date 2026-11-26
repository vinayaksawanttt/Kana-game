# Minna no Nihongo II — Character Avatar Generation Prompts (`登場人物` + Side Characters)

This guide provides copy-pasteable image generation prompts for all **11 new recurring characters** (`登場人物`, pp. x–xi) plus **4 new MNN II supporting side roles** in **Minna no Nihongo II**.

All prompts match the exact Kyoto Animation slice-of-life bust-up style, framing, and `#FFFFFF` white-background workflow of the existing **Genki I & II** and **MNN I** avatars under `public/images/characters/<id>/{neutral,talking}.webp`.

---

## 1. Global Style & Technical Specs

* **Target Directory**: `public/images/characters/<character-id>/neutral.webp` and `talking.webp`
* **Aspect Ratio & Resolution**: `1:1` Square (`1024×1024` raw PNG → resized/converted to `512×512` RGBA `.webp` via `scripts/process-mnn-avatars.py`)
* **Framing**: Centered head-and-shoulders bust portrait, looking directly at viewer.
* **Background**: Solid pure `#FFFFFF` white background (`isolated on solid pure #FFFFFF white background, no background, no text, no watermark, 1:1 square aspect ratio`).
* **Talking Edit Prompt** *(for image-to-image from `neutral`)*:
  > `Keep the exact same character face, hair, glasses, clothing, pose, lineart, and pure white background unchanged; only change the mouth from closed to a natural open speaking mouth with soft pink tongue visible, friendly animated talking expression.`

---

## 2. Target Asset Paths Table (11 New Cast + 4 New Side Roles)

| # | ID (`character-id`) | Character Name | Role & Context in MNN II | Target Folder |
| :- | :--- | :--- | :--- | :--- |
| 1 | `yasuo-suzuki` | 鈴木 康男 (Yasuo Suzuki) | Japan · IMC Employee | `public/images/characters/yasuo-suzuki/` |
| 2 | `akiko-nakamura` | 中村 秋子 (Akiko Nakamura) | Japan · IMC Sales Section Chief (`営業課長`) | `public/images/characters/akiko-nakamura/` |
| 3 | `hiroshi-ogawa` | 小川 博 (Hiroshi Ogawa) | Japan · Mike Miller's Neighbor | `public/images/characters/hiroshi-ogawa/` |
| 4 | `yone-ogawa` | 小川 よね (Yone Ogawa) | Japan · Hiroshi Ogawa's Mother | `public/images/characters/yone-ogawa/` |
| 5 | `sachiko-ogawa` | 小川 幸子 (Sachiko Ogawa) | Japan · Company Employee | `public/images/characters/sachiko-ogawa/` |
| 6 | `klara-schmidt` | クララ・シュミット (Klara Schmidt) | Germany · German Language Teacher | `public/images/characters/klara-schmidt/` |
| 7 | `chiseko-ito` | 伊藤 ちせ子 (Chiseko Ito) | Japan · Himawari Elementary Teacher (Hans's Teacher) | `public/images/characters/chiseko-ito/` |
| 8 | `akemi-watanabe` | 渡辺 あけみ (Akemi Watanabe) | Japan · Power Electric Employee | `public/images/characters/akemi-watanabe/` |
| 9 | `toru-takahashi` | 高橋 透 (Toru Takahashi) | Japan · Power Electric Employee | `public/images/characters/toru-takahashi/` |
| 10 | `makiko-hayashi` | 林 真紀子 (Makiko Hayashi) | Japan · Power Electric Employee | `public/images/characters/makiko-hayashi/` |
| 11 | `hans-schmidt` | ハンス (Hans Schmidt) | Germany · Elementary Student (12 yrs) | `public/images/characters/hans-schmidt/` |
| S1 | `university-staff` | 大学職員 (University Staff) | Sakura Univ. / International Office Staff | `public/images/characters/university-staff/` |
| S2 | `hairdresser` | 美容師 (Hairdresser) | Lesson 44 · Hair Salon Stylist | `public/images/characters/hairdresser/` |
| S3 | `tour-guide` | ガイド (Tour Guide) | Sightseeing / Museum Tour Guide | `public/images/characters/tour-guide/` |
| S4 | `university-president` | 学長 (University President) | University Ceremony / Speech | `public/images/characters/university-president/` |

---

## 3. Master Character Prompts (11 New Recurring Cast Members)

### 01. `yasuo-suzuki` — 鈴木 康男 (Yasuo Suzuki, Japan, IMC Employee)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Yasuo Suzuki, an approachable early-30s Japanese male corporate office worker at IMC, neat medium-length black hair parted softly to the side with light bangs, warm dark brown eyes, friendly closed-mouth smile, wearing a crisp white dress shirt, muted slate-blue striped tie, and a navy-blue business suit jacket. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Same prompt/reference image, changing `friendly closed-mouth smile` → `cheerful open-mouth speaking expression as if chatting with a colleague`.

---

### 02. `akiko-nakamura` — 中村 秋子 (Akiko Nakamura, Japan, IMC Sales Section Chief `営業課長`)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Akiko Nakamura, a capable, poised early-40s Japanese female corporate sales section chief, short neatly layered dark-brown hair with side-swept bangs, intelligent warm dark eyes, confident closed-mouth smile, wearing a tailored charcoal-grey blazer over a crisp light-ivory collared blouse. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `composed open-mouth speaking expression, capable manager tone`.

---

### 03. `hiroshi-ogawa` — 小川 博 (Hiroshi Ogawa, Japan, Mike Miller's Neighbor)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Hiroshi Ogawa, a kind-hearted late-30s Japanese male neighbor, neatly combed short black hair, warm eyes behind classic black-rimmed rectangular glasses, gentle closed-mouth neighborly smile, wearing a neat casual olive-beige collared polo shirt under a soft navy zip cardigan. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `friendly open-mouth speaking smile, helpful neighbor tone`.

---

### 04. `yone-ogawa` — 小川 よね (Yone Ogawa, Japan, Hiroshi Ogawa's Mother)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Yone Ogawa, a warm-hearted 70-year-old Japanese grandmother, softly curled silver-white hair neatly styled, kind wrinkled eyes behind thin round gold-rimmed glasses, gentle affectionate closed-mouth smile, wearing a cozy plum-lavender knit cardigan over a soft cream collared blouse. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `warm open-mouth speaking smile, gentle grandmotherly tone`.

---

### 05. `sachiko-ogawa` — 小川 幸子 (Sachiko Ogawa, Japan, Company Employee)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Sachiko Ogawa, a cheerful mid-30s Japanese female office worker and mother, dark-brown wavy hair tied back neatly at the nape with soft face-framing strands, warm brown eyes, pleasant closed-mouth smile, wearing a soft sage-green office blouse under a light-grey tailored jacket. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `bright open-mouth speaking smile, friendly conversational tone`.

---

### 06. `klara-schmidt` — クララ・シュミット (Klara Schmidt, Germany, German Language Teacher)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Klara Schmidt, a gracious late-40s German female language teacher, soft shoulder-length wavy honey-blond hair, warm blue-green eyes, gentle cultured closed-mouth smile, wearing a refined burgundy knit cardigan over a white collared blouse with a small silver brooch. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `warm open-mouth speaking smile, articulate teacher expression`.

---

### 07. `chiseko-ito` — 伊藤 ちせ子 (Chiseko Ito, Japan, Himawari Elementary Teacher)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Chiseko Ito, a warm, dedicated mid-30s Japanese female elementary school homeroom teacher, neat shoulder-length dark-brown hair with soft bangs and a small hair clip, bright encouraging dark eyes, caring closed-mouth smile, wearing a soft pastel-yellow blouse under a tidy navy-blue cardigan. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `kind open-mouth speaking smile, encouraging elementary teacher`.

---

### 08. `akemi-watanabe` — 渡辺 あけみ (Akemi Watanabe, Japan, Power Electric Employee)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Akemi Watanabe, a stylish late-20s Japanese female office worker at Power Electric, sleek straight dark-brown shoulder-length hair parted in the middle, bright expressive dark eyes, polite closed-mouth smile, wearing a crisp white office blouse under a tailored beige-camel blazer. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `cheerful open-mouth speaking smile, friendly colleague`.

---

### 09. `toru-takahashi` — 高橋 透 (Toru Takahashi, Japan, Power Electric Employee)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Toru Takahashi, a friendly early-30s Japanese male office worker at Power Electric, neat rounded bowl-cut black hair, kind eyes behind round thin-framed glasses, earnest closed-mouth smile, wearing a light-blue dress shirt, dark navy tie, and charcoal-grey suit jacket. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `earnest open-mouth speaking expression, polite office colleague`.

---

### 10. `makiko-hayashi` — 林 真紀子 (Makiko Hayashi, Japan, Power Electric Employee)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Makiko Hayashi, a lively late-20s Japanese female corporate employee at Power Electric, long glossy dark-brown hair swept neatly behind her shoulders with a hairband, bright dark eyes, upbeat closed-mouth smile, wearing a soft lavender-blue collared blouse under a smart dark-navy blazer. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `lively open-mouth speaking smile, enthusiastic colleague`.

---

### 11. `hans-schmidt` — ハンス (Hans Schmidt, 12, Germany, Elementary Student)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Hans Schmidt, a cheerful 12-year-old German boy living in Japan, neat tousled golden-blond hair, bright curious blue eyes, rosy cheeks, friendly closed-mouth grin, wearing a casual forest-green collared polo shirt under a navy zip-up hoodie. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `cheerful open-mouth speaking grin, energetic 12-year-old student`.

---

## 4. Supporting MNN II Side Roles (4 New Service & Campus Roles)

1. **`university-staff` (大学職員 — University Administrative Staff)**:
   * **`neutral.webp` Prompt**:
     > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of a polite mid-30s Japanese male university administrative staff member, neat short black hair, rectangular glasses, courteous closed-mouth smile, wearing a crisp white dress shirt, conservative blue tie, and medium-grey suit jacket with a small university ID lanyard. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`

2. **`hairdresser` (美容師 — Hair Salon Stylist, Lesson 44)**:
   * **`neutral.webp` Prompt**:
     > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of a trendy late-20s Japanese female hair salon stylist, stylish asymmetric caramel-brown bob haircut, bright friendly eyes, welcoming closed-mouth smile, wearing a fashionable black stylist apron over a crisp striped shirt. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`

3. **`tour-guide` (ガイド — Sightseeing / Museum Tour Guide)**:
   * **`neutral.webp` Prompt**:
     > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of a cheerful mid-20s Japanese female tour guide, neat dark-brown hair tied in a tidy low ponytail under a smart navy-blue guide beret cap, bright welcoming eyes, friendly closed-mouth smile, wearing a tailored sky-blue uniform blazer with a neat neck scarf. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`

4. **`university-president` (学長 — University President)**:
   * **`neutral.webp` Prompt**:
     > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of a distinguished 62-year-old Japanese male university president, neatly combed silver-grey hair, dignified kind eyes behind thin gold-rimmed glasses, composed closed-mouth smile, wearing a formal dark-charcoal suit, white shirt, and subtle silver silk tie. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
