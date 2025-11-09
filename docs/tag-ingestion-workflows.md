# Tag Ingestion Workflows

## Overview
- Centralize all entry points that create or enrich hashtags from media.
- Connect AI-assisted enrichment (Gemini) with Supabase storage and local caches.
- Ensure every ingestion path maintains consistency in deduping, quota enforcement, and user feedback loops.

The workflows below describe:
- **Upload photo → tags**: single-asset imports that immediately surface AI tags.
- **Upload structured tags**: persona-based text parser that seeds curated sets.
- **Batch media import**: `.zip` pipeline for large media drops.
- **Batch tag import & sort**: persona/segment level tag clusters and their ranking rules.

## Upload Photo → Tags
- **Trigger points**: single-asset upload components (e.g., `HashtagAdderModal`, campaign editors) pass `File` blobs to backend helper that mirrors `api/batch-media-import.ts` logic.
- **Processing stack**:
  - MIME detection via `file-type` and filename fallback (`inferMimeType`).
  - Image metadata extraction (`image-size`) to log width/height.
  - Gemini `gemini-2.0-flash` invoked with prompt tuned for visual intelligence (`analyzeImage`).
  - Tags, detected logos/objects/text, and dominant colours merged into `RagSourceMetadata`.
- **Storage**:
  - Hash (SHA-256) calculated to catch duplicates.
  - `media_assets` Supabase table receives persistent record (`createSupabaseRecord`).
  - Sub-1 MB images also receive `dataUrl` preview for instant UI rendering.
- **Tag surfacing**:
  - AI tags normalized to kebab-case and stored on the metadata object.
  - Client emits `onAddHashtag` to update local sets; Supabase `hashtag_usage` updated by downstream worker.
- **User feedback**:
  - Thumbnail preview with generated tags (staged for confirmation before commit).
  - Conflicts (duplicate hash) return prior metadata and skip quota impact.

## Upload Structured Tags
- **Entry UI**: `BatchHashtagImportModal` accepts persona-formatted text.
- **Parser**: `parseBatchHashtagInput` normalizes headers (primary/secondary/niche) and dedupes hashtags.
- **Data model**:
  - Each persona produces `sets` with explicit `type` and human label.
  - On import, `createCustomSet` writes to client storage/IndexedDB for immediate use; optional sync worker pushes to Supabase collections.
- **Validation & errors**:
  - Empty inputs, missing persona headers, or sets without tags raise specific errors returned to modal.
  - Parser strips redundant `#` prefixes and enforces lowercase comparisons for dedupe while preserving display casing.
- **Sorting logic**:
  - Within each set, hashtags retain author order post-dedupe.
  - Persona list sorted alphabetically when rendered; maintain original order in storage to support curated sequences.

## Batch Media Import
- **Endpoint**: `POST /api/batch-media-import` (body parser disabled, 500 MB limit).
- **Form fields**: `archive` (`.zip` required), optional `companyUrl`, `collectionName`, `notes`.
- **Pipeline**:
  1. Authenticate request via `verifySupabaseRequest`; reject unauthorized calls when Supabase admin client available.
  2. Iterate zip entries, skip directories and unsupported types (non-image, non-text).
  3. Determine `sourceType` (image/text) and run appropriate analyzer (`analyzeImage` or `analyzeTextDocument`).
  4. Build `RagSource` payload for each asset, attaching AI summary, tags, and contextual lines (`buildContextContent`).
  5. Persist metadata to `media_assets`, including checksum, collection info, and generated tags.
  6. Return `sources`, `summary` counts, and per-file error array.
- **Performance guards**:
  - Debounce multi-select filters on client (`uploadBatchContextArchive` uses Fetch streaming).
  - Skip image previews >1 MB to prevent response bloat.
  - Track `processed`, `failed`, `ignored` counts for transparency.
- **Quota interaction**:
  - Sandboxes enforce 50 MB cap; upstream check occurs before final commit in Supabase edge function (see `dynamic-hashtag-navigation-spec.md` quota flow).

## Batch Tag Import & Sort
- **Automated clusters**:
  - `utils/hashtagCloudAutomation.ts` scheduler materializes trending segments into `automated_tag_clusters`.
  - Each record stores ordered hashtag arrays, metrics (trending count, top hashtags), and expiry.
- **Client consumption**:
  - `HashtagCloud` component toggles between live RPC (`get_hashtag_cloud_data`) and latest automated cluster.
  - Sorting options (`trending`, `frequency`, `popularity`) control display order and spiral placement.
  - Top five items anchored near center; remainder follow spiral with spacing tied to `trending_score`.
- **Batch tag import UI**:
  - `BatchHashtagImportModal` provides success metrics (# personas, # sets) and persists results.
  - Additional tooling (e.g., Tag Cloud automation agent) can fetch latest clusters or schedule updates.
- **Sorting priorities**:
  - Primary sort by chosen metric, secondary tie-breakers by `usage_week` then alphabetical.
  - Limit selection to prevent sparse results (default max 100, min frequency 1; UI enforces ≤8 filter pills).
- **Follow-up actions**:
  - Imported clusters feed dynamic navigation (see `dynamic-hashtag-navigation-spec.md`).
  - Agents (`TagCloudAutomationAgent`) may regenerate clusters on demand or via scheduler for fresh ranking.

## Developer Notes
- Keep Gemini API keys synchronized between server (`GEMINI_API_KEY`) and Vite (`VITE_GEMINI_API_KEY`).
- `media_assets` rows should capture `tags` array and `metadata` JSON for search/resume.
- Extend `parseBatchHashtagInput` when introducing new set labels—update `SET_LABEL_MAP`.
- For new ingestion paths, reuse checksum + `media_assets` insert helper to maintain dedupe semantics.

