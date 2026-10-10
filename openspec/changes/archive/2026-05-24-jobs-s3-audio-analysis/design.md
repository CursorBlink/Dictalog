## Context

Dictalog already has an S3 source configuration in Settings (bucket URL, credentials, endpoint). The next planned feature is Whisper transcription, which requires all source files to be valid audio. This design adds a Jobs section that surfaces an on-demand analysis job users can run before kicking off transcription.

The app uses TanStack Start with file-based routing, server functions (`createServerFn`) for server-side logic, and the AWS SDK (already used for S3 connection testing). No persistent job storage is required at this stage — results are fetched on demand and held in component state.

## Goals / Non-Goals

**Goals:**
- Add a Jobs top-level route with navigation entry
- Implement S3 Audio Analysis job: list all objects, report creation date/time and detected audio format per file
- Flag any non-audio files so users know what needs cleaning up before transcription
- Reuse existing S3 source config (no new credential inputs)

**Non-Goals:**
- Whisper transcription (future job)
- Persisting job results to the database
- Background/async job execution — this is a synchronous on-demand fetch
- Pagination for very large buckets (out of scope for MVP)

## Decisions

### 1. Jobs as a new top-level route group
Route: `_authenticated/jobs/` with an index redirecting to the first job type.  
**Why**: Jobs are a distinct workflow from Settings. Mixing them would clutter the settings nav.  
**Alternative considered**: Jobs as a sub-section of Settings — rejected because Jobs will grow (transcription, export, etc.) and deserve their own nav slot.

### 2. Analysis results are ephemeral (no DB persistence)
Results are fetched server-side on demand and returned to the client. No DB writes.  
**Why**: The bucket contents can change at any time, so cached results would be stale. The analysis is fast enough to run each time.  
**Alternative considered**: Store last-run results in a `job_runs` table — deferred until background jobs are needed (Whisper phase).

### 3. Audio format detection by file extension
Supported extensions: `mp3`, `wav`, `m4a`, `flac`, `ogg`, `aac`, `opus`, `wma`, `webm`.  
**Why**: S3 object metadata doesn't reliably include MIME types unless explicitly set at upload time. Extension-based detection is simple and sufficient for the pre-flight check use case.  
**Alternative considered**: HEAD each object to read `Content-Type` — too slow for large buckets and unreliable if content-type wasn't set.

### 4. Reuse existing S3 client setup
The S3 connection test (from the previous change) already initializes an S3 client from source config. The analysis job will use the same pattern: read source config from DB, construct `S3Client`, call `ListObjectsV2`.  
**Why**: Keeps credential handling in one place.

## Risks / Trade-offs

- **Large buckets**: `ListObjectsV2` returns up to 1000 objects per page. For MVP, we fetch only the first page and note the limitation in the UI. → Mitigation: add a "showing first 1000 files" notice when `IsTruncated` is true.
- **No source config**: If the user hasn't configured an S3 source yet, the job should show a clear error with a link to Settings → Sources. → Mitigation: handle the missing-config case in the server function and surface a friendly message.
- **Extension-based detection false negatives**: Files without extensions or with wrong extensions will be flagged incorrectly. → Acceptable for a pre-flight tool; users can verify manually.
