-- EXAMPLAY : 4 nouvelles migrations (formats de pub, page de cours, notifications,
-- analytics). Nouvelles, jamais appliquées : à coller une seule fois dans
-- Supabase > SQL Editor, ou via ./install.sh.

-- ═══ 20261017_ads_display_mode.sql ═══
alter table public.ads
  add column if not exists display_mode text not null default 'banner'
  check (display_mode in ('banner', 'fullscreen', 'carre'));

-- ═══ 20261018_courses.sql ═══
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

-- ═══ 20261019_notifications.sql ═══
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('duel_challenge', 'duel_finished', 'report_resolved')),
  data jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated using (user_id = auth.uid());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
    ) then
      alter publication supabase_realtime add table public.notifications;
    end if;
  end if;
end $$;

create or replace function public.notify_duel_challenge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into notifications (user_id, kind, data)
  values (
    new.opponent, 'duel_challenge',
    jsonb_build_object(
      'duel_id', new.id, 'subject_id', new.subject_id,
      'from_id', new.challenger,
      'from_name', (select name from profiles where id = new.challenger)
    )
  );
  return new;
end;
$$;

drop trigger if exists duels_notify_challenge on public.duels;
create trigger duels_notify_challenge
  after insert on public.duels
  for each row execute function public.notify_duel_challenge();

create or replace function public.notify_duel_finished()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'finished' and old.status is distinct from 'finished' then
    insert into notifications (user_id, kind, data)
    values
      (new.challenger, 'duel_finished', jsonb_build_object(
        'duel_id', new.id, 'subject_id', new.subject_id,
        'won', new.winner = new.challenger
      )),
      (new.opponent, 'duel_finished', jsonb_build_object(
        'duel_id', new.id, 'subject_id', new.subject_id,
        'won', new.winner = new.opponent
      ));
  end if;
  return new;
end;
$$;

drop trigger if exists duels_notify_finished on public.duels;
create trigger duels_notify_finished
  after update on public.duels
  for each row execute function public.notify_duel_finished();

create or replace function public.notify_report_resolved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('resolved', 'rejected') and old.status = 'open' then
    insert into notifications (user_id, kind, data)
    values (new.user_id, 'report_resolved', jsonb_build_object(
      'report_id', new.id, 'question_id', new.question_id, 'status', new.status
    ));
  end if;
  return new;
end;
$$;

drop trigger if exists reports_notify_resolved on public.question_reports;
create trigger reports_notify_resolved
  after update on public.question_reports
  for each row execute function public.notify_report_resolved();

-- ═══ 20261020_analytics.sql ═══
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

  select case when count(*) = 0 then null else
    round(100.0 * count(*) filter (
      where exists (select 1 from results r where r.user_id = p.id and r.created_at > now() - interval '7 days')
    ) / count(*), 1)
  end
  into v_retention
  from profiles p
  join auth.users u on u.id = p.id
  where u.created_at < now() - interval '7 days';

  select coalesce(json_agg(row_to_json(t)), '[]'::json) into v_subjects
  from (
    select subject_id, subject_name, count(*) as n
    from results
    where created_at > now() - interval '30 days'
    group by subject_id, subject_name
    order by n desc
    limit 5
  ) t;

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
