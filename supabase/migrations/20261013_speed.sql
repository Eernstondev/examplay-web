-- Vitesse : le profil et les rôles du compte connecté en UN seul appel,
-- et des index pour les requêtes les plus fréquentes.
-- À exécuter après toutes les migrations précédentes.

create or replace function public.my_context()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select case when auth.uid() is null then null else json_build_object(
    'id', auth.uid(),
    'email', u.email,
    'name', coalesce(nullif(p.name, ''), u.raw_user_meta_data->>'name'),
    'level', p.level,
    'department', p.department,
    'referral_code', p.referral_code,
    'is_admin', exists (select 1 from admins a where a.user_id = auth.uid()),
    'is_contributor', exists (select 1 from contributors c where c.user_id = auth.uid())
  ) end
  from (select 1) one
  left join auth.users u on u.id = auth.uid()
  left join profiles p on p.id = auth.uid();
$$;

revoke all on function public.my_context() from public, anon;
grant execute on function public.my_context() to authenticated;

-- Index : résultats d'un élève, classement (duels gagnés), tirage des questions, chapitres.
create index if not exists results_user_created_idx on public.results (user_id, created_at desc);
create index if not exists duels_winner_idx on public.duels (winner);
create index if not exists duels_challenger_idx on public.duels (challenger);
create index if not exists duels_opponent_idx on public.duels (opponent);
create index if not exists questions_subject_type_active_idx on public.questions (subject_id, type) where active;
create index if not exists chapters_subject_idx on public.chapters (subject_id, order_index);
