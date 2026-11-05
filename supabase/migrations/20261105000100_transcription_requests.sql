-- Voice input (docs/work/2026-11-04-voice-input/).
-- One row per transcription request, so per-person limits can be counted across serverless
-- instances. It holds no audio and no text: only the size of the recording and when it was sent.

create table public.transcription_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  bytes integer not null check (bytes between 1 and 4194304),
  created_at timestamptz not null default now()
);

create index transcription_requests_owner_idx on public.transcription_requests (owner_id, created_at desc);

alter table public.transcription_requests enable row level security;

-- Append-only, and the server decides who and when: rows can't be backdated, assigned to someone
-- else, edited or deleted, so the limits can't be dodged.
revoke all on table public.transcription_requests from anon;
revoke insert, update, delete on table public.transcription_requests from authenticated;
grant insert (bytes) on table public.transcription_requests to authenticated;

-- Owner-only. Never shared with a partner.
create policy "transcription_requests: owner reads"
  on public.transcription_requests for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "transcription_requests: owner records"
  on public.transcription_requests for insert to authenticated
  with check (owner_id = (select auth.uid()));
