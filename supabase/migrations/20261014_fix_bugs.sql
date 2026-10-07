-- Corrections des bugs critiques

-- ① (retiré) Le profil de l'admin n'est PAS recréé : il reste hors des classements.
--    La demande contributeur ne dépend plus du profil (voir 20261016).

-- ② Corriger les politiques RLS de contributor_applications pour INSERT
-- Le problème : la vérification RLS teste status='pending' mais le default n'est pas appliqué à temps
-- Solution : utiliser coalesce dans la vérification
drop policy if exists applications_insert_own on public.contributor_applications;

create policy applications_insert_own on public.contributor_applications
  for insert to authenticated with check (
    user_id = auth.uid()
    and coalesce(status, 'pending') = 'pending'
  );

-- ③ Les mises à jour de statut passent uniquement par admin_review_application()
-- (fonction security definer, migration 20261012) : elle n'a pas besoin d'une policy UPDATE,
-- et en accorder une à authenticated serait inutile tant qu'aucune policy ne l'autorise.
-- (Note : « create policy if not exists » n'existe pas en PostgreSQL — cette instruction
-- faisait échouer toute la migration, donc rien ci-dessus n'avait encore été appliqué.)
