# Intent: Individual-first data model

Author: Jordan Davis. Date: 2026-10-03. Status: accepted. Lane: careful.
Links: [product-vision.md](../../product-vision.md), [measurement-framework.md](../../measurement-framework.md). Supersedes [2026-10-01-db-schema-in-repo](../2026-10-01-db-schema-in-repo/intent.md).

## Problem
Today's data model assumes a couple. Every page requires a household, the survey is the only structured input, and the "snapshot" needs two people. The new product starts with one person and lets them add a partner whenever they want. It also needs data that has nowhere to live today:
- What the onboarding chat captures: money history themes and beliefs, dreams, goals.
- Money Moves (the behaviors a person is working on) and how often they keep them.
- Weekly and monthly check-ins, and the well-being, stress, confidence and couple scores from the measurement framework.
- What each partner has chosen to share with the other.
- Uploaded documents (tax returns, pay stubs), and later, data from connected accounts.

The schema also isn't in the repo, so changes have no review or history, and the database access rules that keep one person's money data private can't be reviewed. All current users are test accounts, so we can start fresh instead of migrating.

## Proposed outcome
- **A person can use all of Stryvv alone.** Their money history, goals, Money Moves, check-ins and scores belong to them, not to a household.
- **Partners link, and nothing merges.** Each partner keeps their own records. Couple features (shared goals, alignment scores, the couple's money dates) sit on top of the link.
- **Sharing is per category and per person.** When partners connect, each chooses what the other can see: money history, goals, Money Moves, scores, money data, documents. Everything is shared by default, and anyone can change their choices at any time. Unlinking stops all sharing immediately.
- **Everything the chat captures is a confirmed, structured entry, not just a transcript.** An entry exists only after the person confirms it on a review card. The conversation is kept separately, so the coach can refer back to it.
- **Measurements are stored as a history.** Every check-in answer and score is timestamped, so "then vs. now" can always be shown and the baseline is never overwritten.
- **The schema lives in the repo** as migrations, with generated TypeScript types and database access rules (RLS) that go through PR review. A fresh Supabase project can be set up from the repo alone.

We'll know it worked when:
- A solo user can complete onboarding and see their home screen with no partner.
- A second account can link as a partner and sees only what the first account shared.
- RLS tests prove that a person who isn't linked can read nothing.

## Affected users and systems
- **Users:** every user, solo or partnered.
- **Supabase:** the database is redesigned. The existing tables (`profiles`, `households`, `survey_responses`, `money_histories`, `snapshots`, `chat_messages`) are replaced.
- **App code:** every server action and route handler that queries the database (`lib/actions/`, `app/api/`), and `proxy.ts` route protection.
- **OpenAI:** the coach reads these records to personalize its answers, so what it can read must follow the same sharing rules.
- **Later:** document storage, MX and other account aggregators, payroll providers.

## Constraints
- **Privacy is the product.** This is financial and emotional data. The database must enforce every rule about who can see what (RLS), not just the app code. Avoid the service-role admin client except where nothing else works (see the `data-security` skill).
- **Sharing is decided on each request, never copied.** Data is never copied to the partner, so revoking access takes effect right away.
- **The coach sees no more than the person could see.** What we send to OpenAI respects the same sharing rules.
- **Store structured data alongside the raw conversation**, so we can show history, compute metrics, and later run aggregate research if users consent.
- **Keep it portable** for the eventual native app: no logic that only works in the web client.
- **No production data to keep.** It's fine to drop and recreate the database.

## Out of scope
- Building the screens (onboarding chat, home, check-ins). Those are their own intents, built on this.
- Integrations with MX, Plaid, payroll providers and budgeting tools. This design only leaves room for them.
- Learning module content and progress tracking. Leave a place for it; don't design it.
- Billing or subscriptions.
- More than two people in a relationship, and data history across a breakup beyond "unlinking stops sharing".

## Decisions on the open questions (2026-10-03)
- **Supabase projects:** create a separate dev project. Develop against dev; production is touched only at cutover.
- **Unlinking:** the person sees a warning that explains what will happen and must confirm. Couple-level records (shared goals, money dates) are archived, not deleted. Everything that was shared becomes hidden from the former partner.
- **Deleting chat history:** not offered for now, to keep things simple.
- **Research consent:** covered in the terms of service, not a separate question at signup.

## Open questions
- The Supabase connector may point at a different project. Repoint it at the new dev project once it exists.
