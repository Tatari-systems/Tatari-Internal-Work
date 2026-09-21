-- Tatari Work schema. Run once in the Supabase SQL editor.
-- Auth stays in auth.users; Work data lives in public tables.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text,
  role text not null default 'reviewer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  task_seq integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  name text not null,
  slug text not null,
  description text,
  position integer not null default 0,
  archived_at timestamptz,
  created_by_id uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  project_id uuid not null references public.projects (id) on delete restrict,
  number integer not null,
  title text not null,
  description text,
  status text not null default 'todo',
  priority text not null default 'none',
  assignee_id uuid references public.profiles (id) on delete set null,
  created_by_id uuid not null references public.profiles (id) on delete restrict,
  due_at timestamptz,
  completed_at timestamptz,
  position numeric(18, 6) not null,
  is_test_data boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, number)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  action text not null,
  actor_id uuid references public.profiles (id) on delete set null,
  before_status text,
  after_status text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists profiles_role_active_idx on public.profiles (role, is_active);
create index if not exists projects_workspace_archived_idx on public.projects (workspace_id, archived_at, position);
create index if not exists tasks_project_status_idx on public.tasks (project_id, status, position);
create index if not exists tasks_assignee_status_idx on public.tasks (assignee_id, status, due_at);

create or replace function public.next_task_number(workspace uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_number integer;
begin
  update public.workspaces
  set task_seq = task_seq + 1, updated_at = now()
  where id = workspace
  returning task_seq into next_number;

  return next_number;
end;
$$;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles, public.workspaces, public.projects, public.tasks, public.audit_logs to authenticated;
grant execute on function public.next_task_number(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists profiles_authenticated on public.profiles;
create policy profiles_authenticated on public.profiles
  for all to authenticated using (true) with check (true);

drop policy if exists workspaces_authenticated on public.workspaces;
create policy workspaces_authenticated on public.workspaces
  for all to authenticated using (true) with check (true);

drop policy if exists projects_authenticated on public.projects;
create policy projects_authenticated on public.projects
  for all to authenticated using (true) with check (true);

drop policy if exists tasks_authenticated on public.tasks;
create policy tasks_authenticated on public.tasks
  for all to authenticated using (true) with check (true);

drop policy if exists audit_logs_authenticated on public.audit_logs;
create policy audit_logs_authenticated on public.audit_logs
  for all to authenticated using (true) with check (true);

alter table public.profiles alter column role set default 'reviewer';

insert into public.profiles (id, email, display_name, role, is_active)
values
  (
    '00000000-0000-4000-8000-000000000100',
    'seed-work@tatari.internal',
    'Tatari Seed',
    'admin',
    false
  ),
  ('00000000-0000-4000-8000-000000000111', 'dagim@tatari.systems', 'Dagim', 'admin', true),
  ('00000000-0000-4000-8000-000000000112', 'manish@tatari.systems', 'Manish', 'admin', true),
  ('00000000-0000-4000-8000-000000000113', 'aarash@tatari.systems', 'Aarash', 'admin', true),
  ('00000000-0000-4000-8000-000000000114', 'glodi@tatari.systems', 'Glodi', 'admin', true),
  ('00000000-0000-4000-8000-000000000115', 'yasha@tatari.systems', 'Yasha', 'admin', true)
on conflict (email) do update
set display_name = excluded.display_name,
    role = excluded.role,
    is_active = excluded.is_active;

insert into public.workspaces (id, slug, name, task_seq)
values (
  '00000000-0000-4000-8000-000000000200',
  'tatari',
  'Tatari',
  3
)
on conflict (slug) do update
set name = excluded.name;

insert into public.projects (id, workspace_id, name, slug, description, position, created_by_id)
values
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000200', 'Tatari 1.5', 'tatari-1-5', 'Compute Platform quote-to-commit.', 1, '00000000-0000-4000-8000-000000000100'),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000200', 'Tatari Internal Work', 'internal-work', 'Company ops tracker and internal work.', 2, '00000000-0000-4000-8000-000000000100'),
  ('00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000200', 'Tatari Mining ops', 'mining-ops', 'Site operations, power, and ASIC uptime.', 3, '00000000-0000-4000-8000-000000000100'),
  ('00000000-0000-4000-8000-000000000204', '00000000-0000-4000-8000-000000000200', 'Tatari Pitch', 'pitch', 'Investor materials and fundraising.', 4, '00000000-0000-4000-8000-000000000100')
on conflict (id) do update
set name = excluded.name,
    slug = excluded.slug,
    description = excluded.description,
    position = excluded.position;

update public.projects
set archived_at = coalesce(archived_at, now()),
    updated_at = now()
where workspace_id = '00000000-0000-4000-8000-000000000200'
  and slug in ('operations', 'mining', 'compute', 'hiring', 'finance', 'general');

insert into public.tasks (
  id, workspace_id, project_id, number, title, description, status, priority, created_by_id, position, is_test_data
)
values
  ('00000000-0000-4000-8000-000000000211', '00000000-0000-4000-8000-000000000200', '00000000-0000-4000-8000-000000000201', 1, 'Close the next quote-to-commit loop', 'Track the live Compute Platform path in Tatari 1.5.', 'todo', 'medium', '00000000-0000-4000-8000-000000000100', 1000, true),
  ('00000000-0000-4000-8000-000000000212', '00000000-0000-4000-8000-000000000200', '00000000-0000-4000-8000-000000000202', 2, 'Stand up weekly internal work review', 'Pick a weekday, owner, and notes template.', 'in_progress', 'high', '00000000-0000-4000-8000-000000000100', 1000, true),
  ('00000000-0000-4000-8000-000000000213', '00000000-0000-4000-8000-000000000200', '00000000-0000-4000-8000-000000000203', 3, 'Confirm Ethiopia uptime report', 'Pull last week''s mining uptime and flag gaps.', 'todo', 'low', '00000000-0000-4000-8000-000000000100', 1000, true)
on conflict (id) do update
set project_id = excluded.project_id,
    title = excluded.title,
    description = excluded.description,
    status = excluded.status;
