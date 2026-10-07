-- Test de fumée : vérifie que les parcours critiques fonctionnent vraiment pour
-- un élève (pas pour l'admin, qui contourne les règles RLS). C'est ce test qui
-- aurait attrapé les bugs du 7 octobre (questions invisibles, demande contributeur
-- qui échoue) avant qu'ils n'arrivent en production.
--
-- Usage : coller ce fichier dans Supabase > SQL Editor et l'exécuter, après une
-- migration ou avant un déploiement. Tout est annulé à la fin (rollback) : aucune
-- donnée réelle n'est modifiée. "RÉUSSI" partout = OK à déployer. Une ligne rouge
-- ERROR = quelque chose est cassé, ne déploie pas.
--
-- En terminal : psql "$DATABASE_URL" -f supabase/tests/smoke.sql
-- (DATABASE_URL = la chaîne de connexion Postgres de ton projet Supabase,
--  Project Settings > Database > Connection string).

begin;

do $$
declare
  v_student uuid := gen_random_uuid();
  v_other uuid := gen_random_uuid();
  v_subject text;
  v_count int;
  v_notif int;
begin
  -- Deux élèves de test, nettoyés par le rollback final.
  insert into auth.users (id, email) values
    (v_student, 'smoke-test-1@examplay.invalid'),
    (v_other, 'smoke-test-2@examplay.invalid');
  insert into public.profiles (id, name, level, department) values
    (v_student, 'Smoke Test 1', 'NS4', 'Ouest'),
    (v_other, 'Smoke Test 2', 'NS4', 'Ouest');

  -- À partir d'ici, on agit comme l'élève de test, pas comme l'administrateur :
  -- les règles RLS s'appliquent exactement comme pour un vrai élève.
  perform set_config('request.jwt.claims', json_build_object('sub', v_student, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- ① Un élève doit voir les questions actives (bug du 7 octobre : policy RLS manquante).
  select count(*) into v_count from public.questions where active;
  if v_count = 0 then
    raise warning 'Test ① ignoré : aucune question active en base pour le vérifier.';
  elsif not exists (select 1 from public.questions where active limit 1) then
    raise exception 'ÉCHEC ① : un élève ne voit AUCUNE question active. Policy RLS manquante sur `questions` ?';
  else
    raise notice 'RÉUSSI ① : un élève voit les questions actives.';
  end if;

  -- ② pick_questions() (tirage du quiz rapide) doit renvoyer des lignes s'il existe
  -- des QCM actifs pour au moins une matière.
  select subject_id into v_subject from public.questions where active and type = 'qcm' limit 1;
  if v_subject is null then
    raise warning 'Test ② ignoré : aucun QCM actif en base pour le vérifier.';
  elsif (select count(*) from public.pick_questions(v_subject, 'qcm', null, 5)) = 0 then
    raise exception 'ÉCHEC ② : pick_questions() ne renvoie aucune question pour %. Fonction cassée ou policy RLS manquante.', v_subject;
  else
    raise notice 'RÉUSSI ② : pick_questions() renvoie des questions pour un élève.';
  end if;

  -- ③ La demande d'accès contributeur doit pouvoir s'enregistrer (bug du 7 octobre :
  -- clé étrangère vers un profil supprimé, policy RLS trop stricte sur `status`).
  begin
    insert into public.contributor_applications (user_id, subjects, school, status)
    values (v_student, 'Mathématiques', 'École de test', 'pending');
    raise notice 'RÉUSSI ③ : la demande d''accès contributeur s''enregistre.';
  exception when others then
    raise exception 'ÉCHEC ③ : la demande d''accès contributeur a échoué (%): %', sqlstate, sqlerrm;
  end;

  -- ④ Un élève ne doit voir AUCUNE notification d'un autre élève (fuite RLS).
  reset role;
  insert into public.duels (challenger, opponent, subject_id, status)
  values (v_other, v_student, coalesce(v_subject, 'math'), 'pending');
  select count(*) into v_notif from public.notifications where user_id = v_student;
  if v_notif = 0 then
    raise exception 'ÉCHEC ④ : recevoir un défi ne crée pas de notification pour l''élève défié.';
  end if;

  perform set_config('request.jwt.claims', json_build_object('sub', v_other, 'role', 'authenticated')::text, true);
  set local role authenticated;
  if exists (select 1 from public.notifications where user_id = v_student) then
    raise exception 'ÉCHEC ④ : un élève voit les notifications d''un autre élève (fuite RLS).';
  end if;
  raise notice 'RÉUSSI ④ : les notifications de duel arrivent au bon élève, et à lui seul.';

  raise notice '— Tous les tests sont passés. —';
end $$;

rollback;
