-- Tag duel (#bashing) schema

create table if not exists public.tag_duels (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid references auth.users(id) on delete set null,
  challenged_id uuid references auth.users(id) on delete set null,
  challenger_handle text not null,
  challenged_handle text not null,
  stake_tags text[] not null default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'active', 'completed', 'cancelled')),
  winner_id uuid references auth.users(id) on delete set null,
  winner_handle text,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  started_at timestamptz,
  completed_at timestamptz
);

create table if not exists public.tag_duel_rounds (
  id uuid primary key default gen_random_uuid(),
  duel_id uuid not null references public.tag_duels(id) on delete cascade,
  round_number integer not null,
  challenger_tags jsonb not null,
  challenged_tags jsonb not null,
  round_winner uuid references auth.users(id) on delete set null,
  round_winner_handle text,
  captured_tags text[] default '{}',
  metrics jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists idx_tag_duel_round on public.tag_duel_rounds (duel_id, round_number);

create table if not exists public.tag_duel_scores (
  id uuid primary key default gen_random_uuid(),
  duel_id uuid not null references public.tag_duels(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  display_handle text not null,
  score numeric not null default 0,
  momentum numeric not null default 0,
  tags_captured text[] not null default '{}',
  updated_at timestamptz not null default timezone('utc', now()),
  constraint uniq_tag_duel_score unique (duel_id, display_handle)
);

create table if not exists public.tag_duel_tag_transfers (
  id uuid primary key default gen_random_uuid(),
  duel_id uuid not null references public.tag_duels(id) on delete cascade,
  round_id uuid not null references public.tag_duel_rounds(id) on delete cascade,
  tag_name text not null,
  from_handle text,
  to_handle text,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.touch_tag_duel_score_updated()
returns trigger as
$$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create trigger trg_tag_duel_scores_touch
  before update on public.tag_duel_scores
  for each row execute function public.touch_tag_duel_score_updated();

create or replace view public.tag_duel_overview as
select
  d.id,
  d.challenger_handle,
  d.challenged_handle,
  d.status,
  d.stake_tags,
  d.winner_handle,
  d.created_at,
  d.started_at,
  d.completed_at,
  coalesce(sum(case when s.display_handle = d.challenger_handle then s.score end), 0) as challenger_score,
  coalesce(sum(case when s.display_handle = d.challenged_handle then s.score end), 0) as challenged_score,
  coalesce(array_agg(distinct t.tag_name) filter (where t.to_handle = d.challenger_handle), '{}') as challenger_captured,
  coalesce(array_agg(distinct t.tag_name) filter (where t.to_handle = d.challenged_handle), '{}') as challenged_captured
from public.tag_duels d
left join public.tag_duel_scores s on s.duel_id = d.id
left join public.tag_duel_tag_transfers t on t.duel_id = d.id
group by d.id;

