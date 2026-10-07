-- Analytics basique : rétention, matière la plus jouée, points de décrochage.
-- `events` capture des instants du parcours (pour l'instant : début de quiz) ;
-- comparé à `results` (quiz terminés), ça donne le taux d'abandon.
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('quiz_start')),
  subject_id text,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

drop policy if exists events_insert_own on public.events;
create policy events_insert_own on public.events
  for insert to authenticated with check (user_id = auth.uid());
-- Pas de policy select : seul admin_analytics() (security definer) lit cette table.

create index if not exists events_kind_created_idx on public.events (kind, created_at desc);

create or replace function public.admin_analytics()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_retention numeric;
  v_subjects json;
  v_starts bigint;
  v_finishes bigint;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;

  -- Rétention : parmi les comptes créés il y a plus de 7 jours, quelle part a
  -- joué (results) au cours des 7 derniers jours.
  select case when count(*) = 0 then null else
    round(100.0 * count(*) filter (
      where exists (select 1 from results r where r.user_id = p.id and r.created_at > now() - interval '7 days')
    ) / count(*), 1)
  end
  into v_retention
  from profiles p
  join auth.users u on u.id = p.id
  where u.created_at < now() - interval '7 days';

  -- Matière la plus jouée sur 30 jours.
  select coalesce(json_agg(row_to_json(t)), '[]'::json) into v_subjects
  from (
    select subject_id, subject_name, count(*) as n
    from results
    where created_at > now() - interval '30 days'
    group by subject_id, subject_name
    order by n desc
    limit 5
  ) t;

  -- Décrochage : quiz commencés (events) vs terminés (results), sur 30 jours.
  -- N'inclut que les modes qui passent par pick_questions (quiz rapide) ou le
  -- chargement direct des questions, pas les fiches (flash), sans fin à atteindre.
  select count(*) into v_starts from events where kind = 'quiz_start' and created_at > now() - interval '30 days';
  select count(*) into v_finishes from results
    where mode <> 'flash' and created_at > now() - interval '30 days';

  return json_build_object(
    'retention_7d', v_retention,
    'top_subjects', v_subjects,
    'quiz_starts_30d', v_starts,
    'quiz_finishes_30d', v_finishes,
    'dropout_pct_30d', case when v_starts = 0 then null
      else round(100.0 * greatest(v_starts - v_finishes, 0) / v_starts, 1) end
  );
end;
$$;

revoke all on function public.admin_analytics() from public, anon;
grant execute on function public.admin_analytics() to authenticated;
