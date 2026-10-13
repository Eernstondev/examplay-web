-- Classements : 1) répare l'erreur « Impossible de charger » (anciennes versions de `ranking`
-- encore présentes dans la base) ; 2) cloisonne 9e et NS4 : un élève de 9e ne voit que des élèves
-- de 9e, un élève de NS4 (toutes séries) que des élèves de NS4. Appliqué côté serveur, quel que
-- soit le filtre envoyé par l'app ou le site.

-- Groupe d'examen : '9e' ou 'ns4' (toutes les séries du Nouveau Secondaire 4).
create or replace function public.level_group(p_level text)
returns text
language sql
immutable
as $$ select case when p_level = '9e' then '9e' else 'ns4' end $$;

-- Supprime toutes les versions existantes (signatures ou types de retour différents).
do $$
declare f regprocedure;
begin
  for f in
    select p.oid::regprocedure
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('ranking', 'weekly_ranking')
  loop
    execute 'drop function ' || f;
  end loop;
end $$;

-- Classement général. p_department : null = tout Haïti. p_level : null = tout le groupe de l'élève,
-- 'ns4' = toutes les séries, ou l'identifiant d'une série.
create function public.ranking(
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
  with viewer as (
    select public.level_group(level) as grp from public.profiles where id = auth.uid()
  ),
  base as (
    select p.id, p.name, p.avatar, p.department, p.level
    from public.profiles p, viewer v
    where public.level_group(p.level) = v.grp
      and (p_department is null or p.department = p_department)
      and (p_level is null or (p_level = 'ns4' and p.level <> '9e') or p.level = p_level)
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

-- Défi de la semaine (lundi 00:00 - dimanche 23:59, heure d'Haïti). p_week_offset 1 = semaine dernière.
create function public.weekly_ranking(
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
  with viewer as (
    select public.level_group(level) as grp from public.profiles where id = auth.uid()
  ),
  bounds as (
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
    from public.profiles p, viewer v
    where public.level_group(p.level) = v.grp
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

revoke all on function public.ranking(text, text, integer) from public, anon;
grant execute on function public.ranking(text, text, integer) to authenticated;
revoke all on function public.weekly_ranking(text, text, integer, integer) from public, anon;
grant execute on function public.weekly_ranking(text, text, integer, integer) to authenticated;
