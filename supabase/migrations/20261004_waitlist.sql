-- Liste d'attente du site vitrine.
-- Insertion ouverte au public, lecture interdite (aucune policy SELECT) :
-- les e-mails ne sont consultables que depuis le dashboard Supabase.
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique
    check (email = lower(email) and char_length(email) between 5 and 254),
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

create policy "waitlist_public_insert"
  on public.waitlist
  for insert
  to anon, authenticated
  with check (true);
