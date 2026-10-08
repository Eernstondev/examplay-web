-- Où afficher une publicité : sur le site, dans l'application mobile, ou les deux.
-- Les publicités existantes restent visibles partout.

alter table public.ads
  add column if not exists surfaces text[] not null default array['web', 'app'];

alter table public.ads drop constraint if exists ads_surfaces_check;
alter table public.ads
  add constraint ads_surfaces_check check (
    cardinality(surfaces) > 0
    and surfaces <@ array['web', 'app']
  );
