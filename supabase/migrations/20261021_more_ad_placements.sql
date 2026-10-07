-- Nouveaux emplacements de publicité : avant/après un quiz, duels, classement, progression.
-- La contrainte d'origine n'autorisait que 'home', 'dashboard', 'matieres'.

do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.ads'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%placements%'
  loop
    execute format('alter table public.ads drop constraint %I', c);
  end loop;
end $$;

alter table public.ads
  add constraint ads_placements_check check (
    cardinality(placements) > 0
    and placements <@ array[
      'home', 'dashboard', 'matieres',
      'avant_quiz', 'apres_quiz', 'duel', 'classement', 'progression'
    ]
  );
