#!/usr/bin/env python3
"""
Standalone Genki Dialogue Audio Generator using AivisSpeech Engine (Local Podman)
and Gemini Context/Emotion Analysis (Standard Text API).

Usage:
  1. In Konsole, ensure AivisSpeech is running:
       podman start aivisspeech
  2. Run this script:
       python3 scripts/generate-dialogues.py
  3. When finished, free system RAM:
       podman stop aivisspeech

Can be interrupted with Ctrl+C and resumed at any time.
"""

import json
import os
import signal
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

AIVIS_URL = "http://127.0.0.1:10101"
PROG_FILE = "docs/gemini-dialogues-progress.json"

# AivisSpeech Voice Style Registry
AIVIS_STYLES = {
    "mao": {
        "normal": 888753760,
        "casual": 888753761,
        "sweet": 888753762,
        "calm": 888753763,
        "teasing": 888753764,
        "sad": 888753765,
    },
    "kohaku": {
        "normal": 1878365376,
        "sweet": 1878365377,
        "sad": 1878365378,
        "whisper": 1878365379,
    },
}

# Load API keys from .env.local if present
def load_gemini_keys():
    keys = []
    env_files = [".env.local", ".env"]
    for env_file in env_files:
        if os.path.exists(env_file):
            with open(env_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("#") or "=" not in line:
                        continue
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip('"').strip("'")
                    if k.startswith("GEMINI_API_KEY") and v and v not in keys:
                        keys.append(v)
    return keys

GEMINI_KEYS = load_gemini_keys()
gemini_key_idx = 0

def get_next_gemini_key():
    global gemini_key_idx
    if not GEMINI_KEYS:
        return None
    k = GEMINI_KEYS[gemini_key_idx % len(GEMINI_KEYS)]
    gemini_key_idx += 1
    return k

def is_aivis_running():
    try:
        req = urllib.request.Request(f"{AIVIS_URL}/version")
        with urllib.request.urlopen(req, timeout=2) as resp:
            return resp.status == 200
    except Exception:
        return False

def try_start_container():
    print("AivisSpeech is not running. Attempting to start 'aivisspeech' container...")
    try:
        subprocess.run(["podman", "start", "aivisspeech"], check=True)
        print("Waiting for AivisSpeech engine to initialize...")
        for _ in range(30):
            time.sleep(2)
            if is_aivis_running():
                print("AivisSpeech is ready!\n")
                return True
    except Exception as e:
        print(f"Failed to auto-start container: {e}")
    return False

# Rule-based fallback style classifier (used if offline or without Gemini key)
def heuristic_style(speaker_en, speaker_ja, text_ja):
    norm_en = (speaker_en or "").lower()
    norm_ja = (speaker_ja or "").lower()
    text = text_ja or ""

    is_female = any(
        w in norm_en or w in norm_ja
        for w in ["mary", "メアリー", "landlady", "大家", "yui", "ゆい", "sue", "スー", "waitress", "女性"]
    )

    is_sad = any(w in text for w in ["行かないで", "悲し", "ごめん", "すみません", "壊れて", "申し訳", "涙", "泣"])
    is_sweet = any(w in text for w in ["会えて本当によかった", "ありがとう", "大好き", "楽しかった", "元気でね"])
    is_calm = any(w in text for w in ["大丈夫", "少々、お待ちください", "お待たせいたしました", "申します", "よろしく"])

    if is_female:
        if "landlady" in norm_en or "大家" in norm_ja:
            return {"styleId": AIVIS_STYLES["mao"]["calm"], "speedScale": 0.95, "pitchScale": -0.08, "intonationScale": 1.0}
        if is_sad:
            return {"styleId": AIVIS_STYLES["mao"]["sad"], "speedScale": 0.95, "pitchScale": 0.0, "intonationScale": 1.25}
        if is_sweet:
            return {"styleId": AIVIS_STYLES["mao"]["sweet"], "speedScale": 1.0, "pitchScale": 0.0, "intonationScale": 1.15}
        if is_calm:
            return {"styleId": AIVIS_STYLES["mao"]["calm"], "speedScale": 1.0, "pitchScale": 0.0, "intonationScale": 1.0}
        return {"styleId": AIVIS_STYLES["mao"]["casual"], "speedScale": 1.0, "pitchScale": 0.0, "intonationScale": 1.0}
    else:
        # Male
        is_older = any(w in norm_en or w in norm_ja for w in ["manager", "部長", "father", "お父さん", "professor", "先生"])
        if is_older:
            return {"styleId": AIVIS_STYLES["kohaku"]["normal"], "speedScale": 0.92, "pitchScale": -0.15, "intonationScale": 1.0}
        if is_sad:
            return {"styleId": AIVIS_STYLES["kohaku"]["sad"], "speedScale": 0.95, "pitchScale": 0.0, "intonationScale": 1.25}
        if is_sweet:
            return {"styleId": AIVIS_STYLES["kohaku"]["sweet"], "speedScale": 1.0, "pitchScale": 0.0, "intonationScale": 1.15}
        return {"styleId": AIVIS_STYLES["kohaku"]["normal"], "speedScale": 1.0, "pitchScale": 0.0, "intonationScale": 1.0}

def gemini_classify_emotion(speaker_en, speaker_ja, text_ja, setting):
    key = get_next_gemini_key()
    if not key:
        return heuristic_style(speaker_en, speaker_ja, text_ja)

    prompt = (
        f"Context/Setting: {setting or 'Casual Japanese dialogue'}\n"
        f"Speaker: {speaker_ja} ({speaker_en})\n"
        f"Line: {text_ja}\n\n"
        f"Choose the best AivisSpeech voice style for this line.\n"
        f"Mao (Female) styles: normal (888753760), casual (888753761), sweet (888753762), calm (888753763), teasing (888753764), sad (888753765).\n"
        f"Kohaku (Male) styles: normal (1878365376), sweet (1878365377), sad (1878365378), whisper (1878365379).\n"
        f"Output ONLY valid JSON with keys: styleId (int), speedScale (float 0.9-1.15), pitchScale (float -0.15 to 0.1), intonationScale (float 1.0-1.3)."
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json"},
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            candidate = data["candidates"][0]["content"]["parts"][0]["text"]
            res = json.loads(candidate)
            if "styleId" in res:
                return res
    except Exception:
        pass

    return heuristic_style(speaker_en, speaker_ja, text_ja)

def synthesize_line(text_ja, style_params, out_opus_path):
    os.makedirs(os.path.dirname(out_opus_path), exist_ok=True)
    style_id = style_params["styleId"]

    # 1. Query
    q_url = f"{AIVIS_URL}/audio_query?text={urllib.parse.quote(text_ja)}&speaker={style_id}"
    req1 = urllib.request.Request(q_url, method="POST")
    with urllib.request.urlopen(req1, timeout=10) as resp1:
        query_data = json.loads(resp1.read().decode("utf-8"))

    # Apply emotional tuning
    query_data["speedScale"] = style_params.get("speedScale", 1.0)
    query_data["pitchScale"] = style_params.get("pitchScale", 0.0)
    query_data["intonationScale"] = style_params.get("intonationScale", 1.0)

    # 2. Synthesis
    s_url = f"{AIVIS_URL}/synthesis?speaker={style_id}"
    req2 = urllib.request.Request(
        s_url,
        data=json.dumps(query_data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req2, timeout=20) as resp2:
        wav_bytes = resp2.read()

    # 3. Transcode directly to 64k OPUS using ffmpeg
    p = subprocess.Popen(
        ["ffmpeg", "-y", "-f", "wav", "-i", "pipe:0", "-c:a", "libopus", "-b:a", "64k", out_opus_path],
        stdin=subprocess.PIPE,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    p.communicate(input=wav_bytes)
    return os.path.exists(out_opus_path) and os.path.getsize(out_opus_path) > 500

def main():
    print("=" * 65)
    print("  Genki Dialogue Audio Generator (AivisSpeech + Gemini Direction)  ")
    print("=" * 65)

    if not is_aivis_running():
        if not try_start_container():
            print("\n[ERROR] AivisSpeech engine is not reachable on http://127.0.0.1:10101.")
            print("Please run in another terminal: podman start aivisspeech")
            sys.exit(1)

    print(f"[OK] AivisSpeech engine connected on {AIVIS_URL}")
    print(f"[OK] Found {len(GEMINI_KEYS)} Gemini API key(s) in .env.local")

    # Load tasks from book JSONs
    books = [
        {"num": 1, "file": "public/data/v1/books/genki-1.json"},
        {"num": 2, "file": "public/data/v1/books/genki-2.json"},
    ]

    all_tasks = []
    for b in books:
        if not os.path.exists(b["file"]):
            continue
        with open(b["file"], "r", encoding="utf-8") as f:
            book_data = json.load(f)
        for lesson in book_data.get("lessons", []):
            l_num = lesson["lessonNumber"]
            for scene in lesson.get("dialogues", []):
                s_id = scene["id"]
                setting = scene.get("setting", "")
                for idx, line in enumerate(scene.get("lines", [])):
                    task_key = f"genki-{b['num']}:{l_num}:{s_id}:{idx}"
                    out_rel = f"/audio/books/dialogues/genki-{b['num']}/{s_id}-{idx}.opus"
                    out_abs = os.path.join(os.getcwd(), f"public{out_rel}")
                    all_tasks.append({
                        "taskKey": task_key,
                        "bookNum": b["num"],
                        "lesson": l_num,
                        "sceneId": s_id,
                        "lineIndex": idx,
                        "speaker": line.get("speaker", ""),
                        "speakerJa": line.get("speakerJa", ""),
                        "ja": line.get("ja", ""),
                        "setting": setting,
                        "outRel": out_rel,
                        "outAbs": out_abs,
                    })

    # Read progress file to know which keys were already upgraded
    completed_keys = set()
    if os.path.exists(PROG_FILE):
        try:
            with open(PROG_FILE, "r", encoding="utf-8") as pf:
                data = json.load(pf)
                completed_keys = set(data.get("completedKeys", []))
        except Exception:
            pass

    # Filter tasks: lines not in completedKeys are the remaining ones to upgrade!
    force_all = "--all" in sys.argv
    if force_all:
        pending_tasks = all_tasks
    else:
        pending_tasks = [t for t in all_tasks if t["taskKey"] not in completed_keys]

    print(f"\nTotal Dialogue Lines across Genki I & II: {len(all_tasks)}")
    print(f"Already Upgraded: {len(all_tasks) - len(pending_tasks)}")
    print(f"Pending to Upgrade: {len(pending_tasks)}\n")

    if not pending_tasks:
        print("All dialogue lines already upgraded! Nothing to do.")
        return

    interrupted = False
    def handle_sigint(sig, frame):
        nonlocal interrupted
        print("\n[PAUSE] Received Ctrl+C. Completing current item and exiting gracefully...")
        interrupted = True

    signal.signal(signal.SIGINT, handle_sigint)

    success_count = 0
    start_time = time.time()

    for i, task in enumerate(pending_tasks, 1):
        if interrupted:
            break

        spk = task["speakerJa"] or task["speaker"]
        ja_snippet = task["ja"][:32] + ("..." if len(task["ja"]) > 32 else "")
        print(f"[{i}/{len(pending_tasks)}] L{task['lesson']} ({task['sceneId']}) {spk}: {ja_snippet}")

        # 1. Determine Emotion Style
        style_params = gemini_classify_emotion(
            task["speaker"], task["speakerJa"], task["ja"], task["setting"]
        )

        # 2. Synthesize with AivisSpeech
        ok = synthesize_line(task["ja"], style_params, task["outAbs"])
        if ok:
            success_count += 1
            completed_keys.add(task["taskKey"])
            # Update progress file
            with open(PROG_FILE, "w", encoding="utf-8") as pf:
                json.dump({
                    "totalLines": len(all_tasks),
                    "completedCount": len(completed_keys),
                    "remainingCount": len(all_tasks) - len(completed_keys),
                    "lastCompletedTask": {
                        "taskKey": task["taskKey"],
                        "outRelPath": task["outRel"],
                        "speaker": task["speaker"],
                        "ja": task["ja"],
                    },
                    "completedKeys": list(completed_keys),
                }, pf, indent=2, ensure_ascii=False)
        else:
            print(f"    [WARN] Failed to synthesize {task['taskKey']}")

        time.sleep(0.1)

    elapsed = time.time() - start_time
    print("\n" + "=" * 65)
    print(f"Done! Synthesized {success_count} lines in {elapsed:.1f}s.")
    print("To free system memory, you can stop AivisSpeech whenever you are done:")
    print("    podman stop aivisspeech")
    print("=" * 65)

if __name__ == "__main__":
    main()
