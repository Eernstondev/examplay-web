-- L'admin peut retoucher une proposition avant de l'approuver :
-- la fonction accepte maintenant le contenu modifié (p_payload).
drop function if exists public.admin_review_submission(uuid, boolean, text);

create function public.admin_review_submission(
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
  -- Version retouchée par l'admin si elle est fournie, sinon la proposition d'origine.
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
