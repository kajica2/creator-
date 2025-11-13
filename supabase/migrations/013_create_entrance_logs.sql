create extension if not exists "citext";
create extension if not exists "pgcrypto";

create table if not exists public.admin_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email citext unique not null,
  gemini_api_key text,
  gemini_api_key_last4 text,
  drive_refresh_token text,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is 'Allow-listed admin accounts used for RLS policies.';
comment on column public.admin_users.gemini_api_key is 'Stored Gemini API key for admin-level model usage (encrypted at rest via database encryption).';
comment on column public.admin_users.gemini_api_key_last4 is 'Redacted view of Gemini API key for confirmation.';
comment on column public.admin_users.drive_refresh_token is 'Google Drive OAuth refresh token for offline access.';

alter table public.admin_users enable row level security;

create policy "Admins manage own credentials"
  on public.admin_users
  for select
  using (auth.uid() = id);

create policy "Admins can upsert credentials"
  on public.admin_users
  for insert
  with check (auth.uid() = id);

create policy "Admins update own credentials"
  on public.admin_users
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Service role manages admin registry"
  on public.admin_users
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create index if not exists entrance_logs_role_idx on public.entrance_logs (role);
create index if not exists entrance_logs_created_at_idx on public.entrance_logs (created_at desc);
create index if not exists admin_users_email_idx on public.admin_users (email);

create table if not exists public.entrance_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  role text not null check (role in ('visitor', 'user', 'admin')),
  ip_address inet not null,
  user_agent text,
  cookie_snapshot jsonb,
  drive_connected boolean default false,
  created_at timestamptz not null default now()
);

comment on table public.entrance_logs is 'Audit log of initial entrances by role with IP, cookie, and Drive linkage data.';
comment on column public.entrance_logs.cookie_snapshot is 'Partial snapshot of sanitized cookie key/value pairs.';

alter table public.entrance_logs enable row level security;

create policy "Allow insert via edge functions"
  on public.entrance_logs
  for insert
  with check (auth.role() = 'service_role');

create policy "Admins can view entrance logs"
  on public.entrance_logs
  for select
  using (
    auth.uid() in (
      select id from public.admin_users
    )
  );

