#!/usr/bin/env python3
"""
Process supporting character avatars and dialogue backgrounds from src/data/tmp.
1. Backgrounds (20 PNGs): Resize to 1280x720 RGB WebP -> public/images/books/backgrounds/<slug>.webp
2. Characters (11 PNGs): Remove solid white bg using rembg -> 512x512 RGBA WebP
   Save as BOTH neutral.webp and talking.webp in public/images/characters/<slug>/
3. Verify all files on disk and remove src/data/tmp.
"""

import os
import shutil
import sys
import time
from PIL import Image
import rembg

TMP_DIR = "src/data/tmp"
TMP_CHAR_DIR = "src/data/tmp/characters"
PUBLIC_CHAR_DIR = "public/images/characters"
PUBLIC_BG_DIR = "public/images/books/backgrounds"

def process_backgrounds():
    print("\n--- 1. Processing Dialogue Backgrounds ---")
    os.makedirs(PUBLIC_BG_DIR, exist_ok=True)
    bg_files = [f for f in sorted(os.listdir(TMP_DIR)) if f.endswith(".png")]
    print(f"Found {len(bg_files)} background images.")

    for idx, fname in enumerate(bg_files, 1):
        slug = fname.replace(".png", "")
        in_path = os.path.join(TMP_DIR, fname)
        out_path = os.path.join(PUBLIC_BG_DIR, f"{slug}.webp")

        t0 = time.time()
        with Image.open(in_path) as im:
            rgb_im = im.convert("RGB")
            resized = rgb_im.resize((1280, 720), Image.Resampling.LANCZOS)
            resized.save(out_path, format="WEBP", quality=88, method=6)

        sz_kb = os.path.getsize(out_path) // 1024
        print(f"[{idx}/{len(bg_files)}] Background: {slug}.webp ({sz_kb} KB) in {time.time()-t0:.2f}s")

    # Verify backgrounds
    for fname in bg_files:
        slug = fname.replace(".png", "")
        out_path = os.path.join(PUBLIC_BG_DIR, f"{slug}.webp")
        if not os.path.exists(out_path) or os.path.getsize(out_path) < 10000:
            raise RuntimeError(f"Background verification failed: {out_path}")
    print(f"✓ All {len(bg_files)} backgrounds verified in {PUBLIC_BG_DIR}/")

def process_characters():
    print("\n--- 2. Processing Supporting Character Avatars (rembg) ---")
    if not os.path.exists(TMP_CHAR_DIR):
        print(f"[ERROR] Characters dir not found: {TMP_CHAR_DIR}")
        sys.exit(1)

    char_files = [f for f in sorted(os.listdir(TMP_CHAR_DIR)) if f.endswith(".png")]
    print(f"Found {len(char_files)} character avatar images.")

    session = rembg.new_session("u2net")

    for idx, fname in enumerate(char_files, 1):
        slug = fname.replace(".png", "")
        in_path = os.path.join(TMP_CHAR_DIR, fname)
        out_dir = os.path.join(PUBLIC_CHAR_DIR, slug)
        os.makedirs(out_dir, exist_ok=True)

        t0 = time.time()
        with Image.open(in_path) as im:
            # 1. Remove solid/false white background
            no_bg = rembg.remove(im, session=session)
            # 2. Resize to 512x512
            resized = no_bg.resize((512, 512), Image.Resampling.LANCZOS)
            # 3. Save as both neutral.webp and talking.webp
            neutral_path = os.path.join(out_dir, "neutral.webp")
            talking_path = os.path.join(out_dir, "talking.webp")
            resized.save(neutral_path, format="WEBP", quality=92, method=6)
            resized.save(talking_path, format="WEBP", quality=92, method=6)

        sz_n = os.path.getsize(neutral_path) // 1024
        print(f"[{idx}/{len(char_files)}] Character: {slug} (neutral/talking: {sz_n} KB) in {time.time()-t0:.2f}s")

    # Verify characters
    for fname in char_files:
        slug = fname.replace(".png", "")
        for state in ["neutral", "talking"]:
            expected = os.path.join(PUBLIC_CHAR_DIR, slug, f"{state}.webp")
            if not os.path.exists(expected) or os.path.getsize(expected) < 1000:
                raise RuntimeError(f"Character verification failed: {expected}")
    print(f"✓ All {len(char_files)} characters (22 WebP files) verified in {PUBLIC_CHAR_DIR}/")

def main():
    t_start = time.time()
    process_backgrounds()
    process_characters()

    print("\n--- 3. Cleaning up temporary directory ---")
    shutil.rmtree(TMP_DIR)
    print(f"✓ Successfully deleted {TMP_DIR}")
    print(f"\nAll operations completed successfully in {time.time()-t_start:.1f}s.")

if __name__ == "__main__":
    main()
