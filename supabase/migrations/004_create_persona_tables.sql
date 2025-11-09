-- Personas & Generated Content
create table if not exists public.personas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  context text default '',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type if not exists public.prompt_type as enum (
  'AI Story',
  'Suno Lyrics',
  'Website Strategy',
  'AI Skill Guide',
  'Tensor Mutation',
  'AI Concept',
  'Text-to-Image',
  'Image Edit',
  'Batch Images',
  'Batch Image Prompts',
  'AI Website',
  'Thinking Mode',
  'Audio Transcriber'
);

create table if not exists public.persona_content (
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

create index if not exists persona_content_persona_idx on public.persona_content (persona_id);
create index if not exists persona_content_user_idx on public.persona_content (user_id, created_at desc);

alter table public.personas
  add column if not exists content_count integer not null default 0;

create or replace function public.update_persona_content_count()
returns trigger as $$
begin
  update public.personas
  set content_count = (
    select count(*)
    from public.persona_content pc
    where pc.persona_id = new.persona_id
  ),
  updated_at = now()
  where id = new.persona_id;

  return new;
end;
$$ language plpgsql;

create or replace function public.decrement_persona_content_count()
returns trigger as $$
begin
  update public.personas
  set content_count = greatest(
    (
      select count(*)
      from public.persona_content pc
      where pc.persona_id = old.persona_id
    ),
    0
  ),
  updated_at = now()
  where id = old.persona_id;

  return old;
end;
$$ language plpgsql;

drop trigger if exists persona_content_insert_trigger on public.persona_content;
create trigger persona_content_insert_trigger
after insert on public.persona_content
for each row
execute function public.update_persona_content_count();

drop trigger if exists persona_content_delete_trigger on public.persona_content;
create trigger persona_content_delete_trigger
after delete on public.persona_content
for each row
execute function public.decrement_persona_content_count();

alter table public.personas enable row level security;
alter table public.persona_content enable row level security;

create policy if not exists "personas_select_policy"
  on public.personas
  for select
  using (auth.uid() = user_id);

create policy if not exists "personas_insert_policy"
  on public.personas
  for insert
  with check (auth.uid() = user_id);

create policy if not exists "personas_update_policy"
  on public.personas
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "personas_delete_policy"
  on public.personas
  for delete
  using (auth.uid() = user_id);

create policy if not exists "persona_content_select_policy"
  on public.persona_content
  for select
  using (auth.uid() = user_id);

create policy if not exists "persona_content_insert_policy"
  on public.persona_content
  for insert
  with check (auth.uid() = user_id);

create policy if not exists "persona_content_update_policy"
  on public.persona_content
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "persona_content_delete_policy"
  on public.persona_content
  for delete
  using (auth.uid() = user_id);

