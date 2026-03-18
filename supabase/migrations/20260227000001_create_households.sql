-- households
-- Created first: profiles and survey_responses both FK into this table.

create table public.households (
  id          uuid        primary key default gen_random_uuid(),
  invite_code text        not null unique
                            check (char_length(invite_code) = 6 and invite_code = upper(invite_code)),
  created_at  timestamptz not null default now()
);

alter table public.households enable row level security;
