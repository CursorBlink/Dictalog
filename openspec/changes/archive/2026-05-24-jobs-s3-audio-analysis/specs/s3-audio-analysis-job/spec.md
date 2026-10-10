## ADDED Requirements

### Requirement: S3 Audio Analysis job page
The application SHALL provide an S3 Audio Analysis page under Jobs that lets users analyze the contents of their configured S3 bucket for audio file readiness.

#### Scenario: Page loads with no source configured
- **WHEN** the user opens the S3 Audio Analysis page and no S3 source has been configured
- **THEN** the page SHALL display an informational message and a link to Settings → Sources

#### Scenario: Page loads with source configured
- **WHEN** the user opens the S3 Audio Analysis page and an S3 source exists
- **THEN** the page SHALL display a "Run Analysis" button and instructions

### Requirement: List all files in the S3 bucket
When the user triggers analysis, the system SHALL fetch the list of all objects in the configured S3 bucket using the existing source credentials.

#### Scenario: Successful file listing
- **WHEN** the user clicks "Run Analysis" and the S3 bucket is accessible
- **THEN** the system SHALL return a list of all objects with their key (filename), creation date/time, and detected audio format

#### Scenario: Bucket is empty
- **WHEN** the user clicks "Run Analysis" and the S3 bucket has no objects
- **THEN** the page SHALL display a "No files found in bucket" message

#### Scenario: S3 connection fails
- **WHEN** the user clicks "Run Analysis" and the S3 connection fails
- **THEN** the page SHALL display an error message describing the failure

### Requirement: Display file metadata
For each file returned by the analysis, the system SHALL display the filename, creation date/time (UTC), file size, and the detected audio format.

#### Scenario: Audio file displayed correctly
- **WHEN** a file has a recognized audio extension (mp3, wav, m4a, flac, ogg, aac, opus, wma, webm)
- **THEN** the file row SHALL show the format label and be styled as valid/ready

#### Scenario: Non-audio file flagged
- **WHEN** a file has an extension not in the supported audio format list
- **THEN** the file row SHALL be visually flagged (e.g. warning style) and show "Not audio" as the format

#### Scenario: File with no extension
- **WHEN** a file has no extension
- **THEN** the file row SHALL be flagged and show "Unknown" as the format

### Requirement: Analysis readiness summary
After running the analysis, the system SHALL display a summary indicating whether all files are audio-ready.

#### Scenario: All files are audio
- **WHEN** every file in the bucket has a recognized audio extension
- **THEN** the summary SHALL state "All files are audio — ready for transcription" in a success style

#### Scenario: Some files are not audio
- **WHEN** at least one file has a non-audio or unknown extension
- **THEN** the summary SHALL state the count of non-audio files and warn that they must be removed before transcription

#### Scenario: Truncated results
- **WHEN** the bucket contains more than 1000 objects (S3 ListObjectsV2 page limit)
- **THEN** the page SHALL display a notice "Showing first 1000 files — bucket may contain more"
