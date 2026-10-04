-- What the coach captures and the person confirms: money history, goals, Money Moves.
-- A row exists only once its owner has confirmed it on a review card.
-- A partner sees a category only while its owner shares it: read rules compare owner_id with
-- partner_sharing(category), evaluated once per query.
-- "Archived" is a timestamp (archived_at), separate from status, so archiving never erases
-- the fact that a goal was reached or a Money Move was paused.

create type public.money_history_kind as enum ('memory', 'belief', 'pattern', 'win');
create type public.goal_status as enum ('active', 'reached');
create type public.money_move_status as enum ('active', 'paused');

-- ---------------------------------------------------------------------------
-- Money history
-- ---------------------------------------------------------------------------

create table public.money_history_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind public.money_history_kind not null,
  title text not null check (char_length(title) between 1 and 200),
  description text check (description is null or char_length(description) <= 2000),
  -- Short facts shown as chips on the entry, e.g. ["From childhood", "Still feels true"].
  attributes jsonb not null default '[]'::jsonb check (jsonb_typeof(attributes) = 'array'),
  source_conversation_id uuid references public.conversations (id) on delete set null,
  confirmed_at timestamptz not null default now(),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index money_history_entries_owner_idx on public.money_history_entries (owner_id, confirmed_at desc);

create trigger money_history_entries_set_updated_at
  before update on public.money_history_entries
  for each row execute function public.set_updated_at();

alter table public.money_history_entries enable row level security;
revoke all on table public.money_history_entries from anon;

create policy "money_history_entries: owner or sharing partner reads"
  on public.money_history_entries for select to authenticated
  using (
    owner_id = (select auth.uid())
    or owner_id = (select public.partner_sharing('money_history'))
  );

create policy "money_history_entries: owner creates"
  on public.money_history_entries for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "money_history_entries: owner updates"
  on public.money_history_entries for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "money_history_entries: owner deletes"
  on public.money_history_entries for delete to authenticated
  using (owner_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Goals
-- A goal is personal (partnership_id is null) or shared with the couple.
-- A shared goal is visible to, and editable by, both partners while the link is active.
-- ---------------------------------------------------------------------------

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  partnership_id uuid references public.partnerships (id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  why text check (why is null or char_length(why) <= 2000),
  target_amount numeric(14, 2) check (target_amount is null or target_amount >= 0),
  current_amount numeric(14, 2) not null default 0,
  target_date date,
  status public.goal_status not null default 'active',
  archived_at timestamptz,
  source_conversation_id uuid references public.conversations (id) on delete set null,
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index goals_owner_idx on public.goals (owner_id, status);
create index goals_partnership_idx on public.goals (partnership_id) where partnership_id is not null;

create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();
create trigger goals_prevent_owner_change
  before update on public.goals
  for each row execute function public.prevent_owner_change();

alter table public.goals enable row level security;
revoke all on table public.goals from anon;

create policy "goals: owner, sharing partner, or shared-goal member reads"
  on public.goals for select to authenticated
  using (
    owner_id = (select auth.uid())
    or owner_id = (select public.partner_sharing('goals'))
    or partnership_id = (select public.active_partnership_id())
  );

create policy "goals: owner creates"
  on public.goals for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and (partnership_id is null or partnership_id = (select public.active_partnership_id()))
  );

create policy "goals: owner or shared-goal member updates"
  on public.goals for update to authenticated
  using (
    owner_id = (select auth.uid())
    or partnership_id = (select public.active_partnership_id())
  )
  with check (
    (owner_id = (select auth.uid()) and (partnership_id is null or public.is_partnership_member(partnership_id)))
    or partnership_id = (select public.active_partnership_id())
  );

create policy "goals: owner deletes"
  on public.goals for delete to authenticated
  using (owner_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Money Moves: the behaviors a person is working on, and their weekly counts.
-- ---------------------------------------------------------------------------

create table public.money_moves (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  partnership_id uuid references public.partnerships (id) on delete set null,
  goal_id uuid references public.goals (id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  why text check (why is null or char_length(why) <= 2000),
  times_per_week smallint not null default 1 check (times_per_week between 1 and 21),
  status public.money_move_status not null default 'active',
  archived_at timestamptz,
  source_conversation_id uuid references public.conversations (id) on delete set null,
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index money_moves_owner_idx on public.money_moves (owner_id, status);
create index money_moves_partnership_idx on public.money_moves (partnership_id) where partnership_id is not null;

create trigger money_moves_set_updated_at
  before update on public.money_moves
  for each row execute function public.set_updated_at();
create trigger money_moves_prevent_owner_change
  before update on public.money_moves
  for each row execute function public.prevent_owner_change();

alter table public.money_moves enable row level security;
revoke all on table public.money_moves from anon;

create policy "money_moves: owner, sharing partner, or shared-move member reads"
  on public.money_moves for select to authenticated
  using (
    owner_id = (select auth.uid())
    or owner_id = (select public.partner_sharing('money_moves'))
    or partnership_id = (select public.active_partnership_id())
  );

create policy "money_moves: owner creates"
  on public.money_moves for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and (partnership_id is null or partnership_id = (select public.active_partnership_id()))
  );

create policy "money_moves: owner or shared-move member updates"
  on public.money_moves for update to authenticated
  using (
    owner_id = (select auth.uid())
    or partnership_id = (select public.active_partnership_id())
  )
  with check (
    (owner_id = (select auth.uid()) and (partnership_id is null or public.is_partnership_member(partnership_id)))
    or partnership_id = (select public.active_partnership_id())
  );

create policy "money_moves: owner deletes"
  on public.money_moves for delete to authenticated
  using (owner_id = (select auth.uid()));

-- One row per person per Money Move per week. On a shared move, each partner logs their own count.
create table public.money_move_logs (
  id uuid primary key default gen_random_uuid(),
  money_move_id uuid not null references public.money_moves (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  week_start date not null,
  done_count smallint not null default 0 check (done_count between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (money_move_id, owner_id, week_start)
);

create index money_move_logs_owner_idx on public.money_move_logs (owner_id, week_start desc);

create trigger money_move_logs_set_updated_at
  before update on public.money_move_logs
  for each row execute function public.set_updated_at();

alter table public.money_move_logs enable row level security;
revoke all on table public.money_move_logs from anon;
-- Only the count can change. A log can't be moved to another Money Move, week or person.
revoke update on table public.money_move_logs from authenticated;
grant update (done_count) on table public.money_move_logs to authenticated;

-- Your own logs, always. Someone else's logs only while you may see their Money Moves
-- (they share the category) or the move is one you both adopted and the link is active.
-- After unlinking, a former partner's logs on your shared move are hidden from you too.
create policy "money_move_logs: own, sharing partner's, or shared-move member's"
  on public.money_move_logs for select to authenticated
  using (
    owner_id = (select auth.uid())
    or owner_id = (select public.partner_sharing('money_moves'))
    or exists (
      select 1 from public.money_moves m
      where m.id = money_move_id
        and m.partnership_id = (select public.active_partnership_id())
    )
  );

create policy "money_move_logs: person logs their own count"
  on public.money_move_logs for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.money_moves m
      where m.id = money_move_id
        and (
          m.owner_id = (select auth.uid())
          or m.partnership_id = (select public.active_partnership_id())
        )
    )
  );

create policy "money_move_logs: person updates their own count"
  on public.money_move_logs for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "money_move_logs: person deletes their own count"
  on public.money_move_logs for delete to authenticated
  using (owner_id = (select auth.uid()));
