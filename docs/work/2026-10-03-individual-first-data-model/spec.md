# Spec: Individual-first data model

From: intent.md (2026-10-03). Status: accepted.

## Requirements

**People and privacy**
1. A signed-in person can create, read and change their own records in every table below, with no partner and no household.
2. A person who is not signed in can read nothing. A signed-in person can read nothing that belongs to someone they are not actively linked to.
3. A linked partner can read a record only if its owner is sharing that category. A partner can never create, change or delete another person's records.
4. Chat transcripts are always private to their owner. Only confirmed entries can be shared.

**Partner link**
5. A person can create one invite. The invite is a single-use code that expires after 14 days. A person can be in at most one pending or active partnership at a time.
6. A second signed-in person can accept the invite with the code. Accepting creates the link and creates sharing settings for both people with every category shared.
7. Either partner can change any of their own sharing categories at any time. The change applies to the partner's very next request.
8. Either partner can unlink on their own, after confirming a warning that says what will happen. On unlink:
   - the partnership is marked ended, with who ended it and when;
   - everything each person shared is immediately hidden from the other;
   - couple-level records (shared goals, money dates) are archived, not deleted. Whoever created each record keeps it in their archive; the other partner loses access.

**Captured data**
9. A money history entry, goal or Money Move exists only after its owner confirms it. Each one records which conversation it came from.
10. Check-in answers and scores are append-only. Each row has a timestamp, and nothing overwrites a previous measurement. The first (baseline) measurement is always retrievable.
11. A goal or Money Move can be personal or shared with the couple. A shared one is visible to both partners while the link is active, whatever the sharing settings say, because both adopted it.

**Engineering**
12. The whole schema, every access rule (RLS policy) and every database function is in `supabase/migrations/`. A fresh Supabase project reaches a working state by applying the migrations, with no manual steps in the dashboard.
13. `lib/types/database.ts` is generated from the schema and committed. Queries use these types instead of hand-written row shapes.
14. Automated tests prove requirements 2, 3, 4, 7 and 8 against a real Postgres database with at least three test users (owner, partner, stranger). They run with one command.
15. Development happens against a local Supabase running in Docker, not a hosted project. Production keeps the current schema and the current app until the new app is ready to replace it.

## User experience

This spec builds no screens. It defines the states the screens will need:

| State | What the data model provides |
|---|---|
| Solo, no partner | Everything works. Couple features have nothing to show. |
| Invite sent, not yet accepted | A pending partnership with a code and an expiry date. The inviter can cancel it. |
| Linked | Both see each other's shared categories and all couple-level records. |
| A category turned off | The partner's queries return no rows for that category. The partner is not told what is hidden, only that the category isn't shared. |
| Unlinked | Each person keeps all their own records. Archived couple records stay in their creator's archive. |
| Expired or used invite code | Accepting fails with a clear reason: expired, already used, or not found. |

Mockups: [Stryvv Core Screens](https://claude.ai/artifact/59SH5WnEdcQxGio7RjQ7ME).

## Data and API changes

**Schema change: this replaces every existing table.** The old tables (`profiles`, `households`, `survey_responses`, `money_histories`, `snapshots`, `chat_messages`) are not migrated.

### Tables

| Table | Purpose | Key columns |
|---|---|---|
| `profiles` | One row per person, created by a trigger when the auth user is created | `id` (= `auth.users.id`), `first_name`, `last_name`, `phone`, `onboarding_stage`, `terms_version`, `terms_accepted_at` |
| `partnerships` | The link between two people | `inviter_id`, `invitee_id` (null until accepted), `status` (`pending` / `active` / `ended`), `invite_code`, `invite_expires_at`, `ended_by`, `ended_at` |
| `sharing_settings` | What each person shares | `partnership_id`, `owner_id`, `category`, `shared` (default true). One row per person per category |
| `conversations` | A chat session | `owner_id`, `kind` (`onboarding` / `coach` / `check_in`), `topic` |
| `messages` | Chat turns | `conversation_id`, `owner_id`, `role`, `content` |
| `money_history_entries` | Confirmed themes, beliefs, memories, wins | `owner_id`, `kind`, `title`, `description`, `attributes` (jsonb), `source_conversation_id`, `confirmed_at` |
| `goals` | Rich-life goals | `owner_id`, `partnership_id` (set when shared), `title`, `why`, `target_amount`, `target_date`, `current_amount`, `status` (`active` / `reached`), `archived_at` |
| `money_moves` | Behaviors being worked on | `owner_id`, `partnership_id` (set when shared), `goal_id`, `title`, `why`, `times_per_week`, `status` |
| `money_move_logs` | Weekly counts for a Money Move | `money_move_id`, `owner_id`, `week_start`, `done_count` |
| `check_ins` | One completed check-in | `owner_id`, `kind` (`baseline` / `weekly` / `monthly` / `quarterly`), `completed_at` |
| `measurements` | One answer or score | `owner_id`, `check_in_id`, `metric` (e.g. `cfpb_score`, `stress`), `value`, `recorded_at` |
| `money_dates` | A couple's logged money conversation | `partnership_id`, `logged_by`, `held_at`, `notes`, `archived_at` |

Sharing categories (a Postgres enum): `money_history`, `goals`, `money_moves`, `scores`, `money_data`, `documents`. The last two have no tables yet. They're in the enum now so the sharing settings don't need a migration when those features arrive.

All person-owned rows use `on delete cascade` from `auth.users`, so deleting an account removes everything that belongs to it.

### Database functions

| Function | What it does |
|---|---|
| `partner_sharing(category)` | The caller's active partner's id, if that partner shares the category; otherwise null. Every read policy compares `owner_id` with it, once per query. |
| `can_view(owner uuid, category)` | The same rule for one record: true if `owner` is the caller, or the caller's active partner who shares that category. For app code. |
| `accept_terms(version)` | Records the caller's acceptance of the terms with the server's time. The only way those columns are written. |
| `create_invite()` | Creates a pending partnership for the caller with a random 10-character code. Fails if the caller already has a pending or active partnership. |
| `preview_invite(code)` | Returns only the inviter's first name and whether the code is still valid. Callable before accepting. |
| `accept_invite(code)` | Links the caller as invitee, sets status to `active`, and creates the sharing settings for both people. One transaction. |
| `end_partnership()` | Marks the caller's partnership ended and archives couple-level records. One transaction. |

`partnerships` rows are never read by invite code through a table query; the code is only checked inside these functions.

### Access rules (RLS), enabled on every table in the same migration that creates it

| Table | Read | Write |
|---|---|---|
| `profiles` | Yourself. Your active partner sees your first name only (through a view). | Yourself |
| `partnerships` | The two members | Only through the functions above |
| `sharing_settings` | Both members | The owner of the row, `shared` column only |
| `conversations`, `messages` | Owner only | Owner only |
| `money_history_entries` | `can_view(owner_id, 'money_history')` | Owner only |
| `goals` | `can_view(owner_id, 'goals')`, or a member of its active `partnership_id` | Owner; for shared goals, either member |
| `money_moves`, `money_move_logs` | `can_view(owner_id, 'money_moves')`, or a member of its active `partnership_id` | Owner; logs are always written by their own owner |
| `check_ins`, `measurements` | `can_view(owner_id, 'scores')` | Owner; insert only, no update or delete |
| `money_dates` | Members of the partnership while active; after it ends, `logged_by` only | Members while active |

### App code
- New `supabase/` folder: `config.toml`, `migrations/`, and `tests/` for the access-rule tests.
- New `lib/types/database.ts` (generated) and an `npm run db:types` script.
- New `npm run test:db` script for the access-rule tests.
- README: how to run the local database, apply migrations and run the tests.
- The existing pages, `lib/actions/*` and `app/api/*` are **not changed** here. They keep working against production's current schema until each is replaced by its own intent.

## Security and privacy

- **The database enforces every rule.** The app uses the session client (`lib/supabase/server.ts`), so RLS applies to every query. Nothing in this spec needs the service-role client. The functions above run with definer rights and check `auth.uid()` themselves.
- **Sharing is checked on every query,** inside `can_view`. Nothing is copied to the partner, so turning a category off or unlinking takes effect on the next request.
- **The coach sees what the person can see.** Any code that builds AI context must read through the session client, so the same rules filter partner data before it reaches OpenAI. Never send `phone`, last name or email to OpenAI.
- **Invite codes are bearer tokens.** They're 10 random characters from an unambiguous alphabet, single-use, and expire in 14 days. `preview_invite` and `accept_invite` are the only way to look one up, and they need rate limiting at the route that calls them.
- **Phone numbers are new PII.** They live only in `profiles`, are readable only by their owner, and must not appear in logs.
- **Logs:** IDs and error codes only, as today.

## Changes after code review (2026-10-03)

The review of the first implementation led to these changes, all covered by tests:

- Accepting an invite locks both people in a fixed order, and a database trigger refuses a second active partnership for anyone. This closes a race that could link one person to two partners.
- Deleting an account ends the partnership instead of deleting it, so the other person keeps the couple records they created.
- Archiving is a timestamp (`archived_at`) on goals and Money Moves, so a reached goal stays reached after unlinking.
- Check-in and measurement timestamps always come from the server, and each person has exactly one baseline.
- Terms acceptance is written only by `accept_terms()`.
- A used, expired or withdrawn invite code no longer reveals the inviter's first name.
- A Money Move log's count can change, but the log can't be moved to another Money Move.
- Read policies call the sharing rule once per query instead of once per row.
- The test helpers grant nothing to app roles and are removed at the end of each run.

## Concerns flagged

- **Dropping production tables is irreversible.** The data is test accounts only, per the intent. → Don't touch production in this work. At cutover, export a backup first, then apply the migrations to production. Cutover gets its own intent.
- **The current app breaks if production's schema changes early.** → Requirement 15: build against the local database only; production keeps the old schema until the new app replaces the old one.
- **No delete for chat history, but privacy laws give people a right to deletion.** CCPA and GDPR both apply once real users sign up. → Keep "no delete button" for now, but make sure full account deletion works on request: the cascade above makes it one operation. Say so in the privacy policy.
- **Research consent in the terms only.** Terms-only consent may not be enough for sensitive data under GDPR if Stryvv is ever offered in Europe. → Fine for a US launch. Record `terms_version` and `terms_accepted_at` on the profile so we can show who agreed to what. Have a lawyer review the terms before launch.
- **Unilateral unlinking.** Either partner can unlink without the other's agreement. This matters for safety: money is a common means of control in abusive relationships, so nobody should need a partner's permission to stop sharing. → Keep it unilateral and immediate. The other partner sees that the link has ended, with no reason given.
- **Who keeps archived couple records?** A shared goal has an owner (whoever created it); a money date has whoever logged it. → Decided 2026-10-03: the creator keeps the archived record, and the other partner loses access.
- **Access-rule tests need a real Postgres.** That means the Supabase CLI and Docker locally. → Add `npm run test:db` for local runs now; add it to CI as a follow-up, so this work isn't blocked on CI setup.
- **The `data-security` skill and `CLAUDE.md` describe households.** They'll be wrong once this lands. → Update both in the same PR as the first migration.
- **`money_data` and `documents` categories have no tables yet.** → Deliberate. They're reserved in the enum so sharing settings are complete from day one.

## Answers to intent's open questions

- Dev or staging Supabase project? → No hosted dev project: it costs $25 a month plus compute. Use the local Supabase in Docker (decided 2026-10-03). Add hosted staging when there's something to share.
- Repoint the Supabase connector? → Not needed for local work. Carried forward to the production cutover.
- What happens on unlink? → Warning and confirmation, then archive; the creator keeps each archived couple record (requirement 8).
- Delete chat history? → Not for now. Account deletion on request still works (flagged above).
- Research consent? → In the terms of service; acceptance is recorded on the profile.
