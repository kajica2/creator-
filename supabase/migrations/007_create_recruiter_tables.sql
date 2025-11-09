-- Recruiter growth infrastructure

create extension if not exists "pgcrypto";

create table if not exists public.recruiter_opportunities (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  target_profile jsonb,
  tags text[] default '{}',
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'filled', 'closed')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'critical')),
  expected_value numeric,
  auto_invite boolean default false,
  metadata jsonb,
  source_channel text default 'agent',
  due_at timestamptz,
  last_activity_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.recruiter_invites (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid references auth.users(id) on delete set null,
  opportunity_id uuid references public.recruiter_opportunities(id) on delete cascade,
  invitee_email text not null,
  invitee_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'accepted', 'declined', 'expired')),
  invite_token uuid not null default gen_random_uuid(),
  metadata jsonb,
  sent_at timestamptz default now(),
  responded_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.recruiter_activity_log (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid references auth.users(id) on delete set null,
  opportunity_id uuid references public.recruiter_opportunities(id) on delete cascade,
  invite_id uuid references public.recruiter_invites(id) on delete cascade,
  action text not null,
  details jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_recruiter_opportunities_recruiter
  on public.recruiter_opportunities (recruiter_id);

create index if not exists idx_recruiter_opportunities_status
  on public.recruiter_opportunities (status);

create index if not exists idx_recruiter_invites_recruiter
  on public.recruiter_invites (recruiter_id);

create index if not exists idx_recruiter_invites_opportunity
  on public.recruiter_invites (opportunity_id);

create or replace function public.set_updated_at()
returns trigger as
$$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create trigger trg_recruiter_opportunities_updated
  before update on public.recruiter_opportunities
  for each row
  execute function public.set_updated_at();

create trigger trg_recruiter_invites_updated
  before update on public.recruiter_invites
  for each row
  execute function public.set_updated_at();

create or replace function public.recruiter_touch_activity()
returns trigger as
$$
begin
  update public.recruiter_opportunities
  set last_activity_at = timezone('utc', now())
  where id = new.opportunity_id;
  return new;
end;
$$ language plpgsql;

create trigger trg_recruiter_invites_activity
  after insert or update on public.recruiter_invites
  for each row
  execute function public.recruiter_touch_activity();

create or replace view public.recruiter_dashboard_stats as
select
  ro.recruiter_id,
  count(ro.*) as total_opportunities,
  count(*) filter (where ro.status = 'active') as active_opportunities,
  count(*) filter (where ro.status = 'filled') as filled_opportunities,
  count(*) filter (where ro.status = 'closed') as closed_opportunities,
  coalesce(sum(inv.total_invites), 0) as total_invites,
  coalesce(sum(inv.accepted_invites), 0) as accepted_invites,
  coalesce(sum(inv.pending_invites), 0) as pending_invites,
  coalesce(sum(inv.declined_invites), 0) as declined_invites,
  coalesce(sum(inv.expired_invites), 0) as expired_invites,
  max(ro.updated_at) as last_opportunity_update
from public.recruiter_opportunities ro
left join lateral (
  select
    count(*) as total_invites,
    count(*) filter (where status = 'accepted') as accepted_invites,
    count(*) filter (where status = 'pending') as pending_invites,
    count(*) filter (where status = 'declined') as declined_invites,
    count(*) filter (where status = 'expired') as expired_invites
  from public.recruiter_invites ri
  where ri.opportunity_id = ro.id
) inv on true
group by ro.recruiter_id;

create or replace function public.get_recruiter_recent_activity(p_recruiter_id uuid, p_limit integer default 20)
returns table (
  id uuid,
  recruiter_id uuid,
  opportunity_id uuid,
  invite_id uuid,
  action text,
  details jsonb,
  created_at timestamptz
) as
$$
begin
  return query
  select
    ral.id,
    ral.recruiter_id,
    ral.opportunity_id,
    ral.invite_id,
    ral.action,
    ral.details,
    ral.created_at
  from public.recruiter_activity_log ral
  where ral.recruiter_id = p_recruiter_id
  order by ral.created_at desc
  limit p_limit;
end;
$$ language plpgsql stable;

