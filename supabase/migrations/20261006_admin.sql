-- Zone admin : qui est admin, ce qu'un admin peut lire et modifier.
-- Aucune clé service_role n'est utilisée par le site : tout passe par ces règles.

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Aucune policy : la table n'est lisible et modifiable que depuis le SQL Editor.
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Questions : un admin voit aussi les questions désactivées, peut en ajouter et en modifier.
-- (select is_admin()) est évalué une fois par requête, pas une fois par ligne.
create policy questions_admin_select on public.questions
  for select to authenticated using ((select public.is_admin()));
create policy questions_admin_insert on public.questions
  for insert to authenticated with check ((select public.is_admin()));
create policy questions_admin_update on public.questions
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Table du formulaire Investisseurs (créée ici si la migration précédente n'a pas été exécutée).
create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) between 5 and 254),
  subject text not null check (
    subject in ('investissement', 'partenariat', 'sponsoring', 'autre')
  ),
  message text not null check (char_length(message) between 10 and 4000),
  created_at timestamptz not null default now()
);
alter table public.contact_requests enable row level security;
drop policy if exists contact_requests_public_insert on public.contact_requests;
create policy contact_requests_public_insert on public.contact_requests
  for insert to anon, authenticated with check (true);

-- Messages du site : lecture réservée aux admins.
create policy contact_requests_admin_select on public.contact_requests
  for select to authenticated using ((select public.is_admin()));
create policy waitlist_admin_select on public.waitlist
  for select to authenticated using ((select public.is_admin()));

-- Chiffres de la vue d'ensemble.
create or replace function public.admin_stats()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return json_build_object(
    'users', (select count(*) from profiles),
    'users_7d', (select count(*) from profiles where created_at > now() - interval '7 days'),
    'by_level', (select coalesce(json_object_agg(level, n), '{}'::json)
                 from (select level, count(*) as n from profiles group by level) t),
    'by_department', (select coalesce(json_object_agg(department, n), '{}'::json)
                      from (select department, count(*) as n from profiles group by department) t),
    'questions', (select count(*) from questions where active),
    'questions_inactive', (select count(*) from questions where not active),
    'results', (select count(*) from results),
    'results_7d', (select count(*) from results where created_at > now() - interval '7 days'),
    'duels', (select count(*) from duels where status = 'finished'),
    'waitlist', (select count(*) from waitlist),
    'contacts', (select count(*) from contact_requests)
  );
end;
$$;

revoke all on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;

-- Liste des élèves avec leur e-mail (auth.users n'est pas lisible autrement).
create or replace function public.admin_list_users(
  p_search text default '',
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid, name text, email text, level text, department text,
  created_at timestamptz, quizzes bigint, total bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return query
    select p.id, p.name, u.email::text, p.level, p.department, p.created_at,
           (select count(*) from results r where r.user_id = p.id) as quizzes,
           count(*) over () as total
    from profiles p
    join auth.users u on u.id = p.id
    where p_search = ''
       or p.name ilike '%' || p_search || '%'
       or u.email ilike '%' || p_search || '%'
    order by p.created_at desc
    limit least(greatest(p_limit, 1), 200)
    offset greatest(p_offset, 0);
end;
$$;

revoke all on function public.admin_list_users(text, integer, integer) from public, anon;
grant execute on function public.admin_list_users(text, integer, integer) to authenticated;

-- À exécuter une fois, avec TON adresse e-mail de connexion, pour te nommer admin :
-- insert into public.admins (user_id)
-- select id from auth.users where email = 'ton-email@exemple.com';
