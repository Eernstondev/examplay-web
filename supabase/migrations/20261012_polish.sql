-- Quiz légers, compteurs admin, demandes d'accès contributeur, admin hors classement.

-- ── Tirage des questions côté serveur : seules les questions jouées sont envoyées ──
-- Fonction « invoker » : les règles RLS de `questions` s'appliquent normalement.
create or replace function public.pick_questions(
  p_subject text,
  p_type text default null,
  p_chapter text default null,
  p_limit integer default 5
)
returns table (
  id uuid, type text, question text, choices jsonb, answer integer,
  answer_text text, explain text, chapter_title text
)
language sql
set search_path = public
as $$
  select q.id, q.type, q.question, q.choices, q.answer, q.answer_text, q.explain, c.title
  from questions q
  left join chapters c on c.id = q.chapter_id
  where q.subject_id = p_subject
    and q.active
    and (p_type is null or q.type = p_type)
    and (p_chapter is null or coalesce(c.title, 'Général') = p_chapter)
  order by random()
  limit least(greatest(p_limit, 1), 50);
$$;

revoke all on function public.pick_questions(text, text, text, integer) from public, anon;
grant execute on function public.pick_questions(text, text, text, integer) to authenticated;

-- ── Demandes d'accès contributeur ─────────────────────────────────────────
create table if not exists public.contributor_applications (
  user_id uuid primary key default auth.uid() references public.profiles (id) on delete cascade,
  subjects text not null check (char_length(subjects) between 2 and 200),
  school text not null check (char_length(school) between 2 and 200),
  message text check (char_length(message) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.contributor_applications enable row level security;

create policy applications_insert_own on public.contributor_applications
  for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy applications_select_own on public.contributor_applications
  for select to authenticated using (user_id = auth.uid());

create or replace function public.admin_list_applications()
returns table (user_id uuid, name text, email text, subjects text, school text, message text, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return query
    select a.user_id, p.name, u.email::text, a.subjects, a.school, a.message, a.created_at
    from contributor_applications a
    join profiles p on p.id = a.user_id
    join auth.users u on u.id = a.user_id
    where a.status = 'pending'
    order by a.created_at;
end;
$$;

create or replace function public.admin_review_application(p_user uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  update contributor_applications
  set status = case when p_approve then 'approved' else 'rejected' end
  where user_id = p_user and status = 'pending';
  if found and p_approve then
    insert into contributors (user_id) values (p_user) on conflict do nothing;
  end if;
end;
$$;

-- ── Compteurs « à traiter » de l'admin ────────────────────────────────────
create or replace function public.admin_pending()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return json_build_object(
    'reports', (select count(*) from question_reports where status = 'open'),
    'submissions', (select count(*) from submissions where status = 'pending'),
    'applications', (select count(*) from contributor_applications where status = 'pending'),
    'contacts_7d', (select count(*) from contact_requests where created_at > now() - interval '7 days')
  );
end;
$$;

revoke all on function public.admin_list_applications() from public, anon;
revoke all on function public.admin_review_application(uuid, boolean) from public, anon;
revoke all on function public.admin_pending() from public, anon;
grant execute on function public.admin_list_applications() to authenticated;
grant execute on function public.admin_review_application(uuid, boolean) to authenticated;
grant execute on function public.admin_pending() to authenticated;

-- ── Le compte admin sort des classements ──────────────────────────────────
-- On supprime son profil élève : il disparaît des classements (département, national, amis),
-- de la recherche et des duels, sur le site comme dans l'app. Le compte de connexion reste intact.
-- Conséquence : ce compte ne peut plus servir de compte élève.
delete from public.profiles where id in (select user_id from public.admins);
