-- Pages publiques /matieres (sans compte) : aperçu limité d'une matière.
-- Rien d'autre n'est exposé : nombre de questions par chapitre et 5 QCM corrigés fixes.

create or replace function public.public_subject_chapters(p_subject text)
returns table(title text, questions bigint, annales bigint)
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(c.title, 'Général'), count(*), count(*) filter (where q.year is not null)
  from questions q
  left join chapters c on c.id = q.chapter_id
  where q.subject_id = p_subject and q.active
  group by c.title, c.order_index
  order by c.order_index nulls last, c.title
$$;

create or replace function public.public_sample_questions(p_subject text)
returns table(question text, choices jsonb, answer integer, explain text, chapter text, year integer)
language sql
stable
security definer
set search_path = public
as $$
  select q.question, q.choices, q.answer, q.explain, c.title, q.year::integer
  from questions q
  left join chapters c on c.id = q.chapter_id
  where q.subject_id = p_subject
    and q.active
    and q.type = 'qcm'
    and q.choices is not null
    and coalesce(trim(q.explain), '') <> ''
  order by md5(q.id::text)
  limit 5
$$;

revoke all on function public.public_subject_chapters(text) from public;
revoke all on function public.public_sample_questions(text) from public;
grant execute on function public.public_subject_chapters(text) to anon, authenticated;
grant execute on function public.public_sample_questions(text) to anon, authenticated;
