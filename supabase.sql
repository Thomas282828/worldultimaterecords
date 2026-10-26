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

-- ancienneté des membres (badge 1 mois, 3 mois, 6 mois, 1 an)
alter table public.subscriptions add column if not exists member_since timestamptz not null default now();
drop function if exists public.member_info();
create function public.member_info() returns table (user_id uuid, since timestamptz)
language sql stable security definer set search_path = public as $$
  select s.user_id, s.member_since from public.subscriptions s
  where s.status in ('active','trialing') and coalesce(s.current_period_end, now() + interval '1 day') > now();
$$;
grant execute on function public.member_info() to anon, authenticated;

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

-- Défis navigateur (score mesuré par le site, sans vidéo)
create or replace function public.web_challenges() returns text[]
language sql immutable as $$ select array['alphabet','reaction','clicks','typing','memory','aim','chrono','mental','stroop',
  'steady','alternate','tower','circle','digits','odd','seq25','higher','shade','estimate','pitch','rhythm',
  'stars','mole','runner','tightrope','pairs','maze','truefalse','slide','duration','angle','faces','steadyclick'] $$;

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
alter table public.profiles add column if not exists color text;
alter table public.profiles drop constraint if exists profile_color_ok;
alter table public.profiles add constraint profile_color_ok check (color is null or color in ('violet','cyan','rose','or','vert'));

-- la couleur de pseudo est réservée aux membres du Pass Néon
create or replace function public.profile_check_color() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.color is not null and (tg_op = 'INSERT' or new.color is distinct from old.color)
     and not (public.is_member(new.user_id) or public.is_admin()) then
    raise exception 'La couleur de pseudo est réservée au Pass Néon.' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists profiles_check_color on public.profiles;
create trigger profiles_check_color before insert or update on public.profiles
  for each row execute function public.profile_check_color();

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
      (status = 'auto' and challenge = any(public.web_challenges()) and video_path is null)
      or
      (status = 'pending' and video_path like auth.uid()::text || '/%' and consent_at is not null
        and challenge <> all(public.web_challenges()))
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

-- 5b) Ligues privées entre amis -------------------------------------------
create table if not exists public.leagues (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null check (char_length(name) between 3 and 40),
  code       text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  created_at timestamptz not null default now()
);
create table if not exists public.league_members (
  league_id uuid not null references public.leagues(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;

create or replace function public.in_league(lid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.league_members where league_id = lid and user_id = auth.uid());
$$;

drop policy if exists "leagues: visibles par leurs membres" on public.leagues;
create policy "leagues: visibles par leurs membres" on public.leagues
  for select to authenticated using (owner = auth.uid() or public.in_league(id) or public.is_admin());
drop policy if exists "leagues: suppression par le créateur" on public.leagues;
create policy "leagues: suppression par le créateur" on public.leagues
  for delete to authenticated using (owner = auth.uid() or public.is_admin());
drop policy if exists "league_members: visibles entre membres" on public.league_members;
create policy "league_members: visibles entre membres" on public.league_members
  for select to authenticated using (public.in_league(league_id) or public.is_admin());
drop policy if exists "league_members: quitter une ligue" on public.league_members;
create policy "league_members: quitter une ligue" on public.league_members
  for delete to authenticated using (user_id = auth.uid()
    or exists (select 1 from public.leagues l where l.id = league_id and l.owner = auth.uid()));

-- Créer une ligue : membres du Pass Néon, 5 ligues maximum
create or replace function public.create_league(p_name text) returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); c text; lid uuid; tries int := 0;
begin
  if u is null then raise exception 'non connecté'; end if;
  if not (public.is_member(u) or public.is_admin()) then raise exception 'Créer une ligue est réservé au Pass Néon.' using errcode = '42501'; end if;
  if (select count(*) from public.leagues where owner = u) >= 5 then raise exception 'Tu as déjà 5 ligues.' using errcode = '42501'; end if;
  if p_name is null or char_length(trim(p_name)) not between 3 and 40 then raise exception 'Le nom doit faire 3 à 40 caractères.'; end if;
  loop
    c := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when char_length(c) = 6 and not exists (select 1 from public.leagues where code = c);
    tries := tries + 1; if tries > 20 then raise exception 'réessaie'; end if;
  end loop;
  insert into public.leagues (owner, name, code) values (u, trim(p_name), c) returning id into lid;
  insert into public.league_members (league_id, user_id) values (lid, u);
  return json_build_object('id', lid, 'code', c);
end $$;

-- Aperçu d'une ligue à partir de son code d'invitation (nom et nombre de membres seulement)
create or replace function public.league_preview(p_code text) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('name', l.name, 'members', (select count(*) from public.league_members m where m.league_id = l.id))
  from public.leagues l where l.code = upper(p_code);
$$;

-- Rejoindre une ligue : gratuit pour tous, 50 membres maximum
create or replace function public.join_league(p_code text) returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); lid uuid;
begin
  if u is null then raise exception 'non connecté'; end if;
  select id into lid from public.leagues where code = upper(p_code);
  if lid is null then raise exception 'Code de ligue inconnu.'; end if;
  if (select count(*) from public.league_members where league_id = lid) >= 50 then raise exception 'Cette ligue est complète (50 membres).'; end if;
  if (select count(*) from public.league_members where user_id = u) >= 20 then raise exception 'Tu fais déjà partie de 20 ligues.'; end if;
  insert into public.league_members (league_id, user_id) values (lid, u) on conflict do nothing;
  return json_build_object('id', lid);
end $$;
revoke all on function public.create_league(text) from public;
revoke all on function public.join_league(text) from public;
grant execute on function public.create_league(text) to authenticated;
grant execute on function public.join_league(text) to authenticated;
grant execute on function public.league_preview(text) to anon, authenticated;

-- 5c) Battles d'aura ----------------------------------------------------------
-- Vidéos « moment d'aura » (solo) et duels 1 contre 1 ; la communauté vote.
create table if not exists public.aura_posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pseudo      text not null default 'Anonyme' check (char_length(pseudo) between 1 and 24),
  kind        text not null check (kind in ('solo','duel')),
  parent_id   uuid references public.aura_posts(id) on delete cascade,
  title       text not null check (char_length(title) between 3 and 80),
  video_path  text check (video_path is null or char_length(video_path) < 200),
  source      text not null default 'camera' check (source in ('import','camera')),
  status      text not null default 'pending' check (status in ('pending','ok','no')),
  hidden      boolean not null default false,
  consent_at  timestamptz,
  decided_at  timestamptz,
  created_at  timestamptz not null default now(),
  check (parent_id is null or kind = 'duel')
);
alter table public.aura_posts add column if not exists side text not null default 'gain';
do $$ begin alter table public.aura_posts add constraint aura_posts_side_chk check (side in ('gain','loss')); exception when duplicate_object then null; end $$;
create index if not exists aura_posts_created_idx on public.aura_posts (created_at desc);
create unique index if not exists aura_one_reply on public.aura_posts (parent_id) where parent_id is not null and status <> 'no';
alter table public.aura_posts enable row level security;

drop policy if exists "aura: lecture publique" on public.aura_posts;
create policy "aura: lecture publique" on public.aura_posts
  for select using ((hidden = false and status = 'ok') or user_id = auth.uid() or public.is_admin());
drop policy if exists "aura: envoi" on public.aura_posts;
create policy "aura: envoi" on public.aura_posts
  for insert to authenticated with check (
    user_id = auth.uid() and status = 'pending' and hidden = false and consent_at is not null
    and video_path like auth.uid()::text || '/%'
  );
drop policy if exists "aura: modération admin" on public.aura_posts;
create policy "aura: modération admin" on public.aura_posts
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "aura: suppression par l'auteur ou l'admin" on public.aura_posts;
create policy "aura: suppression par l'auteur ou l'admin" on public.aura_posts
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- Vérifications à l'envoi : pseudo du profil, 10 vidéos par jour, duel valide
create or replace function public.aura_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare p text; par public.aura_posts;
begin
  select pseudo into p from public.profiles where user_id = new.user_id;
  if p is null then raise exception 'Choisis un pseudo avant d''envoyer une vidéo.' using errcode = 'P0001'; end if;
  new.pseudo := p;
  if (select count(*) from public.aura_posts where user_id = new.user_id and created_at > now() - interval '1 day') >= 10 then
    raise exception 'Limite de 10 vidéos d''aura par jour atteinte.' using errcode = 'P0001';
  end if;
  if new.parent_id is not null then
    select * into par from public.aura_posts where id = new.parent_id;
    if par.id is null or par.kind <> 'duel' or par.parent_id is not null or par.status <> 'ok' or par.hidden then
      raise exception 'Ce duel n''est pas disponible.' using errcode = 'P0001'; end if;
    if par.user_id = new.user_id then raise exception 'Tu ne peux pas relever ton propre duel.' using errcode = 'P0001'; end if;
    if exists (select 1 from public.aura_posts r where r.parent_id = new.parent_id and r.status <> 'no') then
      raise exception 'Quelqu''un a déjà relevé ce duel.' using errcode = 'P0001'; end if;
  end if;
  return new;
end $$;
drop trigger if exists aura_posts_before_insert on public.aura_posts;
create trigger aura_posts_before_insert before insert on public.aura_posts
  for each row execute function public.aura_before_insert();

create or replace function public.aura_decided() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and new.status in ('ok','no') then new.decided_at := now(); end if;
  return new;
end $$;
drop trigger if exists aura_posts_decided on public.aura_posts;
create trigger aura_posts_decided before update on public.aura_posts
  for each row execute function public.aura_decided();

create or replace function public.aura_rename() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.pseudo is distinct from old.pseudo then
    update public.aura_posts set pseudo = new.pseudo where user_id = new.user_id;
  end if;
  return new;
end $$;
drop trigger if exists profiles_aura_rename on public.profiles;
create trigger profiles_aura_rename after update on public.profiles
  for each row execute function public.aura_rename();

-- Votes : 1 vote par personne et par battle (modifiable), jamais pour soi-même.
-- Duel : les votes sont ouverts 7 jours après la validation de la réponse.
create table if not exists public.aura_votes (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  target_id  uuid not null references public.aura_posts(id) on delete cascade,
  choice_id  uuid not null references public.aura_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, target_id)
);
alter table public.aura_votes enable row level security;

create or replace function public.aura_can_vote(p_target uuid, p_choice uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare t public.aura_posts; r public.aura_posts; u uuid := auth.uid();
begin
  if u is null or not exists (select 1 from public.profiles where user_id = u) then return false; end if;
  select * into t from public.aura_posts where id = p_target;
  if t.id is null or t.status <> 'ok' or t.hidden or t.parent_id is not null then return false; end if;
  if t.kind = 'solo' then return p_choice = t.id and t.user_id <> u; end if;
  select * into r from public.aura_posts where parent_id = t.id and status = 'ok' and hidden = false limit 1;
  if r.id is null then return false; end if;
  if u in (t.user_id, r.user_id) then return false; end if;
  if coalesce(r.decided_at, r.created_at) < now() - interval '7 days' then return false; end if;
  return p_choice in (t.id, r.id);
end $$;
grant execute on function public.aura_can_vote(uuid, uuid) to authenticated;

drop policy if exists "aura votes: lecture publique" on public.aura_votes;
create policy "aura votes: lecture publique" on public.aura_votes for select using (true);
drop policy if exists "aura votes: voter" on public.aura_votes;
create policy "aura votes: voter" on public.aura_votes
  for insert to authenticated with check (user_id = auth.uid() and public.aura_can_vote(target_id, choice_id));
drop policy if exists "aura votes: changer son vote" on public.aura_votes;
create policy "aura votes: changer son vote" on public.aura_votes
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and public.aura_can_vote(target_id, choice_id));
drop policy if exists "aura votes: retirer son vote" on public.aura_votes;
create policy "aura votes: retirer son vote" on public.aura_votes
  for delete to authenticated using (user_id = auth.uid());

-- Idées d'aura proposées par les joueurs (« +500 : … »), votées puis validées par l'admin
create table if not exists public.aura_ideas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid default auth.uid() references auth.users(id) on delete cascade,
  pseudo      text not null default 'Anonyme' check (char_length(pseudo) between 1 and 24),
  text        text not null check (char_length(text) between 8 and 90),
  points      int  not null check (points in (-1000,-900,-800,-700,-600,-500,-400,-300,-200,-100,100,200,300,400,500,600,700,800,900,1000)),
  status      text not null default 'pending' check (status in ('pending','ok','no')),
  created_at  timestamptz not null default now()
);
alter table public.aura_ideas alter column user_id drop not null;
alter table public.aura_ideas add column if not exists official boolean not null default false;
create unique index if not exists aura_ideas_text_uniq on public.aura_ideas (lower(text)) where status <> 'no';
alter table public.aura_ideas enable row level security;
drop policy if exists "aura ideas: lecture" on public.aura_ideas;
create policy "aura ideas: lecture" on public.aura_ideas
  for select using (status = 'ok' or user_id = auth.uid() or public.is_admin());
drop policy if exists "aura ideas: proposer" on public.aura_ideas;
create policy "aura ideas: proposer" on public.aura_ideas
  for insert to authenticated with check (user_id = auth.uid() and status = 'pending' and official = false);
drop policy if exists "aura ideas: modération admin" on public.aura_ideas;
create policy "aura ideas: modération admin" on public.aura_ideas
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "aura ideas: suppression" on public.aura_ideas;
create policy "aura ideas: suppression" on public.aura_ideas
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());

create or replace function public.aura_idea_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare p text;
begin
  if new.official then return new; end if;
  select pseudo into p from public.profiles where user_id = new.user_id;
  if p is null then raise exception 'Choisis un pseudo avant de proposer une idée.' using errcode = 'P0001'; end if;
  new.pseudo := p;
  if (select count(*) from public.aura_ideas where user_id = new.user_id and created_at > now() - interval '1 day') >= 5 then
    raise exception 'Limite de 5 idées par jour atteinte.' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists aura_ideas_before_insert on public.aura_ideas;
create trigger aura_ideas_before_insert before insert on public.aura_ideas
  for each row execute function public.aura_idea_before_insert();
create or replace function public.aura_idea_rename() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.pseudo is distinct from old.pseudo then update public.aura_ideas set pseudo = new.pseudo where user_id = new.user_id; end if;
  return new;
end $$;
drop trigger if exists profiles_aura_idea_rename on public.profiles;
create trigger profiles_aura_idea_rename after update on public.profiles
  for each row execute function public.aura_idea_rename();

create table if not exists public.aura_idea_votes (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  idea_id    uuid not null references public.aura_ideas(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, idea_id)
);
alter table public.aura_idea_votes enable row level security;
drop policy if exists "aura idea votes: lecture" on public.aura_idea_votes;
create policy "aura idea votes: lecture" on public.aura_idea_votes for select using (true);
drop policy if exists "aura idea votes: voter" on public.aura_idea_votes;
create policy "aura idea votes: voter" on public.aura_idea_votes
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.aura_ideas i where i.id = idea_id and i.status = 'ok' and i.user_id is distinct from auth.uid())
    and exists (select 1 from public.profiles where user_id = auth.uid())
  );
drop policy if exists "aura idea votes: retirer" on public.aura_idea_votes;
create policy "aura idea votes: retirer" on public.aura_idea_votes
  for delete to authenticated using (user_id = auth.uid());

-- Façons officielles de gagner ou perdre de l'aura (votées par les joueurs comme les autres)
insert into public.aura_ideas (id, user_id, pseudo, text, points, status, official) values
  (md5('wur-idea:'||'Rester calme quand tout le monde panique')::uuid, null, 'WorldUltimateRecords', 'Rester calme quand tout le monde panique', 1000, 'ok', true),
  (md5('wur-idea:'||'Dire « je m''en occupe » et régler le problème en 10 secondes')::uuid, null, 'WorldUltimateRecords', 'Dire « je m''en occupe » et régler le problème en 10 secondes', 1000, 'ok', true),
  (md5('wur-idea:'||'Mettre la balle de papier dans la poubelle sans regarder')::uuid, null, 'WorldUltimateRecords', 'Mettre la balle de papier dans la poubelle sans regarder', 900, 'ok', true),
  (md5('wur-idea:'||'Retourner une bouteille d''eau du premier coup devant tout le monde')::uuid, null, 'WorldUltimateRecords', 'Retourner une bouteille d''eau du premier coup devant tout le monde', 900, 'ok', true),
  (md5('wur-idea:'||'Rattraper un objet qui tombe sans le regarder')::uuid, null, 'WorldUltimateRecords', 'Rattraper un objet qui tombe sans le regarder', 800, 'ok', true),
  (md5('wur-idea:'||'Rattraper sa tartine avant qu''elle touche le sol')::uuid, null, 'WorldUltimateRecords', 'Rattraper sa tartine avant qu''elle touche le sol', 800, 'ok', true),
  (md5('wur-idea:'||'Retenir le prénom de quelqu''un vu une seule fois')::uuid, null, 'WorldUltimateRecords', 'Retenir le prénom de quelqu''un vu une seule fois', 800, 'ok', true),
  (md5('wur-idea:'||'Ranger sa chambre avant qu''on te le demande')::uuid, null, 'WorldUltimateRecords', 'Ranger sa chambre avant qu''on te le demande', 800, 'ok', true),
  (md5('wur-idea:'||'Rattraper ses clés lancées par quelqu''un sans regarder')::uuid, null, 'WorldUltimateRecords', 'Rattraper ses clés lancées par quelqu''un sans regarder', 800, 'ok', true),
  (md5('wur-idea:'||'Gagner un débat avec une seule phrase')::uuid, null, 'WorldUltimateRecords', 'Gagner un débat avec une seule phrase', 700, 'ok', true),
  (md5('wur-idea:'||'Arriver pile à l''heure pendant que tout le monde court')::uuid, null, 'WorldUltimateRecords', 'Arriver pile à l''heure pendant que tout le monde court', 700, 'ok', true),
  (md5('wur-idea:'||'Réussir un créneau du premier coup devant du monde')::uuid, null, 'WorldUltimateRecords', 'Réussir un créneau du premier coup devant du monde', 700, 'ok', true),
  (md5('wur-idea:'||'Trouver la réponse d''une devinette avant tout le monde')::uuid, null, 'WorldUltimateRecords', 'Trouver la réponse d''une devinette avant tout le monde', 700, 'ok', true),
  (md5('wur-idea:'||'Marquer du premier coup devant tout le monde')::uuid, null, 'WorldUltimateRecords', 'Marquer du premier coup devant tout le monde', 600, 'ok', true),
  (md5('wur-idea:'||'Remettre son capuchon de stylo en le lançant')::uuid, null, 'WorldUltimateRecords', 'Remettre son capuchon de stylo en le lançant', 600, 'ok', true),
  (md5('wur-idea:'||'Finir le Rubik''s Cube pendant qu''on te parle')::uuid, null, 'WorldUltimateRecords', 'Finir le Rubik''s Cube pendant qu''on te parle', 600, 'ok', true),
  (md5('wur-idea:'||'Faire un tour de magie que personne ne comprend')::uuid, null, 'WorldUltimateRecords', 'Faire un tour de magie que personne ne comprend', 600, 'ok', true),
  (md5('wur-idea:'||'Se faire applaudir par des inconnus')::uuid, null, 'WorldUltimateRecords', 'Se faire applaudir par des inconnus', 500, 'ok', true),
  (md5('wur-idea:'||'Avoir la bonne réponse quand le prof dit « personne ? »')::uuid, null, 'WorldUltimateRecords', 'Avoir la bonne réponse quand le prof dit « personne ? »', 500, 'ok', true),
  (md5('wur-idea:'||'Faire une passe parfaite sans même regarder')::uuid, null, 'WorldUltimateRecords', 'Faire une passe parfaite sans même regarder', 500, 'ok', true),
  (md5('wur-idea:'||'Garder son sérieux pendant que tout le monde rigole')::uuid, null, 'WorldUltimateRecords', 'Garder son sérieux pendant que tout le monde rigole', 500, 'ok', true),
  (md5('wur-idea:'||'Garder la porte et qu''on te remercie')::uuid, null, 'WorldUltimateRecords', 'Garder la porte et qu''on te remercie', 400, 'ok', true),
  (md5('wur-idea:'||'Ouvrir un bocal que personne n''arrivait à ouvrir')::uuid, null, 'WorldUltimateRecords', 'Ouvrir un bocal que personne n''arrivait à ouvrir', 400, 'ok', true),
  (md5('wur-idea:'||'Savoir réparer la Wi-Fi de la maison')::uuid, null, 'WorldUltimateRecords', 'Savoir réparer la Wi-Fi de la maison', 400, 'ok', true),
  (md5('wur-idea:'||'Répondre « je sais » et avoir vraiment raison')::uuid, null, 'WorldUltimateRecords', 'Répondre « je sais » et avoir vraiment raison', 300, 'ok', true),
  (md5('wur-idea:'||'Avoir de la batterie et un chargeur quand tout le monde est à 1 %')::uuid, null, 'WorldUltimateRecords', 'Avoir de la batterie et un chargeur quand tout le monde est à 1 %', 300, 'ok', true),
  (md5('wur-idea:'||'Avoir toujours un mouchoir quand quelqu''un en a besoin')::uuid, null, 'WorldUltimateRecords', 'Avoir toujours un mouchoir quand quelqu''un en a besoin', 300, 'ok', true),
  (md5('wur-idea:'||'Trébucher devant toute la classe')::uuid, null, 'WorldUltimateRecords', 'Trébucher devant toute la classe', -1000, 'ok', true),
  (md5('wur-idea:'||'Mettre une vidéo à fond sans faire exprès dans une salle silencieuse')::uuid, null, 'WorldUltimateRecords', 'Mettre une vidéo à fond sans faire exprès dans une salle silencieuse', -1000, 'ok', true),
  (md5('wur-idea:'||'Envoyer un vocal de 3 minutes sans le vouloir')::uuid, null, 'WorldUltimateRecords', 'Envoyer un vocal de 3 minutes sans le vouloir', -1000, 'ok', true),
  (md5('wur-idea:'||'Répondre au prof en l''appelant « maman »')::uuid, null, 'WorldUltimateRecords', 'Répondre au prof en l''appelant « maman »', -900, 'ok', true),
  (md5('wur-idea:'||'Se tromper de salle et s''asseoir quand même 5 minutes')::uuid, null, 'WorldUltimateRecords', 'Se tromper de salle et s''asseoir quand même 5 minutes', -900, 'ok', true),
  (md5('wur-idea:'||'Saluer quelqu''un qui saluait la personne derrière toi')::uuid, null, 'WorldUltimateRecords', 'Saluer quelqu''un qui saluait la personne derrière toi', -800, 'ok', true),
  (md5('wur-idea:'||'Passer devant tout le monde avec du dentifrice sur le menton')::uuid, null, 'WorldUltimateRecords', 'Passer devant tout le monde avec du dentifrice sur le menton', -800, 'ok', true),
  (md5('wur-idea:'||'Dire « au revoir » à quelqu''un… et partir dans la même direction')::uuid, null, 'WorldUltimateRecords', 'Dire « au revoir » à quelqu''un… et partir dans la même direction', -800, 'ok', true),
  (md5('wur-idea:'||'Pousser une porte marquée « tirer »')::uuid, null, 'WorldUltimateRecords', 'Pousser une porte marquée « tirer »', -700, 'ok', true),
  (md5('wur-idea:'||'Faire le geste de « tchek » et que personne ne réponde')::uuid, null, 'WorldUltimateRecords', 'Faire le geste de « tchek » et que personne ne réponde', -700, 'ok', true),
  (md5('wur-idea:'||'Chanter avec ses écouteurs… sans se rendre compte que tout le monde entend')::uuid, null, 'WorldUltimateRecords', 'Chanter avec ses écouteurs… sans se rendre compte que tout le monde entend', -700, 'ok', true),
  (md5('wur-idea:'||'Se cogner dans une vitre bien propre')::uuid, null, 'WorldUltimateRecords', 'Se cogner dans une vitre bien propre', -700, 'ok', true),
  (md5('wur-idea:'||'Répondre « toi aussi » au serveur qui dit « bon appétit »')::uuid, null, 'WorldUltimateRecords', 'Répondre « toi aussi » au serveur qui dit « bon appétit »', -600, 'ok', true),
  (md5('wur-idea:'||'Taper son code de cantine trois fois de travers avec toute la file derrière')::uuid, null, 'WorldUltimateRecords', 'Taper son code de cantine trois fois de travers avec toute la file derrière', -600, 'ok', true),
  (md5('wur-idea:'||'Tirer la chaise de quelqu''un… et c''est toi qui tombes')::uuid, null, 'WorldUltimateRecords', 'Tirer la chaise de quelqu''un… et c''est toi qui tombes', -600, 'ok', true),
  (md5('wur-idea:'||'Avoir le hoquet pile pendant la minute de silence')::uuid, null, 'WorldUltimateRecords', 'Avoir le hoquet pile pendant la minute de silence', -600, 'ok', true),
  (md5('wur-idea:'||'Se faire surprendre en train de parler tout seul')::uuid, null, 'WorldUltimateRecords', 'Se faire surprendre en train de parler tout seul', -500, 'ok', true),
  (md5('wur-idea:'||'Faire tomber son plateau à la cantine')::uuid, null, 'WorldUltimateRecords', 'Faire tomber son plateau à la cantine', -500, 'ok', true),
  (md5('wur-idea:'||'Dire « regarde ça ! » et rater complètement le trick')::uuid, null, 'WorldUltimateRecords', 'Dire « regarde ça ! » et rater complètement le trick', -500, 'ok', true),
  (md5('wur-idea:'||'Applaudir à la fin d''un film au cinéma, tout seul')::uuid, null, 'WorldUltimateRecords', 'Applaudir à la fin d''un film au cinéma, tout seul', -500, 'ok', true),
  (md5('wur-idea:'||'Rire très fort à une blague que personne n''a comprise')::uuid, null, 'WorldUltimateRecords', 'Rire très fort à une blague que personne n''a comprise', -400, 'ok', true),
  (md5('wur-idea:'||'Fermer la porte sur son propre sac')::uuid, null, 'WorldUltimateRecords', 'Fermer la porte sur son propre sac', -400, 'ok', true),
  (md5('wur-idea:'||'Trébucher et faire semblant de courir pour cacher la chute')::uuid, null, 'WorldUltimateRecords', 'Trébucher et faire semblant de courir pour cacher la chute', -400, 'ok', true),
  (md5('wur-idea:'||'Laisser son micro allumé en visio')::uuid, null, 'WorldUltimateRecords', 'Laisser son micro allumé en visio', -400, 'ok', true),
  (md5('wur-idea:'||'Envoyer un message à la mauvaise personne')::uuid, null, 'WorldUltimateRecords', 'Envoyer un message à la mauvaise personne', -300, 'ok', true),
  (md5('wur-idea:'||'Mettre son pull à l''envers toute la journée')::uuid, null, 'WorldUltimateRecords', 'Mettre son pull à l''envers toute la journée', -300, 'ok', true),
  (md5('wur-idea:'||'Chercher ses lunettes… qu''on a sur la tête')::uuid, null, 'WorldUltimateRecords', 'Chercher ses lunettes… qu''on a sur la tête', -300, 'ok', true)
on conflict do nothing;

-- Signalements des vidéos d'aura (3 signalements = masquée)
create table if not exists public.aura_reports (
  id         bigint generated always as identity primary key,
  post_id    uuid not null references public.aura_posts(id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reason     text not null check (reason in ('choquant','triche','mineur','autre')),
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);
alter table public.aura_reports enable row level security;
drop policy if exists "aura reports: signaler" on public.aura_reports;
create policy "aura reports: signaler" on public.aura_reports
  for insert to authenticated with check (
    user_id = auth.uid()
    and (select count(*) from public.aura_reports r where r.user_id = auth.uid() and r.created_at > now() - interval '1 day') < 30
  );
drop policy if exists "aura reports: lecture admin ou auteur" on public.aura_reports;
create policy "aura reports: lecture admin ou auteur" on public.aura_reports
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "aura reports: suppression admin" on public.aura_reports;
create policy "aura reports: suppression admin" on public.aura_reports
  for delete to authenticated using (public.is_admin());
create or replace function public.aura_report_autohide() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.aura_reports where post_id = new.post_id) >= 3 then
    update public.aura_posts set hidden = true where id = new.post_id;
  end if;
  return new;
end $$;
drop trigger if exists aura_reports_autohide on public.aura_reports;
create trigger aura_reports_autohide after insert on public.aura_reports
  for each row execute function public.aura_report_autohide();

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
values ('videos', 'videos', true, 52428800, array['video/webm','video/mp4','video/quicktime'])
on conflict (id) do update set public = true, file_size_limit = 52428800, allowed_mime_types = array['video/webm','video/mp4','video/quicktime'];

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
  begin alter publication supabase_realtime add table public.aura_posts; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.aura_votes; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.aura_ideas; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.aura_idea_votes; exception when duplicate_object then null; end;
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
