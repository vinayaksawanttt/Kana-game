#!/usr/bin/env python3
"""
MNN 1 Character Avatar Processor:
1. Removes false/solid white background using rembg (u2net model).
2. Resizes to 512x512 with high-quality Lanczos resampling.
3. Saves as optimized WEBP with alpha channel in public/images/characters/<slug>/<state>.webp.
4. Verifies all 44 assets and cleans up src/data/tmp/.
"""

import os
import re
import shutil
import sys
import time
from PIL import Image
import rembg

TMP_DIR = "src/data/tmp"
PUBLIC_CHAR_DIR = "public/images/characters"

def main():
    if not os.path.exists(TMP_DIR):
        print(f"[ERROR] Directory not found: {TMP_DIR}")
        sys.exit(1)

    files = [f for f in sorted(os.listdir(TMP_DIR)) if f.endswith(".png")]
    print(f"Found {len(files)} PNG images in {TMP_DIR} to process.")

    session = rembg.new_session("u2net")
    processed = 0
    t0 = time.time()

    for idx, fname in enumerate(files, 1):
        # Match pattern: <slug>-(neutral|talking).png
        m = re.match(r"^(.+)-(neutral|talking)\.png$", fname)
        if not m:
            print(f"[SKIP] Filename format doesn't match: {fname}")
            continue

        slug, state = m.groups()
        in_path = os.path.join(TMP_DIR, fname)
        out_dir = os.path.join(PUBLIC_CHAR_DIR, slug)
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, f"{state}.webp")

        t_img = time.time()
        with Image.open(in_path) as im:
            # Remove background
            no_bg = rembg.remove(im, session=session)
            # Resize to standardized 512x512
            resized = no_bg.resize((512, 512), Image.Resampling.LANCZOS)
            # Save as webp with alpha transparency
            resized.save(out_path, format="WEBP", quality=92, method=6)

        sz = os.path.getsize(out_path)
        print(f"[{idx}/{len(files)}] {slug}/{state}.webp ({sz // 1024} KB) in {time.time()-t_img:.2f}s")
        processed += 1

    print("\n" + "=" * 60)
    print(f"Successfully processed {processed}/{len(files)} avatars in {time.time()-t0:.1f}s.")
    print(f"Saved into {PUBLIC_CHAR_DIR}/<character-slug>/")
    print("=" * 60)

    # Verify all files
    verified = True
    for fname in files:
        m = re.match(r"^(.+)-(neutral|talking)\.png$", fname)
        if m:
            slug, state = m.groups()
            expected = os.path.join(PUBLIC_CHAR_DIR, slug, f"{state}.webp")
            if not os.path.exists(expected) or os.path.getsize(expected) < 1000:
                print(f"[FAIL] Missing or invalid: {expected}")
                verified = False

    if verified:
        print(f"\nAll {processed} webp files verified! Cleaning up {TMP_DIR}...")
        shutil.rmtree(TMP_DIR)
        print(f"Deleted {TMP_DIR} successfully.")
    else:
        print(f"[WARN] Some files failed verification. Kept {TMP_DIR} for safety.")

if __name__ == "__main__":
    main()
