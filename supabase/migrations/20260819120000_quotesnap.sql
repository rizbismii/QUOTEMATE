-- QuoteSnap workspace store (JSON job book).
-- Link a hosted project and run: npx supabase db push

create table if not exists public.workspaces (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.workspaces enable row level security;

drop policy if exists workspaces_select on public.workspaces;
create policy workspaces_select on public.workspaces
  for select using (true);

drop policy if exists workspaces_insert on public.workspaces;
create policy workspaces_insert on public.workspaces
  for insert with check (true);

drop policy if exists workspaces_update on public.workspaces;
create policy workspaces_update on public.workspaces
  for update using (true);

insert into public.workspaces (id, payload)
values ('quotesnap-demo', '{}'::jsonb)
on conflict (id) do nothing;
