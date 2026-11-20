#!/usr/bin/env python3
"""
Generates high-emotion dialogue audio for story-driven quest games:
  - First Date with Sakura (first-date-sakura)
  - Client Apology: Delivery Delay (client-apology-delay)
  - Genki Little Asia: Job & Order (genki-little-asia)

Uses Aivis Cloud API via AIVIS_API_KEY with zero local RAM/CPU impact.
"""

import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request

API_BASE = "https://api.aivis-project.com/v1"

# Load AIVIS_API_KEY from .env.local
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

# Voice Models on Aivis Cloud
MODELS = {
    # Mao: 6 emotional styles (ノーマル, ふつー, あまあま, おちつき, からかい, せつなめ)
    "mao": "a59cb814-0083-4369-8542-f51a29e72af7",
    # Aida Shigeru: Deep mature adult male (ノーマル, Calm, Far, Heavy, Mid, Shout, Surprise)
    "aida": "47e53151-a378-46f3-abee-ce13aa07feb1",
    # morioki: Young adult male (ノーマル)
    "morioki": "baaae3c0-7b22-4605-8ba5-80c959b41a48",
    # M2: Emotional male (ノーマル, 怒り, 嫌悪, 恐れ, 幸せ, 悲しみ, 驚き)
    "m2": "d1a7446f-230d-4077-afdf-923eddabe53c",
    # Mai: Bright young female (ノーマル)
    "mai": "e9339137-2ae3-4d41-9394-fb757a7e61e6",
}

def clean_spoken_text(raw):
    # Strip fullwidth and halfwidth narration in parentheses
    cleaned = re.sub(r"（[^）]*）", "", raw)
    cleaned = re.sub(r"\([^)]*\)", "", cleaned)
    # Remove leading dots / ellipsis if alone
    cleaned = cleaned.strip()
    return cleaned

# Character & Emotion Router for Dialogue Nodes
def route_npc_voice(scenario_id, node):
    char_key = (node.get("characterKey") or "").lower()
    expr = (node.get("expression") or "neutral").lower()
    text = node.get("npcTextJa", "")

    # --- 1. First Date with Sakura ---
    if scenario_id == "first-date-sakura":
        if char_key == "master":
            if expr == "happy":
                return {"model_name": "Aida", "model": MODELS["aida"], "style": "Calm", "speed": 1.0}
            if any(w in text for w in ["！", "おい", "何"]):
                return {"model_name": "Aida", "model": MODELS["aida"], "style": "Heavy", "speed": 0.93}
            return {"model_name": "Aida", "model": MODELS["aida"], "style": "Calm", "speed": 0.95}

        # Misaki (Mao with high emotional drama)
        if expr in ["happy", "proud", "relieved"]:
            return {"model_name": "Mao", "model": MODELS["mao"], "style": "あまあま", "speed": 1.0}
        elif expr in ["embarrassed", "embarrased"]:
            if any(w in text for w in ["ふふ", "笑", "〜", "照", "からかい"]):
                return {"model_name": "Mao", "model": MODELS["mao"], "style": "からかい", "speed": 1.02}
            return {"model_name": "Mao", "model": MODELS["mao"], "style": "あまあま", "speed": 0.97}
        elif expr in ["thinking"]:
            return {"model_name": "Mao", "model": MODELS["mao"], "style": "おちつき", "speed": 0.98}
        elif expr in ["confused", "worried", "troubled", "disappointed"]:
            return {"model_name": "Mao", "model": MODELS["mao"], "style": "せつなめ", "speed": 0.95}
        return {"model_name": "Mao", "model": MODELS["mao"], "style": "ふつー", "speed": 1.0}

    # --- 2. Client Apology Delay ---
    elif scenario_id == "client-apology-delay":
        if char_key == "yoshimura":
            if expr == "troubled":
                return {"model_name": "Mao", "model": MODELS["mao"], "style": "おちつき", "speed": 0.96}
            return {"model_name": "Mai", "model": MODELS["mai"], "style": "ノーマル", "speed": 1.0}

        elif char_key == "saito":
            # Lead Saito (Tense project lead)
            if expr in ["worried", "troubled"]:
                return {"model_name": "M2", "model": MODELS["m2"], "style": "恐れ", "speed": 0.96}
            elif expr in ["stern"]:
                return {"model_name": "M2", "model": MODELS["m2"], "style": "怒り", "speed": 0.97}
            elif expr in ["relieved"]:
                return {"model_name": "M2", "model": MODELS["m2"], "style": "幸せ", "speed": 0.98}
            return {"model_name": "M2", "model": MODELS["m2"], "style": "ノーマル", "speed": 1.0}

        else:
            # Manager Hasegawa (Client Director)
            if expr in ["scolding", "annoyed"]:
                return {"model_name": "Aida", "model": MODELS["aida"], "style": "Heavy", "speed": 0.92}
            elif expr in ["stern", "disappointed"]:
                return {"model_name": "Aida", "model": MODELS["aida"], "style": "Heavy", "speed": 0.94}
            elif expr in ["proud"]:
                return {"model_name": "Aida", "model": MODELS["aida"], "style": "Calm", "speed": 0.95}
            return {"model_name": "Aida", "model": MODELS["aida"], "style": "ノーマル", "speed": 0.96}

    # --- 3. Genki Little Asia ---
    elif scenario_id == "genki-little-asia":
        if expr in ["happy"]:
            return {"model_name": "Aida", "model": MODELS["aida"], "style": "Calm", "speed": 1.02}
        elif expr in ["stern", "troubled"]:
            return {"model_name": "Aida", "model": MODELS["aida"], "style": "Heavy", "speed": 0.95}
        return {"model_name": "Aida", "model": MODELS["aida"], "style": "Calm", "speed": 0.98}

    return {"model_name": "morioki", "model": MODELS["morioki"], "style": "ノーマル", "speed": 1.0}

# Player Choice Voice Router (MC)
def route_choice_voice(scenario_id, choice):
    tier = choice.get("tier", "polite")

    if scenario_id == "first-date-sakura":
        if tier == "casual":
            return {"model_name": "morioki", "model": MODELS["morioki"], "style": "ノーマル", "speed": 1.03}
        elif tier == "respectful":
            return {"model_name": "morioki", "model": MODELS["morioki"], "style": "ノーマル", "speed": 0.96}
        return {"model_name": "morioki", "model": MODELS["morioki"], "style": "ノーマル", "speed": 1.0}

    if scenario_id == "client-apology-delay":
        if tier == "rude":
            return {"model_name": "morioki", "model": MODELS["morioki"], "style": "ノーマル", "speed": 1.04}
        return {"model_name": "morioki", "model": MODELS["morioki"], "style": "ノーマル", "speed": 0.94}

    return {"model_name": "morioki", "model": MODELS["morioki"], "style": "ノーマル", "speed": 1.0}

def synthesize_cloud_opus(text, voice_config, out_path):
    cleaned = clean_spoken_text(text)
    if not cleaned:
        return False

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    payload = {
        "model_uuid": voice_config["model"],
        "text": cleaned,
        "output_format": "opus",
        "output_sampling_rate": 48000,
        "speed_scale": voice_config.get("speed", 1.0),
    }
    if "style" in voice_config:
        payload["style_name"] = voice_config["style"]

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
                    return True
        except Exception as e:
            if attempt == 3:
                print(f"    [FAIL] {e}")
            time.sleep(1.5)
    return False

def load_all_scenarios():
    cmd = [
        "npx",
        "tsx",
        "-e",
        """
import { FIRST_DATE_SAKURA_NODES } from './src/data/dialogue/scenarios/first-date-sakura';
import { CLIENT_APOLOGY_NODES } from './src/data/dialogue/scenarios/client-apology-delay';
import { GENKI_LITTLE_ASIA_NODES } from './src/data/dialogue/scenarios/genki-little-asia';

const data = {
  'first-date-sakura': Object.values(FIRST_DATE_SAKURA_NODES),
  'client-apology-delay': Object.values(CLIENT_APOLOGY_NODES),
  'genki-little-asia': Object.values(GENKI_LITTLE_ASIA_NODES)
};
process.stdout.write(JSON.stringify(data));
        """,
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return json.loads(res.stdout)

def process_scenario(scenario_id, title, nodes, force=False):
    print("\n" + "=" * 65)
    print(f"  Quest: {title} ({scenario_id})")
    print("=" * 65)

    base_dir = f"public/assets/dialogue-quest/{scenario_id}"
    dialogue_dir = f"{base_dir}/dialogue"
    choices_dir = f"{base_dir}/choices"

    # 1. NPC Dialogue Lines
    print(f"\n--- 1. NPC Dialogue Lines ({len(nodes)} lines) ---")
    for i, node in enumerate(nodes, 1):
        out_file = f"{dialogue_dir}/{node['id']}.opus"
        if not force and os.path.exists(out_file) and os.path.getsize(out_file) > 1000:
            print(f"[{i}/{len(nodes)}] {node['id']} [EXISTS, {os.path.getsize(out_file)} bytes] (Skipping)")
            continue

        voice_cfg = route_npc_voice(scenario_id, node)
        cleaned = clean_spoken_text(node["npcTextJa"])
        snippet = cleaned[:24] + ("..." if len(cleaned) > 24 else "")

        style_info = f"{voice_cfg.get('model_name')}[{voice_cfg.get('style', 'normal')}]"
        print(f"[{i}/{len(nodes)}] {node['id']} ({style_info}): {snippet}")
        ok = synthesize_cloud_opus(node["npcTextJa"], voice_cfg, out_file)
        if ok:
            sz = os.path.getsize(out_file)
            print(f"    -> OK ({sz} bytes)")
        else:
            print(f"    [WARN] Failed to synthesize {node['id']}")
        time.sleep(0.4)

    # 2. Player Response Choices
    all_choices = []
    for node in nodes:
        for c in node.get("choices", []):
            all_choices.append(c)

    print(f"\n--- 2. Player Response Choices ({len(all_choices)} lines) ---")
    for j, c in enumerate(all_choices, 1):
        out_file = f"{choices_dir}/{c['id']}.opus"
        if not force and os.path.exists(out_file) and os.path.getsize(out_file) > 1000:
            print(f"[{j}/{len(all_choices)}] {c['id']} [EXISTS, {os.path.getsize(out_file)} bytes] (Skipping)")
            continue

        voice_cfg = route_choice_voice(scenario_id, c)
        snippet = c["textJa"][:24] + ("..." if len(c["textJa"]) > 24 else "")

        print(f"[{j}/{len(all_choices)}] {c['id']} ({c['tier']}): {snippet}")
        ok = synthesize_cloud_opus(c["textJa"], voice_cfg, out_file)
        if ok:
            sz = os.path.getsize(out_file)
            print(f"    -> OK ({sz} bytes)")
        else:
            print(f"    [WARN] Failed to synthesize choice {c['id']}")
        time.sleep(0.4)

    print(f"\n[COMPLETED] Audio processing finished for {scenario_id}!")

def main():
    force = "--force" in sys.argv
    print("=" * 65)
    print("  Aivis Cloud API High-Emotion Quest Dialogue Generator  ")
    print("=" * 65)
    print(f"[OK] Authenticated with Aivis Cloud API (Force={force})")

    print("[*] Loading scenario data from TypeScript definitions...")
    scenarios_data = load_all_scenarios()
    print(f"[OK] Loaded {len(scenarios_data)} scenarios.")

    scenarios = [
        ("first-date-sakura", "First Date with Sakura (Misaki)"),
        ("client-apology-delay", "Client Apology: Delivery Delay (Manager Hasegawa)"),
        ("genki-little-asia", "Genki Little Asia: Job & Order"),
    ]

    for s_id, title in scenarios:
        nodes = scenarios_data.get(s_id, [])
        process_scenario(s_id, title, nodes, force=force)

    print("\n" + "=" * 65)
    print("All Quest Scenarios have been generated with high-emotion Aivis Cloud audio!")
    print("=" * 65)

if __name__ == "__main__":
    main()
