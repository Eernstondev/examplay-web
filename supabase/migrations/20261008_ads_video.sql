-- Publicités vidéo : type de média + bucket ouvert aux vidéos (20 Mo maximum).
alter table public.ads
  add column if not exists media_type text not null default 'image'
  check (media_type in ('image', 'video'));

update storage.buckets
set file_size_limit = 20971520,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/webm']
where id = 'media';
