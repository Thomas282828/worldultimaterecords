-- =====================================================================
--  WorldUltimateRecords : pièces (monnaie virtuelle) et fin du Pass Néon
--  À coller en entier dans Supabase > SQL Editor > New query > Run.
--  Peut être relancé sans risque. (Aussi inclus dans supabase.sql, section 12.)
--
--  Règles :
--   - battre le record du site détenu par un autre joueur : +10 pièces
--   - battre son propre record personnel : +2 pièces
--   - 3 essais officiels gratuits par défi et par jour ; ensuite 1 essai = 5 pièces
--   - le Pass Néon est retiré : ses avantages (couleurs, ligues, défis exclusifs,
--     statistiques) deviennent gratuits pour tous, sauf les essais illimités.
-- =====================================================================

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
('n-zone','high'),('n-clock','high'),('n-sum10','high'),('n-chain','high')
on conflict (challenge) do nothing;

-- Le site indique le sens de victoire avec chaque tentative (utile pour les futurs défis) ;
-- seule la première valeur reçue pour un défi est gardée.
alter table public.attempts add column if not exists better text check (better is null or better in ('high','low'));

-- 12d) Gain de pièces quand une tentative valide bat un record
create or replace function public.attempt_award() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  dir text; own_best double precision; others_best double precision; gain int := 0; why text;
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
  end if;
  return new;
end $$;
drop trigger if exists attempts_award on public.attempts;
create trigger attempts_award after insert or update of status on public.attempts
  for each row execute function public.attempt_award();

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
  return json_build_object('ok', true, 'remaining', case when adm then -1 else greatest(0, 2 - cur) end,
                           'coins', bal, 'price', price, 'member', adm);
end $$;
revoke all on function public.start_attempt(text, boolean) from public;
grant execute on function public.start_attempt(text, boolean) to authenticated;

notify pgrst, 'reload schema';
