# Intent: Cut production over to the new schema early

Author: Jordan Davis. Date: 2026-10-03. Status: accepted. Lane: careful.
Links: [product-vision.md](../../product-vision.md), [individual-first data model](../2026-10-03-individual-first-data-model/spec.md)

## Problem
The new individual-first schema is merged, but production still runs the old household schema and the old app (survey, onboarding, dashboard). Every new screen has to be built on the new schema, so until production is cut over:
- nothing new can ship to the live site;
- the repo carries two schemas and a set of pages that are going away;
- the old app keeps calling OpenAI and Resend for a product we're no longer building.

All current accounts are test accounts, so there's nothing to migrate.

## Proposed outcome
- **Production's database has the new schema and only the new schema.** The six old tables, their functions and types, and all 28 existing logins are removed. The migrations in the repo are what production runs.
- **The live site is the marketing page plus a "coming soon" page.** The landing page stays. Its buttons, and any old link (survey, login, signup, dashboard, invite links), lead to a short page that says Stryvv is being rebuilt and will be back soon.
- **The old app code is deleted from the repo**: survey, onboarding, dashboard, invite pages, the chat and money-history API routes, and the server actions behind them.
- **From here on there's one schema.** New features (signup with an email code first) build and ship straight onto it.

We'll know it worked when:
- production lists the 12 new tables with access rules on, and none of the old ones;
- the live site shows the landing page, and every old URL lands on "coming soon";
- nothing on the live site calls OpenAI or Resend.

## Affected users and systems
- **Users:** only test accounts exist. All are deleted (decided 2026-10-03).
- **Supabase production** (project `osxoklzwfotyacqbhcwb`): old tables dropped, new migrations applied, migration history reset.
- **App:** most of `app/`, `components/` and `lib/` is removed. The landing page, `components/ui/` and the Supabase clients stay.
- **Vercel:** the deploy after merge serves the reduced site.
- **OpenAI, Resend:** unused until the new coach and emails are built. Keys stay in place.

## Constraints
- **Irreversible.** Dropping tables and deleting logins can't be undone. Take a backup first, even though it's test data.
- **A person runs every production database step.** The guard hook blocks the agent from pushing migrations, and the agent must not run destructive SQL through the connector either.
- **Order matters.** The reduced site goes live before the old tables are dropped, so the live site never queries a table that's gone.
- **No secrets in the repo.** Project ref only.

## Out of scope
- The new signup, onboarding chat and home screen. Those are the next intents.
- A waitlist or email capture on the coming-soon page (decided: plain page).
- Rewriting the landing page copy for the new product.
- Removing unused npm packages (`ai`, `openai`, `resend` and so on). The new coach will need most of them again.

## Decisions (2026-10-03)
- Cut over early, accepting that the live site has no working app until the new one ships.
- The live site shows the landing page plus a coming-soon page.
- The connector's project (`osxoklzwfotyacqbhcwb`) is confirmed as production.
- Delete all existing accounts.

## Open questions
- None.
