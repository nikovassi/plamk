-- Lead management schema.
-- Security model:
--   * The public NEVER talks to these tables directly (no anon policies at all).
--   * Only the Edge Function `submit-lead` (service role) inserts leads and files.
--   * Authenticated users listed in public.admin_users can read/update leads and add notes.
--   * Files live in the PRIVATE bucket `lead-files`; admins get short-lived signed URLs.

create extension if not exists pgcrypto;

create type public.lead_status as enum ('new', 'in_progress', 'quoted', 'won', 'lost');

create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.lead_counters (
  year int primary key,
  last int not null default 0
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  kind text not null check (kind in ('full', 'quick')),
  status public.lead_status not null default 'new',
  name text not null check (char_length(name) between 2 and 80),
  company text check (char_length(company) <= 120),
  phone text not null check (char_length(phone) between 6 and 20),
  email text check (char_length(email) <= 160),
  project_type text,
  service text,
  materials text[] not null default '{}',
  area text,
  city text not null check (char_length(city) between 2 and 80),
  address text check (char_length(address) <= 160),
  gps jsonb,
  has_project text,
  message text check (char_length(message) <= 2000),
  source text check (char_length(source) <= 80),
  consent_at timestamptz not null,
  -- GDPR: anonymised instead of hard-deleted when the business needs the statistics
  anonymised_at timestamptz
);

create index leads_created_at_idx on public.leads (created_at desc);
create index leads_status_idx on public.leads (status);

create table public.lead_files (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  path text not null unique,
  name text not null,
  mime text not null,
  size int not null check (size > 0 and size <= 10485760),
  created_at timestamptz not null default now()
);

create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users (id),
  author_email text default (auth.jwt() ->> 'email'),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

-- REQ-YYYY-NNNN, gap-free per year, safe under concurrency
create or replace function public.next_lead_reference()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  y int := extract(year from now() at time zone 'Europe/Sofia');
  n int;
begin
  insert into lead_counters (year, last) values (y, 1)
  on conflict (year) do update set last = lead_counters.last + 1
  returning last into n;
  return format('REQ-%s-%s', y, lpad(n::text, 4, '0'));
end;
$$;
revoke all on function public.next_lead_reference() from public, anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger leads_touch before update on public.leads for each row execute function public.touch_updated_at();

-- Row Level Security
alter table public.admin_users enable row level security;
alter table public.lead_counters enable row level security;
alter table public.leads enable row level security;
alter table public.lead_files enable row level security;
alter table public.lead_notes enable row level security;

create policy "admins read leads" on public.leads for select to authenticated using (public.is_admin());
create policy "admins update leads" on public.leads for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete leads" on public.leads for delete to authenticated using (public.is_admin());
create policy "admins read files" on public.lead_files for select to authenticated using (public.is_admin());
create policy "admins read notes" on public.lead_notes for select to authenticated using (public.is_admin());
create policy "admins add notes" on public.lead_notes for insert to authenticated with check (public.is_admin() and author_id = auth.uid());
create policy "admins see admins" on public.admin_users for select to authenticated using (public.is_admin());

-- Admins may only change the status column from the dashboard
revoke update on public.leads from authenticated;
grant update (status) on public.leads to authenticated;

-- Private storage bucket for attachments
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lead-files', 'lead-files', false, 10485760,
        array['application/pdf', 'image/jpeg', 'image/png', 'application/acad', 'image/vnd.dwg', 'application/octet-stream'])
on conflict (id) do nothing;

create policy "admins read lead files" on storage.objects for select to authenticated
  using (bucket_id = 'lead-files' and public.is_admin());
create policy "admins delete lead files" on storage.objects for delete to authenticated
  using (bucket_id = 'lead-files' and public.is_admin());

-- GDPR helper: erase a person's data on request (run as admin / service role)
create or replace function public.erase_lead(p_reference text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare l_id uuid;
begin
  if not public.is_admin() and current_user <> 'service_role' then
    raise exception 'not allowed';
  end if;
  select id into l_id from leads where reference = p_reference;
  if l_id is null then return; end if;
  delete from storage.objects where bucket_id = 'lead-files' and name like l_id::text || '/%';
  delete from leads where id = l_id; -- cascades to files + notes
end;
$$;
revoke all on function public.erase_lead(text) from public, anon;
grant execute on function public.erase_lead(text) to authenticated;
