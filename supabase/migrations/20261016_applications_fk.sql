-- Demande d'accès contributeur : « La demande n'a pas pu être envoyée ».
-- Cause : user_id référençait public.profiles, or le profil de l'admin est supprimé (20261012)
-- → violation de clé étrangère (23503). On référence directement auth.users.
alter table public.contributor_applications
  drop constraint if exists contributor_applications_user_id_fkey;
alter table public.contributor_applications
  add constraint contributor_applications_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

-- La liste admin ne doit plus perdre une demande dont l'auteur n'a pas de profil.
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
    select a.user_id, coalesce(p.name, split_part(u.email::text, '@', 1)), u.email::text,
           a.subjects, a.school, a.message, a.created_at
    from contributor_applications a
    join auth.users u on u.id = a.user_id
    left join profiles p on p.id = a.user_id
    where a.status = 'pending'
    order by a.created_at;
end;
$$;
