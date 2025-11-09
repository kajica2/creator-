-- User rating system (1-5 scale)

create table if not exists public.user_ratings (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid references auth.users(id) on delete cascade,
  target_handle text not null,
  reviewer_user_id uuid references auth.users(id) on delete set null,
  reviewer_handle text,
  score integer not null check (score between 1 and 5),
  feedback text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint uniq_user_rating unique (target_user_id, reviewer_user_id, target_handle, reviewer_handle)
);

create index if not exists idx_user_ratings_target_handle on public.user_ratings (target_handle);
create index if not exists idx_user_ratings_target_user on public.user_ratings (target_user_id);

create or replace function public.touch_user_ratings_updated()
returns trigger as
$$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create trigger trg_user_ratings_touch
  before update on public.user_ratings
  for each row execute function public.touch_user_ratings_updated();

create or replace view public.user_rating_summary as
select
  coalesce(target_user_id::text, target_handle) as target_key,
  target_user_id,
  target_handle,
  avg(score)::numeric(10,2) as average_score,
  count(*) as total_ratings,
  count(*) filter (where score = 5) as five_star,
  count(*) filter (where score = 4) as four_star,
  count(*) filter (where score = 3) as three_star,
  count(*) filter (where score = 2) as two_star,
  count(*) filter (where score = 1) as one_star,
  max(updated_at) as last_reviewed_at
from public.user_ratings
group by target_user_id, target_handle;

