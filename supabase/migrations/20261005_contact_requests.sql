-- Demandes envoyées depuis le formulaire de la page Investisseurs.
-- Insertion ouverte au public, lecture interdite (aucune policy SELECT).
create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) between 5 and 254),
  subject text not null check (
    subject in ('investissement', 'partenariat', 'sponsoring', 'autre')
  ),
  message text not null check (char_length(message) between 10 and 4000),
  created_at timestamptz not null default now()
);

alter table public.contact_requests enable row level security;

create policy "contact_requests_public_insert"
  on public.contact_requests
  for insert
  to anon, authenticated
  with check (true);
