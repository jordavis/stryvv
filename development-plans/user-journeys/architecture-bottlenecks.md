# Architecture Bottlenecks: Consolidated Review

**Date:** 2026-02-27
**Scope:** Auth & Identity, Survey State, Invite & Household Linking, Onboarding Pipeline

---

## Executive Summary

Stryvv's core user journey — from signup through survey completion to household connection — is built on a chain of fragile, unguarded state transitions where each step assumes the previous one succeeded without verifying it. The most dangerous structural problem is that ephemeral client-side state (localStorage) serves as the sole source of truth for critical decisions: invite code routing, survey answer persistence, and the creator-vs-joiner mode determination. This means any interruption to the browser session — private mode, device switch, cache clear, mid-flow reload — silently corrupts the entire onboarding outcome. Compounding this, the OnboardingClient runs its entire multi-step pipeline as a single unguarded effect with no idempotency protection, no partial failure handling, and no persistent record of what has already completed. Auth flows contain a verified gap where unconfirmed users can reach protected routes and trigger server actions against a profile that may not exist yet. The invite code mechanism, which is the only path for P2 to join P1's household, has no server-side persistence and can be silently lost at multiple points in the redirect chain. Across all four domains, failures are swallowed silently: empty catch blocks, fire-and-forget webhook calls, and generic error messages mean that when the pipeline breaks, neither the user nor the system knows which step failed or why. The cumulative effect is that the two most critical user journeys — P1 completing onboarding and P2 joining a household — both have multiple independent paths to silent, unrecoverable failure in routine conditions.

---

## Bottleneck Themes

---

### Theme 1: Client-Side State as System of Record

**Root Cause:** The application treats `localStorage` as the authoritative store for data that must survive multi-step, multi-session, multi-device flows. Survey answers, invite codes, onboarding progress, and the creator-vs-joiner intent determination all live exclusively in localStorage with no server-side equivalent until the very end of the pipeline. This is not a cache layer — it is the only source of truth for decisions with permanent consequences (household assignment, survey data written to DB).

**Raw Issues Encompassed:**
- Report 1 #4 — Invite code in localStorage only
- Report 2 #1 — Unhandled localStorage failures
- Report 2 #3 — Invite code entangled with survey state
- Report 2 #4 — State survives across user sessions on same browser
- Report 2 #5 — Cross-device resume architecturally impossible
- Report 3 #1 — Invite code not persisted through auth redirect
- Report 4 #3 — Mode detection (creator vs joiner) purely via localStorage

**User Journeys Affected:** J1, J2, J3, J5, J6, J9, J10, C3, C5

**Overall Severity: Critical**

The entire second-partner join flow depends on a single localStorage entry surviving an auth redirect loop. The invite code is set before signup, consumed after email verification and redirect, with no server-side copy. This is the highest-likelihood failure path for real users.

---

### Theme 2: Onboarding Pipeline Has No Transaction Semantics

**Root Cause:** The OnboardingClient executes a multi-step pipeline (save survey → determine mode → create/join household → fire webhook) inside a single `useEffect` with a shared try/catch. There is no persistent record of which steps have completed, no rollback of completed steps if a later step fails, and no idempotency check at the start to detect a pipeline already partially or fully run. The effect re-executes on every mount with no guard.

**Raw Issues Encompassed:**
- Report 4 #1 — Monolithic useEffect, no partial failure handling
- Report 4 #2 — Effect runs on every visit, no idempotency guard
- Report 4 #6 — Survey save upsert silently overwrites valid data
- Report 4 #10 — Double onboarding on browser refresh post-auth
- Report 2 #7 — Race between localStorage write and navigation
- Report 2 #8 — No validation on partial survey before DB write

**User Journeys Affected:** J1, J2, J5, J6, J8, B3, B4

**Overall Severity: Critical**

A returning user, a user who refreshes during onboarding, or a user who hits a transient network error and retries will re-execute the full pipeline. `joinHousehold()` is not idempotent — a second run can overwrite household assignment. The webhook can fire multiple times for the same household. Stale localStorage answers can overwrite completed DB answers.

---

### Theme 3: Auth Session Validity Does Not Guarantee Profile Existence

**Root Cause:** Supabase auth session establishment and profile row creation are two separate, non-atomic operations. A valid auth session is necessary but not sufficient to proceed through the app. Multiple paths exist where a user can hold a valid session with no corresponding profile: email verification skipped, auth callback DB insert failed, or concurrent verification link clicks. Downstream server actions assume profile existence without checking, producing silent failures or misleading errors.

**Raw Issues Encompassed:**
- Report 1 #1 — Profile creation timing gap in auth callback
- Report 1 #2 — No email verification enforcement in middleware
- Report 1 #3 — Race condition in auth callback profile check
- Report 1 #6 — Orphaned survey_responses if profile missing
- Report 4 #1 (partial) — Pipeline failure when profile is absent

**User Journeys Affected:** J1, J2, J3, J8

**Overall Severity: Critical**

Email verification is the most common real-world path. A user who clicks signup, opens a new tab, and navigates to `/onboarding` directly will find the route unprotected, have no profile, and receive silent failures from every server action they trigger. This is not an edge case.

---

### Theme 4: Invite Code Lifecycle Has No Server-Side Enforcement

**Root Cause:** The invite code flow relies entirely on client-side state for routing logic, and the only server-side check happens at the moment of `joinHousehold()` execution — after the user has already completed signup and the full survey. There is no validation earlier in the flow, no expiration or revocation mechanism, no protection against a P2 who navigates around the survey flow, and no guard against a user already in a household joining a second one.

**Raw Issues Encompassed:**
- Report 3 #1 — Invite code lost mid-auth-redirect
- Report 3 #2 — Invite code skippable, P2 becomes creator
- Report 3 #3 — No guard against household overwrite in joinHousehold
- Report 1 #5 — joinHousehold unconditionally overwrites household_id
- Report 3 #4 — No expiration or revocation on invite codes
- Report 3 #5 — P2 cannot validate invite code before committing
- Report 3 #6 — Household SELECT RLS blocks pre-join lookup

**User Journeys Affected:** J3, J4, J5, J6, J9, J10, C3, C5, C6

**Overall Severity: Critical**

The invite code is the only mechanism coupling P2 to P1's household. If it is lost before being consumed, P2 creates a new household and the couple is permanently split across two households. If `joinHousehold()` lacks a guard, a user can be silently moved from one household to another. Both failure modes are structurally easy to trigger.

---

### Theme 5: Webhook Delivery Is Fire-and-Forget With No Status Contract

**Root Cause:** The survey analysis webhook is called with `.catch(console.error)` — not awaited, not retried, not recorded. There is no persistent field in the database tracking whether the webhook has been successfully delivered for a given household. The only recovery affordance is a "Resend Analysis" button on the ConnectedPanel, which is not discoverable to the creator (P1) and is not available at all if the webhook fires but returns an error the user never sees.

**Raw Issues Encompassed:**
- Report 4 #4 — Webhook fire-and-forget, no retry or status tracking
- Report 4 #7 — Webhook validation at fire time, not onboarding time
- Report 3 #8 — P1 can create household without survey response (webhook fails when P2 joins)
- Report 4 #9 — InvitePanel has no resend or check-partner button

**User Journeys Affected:** J1, J2, J6, J8, B4

**Overall Severity: High**

The webhook is the terminal step of the entire onboarding pipeline and the product's core value delivery mechanism. A silent failure here means the couple completes onboarding, sees the ConnectedPanel, and receives nothing. There is no signal to the user, no alert to the system, and no guaranteed recovery path.

---

### Theme 6: Onboarding UI State Is Detached From Server State

**Root Cause:** The InvitePanel and ConnectedPanel are selected based on the onboarding mode determined locally at pipeline execution time, not by querying current server state. A user returning to `/onboarding` sees the panel corresponding to their original role, regardless of what has happened since. P1 returning after P2 has joined still sees InvitePanel with "waiting for partner." The UI has no mechanism to detect a state change that occurred outside the current session.

**Raw Issues Encompassed:**
- Report 4 #5 — Household completion state never checked
- Report 3 #7 — OnboardingClient doesn't detect completed household
- Report 4 #9 — InvitePanel has no resend or check-partner button (consequence of this)

**User Journeys Affected:** B3, B4

**Overall Severity: High**

For P1, the "waiting" screen is a dead end with no progress signal and no way to confirm the connection happened. This is the state P1 lives in during the most emotionally significant moment of the product experience — waiting to see if their partner joined. Getting stuck here permanently is a high-impact UX failure even though it does not corrupt data.

---

### Theme 7: Silent Failure as the Default Error Mode

**Root Cause:** Across all four domains, failures are either swallowed silently (empty catch blocks, `.catch(console.error)`), produce generic UI errors with no actionable detail, or produce no user-visible signal at all. There is no step-level logging in the onboarding pipeline, no telemetry on which DB operations fail, no warning to users entering private browsing mode about localStorage limitations, and no indication when the webhook does not fire. The system is designed to complete or fail invisibly.

**Raw Issues Encompassed:**
- Report 2 #1 — Unhandled localStorage failures (silent)
- Report 2 #9 — No localStorage availability warning at survey start
- Report 4 #4 — Webhook fire-and-forget with no status
- Report 4 #8 — No telemetry or logging for onboarding steps
- Report 1 #6 — Orphaned survey_responses fail silently
- Report 3 #5 — Invalid invite code only surfaced after full signup
- Report 1 #2 — Unverified user failures are silent

**User Journeys Affected:** J1, J2, J3, J5, J6, J8, J9, J10, all joiner journeys

**Overall Severity: High**

Silent failure is not a single bug — it is a systemic property of the codebase. It amplifies the impact of every other bottleneck because there is no observability layer to detect when they trigger. The combination of fragile state management and invisible error handling means that real user data loss and pipeline failures are currently undetectable without direct console access.

---

### Theme 8: Schema and Type Safety Boundary Violations

**Root Cause:** Data crossing the localStorage serialization boundary and the auth metadata boundary is neither validated nor guarded. `JSON.parse()` results are cast directly to typed interfaces. `user.user_metadata` is consumed without checking field presence. Survey answers are written to the DB with only a superficial completeness check (key count > 0). Type safety exists within individual modules but dissolves at the system's integration points.

**Raw Issues Encompassed:**
- Report 2 #2 — No schema validation on localStorage deserialization
- Report 1 #1 — user_metadata trusted without validation
- Report 2 #8 — No validation on partial survey before DB write
- Report 4 #6 — Survey upsert can overwrite valid data with partial stale answers

**User Journeys Affected:** J1, J2, J4, J7, J8

**Overall Severity: High**

Schema drift between the localStorage state shape and the current TypeScript types is inevitable over time. When it occurs, it will produce runtime type errors in the survey wizard or silently corrupt answers written to the DB. The partial survey write problem is an immediate data quality concern that affects the analysis product's accuracy.

---

## Priority Matrix

| Rank | Theme | Severity | Journeys Affected (count) | Likelihood in Real Usage | Priority Score |
|------|-------|----------|--------------------------|--------------------------|----------------|
| 1 | **Theme 1: Client-Side State as System of Record** | Critical | 9 | Very High — any private browse, device switch, or cache clear triggers it | **1** |
| 2 | **Theme 4: Invite Code Lifecycle Has No Server-Side Enforcement** | Critical | 9 | Very High — every P2 onboarding flow traverses this gap | **2** |
| 3 | **Theme 3: Auth Session Does Not Guarantee Profile Existence** | Critical | 4 | High — email verification skip is a common user behavior | **3** |
| 4 | **Theme 2: Onboarding Pipeline Has No Transaction Semantics** | Critical | 8 | High — any retry, refresh, or transient error triggers re-execution | **4** |
| 5 | **Theme 7: Silent Failure as the Default Error Mode** | High | 10+ | Certain — every failure in other themes is amplified by this | **5** |
| 6 | **Theme 5: Webhook Delivery Is Fire-and-Forget** | High | 5 | Moderate — any transient failure in analysis service is unrecoverable | **6** |
| 7 | **Theme 6: UI State Detached From Server State** | High | 2 | High for P1 — hits every creator who returns to /onboarding | **7** |
| 8 | **Theme 8: Schema and Type Safety Boundary Violations** | High | 5 | Low-to-moderate now, increases with schema changes over time | **8** |

---

**Priority Score Notes:** Scores are ordinal. Themes 1 and 4 are ranked above Theme 3 (auth) not because auth is less severe, but because Themes 1 and 4 affect a broader set of journeys and are triggered by routine user behavior rather than edge-case flows. Theme 7 (silent failure) is ranked 5th because it does not independently break journeys but doubles the damage of every theme above it — its actual systemic importance is higher than its rank suggests.
