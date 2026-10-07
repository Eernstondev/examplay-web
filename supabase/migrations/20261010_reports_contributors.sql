-- Signalement des questions par les élèves + espace contributeurs (enseignants, experts)
-- avec validation par un admin avant publication.

-- L'admin peut lire tous les profils (noms des auteurs de signalements et de propositions).
create policy profiles_admin_select on public.profiles
  for select to authenticated using ((select public.is_admin()));

-- ── Signalements ──────────────────────────────────────────────────────────
create table if not exists public.question_reports (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  reason text not null check (
    reason in ('wrong_answer', 'statement_error', 'unclear', 'technical', 'inappropriate')
  ),
  comment text check (char_length(comment) <= 500),
  status text not null default 'open' check (status in ('open', 'resolved', 'rejected')),
  created_at timestamptz not null default now(),
  -- Un élève ne signale qu'une fois la même question.
  unique (user_id, question_id)
);

alter table public.question_reports enable row level security;

create policy reports_insert_own on public.question_reports
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'open');
create policy reports_select_own on public.question_reports
  for select to authenticated using (user_id = auth.uid());
create policy reports_admin_select on public.question_reports
  for select to authenticated using ((select public.is_admin()));
create policy reports_admin_update on public.question_reports
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ── Contributeurs ─────────────────────────────────────────────────────────
create table if not exists public.contributors (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Aucune policy : gérée uniquement par les fonctions admin ci-dessous.
alter table public.contributors enable row level security;

create or replace function public.is_contributor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.contributors where user_id = auth.uid());
$$;

revoke all on function public.is_contributor() from public, anon;
grant execute on function public.is_contributor() to authenticated;

-- Ajoute un contributeur à partir de l'e-mail de son compte. Renvoie false si le compte n'existe pas.
create or replace function public.admin_add_contributor(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select p.id into v_id
  from profiles p join auth.users u on u.id = p.id
  where lower(u.email) = lower(trim(p_email));
  if v_id is null then return false; end if;
  insert into contributors (user_id) values (v_id) on conflict do nothing;
  return true;
end;
$$;

create or replace function public.admin_remove_contributor(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  delete from contributors where user_id = p_user;
end;
$$;

create or replace function public.admin_list_contributors()
returns table (id uuid, name text, email text, created_at timestamptz, pending bigint, approved bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return query
    select p.id, p.name, u.email::text, c.created_at,
           (select count(*) from submissions s where s.author = p.id and s.status = 'pending'),
           (select count(*) from submissions s where s.author = p.id and s.status = 'approved')
    from contributors c
    join profiles p on p.id = c.user_id
    join auth.users u on u.id = p.id
    order by c.created_at desc;
end;
$$;

-- ── Propositions (questions, corrections, cours) ──────────────────────────
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  author uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('question', 'correction', 'course')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  subject_id text not null,
  question_id uuid references public.questions (id) on delete cascade,
  payload jsonb not null,
  note text check (char_length(note) <= 1000),
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  check (kind <> 'correction' or question_id is not null)
);

alter table public.submissions enable row level security;

-- Un contributeur propose ; il ne peut ni valider ni modifier le statut.
create policy submissions_insert_contributor on public.submissions
  for insert to authenticated
  with check (
    (select public.is_contributor())
    and author = auth.uid()
    and status = 'pending' and admin_note is null and reviewed_at is null
  );
create policy submissions_select_own on public.submissions
  for select to authenticated using (author = auth.uid());
create policy submissions_delete_own_pending on public.submissions
  for delete to authenticated using (author = auth.uid() and status = 'pending');
create policy submissions_admin_select on public.submissions
  for select to authenticated using ((select public.is_admin()));

-- Validation par un admin : la publication se fait ici, en une seule opération.
create or replace function public.admin_review_submission(p_id uuid, p_approve boolean, p_note text default null)
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
  p := s.payload;

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
  -- Les cours approuvés sont conservés ; leur affichage aux élèves viendra plus tard.

  update submissions
  set status = case when p_approve then 'approved' else 'rejected' end,
      admin_note = nullif(trim(coalesce(p_note, '')), ''),
      reviewed_at = now()
  where id = p_id;
end;
$$;

revoke all on function public.admin_add_contributor(text) from public, anon;
revoke all on function public.admin_remove_contributor(uuid) from public, anon;
revoke all on function public.admin_list_contributors() from public, anon;
revoke all on function public.admin_review_submission(uuid, boolean, text) from public, anon;
grant execute on function public.admin_add_contributor(text) to authenticated;
grant execute on function public.admin_remove_contributor(uuid) to authenticated;
grant execute on function public.admin_list_contributors() to authenticated;
grant execute on function public.admin_review_submission(uuid, boolean, text) to authenticated;
