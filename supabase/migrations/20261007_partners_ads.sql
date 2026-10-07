-- Partenaires (page Collaborateurs) et publicités, gérés depuis la zone admin.
-- À exécuter après 20261006_admin.sql (utilise is_admin()).

-- ── Images : bucket public, écriture réservée aux admins ──────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy media_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (select public.is_admin()));
create policy media_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));
create policy media_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));

-- ── Partenaires ───────────────────────────────────────────────────────────
create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('sponsor', 'expert', 'institution')),
  name text not null check (char_length(name) between 2 and 120),
  description text check (char_length(description) <= 600),
  logo_url text,
  website text,
  facebook text,
  instagram text,
  tiktok text,
  order_index integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.partners enable row level security;

create policy partners_public_read on public.partners
  for select to anon, authenticated using (active);
create policy partners_admin_all on public.partners
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ── Publicités ────────────────────────────────────────────────────────────
create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 120),
  image_url text not null,
  link_url text,
  -- Emplacements : 'home', 'dashboard', 'matieres'
  placements text[] not null check (
    cardinality(placements) > 0 and placements <@ array['home', 'dashboard', 'matieres']
  ),
  -- Départements ciblés ; tableau vide = tous les départements
  departments text[] not null default '{}',
  audience text not null default 'all' check (audience in ('all', '9e', 'ns4')),
  starts_on date,
  ends_on date,
  active boolean not null default true,
  clicks integer not null default 0,
  created_at timestamptz not null default now(),
  check (starts_on is null or ends_on is null or ends_on >= starts_on)
);

alter table public.ads enable row level security;

-- Le public ne voit que les publicités actives et dans leur période (heure d'Haïti).
create policy ads_public_read on public.ads
  for select to anon, authenticated
  using (
    active
    and (starts_on is null or starts_on <= (now() at time zone 'America/Port-au-Prince')::date)
    and (ends_on is null or ends_on >= (now() at time zone 'America/Port-au-Prince')::date)
  );
create policy ads_admin_all on public.ads
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Compte un clic et renvoie le lien de destination.
create or replace function public.ad_click(p_id uuid)
returns text
language sql
security definer
set search_path = public
as $$
  update public.ads set clicks = clicks + 1
  where id = p_id and active
  returning link_url;
$$;

revoke all on function public.ad_click(uuid) from public;
grant execute on function public.ad_click(uuid) to anon, authenticated;
