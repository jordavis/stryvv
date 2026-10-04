-- Conversations and messages: the raw chat. Always private to their owner.
-- A partner can only ever see confirmed entries (later migrations), never a transcript.

create type public.conversation_kind as enum ('onboarding', 'coach', 'check_in');
create type public.message_role as enum ('user', 'assistant');

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind public.conversation_kind not null,
  topic text check (topic is null or char_length(topic) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index conversations_owner_idx on public.conversations (owner_id, created_at desc);

create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role public.message_role not null,
  content text not null check (char_length(content) between 1 and 20000),
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on public.messages (conversation_id, created_at);
create index messages_owner_idx on public.messages (owner_id);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

revoke all on table public.conversations from anon;
revoke all on table public.messages from anon;
-- Chat history can't be edited or deleted by the person for now (decided 2026-10-03).
revoke delete on table public.conversations from authenticated;
revoke update, delete on table public.messages from authenticated;

create policy "conversations: owner reads"
  on public.conversations for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "conversations: owner creates"
  on public.conversations for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "conversations: owner updates"
  on public.conversations for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "messages: owner reads"
  on public.messages for select to authenticated
  using (owner_id = (select auth.uid()));

-- A message can only be added to the person's own conversation.
create policy "messages: owner creates"
  on public.messages for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.owner_id = (select auth.uid())
    )
  );
