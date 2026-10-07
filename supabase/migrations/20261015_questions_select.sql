-- Correction critique : les élèves ne pouvaient voir AUCUNE question.
--
-- Depuis la migration 20261006_admin.sql, la seule policy SELECT sur `public.questions`
-- est réservée aux admins (questions_admin_select). Comme is_admin() est faux pour un
-- élève, Postgres ne lui renvoie aucune ligne — ni via une lecture directe
-- (simulation, réponse courte, rédaction, fiches, duels), ni via pick_questions()
-- (fonction « invoker » : elle respecte les mêmes règles RLS que l'utilisateur connecté).
-- Résultat : tous les modes de jeu semblent vides pour tout le monde sauf le compte admin,
-- sur le site comme dans l'app mobile puisqu'ils utilisent le même projet Supabase.
--
-- Les policies RLS sont combinées en OR : ajouter celle-ci n'enlève rien à
-- questions_admin_select (qui laisse aussi voir les questions désactivées pour l'admin).
drop policy if exists questions_active_select on public.questions;
create policy questions_active_select on public.questions
  for select to authenticated using (active);
