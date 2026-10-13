-- Suite de 20261031 : 9e et NS4 séparés aussi pour la recherche, les profils publics, les amis
-- et les demandes d'amis. Le reste du comportement de chaque fonction est inchangé.

create or replace function public.level_group(p_level text)
returns text
language sql
immutable
as $$ select case when p_level = '9e' then '9e' else 'ns4' end $$;

-- Groupe (9e / ns4) de l'élève connecté.
create or replace function public.my_level_group()
returns text
language sql
stable
security definer
set search_path = public
as $$ select public.level_group(level) from public.profiles where id = auth.uid() $$;

-- Recherche par nom : uniquement dans le groupe de l'élève.
create or replace function public.search_players(p_query text)
returns table(id uuid, name text, avatar text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name, p.avatar
  from public.profiles p
  where auth.uid() is not null
    and p.id <> auth.uid()
    and public.level_group(p.level) = public.my_level_group()
    and length(trim(p_query)) >= 2
    -- on échappe % _ \ pour que la saisie soit prise littéralement
    and p.name ilike '%' || replace(replace(replace(trim(p_query), '\', '\\'), '%', '\%'), '_', '\_') || '%'
  order by p.name
  limit 20;
$$;

-- Profil public : visible seulement par soi-même ou un élève du même groupe.
create or replace function public.player_public_profile(p_id uuid)
returns table(name text, avatar text, department text, level text, points bigint, quizzes bigint,
              perfect bigint, active_days bigint, subjects_done bigint, duel_wins bigint)
language sql
stable
security definer
set search_path = public
as $$
  with t as (
    select p.* from public.profiles p
    where p.id = p_id and auth.uid() is not null
      and (p.id = auth.uid() or public.level_group(p.level) = public.my_level_group())
  ),
  r as (select * from public.results where user_id = p_id and exists (select 1 from t)),
  w as (select count(*) as c from public.duels where winner = p_id and exists (select 1 from t))
  select t.name, t.avatar, t.department, t.level,
    coalesce((select sum(correct) from r),0)*10 + (select c from w)*30,
    (select count(*) from r), (select count(*) from r where correct = total),
    (select count(distinct date_trunc('day', created_at)) from r),
    (select count(distinct subject_id) from r), (select c from w)
  from t;
$$;

-- Demande d'ami : impossible entre 9e et NS4.
create or replace function public.send_friend_request(p_addressee uuid)
returns friendships
language plpgsql
security definer
set search_path = public
as $$
declare v public.friendships;
begin
  if p_addressee = auth.uid() then raise exception 'cannot friend yourself'; end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = p_addressee and public.level_group(p.level) = public.my_level_group()
  ) then
    raise exception 'not eligible';
  end if;
  select * into v from public.friendships where (requester=auth.uid() and addressee=p_addressee) or (requester=p_addressee and addressee=auth.uid());
  if v.id is not null then
    if v.status = 'declined' and v.requester = auth.uid() then
      update public.friendships set status='pending', created_at=now() where id=v.id returning * into v;
    end if;
    return v;
  end if;
  insert into public.friendships(requester, addressee) values (auth.uid(), p_addressee) returning * into v;
  return v;
end $$;

-- Listes d'amis et de demandes : les anciennes relations 9e <-> NS4 ne sont plus affichées.
create or replace function public.list_friends()
returns table(id uuid, name text, avatar text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name, p.avatar from public.profiles p
  join public.friendships f on (f.requester = p.id or f.addressee = p.id)
  where f.status = 'accepted' and auth.uid() in (f.requester, f.addressee) and p.id <> auth.uid()
    and public.level_group(p.level) = public.my_level_group();
$$;

create or replace function public.list_friend_requests()
returns table(id uuid, from_id uuid, name text, avatar text)
language sql
stable
security definer
set search_path = public
as $$
  select f.id, f.requester, p.name, p.avatar from public.friendships f
  join public.profiles p on p.id = f.requester
  where f.addressee = auth.uid() and f.status = 'pending'
    and public.level_group(p.level) = public.my_level_group();
$$;

-- Classement entre amis : tout le groupe (toutes les séries du NS4), plus seulement la même série.
create or replace function public.friends_leaderboard()
returns table(user_id uuid, name text, avatar text, points bigint, is_me boolean)
language sql
stable
security definer
set search_path = public
as $$
  with mine as (
    select case when f.requester = auth.uid() then f.addressee else f.requester end as friend_id
    from friendships f
    where f.status = 'accepted' and auth.uid() in (f.requester, f.addressee)
  ),
  pool as (
    select friend_id as id from mine
    union
    select auth.uid()
  ),
  scored as (
    select p.id, p.name, p.avatar,
      coalesce((select sum(r.correct) from results r where r.user_id = p.id), 0) * 10
      + coalesce((select count(*) from duels d where d.winner = p.id), 0) * 30 as points
    from profiles p
    join pool on pool.id = p.id
    where public.level_group(p.level) = public.my_level_group()
  )
  select id, name, avatar, greatest(points, 0), id = auth.uid()
  from scored order by points desc, name;
$$;

revoke all on function public.my_level_group() from public, anon;
grant execute on function public.my_level_group() to authenticated;
