-- Notifications in-app : un élève qui reçoit un duel ou une réponse à son
-- signalement ne le savait qu'en revenant sur le site. On les prévient via
-- une table dédiée, remplie par des triggers (donc valable que l'écriture
-- vienne du site, de l'app mobile, ou d'une fonction existante comme
-- create_duel, que cette session n'a pas dans ses migrations).
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

-- Un élève ne peut que marquer SES notifications comme lues (rien d'autre n'est modifiable
-- côté client : la policy ne contrôle pas quelles colonnes changent, mais user_id est
-- immuable en pratique puisque with check l'exige identique).
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);

-- Le site écoute les nouvelles notifications en direct (postgres_changes), comme pour les duels.
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

-- ── Défi de duel reçu ──────────────────────────────────────────────────────
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

-- ── Duel terminé : les deux joueurs sont prévenus ─────────────────────────
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

-- ── Réponse à un signalement de question ──────────────────────────────────
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
