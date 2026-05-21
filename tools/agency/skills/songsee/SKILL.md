---
name: songsee
description: "Audio spectrograms/features (mel, chroma, MFCC) via CLI."
metadata:
  category: media
  emoji: "🎶"
  color: "pink"
  vibe: "Content is king."
  original_name: "songsee"
  source: "Hermes Agent by Nous Research"
  author: "Nous Research"
  url: "https://github.com/nousresearch/hermes-agent"
  hermes_skill: true
---

## 🎛️ DEPUTY CHIEF OF STAFF REPORTING PROTOCOL

> **PRIORITY DIRECTIVE**: If this task was assigned to you by the `agents-orchestrator` (🎛️ Deputy Chief of Staff), treat it as **HIGHEST PRIORITY** and execute immediately.

### Upon Task Completion, you MUST:

1. **Report BACK to the Deputy Chief of Staff** (`agents-orchestrator`) with:
   - Task completion status (`✅ COMPLETE` / `⚠️ PARTIAL` / `❌ FAILED`)
   - Summary of outputs produced
   - Any blockers encountered and how they were resolved
   - Files created or modified (full paths)
   - Quality assessment of your own output

2. **Escalate to the Chief of Staff** (`rudrax-chief-of-staff`) if:
   - The task requires cross-domain coordination beyond your scope
   - You encounter a blocker the Deputy cannot resolve

---

# songsee

Generate spectrograms and multi-panel audio feature visualizations from audio files.

## Prerequisites

Requires [Go](https://go.dev/doc/install):
```bash
go install github.com/steipete/songsee/cmd/songsee@latest
```

Optional: `ffmpeg` for formats beyond WAV/MP3.

## Quick Start

```bash
# Basic spectrogram
songsee track.mp3

# Save to specific file
songsee track.mp3 -o spectrogram.png

# Multi-panel visualization grid
songsee track.mp3 --viz spectrogram,mel,chroma,hpss,selfsim,loudness,tempogram,mfcc,flux

# Time slice (start at 12.5s, 8s duration)
songsee track.mp3 --start 12.5 --duration 8 -o slice.jpg

# From stdin
cat track.mp3 | songsee - --format png -o out.png
```

## Visualization Types

Use `--viz` with comma-separated values:

| Type | Description |
|------|-------------|
| `spectrogram` | Standard frequency spectrogram |
| `mel` | Mel-scaled spectrogram |
| `chroma` | Pitch class distribution |
| `hpss` | Harmonic/percussive separation |
| `selfsim` | Self-similarity matrix |
| `loudness` | Loudness over time |
| `tempogram` | Tempo estimation |
| `mfcc` | Mel-frequency cepstral coefficients |
| `flux` | Spectral flux (onset detection) |

Multiple `--viz` types render as a grid in a single image.

## Common Flags

| Flag | Description |
|------|-------------|
| `--viz` | Visualization types (comma-separated) |
| `--style` | Color palette: `classic`, `magma`, `inferno`, `viridis`, `gray` |
| `--width` / `--height` | Output image dimensions |
| `--window` / `--hop` | FFT window and hop size |
| `--min-freq` / `--max-freq` | Frequency range filter |
| `--start` / `--duration` | Time slice of the audio |
| `--format` | Output format: `jpg` or `png` |
| `-o` | Output file path |

## Notes

- WAV and MP3 are decoded natively; other formats require `ffmpeg`
- Output images can be inspected with `vision_analyze` for automated audio analysis
- Useful for comparing audio outputs, debugging synthesis, or documenting audio processing pipelines
