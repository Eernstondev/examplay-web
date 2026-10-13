-- Langue de l'interface (fr / ht = kreyòl), choisie dans l'app ou sur le site.
-- Sert à envoyer les notifications push dans la langue de l'élève (route /api/push/send).

alter table public.profiles
  add column if not exists language text not null default 'fr';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_language_check') then
    alter table public.profiles
      add constraint profiles_language_check check (language in ('fr', 'ht'));
  end if;
end $$;

-- Mise à jour par l'élève lui-même (indépendant des règles RLS de profiles).
create or replace function public.set_language(p_lang text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if p_lang not in ('fr', 'ht') then raise exception 'bad language'; end if;
  update public.profiles set language = p_lang where id = auth.uid();
end;
$$;

revoke all on function public.set_language(text) from public, anon;
grant execute on function public.set_language(text) to authenticated;
