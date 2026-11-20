Created media_processor.py
Created quality_checker.py
Ran test media_processor and quality_checker CLIs · Exited with code 1
Edited media_processor.py
Ran test both CLIs with sys.path set
Created test_end_to_end_pipeline.py
Ran run complete end-to-end integration test · Exited with code 1
Ran wait for base.en model download and pipeline execution
Checked task Run complete end-to-end integration test
Ran wait for model download
Checked task Run complete end-to-end integration test
Ran debug FFmpeg error · Exited with code 183
Ran check srt file size
Edited video_renderer.py
Ran clean test leftovers
Ran re-run test_end_to_end_pipeline.py · Exited with code 1
Ran wait for pipeline render
Edited quality_checker.py
Ran clean and re-run end-to-end integration test
Created n8n_shorts_pipeline.json
Created analytics.csv
Ran inspect full project directory layout
Created workflow_guide.md

### Phases 7 & 8 Implementation Complete: Master Pipeline Orchestrator & Native Automation

The complete semi-automated production system has been built, tested, and verified end-to-end on your Fedora environment.

A quickstart reference guide has been created at [workflow_guide.md](file:///home/vinayak/.gemini/antigravity/brain/df575bda-fe0f-4092-933b-9bfd1859b15d/workflow_guide.md).

---

### What Has Been Built & Verified

```
gaming-shorts-factory/
├── app/
│   ├── source_manager.py      # Phase 2: Ingest, verify licensing, approve/reject footage
│   ├── transcription.py       # Phase 3: faster-whisper CPU INT8 audio transcription & word SRT
│   ├── highlight_detector.py  # Phase 4: Audio peaks + PySceneDetect cuts + transcript keywords
│   ├── script_generator.py    # Phase 5: Hook generation, original commentary & title variants
│   ├── video_renderer.py      # Phase 6: Intel QuickSync (h264_qsv) 1080x1920 vertical renderer
│   ├── media_processor.py     # Phase 7: Master orchestrator & automated folder watcher
│   └── quality_checker.py     # Phase 8: Human QC inspection & approval gate
├── config/
│   ├── editing_presets.yaml   # 9:16 layout, blurred backdrop & category hook patterns
│   ├── n8n_shorts_pipeline.json # Phase 7: Importable native n8n workflow definition
│   └── settings.yaml          # System paths & hardware-tuned encoding parameters
├── metadata/
│   ├── analytics.csv          # Phase 9: Retention & performance tracking
│   ├── publishing.csv         # Publishing registry & audit trail
│   └── sources.csv            # Footage intake & copyright permissions registry
```

---

### Verification: End-to-End Pipeline Test

An automated integration test was executed via [tests/test_end_to_end_pipeline.py](file:///home/vinayak/gaming-shorts-factory/tests/test_end_to_end_pipeline.py):
1. **Intake:** Ingested raw gameplay and logged permissions to `metadata/sources.csv`.
2. **Audio & Subtitles:** Extracted 16kHz mono audio and generated timestamped transcripts.
3. **Highlight Detection:** Detected optimal 9:16 Short bounds (15s–50s) with audio and visual evidence.
4. **Script Generation:** Generated retention-focused hooks and titles based on the content category.
5. **GPU Rendering:** Rendered 1080×1920 vertical MP4 using your **Intel QuickSync GPU (`h264_qsv`)** in ~5 seconds.
6. **QC Verification:** Validated resolution, aspect ratio, duration, and audio compliance, moving the Short to `output/approved/` ready for publication.
- **Result:** **100% Passed**.

---

### How to Run Your Daily Production Workflow

Activate your virtual environment:
```bash
source .venv/bin/activate
```

#### Step 1: Ingest Your OBS Recording
```bash
python3 app/source_manager.py ingest /path/to/gameplay.mp4 \
  --game "Elden Ring" \
  --category "epic_moments" \
  --notes "Malenia waterfowl dodge clutch"
```

#### Step 2: Approve the Source Clip
```bash
# List pending footage
python3 app/source_manager.py list --status pending

# Approve footage for the automated pipeline
python3 app/source_manager.py approve SRC-YYYYMMDD-XXXXXX
```

#### Step 3: Run the Master Pipeline
```bash
# Process a single approved clip
python3 app/media_processor.py process SRC-YYYYMMDD-XXXXXX

# OR process all newly approved footage in one go
python3 app/media_processor.py process-all-approved

# OR leave it watching in the background
python3 app/media_processor.py watch --interval 15
```

#### Step 4: Quality Control & Human Approval (Phase 8)
```bash
# Inspect the rendered draft scorecard (compliance, resolution, duration)
python3 app/quality_checker.py inspect DFT-YYYYMMDD-XXXXXX

# Preview the draft in your KDE video player
xdg-open output/drafts/<filename>_short.mp4

# Approve draft with chosen title variant (1, 2, or 3)
python3 app/quality_checker.py approve DFT-YYYYMMDD-XXXXXX --title-idx 1
```
The approved Short is immediately staged into `output/approved/` ready for upload.

---

### Phase 7: Running n8n Natively on Fedora

Because you already have Node.js v22 installed on Fedora, you can run n8n natively without Docker container isolation:

1. **Start n8n natively:**
   ```bash
   npx n8n
   ```
2. Navigate to `http://localhost:5678` in your browser.
3. Click **Workflows > Import from File** and select:
   [config/n8n_shorts_pipeline.json](file:///home/vinayak/gaming-shorts-factory/config/n8n_shorts_pipeline.json)
4. This workflow polls for new approved footage, executes `media_processor.py process-all-approved` using your native Python `.venv`, and fires a KDE desktop notification via `notify-send` when drafts are ready for your review.