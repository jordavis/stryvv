-- Check-ins, measurements and money dates.
-- Measurements are a history: rows are only ever added, so "then vs. now" can always be shown
-- and the baseline is never overwritten.

create type public.check_in_kind as enum ('baseline', 'weekly', 'monthly', 'quarterly');

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind public.check_in_kind not null,
  source_conversation_id uuid references public.conversations (id) on delete set null,
  completed_at timestamptz not null default now()
);

create index check_ins_owner_idx on public.check_ins (owner_id, completed_at desc);

create table public.measurements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  check_in_id uuid not null references public.check_ins (id) on delete cascade,
  -- e.g. 'cfpb_score', 'cfpb_item_1', 'stress', 'satisfaction', 'self_efficacy', 'wedge_bond'.
  metric text not null check (metric ~ '^[a-z][a-z0-9_]{0,63}$'),
  value numeric not null,
  recorded_at timestamptz not null default now(),
  unique (check_in_id, metric)
);

create index measurements_owner_metric_idx on public.measurements (owner_id, metric, recorded_at);

alter table public.check_ins enable row level security;
alter table public.measurements enable row level security;

revoke all on table public.check_ins from anon;
revoke all on table public.measurements from anon;
-- Append-only for the person: no edits, no deletes. Rows go only when the account is deleted.
revoke update, delete on table public.check_ins from authenticated;
revoke update, delete on table public.measurements from authenticated;

create policy "check_ins: owner or sharing partner reads"
  on public.check_ins for select to authenticated
  using (public.can_view(owner_id, 'scores'));

create policy "check_ins: owner creates"
  on public.check_ins for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "measurements: owner or sharing partner reads"
  on public.measurements for select to authenticated
  using (public.can_view(owner_id, 'scores'));

-- A measurement can only be added to the person's own check-in.
create policy "measurements: owner creates"
  on public.measurements for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.check_ins c
      where c.id = check_in_id and c.owner_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Money dates: a couple's logged money conversation. Belongs to the partnership.
-- ---------------------------------------------------------------------------

create table public.money_dates (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references public.partnerships (id) on delete cascade,
  logged_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  held_at timestamptz not null default now(),
  notes text check (notes is null or char_length(notes) <= 5000),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index money_dates_partnership_idx on public.money_dates (partnership_id, held_at desc);
create index money_dates_logged_by_idx on public.money_dates (logged_by);

create trigger money_dates_set_updated_at
  before update on public.money_dates
  for each row execute function public.set_updated_at();

alter table public.money_dates enable row level security;
revoke all on table public.money_dates from anon;
revoke delete on table public.money_dates from authenticated;

-- Both partners while the link is active. After it ends, only the person who logged it.
create policy "money_dates: active members, or the person who logged it"
  on public.money_dates for select to authenticated
  using (
    logged_by = (select auth.uid())
    or public.is_active_partnership_member(partnership_id)
  );

create policy "money_dates: active member logs"
  on public.money_dates for insert to authenticated
  with check (
    logged_by = (select auth.uid())
    and public.is_active_partnership_member(partnership_id)
  );

create policy "money_dates: the person who logged it updates"
  on public.money_dates for update to authenticated
  using (logged_by = (select auth.uid()))
  with check (logged_by = (select auth.uid()) and public.is_partnership_member(partnership_id));
