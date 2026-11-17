-- =====================================================================
--  WorldUltimateRecords : statistiques pour la page admin (admin.html)
--  À coller en entier dans Supabase > SQL Editor > New query > Run.
--  Peut être relancé sans risque. (Aussi inclus dans supabase.sql, section 11.)
-- =====================================================================

-- 11) Statistiques : journal anonyme des visites et des parties ----------------
create table if not exists public.events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('visit','tab','open','start','finish','save','share','limit')),
  challenge  text check (challenge is null or char_length(challenge) <= 60),
  value      double precision,
  practice   boolean not null default false,
  ref        text check (ref is null or char_length(ref) <= 100),
  lang       text check (lang is null or char_length(lang) <= 10),
  device     text check (device is null or device in ('mobile','tablet','desktop')),
  created_at timestamptz not null default now()
);
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
      'buyers', (select count(distinct user_id) from public.coin_log where reason = 'essai' and (created_at at time zone 'Europe/Paris')::date >= d0)
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
