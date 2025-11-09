<!-- Obsidian-style note outlining the platform organization -->
# Tag-Navigation Platform Documentation

## 1. Vision Summary
- Mission statement highlighting tag-first navigation and creative empowerment.
- Animated minimalist interface with Serbian default localization.
- Emphasis on advancing civilization via open, expressive tooling.

## 2. Core Experience Pillars
### 2.1 Tag-Centric Navigation
- User-generated tags replacing traditional menus.
- Hashtags as social currency and discovery engine.
### 2.2 Media & Identity Capture
- Upload photo/camera/link inputs feeding automated hashtag extraction.
- Identity clouds representing people, knowledge, art, and experiences.
### 2.3 Spatial Mapping
- 3D constellations linking users, themes, and collaborations.
- Options to anchor relationships (self, family, collaborators).

## 3. First-Time User Journey

The newcomer experience emphasizes immediate creation and discovery while keeping navigation minimal. Serbian copy guides every step, with clear affordances to switch languages in settings.

### 3.1 Entry Surfaces
- `Welcome`: animated backdrop, hero messaging, and action buttons to upload, capture, or paste a link.
- `Quick Tour`: optional overlay introducing tag-based navigation and 3D constellations.
- `Account Seed`: lightweight profile seed form for name, pronouns, and initial focus tags.

### 3.2 Immediate Actions
- Upload a photo, capture from camera, or submit a link to trigger automatic hashtag extraction.
- Review and confirm suggested hashtags; add self-descriptive tags manually.
- Preview the nascent identity cloud and learn how tags unlock experiences and currency.

### 3.3 Guided Exploration
- Suggested tag neighborhoods (e.g., `#art`, `#family`, `#innovation`) the user can step into.
- Prompt to stand beside another user’s constellation to understand adjacency mechanics.
- Invitation to subscribe to daily astral matches for curated songs, visuals, and collaborators.

### 3.4 Accessible Surfaces on Day One
- `Constellation Canvas`: personal 3D map with starter nodes and tooltips.
- `Tag Wallet`: overview of earned/generated tags and how they translate into network actions.
- `Media Library`: first uploads and a queue for MCP-processed assets.
- `Settings`: quick access to language, theme, information density, and visualization style controls.

## 4. Persistent Interface & Settings

Settings live in a unified drawer accessible from every view. Changes apply instantly and persist across sessions/device classes.

### 4.1 Minimalist Shell
- Full-bleed animated background with subtle parallax, reacting to tag activity.
- Modular panels (canvas, wallet, library) that surface contextually based on tag focus.
- Keyboard-first shortcuts for power users, likewise surfaced via tags.

### 4.2 Language & Information Density
- Serbian is the first-load language; additional languages appear in a dropdown synced to browser locale.
- `Concise` vs `Expanded` modes toggle the amount of explanatory copy, useful for onboarding vs expert users.
- Accessibility overlays (larger text, high-contrast) managed alongside language settings.

### 4.3 Visual Themes & Fonts
- `Light`, `Dark`, and `Ambient` base palettes with user-defined overrides for primary/secondary colors.
- Custom palettes can be saved as named themes and shared via tag links.
- Global font stack selector (serif, sans-serif, mono, custom) propagating through all tools and generated exports.

### 4.4 Media Presentation Styles
- Controls for photographic rendering (flat, depth-enhanced, animated loops).
- Gallery density slider adjusting how many assets appear per viewport.
- Playback/transition pacing options to match different storytelling rhythms.

## 5. API & Data Ecosystem

Every interactive surface corresponds to a documented API so the platform can be remixed by other builders.

### 5.1 Internal/External API Surface
- REST and GraphQL endpoints for tag creation, aggregation, constellation coordinates, and media payloads.
- Webhooks for tag events (created, minted as currency, linked to another user).
- Authentication strategy leveraging existing identity provider plus token scopes for partner apps.

### 5.2 MCP Integrations
- MCP adapters manage project files, versioned assets, and collaborative task queues.
- Bidirectional sync: tags applied in the platform update MCP metadata, and MCP insights (e.g., AI annotations) feed back as tags.
- Bulk ingest pipelines for visual, auditory, and video assets with automated transcoding and preview generation.

### 5.3 Astral Daily Matching
- Scheduled job curates daily bundles of songs/graphics based on emergent tag patterns.
- Distribution to a central hub API that fans out to subscribed users, partners, and public channels.
- Feedback scoring endpoints to refine recommendation quality and tag relevance over time.

## 6. Roadmap & Future Enhancements
### 6.1 Near-Term
- Localization expansion.
- Enhanced 3D mapping interactions.
### 6.2 Long-Term
- Civic/cultural partnerships leveraging the tag network.
- AI-assisted curation and mentorship pathways.

## 7. Reference Links
- Glossary of key terms.
- Related specs (`dynamic-hashtag-navigation-spec.md`, `sentry-navigation-cloud.md`).

