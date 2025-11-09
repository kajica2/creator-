create extension if not exists "pgcrypto";

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  company_url text,
  collection_name text,
  notes text,
  original_filename text not null,
  mime_type text not null,
  size_bytes bigint,
  width integer,
  height integer,
  duration_ms integer,
  checksum text,
  tags text[] default array[]::text[],
  summary text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists media_assets_user_id_idx on public.media_assets(user_id);
create index if not exists media_assets_created_at_idx on public.media_assets(created_at);
create index if not exists media_assets_tags_idx on public.media_assets using gin(tags);
create index if not exists media_assets_metadata_idx on public.media_assets using gin(metadata);

