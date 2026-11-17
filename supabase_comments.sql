-- =====================================================================
--  WorldUltimateRecords : commentaires sous chaque défi
--  À coller en entier dans Supabase > SQL Editor > New query > Run.
--  Peut être relancé sans risque. (Aussi inclus dans supabase.sql, section 13.)
-- =====================================================================

-- 13) Commentaires ------------------------------------------------------------
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  challenge  text not null check (char_length(challenge) between 1 and 60),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pseudo     text not null default 'Anonyme' check (char_length(pseudo) between 1 and 24),
  body       text not null check (char_length(btrim(body)) between 1 and 400),
  created_at timestamptz not null default now()
);
create index if not exists comments_challenge_idx on public.comments (challenge, created_at desc);
create index if not exists comments_user_idx on public.comments (user_id, created_at desc);
alter table public.comments enable row level security;

drop policy if exists "comments: lecture publique" on public.comments;
create policy "comments: lecture publique" on public.comments for select using (true);

-- Écrire : avec un pseudo, 5 commentaires par 10 minutes et 40 par jour maximum
drop policy if exists "comments: écrire" on public.comments;
create policy "comments: écrire" on public.comments
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.profiles p where p.user_id = auth.uid())
    and (select count(*) from public.comments c where c.user_id = auth.uid() and c.created_at > now() - interval '10 minutes') < 5
    and (select count(*) from public.comments c where c.user_id = auth.uid() and c.created_at > now() - interval '1 day') < 40
  );

drop policy if exists "comments: suppression par l'auteur ou l'admin" on public.comments;
create policy "comments: suppression par l'auteur ou l'admin" on public.comments
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- Le pseudo affiché est toujours celui du profil ; la date est celle du serveur
create or replace function public.comment_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare p text;
begin
  select pseudo into p from public.profiles where user_id = new.user_id;
  if p is null then
    raise exception 'Choisis un pseudo avant de commenter.' using errcode = 'P0001';
  end if;
  new.pseudo := p;
  new.body := btrim(new.body);
  new.created_at := now();
  return new;
end $$;
drop trigger if exists comments_before_insert on public.comments;
create trigger comments_before_insert before insert on public.comments
  for each row execute function public.comment_before_insert();

-- Quand un joueur change de pseudo, ses commentaires suivent
create or replace function public.comment_rename() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.pseudo is distinct from old.pseudo then
    update public.comments set pseudo = new.pseudo where user_id = new.user_id;
  end if;
  return new;
end $$;
drop trigger if exists profiles_comment_rename on public.profiles;
create trigger profiles_comment_rename after update on public.profiles
  for each row execute function public.comment_rename();

-- Nouveaux commentaires visibles en direct
do $$ begin
  begin alter publication supabase_realtime add table public.comments; exception when duplicate_object then null; end;
end $$;
