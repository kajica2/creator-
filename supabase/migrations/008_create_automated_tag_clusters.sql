-- Automated tag cloud storage

create table if not exists public.automated_tag_clusters (
  id uuid primary key default gen_random_uuid(),
  cluster_type text not null default 'hashtag',
  segment_key text not null,
  filters jsonb not null default '{}'::jsonb,
  hashtags jsonb not null,
  metrics jsonb,
  generated_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_automated_tag_clusters_type_segment
  on public.automated_tag_clusters (cluster_type, segment_key, generated_at desc);

create or replace function public.get_latest_automated_tag_clusters(
  p_cluster_type text default 'hashtag',
  p_segment_key text default null,
  p_limit integer default 5
)
returns table (
  id uuid,
  cluster_type text,
  segment_key text,
  filters jsonb,
  hashtags jsonb,
  metrics jsonb,
  generated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz
) as
$$
begin
  return query
  select
    c.id,
    c.cluster_type,
    c.segment_key,
    c.filters,
    c.hashtags,
    c.metrics,
    c.generated_at,
    c.expires_at,
    c.created_at
  from public.automated_tag_clusters c
  where c.cluster_type = coalesce(p_cluster_type, 'hashtag')
    and (p_segment_key is null or c.segment_key = p_segment_key)
  order by c.generated_at desc
  limit coalesce(p_limit, 5);
end;
$$ language plpgsql stable;

