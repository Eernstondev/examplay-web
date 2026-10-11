-- Classement filtrable par département et par niveau.
-- p_department : null = tout Haïti. p_level : null = tous, '9e', 'ns4' (toutes les séries) ou l'identifiant d'une série.
-- Points : 10 par bonne réponse, 30 par duel gagné (même règle que le classement existant).
-- La ligne de l'élève connecté est toujours renvoyée, même hors du top p_limit.

create or replace function public.ranking(
  p_department text default null,
  p_level text default null,
  p_limit integer default 100
)
returns table (
  user_id uuid, name text, avatar text, department text, level text,
  points bigint, pos bigint, total bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with base as (
    select p.id, p.name, p.avatar, p.department, p.level
    from public.profiles p
    where auth.uid() is not null
      and (p_department is null or p.department = p_department)
      and (
        p_level is null
        or (p_level = 'ns4' and p.level <> '9e')
        or p.level = p_level
      )
  ),
  scored as (
    select b.*,
      coalesce((select sum(r.correct) from public.results r where r.user_id = b.id), 0) * 10
      + (select count(*) from public.duels d where d.winner = b.id) * 30 as points
    from base b
  ),
  ranked as (
    select s.*,
      row_number() over (order by s.points desc, s.name, s.id) as pos,
      count(*) over () as total
    from scored s
  )
  select id, name, avatar, department, level, points::bigint, pos, total
  from ranked
  where pos <= least(greatest(p_limit, 1), 200) or id = auth.uid()
  order by pos;
$$;

revoke all on function public.ranking(text, text, integer) from public, anon;
grant execute on function public.ranking(text, text, integer) to authenticated;
