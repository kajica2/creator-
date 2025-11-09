do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'media_asset_category'
      and n.nspname = 'public'
  ) then
    execute 'create type public.media_asset_category as enum (''image'', ''video'', ''audio'', ''document'', ''other'')';
  end if;
end
$$;

alter table if exists public.media_assets
  add column if not exists storage_bucket text,
  add column if not exists storage_path text,
  add column if not exists asset_category public.media_asset_category,
  add column if not exists source_url text,
  add column if not exists is_favorite boolean default false,
  add column if not exists last_accessed_at timestamptz;

alter table if exists public.media_assets
  alter column storage_bucket set default 'user-media';

insert into storage.buckets (id, name, public)
select 'user-media', 'user-media', true
where not exists (select 1 from storage.buckets where id = 'user-media');

create table if not exists public.media_asset_context_links (
  id bigserial primary key,
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  context_type text not null,
  context_id uuid,
  project_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists media_asset_context_links_asset_idx on public.media_asset_context_links (media_asset_id);
create index if not exists media_asset_context_links_type_idx on public.media_asset_context_links (context_type);

create unique index if not exists media_asset_context_links_unique_idx
  on public.media_asset_context_links (
    media_asset_id,
    context_type,
    coalesce(context_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_media_assets_updated_at on public.media_assets;

create trigger set_media_assets_updated_at
before update on public.media_assets
for each row
execute function public.set_updated_at();


