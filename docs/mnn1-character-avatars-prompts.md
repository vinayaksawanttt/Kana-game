# Minna no Nihongo I — Character Avatar Generation Prompts (`登場人物`)

This guide provides copy-pasteable image generation prompts for all **18 official recurring characters** (`登場人物`, pp. x–xi) plus **4 MNN-specific service roles** in **Minna no Nihongo I**.

All prompts are engineered to match the exact visual style, framing, lighting, and alpha-cutout workflow of the existing **Genki I & II** character avatars under `public/images/characters/<id>/{neutral,talking}.webp`.

---

## 1. Global Style & Technical Specs

* **Target Directory**: `public/images/characters/<character-id>/neutral.webp` and `talking.webp`
* **Aspect Ratio & Resolution**: `1:1` Square (`1024×1024` raw PNG → resized/converted to `512×512` RGBA `.webp`)
* **Framing**: Centered head-and-shoulders bust portrait (cropped cleanly just below the collarbones/upper chest), facing directly forward (`front-facing portrait, looking directly at viewer`).
* **Background for Easy Alpha Cutout**: Solid pure `#FFFFFF` white background (`isolated on a solid pure #FFFFFF white background, no background scenery, no cast shadows, no vignettes, no frames`). After saving PNGs/WebPs, run `npx tsx scripts/fix-avatar-transparency.ts` to convert white backgrounds into crisp feathered RGBA transparency.
* **Workflow Tip (`neutral` → `talking`)**:
  1. Generate **`neutral.webp`** first using the character's **Neutral Prompt** below.
  2. Pass `neutral` into your image generator's **Image-to-Image / Edit / Inpaint** mode with the **Talking Edit Prompt**:
     > `Keep the exact same character face, hair, glasses, clothing, pose, lineart, and pure white background unchanged; only change the mouth from closed to a natural open speaking mouth with soft pink tongue visible, friendly animated talking expression.`

> **Master Style Prefix (built into every prompt below):**
> `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, crisp dark-brown cel-shaded lineart, soft warm skin shading with subtle cheek blush strokes, expressive eyes, centered front-facing head-and-shoulders portrait, isolated on solid pure #FFFFFF white background, no background, no text, no watermark, 1:1 square aspect ratio.`

---

## 2. Target Asset Paths Table (All 18 Core Characters + 4 Service Roles)

| # | ID (`character-id`) | Character Name | Country & Role (`登場人物`) | Target Folder |
| :- | :--- | :--- | :--- | :--- |
| 1 | `mike-miller` | マイク・ミラー (Mike Miller) | USA · IMC Employee (28) | `public/images/characters/mike-miller/` |
| 2 | `keiko-sato` | 佐藤 けい子 (Keiko Sato) | Japan · IMC Employee | `public/images/characters/keiko-sato/` |
| 3 | `ichiro-yamada` | 山田 一郎 (Ichiro Yamada) | Japan · IMC Employee (38) | `public/images/characters/ichiro-yamada/` |
| 4 | `tomoko-yamada` | 山田 友子 (Tomoko Yamada) | Japan · Bank Employee | `public/images/characters/tomoko-yamada/` |
| 5 | `jose-santos` | ジョゼ・サントス (Jose Santos) | Brazil · Brazil Air Employee (39) | `public/images/characters/jose-santos/` |
| 6 | `maria-santos` | マリア・サントス (Maria Santos) | Brazil · Homemaker | `public/images/characters/maria-santos/` |
| 7 | `karina` | カリナ (Karina) | Indonesia · Fuji Univ. Student (24) | `public/images/characters/karina/` |
| 8 | `wang-xue` | ワン・シュエ (Wang Xue) | China · Kobe Hospital Doctor (29) | `public/images/characters/wang-xue/` |
| 9 | `tadashi-matsumoto` | 松本 正 (Tadashi Matsumoto) | Japan · IMC Dept. Manager (`部長`) | `public/images/characters/tadashi-matsumoto/` |
| 10 | `yoshiko-matsumoto` | 松本 良子 (Yoshiko Matsumoto) | Japan · Homemaker | `public/images/characters/yoshiko-matsumoto/` |
| 11 | `izumi-kimura` | 木村 いずみ (Izumi Kimura) | Japan · Announcer | `public/images/characters/izumi-kimura/` |
| 12 | `john-watt` | ジョン・ワット (John Watt) | UK · Sakura Univ. Professor (45) | `public/images/characters/john-watt/` |
| 13 | `karl-schmidt` | カール・シュミット (Karl Schmidt) | Germany · Power Electric Engineer (52) | `public/images/characters/karl-schmidt/` |
| 14 | `lee-jinju` | イー・ジンジュ (Lee Jin-ju) | S. Korea · AKC Researcher (35) | `public/images/characters/lee-jinju/` |
| 15 | `teresa-santos` | テレーザ・サントス (Teresa Santos) | Brazil · Elementary Student (9) | `public/images/characters/teresa-santos/` |
| 16 | `taro-yamada` | 山田 太郎 (Taro Yamada) | Japan · Elementary Student (8) | `public/images/characters/taro-yamada/` |
| 17 | `gupta` | グプタ (Gupta) | India · IMC Employee (42) | `public/images/characters/gupta/` |
| 18 | `thawaphon` | タワポン (Thawaphon) | Thailand · Language Student (19) | `public/images/characters/thawaphon/` |
| S1 | `taxi-driver` | タクシーの運転手 (Taxi Driver) | Lesson 14 · Japanese Taxi Driver | `public/images/characters/taxi-driver/` |
| S2 | `post-office-clerk` | 郵便局員 (Post Office Clerk) | Lesson 11 · Japan Post Counter Staff | `public/images/characters/post-office-clerk/` |
| S3 | `bank-clerk` | 銀行員・案内係 (Bank Lobby Clerk) | Lesson 16 · Bank ATM Guide | `public/images/characters/bank-clerk/` |
| S4 | `real-estate-agent` | 不動産屋 (Real Estate Agent) | Lesson 22 · Housing Agent | `public/images/characters/real-estate-agent/` |

---

## 3. Master Character Prompts (18 Recurring Cast Members)

### 01. `mike-miller` — マイク・ミラー (Mike Miller, 28, USA, IMC Employee)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Mike Miller, a handsome 28-year-old American male office worker in Japan, neatly side-parted sandy-blond wavy hair, warm blue-grey eyes, fair complexion with subtle cheek blush strokes, gentle closed-mouth polite smile, wearing a crisp white dress shirt, navy striped silk tie, and a tailored charcoal-grey business suit jacket. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Same prompt/reference image, changing `gentle closed-mouth polite smile` → `cheerful open-mouth speaking expression as if introducing himself politely`.

---

### 02. `keiko-sato` — 佐藤 けい子 (Keiko Sato, Japan, IMC Employee)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Keiko Sato, a poised late-20s Japanese female corporate office colleague, glossy dark-brown chin-length bob haircut with soft side-swept bangs and inward-curled ends, warm dark brown eyes, gentle closed-mouth welcoming smile, wearing a soft cream silk office blouse under a smart navy-blue tailored blazer. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `warm open-mouth speaking smile, friendly and attentive`.

---

### 03. `ichiro-yamada` — 山田 一郎 (Ichiro Yamada, 38, Japan, IMC Employee)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Ichiro Yamada, a dependable 38-year-old Japanese male company employee, neatly parted short black hair, kind dark eyes behind thin silver-rimmed rectangular glasses, relaxed closed-mouth friendly smile, wearing a white collared dress shirt, classic burgundy-and-navy diagonal striped tie, and a medium-grey business suit jacket. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `friendly open-mouth speaking expression, helpful colleague tone`.

---

### 04. `tomoko-yamada` — 山田 友子 (Tomoko Yamada, Japan, Bank Employee)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Tomoko Yamada, a warm mid-30s Japanese woman and bank employee, dark hair neatly gathered into a tidy low bun with soft side-parted bangs, gentle eyes behind delicate oval wire-rimmed glasses, warm closed-mouth smile, wearing a light pastel-blue collared blouse under a neat navy cardigan jacket. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `warm open-mouth speaking smile, welcoming host tone`.

---

### 05. `jose-santos` — ジョゼ・サントス (Jose Santos, 39, Brazil, Brazil Air Employee)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Jose Santos, a cheerful 39-year-old Brazilian male airline office employee, thick wavy dark-brown hair, warm sun-kissed tan skin, expressive dark brown eyes and thick eyebrows, broad warm closed-mouth smile, wearing a smart olive-grey blazer over a light cream collared shirt and patterned tie. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `lively open-mouth speaking smile, warm friendly demeanor`.

---

### 06. `maria-santos` — マリア・サントス (Maria Santos, Brazil, Homemaker)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Maria Santos, an elegant mid-30s Brazilian woman, voluminous dark-brown wavy hair swept neatly back behind her shoulders, small gold hoop earrings, warm tan complexion, expressive brown eyes, graceful closed-mouth smile, wearing a stylish terracotta-rose V-neck knit sweater over a cream camisole collar. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `expressive open-mouth speaking smile, polite conversational look`.

---

### 07. `karina` — カリナ (Karina, 24, Indonesia, Fuji University Student)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Karina, a bright 24-year-old Indonesian female university student in Japan, short fluffy layered black wavy bob hair above the collar, warm light-olive Southeast Asian skin tone, bright dark brown eyes, sweet closed-mouth smile, wearing a cozy mustard-beige knit sweater over a crisp white shirt collar. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `bright open-mouth speaking smile, curious student expression`.

---

### 08. `wang-xue` — ワン・シュエ (Wang Xue, 29, China, Kobe Hospital Doctor)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Dr. Wang Xue, a calm intelligent 29-year-old Chinese male hospital physician, neat side-parted straight black hair, gentle attentive eyes behind dark-framed glasses, composed closed-mouth reassuring smile, wearing a clean white medical doctor's lab coat over a pale blue dress shirt and dark navy tie. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `calm open-mouth speaking expression, reassuring doctor demeanor`.

---

### 09. `tadashi-matsumoto` — 松本 正 (Tadashi Matsumoto, Japan, IMC Department Manager `部長`)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Tadashi Matsumoto, a dignified jovial 55-year-old Japanese corporate department manager (Bucho), receding hairline with balding forehead and neat dark-grey side hair, expressive eyebrows, gentle laugh lines, warm composed closed-mouth smile, wearing a dark navy executive suit jacket, crisp white shirt, and maroon silk tie. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `hearty open-mouth speaking expression, approachable senior manager`.

---

### 10. `yoshiko-matsumoto` — 松本 良子 (Yoshiko Matsumoto, Japan, Homemaker)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Yoshiko Matsumoto, a kind 52-year-old Japanese homemaker, short softly permed dark-brown hair, warm eyes behind rounded thin-framed glasses, gentle maternal closed-mouth smile, wearing a soft lavender-grey cardigan over a high-neck cream blouse with a subtle pearl pendant. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `gentle open-mouth speaking smile, warm hospitable expression`.

---

### 11. `izumi-kimura` — 木村 いずみ (Izumi Kimura, Japan, Announcer)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Izumi Kimura, a polished 30-year-old Japanese female TV and radio announcer, chic short cropped black pixie-bob haircut framing her ears, bright confident dark eyes, articulate poised closed-mouth smile, wearing a tailored ivory broadcaster blazer over a dusty-rose silk blouse. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `clear articulate open-mouth speaking smile, professional broadcaster delivery`.

---

### 12. `john-watt` — ジョン・ワット (John Watt, 45, UK, Sakura University Professor)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Professor John Watt, acultured 45-year-old British university professor, neatly brushed medium-brown hair with subtle silver at the temples, a tidy brown mustache, round tortoise-shell glasses, intellectual gentle closed-mouth smile, wearing a classic warm brown tweed academic blazer, oxford shirt, and forest-green knit tie. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `articulate open-mouth speaking expression, warm professor lecture tone`.

---

### 13. `karl-schmidt` — カール・シュミット (Karl Schmidt, 52, Germany, Power Electric Engineer)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Karl Schmidt, a sturdy 52-year-old German senior electrical engineer, neatly combed back silver-ash blond hair, full tidy grey-blond mustache, kind blue eyes, composed closed-mouth smile, broad shoulders, wearing a slate-blue business suit jacket, crisp white collared shirt, and silver-grey patterned tie. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `friendly open-mouth speaking expression, polite German engineer`.

---

### 14. `lee-jinju` — イー・ジンジュ (Lee Jin-ju, 35, South Korea, AKC Researcher)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Lee Jin-ju, an intelligent 35-year-old South Korean female research fellow at Asia Research Center, sleek straight shoulder-length jet-black hair parted on the side and tucked behind one ear, clear dark eyes, calm refined closed-mouth smile, wearing a smart charcoal-grey tailored blazer over a clean white Boat-neck top. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `composed open-mouth speaking expression, clear academic researcher`.

---

### 15. `teresa-santos` — テレーザ・サントス (Teresa Santos, 9, Brazil, Elementary Student)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Teresa Santos, an adorable 9-year-old Brazilian elementary school girl, long wavy chestnut-dark-brown hair with a cute headband, warm tan skin, big sparkling brown eyes, rosy cheeks, sweet cheerful closed-mouth smile, wearing a bright coral-red pinafore jumper over a white Peter Pan collar shirt. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `happy energetic open-mouth speaking smile`.

---

### 16. `taro-yamada` — 山田 太郎 (Taro Yamada, 8, Japan, Elementary Student)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Taro Yamada, an energetic 8-year-old Japanese elementary school boy, short straight black bowl-crop haircut with neat bangs, bright curious dark eyes, rosy cheeks, lively closed-mouth grin, wearing a casual blue-and-white horizontal striped crew-neck T-shirt. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `cheerful open-mouth speaking grin, lively 8-year-old boy`.

---

### 17. `gupta` — グプタ (Gupta, 42, India, IMC Employee)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Gupta, a friendly 42-year-old Indian male software company colleague at IMC, neatly side-parted thick black hair, tidy well-groomed black mustache, warm medium-brown South Asian skin tone, kind dark brown eyes, polite closed-mouth smile, wearing a navy suit jacket, light sky-blue dress shirt, and dark patterned tie. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `warm open-mouth speaking smile, polite colleague`.

---

### 18. `thawaphon` — タワポン (Thawaphon, 19, Thailand, Japanese Language Student)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Thawaphon, a friendly 19-year-old Thai male international student at a Japanese language school, youthful short black hair parted slightly at the center, warm light-tan Southeast Asian complexion, cheerful dark eyes, sincere closed-mouth smile, wearing a casual sage-green varsity cardigan over a white polo collar. Crisp cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `enthusiastic open-mouth speaking smile`.

---

## 4. Supporting MNN Service Staff Prompts (Optional Expansion)

*(Note: Generic roles like `店員 / Store Attendant`, `駅員 / Station Attendant`, `医者 / Doctor`, and `受付 / Reception` already have portraits in `public/images/characters/`. Generate these 4 if you want dedicated MNN-specific service avatars.)*

1. **`taxi-driver` (タクシーの運転手 — Lesson 14)**:
   > `Japanese anime visual novel bust-up character avatar, clean Kyoto Animation style, centered front-facing head-and-shoulders portrait of a polite 50-year-old Japanese male taxi driver, wearing a crisp navy chauffeur cap, white dress shirt, dark tie, navy uniform vest, and clean white driver's etiquette appearance, calm closed-mouth smile, isolated on solid pure #FFFFFF white background, no background, 1:1 square.`
2. **`post-office-clerk` (郵便局員 — Lesson 11)**:
   > `Japanese anime visual novel bust-up character avatar, clean Kyoto Animation style, centered front-facing head-and-shoulders portrait of a courteous late-20s Japanese male post office counter clerk, short neat black hair, wearing a dark navy postal clerk uniform blazer with subtle red collar trim and tie, friendly closed-mouth smile, isolated on solid pure #FFFFFF white background, no background, 1:1 square.`
3. **`bank-clerk` (銀行の案内係 — Lesson 16)**:
   > `Japanese anime visual novel bust-up character avatar, clean Kyoto Animation style, centered front-facing head-and-shoulders portrait of a helpful mid-20s Japanese female bank lobby clerk, neat dark hair in a half-up clip, wearing a smart navy bank uniform vest over a white blouse with a pastel blue ribbon scarf, polite closed-mouth smile, isolated on solid pure #FFFFFF white background, no background, 1:1 square.`
4. **`real-estate-agent` (不動産屋 — Lesson 22)**:
   > `Japanese anime visual novel bust-up character avatar, clean Kyoto Animation style, centered front-facing head-and-shoulders portrait of an approachable mid-30s Japanese male real estate agent, neat short dark hair, wearing a smart light-navy suit jacket, crisp white shirt, bright sky-blue tie, and a small agency lapel pin, welcoming closed-mouth smile, isolated on solid pure #FFFFFF white background, no background, 1:1 square.`
