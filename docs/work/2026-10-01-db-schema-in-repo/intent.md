# Intent: Database schema lives in the repo

Author: Jordan Davis. Date: 2026-10-01. Status: draft. Lane: careful.

## Problem
The Supabase schema (tables, columns, RLS policies) exists only in the hosted project. Nothing in git describes it, so:
- A fresh clone can't stand up a working database. On 2026-10-01, onboarding failed with `Could not find the table 'public.households'` while pointed at the wrong project.
- Schema changes have no review or history, and Claude has to guess column names from existing queries.
- RLS policies, the main control keeping one couple's financial data away from another, can't be reviewed.

## Proposed outcome
- `supabase/migrations/` holds a baseline migration that matches production exactly, generated with `supabase db pull`.
- Future schema changes are new migration files that go through PR review.
- Generated TypeScript types (`lib/types/database.ts`) replace hand-written row shapes.
- README explains how to point a new environment at a fresh project and apply migrations.

## Affected users and systems
Supabase project (prod), all server actions and route handlers that query tables, local dev setup.

## Constraints
- No changes to the production schema as part of this work. Capture it as it is.
- Don't commit secrets. Project ref only, no keys.

## Out of scope
Fixing any RLS gaps found. Log them as their own intents.

## Open questions
- Is there a separate staging/dev Supabase project, or only production?
- Should the Supabase MCP connector be repointed to the Stryvv project?
