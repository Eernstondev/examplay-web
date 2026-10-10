-- Notifications push de l'application mobile : un jeton Expo par téléphone et par compte.
-- L'envoi se fait dans app/api/push/send (même webhook que le navigateur).

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  token text not null,
  updated_at timestamptz not null default now(),
  unique (user_id, token)
);

alter table public.push_tokens enable row level security;

drop policy if exists push_tokens_select_own on public.push_tokens;
create policy push_tokens_select_own on public.push_tokens
  for select to authenticated using (user_id = auth.uid());

drop policy if exists push_tokens_delete_own on public.push_tokens;
create policy push_tokens_delete_own on public.push_tokens
  for delete to authenticated using (user_id = auth.uid());

-- Pas d'insert/update direct : tout passe par register_push_token (ci-dessous).

create index if not exists push_tokens_user_idx on public.push_tokens (user_id);

-- Enregistre le téléphone pour le compte connecté ET le retire des autres comptes :
-- sans cela, après un changement de compte sur le même téléphone, les notifications
-- de l'ancien compte continueraient d'arriver ici.
create or replace function public.register_push_token(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if p_token is null or p_token !~ '^(Expo|Exponent)PushToken\[.+\]$' then
    raise exception 'invalid token';
  end if;
  delete from push_tokens where token = p_token and user_id <> auth.uid();
  insert into push_tokens (user_id, token, updated_at)
  values (auth.uid(), p_token, now())
  on conflict (user_id, token) do update set updated_at = now();
end;
$$;

revoke all on function public.register_push_token(text) from public, anon;
grant execute on function public.register_push_token(text) to authenticated;

-- À la déconnexion : retire ce téléphone du compte.
create or replace function public.unregister_push_token(p_token text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from push_tokens where token = p_token and user_id = auth.uid();
$$;

revoke all on function public.unregister_push_token(text) from public, anon;
grant execute on function public.unregister_push_token(text) to authenticated;
