-- Social posting queue for Instagram/YouTube workers

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('instagram', 'youtube')),
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'posted', 'failed')),
  media_url text,
  thumbnail_url text,
  caption text,
  title text,
  tags text[],
  scheduled_at timestamptz default timezone('utc', now()),
  posted_at timestamptz,
  error_message text,
  metadata jsonb,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create table if not exists public.social_post_attempts (
  id uuid primary key default gen_random_uuid(),
  social_post_id uuid not null references public.social_posts(id) on delete cascade,
  status text not null,
  response jsonb,
  created_at timestamptz default timezone('utc', now())
);

create index if not exists idx_social_posts_status on public.social_posts (status);
create index if not exists idx_social_posts_platform on public.social_posts (platform);

create or replace function public.touch_social_posts_updated()
returns trigger as
$$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create trigger trg_social_posts_touch
  before update on public.social_posts
  for each row execute function public.touch_social_posts_updated();

