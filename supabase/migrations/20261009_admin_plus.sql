-- Chapitres gérés par l'admin, suspension d'un élève, affichages des publicités.
-- À exécuter après les migrations admin et publicités.

-- ── Chapitres : écriture réservée aux admins ──────────────────────────────
create policy chapters_admin_insert on public.chapters
  for insert to authenticated with check ((select public.is_admin()));
create policy chapters_admin_update on public.chapters
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy chapters_admin_delete on public.chapters
  for delete to authenticated using ((select public.is_admin()));

-- ── Suspension : blocage de la connexion (site et app mobile) ─────────────
-- Un compte suspendu ne peut plus se connecter ni renouveler sa session ;
-- une session déjà ouverte s'arrête au plus tard à l'expiration du jeton (1 h par défaut).
create or replace function public.admin_set_suspended(p_user uuid, p_suspended boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if exists (select 1 from public.admins where user_id = p_user) then
    raise exception 'cannot suspend an admin';
  end if;
  update auth.users
  set banned_until = case when p_suspended then 'infinity'::timestamptz else null end
  where id = p_user;
end;
$$;

revoke all on function public.admin_set_suspended(uuid, boolean) from public, anon;
grant execute on function public.admin_set_suspended(uuid, boolean) to authenticated;

-- La liste des élèves indique maintenant si le compte est suspendu.
drop function if exists public.admin_list_users(text, integer, integer);
create function public.admin_list_users(
  p_search text default '',
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid, name text, email text, level text, department text,
  created_at timestamptz, quizzes bigint, suspended boolean, total bigint
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
           coalesce(u.banned_until > now(), false) as suspended,
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

-- ── Publicités : nombre d'affichages ──────────────────────────────────────
alter table public.ads add column if not exists impressions integer not null default 0;

create or replace function public.ad_view(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.ads set impressions = impressions + 1 where id = p_id and active;
$$;

revoke all on function public.ad_view(uuid) from public;
grant execute on function public.ad_view(uuid) to anon, authenticated;
