-- Défi de la semaine : classement des points gagnés du lundi 00:00 au dimanche 23:59 (heure d'Haïti),
-- filtrable par département et niveau comme `ranking`. p_week_offset = 0 : semaine en cours,
-- 1 : semaine dernière (podium). Même barème : 10 points par bonne réponse, 30 par duel gagné.
-- Seuls les élèves qui ont gagné des points dans la semaine apparaissent ; la ligne de l'élève
-- connecté est toujours renvoyée (avec 0 point s'il n'a pas encore joué).

create or replace function public.weekly_ranking(
  p_department text default null,
  p_level text default null,
  p_limit integer default 100,
  p_week_offset integer default 0
)
returns table (
  user_id uuid, name text, avatar text, department text, level text,
  points bigint, pos bigint, total bigint, week_start date
)
language sql
stable
security definer
set search_path = public
as $$
  with bounds as (
    select (date_trunc('week', now() at time zone 'America/Port-au-Prince')
             - make_interval(weeks => greatest(least(p_week_offset, 52), 0))) as ws
  ),
  win as (
    select (b.ws at time zone 'America/Port-au-Prince') as t0,
           ((b.ws + interval '7 days') at time zone 'America/Port-au-Prince') as t1,
           b.ws::date as ws
    from bounds b
  ),
  base as (
    select p.id, p.name, p.avatar, p.department, p.level
    from public.profiles p
    where auth.uid() is not null
      and (p_department is null or p.department = p_department)
      and (p_level is null or (p_level = 'ns4' and p.level <> '9e') or p.level = p_level)
  ),
  scored as (
    select b.*,
      coalesce((select sum(r.correct) from public.results r, win
                 where r.user_id = b.id and r.created_at >= win.t0 and r.created_at < win.t1), 0) * 10
      + (select count(*) from public.duels d, win
          where d.winner = b.id and d.status = 'finished'
            and d.updated_at >= win.t0 and d.updated_at < win.t1) * 30 as points
    from base b
  ),
  active as (
    select * from scored where points > 0 or id = auth.uid()
  ),
  ranked as (
    select a.*,
      row_number() over (order by a.points desc, a.name, a.id) as pos,
      count(*) filter (where a.points > 0) over () as total
    from active a
  )
  select r.id, r.name, r.avatar, r.department, r.level, r.points::bigint, r.pos, r.total, (select ws from win)
  from ranked r
  where r.pos <= least(greatest(p_limit, 1), 200) or r.id = auth.uid()
  order by r.pos;
$$;

revoke all on function public.weekly_ranking(text, text, integer, integer) from public, anon;
grant execute on function public.weekly_ranking(text, text, integer, integer) to authenticated;
