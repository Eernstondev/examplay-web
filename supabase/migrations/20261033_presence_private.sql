-- Liste « en ligne » : canaux Realtime privés online:9e et online:ns4.
-- Un élève ne peut ni écouter ni publier sa présence que dans le canal de son groupe.
-- Les canaux publics (duels, notifications, amis) ne sont pas concernés.

drop policy if exists "presence_read_own_group" on realtime.messages;
drop policy if exists "presence_write_own_group" on realtime.messages;

create policy "presence_read_own_group"
on realtime.messages
for select
to authenticated
using (
  realtime.messages.extension = 'presence'
  and (select realtime.topic()) = 'online:' || (select public.my_level_group())
);

create policy "presence_write_own_group"
on realtime.messages
for insert
to authenticated
with check (
  realtime.messages.extension = 'presence'
  and (select realtime.topic()) = 'online:' || (select public.my_level_group())
);

grant execute on function public.my_level_group() to authenticated;
