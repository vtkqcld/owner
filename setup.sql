-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run
create table if not exists public.sw_state (
  id int primary key,
  data jsonb not null,
  rev bigint not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.sw_state enable row level security;
drop policy if exists "skyworld prototype access" on public.sw_state;
create policy "skyworld prototype access" on public.sw_state for all to anon using (true) with check (true);
