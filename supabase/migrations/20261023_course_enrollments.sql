-- Inscriptions payantes aux cours : l'admin fixe un prix par matière, l'élève
-- s'inscrit et envoie sa référence de paiement (MonCash / NatCash), l'admin
-- confirme ou refuse, et l'élève est prévenu par notification.
-- Une matière sans prix reste gratuite : rien ne change tant que l'admin n'a pas fixé de prix.

-- ── Prix par matière ───────────────────────────────────────────────────────
create table if not exists public.course_prices (
  subject_id text primary key,
  price_htg integer not null check (price_htg > 0 and price_htg <= 1000000),
  updated_at timestamptz not null default now()
);

alter table public.course_prices enable row level security;

drop policy if exists course_prices_select on public.course_prices;
create policy course_prices_select on public.course_prices
  for select to authenticated using (true);

drop policy if exists course_prices_admin on public.course_prices;
create policy course_prices_admin on public.course_prices
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ── Réglages (consignes de paiement affichées dans le formulaire) ─────────
create table if not exists public.site_settings (
  key text primary key,
  value text not null default '' check (char_length(value) <= 600)
);

alter table public.site_settings enable row level security;

drop policy if exists site_settings_select on public.site_settings;
create policy site_settings_select on public.site_settings
  for select to authenticated using (true);

drop policy if exists site_settings_admin on public.site_settings;
create policy site_settings_admin on public.site_settings
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ── Demandes d'inscription ─────────────────────────────────────────────────
create table if not exists public.course_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id text not null,
  full_name text not null check (char_length(full_name) between 3 and 100),
  email text,
  phone text not null check (phone ~ '^\+?[0-9]{8,15}$'),
  price_htg integer not null check (price_htg > 0),
  payment_ref text not null check (char_length(payment_ref) between 4 and 40),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- Une seule demande active (en attente ou confirmée) par élève et par matière.
create unique index if not exists course_enrollments_active_idx
  on public.course_enrollments (user_id, subject_id)
  where status in ('pending', 'confirmed');
create index if not exists course_enrollments_status_idx on public.course_enrollments (status, created_at desc);

alter table public.course_enrollments enable row level security;

-- Lecture seule côté client : toute écriture passe par les fonctions ci-dessous
-- (sinon un élève pourrait se confirmer lui-même ou choisir son prix).
drop policy if exists course_enrollments_select on public.course_enrollments;
create policy course_enrollments_select on public.course_enrollments
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- ── Notifications : trois nouveaux types ──────────────────────────────────
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
    'enrollment_pending', 'enrollment_confirmed', 'enrollment_rejected'
  ));

-- ── L'élève demande son inscription ───────────────────────────────────────
-- Le prix vient de la base, jamais du client. Erreurs lisibles par le site :
-- not_for_sale, invalid_name, invalid_phone, invalid_ref, already_enrolled.
create or replace function public.request_course_enrollment(
  p_subject text,
  p_name text,
  p_phone text,
  p_ref text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_price integer;
  v_mail text;
  v_name text := trim(coalesce(p_name, ''));
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[\s().-]', '', 'g');
  v_ref text := trim(coalesce(p_ref, ''));
  v_id uuid;
begin
  if uid is null then raise exception 'unauthenticated'; end if;

  select price_htg into v_price from course_prices where subject_id = p_subject;
  if v_price is null then raise exception 'not_for_sale'; end if;

  if char_length(v_name) not between 3 and 100 then raise exception 'invalid_name'; end if;
  if v_phone !~ '^\+?[0-9]{8,15}$' then raise exception 'invalid_phone'; end if;
  if char_length(v_ref) not between 4 and 40 then raise exception 'invalid_ref'; end if;

  if exists (
    select 1 from course_enrollments
    where user_id = uid and subject_id = p_subject and status in ('pending', 'confirmed')
  ) then
    raise exception 'already_enrolled';
  end if;

  select email into v_mail from auth.users where id = uid;

  insert into course_enrollments (user_id, subject_id, full_name, email, phone, price_htg, payment_ref)
  values (uid, p_subject, v_name, v_mail, v_phone, v_price, v_ref)
  returning id into v_id;

  insert into notifications (user_id, kind, data)
  values (uid, 'enrollment_pending', jsonb_build_object('enrollment_id', v_id, 'subject_id', p_subject));

  return v_id;
exception
  when unique_violation then raise exception 'already_enrolled';
end;
$$;

-- ── L'admin confirme ou refuse ────────────────────────────────────────────
create or replace function public.admin_review_enrollment(
  p_id uuid,
  p_approve boolean,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  e public.course_enrollments;
  v_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select * into e from course_enrollments where id = p_id and status = 'pending' for update;
  if e.id is null then raise exception 'not pending'; end if;

  update course_enrollments
  set status = case when p_approve then 'confirmed' else 'rejected' end,
      admin_note = v_note,
      reviewed_at = now()
  where id = p_id;

  insert into notifications (user_id, kind, data)
  values (
    e.user_id,
    case when p_approve then 'enrollment_confirmed' else 'enrollment_rejected' end,
    jsonb_build_object('enrollment_id', e.id, 'subject_id', e.subject_id, 'note', v_note)
  );
end;
$$;

-- ── Accès aux cours payants ───────────────────────────────────────────────
-- Un cours est lisible si : la matière est gratuite (pas de prix), ou l'élève y est
-- inscrit (confirmé), ou c'est l'admin, ou c'est son auteur.
create or replace function public.can_read_course(p_subject text, p_author uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(p_author = auth.uid(), false)
    or public.is_admin()
    or not exists (select 1 from course_prices cp where cp.subject_id = p_subject)
    or exists (
      select 1 from course_enrollments e
      where e.user_id = auth.uid() and e.subject_id = p_subject and e.status = 'confirmed'
    );
$$;

drop policy if exists courses_select on public.courses;
create policy courses_select on public.courses
  for select to authenticated
  using ((select public.can_read_course(subject_id, author)));

-- Nombre de cours par matière, y compris pour les matières verrouillées.
create or replace function public.course_counts()
returns table (subject_id text, total integer)
language sql
stable
security definer
set search_path = public
as $$
  select c.subject_id, count(*)::integer from courses c group by c.subject_id;
$$;

-- ── Compteur « à traiter » de l'admin : on ajoute les inscriptions ────────
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
    'contacts_7d', (select count(*) from contact_requests where created_at > now() - interval '7 days'),
    'enrollments', (select count(*) from course_enrollments where status = 'pending')
  );
end;
$$;

revoke all on function public.request_course_enrollment(text, text, text, text) from public, anon;
revoke all on function public.admin_review_enrollment(uuid, boolean, text) from public, anon;
revoke all on function public.can_read_course(text, uuid) from public, anon;
revoke all on function public.course_counts() from public, anon;
revoke all on function public.admin_pending() from public, anon;
grant execute on function public.request_course_enrollment(text, text, text, text) to authenticated;
grant execute on function public.admin_review_enrollment(uuid, boolean, text) to authenticated;
grant execute on function public.can_read_course(text, uuid) to authenticated;
grant execute on function public.course_counts() to authenticated;
grant execute on function public.admin_pending() to authenticated;
