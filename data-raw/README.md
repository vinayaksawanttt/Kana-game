# Raw Datasets (`data-raw/`)

This directory holds raw, build-time source datasets used exclusively by `scripts/` to generate runtime partitions in `public/data/v1/` and generated manifests in `src/data/`. Nothing in `data-raw/` is imported or bundled by the Next.js runtime.

| Path | Source | License | Added / Updated |
| :--- | :--- | :--- | :--- |
| `deepl-cache.json` | Local DeepL translation/enrichment cache | Project-internal | 2026-11-09 |
| `kanji_jlpt_only.json` | KANJIDIC2 / JLPT curated kanji dataset | CC BY-SA (EDRDG) | 2026-10-30 |
| `kanji/meaning-overrides.json` | Curated English meaning overrides for kanji | Project-owned | 2026-11-01 |
| `kanji/radicals/` | Radical decomposition & wiki metadata (`radical-decode(d).json`, `radical-wiki.json`) | CC BY-SA / Open Source | 2026-11-01 |
| `grammar/` | JLPT N5–N1 grammar rules (`grammar_ja_*.json`) and example sentence corpora (`sentences_output_*.json`) | Community / Project-enriched | 2026-11-16 |
| `openjlpt/` | [OpenJLPT](https://github.com/evanclan/OpenJLPT) (`0d1d3410bec90bd4098a7c72de820543cb4f707c`) vocab & kanji lists (`LICENSE`, `NOTICE.md`) | CC BY-SA 4.0 | 2026-10-29 |
