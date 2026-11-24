# Minna no Nihongo I — Dialogue Scene Locations & Background Prompts

This guide maps all **25 lessons** (`会話` Main Dialogues + `練習C` Situational Dialogues) of **Minna no Nihongo I** to their visual locations behind the Textbook Companion dialogue player (`public/images/books/backgrounds/`).

To maximize consistency and minimize redundant generation:
* **11 existing backgrounds** from `01`–`40` (`Genki I & II`) are reused where locations match cleanly (station ticket gate, medical clinic, neighborhood cafe, restaurant, suburban home).
* **20 new MNN-specific Kansai & Workplace backgrounds (`41`–`60`)** cover the signature *Minna no Nihongo* world (IMC Software Office, Room 407/408 Apartment Genkan, Depachika Wine Counter, Hanshin Koshien Platform, Supermarket Spice Aisle, Post Office, Kyoto Gion Matsuri, Taxi Interior, Bank ATM, and Real Estate Agency).

---

## Global Style Guidelines

> **Base Style Suffix (built into every prompt below):**
> `Japanese anime visual novel background art, clean modern Slice-of-Life aesthetic, Makoto Shinkai / Kyoto Animation inspired lighting, 16:9 wide aspect ratio, no characters, no people, no text, no watermarks, soft atmospheric depth so foreground UI and dialogue bubbles remain easily readable.`

---

## Part 1: Lesson-by-Lesson Scene Directory (Lessons 1–25)

| Lesson & Title (`会話`) | Main `会話` (`scene-i`) Location | Background Asset (`public/images/books/backgrounds/`) | `練習C` Mini-Scene Reuse |
| :--- | :--- | :--- | :--- |
| **L1 — 初めまして** | IMC Office Floor (Morning Introduction) | **`41-imc-office-day.webp`** *(New)* | `41-imc-office-day` / `01-university-orientation` |
| **L2 — これからお世話になります** | Apartment 4F Hallway & Genkan (Rooms 407–408) | **`42-apartment-hallway-genkan.webp`** *(New)* | `42-apartment-hallway-genkan` / `41-imc-office-day` |
| **L3 — これをください** | Department Store Basement Wine Counter (B1F) | **`43-department-store-wine.webp`** *(New)* | `43-department-store-wine` / `12-campus-corridor` |
| **L4 — そちらは何時までですか** | IMC Desk Phone / Yamato Art Museum | **`44-art-museum-plaza.webp`** *(New)* | `41-imc-office-day` / `44-art-museum-plaza` |
| **L5 — この電車は甲子園へ行きますか** | Kansai Suburban Train Platform (To Koshien) | **`45-koshien-train-platform.webp`** *(New)* | `30-station-ticket-gate` / `45-koshien-train-platform` |
| **L6 — いっしょに行きませんか** | Cherry Blossom Park / IMC Office Invitation | **`46-osaka-castle-sakura.webp`** *(New)* | `41-imc-office-day` / `25-neighborhood-cafe` |
| **L7 — いらっしゃい** | Yamada Family Living & Dining Room (Day) | **`47-yamada-living-room-day.webp`** *(New)* | `41-imc-office-day` / `47-yamada-living-room-day` |
| **L8 — そろそろ失礼します** | Yamada Family Living Room (Afternoon Tea) | `08-host-family-evening.webp` *(Reuse)* | `25-neighborhood-cafe` / `07-downtown-street` |
| **L9 — 残念ですが** | IMC Office / Classical Concert Hall Lobby | **`48-concert-hall-lobby.webp`** *(New)* | `41-imc-office-day` / `48-concert-hall-lobby` |
| **L10 — ナンプラー、ありますか** | Japanese Supermarket Imported Spice Aisle | **`49-supermarket-spice-aisle.webp`** *(New)* | `49-supermarket-spice-aisle` / `05-campus-courtyard` |
| **L11 — これ、お願いします** | Japan Post Office Counter (Airmail / Sea Mail) | **`50-japan-post-office.webp`** *(New)* | `50-japan-post-office` / `04-tonkatsu-restaurant` |
| **L12 — 祇園祭はどうでしたか** | Kyoto Gion Festival Street with Lantern Floats | **`51-kyoto-gion-matsuri.webp`** *(New)* | `51-kyoto-gion-matsuri` / `41-imc-office-day` |
| **L13 — 別々にお願いします** | Daytime Teishoku Lunch Restaurant & Cashier | **`52-teishoku-lunch-cashier.webp`** *(New)* | `04-tonkatsu-restaurant` / `25-neighborhood-cafe` |
| **L14 — みどり町までお願いします** | Japanese Taxi Interior (Passenger View) | **`53-japanese-taxi-interior.webp`** *(New)* | `53-japanese-taxi-interior` / `41-imc-office-day` |
| **L15 — ご家族は？** | IMC Office Breakroom / Lounge | **`54-office-breakroom-lounge.webp`** *(New)* | `54-office-breakroom-lounge` / `44-art-museum-plaza` |
| **L16 — 使い方を教えてください** | Modern Japanese Bank ATM Corner | **`55-japanese-bank-atm.webp`** *(New)* | `55-japanese-bank-atm` / `30-station-ticket-gate` |
| **L17 — どうしましたか** | Kobe Hospital Examination Room | `21-hospital-clinic-room.webp` *(Reuse)* | `21-hospital-clinic-room` / `41-imc-office-day` |
| **L18 — 趣味は何ですか** | IMC Office Breakroom / Equestrian Park Talk | `54-office-breakroom-lounge.webp` *(Reuse)* | `54-office-breakroom-lounge` / `20-student-lounge` |
| **L19 — ダイエットはあしたからします** | Hotel / Company Buffet Party Hall | **`56-company-buffet-party.webp`** *(New)* | `56-company-buffet-party` / `33-upscale-restaurant` |
| **L20 — いっしょに行かない？** | Summer Fireworks Riverside / Casual Colleagues | **`57-summer-hanabi-riverside.webp`** *(New)* | `54-office-breakroom-lounge` / `57-summer-hanabi-riverside` |
| **L21 — わたしもそう思います** | Matsumoto Living Room / Evening TV Sports | `34-suburban-house-night.webp` *(Reuse)* | `41-imc-office-day` / `25-neighborhood-cafe` |
| **L22 — どんな部屋をお探しですか** | Japanese Real Estate Agency (`不動産屋`) | **`58-real-estate-office.webp`** *(New)* | `58-real-estate-office` / `41-imc-office-day` |
| **L23 — どうやって行きますか** | Municipal Public Library Counter | **`59-public-library-counter.webp`** *(New)* | `59-public-library-counter` / `07-downtown-street` |
| **L24 — 手伝いに行きましょうか** | Apartment Moving Preparation (Boxes & Room) | **`60-apartment-moving-day.webp`** *(New)* | `60-apartment-moving-day` / `41-imc-office-day` |
| **L25 — いろいろお世話になりました** | IMC Office / Shinkansen Transfer Farewell | `39-airport-express-dusk.webp` / `41-imc-office-day` | `41-imc-office-day` / `30-station-ticket-gate` |

---

## Part 2: Master Prompts for the 20 New MNN 1 Backgrounds (`41`–`60`)

### 41. `41-imc-office-day.webp` (Lessons 1, 4, 6, 9, 18, 21, 25 — IMC Software Office)
> **Prompt:**
> `Japanese anime visual novel background art of a bright, tidy modern Japanese corporate office floor at a computer software company (IMC) in morning sunlight. Neat rows of light-grey desks with computer monitors, binders on metal filing cabinets along the back wall, large windows with venetian blinds overlooking a sunny Osaka/Kobe city skyline, indoor potted green plants, clean welcoming workplace atmosphere. Makoto Shinkai / Kyoto Animation inspired lighting, wide 16:9 composition, no people, no characters, no text.`

---

### 42. `42-apartment-hallway-genkan.webp` (Lesson 2 — `これからお世話になります`)
> **Prompt:**
> `Japanese anime visual novel background art of a clean, sunlit 4th-floor exterior/semi-indoor corridor and entrance doorway (genkan) of a modern Japanese residential mansion apartment building. Neat cream concrete walls, dark metal apartment front doors with doorbells and small number plates, warm afternoon light streaming from the open balcony side, tidy welcoming neighborhood atmosphere. Kyoto Animation slice-of-life background style, wide 16:9 composition, no people, no characters, no text.`

---

### 43. `43-department-store-wine.webp` (Lesson 3 — `これをください`)
> **Prompt:**
> `Japanese anime visual novel background art of an upscale Japanese department store basement gourmet and wine section (depachika). Warm polished wood shelving and glass display counters neatly lined with imported red and white wine bottles from Japan, France, and Italy, warm recessed spotlighting, clean marble tile floor, elegant information counter visible in soft background depth. Kyoto Animation inspired lighting, wide 16:9 composition, no people, no characters, no text.`

---

### 44. `44-art-museum-plaza.webp` (Lesson 4 — `そちらは何時までですか`)
> **Prompt:**
> `Japanese anime visual novel background art of a serene modern municipal art museum entrance plaza in Japan during clear morning light. Sleek architectural stone and glass facade, manicured trees, a decorative outdoor sculpture, paved courtyard leading to glass entrance doors, crisp blue sky with light clouds. Makoto Shinkai / Kyoto Animation style, wide 16:9 composition, no people, no characters, no text.`

---

### 45. `45-koshien-train-platform.webp` (Lesson 5 — `この電車は甲子園へ行きますか`)
> **Prompt:**
> `Japanese anime visual novel background art of a sunny above-ground suburban commuter train station platform in Kansai (Osaka-Kobe line). Clean platform pavement with yellow tactile safety blocks, overhead station canopy casting crisp geometric shadows, electronic departure board without legible text, railway tracks receding into a bright blue daytime sky with distant city buildings. Makoto Shinkai inspired lighting, wide 16:9 composition, no people, no characters, no text.`

---

### 46. `46-osaka-castle-sakura.webp` (Lesson 6 — `いっしょに行きませんか`)
> **Prompt:**
> `Japanese anime visual novel background art of a breathtaking spring cherry blossom (hanami) park walkway in Kansai, with traditional stone castle moat walls and lush pink sakura trees in full bloom arching overhead. Gentle pink petals drifting across a sunlit stone path, blue picnic tarps in the distant background under the trees, vibrant blue spring sky. Makoto Shinkai / Kyoto Animation aesthetic, wide 16:9 composition, no people, no characters, no text.`

---

### 47. `47-yamada-living-room-day.webp` (Lesson 7 — `いらっしゃい`)
> **Prompt:**
> `Japanese anime visual novel background art of a bright, tidy contemporary Japanese apartment living and dining room welcoming a guest in late morning. Warm light-oak flooring, comfortable sofa with cushions, low wooden coffee table set with Japanese green tea cups and a small plate of sweets, sheer white balcony curtains glowing with soft sunlight, neat bookshelves. Kyoto Animation slice-of-life style, wide 16:9 composition, no people, no characters, no text.`

---

### 48. `48-concert-hall-lobby.webp` (Lesson 9 — `残念ですが`)
> **Prompt:**
> `Japanese anime visual novel background art of an elegant modern Japanese symphony concert hall foyer in warm evening light. High glass atrium windows showing deep twilight blue outside, warm oak acoustic wall paneling, plush red carpet stairs, glowing chandelier pendants, framed abstract music concert posters without text. Kyoto Animation inspired lighting, wide 16:9 composition, no people, no characters, no text.`

---

### 49. `49-supermarket-spice-aisle.webp` (Lesson 10 — `ナンプラー、ありますか`)
> **Prompt:**
> `Japanese anime visual novel background art of a clean, brightly lit Japanese neighborhood supermarket interior looking down the condiments, sauces, and imported Asian ingredients aisle. Neat shelves stocked with colorful bottles of soy sauce, cooking oils, spices, curry boxes, and imported sauces, shiny linoleum floor reflecting warm-white store lights, fresh produce corner softly visible at the end of the aisle. Slice-of-life anime style, wide 16:9 composition, no people, no characters, no text.`

---

### 50. `50-japan-post-office.webp` (Lesson 11 — `これ、お願いします`)
> **Prompt:**
> `Japanese anime visual novel background art of a friendly neighborhood Japanese post office interior during daytime. Clean service counter with a digital parcel weighing scale, neat racks of envelopes and cardboard shipping boxes, subtle red-and-white postal color accents, potted plant by the glass entrance door letting in warm daylight. Kyoto Animation slice-of-life style, wide 16:9 composition, no people, no characters, no text.`

---

### 51. `51-kyoto-gion-matsuri.webp` (Lesson 12 — `祇園祭はどうでしたか`)
> **Prompt:**
> `Japanese anime visual novel background art of a magical summer evening street in Kyoto during the Gion Matsuri festival. Towering traditional wooden Yamaboko festival floats adorned with glowing rows of warm paper komagata lanterns and rich tapestries, warm golden lantern light reflecting against twilight indigo summer sky, traditional machiya wooden storefronts along the street. Makoto Shinkai / Kyoto Animation lighting, wide 16:9 composition, no people, no characters, no text.`

---

### 52. `52-teishoku-lunch-cashier.webp` (Lesson 13 — `別々にお願いします`)
> **Prompt:**
> `Japanese anime visual novel background art of a cozy Japanese office-district lunch restaurant interior near the wooden cashier counter at midday. Warm cedar wood paneling, neat dining tables in the background, traditional noren curtain, small wooden register counter with a tray for bills and toothpicks, bright inviting daytime light through lattice windows. Slice-of-life anime style, wide 16:9 composition, no people, no characters, no text.`

---

### 53. `53-japanese-taxi-interior.webp` (Lesson 14 — `みどり町までお願いします`)
> **Prompt:**
> `Japanese anime visual novel background art seen from the back passenger seat of a classic clean Japanese city taxi looking forward toward a sunlit urban intersection with a traffic light and tree-lined avenue ahead. Neat white lace headrest covers on the front seats, dashboard meter glowing softly, clean windshield framing a bright Japanese neighborhood street corner for turning right. Kyoto Animation style, wide 16:9 composition, no driver, no people, no text.`

---

### 54. `54-office-breakroom-lounge.webp` (Lessons 15, 18, 20 — `ご家族は？` / `趣味は何ですか`)
> **Prompt:**
> `Japanese anime visual novel background art of a sunny, relaxing corporate office breakroom and coffee lounge. Round cafe-style tables with modern chairs, a counter with an espresso machine and beverage vending machine, large window overlooking green trees and city buildings in warm afternoon sun, relaxed conversational atmosphere. Kyoto Animation slice-of-life style, wide 16:9 composition, no people, no characters, no text.`

---

### 55. `55-japanese-bank-atm.webp` (Lesson 16 — `使い方を教えてください`)
> **Prompt:**
> `Japanese anime visual novel background art of a clean, modern Japanese bank ATM lobby corner during daytime. Row of sleek blue-and-white touchscreen ATM terminals separated by privacy partitions, small writing stand with envelopes, bright glass entrance doors showing a sunny city sidewalk outside, clean reassuring atmosphere. Modern anime background art, wide 16:9 composition, no people, no characters, no text.`

---

### 56. `56-company-buffet-party.webp` (Lesson 19 — `ダイエットはあしたからします`)
> **Prompt:**
> `Japanese anime visual novel background art of a cheerful hotel banquet room set up for an international exchange or company buffet party. Long white-clothed buffet tables arranged with platters of sushi, hors d'oeuvres, salads, fruit, and desserts, warm golden chandelier lighting, tall draped windows at evening, festive yet refined atmosphere. Kyoto Animation style, wide 16:9 composition, no people, no characters, no text.`

---

### 57. `57-summer-hanabi-riverside.webp` (Lesson 20 — `いっしょに行かない？`)
> **Prompt:**
> `Japanese anime visual novel background art of a scenic Japanese riverside embankment at summer dusk during a fireworks festival. Colorful bursts of golden and magenta hanabi fireworks blooming in the deep purple-blue evening sky, shimmering reflections across the wide river water, warm festival paper lanterns glowing along the grassy riverbank path. Makoto Shinkai inspired lighting, wide 16:9 composition, no people, no characters, no text.`

---

### 58. `58-real-estate-office.webp` (Lesson 22 — `どんな部屋をお探しですか`)
> **Prompt:**
> `Japanese anime visual novel background art of a bright, welcoming Japanese neighborhood real estate agency (fudosanya) interior. Consultation desk with chairs and a neat tablet/catalog binder, glass storefront window lined with colorful apartment floor-plan listing cards (madori diagrams without legible text), small potted plant, sunny residential shopping street visible outside. Slice-of-life anime style, wide 16:9 composition, no people, no characters, no text.`

---

### 59. `59-public-library-counter.webp` (Lesson 23 — `どうやって行きますか`)
> **Prompt:**
> `Japanese anime visual novel background art of a sunlit modern Japanese municipal public library interior near the main circulation and information counter. Warm natural wood reception desk with a barcode scanner, tall organized wooden bookshelves stretching into the background, sunlit reading tables by large windows overlooking park greenery, quiet peaceful atmosphere. Kyoto Animation style, wide 16:9 composition, no people, no characters, no text.`

---

### 60. `60-apartment-moving-day.webp` (Lessons 24 & 25 — `手伝いに行きましょうか` / `いろいろお世話になりました`)
> **Prompt:**
> `Japanese anime visual novel background art of a bright Japanese apartment room on moving day. Polished light-wood floor with neatly stacked taped cardboard moving boxes, bubble-wrapped items, a rolled rug leaning near the closet, open balcony window letting in crisp morning sunlight and a gentle breeze, bittersweet hopeful farewell and new-beginning mood. Makoto Shinkai / Kyoto Animation style, wide 16:9 composition, no people, no characters, no text.`
