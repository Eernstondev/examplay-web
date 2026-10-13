-- Rappels de révision envoyés par le serveur (push téléphone + navigateur).
-- Chaque heure, pg_cron crée une notification pour les élèves dont c'est l'heure de rappel
-- (heure d'Haïti) et qui n'ont pas encore joué aujourd'hui. Le webhook existant sur
-- `notifications` fait ensuite partir le push (route /api/push/send).
--  - a joué hier            -> « streak_danger » (sa série va se casser)
--  - a joué dans les 7 jours -> « study_reminder »
--  - inactif depuis plus de 7 jours ou jamais joué -> rien (pas de harcèlement)
-- Au plus un rappel par élève et par jour.

-- 1. Préférences de l'élève (modifiables depuis l'app : Réglages > Notifications).
alter table public.profiles
  add column if not exists reminder_enabled boolean not null default true,
  add column if not exists reminder_hour smallint not null default 19;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_reminder_hour_check') then
    alter table public.profiles
      add constraint profiles_reminder_hour_check check (reminder_hour between 0 and 23);
  end if;
end $$;

-- 2. Nouveaux types de notification.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.notifications'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%kind%'
  loop
    execute format('alter table public.notifications drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.notifications
  add constraint notifications_kind_check
  check (kind in (
    'duel_challenge', 'duel_finished', 'report_resolved',
    'friend_request', 'friend_accepted',
    'study_reminder', 'streak_danger'
  ));

-- 3. Série en cours (jours consécutifs avec au moins un quiz) qui se termine hier.
create or replace function public.streak_until(p_user uuid, p_day date)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  with days as (
    select distinct (created_at at time zone 'America/Port-au-Prince')::date as d
    from public.results
    where user_id = p_user and created_at > now() - interval '400 days'
  ),
  gap as (
    select coalesce(max(g::date), p_day - 401) as last_gap
    from generate_series(p_day - 400, p_day - 1, interval '1 day') g
    where g::date not in (select d from days)
  )
  select count(*)::int from days, gap where d > gap.last_gap and d < p_day;
$$;

revoke all on function public.streak_until(uuid, date) from public, anon, authenticated;

-- 4. Création des rappels de l'heure en cours.
create or replace function public.send_study_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamp := now() at time zone 'America/Port-au-Prince';
  v_today date := v_now::date;
  v_hour int := extract(hour from v_now)::int;
  v_day_start timestamptz := v_today::timestamp at time zone 'America/Port-au-Prince';
  v_count int;
begin
  with targets as (
    select p.id,
      (select max((r.created_at at time zone 'America/Port-au-Prince')::date)
         from public.results r where r.user_id = p.id) as last_day
    from public.profiles p
    where p.reminder_enabled
      and p.reminder_hour = v_hour
      and (exists (select 1 from public.push_tokens t where t.user_id = p.id)
           or exists (select 1 from public.push_subscriptions s where s.user_id = p.id))
  ),
  todo as (
    select t.id, t.last_day
    from targets t
    where t.last_day is not null
      and t.last_day < v_today
      and t.last_day >= v_today - 7
      and not exists (
        select 1 from public.notifications n
        where n.user_id = t.id
          and n.kind in ('study_reminder', 'streak_danger')
          and n.created_at >= v_day_start
      )
  )
  insert into public.notifications (user_id, kind, data)
  select id,
         case when last_day = v_today - 1 then 'streak_danger' else 'study_reminder' end,
         case when last_day = v_today - 1
              then jsonb_build_object('streak', public.streak_until(id, v_today))
              else jsonb_build_object('days', v_today - last_day) end
  from todo;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.send_study_reminders() from public, anon, authenticated;

-- 5. Exécution automatique, chaque heure à HH:02.
create extension if not exists pg_cron;

do $$ begin
  if exists (select 1 from cron.job where jobname = 'examplay-study-reminders') then
    perform cron.unschedule('examplay-study-reminders');
  end if;
end $$;

select cron.schedule('examplay-study-reminders', '2 * * * *', $$select public.send_study_reminders()$$);
