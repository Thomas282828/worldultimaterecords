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
      (status = 'auto' and (challenge = any(public.web_challenges()) or challenge ~ '^n-[a-z0-9]{2,30}$') and video_path is null)
      or
      (status = 'pending' and video_path like auth.uid()::text || '/%' and consent_at is not null
        and challenge <> all(public.web_challenges()) and challenge !~ '^n-')
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

-- 5d) Connexion par pseudo + mot de passe : anti-force brute ---------------
-- Lue et écrite uniquement par la fonction pseudo-account (clé service_role).
create table if not exists public.login_failures (
  id         bigint generated always as identity primary key,
  pseudo     text not null,
  created_at timestamptz not null default now()
);
create index if not exists login_failures_idx on public.login_failures (pseudo, created_at desc);
alter table public.login_failures enable row level security;
delete from public.login_failures where created_at < now() - interval '1 day';

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

-- 11) Statistiques : journal anonyme des visites et des parties ----------------
create table if not exists public.events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind       text not null,
  challenge  text check (challenge is null or char_length(challenge) <= 60),
  value      double precision,
  practice   boolean not null default false,
  ref        text check (ref is null or char_length(ref) <= 100),
  lang       text check (lang is null or char_length(lang) <= 10),
  device     text check (device is null or device in ('mobile','tablet','desktop')),
  created_at timestamptz not null default now()
);
alter table public.events drop constraint if exists events_kind_check;
alter table public.events add constraint events_kind_check
  check (kind in ('visit','tab','open','start','finish','save','share','limit','comment'));
create index if not exists events_created_idx on public.events (created_at desc);
create index if not exists events_user_idx on public.events (user_id, created_at desc);
alter table public.events enable row level security;

-- Chacun peut seulement AJOUTER ses propres événements. Personne ne peut les lire
-- directement : seule la fonction admin_stats (réservée à l'admin) les résume.
drop policy if exists "events: envoi" on public.events;
create policy "events: envoi" on public.events
  for insert to authenticated with check (user_id = auth.uid());

-- Anti-abus : au-delà de 400 événements par heure et par joueur, on ignore sans erreur.
create or replace function public.events_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.events where user_id = new.user_id and created_at > now() - interval '1 hour') >= 400 then
    return null;
  end if;
  new.created_at := now();
  return new;
end $$;
drop trigger if exists events_limit on public.events;
create trigger events_limit before insert on public.events for each row execute function public.events_limit();

-- Ménage : on garde 13 mois d'historique.
delete from public.events where created_at < now() - interval '13 months';

-- Toutes les statistiques de la page admin, en un seul appel.
create or replace function public.admin_stats(p_days int default 30) returns json
language plpgsql stable security definer set search_path = public, auth as $$
declare
  today date := public.paris_today();
  d0 date;
  w0 date;
  res json;
begin
  if not public.is_admin() then
    raise exception 'Réservé à l''administrateur.' using errcode = '42501';
  end if;
  p_days := greatest(1, least(coalesce(p_days, 30), 365));
  d0 := today - (p_days - 1);
  w0 := least(d0, today - 13);

  with
  admins as (select user_id from public.admins),
  base as (
    select e.user_id, e.kind, e.challenge, e.value, e.practice, e.ref, e.lang, e.device, e.created_at,
           (e.created_at at time zone 'Europe/Paris')::date as day
    from public.events e
    where e.user_id not in (select user_id from admins)
  ),
  firsts as (select user_id, min(day) as first_day from base group by user_id),
  udays  as (select distinct user_id, day from base),
  per    as (select * from base where day >= d0),
  pusers as (select distinct user_id from per),
  first_visit as (
    select distinct on (b.user_id) b.user_id, coalesce(nullif(b.ref, ''), 'direct') as ref, b.device, b.lang
    from base b where b.kind = 'visit' order by b.user_id, b.created_at
  ),
  series as (select generate_series(d0, today, interval '1 day')::date as day),
  du as (
    select u.* from public.daily_usage u
    where u.day >= d0 and u.user_id not in (select user_id from admins)
  ),
  att as (
    select a.*, (a.created_at at time zone 'Europe/Paris')::date as day
    from public.attempts a
    where a.user_id not in (select user_id from admins)
  ),
  gu as (
    select challenge, user_id, count(*) as n
    from per where kind = 'finish' and challenge is not null
    group by challenge, user_id
  ),
  multi as (select user_id from udays group by user_id having count(*) >= 2)
  select json_build_object(
    'generated_at', now(),
    'today', today,
    'days', p_days,
    'tracking_since', (select min(day) from base),
    'live_now', (select count(distinct user_id) from base where created_at > now() - interval '5 minutes'),

    'kpi', json_build_object(
      'today', (select json_build_object(
          'visitors', count(distinct user_id),
          'new', (select count(*) from firsts where first_day = today),
          'plays', count(*) filter (where kind = 'finish'),
          'players', count(distinct user_id) filter (where kind = 'finish'))
        from base where day = today),
      'yesterday', (select json_build_object(
          'visitors', count(distinct user_id),
          'new', (select count(*) from firsts where first_day = today - 1),
          'plays', count(*) filter (where kind = 'finish'),
          'players', count(distinct user_id) filter (where kind = 'finish'))
        from base where day = today - 1),
      'week', (select json_build_object(
          'visitors', count(distinct user_id),
          'new', (select count(*) from firsts where first_day > today - 7),
          'plays', count(*) filter (where kind = 'finish'),
          'players', count(distinct user_id) filter (where kind = 'finish'))
        from base where day > today - 7),
      'prev_week', (select json_build_object(
          'visitors', count(distinct user_id),
          'new', (select count(*) from firsts where first_day > today - 14 and first_day <= today - 7),
          'plays', count(*) filter (where kind = 'finish'),
          'players', count(distinct user_id) filter (where kind = 'finish'))
        from base where day > today - 14 and day <= today - 7),
      'period', (select json_build_object(
          'visitors', count(distinct user_id),
          'new', (select count(*) from firsts where first_day >= d0),
          'plays', count(*) filter (where kind = 'finish'),
          'players', count(distinct user_id) filter (where kind = 'finish'),
          'shares', count(*) filter (where kind = 'share'),
          'limits', count(*) filter (where kind = 'limit'))
        from per),
      'dau_mau', (select round(100.0 * avg(d.n) / nullif((select count(distinct user_id) from base where day > today - 30), 0), 1)
                  from (select s.day, (select count(distinct user_id) from base b where b.day = s.day) as n
                        from generate_series(today - 6, today, interval '1 day') s(day)) d),
      'days_per_user', (select round(avg(n), 2) from (select user_id, count(*) as n from udays where day >= d0 group by user_id) x),
      'plays_per_player_day', (select round(avg(n), 2) from (
          select user_id, day, count(*) as n from per where kind = 'finish' group by user_id, day) x)
    ),

    'totals', json_build_object(
      'visitors_all_time', (select count(*) from firsts),
      'accounts', (select count(*) from auth.users u where u.id not in (select user_id from admins)),
      'accounts_with_password', (select count(*) from auth.users u where coalesce(u.is_anonymous, false) = false
                                   and u.id not in (select user_id from admins)),
      'pseudos', (select count(*) from public.profiles p where p.user_id not in (select user_id from admins)),
      'attempts', (select count(*) from att),
      'aura_posts', (select count(*) from public.aura_posts),
      'leagues', (select count(*) from public.leagues),
      'custom_challenges', (select count(*) from public.challenges),
      'coins_earned', (select coalesce(sum(delta), 0) from public.coin_log where delta > 0 and user_id not in (select user_id from admins)),
      'coins_earned_period', (select coalesce(sum(delta), 0) from public.coin_log
                              where delta > 0 and (created_at at time zone 'Europe/Paris')::date >= d0
                                and user_id not in (select user_id from admins)),
      'site_records_beaten', (select count(*) from public.coin_log where reason = 'record_site' and (created_at at time zone 'Europe/Paris')::date >= d0),
      'personal_records_beaten', (select count(*) from public.coin_log where reason = 'record_perso' and (created_at at time zone 'Europe/Paris')::date >= d0),
      'attempts_bought', (select count(*) from public.coin_log where reason = 'essai' and (created_at at time zone 'Europe/Paris')::date >= d0),
      'buyers', (select count(distinct user_id) from public.coin_log where reason = 'essai' and (created_at at time zone 'Europe/Paris')::date >= d0),
      'creator_coins', (select coalesce(sum(delta), 0) from public.coin_log where reason = 'createur' and (created_at at time zone 'Europe/Paris')::date >= d0),
      'comments', (select count(*) from public.comments),
      'comments_period', (select count(*) from public.comments where (created_at at time zone 'Europe/Paris')::date >= d0),
      'commenters_period', (select count(distinct user_id) from public.comments where (created_at at time zone 'Europe/Paris')::date >= d0),
      'challenges_created_period', (select count(*) from public.challenges where (created_at at time zone 'Europe/Paris')::date >= d0)
    ),

    'daily', (select coalesce(json_agg(json_build_object(
        'day', s.day,
        'visitors', (select count(distinct user_id) from base b where b.day = s.day),
        'new', (select count(*) from firsts f where f.first_day = s.day),
        'plays', (select count(*) from base b where b.day = s.day and b.kind = 'finish'),
        'players', (select count(distinct user_id) from base b where b.day = s.day and b.kind = 'finish'),
        'starts', (select coalesce(sum(started), 0) from du u where u.day = s.day),
        'saves', (select count(*) from att a where a.day = s.day),
        'pseudos', (select count(*) from public.profiles p
                    where (p.created_at at time zone 'Europe/Paris')::date = s.day
                      and p.user_id not in (select user_id from admins))
      ) order by s.day), '[]'::json) from series s),

    'games', (select coalesce(json_agg(g order by g.plays desc, g.opens desc), '[]'::json) from (
        select b.challenge as id,
          count(*) filter (where b.kind = 'open' and b.day >= d0) as opens,
          count(*) filter (where b.kind = 'finish' and b.day >= d0) as plays,
          count(*) filter (where b.kind = 'finish' and b.day >= d0 and b.practice) as practice,
          count(distinct b.user_id) filter (where b.kind = 'finish' and b.day >= d0) as players,
          count(*) filter (where b.kind = 'save' and b.day >= d0) as saves,
          count(*) filter (where b.kind = 'limit' and b.day >= d0) as limits,
          count(*) filter (where b.kind = 'share' and b.day >= d0) as shares,
          count(*) filter (where b.kind = 'finish' and b.day > today - 7) as plays_7d,
          count(*) filter (where b.kind = 'finish' and b.day > today - 14 and b.day <= today - 7) as plays_prev_7d,
          (select count(*) from gu where gu.challenge = b.challenge and gu.n >= 2) as replayers
        from base b
        where b.challenge is not null and b.kind in ('open','finish','save','limit','share') and b.day >= w0
        group by b.challenge) g),

    'usage', (select coalesce(json_agg(x order by x.starts desc), '[]'::json) from (
        select challenge as id, sum(started) as starts, count(distinct user_id) as players
        from du group by challenge) x),

    'attempts_by_game', (select coalesce(json_agg(x order by x.n desc), '[]'::json) from (
        select challenge as id, count(*) as n, count(distinct user_id) as players
        from att where day >= d0 group by challenge) x),

    'tabs', (select coalesce(json_agg(x order by x.n desc), '[]'::json) from (
        select challenge as id, count(*) as n, count(distinct user_id) as users
        from per where kind = 'tab' and challenge is not null group by challenge) x),

    'funnel', json_build_object(
      'visitors', (select count(*) from pusers),
      'opened', (select count(distinct user_id) from per where kind = 'open'),
      'played', (select count(distinct user_id) from per where kind = 'finish'),
      'saved',  (select count(distinct user_id) from per where kind = 'save'),
      'pseudo', (select count(*) from pusers pu where exists (select 1 from public.profiles p where p.user_id = pu.user_id)),
      'returned', (select count(*) from pusers pu where pu.user_id in (select user_id from multi))
    ),

    'retention', (select coalesce(json_agg(r order by r.day desc), '[]'::json) from (
        select f.first_day as day, count(*) as size,
          case when f.first_day + 1 <= today then
            count(*) filter (where exists (select 1 from udays u where u.user_id = f.user_id and u.day = f.first_day + 1)) end as d1,
          case when f.first_day + 7 <= today then
            count(*) filter (where exists (select 1 from udays u where u.user_id = f.user_id and u.day between f.first_day + 1 and f.first_day + 7)) end as w1,
          case when f.first_day + 30 <= today then
            count(*) filter (where exists (select 1 from udays u where u.user_id = f.user_id and u.day between f.first_day + 8 and f.first_day + 30)) end as m1
        from firsts f where f.first_day >= d0
        group by f.first_day) r),

    'sources', (select coalesce(json_agg(x order by x.new_users desc), '[]'::json) from (
        select fv.ref as id, count(*) as new_users,
          count(*) filter (where exists (select 1 from base b where b.user_id = fv.user_id and b.kind = 'finish')) as played,
          count(*) filter (where fv.user_id in (select user_id from multi)) as returned
        from first_visit fv join firsts f on f.user_id = fv.user_id
        where f.first_day >= d0
        group by fv.ref order by count(*) desc limit 30) x),

    'devices', (select coalesce(json_agg(x order by x.n desc), '[]'::json) from (
        select coalesce(device, 'inconnu') as id, count(distinct user_id) as n
        from per where kind = 'visit' group by 1) x),

    'langs', (select coalesce(json_agg(x order by x.n desc), '[]'::json) from (
        select coalesce(split_part(lang, '-', 1), '?') as id, count(distinct user_id) as n
        from per where kind = 'visit' group by 1 order by 2 desc limit 15) x),

    'hours', (select coalesce(json_agg(x order by x.h), '[]'::json) from (
        select h, (select count(*) from per p where p.kind = 'finish'
                     and extract(hour from p.created_at at time zone 'Europe/Paris') = h) as n
        from generate_series(0, 23) h) x),

    'weekdays', (select coalesce(json_agg(x order by x.d), '[]'::json) from (
        select d, (select count(*) from per p where p.kind = 'finish'
                     and extract(isodow from p.created_at at time zone 'Europe/Paris') = d) as n
        from generate_series(1, 7) d) x),

    'top_players', (select coalesce(json_agg(x order by x.plays desc), '[]'::json) from (
        select p.user_id, coalesce(pr.pseudo, 'Anonyme') as pseudo,
          count(*) as plays,
          count(distinct p.challenge) as games,
          count(distinct p.day) as days,
          (select first_day from firsts f where f.user_id = p.user_id) as since
        from per p left join public.profiles pr on pr.user_id = p.user_id
        where p.kind = 'finish'
        group by p.user_id, pr.pseudo
        order by count(*) desc limit 20) x)
  ) into res;

  return res;
end $$;
revoke all on function public.admin_stats(int) from public;
grant execute on function public.admin_stats(int) to authenticated;

-- 12) Pièces (monnaie virtuelle) et fin du Pass Néon --------------------------
-- 12a) Fin du Pass Néon : plus personne n'a d'essais illimités, tout le reste est ouvert
create or replace function public.is_member(uid uuid default auth.uid()) returns boolean
language sql stable as $$ select true $$;

create or replace function public.vip_challenges() returns text[]
language sql immutable as $$ select array[]::text[] $$;

-- 12b) Porte-monnaie et historique des pièces
create table if not exists public.wallets (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  coins      int not null default 0 check (coins >= 0),
  earned     int not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.wallets enable row level security;
drop policy if exists "wallets: lecture de son porte-monnaie" on public.wallets;
create policy "wallets: lecture de son porte-monnaie" on public.wallets
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

create table if not exists public.coin_log (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  delta      int not null,
  reason     text not null check (reason in ('record_site','record_perso','essai')),
  challenge  text,
  attempt_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists coin_log_user_idx on public.coin_log (user_id, created_at desc);
alter table public.coin_log drop constraint if exists coin_log_reason_check;
alter table public.coin_log add constraint coin_log_reason_check check (reason in ('record_site','record_perso','essai','createur'));
alter table public.coin_log enable row level security;
drop policy if exists "coin_log: lecture de son historique" on public.coin_log;
create policy "coin_log: lecture de son historique" on public.coin_log
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- 12c) Sens de victoire de chaque défi (le plus haut ou le plus bas gagne)
create table if not exists public.challenge_dirs (
  challenge text primary key,
  better    text not null check (better in ('high','low'))
);
alter table public.challenge_dirs enable row level security;
drop policy if exists "challenge_dirs: lecture publique" on public.challenge_dirs;
create policy "challenge_dirs: lecture publique" on public.challenge_dirs for select using (true);
insert into public.challenge_dirs (challenge, better) values
('rubik','low'),('claps','high'),('snaps','high'),('squats','high'),('jacks','high'),('rope','high'),('plank','high'),('stack','low'),
('pyramid','low'),('socks','high'),('coins','high'),('balance','high'),('tshirts','low'),('laces','low'),('pingpong','high'),('clips','high'),
('bin','high'),('wallsit','high'),('dominos','high'),('backalpha','low'),('puzzle','low'),('cardhouse','low'),('bottleflip','high'),('onehand','low'),
('mental','high'),('stroop','high'),('alphabet','low'),('reaction','low'),('clicks','high'),('typing','low'),('memory','high'),('aim','low'),
('chrono','low'),('steady','low'),('alternate','high'),('tower','high'),('circle','high'),('digits','high'),('odd','high'),('seq25','low'),
('higher','high'),('shade','high'),('estimate','low'),('pitch','high'),('rhythm','high'),('stars','high'),('mole','high'),('runner','high'),
('tightrope','high'),('pairs','low'),('maze','low'),('truefalse','high'),('slide','low'),('duration','low'),('angle','low'),('faces','high'),
('steadyclick','high'),('n-juggle','high'),('n-guess','low'),('n-snake','high'),('n-flappy','high'),('n-breakout','high'),('n-dodge','high'),
('n-zone','high'),('n-clock','high'),('n-sum10','high'),('n-chain','high'),
('n-moto','high'),('n-slide','high'),('n-blocks','high'),('n-arena','high'),('n-drift','high')
on conflict (challenge) do nothing;

-- Le site indique le sens de victoire avec chaque tentative (utile pour les futurs défis) ;
-- seule la première valeur reçue pour un défi est gardée.
alter table public.attempts add column if not exists better text check (better is null or better in ('high','low'));

-- 12d) Gain de pièces quand une tentative valide bat un record
create or replace function public.attempt_award() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  dir text; own_best double precision; others_best double precision; gain int := 0; why text; creator uuid;
begin
  if new.hidden or new.status not in ('auto','ok') then return new; end if;
  if tg_op = 'UPDATE' and old.status in ('auto','ok') then return new; end if;

  select better into dir from public.challenge_dirs where challenge = new.challenge;
  if dir is null then
    dir := new.better;
    if dir is null then
      select case when mode = 'time' then 'low' else 'high' end into dir from public.challenges where id = new.challenge;
    end if;
    if dir is null then return new; end if;
    insert into public.challenge_dirs (challenge, better) values (new.challenge, dir) on conflict do nothing;
  end if;

  select case when dir = 'low' then min(value) else max(value) end into own_best
  from public.attempts
  where user_id = new.user_id and challenge = new.challenge and id <> new.id and status in ('auto','ok') and not hidden;

  select case when dir = 'low' then min(value) else max(value) end into others_best
  from public.attempts
  where user_id <> new.user_id and challenge = new.challenge and status in ('auto','ok') and not hidden;

  -- Anti-triche : un score navigateur « trop beau » (plus du double du record du site,
  -- ou moins de la moitié quand le plus bas gagne) part en vérification au lieu d'entrer
  -- directement au classement. L'admin le valide ou le refuse ; les pièces arrivent à la validation.
  if tg_op = 'INSERT' and new.status = 'auto' and (
       (dir = 'low' and new.value <= 0)
    -- limites humaines connues (au-delà : autoclicker ou faux score)
    or (new.challenge = 'clicks' and new.value > 200)      -- 20 clics/s pendant 10 s
    or (new.challenge = 'alternate' and new.value > 250)   -- 25 touches/s pendant 10 s
    or (new.challenge = 'reaction' and new.value < 100)    -- moins de 100 ms de moyenne
    or (new.challenge = 'alphabet' and new.value < 1)      -- 26 lettres en moins d'1 s
    or (others_best is not null and others_best > 0 and
        (case when dir = 'low' then new.value < others_best * 0.5
              else new.value > others_best * 2 and new.value - others_best >= 5 end))
  ) then
    update public.attempts set status = 'pending' where id = new.id;
    return new;
  end if;

  if others_best is not null
     and (case when dir = 'low' then new.value < others_best else new.value > others_best end)
     and (own_best is null or (case when dir = 'low' then own_best >= others_best else own_best <= others_best end)) then
    gain := 10; why := 'record_site';
  elsif own_best is not null
     and (case when dir = 'low' then new.value < own_best else new.value > own_best end) then
    gain := 2; why := 'record_perso';
  end if;

  if gain > 0 then
    insert into public.wallets (user_id, coins, earned) values (new.user_id, gain, gain)
    on conflict (user_id) do update set coins = public.wallets.coins + gain, earned = public.wallets.earned + gain, updated_at = now();
    insert into public.coin_log (user_id, delta, reason, challenge, attempt_id) values (new.user_id, gain, why, new.challenge, new.id);
    -- le créateur d'un record de la communauté gagne 1 pièce à chaque record battu sur son défi
    select user_id into creator from public.challenges where id = new.challenge;
    if creator is not null and creator <> new.user_id then
      insert into public.wallets (user_id, coins, earned) values (creator, 1, 1)
      on conflict (user_id) do update set coins = public.wallets.coins + 1, earned = public.wallets.earned + 1, updated_at = now();
      insert into public.coin_log (user_id, delta, reason, challenge, attempt_id) values (creator, 1, 'createur', new.challenge, new.id);
    end if;
  end if;
  return new;
end $$;
drop trigger if exists attempts_award on public.attempts;
create trigger attempts_award after insert or update of status on public.attempts
  for each row execute function public.attempt_award();

-- 12e-bis) Anti-triche : heure de début de chaque partie officielle
create table if not exists public.attempt_starts (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  challenge  text not null,
  started_at timestamptz not null default now(),
  used       boolean not null default false
);
create index if not exists attempt_starts_idx on public.attempt_starts (user_id, challenge, used, started_at desc);
alter table public.attempt_starts enable row level security;   -- aucune règle : seules les fonctions du serveur y accèdent
delete from public.attempt_starts where started_at < now() - interval '3 days';

-- Durée minimale réaliste d'une partie (en secondes) pour chaque jeu du navigateur
create or replace function public.web_min_seconds(p_challenge text, p_value double precision) returns double precision
language sql immutable as $$
  select greatest(
    case p_challenge
      when 'clicks' then 9 when 'alternate' then 9 when 'chrono' then 9.5
      when 'mental' then 28 when 'stroop' then 28 when 'odd' then 28 when 'mole' then 28
      when 'truefalse' then 28 when 'n-clock' then 28 when 'runner' then 18 when 'n-sum10' then 43 when 'n-drift' then 55
      else 2 end,
    -- jeux dont le score est un temps réel : la partie ne peut pas durer moins que ce temps
    case when p_challenge in ('alphabet','typing','steady','seq25','pairs','maze','slide','tightrope','n-dodge')
         then p_value * 0.9 else 0 end)
$$;

-- Un score navigateur n'est accepté que si la partie a duré assez longtemps
create or replace function public.attempt_check_time() returns trigger
language plpgsql security definer set search_path = public as $$
declare s_id bigint; s_at timestamptz; need double precision;
begin
  if new.status <> 'auto' then return new; end if;
  select id, started_at into s_id, s_at from public.attempt_starts
  where user_id = new.user_id and challenge = new.challenge and not used and started_at > now() - interval '2 days'
  order by started_at desc limit 1;
  if s_id is null then
    raise exception 'Score refusé : aucune partie en cours sur ce défi. Rejoue la partie.' using errcode = 'P0001';
  end if;
  need := public.web_min_seconds(new.challenge, new.value);
  if extract(epoch from now() - s_at) < need then
    raise exception 'Score refusé : la partie a été trop rapide. Joue la partie en entier.' using errcode = 'P0001';
  end if;
  update public.attempt_starts set used = true where id = s_id;
  return new;
end $$;
drop trigger if exists attempts_check_time on public.attempts;
create trigger attempts_check_time before insert on public.attempts
  for each row execute function public.attempt_check_time();

-- 12e) Démarrer un essai : 3 gratuits par défi et par jour, puis 5 pièces l'essai
drop function if exists public.start_attempt(text);
create or replace function public.start_attempt(p_challenge text, p_use_coins boolean default false) returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); adm boolean; cur int; bal int; price int := 5;
begin
  if u is null then raise exception 'non connecté'; end if;
  if p_challenge is null or char_length(p_challenge) not between 1 and 60 then raise exception 'défi invalide'; end if;
  adm := public.is_admin();
  select coins into bal from public.wallets where user_id = u;
  bal := coalesce(bal, 0);
  select started into cur from public.daily_usage where user_id = u and challenge = p_challenge and day = public.paris_today();
  cur := coalesce(cur, 0);
  if not adm and cur >= 3 then
    if not coalesce(p_use_coins, false) then
      return json_build_object('ok', false, 'reason', 'limit', 'remaining', 0, 'coins', bal, 'price', price);
    end if;
    update public.wallets set coins = coins - price, updated_at = now()
    where user_id = u and coins >= price returning coins into bal;
    if not found then
      select coins into bal from public.wallets where user_id = u;
      return json_build_object('ok', false, 'reason', 'coins', 'remaining', 0, 'coins', coalesce(bal, 0), 'price', price);
    end if;
    insert into public.coin_log (user_id, delta, reason, challenge) values (u, -price, 'essai', p_challenge);
  end if;
  insert into public.daily_usage (user_id, challenge, day, started) values (u, p_challenge, public.paris_today(), 1)
  on conflict (user_id, challenge, day) do update set started = public.daily_usage.started + 1;
  insert into public.attempt_starts (user_id, challenge) values (u, p_challenge);
  return json_build_object('ok', true, 'remaining', case when adm then -1 else greatest(0, 2 - cur) end,
                           'coins', bal, 'price', price, 'member', adm);
end $$;
revoke all on function public.start_attempt(text, boolean) from public;
grant execute on function public.start_attempt(text, boolean) to authenticated;

notify pgrst, 'reload schema';

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
  -- Pas de liens (arnaques, hameçonnage, pub)
  if new.body ~* '(https?://|www\.|[a-z0-9-]+\.(com|net|org|fr|io|xyz|ru|ly|gg|me|tk|link|click|top|shop|app|co)(/|\s|$))' then
    raise exception 'Les liens ne sont pas autorisés dans les commentaires.' using errcode = 'P0001';
  end if;
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

-- =====================================================================
--  10) UNE SEULE FOIS, après avoir créé ton compte admin (guide, étape 4) :
--      exécute ces deux lignes dans une nouvelle requête, avec ton e-mail.
-- =====================================================================
-- insert into public.admins (user_id)
-- select id from auth.users where email = 'ton-email@exemple.com' on conflict do nothing;
