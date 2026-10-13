-- Duels : correctifs de l'audit (octobre 2026).
-- 1. Supprime l'ancienne duel_progress(p_id, p_score, p_done) : elle acceptait un score envoyé
--    par le client, donc n'importe qui pouvait s'attribuer 5/5.
-- 2. Duels « Toutes matières » (subject_id = 'mixte') : la question est cherchée dans toutes les
--    matières (avant : jamais trouvée, score toujours 0).
-- 3. Les réponses données sont gardées sur le serveur : un duel interrompu reprend à la bonne
--    question, et une réponse déjà envoyée ne peut plus être modifiée.

drop function if exists public.duel_progress(uuid, integer, boolean);

alter table public.duels
  add column if not exists challenger_answers jsonb not null default '[]'::jsonb,
  add column if not exists opponent_answers jsonb not null default '[]'::jsonb;

create or replace function public.duel_progress(p_id uuid, p_answers jsonb, p_done boolean)
returns public.duels
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.duels;
  v_me uuid := auth.uid();
  v_prev jsonb;
  v_len int;
  i int;
  elem jsonb;
  real_answer int;
  computed_score int := 0;
begin
  if jsonb_typeof(p_answers) is distinct from 'array' then raise exception 'bad answers'; end if;
  v_len := jsonb_array_length(p_answers);
  if v_len > 5 then raise exception 'bad answers'; end if;

  select * into v from public.duels
   where id = p_id and status = 'accepted' and v_me in (challenger, opponent) for update;
  if v.id is null then raise exception 'duel unavailable'; end if;

  -- Les réponses déjà enregistrées ne changent plus : la nouvelle liste doit les reprendre à l'identique.
  v_prev := case when v.challenger = v_me then v.challenger_answers else v.opponent_answers end;
  if v_len < jsonb_array_length(v_prev) then raise exception 'answers locked'; end if;
  for i in 0 .. jsonb_array_length(v_prev) - 1 loop
    if (p_answers -> i ->> 'q') is distinct from (v_prev -> i ->> 'q')
       or (p_answers -> i ->> 'given') is distinct from (v_prev -> i ->> 'given') then
      raise exception 'answers locked';
    end if;
  end loop;

  -- Score recalculé à partir des vraies réponses, jamais d'un score envoyé par le client.
  for elem in select * from jsonb_array_elements(p_answers) loop
    real_answer := null;
    select q.answer into real_answer
      from public.questions q
     where q.question = elem ->> 'q'
       and q.type = 'qcm'
       and (v.subject_id = 'mixte' or q.subject_id = v.subject_id)
     limit 1;
    if real_answer is not null and (elem ->> 'given') ~ '^-?\d+$' and (elem ->> 'given')::int = real_answer then
      computed_score := computed_score + 1;
    end if;
  end loop;

  if v.challenger = v_me then
    update public.duels set challenger_answers = p_answers, challenger_score = computed_score,
           challenger_done = challenger_done or p_done, updated_at = now()
     where id = p_id returning * into v;
  else
    update public.duels set opponent_answers = p_answers, opponent_score = computed_score,
           opponent_done = opponent_done or p_done, updated_at = now()
     where id = p_id returning * into v;
  end if;

  if v.challenger_done and v.opponent_done then
    update public.duels set status = 'finished', updated_at = now(),
      winner = case when challenger_score > opponent_score then challenger
                    when opponent_score > challenger_score then opponent else null end
     where id = p_id returning * into v;
  end if;
  return v;
end
$$;

revoke all on function public.duel_progress(uuid, jsonb, boolean) from public, anon;
grant execute on function public.duel_progress(uuid, jsonb, boolean) to authenticated;
