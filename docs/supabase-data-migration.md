# Supabase Data Migration

## Objective

Transition all persistent data from in-browser/local JSON sources to Supabase-managed Postgres tables, enabling shared state across users and preparing the app for collaborative, multi-device scenarios.

## 1. Current Data Inventory

| Source | Storage Mechanism | Key Structures | Usage Highlights |
| --- | --- | --- | --- |
| `data/hashtags.ts` | Static TypeScript arrays | `hashtagCategories: HashtagCategory[]`, `readySets: ReadySet[]` | Feeds `HashtagManager`, `SelectedTray`, and quick set pickers with curated hashtag metadata. |
| `data/gamification.ts` | Static TypeScript exports | `XP_REWARDS`, `LEVEL_REWARDS`, `ACHIEVEMENTS`, `DAILY_CHALLENGES` | Consumed by `useGamification` to determine XP, levels, achievements, daily challenges. |
| `utils/hashtagStorage.ts` | `localStorage` (`userHashtagCollections`) | `favorites: string[]`, `customSets: UserSet[]`, `recentlyUsed: string[]` | Stores user-created hashtag sets, favourites, and recency queue; invoked by `HashtagManager`, `HashtagAdderModal`, `SetCreatorModal`. |
| `utils/contentStorage.ts` | `localStorage` (`contentStorage`) | `personas: Persona[]`, `content: StoredContentItem[]`, `defaultPersonaId` | Primary persistence for generated outputs per persona; referenced across generators, gallery, persona analytics. |
| `utils/personaTemplates.ts` | `localStorage` (`user_persona_templates`) + static templates | `systemTemplates`, user templates CRUD helpers | Enables saving custom persona templates; used by `PersonaTemplatesPage`, `ContextModifier`. |
| `hooks/useGamification.ts` | `localStorage` (`userProgress`) | `UserProgress` object with XP, level, streak, achievements | Tracks user gamification progress, awards credits, and updates streaks. |
| `App.tsx` | `localStorage` (`promptHistory`, `hasSeenOnboarding`) | Prompt history array, onboarding flag | Maintains recent prompts and onboarding completion; affects `PromptHistory` and modal gating. |
| Misc components | Derived from above | e.g. `generateHashtagsFromUrl` fallbacks, `personaAnalytics` (in-memory) | Analytics rely on `contentStorage` snapshot; fallback dataset generation uses static arrays. |

### Observations

- All user-specific state lives in `localStorage`, meaning data is siloed per browser and non-persistent across devices.
- Static datasets (`hashtags`, `gamification`, system persona templates) are bundled at build-time; updates require redeployment.
- Generated content, persona info, and gamification stats lack relational structure, which limits querying, filtering, and collaborative features.
- Identifiers rely on `Date.now()`/`Math.random()` which are sufficient locally but should be replaced with UUIDs generated server-side for consistency.

## 2. Proposed Supabase Schema

> Conventions: all tables live in the `public` schema, use `uuid` primary keys with `gen_random_uuid()`, and reference `auth.users(id)` for user ownership. Array columns employ `text[]`; JSON payloads use `jsonb` for flexibility.

### Hashtag Catalogue

```sql
create table public.hashtag_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create type public.hashtag_size as enum ('Mega','Large','Medium','Small','Micro');

create table public.hashtags (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.hashtag_categories(id) on delete cascade,
  name text not null unique,
  display_count text,
  size public.hashtag_size not null,
  tags text[] default '{}',
  popularity_score int,
  related_hashtags text[] default '{}',
  created_at timestamptz not null default now()
);

create table public.ready_sets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category_id uuid not null references public.hashtag_categories(id) on delete cascade,
  description text,
  hashtags text[] not null,
  is_favorite boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### User Hashtag Collections

```sql
create table public.user_hashtag_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category_id uuid references public.hashtag_categories(id),
  is_custom boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_hashtag_set_items (
  set_id uuid not null references public.user_hashtag_sets(id) on delete cascade,
  tag text not null,
  position int not null default 0,
  unique (set_id, tag)
);

create table public.user_favorite_hashtags (
  user_id uuid not null references auth.users(id) on delete cascade,
  tag text not null,
  added_at timestamptz not null default now(),
  primary key (user_id, tag)
);

create table public.user_recent_hashtags (
  user_id uuid not null references auth.users(id) on delete cascade,
  tag text not null,
  last_used_at timestamptz not null default now(),
  primary key (user_id, tag)
);
```

### Personas & Generated Content

```sql
create table public.personas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  context text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.prompt_type as enum (
  'AI Story','Suno Lyrics','Website Strategy','AI Skill Guide','Tensor Mutation','AI Concept',
  'Text-to-Image','Image Edit','Batch Images','Batch Image Prompts','AI Website','Thinking Mode','Audio Transcriber'
);

create table public.persona_content (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tool text not null,
  prompt_type public.prompt_type not null,
  content jsonb not null,
  hashtags text[] default '{}',
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);
```

### Persona Templates

```sql
create table public.persona_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  description text,
  context text,
  icon text,
  tags text[] default '{}',
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Gamification & Progress

```sql
create table public.achievement_definitions (
  id text primary key,
  name text not null,
  description text not null,
  category text not null,
  tier text not null,
  target int not null,
  xp_reward int not null,
  credit_reward int default 0,
  icon text
);

create table public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp int not null default 0,
  level int not null default 1,
  streak int not null default 0,
  last_activity_date date,
  total_generations int not null default 0,
  tool_usage jsonb default '{}',
  updated_at timestamptz not null default now()
);

create table public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null references public.achievement_definitions(id) on delete cascade,
  progress int not null default 0,
  unlocked boolean not null default false,
  unlocked_at timestamptz,
  primary key (user_id, achievement_id)
);

create table public.daily_challenge_definitions (
  id text primary key,
  title text not null,
  description text not null,
  type text not null,
  target_tool text,
  xp_reward int not null,
  credit_reward int not null default 0
);

create table public.user_daily_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id text not null references public.daily_challenge_definitions(id) on delete cascade,
  challenge_date date not null,
  completed boolean not null default false,
  completed_at timestamptz
);
```

### Prompts & Flags

```sql
create table public.prompt_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt_type public.prompt_type not null,
  prompt text not null,
  created_at timestamptz not null default now()
);

create table public.user_flags (
  user_id uuid primary key references auth.users(id) on delete cascade,
  has_seen_onboarding boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Relationships Overview

- `hashtag_categories` → `hashtags`, `ready_sets`, `user_hashtag_sets`
- `auth.users` → `personas`, `persona_content`, user-specific tables (favorites, recent, templates, progress, prompts)
- `persona_templates` holds both system (`is_system = true`, `owner_id` null) and user-created templates
- Gamification tables separate immutable definitions from mutable user progress for easy seeding and updates

## 3. Seeding Strategy

### Static Reference Data

- `hashtag_categories`, `hashtags`, `ready_sets` derived from `data/hashtags.ts`
- `achievement_definitions`, `daily_challenge_definitions` from `data/gamification.ts`
- `persona_templates` (system rows) from `utils/personaTemplates.ts`

### Approach

1. Create a `scripts/seed-supabase.ts` Node script that:
  - Imports the existing static datasets
  - Uses `@supabase/supabase-js` with the service-role key
  - Performs idempotent upserts (matching on unique keys like `name` or `id`)
2. Run the script via `npx ts-node scripts/seed-supabase.ts` (or convert to plain JS) during deployment or via Supabase SQL editor.
3. Optionally check in SQL files (`supabase/seeds/*.sql`) for manual execution if CLI access is preferred.

### Pseudo-code Sketch

```ts
import { createClient } from '@supabase/supabase-js';
import { hashtagCategories, readySets } from '../data/hashtags';
import { ACHIEVEMENTS, DAILY_CHALLENGES } from '../data/gamification';
import { systemTemplates } from '../utils/personaTemplates';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function seedHashtags() {
  for (const category of hashtagCategories) {
    const { data: categoryRow } = await supabase
      .from('hashtag_categories')
      .upsert({ name: category.category }, { onConflict: 'name' })
      .select('id')
      .single();

    if (!categoryRow) continue;

    await supabase.from('hashtags').upsert(
      category.hashtags.map((tag) => ({
        category_id: categoryRow.id,
        name: tag.name,
        display_count: tag.count,
        size: tag.size,
        tags: tag.tags,
        popularity_score: tag.popularityScore,
        related_hashtags: tag.relatedHashtags,
      })),
      { onConflict: 'name' }
    );
  }
}

async function main() {
  await seedHashtags();
  // Seed ready sets, achievements, daily challenges, system templates...
}

main().then(() => console.log('Seeding complete')).catch(console.error);
```

### Data Freshness

- Keep seed scripts deterministic; avoid `Date.now()` for timestamps, instead rely on `now()` on insert.
- Store source TypeScript data in a dedicated `data/seed/` directory if they diverge from runtime needs.

## 4. Data Access Layer

### Module Layout

| Module | Responsibility | Key Methods |
| --- | --- | --- |
| `supabase/hashtags.ts` | Shared catalogue & ready-set helpers | `listCategories()`, `listHashtagsByCategory()`, `searchHashtags(query)`, `listReadySets()` |
| `supabase/userHashtags.ts` | User-specific favorites & custom sets | `getCollections(userId)`, `addFavorite(tag)`, `createSet(payload)`, `updateSet(id, patch)`, `deleteSet(id)`, `recordRecent(tag)` |
| `supabase/personas.ts` | Personas and generated content | `listPersonas()`, `createPersona()`, `updatePersona()`, `deletePersona()`, `fetchPersonaContent(personaId, filters)` |
| `supabase/personaContent.ts` | Content CRUD separated for clarity | `addContent(entry)`, `deleteContent(id)`, `searchContent(options)`, `getRecent(limit)` |
| `supabase/templates.ts` | Persona template management | `listTemplates({ includeSystem })`, `createTemplate()`, `updateTemplate()`, `deleteTemplate()` |
| `supabase/gamification.ts` | Progress/achievements/daily challenges | `getUserProgress()`, `incrementProgress(updates)`, `listAchievements()`, `unlockAchievement(id)`, `upsertDailyChallenge()` |
| `supabase/prompts.ts` | Prompt history & flags | `getPromptHistory(limit)`, `appendPrompt(entry)`, `clearHistory()`, `getUserFlags()`, `setOnboardingSeen()` |

### Implementation Notes

- Export lightweight, promise-based helpers that return typed results (using `zod` or TypeScript interfaces).
- Centralize Supabase error handling: create a `handleSupabaseError` utility to normalize errors and surface actionable messages.
- Use row-level security (RLS) policies in Supabase; client methods should avoid passing `user_id` explicitly when session context suffices.
- Prefer serverless edge functions for heavy operations (e.g., analytics aggregation) once basic CRUD is in place.
- Co-locate React hooks (e.g., `useHashtags`, `usePersonas`) next to the data modules to encapsulate query caching via `@tanstack/react-query` or SWR (consider introducing during refactor).

## 5. UI / Hook Refactor Roadmap

1. **Introduce Query Client**
   - Add `@tanstack/react-query` provider at `index.tsx` level.
   - Create suspense-friendly hooks (`useHashtagCategories`, `useReadySets`, etc.) that call the new Supabase modules.
2. **Hashtag Surfaces**
   - Replace direct imports from `data/hashtags.ts` inside `HashtagManager`, `SelectedTray`, `QuickAccessToolbar` with query hooks.
   - Rewrite custom set/favorite interactions (`HashtagAdderModal`, `SetCreatorModal`) to mutate via Supabase and invalidate queries.
3. **Persona & Content Flows**
   - Convert `contentStorage` helper usage in generators (`AIStoryGenerator`, `EnhancedGallery`, `WebsiteManager`) to API-backed hooks.
   - Ensure optimistic updates for `addContent`/`deleteContent`, falling back to refetch on failure.
4. **Persona Templates**
   - Update `PersonaTemplatesPage`, `ContextModifier`, `PersonaDropdown` to source templates/personas from Supabase.
   - Provide background sync to prefetch system templates (cached in query client, not hardcoded imports).
5. **Gamification**
   - Swap `useGamification` stateful localStorage implementation with Supabase-backed progress fetch/mutation.
   - Migrate streak/achievement calculations server-side or in shared utilities to maintain consistency across clients.
6. **Prompt History & Flags**
   - Replace `localStorage` usage in `App.tsx` for prompt history and onboarding flag with Supabase queries/mutations.
7. **Feature Flags & Fallbacks**
   - Implement loading skeletons for data-dependent components.
   - Keep read-only in-memory fallbacks (e.g., static hashtags) behind a feature flag to support offline dev/testing.

## 6. Migration Process & Verification

### Rollout Steps

1. **Infrastructure Preparation**
   - Apply schema DDL (Section 2) through Supabase migrations.
   - Configure RLS policies for every user-owned table (`with check auth.uid() = user_id`).
   - Seed static data using the script defined in Section 3.
2. **Backend Integration**
   - Commit data access modules (Section 4) and hook wiring (Section 5) behind a feature flag (`NEXT_PUBLIC_SUPABASE_DATA=1`).
   - Validate that all mutations respect Supabase row ownership.
3. **Progressive UI Cutover**
   - Ship read-only views first (e.g., load hashtags from Supabase but keep writes local).
   - Enable writes once corresponding mutations are verified in staging.
4. **Cleanup**
   - Remove legacy localStorage utilities (`contentStorage`, `hashtagStorage`, etc.) after confirming zero references.
   - Delete static data imports from components; keep TypeScript definitions (`types.ts`).

### Verification Checklist

- [ ] Hashtag catalogue renders identical data before/after cutover.
- [ ] Creating/updating/deleting custom sets persists across browser sessions (verify via Supabase dashboard).
- [ ] Generated content appears in Supabase tables and surfaces in gallery immediately after creation.
- [ ] Persona analytics uses Supabase data (spot-check aggregated stats).
- [ ] Gamification streaks and achievements update when actions are triggered and remain consistent across devices.
- [ ] Prompt history retains last 50 entries and clears on user command.
- [ ] Onboarding modal respects `user_flags.has_seen_onboarding` across browsers.

### Testing Strategy

- Unit test data modules with mocked Supabase responses (focus on transformation logic).
- Integration tests using Playwright/Cypress for critical flows (persona creation, content generation, hashtag management).
- Load test key tables using Supabase SQL to ensure indexes (e.g., on `persona_content.persona_id`) sustain expected volume.

### Rollback Plan

- Keep localStorage code paths behind a fallback feature flag until Supabase rollout is stable.
- Export Supabase tables to CSV before structural migrations to enable quick restore.
- Maintain versioned seed files; if rollback is required, truncate user tables and re-seed from latest snapshot.
