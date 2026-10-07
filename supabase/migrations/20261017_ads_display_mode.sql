-- L'admin choisit comment chaque publicité s'affiche : bannière (dans la page),
-- plein écran (interstitiel, par-dessus tout, à fermer) ou carré (format carte).
alter table public.ads
  add column if not exists display_mode text not null default 'banner'
  check (display_mode in ('banner', 'fullscreen', 'carre'));
