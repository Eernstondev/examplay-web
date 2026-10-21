-- Audit du contenu (lecture seule) : à lancer dans le SQL Editor de Supabase.

-- 1. Par matière : volume, QCM, explications manquantes, questions d'annales.
select
  q.subject_id,
  count(*)                                                    as total,
  count(*) filter (where q.type = 'qcm')                      as qcm,
  count(*) filter (where coalesce(trim(q.explain), '') = '')  as sans_explication,
  count(*) filter (where q.chapter_id is null)                as sans_chapitre,
  count(*) filter (where q.year is not null)                  as annales
from questions q
where q.active
group by q.subject_id
order by total;

-- 2. Par chapitre : les chapitres trop maigres (moins de 30 questions) en premier.
select
  q.subject_id,
  coalesce(c.title, '(sans chapitre)')                        as chapitre,
  count(*)                                                    as total,
  count(*) filter (where coalesce(trim(q.explain), '') = '')  as sans_explication
from questions q
left join chapters c on c.id = q.chapter_id
where q.active
group by q.subject_id, c.title
order by count(*), q.subject_id;

-- 3. Questions sans explication (export CSV pour les compléter).
select q.id, q.subject_id, c.title as chapitre, q.type, q.question, q.choices, q.answer, q.answer_text
from questions q
left join chapters c on c.id = q.chapter_id
where q.active and coalesce(trim(q.explain), '') = ''
order by q.subject_id, c.title;
