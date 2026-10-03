# CreatorAi — Person 4 AI Pipeline

This starter package contains the AI-side modules for:
1. Video -> timestamped transcript
2. Transcript -> important moments
3. Important moments -> clip generation
4. Clip -> hooks
5. Clip -> captions
6. Clip -> title/description
7. Platform adaptation
8. End-to-end pipeline orchestration

## Setup

Use Python 3.10.x and your existing virtual environment.

```bash
source venv/bin/activate
pip install -r requirements.txt
```

FFmpeg must be available as `ffmpeg` on PATH.

## Quick transcription test

Put a short video at:

`test.mp4`

Then run:

```bash
python test_transcription.py
```

The first Whisper run downloads the selected model.

## Architecture

The modules are deliberately independent of FastAPI. Person 3's backend can call `ai.pipeline.CreatorAIPipeline`.

The LLM generation functions are deterministic placeholders for now. Replace them with the project's chosen LLM/API once credentials and the final backend contract are agreed.
