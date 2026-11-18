#!/usr/bin/env python3
"""
Standalone Genki Dialogue Audio Generator using AivisSpeech Engine (Local Podman)
with Distinct Multi-Speaker Cast and Gemini Direction.

Available Voices in AivisSpeech:
  - 阿井田 茂 (Aida Shigeru): Deep mature adult male (Prof. Yamashita, Manager, Fathers, Doctors)
  - morioki: Young adult male student (Takeshi, Robert, Ken, John)
  - まい (Mai): Bright young female college student (Mary, Michiko)
  - まお (Mao): Expressive female friend / mature guide (Sue, Yui, Landlady, Host Mother)
  - コハク (Kohaku): Clear youthful clerk / boy (Tanaka, Shop assistants)

Usage in Konsole:
  1. podman start aivisspeech
  2. python3 scripts/generate-dialogues.py [--all]
  3. podman stop aivisspeech
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

# Distinct Multi-Speaker Styles Registry
SPEAKERS = {
    "aida": {
        "name": "阿井田 茂 (Mature Adult Male)",
        "styles": {
            "normal": 1310138976,
            "calm": 1310138977,
            "heavy": 1310138979,
            "surprise": 1310138982,
        },
    },
    "morioki": {
        "name": "morioki (Young Adult Male)",
        "styles": {
            "normal": 497929760,
        },
    },
    "mai": {
        "name": "まい (Bright Young Female)",
        "styles": {
            "normal": 1431611904,
        },
    },
    "mao": {
        "name": "まお (Expressive Female)",
        "styles": {
            "normal": 888753760,
            "casual": 888753761,
            "sweet": 888753762,
            "calm": 888753763,
            "teasing": 888753764,
            "sad": 888753765,
        },
    },
    "kohaku": {
        "name": "コハク (Youthful Male / Clerk)",
        "styles": {
            "normal": 1878365376,
            "sweet": 1878365377,
            "sad": 1878365378,
            "whisper": 1878365379,
        },
    },
}

def load_gemini_keys():
    keys = []
    for env_file in [".env.local", ".env"]:
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

# Rule-based character-to-voice mapper
def map_character_voice(speaker_en, speaker_ja, text_ja, setting):
    norm_en = (speaker_en or "").lower().strip()
    norm_ja = (speaker_ja or "").lower().strip()
    text = text_ja or ""

    # 1. Mature / Authoritative Adult Male (Prof. Yamashita, Department Manager, Fathers, Doctors)
    if any(w in norm_en or w in norm_ja for w in [
        "professor", "yamashita", "山下", "先生", "manager", "部長", "father", "お父さん",
        "doctor", "医者", "police", "警官", "old man", "おじいさん"
    ]):
        if any(w in text for w in ["！", "驚", "えっ", "何", "どうして"]):
            return {"voice": "阿井田 茂", "styleId": SPEAKERS["aida"]["styles"]["surprise"], "speedScale": 1.0, "pitchScale": 0.0, "intonationScale": 1.15}
        if any(w in text for w in ["ゆっくり", "大丈夫", "寄らない", "礼", "いいよ"]):
            return {"voice": "阿井田 茂", "styleId": SPEAKERS["aida"]["styles"]["calm"], "speedScale": 0.94, "pitchScale": 0.0, "intonationScale": 1.0}
        return {"voice": "阿井田 茂", "styleId": SPEAKERS["aida"]["styles"]["normal"], "speedScale": 0.95, "pitchScale": 0.0, "intonationScale": 1.0}

    # 2. Young Adult Male Students (Takeshi, Robert, Ken, John)
    if any(w in norm_en or w in norm_ja for w in ["takeshi", "たけし", "robert", "ロバート", "ken", "けん", "john", "ジョン"]):
        if any(w in text for w in ["悲し", "ごめん", "すみません", "泣", "待っているから", "涙"]):
            return {"voice": "コハク", "styleId": SPEAKERS["kohaku"]["styles"]["sad"], "speedScale": 0.95, "pitchScale": 0.0, "intonationScale": 1.25}
        if "robert" in norm_en or "ロバート" in norm_ja:
            return {"voice": "morioki", "styleId": SPEAKERS["morioki"]["styles"]["normal"], "speedScale": 0.96, "pitchScale": -0.04, "intonationScale": 1.0}
        return {"voice": "morioki", "styleId": SPEAKERS["morioki"]["styles"]["normal"], "speedScale": 1.0, "pitchScale": 0.0, "intonationScale": 1.05}

    # 3. Main Female Student (Mary, Michiko)
    if any(w in norm_en or w in norm_ja for w in ["mary", "メアリー", "michiko", "みちこ"]):
        if any(w in text for w in ["行かなきゃ", "会えて本当によかった", "涙", "悲し"]):
            return {"voice": "まお", "styleId": SPEAKERS["mao"]["styles"]["sad"], "speedScale": 0.95, "pitchScale": 0.0, "intonationScale": 1.25}
        return {"voice": "まい", "styleId": SPEAKERS["mai"]["styles"]["normal"], "speedScale": 1.0, "pitchScale": 0.0, "intonationScale": 1.05}

    # 4. Female Classmates / Friends (Sue, Yui, Sora)
    if any(w in norm_en or w in norm_ja for w in ["sue", "スー", "yui", "ゆい", "sora", "ソラ"]):
        if any(w in text for w in ["ねえ", "でしょ", "〜", "かわいい"]):
            return {"voice": "まお", "styleId": SPEAKERS["mao"]["styles"]["teasing"], "speedScale": 1.02, "pitchScale": 0.0, "intonationScale": 1.15}
        return {"voice": "まお", "styleId": SPEAKERS["mao"]["styles"]["casual"], "speedScale": 1.0, "pitchScale": 0.0, "intonationScale": 1.0}

    # 5. Mature Female (Landlady, Host Mother)
    if any(w in norm_en or w in norm_ja for w in ["landlady", "大家", "host mother", "お母さん", "mother", "old woman", "おばあさん"]):
        return {"voice": "まお", "styleId": SPEAKERS["mao"]["styles"]["calm"], "speedScale": 0.93, "pitchScale": -0.09, "intonationScale": 1.0}

    # 6. Service / Clerk / Tanaka
    if any(w in norm_en or w in norm_ja for w in ["tanaka", "田中", "clerk", "店員", "assistant", "waiter", "waitress"]):
        return {"voice": "コハク", "styleId": SPEAKERS["kohaku"]["styles"]["normal"], "speedScale": 1.02, "pitchScale": 0.0, "intonationScale": 1.0}

    # Default fallback
    if any(w in norm_ja for w in ["女", "子", "娘"]):
        return {"voice": "まい", "styleId": SPEAKERS["mai"]["styles"]["normal"], "speedScale": 1.0, "pitchScale": 0.0, "intonationScale": 1.0}
    return {"voice": "morioki", "styleId": SPEAKERS["morioki"]["styles"]["normal"], "speedScale": 1.0, "pitchScale": 0.0, "intonationScale": 1.0}

def get_voice_params(speaker_en, speaker_ja, text_ja, setting):
    # Try Gemini direction if API key is present
    key = get_next_gemini_key()
    if key:
        prompt = (
            f"Scene Context: {setting or 'Genki textbook dialogue'}\n"
            f"Speaker: {speaker_ja} ({speaker_en})\n"
            f"Line: {text_ja}\n\n"
            f"Select the best voice actor and style:\n"
            f"- Aida Shigeru (Deep mature male): normal(1310138976), calm(1310138977), surprise(1310138982)\n"
            f"- morioki (Young adult male student): normal(497929760)\n"
            f"- Mai (Bright female college student): normal(1431611904)\n"
            f"- Mao (Expressive female): casual(888753761), sweet(888753762), calm(888753763), teasing(888753764), sad(888753765)\n"
            f"- Kohaku (Clear youthful clerk/boy): normal(1878365376), sad(1878365378)\n\n"
            f"Output JSON with keys: voice (str), styleId (int), speedScale (float 0.9-1.1), pitchScale (float -0.1 to 0.1), intonationScale (float 1.0-1.25)."
        )
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"},
        }
        try:
            req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"}, method="POST")
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                res = json.loads(data["candidates"][0]["content"]["parts"][0]["text"])
                if "styleId" in res:
                    return res
        except Exception:
            pass

    return map_character_voice(speaker_en, speaker_ja, text_ja, setting)

def synthesize_line(text_ja, voice_params, out_opus_path):
    os.makedirs(os.path.dirname(out_opus_path), exist_ok=True)
    style_id = voice_params["styleId"]

    # 1. Query
    q_url = f"{AIVIS_URL}/audio_query?text={urllib.parse.quote(text_ja)}&speaker={style_id}"
    req1 = urllib.request.Request(q_url, method="POST")
    with urllib.request.urlopen(req1, timeout=10) as resp1:
        query_data = json.loads(resp1.read().decode("utf-8"))

    query_data["speedScale"] = voice_params.get("speedScale", 1.0)
    query_data["pitchScale"] = voice_params.get("pitchScale", 0.0)
    query_data["intonationScale"] = voice_params.get("intonationScale", 1.0)

    # 2. Synthesis
    s_url = f"{AIVIS_URL}/synthesis?speaker={style_id}"
    req2 = urllib.request.Request(
        s_url,
        data=json.dumps(query_data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req2, timeout=25) as resp2:
        wav_bytes = resp2.read()

    # 3. Transcode to 64k OPUS
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
    print("  Genki Dialogue Audio Generator (Distinct Multi-Speaker Cast)  ")
    print("=" * 65)

    if not is_aivis_running():
        print("\n[ERROR] AivisSpeech engine is not reachable on http://127.0.0.1:10101.")
        print("Please run in Konsole: podman start aivisspeech")
        sys.exit(1)

    print(f"[OK] AivisSpeech engine connected on {AIVIS_URL}")
    print("[OK] Loaded 5 distinct voice models:")
    print("     - 阿井田 茂: Prof. Yamashita, Department Manager, Fathers")
    print("     - morioki:   Takeshi, Robert, Ken, John")
    print("     - まい:       Mary, Michiko")
    print("     - まお:       Sue, Yui, Landlady")
    print("     - コハク:     Tanaka, Store clerks")

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

    # When --all or --regenerate is passed, re-synthesize all lines with the new cast
    # Otherwise, by default re-synthesize lines 19-23 or all lines with the distinct voices!
    target_tasks = all_tasks if ("--all" in sys.argv or "--cast" in sys.argv) else [
        t for t in all_tasks if t["bookNum"] == 2 and t["lesson"] >= 19
    ]

    print(f"\nTotal Dialogue Lines: {len(all_tasks)}")
    print(f"Target Lines to Synthesize with Distinct Cast: {len(target_tasks)}\n")

    interrupted = False
    def handle_sigint(sig, frame):
        nonlocal interrupted
        print("\n[PAUSE] Received Ctrl+C. Completing current item and exiting gracefully...")
        interrupted = True

    signal.signal(signal.SIGINT, handle_sigint)

    success_count = 0
    start_time = time.time()

    for i, task in enumerate(target_tasks, 1):
        if interrupted:
            break

        spk = task["speakerJa"] or task["speaker"]
        ja_snippet = task["ja"][:28] + ("..." if len(task["ja"]) > 28 else "")

        voice_params = get_voice_params(task["speaker"], task["speakerJa"], task["ja"], task["setting"])
        v_name = voice_params.get("voice", str(voice_params.get("styleId")))
        print(f"[{i}/{len(target_tasks)}] L{task['lesson']} ({task['sceneId']}) {spk} -> [{v_name}]: {ja_snippet}")

        ok = synthesize_line(task["ja"], voice_params, task["outAbs"])
        if ok:
            success_count += 1
        else:
            print(f"    [WARN] Failed to synthesize {task['taskKey']}")

        time.sleep(0.05)

    elapsed = time.time() - start_time
    print("\n" + "=" * 65)
    print(f"Done! Synthesized {success_count} lines with distinct cast in {elapsed:.1f}s.")
    print("To free system memory, remember to stop AivisSpeech:")
    print("    podman stop aivisspeech")
    print("=" * 65)

if __name__ == "__main__":
    main()
