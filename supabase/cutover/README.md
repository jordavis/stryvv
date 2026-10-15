# Production cutover runbook (one-off)

Moves the production Supabase project (`osxoklzwfotyacqbhcwb`) from the legacy household schema to the individual-first schema in `supabase/migrations/`. Background and decisions: `docs/work/2026-10-03-early-cutover/`.

**Jordan runs steps 3 to 6.** The repo's guard hook blocks Claude from pushing migrations or repairing migration history, and Claude doesn't run destructive SQL on production.

| File | What it is |
|---|---|
| `drop-legacy.sql` | The one-off script for step 4. Never move it into `migrations/`. |
| `legacy-fixture.sql` | Local testing only: a stand-in legacy schema to test `drop-legacy.sql` against. |

## 1. Merge the app PR

Vercel deploys the reduced site: the landing page plus `/coming-soon`. From this point nothing live reads the legacy tables.

## 2. Check the live site

- `/` loads, and its buttons go to `/coming-soon`.
- `/survey`, `/dashboard` and `/login` redirect to `/coming-soon`.

## 3. Back up production

```bash
npx supabase login
npx supabase link --project-ref osxoklzwfotyacqbhcwb
npx supabase db dump --linked -f ~/stryvv-legacy-backup.sql
npx supabase db dump --linked --data-only -f ~/stryvv-legacy-data.sql
```

`link` asks for the database password (Supabase dashboard → Project Settings → Database). The dump files contain test users' email addresses: keep them on your machine, never in the repo.

## 4. Drop the legacy schema

Open the Supabase dashboard → SQL Editor, paste the whole of `drop-legacy.sql`, and run it.

- It runs in one transaction: it removes everything listed or nothing.
- It stops with "Not the legacy schema…" if it's run against anything but the legacy database, and with "The new schema is already present…" if step 6 already happened.
- Success: "Success. No rows returned."

## 5. Clear the legacy migration history

Production's migration history lists 10 legacy versions that aren't in the repo. Mark them reverted so the push in step 6 doesn't refuse to run:

```bash
npx supabase migration repair --status reverted 20260221202909 20260221202919 20260221202930 20260228005042 20260228005402 20260228005655 20260228010140 20260310040520 20260310040910 20260310041425
```

## 6. Apply the new schema

```bash
npx supabase db push
```

It lists the six migrations it will apply (`20261003000100_profiles.sql` … `20261003000600_end_partnership.sql`). Check the list, then confirm.

## 7. Verify (Claude)

Tell Claude it's done. Claude checks read-only through the Supabase connector:
- 12 tables, with RLS enabled on each;
- none of the legacy tables, types or functions;
- zero rows in `auth.users`;
- no security-advisor warnings about RLS.

## If something goes wrong

- **Step 4 fails:** nothing changed (one transaction). Send Claude the error.
- **Step 6 fails partway:** each migration applies in its own transaction, and the ones that succeeded are recorded. Fix forward with a new migration; don't edit merged ones.
- **Need the old data back:** restore from the step 3 dump. Everything in it was test data.
