## Why

Before transcribing audio files with Whisper, we need to verify that all files in the configured S3 bucket are valid audio files and gather their metadata (creation date/time, format). This analysis step surfaces problems early and gives users confidence their data is ready for transcription.

## What Changes

- Add a new **Jobs** section to the main navigation
- Introduce a **S3 Audio Analysis** job type under Jobs that:
  - Lists all objects in the configured S3 bucket
  - Validates each file is an audio format (mp3, wav, m4a, flac, ogg, aac, etc.)
  - Reports creation date/time and file format for each file
  - Summarizes overall readiness (all audio / some non-audio / empty)
- Jobs section is a new top-level route, separate from Settings

## Capabilities

### New Capabilities
- `jobs-nav`: Top-level Jobs navigation section and route layout
- `s3-audio-analysis-job`: Job that analyzes S3 bucket contents for audio file readiness — lists files with creation date/time and format, flags non-audio files

### Modified Capabilities

## Impact

- New routes under `_authenticated/jobs/`
- Reuses existing S3 source configuration (bucket, endpoint, credentials) from Settings
- Server functions to call S3 ListObjects API and inspect file metadata
- No database schema changes required — analysis results are ephemeral (not persisted)
- No Whisper integration in this step
