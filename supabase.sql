-- =====================================================================
--  WorldUltimateRecords : base de données Supabase (version 3)
--  À coller en entier dans Supabase > SQL Editor > New query > Run.
--  Peut être relancé sans risque : il met à jour une installation
--  existante sans supprimer les scores.
-- =====================================================================

-- 1) Administrateurs ------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;
drop policy if exists "admins: chacun voit s'il est admin" on public.admins;
create policy "admins: chacun voit s'il est admin" on public.admins
  for select using (auth.uid() = user_id);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- 1b) Pass Néon : abonnements (écrits uniquement par la fonction Stripe) ------
create table if not exists public.subscriptions (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text unique,
  status                 text not null default 'incomplete',
  current_period_end     timestamptz,
  updated_at             timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
drop policy if exists "subscriptions: lecture de son abonnement" on public.subscriptions;
create policy "subscriptions: lecture de son abonnement" on public.subscriptions
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

create or replace function public.is_member(uid uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.subscriptions s
                 where s.user_id = uid and s.status in ('active','trialing')
                   and coalesce(s.current_period_end, now() + interval '1 day') > now());
$$;
-- liste publique des membres (pour afficher le badge), sans aucune info de paiement
create or replace function public.member_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select user_id from public.subscriptions
  where status in ('active','trialing') and coalesce(current_period_end, now() + interval '1 day') > now();
$$;
grant execute on function public.is_member(uuid) to anon, authenticated;
grant execute on function public.member_ids() to anon, authenticated;

-- 1c) Limite : 3 essais par défi et par jour (heure de Paris), illimité pour les membres
create or replace function public.paris_today() returns date
language sql stable as $$ select (now() at time zone 'Europe/Paris')::date $$;

create table if not exists public.daily_usage (
  user_id   uuid not null references auth.users(id) on delete cascade,
  challenge text not null,
  day       date not null,
  started   int  not null default 0,
  saved     int  not null default 0,
  primary key (user_id, challenge, day)
);
alter table public.daily_usage enable row level security;
drop policy if exists "daily_usage: lecture de ses essais" on public.daily_usage;
create policy "daily_usage: lecture de ses essais" on public.daily_usage
  for select to authenticated using (user_id = auth.uid());

-- Défis réservés aux membres
create or replace function public.vip_challenges() returns text[]
language sql immutable as $$ select array['cardhouse','bottleflip','onehand'] $$;

-- Appelée au début de chaque essai : consomme 1 essai, ou refuse
create or replace function public.start_attempt(p_challenge text) returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); m boolean; cur int;
begin
  if u is null then raise exception 'non connecté'; end if;
  if p_challenge is null or char_length(p_challenge) not between 1 and 60 then raise exception 'défi invalide'; end if;
  m := public.is_member(u) or public.is_admin();
  if p_challenge = any(public.vip_challenges()) and not m then
    return json_build_object('ok', false, 'reason', 'vip', 'remaining', 0, 'member', m);
  end if;
  select started into cur from public.daily_usage where user_id = u and challenge = p_challenge and day = public.paris_today();
  cur := coalesce(cur, 0);
  if not m and cur >= 3 then
    return json_build_object('ok', false, 'reason', 'limit', 'remaining', 0, 'member', m);
  end if;
  insert into public.daily_usage (user_id, challenge, day, started) values (u, p_challenge, public.paris_today(), 1)
  on conflict (user_id, challenge, day) do update set started = public.daily_usage.started + 1;
  return json_build_object('ok', true, 'remaining', case when m then -1 else 2 - cur end, 'member', m);
end $$;
revoke all on function public.start_attempt(text) from public;
grant execute on function public.start_attempt(text) to authenticated;

-- 2) Profils : un pseudo unique par joueur -------------------------------
create table if not exists public.profiles (
  user_id    uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  pseudo     text not null,
  created_at timestamptz not null default now(),
  constraint pseudo_format check (pseudo ~ '^[A-Za-z0-9À-ÖØ-öø-ÿ_. -]{3,24}$')
);
alter table public.profiles drop constraint if exists pseudo_reserve;

-- Pseudos réservés : seul l'admin peut les prendre
create or replace function public.profile_check_reserved() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if lower(new.pseudo) in ('admin','administrateur','moderateur','modérateur','worldultimaterecords','wur','anonyme','mr.novyra','novyra')
     and not public.is_admin() then
    raise exception 'Ce pseudo est réservé.' using errcode = '23514';
  end if;
  return new;
end $$;
drop trigger if exists profiles_check_reserved on public.profiles;
create trigger profiles_check_reserved before insert or update on public.profiles
  for each row execute function public.profile_check_reserved();
create unique index if not exists profiles_pseudo_unique on public.profiles (lower(pseudo));
alter table public.profiles enable row level security;
drop policy if exists "profiles: lecture publique" on public.profiles;
create policy "profiles: lecture publique" on public.profiles for select using (true);
drop policy if exists "profiles: création de son profil" on public.profiles;
create policy "profiles: création de son profil" on public.profiles
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "profiles: modification de son profil" on public.profiles;
create policy "profiles: modification de son profil" on public.profiles
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "profiles: suppression de son profil" on public.profiles;
create policy "profiles: suppression de son profil" on public.profiles
  for delete to authenticated using (user_id = auth.uid());

-- 3) Records créés par les joueurs ---------------------------------------
create table if not exists public.challenges (
  id          text primary key check (id ~ '^x-[a-z0-9-]{4,40}$'),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 4 and 60),
  description text not null check (char_length(description) between 10 and 240),
  mode        text not null check (mode in ('count','time','hold')),
  win         int  not null default 60 check (win in (30,60,120)),
  unit        text not null default 'répétitions' check (char_length(unit) between 1 and 20),
  created_at  timestamptz not null default now()
);
alter table public.challenges enable row level security;
drop policy if exists "challenges: lecture publique" on public.challenges;
create policy "challenges: lecture publique" on public.challenges for select using (true);
drop policy if exists "challenges: création par soi-même" on public.challenges;
create policy "challenges: création par soi-même" on public.challenges
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.profiles p where p.user_id = auth.uid())
    and (select count(*) from public.challenges c where c.user_id = auth.uid())
        < case when public.is_member(auth.uid()) or public.is_admin() then 30 else 5 end
  );
drop policy if exists "challenges: suppression par l'auteur ou l'admin" on public.challenges;
create policy "challenges: suppression par l'auteur ou l'admin" on public.challenges
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- 4) Tentatives -----------------------------------------------------------
create table if not exists public.attempts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pseudo      text not null default 'Anonyme' check (char_length(pseudo) between 1 and 24),
  challenge   text not null check (char_length(challenge) between 1 and 60),
  value       double precision not null check (value >= 0 and value < 1e9),
  status      text not null default 'pending' check (status in ('auto','pending','ok','no')),
  video_path  text check (video_path is null or char_length(video_path) < 200),
  code        text check (code is null or char_length(code) < 16),
  created_at  timestamptz not null default now()
);
alter table public.attempts add column if not exists hidden boolean not null default false;
alter table public.attempts add column if not exists consent_at timestamptz;
create index if not exists attempts_created_idx on public.attempts (created_at desc);
create index if not exists attempts_user_idx on public.attempts (user_id);
alter table public.attempts enable row level security;

-- Lecture : les tentatives masquées ou refusées ne sont visibles que par leur auteur et l'admin
drop policy if exists "attempts: lecture publique" on public.attempts;
create policy "attempts: lecture publique" on public.attempts
  for select using ((hidden = false and status <> 'no') or user_id = auth.uid() or public.is_admin());

-- Création : ses propres tentatives, avec un profil, 40 par heure maximum.
--  - défis navigateur : statut 'auto'
--  - défis caméra : statut 'pending', vidéo dans SON dossier, consentement obligatoire
drop policy if exists "attempts: création par soi-même" on public.attempts;
create policy "attempts: création par soi-même" on public.attempts
  for insert to authenticated with check (
    user_id = auth.uid()
    and hidden = false
    and (select count(*) from public.attempts a where a.user_id = auth.uid() and a.created_at > now() - interval '1 hour') < 40
    and exists (select 1 from public.daily_usage u
                where u.user_id = auth.uid() and u.challenge = attempts.challenge
                  and u.day >= public.paris_today() - 1 and u.saved < u.started)
    and (attempts.challenge <> all(public.vip_challenges()) or public.is_member(auth.uid()) or public.is_admin())
    and (
      (status = 'auto' and challenge in ('alphabet','reaction','clicks','typing','memory','aim','chrono','mental','stroop') and video_path is null)
      or
      (status = 'pending' and video_path like auth.uid()::text || '/%' and consent_at is not null
        and challenge not in ('alphabet','reaction','clicks','typing','memory','aim','chrono','mental','stroop'))
    )
  );

drop policy if exists "attempts: modération admin" on public.attempts;
create policy "attempts: modération admin" on public.attempts
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "attempts: suppression admin" on public.attempts;
drop policy if exists "attempts: suppression par l'auteur ou l'admin" on public.attempts;
create policy "attempts: suppression par l'auteur ou l'admin" on public.attempts
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- Le pseudo d'une tentative est toujours celui du profil (impossible d'usurper un pseudo)
create or replace function public.attempt_set_pseudo() returns trigger
language plpgsql security definer set search_path = public as $$
declare p text;
begin
  select pseudo into p from public.profiles where user_id = new.user_id;
  if p is null then
    raise exception 'Choisis un pseudo avant d''enregistrer un score.' using errcode = 'P0001';
  end if;
  new.pseudo := p;
  return new;
end $$;
drop trigger if exists attempts_set_pseudo on public.attempts;
create trigger attempts_set_pseudo before insert on public.attempts
  for each row execute function public.attempt_set_pseudo();

create or replace function public.attempt_mark_saved() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.daily_usage set saved = saved + 1
  where ctid = (select ctid from public.daily_usage
                where user_id = new.user_id and challenge = new.challenge
                  and day >= public.paris_today() - 1 and saved < started
                order by day limit 1);
  return new;
end $$;
drop trigger if exists attempts_mark_saved on public.attempts;
create trigger attempts_mark_saved after insert on public.attempts
  for each row execute function public.attempt_mark_saved();

create or replace function public.profile_rename() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.pseudo is distinct from old.pseudo then
    update public.attempts set pseudo = new.pseudo where user_id = new.user_id;
  end if;
  return new;
end $$;
drop trigger if exists profiles_rename on public.profiles;
create trigger profiles_rename after update on public.profiles
  for each row execute function public.profile_rename();

-- 5) Signalements ------------------------------------------------------------
create table if not exists public.reports (
  id         bigint generated always as identity primary key,
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reason     text not null check (reason in ('choquant','triche','mineur','autre')),
  created_at timestamptz not null default now(),
  unique (attempt_id, user_id)
);
alter table public.reports enable row level security;
drop policy if exists "reports: signaler" on public.reports;
create policy "reports: signaler" on public.reports
  for insert to authenticated with check (
    user_id = auth.uid()
    and (select count(*) from public.reports r where r.user_id = auth.uid() and r.created_at > now() - interval '1 day') < 30
  );
drop policy if exists "reports: lecture admin ou auteur" on public.reports;
create policy "reports: lecture admin ou auteur" on public.reports
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "reports: suppression admin" on public.reports;
create policy "reports: suppression admin" on public.reports
  for delete to authenticated using (public.is_admin());

-- 3 signalements = vidéo masquée automatiquement en attendant ta décision
create or replace function public.report_autohide() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.reports where attempt_id = new.attempt_id) >= 3 then
    update public.attempts set hidden = true where id = new.attempt_id;
  end if;
  return new;
end $$;
drop trigger if exists reports_autohide on public.reports;
create trigger reports_autohide after insert on public.reports
  for each row execute function public.report_autohide();

-- 6) Suppression complète de son compte (droit à l'effacement) ------------
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- 7) Stockage des vidéos -------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', true, 52428800, array['video/webm','video/mp4'])
on conflict (id) do update set public = true, file_size_limit = 52428800, allowed_mime_types = array['video/webm','video/mp4'];

drop policy if exists "videos: envoi dans son dossier" on storage.objects;
create policy "videos: envoi dans son dossier" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "videos: lecture de ses fichiers ou admin" on storage.objects;
create policy "videos: lecture de ses fichiers ou admin" on storage.objects
  for select to authenticated using (
    bucket_id = 'videos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
drop policy if exists "videos: suppression admin" on storage.objects;
drop policy if exists "videos: suppression par l'auteur ou l'admin" on storage.objects;
create policy "videos: suppression par l'auteur ou l'admin" on storage.objects
  for delete to authenticated using (
    bucket_id = 'videos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- 8) Mises à jour en direct ---------------------------------------------------
do $$ begin
  begin alter publication supabase_realtime add table public.attempts;   exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.challenges; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.reports;    exception when duplicate_object then null; end;
end $$;

-- 9) Profils pour les joueurs qui avaient déjà joué avec la version précédente
insert into public.profiles (user_id, pseudo)
select distinct on (a.user_id) a.user_id, a.pseudo
from public.attempts a
where not exists (select 1 from public.profiles p where p.user_id = a.user_id)
  and a.pseudo ~ '^[A-Za-z0-9À-ÖØ-öø-ÿ_. -]{3,24}$'
  and lower(a.pseudo) not in ('admin','administrateur','moderateur','modérateur','worldultimaterecords','wur','anonyme','mr.novyra','novyra')
  and not exists (select 1 from public.profiles p2 where lower(p2.pseudo) = lower(a.pseudo))
order by a.user_id, a.created_at desc
on conflict do nothing;

-- =====================================================================
--  10) UNE SEULE FOIS, après avoir créé ton compte admin (guide, étape 4) :
--      exécute ces deux lignes dans une nouvelle requête, avec ton e-mail.
-- =====================================================================
-- insert into public.admins (user_id)
-- select id from auth.users where email = 'ton-email@exemple.com' on conflict do nothing;
