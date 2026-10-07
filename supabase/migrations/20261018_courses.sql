-- Page de cours pour les élèves : les cours approuvés (submissions.kind='course')
-- étaient conservés dans `submissions` mais jamais affichés. On les publie dans
-- une table dédiée, lisible par tout élève connecté, comme pour les questions.
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  subject_id text not null,
  chapter text,
  title text not null check (char_length(title) between 3 and 150),
  content text not null check (char_length(content) between 50 and 20000),
  author uuid references auth.users (id) on delete set null,
  submission_id uuid references public.submissions (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.courses enable row level security;

drop policy if exists courses_select on public.courses;
create policy courses_select on public.courses
  for select to authenticated using (true);

create index if not exists courses_subject_idx on public.courses (subject_id);

-- `admin_review_submission` (20261011) publie une question ou une correction à
-- l'approbation ; on lui ajoute la publication d'un cours dans `courses`.
create or replace function public.admin_review_submission(
  p_id uuid,
  p_approve boolean,
  p_note text default null,
  p_payload jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare s public.submissions; p jsonb;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select * into s from submissions where id = p_id and status = 'pending' for update;
  if s.id is null then raise exception 'not pending'; end if;
  p := coalesce(p_payload, s.payload);

  if p_approve and s.kind = 'question' then
    insert into questions (subject_id, type, question, choices, answer, answer_text, explain,
                           chapter_id, year, session, source, active)
    values (s.subject_id, p->>'type', p->>'question', nullif(p->'choices', 'null'::jsonb),
            (p->>'answer')::int, p->>'answer_text', p->>'explain',
            (p->>'chapter_id')::uuid, (p->>'year')::int, p->>'session',
            coalesce(p->>'source', 'Contributeur Examplay'), true);
  elsif p_approve and s.kind = 'correction' then
    update questions
    set type = p->>'type', question = p->>'question', choices = nullif(p->'choices', 'null'::jsonb),
        answer = (p->>'answer')::int, answer_text = p->>'answer_text', explain = p->>'explain',
        chapter_id = (p->>'chapter_id')::uuid, year = (p->>'year')::int,
        session = p->>'session', source = p->>'source'
    where id = s.question_id;
  elsif p_approve and s.kind = 'course' then
    insert into courses (subject_id, chapter, title, content, author, submission_id)
    values (s.subject_id, nullif(p->>'chapter', ''), p->>'title', p->>'content', s.author, s.id);
  end if;

  update submissions
  set status = case when p_approve then 'approved' else 'rejected' end,
      payload = p,
      admin_note = nullif(trim(coalesce(p_note, '')), ''),
      reviewed_at = now()
  where id = p_id;
end;
$$;

revoke all on function public.admin_review_submission(uuid, boolean, text, jsonb) from public, anon;
grant execute on function public.admin_review_submission(uuid, boolean, text, jsonb) to authenticated;
