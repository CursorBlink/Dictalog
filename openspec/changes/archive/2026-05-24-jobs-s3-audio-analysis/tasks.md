## 1. Jobs Navigation

- [x] 1.1 Add Jobs route group: create `web/src/routes/_authenticated/jobs.tsx` layout route
- [x] 1.2 Create Jobs index route `web/src/routes/_authenticated/jobs/index.tsx` that redirects to `/jobs/s3-audio-analysis`
- [x] 1.3 Add "Jobs" link to the sidebar navigation component

## 2. S3 Audio Analysis Server Function

- [x] 2.1 Create server function `listS3AudioFiles` in `web/src/routes/_authenticated/jobs/s3-audio-analysis.tsx` that reads source config from DB and calls `ListObjectsV2`
- [x] 2.2 Implement audio extension detection logic (mp3, wav, m4a, flac, ogg, aac, opus, wma, webm)
- [x] 2.3 Return per-file metadata: key (filename), last modified date/time, size, detected format, and `isAudio` flag
- [x] 2.4 Handle missing source config: return a typed error response
- [x] 2.5 Handle S3 connection errors: return descriptive error message
- [x] 2.6 Handle truncated results: include `isTruncated` flag when bucket exceeds 1000 objects

## 3. S3 Audio Analysis UI

- [x] 3.1 Create route file `web/src/routes/_authenticated/jobs/s3-audio-analysis.tsx` with page component
- [x] 3.2 Show "no source configured" state with link to Settings → Sources when config is missing
- [x] 3.3 Implement "Run Analysis" button that calls the server function
- [x] 3.4 Show loading state while analysis runs
- [x] 3.5 Render results table with columns: Filename, Created (UTC), Size, Format, Status
- [x] 3.6 Style valid audio file rows normally; flag non-audio/unknown rows with warning styling
- [x] 3.7 Display readiness summary: "All files ready" (success) or "X non-audio files found" (warning)
- [x] 3.8 Show "Showing first 1000 files" notice when `isTruncated` is true
- [x] 3.9 Display error message when S3 connection fails
