#!/usr/bin/env python3
"""
Downloads distinct AIVMX voice models from AivisHub into local Models directory.
"""
import os
import sys
import time
import urllib.request

MODELS_DIR = "/home/vinayak/.local/share/AivisSpeech-Engine/Models"
os.makedirs(MODELS_DIR, exist_ok=True)

TARGETS = [
    {
        "name": "阿井田 茂 (Aida Shigeru - Adult Male)",
        "uuid": "47e53151-a378-46f3-abee-ce13aa07feb1",
        "role": "Prof. Yamashita, Department Manager, Fathers, Doctors",
    },
    {
        "name": "morioki (Young Adult Male)",
        "uuid": "baaae3c0-7b22-4605-8ba5-80c959b41a48",
        "role": "Takeshi, Robert, Ken, John",
    },
    {
        "name": "まい (Mai - Bright Young Female)",
        "uuid": "e9339137-2ae3-4d41-9394-fb757a7e61e6",
        "role": "Mary, Michiko",
    },
]

def download_model(model):
    uuid = model["uuid"]
    dest = os.path.join(MODELS_DIR, f"{uuid}.aivmx")
    if os.path.exists(dest) and os.path.getsize(dest) > 100 * 1024 * 1024:
        print(f"[EXISTS] {model['name']} ({os.path.getsize(dest) / 1024 / 1024:.1f} MB)")
        return

    url = f"https://api.aivis-project.com/v1/aivm-models/{uuid}/download?model_type=AIVMX"
    print(f"\n[DOWNLOADING] {model['name']} -> {dest}...")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})

    temp_dest = dest + ".tmp"
    with urllib.request.urlopen(req) as resp, open(temp_dest, "wb") as f:
        total_len = int(resp.headers.get("Content-Length", 0))
        downloaded = 0
        chunk_size = 1024 * 1024  # 1MB chunks
        start_t = time.time()

        while True:
            chunk = resp.read(chunk_size)
            if not chunk:
                break
            f.write(chunk)
            downloaded += len(chunk)
            pct = (downloaded / total_len * 100) if total_len else 0
            speed = (downloaded / (time.time() - start_t) / 1024 / 1024) if (time.time() - start_t) > 0 else 0
            sys.stdout.write(f"\r  {downloaded / 1024 / 1024:.1f} / {total_len / 1024 / 1024:.1f} MB ({pct:.1f}%) @ {speed:.2f} MB/s")
            sys.stdout.flush()

    os.rename(temp_dest, dest)
    os.chmod(dest, 0o666)
    print(f"\n[DONE] Saved {model['name']} successfully.")

def main():
    print("=" * 65)
    print("  Downloading Distinct AIVMX Voice Models for Character Cast  ")
    print("=" * 65)
    for m in TARGETS:
        download_model(m)
    print("\nAll models ready in:", MODELS_DIR)

if __name__ == "__main__":
    main()
