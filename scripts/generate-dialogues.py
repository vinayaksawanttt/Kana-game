#!/usr/bin/env python3
"""
Hybrid Multi-Engine Textbook Dialogue Audio Generator
(Gemini TTS + Gemini Emotion Director + Kenpath Labs + AivisSpeech + VOICEVOX)

Architecture:
  1. Multi-Key Gemini Pool:
     - Loads all GEMINI_API_KEY1..10 (and GEMINI_API_KEY) from .env / .env.local.
     - Rotates across keys and Gemini TTS models (gemini-3.8-flash-lite-tts,
       gemini-3.8-flash-tts, gemini-3.1-flash-tts-preview).
  2. One Batch Gemini Emotion Director Call per Lesson:
     - Sends the lesson's dialogue script to gemini-3.5-flash-lite once per lesson
       to annotate every line with:
         { style, phrasedJa, speedScale, intonationScale, tempoDynamicsScale }
     - Caches annotations in docs/dialogue-emotion-director-cache.json.
  3. 4-Engine Hybrid Router + Automatic Fallback:
     - Primary: Gemini TTS (20+ distinct prebuilt voices with rich pitch & emotion),
       or AivisSpeech for specialized child personas (8yo Taro, 9yo Teresa).
     - Fallback 1: Kenpath Labs API (validates /v1/usage credit balance & /v1/voices
       before calling; 6 native Japanese voices: Aoi, Emi, Haruto, Kenta, Mio, Ren).
     - Fallback 2: AivisSpeech Offline Engine (http://127.0.0.1:10101, 18 neural voices)
       driven by the Emotion Director's styleId, speedScale, intonationScale, and
       tempoDynamicsScale parameters.
     - Fallback 3: VOICEVOX Offline Engine (http://127.0.0.1:50021, 44 speakers).
  4. Broadcast Loudness Normalization:
     - Passes every synthesized clip through ffmpeg:
       -af loudnorm=I=-16:TP=-1.5:LRA=11 -ac 1 -ar 48000 -c:a libopus -b:a 48k -vbr on

Usage:
  python3 scripts/generate-dialogues.py --mnn          # Synthesize missing MNN 1 lines
  python3 scripts/generate-dialogues.py --mnn --force  # Re-synthesize all MNN 1 lines
  python3 scripts/generate-dialogues.py --lesson=2     # Synthesize a specific lesson
"""

import base64
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import os
import re
import signal
import subprocess
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)

AIVIS_URL = "http://127.0.0.1:10101"
VOICEVOX_URL = "http://127.0.0.1:50021"
KENPATH_BASE_URL = "https://api.kenpathlabs.com"
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

GEMINI_TTS_MODELS = [
    "gemini-3.8-flash-lite-tts",
    "gemini-3.8-flash-tts",
    "gemini-3.1-flash-tts-preview",
]

GEMINI_DIRECTOR_MODELS = [
    "gemini-3.5-flash-lite",
]

EMOTION_CACHE_PATH = os.path.join("docs", "dialogue-emotion-director-cache.json")

# ---------------------------------------------------------------------------
# 1. Environment & API Key Loader
# ---------------------------------------------------------------------------

def load_env_keys():
    env_vars = dict(os.environ)
    for fname in [".env", ".env.local"]:
        if os.path.exists(fname):
            with open(fname, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip('"').strip("'")
                    if k and v:
                        env_vars[k] = v

    gemini_keys = []
    for i in range(1, 20):
        k = env_vars.get(f"GEMINI_API_KEY{i}")
        if k and k not in gemini_keys:
            gemini_keys.append(k)
    base_k = env_vars.get("GEMINI_API_KEY")
    if base_k and base_k not in gemini_keys:
        gemini_keys.append(base_k)

    kenpath_key = env_vars.get("KENPATH_LABS_API_KEY", "")
    return gemini_keys, kenpath_key


# ---------------------------------------------------------------------------
# 2. Voice Registries Across All 4 Engines
# ---------------------------------------------------------------------------

# Kenpath Labs Native Japanese Voices (/v1/voices native_language_code == "ja")
KENPATH_VOICES = {
    "aoi": "sv_qy4oztyr",     # Female, young, Tokyo accent (calm, measured)
    "emi": "sv_fjkgsy0o",     # Female, middle_aged, Kyushu accent (smooth, warm)
    "haruto": "sv_s1ojla8a",  # Male, middle_aged, Tokyo accent (steady, inviting)
    "kenta": "sv_71lsoipx",   # Male, middle_aged, Tokyo accent (low, authoritative)
    "mio": "sv_9j2qx39f",     # Female, young, Kanto accent (bright, friendly)
    "ren": "sv_6q72qb26",     # Male, young, Tokyo accent (calm, natural)
}

# Offline AivisSpeech 18-Speaker Registry (Port 10101)
AIVIS_SPEAKERS = {
    "fumifumi": {"name": "fumifumi", "styles": {"normal": 606865152}},
    "kanae": {
        "name": "金苗(かなえ)",
        "styles": {
            "neutral": 1238228480,
            "normal": 1238228481,
            "cheerful": 1238228482,
            "warm": 1238228483,
            "angry": 1238228484,
            "joy": 1238228485,
        },
    },
    "ginga": {
        "name": "銀芽(ぎんが)",
        "styles": {
            "neutral": 38453056,
            "normal": 38453057,
            "exasperated": 38453058,
            "emotional": 38453059,
        },
    },
    "f1": {
        "name": "F1",
        "styles": {
            "normal": 1236214272,
            "angry": 1236214273,
            "happy": 1236214276,
            "cheerful": 1236214276,
            "sad": 1236214277,
            "surprise": 1236214278,
        },
    },
    "f2": {
        "name": "F2",
        "styles": {
            "normal": 1670137088,
            "angry": 1670137089,
            "happy": 1670137092,
            "cheerful": 1670137092,
            "sad": 1670137093,
            "surprise": 1670137094,
        },
    },
    "m1": {
        "name": "M1",
        "styles": {
            "normal": 2051283136,
            "angry": 2051283137,
            "happy": 2051283140,
            "cheerful": 2051283140,
            "sad": 2051283141,
            "surprise": 2051283142,
        },
    },
    "m2": {
        "name": "M2",
        "styles": {
            "normal": 1368642336,
            "angry": 1368642337,
            "happy": 1368642340,
            "cheerful": 1368642340,
            "sad": 1368642341,
            "surprise": 1368642342,
        },
    },
    "shinjou": {"name": "Shinjou Tomoharu", "styles": {"normal": 562825248}},
    "tanaka": {
        "name": "TANAKA",
        "styles": {
            "normal": 1628969216,
            "angry": 1628969217,
            "happy": 1628969218,
            "cheerful": 1628969218,
            "silly": 1628969219,
            "surprise": 1628969220,
        },
    },
    "morioki": {"name": "morioki", "styles": {"normal": 497929760}},
    "yukyu": {"name": "yukyu", "styles": {"normal": 1099751712}},
    "mai": {"name": "まい", "styles": {"normal": 1431611904}},
    "mao": {
        "name": "まお",
        "styles": {
            "normal": 888753760,
            "casual": 888753761,
            "cheerful": 888753761,
            "sweet": 888753762,
            "calm": 888753763,
            "warm": 888753763,
            "teasing": 888753764,
            "sad": 888753765,
        },
    },
    "rotejin": {"name": "ろてじん（長老ボイス）", "styles": {"normal": 391794336}},
    "kohaku": {
        "name": "コハク",
        "styles": {
            "normal": 1878365376,
            "sweet": 1878365377,
            "cheerful": 1878365377,
            "sad": 1878365378,
            "whisper": 1878365379,
        },
    },
    "sawabaru": {"name": "澤原 玄二郎", "styles": {"normal": 2029042368}},
    "shoujou": {"name": "猩々博士 (雑談ボイス)", "styles": {"normal": 5306848}},
    "aida": {
        "name": "阿井田 茂",
        "styles": {
            "normal": 1310138976,
            "calm": 1310138977,
            "warm": 1310138977,
            "heavy": 1310138979,
            "surprise": 1310138982,
        },
    },
}


def resolve_aivis_style_id(speaker_key, default_style, director_style):
    sp = AIVIS_SPEAKERS.get(speaker_key, AIVIS_SPEAKERS["fumifumi"])
    styles = sp["styles"]
    if director_style and director_style in styles:
        return styles[director_style]
    # Alias mapping
    alias_map = {
        "warm": ["warm", "calm", "normal"],
        "cheerful": ["cheerful", "happy", "joy", "casual", "normal"],
        "calm": ["calm", "neutral", "normal"],
        "surprise": ["surprise", "emotional", "normal"],
        "sad": ["sad", "emotional", "normal"],
        "angry": ["angry", "heavy", "exasperated", "normal"],
        "sweet": ["sweet", "warm", "normal"],
        "whisper": ["whisper", "calm", "normal"],
    }
    for candidate in alias_map.get(director_style, []):
        if candidate in styles:
            return styles[candidate]
    return styles.get(default_style, next(iter(styles.values())))


def map_character_profile(speaker_en, speaker_ja):
    """
    Maps each character to their 4-Engine Voice Profile:
      - primary: 'gemini' (or 'aivis' for child voices where Gemini has no child model)
      - gemini_voice: Prebuilt Gemini TTS voice name
      - kenpath_voice: Kenpath Labs native Japanese voice ID
      - aivis_key / aivis_default_style: Local AivisSpeech speaker & style
      - voicevox_id: Local VOICEVOX speaker style ID
      - base_speed / base_pitch / base_intonation: Persona baseline tuning
    """
    norm_en = (speaker_en or "").lower().strip()
    norm_ja = (speaker_ja or "").lower().strip()

    # 1. Mike Miller (マイク・ミラー) - IMC Employee, USA (28, Male)
    if "ミラー" in norm_ja or "miller" in norm_en:
        return {
            "character": "Mike Miller",
            "primary": "gemini",
            "gemini_voice": "Charon",
            "kenpath_voice": KENPATH_VOICES["ren"],
            "aivis_key": "fumifumi",
            "aivis_style": "normal",
            "voicevox_id": 11,  # 玄野武宏
            "base_speed": 1.0,
            "base_pitch": 0.0,
            "base_intonation": 1.05,
        }

    # 2. Keiko Sato (佐藤 けい子) - IMC Employee, Japan (Female)
    if "佐藤" in norm_ja or "さとう" in norm_ja or "sato" in norm_en:
        return {
            "character": "Keiko Sato",
            "primary": "gemini",
            "gemini_voice": "Sulafat",
            "kenpath_voice": KENPATH_VOICES["mio"],
            "aivis_key": "kanae",
            "aivis_style": "normal",
            "voicevox_id": 2,  # 四国めたん
            "base_speed": 1.0,
            "base_pitch": 0.0,
            "base_intonation": 1.08,
        }

    # 3. Tomoko Yamada (山田 友子) - Bank Employee, Wife of Ichiro (Female)
    if "友子" in norm_ja or "ともこ" in norm_ja or "tomoko" in norm_en:
        return {
            "character": "Tomoko Yamada",
            "primary": "gemini",
            "gemini_voice": "Despina",
            "kenpath_voice": KENPATH_VOICES["aoi"],
            "aivis_key": "f2",
            "aivis_style": "normal",
            "voicevox_id": 16,  # 九州そら
            "base_speed": 0.98,
            "base_pitch": 0.0,
            "base_intonation": 1.05,
        }

    # 4. Taro Yamada (山田 太郎) - Elementary School Boy (8yo)
    # Note: Gemini TTS has only adult male voices; AivisSpeech 'kohaku' & VOICEVOX '満別花丸(ボーイ)' are authentic boy voices
    if "太郎" in norm_ja or "たろう" in norm_ja or "taro" in norm_en:
        return {
            "character": "Taro Yamada (8yo)",
            "primary": "aivis",
            "gemini_voice": "Achird",
            "kenpath_voice": KENPATH_VOICES["ren"],
            "aivis_key": "kohaku",
            "aivis_style": "normal",
            "voicevox_id": 73,  # 満別花丸 (ボーイ)
            "base_speed": 1.03,
            "base_pitch": 0.04,
            "base_intonation": 1.15,
        }

    # 5. Ichiro Yamada (山田 一郎) - IMC Employee, Japan (38, Male)
    if "山田" in norm_ja or "やまだ" in norm_ja or "yamada" in norm_en:
        return {
            "character": "Ichiro Yamada",
            "primary": "gemini",
            "gemini_voice": "Iapetus",
            "kenpath_voice": KENPATH_VOICES["ren"],
            "aivis_key": "ginga",
            "aivis_style": "normal",
            "voicevox_id": 21,  # 剣崎雌雄
            "base_speed": 1.0,
            "base_pitch": 0.0,
            "base_intonation": 1.06,
        }

    # 6. Teresa Santos (テレーザ・サントス) - Elementary School Girl (9yo)
    if "テレーザ" in norm_ja or "teresa" in norm_en:
        return {
            "character": "Teresa Santos (9yo)",
            "primary": "gemini",
            "gemini_voice": "Leda",
            "kenpath_voice": KENPATH_VOICES["mio"],
            "aivis_key": "mao",
            "aivis_style": "sweet",
            "voicevox_id": 46,  # 小夜/SAYO
            "base_speed": 1.02,
            "base_pitch": 0.03,
            "base_intonation": 1.18,
        }

    # 7. Maria Santos (マリア・サントス) - Homemaker, Brazil (Female)
    if "マリア" in norm_ja or "maria" in norm_en:
        return {
            "character": "Maria Santos",
            "primary": "gemini",
            "gemini_voice": "Callirrhoe",
            "kenpath_voice": KENPATH_VOICES["emi"],
            "aivis_key": "mao",
            "aivis_style": "calm",
            "voicevox_id": 20,  # もち子さん
            "base_speed": 0.98,
            "base_pitch": 0.0,
            "base_intonation": 1.06,
        }

    # 8. Jose Santos (ジョゼ・サントス) - Brazil Air Employee (39, Male)
    if "サントス" in norm_ja or "ジョゼ" in norm_ja or "santos" in norm_en or "jose" in norm_en:
        return {
            "character": "Jose Santos",
            "primary": "gemini",
            "gemini_voice": "Orus",
            "kenpath_voice": KENPATH_VOICES["haruto"],
            "aivis_key": "m1",
            "aivis_style": "normal",
            "voicevox_id": 13,  # 青山龍星
            "base_speed": 1.0,
            "base_pitch": 0.0,
            "base_intonation": 1.10,
        }

    # 9. Karina (カリナ) - Fuji University Student, Indonesia (24, Female)
    if "カリナ" in norm_ja or "karina" in norm_en:
        return {
            "character": "Karina",
            "primary": "gemini",
            "gemini_voice": "Aoede",
            "kenpath_voice": KENPATH_VOICES["mio"],
            "aivis_key": "mai",
            "aivis_style": "normal",
            "voicevox_id": 8,  # 春日部つむぎ
            "base_speed": 1.0,
            "base_pitch": 0.0,
            "base_intonation": 1.08,
        }

    # 10. Dr. Wang Xue (ワン・シュエ) - Kobe Hospital Doctor, China (29, Male)
    if "ワン" in norm_ja or "wang" in norm_en:
        return {
            "character": "Dr. Wang Xue",
            "primary": "gemini",
            "gemini_voice": "Enceladus",
            "kenpath_voice": KENPATH_VOICES["ren"],
            "aivis_key": "yukyu",
            "aivis_style": "normal",
            "voicevox_id": 12,  # 白上虎太郎
            "base_speed": 0.98,
            "base_pitch": 0.0,
            "base_intonation": 1.02,
        }

    # 11. Yoshiko Matsumoto (松本 良子) - Wife of IMC Department Manager (Female)
    if "良子" in norm_ja or "よしこ" in norm_ja or "yoshiko" in norm_en:
        return {
            "character": "Yoshiko Matsumoto",
            "primary": "gemini",
            "gemini_voice": "Gacrux",
            "kenpath_voice": KENPATH_VOICES["emi"],
            "aivis_key": "mao",
            "aivis_style": "calm",
            "voicevox_id": 109,  # 東北イタコ
            "base_speed": 0.95,
            "base_pitch": -0.02,
            "base_intonation": 1.03,
        }

    # 12. Tadashi Matsumoto (松本 正) - IMC Department Manager 部長 (Male)
    if "松本" in norm_ja or "まつもと" in norm_ja or "matsumoto" in norm_en:
        return {
            "character": "Tadashi Matsumoto",
            "primary": "gemini",
            "gemini_voice": "Fenrir",
            "kenpath_voice": KENPATH_VOICES["kenta"],
            "aivis_key": "aida",
            "aivis_style": "normal",
            "voicevox_id": 53,  # 麒ヶ島宗麟
            "base_speed": 0.96,
            "base_pitch": 0.0,
            "base_intonation": 1.05,
        }

    # 13. Izumi Kimura (木村 いずみ) - Broadcast Announcer, Japan (Female)
    if "いずみ" in norm_ja or "izumi" in norm_en or ("木村" in norm_ja and "たけし" not in norm_ja):
        return {
            "character": "Izumi Kimura",
            "primary": "gemini",
            "gemini_voice": "Zephyr",
            "kenpath_voice": KENPATH_VOICES["aoi"],
            "aivis_key": "f1",
            "aivis_style": "normal",
            "voicevox_id": 30,  # No.7 (アナウンス)
            "base_speed": 1.0,
            "base_pitch": 0.0,
            "base_intonation": 1.06,
        }

    # 14. Prof. John Watt (ジョン・ワット) - Sakura University Professor, UK (45, Male)
    if "ワット" in norm_ja or "watt" in norm_en:
        return {
            "character": "Prof. John Watt",
            "primary": "gemini",
            "gemini_voice": "Rasalgethi",
            "kenpath_voice": KENPATH_VOICES["haruto"],
            "aivis_key": "shinjou",
            "aivis_style": "normal",
            "voicevox_id": 52,  # 雀松朱司
            "base_speed": 0.97,
            "base_pitch": 0.0,
            "base_intonation": 1.03,
        }

    # 15. Karl Schmidt (カール・シュミット) - Power Electric Engineer, Germany (52, Male)
    if "シュミット" in norm_ja or "schmidt" in norm_en:
        return {
            "character": "Karl Schmidt",
            "primary": "gemini",
            "gemini_voice": "Schedar",
            "kenpath_voice": KENPATH_VOICES["kenta"],
            "aivis_key": "shoujou",
            "aivis_style": "normal",
            "voicevox_id": 51,  # †聖騎士 紅桜†
            "base_speed": 0.97,
            "base_pitch": 0.0,
            "base_intonation": 1.03,
        }

    # 16. Lee Jin-ju (イー・ジンジュ) - AKC Researcher, South Korea (35, Female)
    if "イー" in norm_ja or "ジンジュ" in norm_ja or norm_en in ("lee", "ii", "lee jin-ju", "jin-ju"):
        return {
            "character": "Lee Jin-ju",
            "primary": "gemini",
            "gemini_voice": "Erinome",
            "kenpath_voice": KENPATH_VOICES["aoi"],
            "aivis_key": "morioki",
            "aivis_style": "normal",
            "voicevox_id": 14,  # 冥鳴ひまり
            "base_speed": 1.0,
            "base_pitch": 0.0,
            "base_intonation": 1.05,
        }

    # 17. Gupta (グプタ) - IMC Employee, India (42, Male)
    if "グプタ" in norm_ja or "gupta" in norm_en:
        return {
            "character": "Gupta",
            "primary": "gemini",
            "gemini_voice": "Umbriel",
            "kenpath_voice": KENPATH_VOICES["haruto"],
            "aivis_key": "m2",
            "aivis_style": "normal",
            "voicevox_id": 100,  # 黒沢冴白
            "base_speed": 0.99,
            "base_pitch": 0.0,
            "base_intonation": 1.05,
        }

    # 18. Thawaphon (タワポン) - Japanese Language School Student, Thailand (19, Male)
    if "タワポン" in norm_ja or "thawaphon" in norm_en or "tawapon" in norm_en:
        return {
            "character": "Thawaphon",
            "primary": "gemini",
            "gemini_voice": "Puck",
            "kenpath_voice": KENPATH_VOICES["ren"],
            "aivis_key": "kohaku",
            "aivis_style": "normal",
            "voicevox_id": 12,  # 白上虎太郎
            "base_speed": 1.0,
            "base_pitch": 0.0,
            "base_intonation": 1.06,
        }

    # 19. Tanaka (田中)
    if "田中" in norm_ja or "たなか" in norm_ja or "tanaka" in norm_en:
        return {
            "character": "Tanaka",
            "primary": "gemini",
            "gemini_voice": "Alnilam",
            "kenpath_voice": KENPATH_VOICES["ren"],
            "aivis_key": "tanaka",
            "aivis_style": "normal",
            "voicevox_id": 11,
            "base_speed": 1.0,
            "base_pitch": 0.0,
            "base_intonation": 1.05,
        }

    # 20. Kobayashi (小林)
    if "小林" in norm_ja or "こばやし" in norm_ja or "kobayashi" in norm_en:
        return {
            "character": "Kobayashi",
            "primary": "gemini",
            "gemini_voice": "Sadaltager",
            "kenpath_voice": KENPATH_VOICES["haruto"],
            "aivis_key": "shinjou",
            "aivis_style": "normal",
            "voicevox_id": 52,
            "base_speed": 0.98,
            "base_pitch": 0.0,
            "base_intonation": 1.05,
        }

    # 21. Suzuki / Nakamura / Lopez
    if any(w in norm_ja or w in norm_en for w in ["鈴木", "suzuki", "中村", "nakamura", "ロペス", "lopez"]):
        return {
            "character": speaker_en or "Colleague",
            "primary": "gemini",
            "gemini_voice": "Sadachbia",
            "kenpath_voice": KENPATH_VOICES["ren"],
            "aivis_key": "sawabaru",
            "aivis_style": "normal",
            "voicevox_id": 11,
            "base_speed": 1.0,
            "base_pitch": 0.0,
            "base_intonation": 1.05,
        }

    # 22. TV Host (司会者) / Reporter (レポーター)
    if any(w in norm_ja or w in norm_en for w in ["司会", "host", "レポーター", "reporter"]):
        return {
            "character": speaker_en or "Host/Reporter",
            "primary": "gemini",
            "gemini_voice": "Laomedeia",
            "kenpath_voice": KENPATH_VOICES["mio"],
            "aivis_key": "f1",
            "aivis_style": "cheerful",
            "voicevox_id": 30,
            "base_speed": 1.02,
            "base_pitch": 0.0,
            "base_intonation": 1.12,
        }

    # 23. Elderly Male
    if any(w in norm_en or w in norm_ja for w in ["old man", "おじいさん"]):
        return {
            "character": "Elderly Man",
            "primary": "aivis",
            "gemini_voice": "Fenrir",
            "kenpath_voice": KENPATH_VOICES["kenta"],
            "aivis_key": "rotejin",
            "aivis_style": "normal",
            "voicevox_id": 42,  # ちび式じい
            "base_speed": 0.94,
            "base_pitch": 0.0,
            "base_intonation": 1.0,
        }

    # 24. Elderly / Mature Female
    if any(w in norm_en or w in norm_ja for w in ["old woman", "おばあさん", "landlady", "大家", "mother", "お母さん"]):
        return {
            "character": speaker_en or "Mature Woman",
            "primary": "gemini",
            "gemini_voice": "Vindemiatrix",
            "kenpath_voice": KENPATH_VOICES["emi"],
            "aivis_key": "mao",
            "aivis_style": "calm",
            "voicevox_id": 109,
            "base_speed": 0.94,
            "base_pitch": -0.04,
            "base_intonation": 1.0,
        }

    # 25. Female Staff / Receptionist / Librarian / Nurse / Waitress / Woman
    if any(
        w in norm_en or w in norm_ja
        for w in [
            "receptionist",
            "受付",
            "librarian",
            "図書館",
            "nurse",
            "看護師",
            "waitress",
            "woman",
            "女の人",
            "案内所",
            "ホテル",
        ]
    ):
        return {
            "character": speaker_en or "Female Staff",
            "primary": "gemini",
            "gemini_voice": "Achernar",
            "kenpath_voice": KENPATH_VOICES["aoi"],
            "aivis_key": "f1",
            "aivis_style": "normal",
            "voicevox_id": 2,
            "base_speed": 1.0,
            "base_pitch": 0.0,
            "base_intonation": 1.06,
        }

    # 26. Store Attendant / Clerk / Bank Clerk / Post Office Clerk / Waiter / Cashier / Staff
    if any(
        w in norm_en or w in norm_ja
        for w in [
            "clerk",
            "店員",
            "店の人",
            "みせのひと",
            "係員",
            "銀行員",
            "郵便局員",
            "attendant",
            "waiter",
            "cashier",
            "staff",
        ]
    ) and "station" not in norm_en and "駅" not in norm_ja:
        return {
            "character": speaker_en or "Service Clerk",
            "primary": "gemini",
            "gemini_voice": "Autonoe",
            "kenpath_voice": KENPATH_VOICES["mio"],
            "aivis_key": "f1",
            "aivis_style": "normal",
            "voicevox_id": 8,
            "base_speed": 1.0,
            "base_pitch": 0.0,
            "base_intonation": 1.06,
        }

    # 27. Doctor / Dentist / Caretaker / Driver / Real Estate Agent / Station Staff / Police
    if any(
        w in norm_en or w in norm_ja
        for w in [
            "doctor",
            "医者",
            "dentist",
            "歯医者",
            "caretaker",
            "管理人",
            "driver",
            "運転手",
            "real estate",
            "不動産",
            "station",
            "駅員",
            "police",
            "警官",
            "man",
            "男の人",
        ]
    ):
        return {
            "character": speaker_en or "Professional Male",
            "primary": "gemini",
            "gemini_voice": "Zubenelgenubi",
            "kenpath_voice": KENPATH_VOICES["kenta"],
            "aivis_key": "aida",
            "aivis_style": "normal",
            "voicevox_id": 53,
            "base_speed": 0.97,
            "base_pitch": 0.0,
            "base_intonation": 1.04,
        }

    # Default fallback
    return {
        "character": speaker_en or "Speaker",
        "primary": "gemini",
        "gemini_voice": "Puck",
        "kenpath_voice": KENPATH_VOICES["ren"],
        "aivis_key": "fumifumi",
        "aivis_style": "normal",
        "voicevox_id": 11,
        "base_speed": 1.0,
        "base_pitch": 0.0,
        "base_intonation": 1.05,
    }


# ---------------------------------------------------------------------------
# 3. Kenpath Labs Credit & Voice Auditor
# ---------------------------------------------------------------------------

def check_kenpath_status(kenpath_key):
    if not kenpath_key:
        return {"available": False, "characters_remaining": 0, "voices_count": 0}
    try:
        req = urllib.request.Request(
            f"{KENPATH_BASE_URL}/v1/usage",
            headers={"Authorization": f"Bearer {kenpath_key}", "User-Agent": "KanaGame/1.0"},
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            usage = json.loads(resp.read().decode("utf-8"))
        rem = int(usage.get("balance", {}).get("characters_remaining", 0))
        plan_name = usage.get("plan", {}).get("name", "Starter")
        return {"available": rem > 100, "characters_remaining": rem, "plan": plan_name}
    except Exception as e:
        print(f"[WARN] Kenpath Labs API check failed: {e}")
        return {"available": False, "characters_remaining": 0, "plan": "Unknown"}


def is_local_engine_running(base_url, retries=3):
    for _ in range(retries):
        try:
            with urllib.request.urlopen(f"{base_url}/version", timeout=2) as r:
                if r.status == 200:
                    return True
        except Exception:
            time.sleep(0.5)
    return False


def clean_spoken_text(raw):
    cleaned = re.sub(r"（[^）]*）", "", raw or "")
    cleaned = re.sub(r"\([^)]*\)", "", cleaned)
    cleaned = re.sub(r"[「」『』\[\]]", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


# ---------------------------------------------------------------------------
# 4. Gemini Emotion Director (1 Batch JSON Call per Lesson)
# ---------------------------------------------------------------------------

def load_emotion_cache():
    if os.path.exists(EMOTION_CACHE_PATH):
        try:
            with open(EMOTION_CACHE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_emotion_cache(cache):
    os.makedirs(os.path.dirname(EMOTION_CACHE_PATH), exist_ok=True)
    with open(EMOTION_CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)


def heuristic_emotion_annotation(text_ja, text_en=""):
    """Deterministic fallback annotation when offline."""
    cleaned = clean_spoken_text(text_ja)
    style = "normal"
    speed = 1.0
    intonation = 1.05
    tempo_dynamics = 1.05

    if "！" in cleaned or "!" in text_en:
        style = "cheerful"
        speed = 1.03
        intonation = 1.22
        tempo_dynamics = 1.25
    elif "？" in cleaned or "?" in text_en or cleaned.endswith("か。"):
        style = "normal"
        speed = 0.99
        intonation = 1.18
        tempo_dynamics = 1.12
    elif any(w in cleaned for w in ["すみません", "ごめん", "失礼", "残念", "ちょっと…", "大変"]):
        style = "calm"
        speed = 0.94
        intonation = 1.02
        tempo_dynamics = 0.95
    elif any(w in cleaned for w in ["ありがとう", "どうぞ", "いらっしゃい", "よろしく", "おかげさまで"]):
        style = "warm"
        speed = 0.97
        intonation = 1.12
        tempo_dynamics = 1.10

    return {
        "style": style,
        "phrasedJa": cleaned,
        "speedScale": speed,
        "intonationScale": intonation,
        "tempoDynamicsScale": tempo_dynamics,
    }


director_key_idx = 0


def annotate_lesson_emotions(book_id, lesson_num, lesson_tasks, gemini_keys, cache):
    """
    Makes 1 batch JSON call per lesson to Gemini Flash-Lite to annotate every dialogue line
    with { style, phrasedJa, speedScale, intonationScale, tempoDynamicsScale }.
    """
    global director_key_idx
    missing_tasks = [t for t in lesson_tasks if f"{t['sceneId']}-{t['lineIndex']}" not in cache]
    if not missing_tasks:
        return cache

    if not gemini_keys:
        for t in missing_tasks:
            key_id = f"{t['sceneId']}-{t['lineIndex']}"
            cache[key_id] = heuristic_emotion_annotation(t["ja"], t.get("en", ""))
        return cache

    lines_payload = []
    for t in lesson_tasks:
        key_id = f"{t['sceneId']}-{t['lineIndex']}"
        lines_payload.append({
            "id": key_id,
            "speaker": t["speaker"],
            "setting": t["setting"],
            "ja": clean_spoken_text(t["ja"]),
            "en": t.get("en", ""),
        })

    prompt = (
        "You are a Japanese voice acting director for Minna no Nihongo textbook dialogues.\n"
        "For each line in the JSON input, output a JSON array of objects with exact fields:\n"
        "- \"id\": same string id from input\n"
        "- \"style\": one of [\"normal\", \"warm\", \"cheerful\", \"calm\", \"sweet\", \"surprise\", \"sad\", \"angry\", \"whisper\"]\n"
        "- \"speedScale\": float between 0.92 and 1.06 (0.93-0.96 for polite bows/apologies/thinking, 1.02-1.06 for excitement)\n"
        "- \"intonationScale\": float between 0.95 and 1.35 (higher 1.15-1.30 for questions/exclamations/greetings)\n"
        "- \"tempoDynamicsScale\": float between 0.85 and 1.40 (expressive breath & rhythm curve)\n\n"
        f"Input Lines:\n{json.dumps(lines_payload, ensure_ascii=False)}"
    )

    max_director_tries = min(2, len(gemini_keys))
    for attempt in range(max_director_tries):
        api_key = gemini_keys[(director_key_idx + attempt) % len(gemini_keys)]
        model = GEMINI_DIRECTOR_MODELS[attempt % len(GEMINI_DIRECTOR_MODELS)]
        url = f"{GEMINI_BASE_URL}/{model}:generateContent?key={api_key}"
        body = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.2,
            },
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            director_key_idx = (director_key_idx + attempt + 1) % len(gemini_keys)
            raw_json = data["candidates"][0]["content"]["parts"][0]["text"]
            parsed = json.loads(raw_json)
            if isinstance(parsed, list):
                task_ja_map = {f"{t['sceneId']}-{t['lineIndex']}": clean_spoken_text(t["ja"]) for t in lesson_tasks}
                for item in parsed:
                    lid = item.get("id")
                    if lid:
                        cache[lid] = {
                            "style": item.get("style", "normal"),
                            "phrasedJa": clean_spoken_text(item.get("phrasedJa") or task_ja_map.get(lid, "")),
                            "speedScale": max(0.88, min(1.10, float(item.get("speedScale", 1.0)))),
                            "intonationScale": max(0.90, min(1.40, float(item.get("intonationScale", 1.05)))),
                            "tempoDynamicsScale": max(0.80, min(1.50, float(item.get("tempoDynamicsScale", 1.05)))),
                        }
                save_emotion_cache(cache)
                print(f"  [Director] Annotated Lesson {lesson_num} ({len(parsed)} lines) via {model}")
                return cache
        except Exception:
            continue

    # Fallback to heuristics if all director calls fail
    for t in missing_tasks:
        key_id = f"{t['sceneId']}-{t['lineIndex']}"
        cache[key_id] = heuristic_emotion_annotation(t["ja"], t.get("en", ""))
    return cache


# ---------------------------------------------------------------------------
# 5. Broadcast Loudness Normalizer (-16 LUFS, 48kHz Mono Opus)
# ---------------------------------------------------------------------------

def transcode_and_normalize_opus(input_bytes, input_format, out_opus_path, extra_filter=None):
    """
    Passes audio through ffmpeg loudnorm=I=-16:TP=-1.5:LRA=11 and outputs 48kHz mono Opus.
    input_format: 'wav', 's16le_24k', or 'opus'
    """
    os.makedirs(os.path.dirname(out_opus_path), exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=f".{input_format}", delete=False) as tmp_in:
        tmp_in.write(input_bytes)
        tmp_in_path = tmp_in.name

    try:
        filters = []
        if extra_filter:
            filters.append(extra_filter)
        filters.append("loudnorm=I=-16:TP=-1.5:LRA=11")
        af_chain = ",".join(filters)

        cmd = ["ffmpeg", "-y", "-loglevel", "error"]
        if input_format == "s16le_24k":
            cmd += ["-f", "s16le", "-ar", "24000", "-ac", "1", "-i", tmp_in_path]
        else:
            cmd += ["-i", tmp_in_path]

        cmd += [
            "-af", af_chain,
            "-ac", "1",
            "-ar", "48000",
            "-c:a", "libopus",
            "-b:a", "48k",
            "-vbr", "on",
            out_opus_path,
        ]
        subprocess.run(cmd, check=True)
        return os.path.exists(out_opus_path) and os.path.getsize(out_opus_path) > 400
    except Exception:
        return False
    finally:
        if os.path.exists(tmp_in_path):
            try:
                os.unlink(tmp_in_path)
            except Exception:
                pass


# ---------------------------------------------------------------------------
# 6. Four TTS Engine Synthesizers
# ---------------------------------------------------------------------------

tts_key_idx = 0
tts_model_idx = 0
bucket_cooldown_until = {}  # (key_idx, model_name) -> unix timestamp when bucket can be tried again
gemini_lock = threading.Lock()
kenpath_lock = threading.Lock()
aivis_lock = threading.Lock()
seen_aivis_speakers = set()


def synthesize_with_gemini(spoken_ja, voice_name, out_opus_path, gemini_keys):
    """
    Synthesizes with Gemini TTS rotating across all 10 keys and 3 TTS models.
    Uses a rolling 45s cooldown per (key, model) bucket on temporary RPM 429s
    so Gemini TTS automatically resumes as soon as the 1-minute window resets.
    Returns (success: bool, engine_label: str)
    """
    global tts_key_idx, tts_model_idx
    if not gemini_keys:
        return False, "no-gemini-keys"

    total_keys = len(gemini_keys)
    total_models = len(GEMINI_TTS_MODELS)

    with gemini_lock:
        start_k = tts_key_idx
        tts_key_idx = (tts_key_idx + 1) % total_keys

    now = time.time()
    for m_offset in range(total_models):
        m_idx = (tts_model_idx + m_offset) % total_models
        model = GEMINI_TTS_MODELS[m_idx]

        for k_offset in range(total_keys):
            k_idx = (start_k + k_offset) % total_keys
            api_key = gemini_keys[k_idx]

            with gemini_lock:
                if bucket_cooldown_until.get((k_idx, model), 0) > time.time():
                    continue

            url = f"{GEMINI_BASE_URL}/{model}:generateContent?key={api_key}"
            body = {
                "contents": [{"parts": [{"text": spoken_ja}]}],
                "generationConfig": {
                    "responseModalities": ["AUDIO"],
                    "speechConfig": {
                        "voiceConfig": {
                            "prebuiltVoiceConfig": {"voiceName": voice_name}
                        }
                    },
                },
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(body).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            try:
                with urllib.request.urlopen(req, timeout=16) as resp:
                    data = json.loads(resp.read().decode("utf-8"))

                part = (
                    data.get("candidates", [{}])[0]
                    .get("content", {})
                    .get("parts", [{}])[0]
                )
                inline = part.get("inlineData", {})
                b64_data = inline.get("data")
                if not b64_data:
                    continue

                raw_bytes = base64.b64decode(b64_data)
                mime = (inline.get("mimeType") or "").lower()
                fmt = "wav" if "wav" in mime else "s16le_24k"

                extra_f = None
                if voice_name == "Vindemiatrix":
                    extra_f = "asetrate=24000*0.88,aresample=24000,atempo=0.98"

                ok = transcode_and_normalize_opus(raw_bytes, fmt, out_opus_path, extra_filter=extra_f)
                if ok:
                    return True, f"Gemini({model}:key{k_idx + 1}:{voice_name})"
            except urllib.error.HTTPError as e:
                if e.code == 429:
                    err_txt = ""
                    try:
                        err_txt = e.read().decode("utf-8", errors="ignore")
                    except Exception:
                        pass
                    # If daily quota exceeded, cool down for 1 hour; if per-minute RPM limit, cool down for 40s
                    cooldown_sec = 3600 if ("PerDay" in err_txt or "daily" in err_txt.lower()) else 40
                    with gemini_lock:
                        bucket_cooldown_until[(k_idx, model)] = time.time() + cooldown_sec
                    continue
                else:
                    continue
            except Exception:
                continue

    return False, "gemini-cooling-down"


def synthesize_with_kenpath(spoken_ja, voice_id, out_opus_path, kenpath_key, kenpath_state):
    with kenpath_lock:
        if not kenpath_key or not kenpath_state.get("available"):
            return False, "kenpath-disabled"
        if kenpath_state.get("characters_remaining", 0) < len(spoken_ja) + 50:
            kenpath_state["available"] = False
            return False, "kenpath-no-credits"
        kenpath_state["characters_remaining"] -= len(spoken_ja)

    url = f"{KENPATH_BASE_URL}/v1/audio/speech"
    body = {
        "input": spoken_ja,
        "voice": voice_id,
        "response_format": "opus",
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {kenpath_key}",
            "Content-Type": "application/json",
            "User-Agent": "KanaGame/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=18) as resp:
            raw_bytes = resp.read()
        if not raw_bytes:
            return False, "kenpath-empty"
        ok = transcode_and_normalize_opus(raw_bytes, "opus", out_opus_path)
        if ok:
            return True, f"Kenpath({voice_id})"
    except Exception:
        pass
    return False, "kenpath-failed"


def unload_aivis_models():
    """Unloads loaded AIVM models in AivisSpeech to keep memory clean."""
    try:
        with urllib.request.urlopen(f"{AIVIS_URL}/aivm_models", timeout=5) as r:
            models = json.loads(r.read().decode("utf-8"))
        for uuid, info in models.items():
            if info.get("is_loaded"):
                req = urllib.request.Request(f"{AIVIS_URL}/aivm_models/{uuid}/unload", method="POST")
                urllib.request.urlopen(req, timeout=5).close()
    except Exception:
        pass


def synthesize_with_aivis(spoken_ja, profile, emotion_meta, out_opus_path):
    with aivis_lock:
        if profile["aivis_key"] not in seen_aivis_speakers:
            if len(seen_aivis_speakers) >= 2:
                unload_aivis_models()
                seen_aivis_speakers.clear()
            seen_aivis_speakers.add(profile["aivis_key"])

        style_id = resolve_aivis_style_id(
            profile["aivis_key"],
            profile["aivis_style"],
            emotion_meta.get("style", "normal"),
        )
        try:
            q_url = f"{AIVIS_URL}/audio_query?text={urllib.parse.quote(spoken_ja)}&speaker={style_id}"
            req1 = urllib.request.Request(q_url, method="POST")
            with urllib.request.urlopen(req1, timeout=20) as resp1:
                query_data = json.loads(resp1.read().decode("utf-8"))

            query_data["speedScale"] = round(
                profile["base_speed"] * float(emotion_meta.get("speedScale", 1.0)), 3
            )
            query_data["pitchScale"] = profile["base_pitch"]
            query_data["intonationScale"] = round(
                float(emotion_meta.get("intonationScale", profile["base_intonation"])), 3
            )
            if "tempoDynamicsScale" in query_data:
                query_data["tempoDynamicsScale"] = round(
                    float(emotion_meta.get("tempoDynamicsScale", 1.05)), 3
                )

            s_url = f"{AIVIS_URL}/synthesis?speaker={style_id}"
            req2 = urllib.request.Request(
                s_url,
                data=json.dumps(query_data).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req2, timeout=45) as resp2:
                wav_bytes = resp2.read()

            ok = transcode_and_normalize_opus(wav_bytes, "wav", out_opus_path)
            if ok:
                sp_name = AIVIS_SPEAKERS[profile["aivis_key"]]["name"]
                return True, f"Aivis({sp_name}:{style_id})"
        except Exception:
            pass
        return False, "aivis-failed"


def synthesize_with_voicevox(spoken_ja, profile, emotion_meta, out_opus_path):
    style_id = profile["voicevox_id"]
    try:
        q_url = f"{VOICEVOX_URL}/audio_query?text={urllib.parse.quote(spoken_ja)}&speaker={style_id}"
        req1 = urllib.request.Request(q_url, method="POST")
        with urllib.request.urlopen(req1, timeout=15) as resp1:
            query_data = json.loads(resp1.read().decode("utf-8"))

        query_data["speedScale"] = round(
            profile["base_speed"] * float(emotion_meta.get("speedScale", 1.0)), 3
        )
        query_data["pitchScale"] = profile["base_pitch"]
        query_data["intonationScale"] = round(
            float(emotion_meta.get("intonationScale", profile["base_intonation"])), 3
        )

        s_url = f"{VOICEVOX_URL}/synthesis?speaker={style_id}"
        req2 = urllib.request.Request(
            s_url,
            data=json.dumps(query_data).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req2, timeout=30) as resp2:
            wav_bytes = resp2.read()

        ok = transcode_and_normalize_opus(wav_bytes, "wav", out_opus_path)
        if ok:
            return True, f"VOICEVOX(id={style_id})"
    except Exception:
        pass
    return False, "voicevox-failed"


# ---------------------------------------------------------------------------
# 7. Hybrid Multi-Engine Router
# ---------------------------------------------------------------------------

def synthesize_hybrid_line(task, profile, emotion_meta, gemini_keys, aivis_up, voicevox_up):
    raw_cleaned = clean_spoken_text(task["ja"])
    phrased = clean_spoken_text(emotion_meta.get("phrasedJa") or raw_cleaned)
    # Guard against director hallucinating different length text
    spoken_ja = phrased if (phrased and abs(len(phrased) - len(raw_cleaned)) <= 6) else raw_cleaned

    out_abs = task["outAbs"]

    # Speechless / ellipsis line handling
    if not spoken_ja or not re.sub(r"[…・。、\s]", "", spoken_ja):
        os.makedirs(os.path.dirname(out_abs), exist_ok=True)
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono",
                "-t", "0.5", "-c:a", "libopus", "-b:a", "48k", out_abs,
            ],
            check=True,
        )
        return True, "Silence(0.5s)"

    # Engine Priority Order based on Character Profile (Gemini TTS -> AivisSpeech -> VOICEVOX)
    if profile["primary"] == "aivis":
        engine_order = ["aivis", "gemini", "voicevox"]
    else:
        engine_order = ["gemini", "aivis", "voicevox"]

    for eng in engine_order:
        if eng == "gemini":
            ok, label = synthesize_with_gemini(spoken_ja, profile["gemini_voice"], out_abs, gemini_keys)
            if ok:
                return True, label
        elif eng == "aivis" and aivis_up:
            ok, label = synthesize_with_aivis(spoken_ja, profile, emotion_meta, out_abs)
            if ok:
                return True, label
        elif eng == "voicevox" and voicevox_up:
            ok, label = synthesize_with_voicevox(spoken_ja, profile, emotion_meta, out_abs)
            if ok:
                return True, label

    return False, "ALL_ENGINES_FAILED"


# ---------------------------------------------------------------------------
# 8. Main Pipeline
# ---------------------------------------------------------------------------

def main():
    print("=" * 76)
    print("  Hybrid 3-Engine Dialogue Audio Generator (Gemini TTS + AivisSpeech + VOICEVOX)")
    print("=" * 76)

    gemini_keys, _ = load_env_keys()
    aivis_up = is_local_engine_running(AIVIS_URL)
    voicevox_up = is_local_engine_running(VOICEVOX_URL)

    print(f"  [1] Gemini TTS Pool   : {len(gemini_keys)} API keys x {len(GEMINI_TTS_MODELS)} models = {len(gemini_keys) * len(GEMINI_TTS_MODELS)} buckets")
    print(f"  [2] AivisSpeech Local : {'ONLINE' if aivis_up else 'OFFLINE'} ({AIVIS_URL}, 18 neural speakers)")
    print(f"  [3] VOICEVOX Local    : {'ONLINE' if voicevox_up else 'OFFLINE'} ({VOICEVOX_URL}, 44 speakers)")
    print("=" * 76)

    only_mnn = "--mnn" in sys.argv
    force = "--force" in sys.argv
    lesson_filter = None
    for arg in sys.argv[1:]:
        if arg.startswith("--lesson="):
            lesson_filter = int(arg.split("=", 1)[1])

    books = [
        {"id": "mnn-1", "file": "public/data/v1/books/mnn-1.json"},
        {"id": "genki-1", "file": "public/data/v1/books/genki-1.json"},
        {"id": "genki-2", "file": "public/data/v1/books/genki-2.json"},
    ]
    if only_mnn:
        books = [b for b in books if b["id"] == "mnn-1"]

    tasks_by_lesson = {}
    total_queued = 0

    for b in books:
        if not os.path.exists(b["file"]):
            continue
        with open(b["file"], "r", encoding="utf-8") as f:
            book_data = json.load(f)

        for lesson in book_data.get("lessons", []):
            l_num = lesson["lessonNumber"]
            if lesson_filter is not None and l_num != lesson_filter:
                continue

            for scene in lesson.get("dialogues", []) or []:
                s_id = scene["id"]
                setting = scene.get("setting", "")
                for idx, line in enumerate(scene.get("lines", [])):
                    out_rel = f"/audio/books/dialogues/{b['id']}/{s_id}-{idx}.opus"
                    out_abs = os.path.join(os.getcwd(), f"public{out_rel}")
                    if not force and os.path.exists(out_abs) and os.path.getsize(out_abs) > 500:
                        continue
                    t = {
                        "bookId": b["id"],
                        "bookFile": b["file"],
                        "lesson": l_num,
                        "sceneId": s_id,
                        "lineIndex": idx,
                        "speaker": line.get("speaker", ""),
                        "speakerJa": line.get("speakerJa", ""),
                        "ja": line.get("ja", ""),
                        "en": line.get("en", ""),
                        "setting": setting,
                        "outRel": out_rel,
                        "outAbs": out_abs,
                    }
                    tasks_by_lesson.setdefault((b["id"], b["file"], l_num), []).append(t)
                    total_queued += 1

    print(f"\nQueued {total_queued} dialogue lines across {len(tasks_by_lesson)} lessons.\n")
    if total_queued == 0:
        print("All requested dialogue audio clips are already synthesized!")
        return

    emotion_cache = load_emotion_cache()

    interrupted = False
    def handle_sigint(sig, frame):
        nonlocal interrupted
        print("\n[PAUSE] Received Ctrl+C. Finishing current line and saving progress...")
        interrupted = True

    signal.signal(signal.SIGINT, handle_sigint)

    success_count = 0
    processed_count = 0
    start_time = time.time()
    engine_stats = {}
    max_workers = 5
    for arg in sys.argv[1:]:
        if arg.startswith("--workers="):
            max_workers = max(1, int(arg.split("=", 1)[1]))

    for (book_id, book_file, l_num), lesson_tasks in sorted(tasks_by_lesson.items(), key=lambda x: x[0][2]):
        if interrupted:
            break

        print(f"--- {book_id.upper()} Lesson {l_num} ({len(lesson_tasks)} lines, workers={max_workers}) ---")
        # Step 1: Run 1 Batch Gemini Emotion Director Call for this lesson
        emotion_cache = annotate_lesson_emotions(book_id, l_num, lesson_tasks, gemini_keys, emotion_cache)

        lesson_updated = False

        def process_one_task(task):
            if interrupted:
                return task, None, None, False, "INTERRUPTED"
            key_id = f"{task['sceneId']}-{task['lineIndex']}"
            emotion_meta = emotion_cache.get(key_id) or heuristic_emotion_annotation(task["ja"], task["en"])
            profile = map_character_profile(task["speaker"], task["speakerJa"])
            ok, engine_label = synthesize_hybrid_line(
                task,
                profile,
                emotion_meta,
                gemini_keys,
                aivis_up,
                voicevox_up,
            )
            return task, profile, emotion_meta, ok, engine_label

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(process_one_task, t) for t in lesson_tasks]
            for fut in as_completed(futures):
                if interrupted:
                    break
                processed_count += 1
                try:
                    task, profile, emotion_meta, ok, engine_label = fut.result()
                    if ok:
                        success_count += 1
                        lesson_updated = True
                        eng_prefix = engine_label.split("(")[0]
                        engine_stats[eng_prefix] = engine_stats.get(eng_prefix, 0) + 1
                        elapsed = max(0.1, time.time() - start_time)
                        rate = (success_count / elapsed) * 60
                        style_tag = emotion_meta.get("style", "normal")
                        print(
                            f"  [{processed_count}/{total_queued}] ({rate:.1f}/m) "
                            f"{task['sceneId']}-{task['lineIndex']} | {profile['character']} [{style_tag}] -> {engine_label}"
                        )
                    else:
                        print(f"  [FAIL] {task['sceneId']}-{task['lineIndex']} ({engine_label})")
                except Exception as err:
                    print(f"  [ERROR] {err}")

        # Step 2: Persist audioSrc into book JSON after each lesson completes
        if lesson_updated and os.path.exists(book_file):
            with open(book_file, "r", encoding="utf-8") as f:
                b_data = json.load(f)
            changed = False
            for lesson in b_data.get("lessons", []):
                for scene in lesson.get("dialogues", []) or []:
                    s_id = scene["id"]
                    all_ready = True
                    for idx, line in enumerate(scene.get("lines", [])):
                        rel_p = f"/audio/books/dialogues/{book_id}/{s_id}-{idx}.opus"
                        abs_p = os.path.join(os.getcwd(), f"public{rel_p}")
                        if os.path.exists(abs_p) and os.path.getsize(abs_p) > 400:
                            if line.get("audioSrc") != rel_p:
                                line["audioSrc"] = rel_p
                                changed = True
                        else:
                            all_ready = False
                    if all_ready and not scene.get("hasAudio"):
                        scene["hasAudio"] = True
                        changed = True
            if changed:
                with open(book_file, "w", encoding="utf-8") as f:
                    json.dump(b_data, f, ensure_ascii=False, indent=2)
                    f.write("\n")

    print("\n" + "=" * 76)
    print(f"Done! Synthesized {success_count}/{total_queued} dialogue clips.")
    print(f"Engine Breakdown: {json.dumps(engine_stats)}")
    print("=" * 76)


if __name__ == "__main__":
    main()
