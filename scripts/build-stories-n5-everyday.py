#!/usr/bin/env python3
"""
Generates warm, gentle Japanese storybook narration for all 10 JLPT N5 "Everyday Life" stories
using Aivis Cloud API with model 金苗 (かなえ) in the 'ほのぼの' (heartwarming) style.

Target directory: public/audio/stories/<slug>/<index>.opus
"""

import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

API_BASE = "https://api.aivis-project.com/v1"
KANAE_UUID = "1a322ad9-6b7e-4a6d-8d0b-c4cd264538dc"
STYLE_NAME = "ほのぼの"
SPEED_SCALE = 0.95

def load_api_key():
    for f in [".env.local", ".env"]:
        if os.path.exists(f):
            for line in open(f, encoding="utf-8"):
                if line.startswith("AIVIS_API_KEY="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None

API_KEY = load_api_key()
if not API_KEY:
    print("[ERROR] AIVIS_API_KEY not found in .env.local")
    sys.exit(1)

def extract_n5_everyday_queue():
    cmd = [
        "npx",
        "tsx",
        "-e",
        """
import { getAllStories } from './src/data/stories';
import { buildStoryAudioQueue } from './src/engine/audio';

const stories = getAllStories().filter(s => s.level === 'N5' && s.category === 'Everyday Life');
const result = stories.map(s => {
  const queue = buildStoryAudioQueue(s);
  return {
    id: s.id,
    slug: s.slug,
    title: s.title,
    titleEn: s.titleEn,
    sentences: queue.map(q => ({
      index: q.index,
      rawJa: q.rawJa,
      ttsText: q.ttsText,
      src: q.src
    }))
  };
});
process.stdout.write(JSON.stringify(result));
        """,
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return json.loads(res.stdout)

def synthesize_sentence(text, out_path):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    payload = {
        "model_uuid": KANAE_UUID,
        "text": text,
        "style_name": STYLE_NAME,
        "output_format": "opus",
        "output_sampling_rate": 48000,
        "speed_scale": SPEED_SCALE,
    }

    req = urllib.request.Request(
        f"{API_BASE}/tts/synthesize",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "KanaGame/1.0",
        },
        method="POST",
    )

    for attempt in range(1, 4):
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                opus_bytes = resp.read()
                if len(opus_bytes) > 500:
                    with open(out_path, "wb") as f:
                        f.write(opus_bytes)
                    return True, len(opus_bytes)
        except Exception as e:
            if attempt == 3:
                print(f"    [FAIL] {e}")
            time.sleep(1.2)
    return False, 0

def main():
    print("=" * 65)
    print("  N5 'Everyday Life' Stories Audio Generator (金苗 - ほのぼの)  ")
    print("=" * 65)
    print(f"Model: 金苗(かなえ) ({KANAE_UUID}) | Style: {STYLE_NAME} | Speed: {SPEED_SCALE}x")

    print("[*] Extracting N5 Everyday Life story sentences via engine...")
    stories = extract_n5_everyday_queue()
    total_sentences = sum(len(s["sentences"]) for s in stories)
    print(f"[OK] Found {len(stories)} stories with {total_sentences} total sentences.\n")

    start_time = time.time()
    processed_count = 0

    for s_idx, story in enumerate(stories, 1):
        slug = story["slug"]
        title = story["title"]
        sentences = story["sentences"]

        print(f"\n[{s_idx}/{len(stories)}] Story: {title} ({slug}) — {len(sentences)} sentences")
        story_dir = os.path.join("public", "audio", "stories", slug)
        os.makedirs(story_dir, exist_ok=True)

        for sentence in sentences:
            idx = sentence["index"]
            tts_text = sentence["ttsText"]
            out_file = os.path.join(story_dir, f"{idx}.opus")

            snippet = tts_text[:28] + ("..." if len(tts_text) > 28 else "")
            sys.stdout.write(f"  Sentence {idx + 1}/{len(sentences)}: {snippet} ... ")
            sys.stdout.flush()

            ok, size = synthesize_sentence(tts_text, out_file)
            if ok:
                processed_count += 1
                print(f"OK ({size // 1024} KB)")
            else:
                print("FAILED")
            time.sleep(0.35)

    elapsed = time.time() - start_time
    print("\n" + "=" * 65)
    print(f"Done! Successfully synthesized {processed_count}/{total_sentences} sentences in {elapsed:.1f}s.")
    print("Audio saved to public/audio/stories/<slug>/<index>.opus")
    print("=" * 65)

if __name__ == "__main__":
    main()
