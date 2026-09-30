-- Optional: run if you already applied schema.sql before outreach_runs existed.
create table if not exists public.outreach_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  trigger text not null,
  status text not null,
  message text,
  execution_id text,
  triggered_by text,
  firm_name text,
  limit_count integer,
  created_at timestamptz not null default now()
);

create index if not exists outreach_runs_started_idx on public.outreach_runs (started_at desc);

grant select, insert, update, delete on public.outreach_runs to authenticated;

alter table public.outreach_runs enable row level security;

drop policy if exists outreach_runs_authenticated on public.outreach_runs;
create policy outreach_runs_authenticated on public.outreach_runs
  for all to authenticated using (true) with check (true);
