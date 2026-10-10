-- Amis et duels :
--  1. on ne peut défier qu'un ami (demande acceptée) ;
--  2. une demande d'ami reçue et une demande acceptée apparaissent dans la cloche
--     (table notifications), sur le site comme dans l'application.
-- Les tables friendships et duels, ainsi que create_duel / send_friend_request, existent déjà :
-- on n'y touche pas, on ajoute seulement des triggers.

-- ── Nouveaux types de notification ─────────────────────────────────────────
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
    'friend_request', 'friend_accepted'
  ));

-- ── Demande d'ami reçue / acceptée ─────────────────────────────────────────
create or replace function public.notify_friendship()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'pending' and (tg_op = 'INSERT' or old.status is distinct from 'pending') then
    insert into notifications (user_id, kind, data)
    values (
      new.addressee, 'friend_request',
      jsonb_build_object(
        'request_id', new.id,
        'from_id', new.requester,
        'from_name', (select name from profiles where id = new.requester)
      )
    );
  elsif tg_op = 'UPDATE' and old.status = 'pending' then
    -- La demande n'est plus en attente : on grise la notification chez celui qui l'a reçue.
    update notifications
       set read = true,
           data = data || jsonb_build_object('answered', new.status)
     where user_id = new.addressee
       and kind = 'friend_request'
       and data ->> 'request_id' = new.id::text
       and not (data ? 'answered');

    if new.status = 'accepted' then
      insert into notifications (user_id, kind, data)
      values (
        new.requester, 'friend_accepted',
        jsonb_build_object(
          'from_id', new.addressee,
          'from_name', (select name from profiles where id = new.addressee)
        )
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists friendships_notify on public.friendships;
create trigger friendships_notify
  after insert or update on public.friendships
  for each row execute function public.notify_friendship();

-- Demande refusée par suppression de la ligne : même effet sur la notification.
create or replace function public.notify_friendship_removed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'pending' then
    update notifications
       set read = true,
           data = data || jsonb_build_object('answered', 'declined')
     where user_id = old.addressee
       and kind = 'friend_request'
       and data ->> 'request_id' = old.id::text
       and not (data ? 'answered');
  end if;
  return old;
end;
$$;

drop trigger if exists friendships_notify_removed on public.friendships;
create trigger friendships_notify_removed
  after delete on public.friendships
  for each row execute function public.notify_friendship_removed();

-- ── Un duel ne se lance qu'entre amis ──────────────────────────────────────
create or replace function public.require_friends_for_duel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from friendships f
    where f.status = 'accepted'
      and ((f.requester = new.challenger and f.addressee = new.opponent)
        or (f.requester = new.opponent and f.addressee = new.challenger))
  ) then
    raise exception 'not friends';
  end if;
  return new;
end;
$$;

drop trigger if exists duels_require_friends on public.duels;
create trigger duels_require_friends
  before insert on public.duels
  for each row execute function public.require_friends_for_duel();
