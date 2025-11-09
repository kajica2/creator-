# Dynamic Hashtag Navigation & Sandbox Spec

## Executive Summary
- Deliver a hashtag-driven navigation experience that ranks projects by virality, recency, and engagement while keeping draft visibility scoped to creators.
- Standardize one-page project pitches with defined media quotas, responsive layouts, and remix tooling surfaced contextually.
- Enforce a sandbox economy: 50 MB storage cap, credit ledger for AI/automation usage, and structured remix pricing with syndication hooks.
- Integrate Supabase as the source of truth for navigation data, project metadata, quotas, and OAuth-powered distribution.

## Context & Assumptions
- Frontend continues on the existing React/Vite stack with Supabase as the real-time data and auth layer.
- Dynamic hashtag infrastructure builds on the current `hashtags`, `hashtag_usage`, and cloud utilities.
- Each new member completes media onboarding (photo → hashtag pipeline) and receives 100 credits plus a personal sandbox capped at 50 MB.
- Sandboxes host up to 3 anchor videos, 7–10 curated photos, 3 audio tracks, and unlimited supporting text (lyrics, quotes, press kits, interviews).
- “Convertibles” represent spendable credits; generation tasks debit credits, but published artifacts remain live even if balances drop to zero.
- Virality levels (five tiers) influence navigation prominence, credit earnings, and recommendation logic.

## Dynamic Hashtag Navigation

### Experience Goals
- Let visitors explore content by clicking community-curated hashtags instead of static menus.
- Surface trending or high-virality projects first while preserving long-tail discovery.
- Reflect personal sandboxes: creators see private drafts; guests see only published pitches.

### User Flow
1. **Landing**: Render hashtag cloud with weights derived from virality tier, recency, and engagement.
2. **Selection**: Clicking a hashtag updates the filter pill tray and triggers a Supabase query for matching projects.
3. **Browsing**: Return a grid/stack of “sales pitch” pages aligned with the selected tags. Cross-filters (e.g., `#Belgrade`, `#EventReady`) update instantly.
4. **Deep Dive**: Opening a project loads the one-page pitch (see below) with inline remix/export actions if the viewer owns the sandbox.
5. **Re-engagement**: Show recommended hashtags (co-occurrence graph) and suggest remixing or duplicating assets when credits allow.

### Data Model Extensions
| Entity | Purpose | Key Fields |
| --- | --- | --- |
| `projects` | Top-level pitch records owned by a sandbox. | `id`, `owner_id`, `title`, `summary`, `status (draft/published)`, `virality_level (1–5)`, `primary_hashtag_id`, `created_at` |
| `project_hashtags` | Junction table linking projects to hashtags (many-to-many). | `project_id`, `hashtag_id`, `weight (0–1)`, `added_by` |
| `project_media_assets` | Normalized media metadata across videos/photos/audio/text. | `id`, `project_id`, `type (video/photo/audio/text)`, `storage_path`, `duration_or_length`, `thumbnail_url`, `order_index`, `size_bytes`, `transcoded_variants` |
| `project_engagement` | Aggregated scoring for virality calculation. | `project_id`, `views`, `clicks`, `shares`, `remixes`, `last_interaction_at` |
| `credit_ledger` | Tracks convertible spend/earn events. | `id`, `user_id`, `project_id`, `delta`, `action_type`, `metadata`, `created_at` |

### Navigation Logic
- **Virality weighting**: map levels 1–5 to base weights (e.g., `[1, 2, 3.5, 5, 7]`) before factoring recency and engagement velocity.
- **Co-occurrence graph**: maintain adjacency matrix from `project_hashtags` to suggest related tags after each selection.
- **Visibility rules**: `status = published` for public pages; owners see drafts via authenticated flag.
- **Caching**: Use Supabase Edge Functions to supply pre-ranked hashtag lists with 60 s cache windows; client subscribes for real-time deltas.
- **RAG tie-in**: Selected hashtags seed retrieval queries (e.g., against Supabase or vector store) to offer contextual prompts for remix tools.

#### Data Flow Snapshot
1. Client loads hashtag cloud via `GET /api/navigation/hashtags`; response contains weight, virality tier, and last-activity timestamps.
2. User applies filters → client emits `POST /api/navigation/events` and updates local filter state.
3. Client requests matching projects with `GET /api/navigation/projects` (debounced 150 ms to coalesce multi-selects).
4. Supabase row-level security (RLS) gates drafts to owners; published content cached through Edge Function.
5. Response hydrates project grid and seeds contextual prompt payload for remix widgets.

#### Client State & Interactions
- Maintain filter state in `useHashtagCatalogue` with URL query param sync (`?tags=belgrade,festival`).
- Persist last-selected tags per user in Supabase `user_preferences` table for personalized landing experience.
- Provide quick-clear and “pin” actions: pin keeps a hashtag sticky across navigation; clear resets to trending default.
- Support keyboard navigation with arrow keys cycling through weighted order; `Enter` toggles selection.

#### Edge Cases & Performance
- Fallback to static top-50 hashtags if realtime feed fails; notify user with toast if live updates are unavailable.
- Prevent selection of more than 8 concurrent hashtags to avoid overly sparse result sets; display helper text when limit reached.
- Batch project card requests to 20 per page; lazy-load media thumbnails to keep initial payload under 1.5 MB.
- Apply optimistic UI for event tracking and filter pills; roll back only if API call returns error.

### API Touchpoints
- `GET /api/navigation/hashtags?limit=200&scope=public` → returns weighted hashtag payload with virality and recency metadata.
- `GET /api/navigation/projects?hashtags=...` → paginated projects filtered by tags, sorted by combined score.
- `POST /api/navigation/events` → track selection events to feed virality and recommendation models.
- Client listens to `hashtag_usage` Supabase channel for real-time updates.

## One-Page Project Pitch

### Layout & Content Blocks
1. **Hero strip**: looping montage or primary video (auto-muted) with headline, location, and virality badge.
2. **Story rail**: carousel of up to three videos with embedded playback controls and call-to-action (bookings, collaboration).
3. **Gallery grid**: seven to ten curated photos with hotspot annotations and download gating (credit spend to export full-res).
4. **Audio wall**: three audio tracks (streaming waveform + downloadable stems).
5. **Narrative section**: rich text for lyrics, press copy, quotes, interview snippets; leverage markdown to keep editing simple.
6. **Event-ready module**: highlight assets tailored for festivals, venues, sponsors, including quick facts and contact CTAs.
7. **Remix toolbox** (owners only): buttons for “Create Remix”, “Generate SVG”, “Make Mask”, “Create Pad”, each showing credit cost.
8. **Related hashtags**: chips for lateral navigation, derived from co-occurrence graph.

#### Interaction States
- **Draft**: visible only to owner; hero components display watermark overlay until published.
- **Published**: public view with share/embed controls enabled; edits route to a draft copy.
- **Featured**: curated projects receive banner treatment plus elevated virality weighting and optional sponsor slot.
- Mobile breakpoint stacks hero over condensed sections; persistent CTA bar anchors `Book`, `Remix`, `Share`.

### Media Constraints & Handling
- Enforce the 50 MB sandbox cap; show remaining quota and per-asset sizes on upload.
- Auto-transcode videos to web-ready resolutions (1080p, 720p) and store variants in `transcoded_variants`.
- Generate responsive image derivatives (cover, thumb, retina) and ALT text via AI with manual override.
- Audio uploads accept WAV/MP3; produce MP3 preview + WAV original; capture BPM/key metadata for RAG remixes.
- Text assets stored as structured JSON (`type`, `body`, `language`, `context`) to support localization.

#### Layout Responsiveness & Accessibility
- Desktop: two-column layout with sticky remix toolbox; gallery uses masonry grid with lazy-loading.
- Tablet: collapses to single column with horizontal scroll carousels for gallery and audio wall.
- Provide keyboard shortcuts for media sections (`1` hero, `2` gallery, `3` audio) and ensure focus order mirrors visual flow.
- Support light/dark theme swaps; hero video respects reduced motion preference by pausing autoplay.

### Publishing Workflow
1. Creator selects assets from sandbox library to compose a project.
2. System validates media quotas (3 videos, 7–10 photos, 3 audio tracks) and credit balance for any pending conversions.
3. Preview mode renders the full pitch; creator edits copy, reorder assets, chooses hero video.
4. Publishing flips `status` to `published`, triggers search indexing, and optionally syndicates to connected platforms.
5. Any subsequent edits spawn a draft version; once republished, previous iteration is archived for time-travel review.

### Accessibility & Internationalization
- Provide captions/subtitles for all videos; transcripts for audio.
- Ensure text blocks support multi-language toggles; default to English + localized language (e.g., Serbian) when provided.
- Keyboard-accessible navigation, ARIA labels on media controls, high-contrast theme variant for event presentations.
- Mirror right-to-left support for languages as needed; auto-detect language on text upload with manual override.

## Sandbox Economy & Remix Tools

### Credit Lifecycle
- **Starting balance**: 100 credits granted at onboarding completion.
- **Debits**: AI generation (10–25 credits), media conversions (5 credits per asset), distribution automations (3 credits per platform push), advanced RAG remix (variable, based on compute).
- **Earns**: Virality achievements (levels 3–5 grant escalating bonuses), community engagement milestones, collaborator tips, platform campaigns.
- Credits never expire; negative balances block extra processing but keep published assets online.
- Provide credit ledger UI: table with `action`, `delta`, `balance_after`, timestamp.

#### Credit Ledger Schema
| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key. |
| `user_id` | uuid | Owner of the sandbox. |
| `project_id` | uuid? | Nullable for global actions (e.g., top-ups). |
| `delta` | numeric | Positive for earns, negative for spends. |
| `balance_after` | numeric | Stored to enable audit without recalculation. |
| `action_type` | enum | `generation`, `conversion`, `distribution`, `reward`, `manual_adjustment`. |
| `metadata` | jsonb | Contains agent name, platform target, or prompt summary. |
| `created_at` | timestamptz | Defaults to `now()`. |

### Storage Policy
- 50 MB total per sandbox; soft warning at 90% usage, hard stop at 100% with guidance to archive or upgrade.
- Archival moves assets to cold storage (counts at 25% of original size) but hides them from public pages until restored.
- Version history stored as delta metadata rather than full copies to minimize quota impact.

#### Quota Enforcement Flow
1. Asset upload request hits edge function with `sandbox_id` and file metadata.
2. Function queries aggregated `size_bytes` for active assets and projects the new total.
3. If projected total ≤ 50 MB → accept upload; else respond with `HTTP 409` and guidance on archival or upgrade.
4. On archival, move asset to cold storage bucket and update `size_bytes_effective = size_bytes * 0.25`.
5. Scheduled job recalculates quotas nightly to catch any anomalies or manual adjustments.

### Remix & Conversion Toolkit
- **Generate SVG**: transcode image/video keyframes to vector motifs; outputs stored in sandbox and optionally attached to project.
- **Mask builder**: produce alpha masks for motion graphics; integrates with timeline “travel through space/time” previews.
- **Pad maker**: convert audio stems into looping pads; provide BPM/key metadata for downstream use.
- **Timeline travel**: slider UI to scrub revisions, branch new versions, and compare virality metrics per branch.
- RAG support: selected hashtags + project context feed prompt templates for remix agents (e.g., align with `RagSourceManager`).

#### Remix Pricing Matrix
| Action | Credit Cost | Notes |
| --- | --- | --- |
| Generate SVG | 12 | Includes AI vectorization and 3 variants. |
| Mask builder | 8 | Produces alpha mask + preview GIF. |
| Pad maker | 10 | Adds stem normalization, BPM/key detection. |
| Timeline travel branch | 5 | Captures snapshot + diff metrics. |
| Auto syndicate clip | 3 per platform | Applies when posting to linked channels. |

### Distribution Hooks
- OAuth connections for YouTube, Instagram, Facebook; store tokens securely via Supabase.
- Export presets per platform: aspect ratio, duration cap, caption templates.
- Auto-post consumes credits; fallback download is free but flagged for manual tracking.
- Post-publish analytics ingest view counts via APIs (where available) to update `project_engagement`.

#### Syndication Workflow
1. Creator selects target platforms and schedules posting window.
2. System validates credit balance and fetches platform-specific presets.
3. Media derivatives generated and cached; caption templates hydrated with project metadata and hashtags.
4. Auto-post job executes via Edge Function using stored OAuth tokens; failures trigger retry with exponential backoff.
5. Completion event writes to `credit_ledger` and updates `project_engagement` metrics with external analytics.

## Analytics & Admin
- Dashboard tracks hashtag performance, project virality progression, credit velocity, storage usage.
- Moderation module to review flagged content, manage hashtag taxonomy, and promote featured projects.
- Event-focused view to curate bundles for festivals or local showcases, leveraging the same project templates.

## Open Questions & Next Steps
- Monetization tiers for larger storage or additional credits (e.g., subscription vs. pay-per-pack).
- Deep integration of live events (ticketing, RSVP) within project pitches.
- Required service-level agreements for auto-posting (rate limits, retries).
- Timeline for Belgrade pilot rollout versus broader international launch.

