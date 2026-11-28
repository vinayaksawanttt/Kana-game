# Minna no Nihongo III — Character Avatar Generation Prompts (`登場人物` + Side Roles)

This guide provides copy-pasteable image generation prompts for all **6 new recurring characters** (`登場人物`, MNN III) plus **1 optional supporting role** (`supermarket-clerk`).

All **19 returning cast members** and **5 shared side roles** (`caretaker`, `store-attendant`, `passing-stranger`, `receptionist`, `akiko-nakamura`) already exist under `public/images/characters/<id>/` and are reused directly.

---

## 1. Global Style & Technical Specs

* **Target Directory**: `public/images/characters/<character-id>/neutral.webp` and `talking.webp`
* **Aspect Ratio & Resolution**: `1:1` Square (`1024×1024` raw PNG → resized/converted to `512×512` RGBA `.webp` via `scripts/process-mnn-avatars.py`)
* **Framing**: Centered head-and-shoulders bust portrait, looking directly at viewer.
* **Background**: Solid pure `#FFFFFF` white background (`isolated on solid pure #FFFFFF white background, no background, no text, no watermark, 1:1 square aspect ratio`).
* **Talking Edit Prompt** *(for image-to-image from `neutral`)*:
  > `Keep the exact same character face, hair, glasses, clothing, pose, lineart, and pure white background unchanged; only change the mouth from closed to a natural open speaking mouth with soft pink tongue visible, friendly animated talking expression.`

---

## 2. Target Asset Paths Table (6 New Cast + 1 Optional Side Role)

| # | ID (`character-id`) | Character Name | Role & Context in MNN III | Target Folder |
| :- | :--- | :--- | :--- | :--- |
| 1 | `prof-mori` | 森 (Prof. Mori) | Japan · Sakura Univ. Professor (L3) | `public/images/characters/prof-mori/` |
| 2 | `hirota` | 広田 (Hirota) | Japan · Sakura Univ. Student (L7) | `public/images/characters/hirota/` |
| 3 | `sano` | 佐野 (Sano) | Japan · Homemaker (L1, L11) | `public/images/characters/sano/` |
| 4 | `nomura` | 野村 (Nomura) | Japan · Homemaker / Downstairs Neighbor (L12) | `public/images/characters/nomura/` |
| 5 | `ikeda` | 池田 (Ikeda) | Japan · Brazil Air Employee (L5) | `public/images/characters/ikeda/` |
| 6 | `linlin` | リンリン (Linlin) | China · Wang Xue's 6-year-old Niece (L8) | `public/images/characters/linlin/` |
| S1 | `supermarket-clerk` | 係員 (Supermarket Clerk) | Lesson 8 · Supermarket Service Counter (Optional) | `public/images/characters/supermarket-clerk/` |

---

## 3. Master Character Prompts (6 New Recurring Cast Members)

### 01. `prof-mori` — 森 (Prof. Mori, Japan, Sakura University Professor)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Prof. Mori, a dignified early-50s Japanese male university professor, neatly parted dark salt-and-pepper hair, calm intelligent dark eyes behind classic thin oval metal-frame glasses, composed gentle closed-mouth smile, wearing a crisp white dress shirt, muted burgundy-navy patterned tie, and a tailored charcoal-brown tweed suit jacket. Crisp dark-brown cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Same prompt/reference image, changing `composed gentle closed-mouth smile` → `calm open-mouth speaking expression as if advising a graduate student`.

---

### 02. `hirota` — 広田 (Hirota, Japan, Sakura University Student)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Hirota, a friendly 21-year-old Japanese male university student, short natural black hair with light textured bangs, bright expressive dark brown eyes, relaxed closed-mouth smile, wearing a neat casual sky-blue button-down Oxford shirt over a white crew-neck tee. Crisp dark-brown cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `cheerful open-mouth speaking smile, friendly campus classmate tone`.

---

### 03. `sano` — 佐野 (Sano, Japan, Homemaker)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Ms. Sano, a gracious late-50s to early-60s Japanese woman, soft short lightly waved silver-gray hair neatly styled, kind warm dark eyes, gentle welcoming closed-mouth smile, wearing a soft sage-green knit cardigan over a cream collared blouse. Crisp dark-brown cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `warm open-mouth speaking smile, hospitable neighborly tone`.

---

### 04. `nomura` — 野村 (Nomura, Japan, Homemaker / Miller's Neighbor)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Ms. Nomura, a polite early-30s Japanese mother and homemaker, shoulder-length dark brown hair neatly tied back in a low ponytail with soft side bangs, gentle sincere dark eyes, calm polite closed-mouth smile, wearing a cozy pastel beige knit sweater over a light collared shirt. Crisp dark-brown cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `polite open-mouth speaking expression, calm neighborhood conversation tone`.

---

### 05. `ikeda` — 池田 (Ikeda, Japan, Brazil Air Employee)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Ikeda, a helpful early-30s Japanese male office worker at Brazil Air, neatly side-parted short dark brown hair, attentive friendly dark eyes, approachable closed-mouth smile, wearing a crisp white dress shirt, teal-blue striped tie, and a dark navy business jacket. Crisp dark-brown cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `friendly open-mouth speaking smile as if explaining subway directions to a coworker`.

---

### 06. `linlin` — リンリン (Linlin, China, Wang Xue's 6-year-old Niece)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of Linlin, an adorable 6-year-old Chinese girl, glossy straight black short bob haircut with neat forehead bangs and a small red hair clip on one side, big bright innocent dark eyes, sweet cheerful closed-mouth smile, wearing a cozy warm-coral knit sweater over a white Peter Pan collar shirt. Crisp dark-brown cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `bright innocent open-mouth speaking smile, cheerful young child tone`.

---

## 4. Optional Supporting Role (`supermarket-clerk`)

### S1. `supermarket-clerk` — 係員 (Supermarket Service Counter Clerk, Lesson 8)
* **`neutral.webp` Prompt**:
  > `Japanese anime visual novel bust-up character avatar, clean modern slice-of-life anime style inspired by Kyoto Animation, centered front-facing head-and-shoulders portrait of a polite late-20s Japanese female supermarket service counter clerk, neat dark brown hair pinned cleanly in a tidy bun, attentive reassuring dark eyes, courteous closed-mouth smile, wearing a crisp white collared shirt, neat navy service vest with a small name badge, and a light blue neck scarf. Crisp dark-brown cel-shaded lineart, isolated on solid pure #FFFFFF white background, no background, no text, 1:1 square.`
* **`talking.webp` Prompt**: Change expression to `reassuring polite open-mouth speaking expression, customer service tone`.
