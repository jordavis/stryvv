# Action Plans: Architecture Bottleneck Remediation

Ordered by priority (highest first). See `architecture-bottlenecks.md` for the full bottleneck analysis and `partner-onboarding-journeys.md` for the user journey decision tree.

---

## Theme 1: Client-Side State as System of Record

**Problem summary:** `localStorage` is the sole source of truth for three pieces of data with permanent consequences — survey answers, invite code, and the creator-vs-joiner role determination. Any browser context where localStorage is unavailable or cleared (private/incognito mode, device switch, cache clear, expired tab) silently drops this data before it ever reaches the server. The invite code in particular must survive an email verification redirect loop and currently has no server-side copy to fall back on, making every P2 join flow a single point of failure across that redirect.

**Approach:** Persist the invite code server-side at the earliest possible moment — when P2 first hits `/invite/[code]`. Add a `pending_invite_code` column to the `profiles` table (nullable text). The invite code should be carried through the auth redirect as a URL parameter so that `/auth/callback` can write it to the newly created profile row. This removes the localStorage dependency for the single most fragile piece of state.

For survey answers, localStorage remains acceptable as a UX convenience layer, but `OnboardingClient` must stop treating a missing localStorage entry as equivalent to "no survey exists." Before writing survey answers to the DB, check whether a `survey_responses` row already exists with `is_complete = true` — if so, skip the upsert rather than overwriting valid data.

The creator-vs-joiner mode determination must move from "does `inviteCode` exist in localStorage?" to "does `pending_invite_code` exist on the server-side profile?" Mode detection becomes a server-side read, not a client-side guess.

**Key changes:**

- `supabase/migrations/` — New migration adding `pending_invite_code text` column to `profiles` (nullable)
- `app/invite/[code]/page.tsx` — Add a "Skip survey / I already have an account" path that carries the invite code through `/login?invite=CODE` and `/signup?invite=CODE`
- `app/signup/page.tsx` — Read `invite` search param and include it in `emailRedirectTo` as `/auth/callback?invite=CODE`
- `app/login/page.tsx` — After successful login, if `invite` param is present, redirect to `/onboarding?invite=CODE` instead of bare `/onboarding`
- `app/auth/callback/route.ts` — Read `invite` param from the callback URL. After creating/finding the profile, if `invite` is present, upsert the profile with `pending_invite_code = invite`
- `lib/actions/onboarding.ts` — Mode detection reads `pending_invite_code` from the current user's profile as authoritative source. localStorage invite code becomes fallback only. After consuming the code, clear `pending_invite_code` on the profile
- `components/onboarding/OnboardingClient.tsx` — Receive initial server state (profile with `pending_invite_code`) as props from the parent Server Component. Invite code source of truth: (1) profile's `pending_invite_code`, (2) localStorage as fallback

**Dependencies:** None — this is the root fix that Themes 2, 3, and 4 build on.

**Effort estimate:** M (1–2 days)

**Risk:** The auth callback performs a profile insert then immediately reads it. Adding a conditional update after insert risks a timing gap — use an upsert with `on conflict (id) do update set pending_invite_code = excluded.pending_invite_code` to handle atomically.

### Manual Test Steps

**Prerequisites:** Local Supabase running, dev server at localhost:3000, two fresh test users created via admin API with `email_confirm: true`. Use Inbucket at http://127.0.0.1:54324 for email verification.

**New functionality — invite code survives auth redirect:**
1. As P2, navigate to `/invite/TEST01` (a valid invite code in the DB). Click "Start my survey". Verify the URL becomes `/survey/1` with the invite stored in localStorage.
2. Complete all 6 survey steps. On `/survey/complete`, click "Create my account". Fill out the signup form and submit.
3. Open Inbucket, click the verification link for P2's email. Verify the callback redirects to `/onboarding`.
4. Query the DB via service role: `SELECT pending_invite_code FROM profiles WHERE id = <P2_user_id>`. Verify `pending_invite_code = 'TEST01'`.
5. Verify `/onboarding` shows ConnectedPanel (not InvitePanel), confirming P2 was detected as a joiner from server state.
6. Query the DB again: verify `profiles.household_id` is set for P2 and `pending_invite_code` is now NULL (cleared after use).

**New functionality — invite code survives localStorage loss:**
7. Repeat steps 1–2 for a new P2 user. Before clicking the verification email link, manually clear localStorage for localhost in DevTools.
8. Click the verification link from Inbucket. Verify the user still lands on `/onboarding` as a joiner (ConnectedPanel), not a creator. The `pending_invite_code` field on the profile carries the code instead of localStorage.

**New functionality — /login?invite=CODE carries the code:**
9. Navigate to `/invite/TEST01`. Use the "Sign in" or "Already have an account" link (must include `?invite=TEST01` in the URL). Log in with an existing account that has no household. Verify redirect goes to `/onboarding` and the user is shown as a joiner.

**New functionality — /signup?invite=CODE carries the code:**
10. Navigate to `/signup?invite=TEST01`. Complete signup. Verify the auth callback URL includes `invite=TEST01`. After email verification, confirm `pending_invite_code = 'TEST01'` is set on the new profile before onboarding runs.

**Regression — P1 happy path unaffected:**
11. Create a fresh P1 user. Navigate to `/survey/1` directly (no invite param). Complete all 6 steps. Sign up, verify email, land on `/onboarding`. Confirm InvitePanel is shown with a generated invite code. Confirm `pending_invite_code IS NULL` in the profile.

**Regression — existing localStorage flow still works as fallback:**
12. New P2 user navigates to `/survey?invite=TEST01`. Completes survey and signs up. Does NOT clear localStorage before clicking verification link. Verify onboarding still works correctly — localStorage invite code is used as fallback when `pending_invite_code` is null on the profile.

---

## Theme 4: Invite Code Lifecycle Has No Server-Side Enforcement

**Problem summary:** The invite code has no server-side lifecycle. It can be consumed by the wrong user (someone already in a household), bypassed entirely (P2 navigates to `/login` without clicking "Start my survey"), or lost mid-redirect. `joinHousehold()` has no guard against overwriting an existing `household_id`. There is also no UI for P2 to enter a code manually if they lose the link.

**Approach:** Add three targeted guards and one new UI element.

1. **Household-overwrite guard** in `joinHousehold()`: before updating `profiles`, check if `household_id` is already non-null. If it matches the target, return success (idempotent). If it points to a different household, throw a descriptive error rather than silently overwriting.
2. **Survey completeness gate** in `createHousehold()`: check that a `survey_responses` row exists with `is_complete = true` before creating a household. If not, throw an error directing the user back to the survey.
3. **Invite link capacity check**: extend the `/invite/[code]` page to count household members. If count is already 2, show "this invite has already been used" instead of the join flow.
4. **Manual code entry** on `InvitePanel`: a recovery path for P2 who lost the link.

**Key changes:**

- `lib/actions/onboarding.ts` (`joinHousehold`) — Pre-flight: if `profile.household_id` is non-null and differs from target, throw `"You are already in a household"`. If same household, return success without re-running the update
- `lib/actions/onboarding.ts` (`createHousehold`) — Pre-flight: query `survey_responses` for `user_id = auth.uid() AND is_complete = true`. If no row, throw `"Please complete the survey before creating your household"`
- `app/invite/[code]/page.tsx` — After fetching the household, count members. If count equals 2, render an "already used" page instead of the join CTA
- `components/onboarding/InvitePanel.tsx` — Add a collapsible "Enter partner's code manually" form with a text input and a "Join household" button
- `lib/actions/onboarding.ts` — Add `lookupInviteCode(code)` action returning `{ valid: boolean, partnerFirstName?: string }` for pre-confirmation display before committing to join

**Dependencies:** Theme 1 (server-side invite code persistence) closes the redirect-loss path and should be done first. The household guard in `joinHousehold` can be implemented independently in parallel.

**Effort estimate:** M (1–2 days)

**Risk:** The `createHousehold` survey completeness guard will block the A3 flow (P1 signs up first, then takes survey, returns to onboarding). Verify the A3 flow writes a complete `survey_responses` row before `createHousehold()` is called. The guard only blocks users who have no survey row at all — this is the intended behavior.

### Manual Test Steps

**Prerequisites:** Local Supabase running, dev server at localhost:3000, service role key available for direct DB queries.

**New functionality — household overwrite guard:**
1. Create two households (HH-A and HH-B) via service role. Create P1-A in HH-A and P2 in HH-B (both with `household_id` set in `profiles`). Sign in as P2 via auth API to get a JWT.
2. As P2 (already in HH-B), call `joinHousehold` with HH-A's invite code via the `/onboarding` page. Verify the server returns an error (not a silent success). Verify P2's `profiles.household_id` is still HH-B (not overwritten).
3. As P2 (already in HH-B), call `joinHousehold` with HH-B's own invite code (idempotent case). Verify it returns success and `household_id` remains HH-B.

**New functionality — survey completeness gate on `createHousehold`:**
4. Create a new user with no `survey_responses` row. Sign in and navigate to `/onboarding`. Verify the server action returns an error like "Please complete the survey before creating your household". Verify the UI either redirects to `/survey/1` or shows a clear error message — NOT a generic "Something went wrong".
5. Create a new user with a `survey_responses` row where `is_complete = false` (partial answers). Navigate to `/onboarding`. Verify household creation is blocked (same error as step 4).
6. Create a new user with a complete `survey_responses` row (`is_complete = true`). Navigate to `/onboarding`. Verify `createHousehold()` succeeds and InvitePanel is shown.

**New functionality — invite link capacity check:**
7. Create a household that already has 2 members (P1 and P2 both have `household_id` set). Navigate to `/invite/<that_household_invite_code>`. Verify the page shows an "already used" or "household is full" message — NOT the normal "Start my survey" join CTA.
8. Navigate to `/invite/<a_household_with_1_member>`. Verify the normal join CTA is shown.

**New functionality — manual code entry on InvitePanel:**
9. Sign in as a P1 user who has created a household. Navigate to `/onboarding` — InvitePanel should be shown. Verify a "Enter partner's code manually" input or collapsible section is present.
10. Enter an invalid code (e.g. "XXXXXX") in the manual entry form. Verify an error is shown: "Invalid invite code" or similar — not a redirect or silent failure.
11. Enter a valid invite code for a different household in the manual entry form. Verify the P1 user sees the inviting partner's first name before committing (pre-confirmation display from `lookupInviteCode` action).

**Regression — normal join still works:**
12. Run the full happy path (J1): P1 creates household, P2 visits invite link, completes survey, signs up, verifies email, lands on `/onboarding`. Verify P2 sees ConnectedPanel. Verify both `profiles` rows have the same `household_id` in DB.

**Regression — normal household creation still works:**
13. New user completes full survey, signs up, verifies email, lands on `/onboarding`. Verify `createHousehold()` succeeds and an invite code is shown. Verify `profiles.household_id` is set in DB.

---

## Theme 3: Auth Session Validity Does Not Guarantee Profile Existence

**Problem summary:** A valid Supabase auth session and a profile row are two separate non-atomic operations. If the profile insert in `/auth/callback` fails (DB error, concurrent duplicate click, network timeout), the user lands on `/onboarding` with a valid session but no profile. Every server action then fails silently — `createHousehold()` finds no profile to update, `saveSurveyResponse()` writes an orphaned row. The middleware only checks `user !== null`, not profile existence.

**Approach:** Add a profile existence check in the `/onboarding` Server Component (not in middleware — middleware runs on every request and the DB query latency would be unacceptable). If the profile row is missing, attempt re-creation using `user_metadata` and redirect back to `/onboarding`. This turns a silent failure into a self-healing retry.

Additionally, make the auth callback's profile insert error explicit rather than silently swallowed, and add explicit profile-not-found error messaging to `createHousehold()` and `joinHousehold()`.

**Key changes:**

- `app/onboarding/page.tsx` — After `supabase.auth.getUser()`, query `profiles` for `id = user.id`. If no row, attempt insert using `user.user_metadata`. If insert fails, redirect to `/login?error=profile_setup_failed`
- `app/auth/callback/route.ts` — Capture and log the profile insert error. If insert fails, redirect to `/auth/repair` or `/login?error=auth_setup_failed` instead of silently continuing
- `lib/actions/onboarding.ts` — Add explicit profile existence check after `getUser()`. If profile row is missing, throw `"Profile setup incomplete. Please sign out and sign back in"` rather than letting the DB query return null and error out later
- `supabase/migrations/` — Document (as a manual Supabase dashboard step) adding an `AFTER INSERT ON auth.users` trigger to auto-create a profile row — the most robust long-term fix, but requires service-role access outside standard migration scope

**Dependencies:** None — independently implementable.

**Effort estimate:** S (few hours for the onboarding guard and callback error handling; M if adding the DB trigger)

**Risk:** The profile re-creation attempt at `/onboarding` reads `user.user_metadata` for `first_name`/`last_name`. Guard with `meta?.first_name ?? ""` — same pattern as the existing callback code. For future OAuth/passwordless flows (not in current scope), metadata shape will differ.

### Manual Test Steps

**Prerequisites:** Local Supabase running, dev server at localhost:3000, service role key for direct DB manipulation.

**New functionality — /onboarding auto-repairs missing profile:**
1. Create a user via admin API (`email_confirm: true`, with `first_name` and `last_name` in `user_metadata`). Do NOT insert a row into `profiles`. Sign in via the login page using that user's credentials.
2. Navigate to `/onboarding`. Verify the page does NOT show a generic crash or 500 error.
3. Query `profiles` via service role: `SELECT * FROM profiles WHERE id = <user_id>`. Verify a profile row was auto-created with `first_name` and `last_name` from `user_metadata`.
4. Verify the onboarding pipeline continues normally — InvitePanel or ConnectedPanel is shown without further errors.

**New functionality — auth callback failure redirects explicitly:**
5. Sign up a new user normally. Before clicking the verification link, delete their profile row via service role (simulating a failed callback insert). Click the verification link.
6. Verify the browser is redirected to an error route (e.g. `/login?error=auth_setup_failed`) rather than silently landing on `/onboarding` with a broken state.

**New functionality — createHousehold and joinHousehold throw on missing profile:**
7. Sign in as a user whose profile row has been deleted from `profiles` (delete via service role after sign-in). Navigate to `/onboarding`. Verify a descriptive error message appears: "Profile setup incomplete. Please sign out and sign back in." — NOT a generic server error.

**Regression — normal signup and profile creation still works:**
8. Full signup flow: new user signs up via `/signup`, verifies email via Inbucket, lands on `/onboarding`. Query `profiles` via service role. Verify `first_name`, `last_name`, and `id` are correctly set. Verify `household_id IS NULL`.

**Regression — returning user login works:**
9. Sign in as an existing user who already has a complete profile and household. Verify `/onboarding` loads correctly showing the right panel — profile repair path is NOT triggered unnecessarily.

**Regression — concurrent verification link clicks:**
10. Using two separate curl requests sent simultaneously, hit the auth callback URL with the same `code` for one user. Verify only one profile row exists after both requests complete (no duplicate key error shown to user). Verify both requests result in a successful redirect to `/onboarding`.

---

## Theme 2: Onboarding Pipeline Has No Transaction Semantics

**Problem summary:** `OnboardingClient` executes a four-step pipeline in a single `useEffect` with one `try/catch` and no memory of what has already run. Every mount re-executes the full pipeline. A refresh after `createHousehold()` succeeds will call `createHousehold()` again — guarded by the existing idempotency check, but `saveSurveyResponse()` will upsert stale localStorage data over whatever was last saved. Mode determination can also diverge on re-run if localStorage was cleared between runs.

**Approach:** Move pipeline orchestration to the Server Component and use the database as the idempotency checkpoint. The `/onboarding` Server Component queries profile and `household_id` before rendering. If `household_id` is already set, the pipeline is complete — render the correct panel directly without running `OnboardingClient`'s effect. If `household_id` is null, render `OnboardingClient` to execute the create/join path.

Add a guard to `saveSurveyResponse`: before upserting, check whether `survey_responses` already has `is_complete = true`. If so, skip the upsert — do not overwrite completed DB data with potentially stale localStorage data.

**Key changes:**

- `app/onboarding/page.tsx` — Pre-fetch `{ profile.household_id, profile.pending_invite_code }`. If `household_id` is set, also fetch household member count. Pass `initialHouseholdId`, `initialPartnerJoined`, and `initialInviteCode` as props to `OnboardingClient` and render the correct panel directly
- `components/onboarding/OnboardingClient.tsx` — Accept server-derived props. The `useEffect` pipeline only runs when `initialHouseholdId` is null. After successful pipeline completion, write completion to React state (not localStorage) to prevent re-run on re-render. Move `localStorage.removeItem()` to `SurveyContext.reset()` — the correct owner of that cleanup
- `lib/actions/survey.ts` (`saveSurveyResponse`) — Add early-exit guard: query for existing `is_complete = true` row before the upsert. If found, return early. Makes the action idempotent with respect to completed data
- `lib/actions/onboarding.ts` — `joinHousehold` idempotency gap addressed by Theme 4's household-overwrite guard

**Dependencies:** Theme 3 (profile existence guarantee) should be resolved first. Theme 1's server-side invite code field enables server-side mode detection.

**Effort estimate:** M (1–2 days)

**Risk:** Moving pipeline state to the Server Component adds 2–3 DB queries per `/onboarding` render. Acceptable given this route is visited once per user session and all queries are indexed. Test the edge case where `household_id` is set but `pending_invite_code` was never cleared.

### Manual Test Steps

**Prerequisites:** Local Supabase running, dev server at localhost:3000, service role key for DB queries.

**New functionality — pipeline does not re-run when household already exists:**
1. Complete the full P1 onboarding flow so the user has a `household_id` set in `profiles`. Note the `invite_code` shown on InvitePanel.
2. Refresh `/onboarding`. Verify the page loads without re-running `saveSurveyResponse` (query `survey_responses` and check `updated_at` has NOT changed).
3. Verify no duplicate household was created (query `households` to confirm only one row for this user).
4. Verify `localStorage` is empty or stale but does not cause incorrect behavior on re-visit.

**New functionality — saveSurveyResponse is idempotent (won't overwrite complete data):**
5. Create a user with a complete `survey_responses` row (`is_complete = true`) via service role. Put different (partial) answers in localStorage under `stryvv_survey`.
6. Navigate to `/onboarding` as that user. After the page loads, query `survey_responses` via service role. Verify the DB row was NOT overwritten with the partial localStorage answers. Verify `is_complete` is still `true` and `updated_at` has NOT changed.

**New functionality — correct panel shown for P1 after P2 has joined (via server pre-fetch):**
7. Set up a complete household: P1 and P2 both have `household_id` set in `profiles` (both joined). Sign in as P1. Navigate to `/onboarding`. Verify ConnectedPanel (not InvitePanel) is shown — the server pre-fetch should detect 2 members and skip the "waiting for partner" state.

**New functionality — edge case: household_id set but pending_invite_code not cleared:**
8. Manually set a user's `pending_invite_code` to an old code via service role while `household_id` is already set. Navigate to `/onboarding` as that user. Verify the server ignores `pending_invite_code` when `household_id` is already present (does not attempt to join a second household). Verify `pending_invite_code` is cleared.

**Regression — first-time P1 onboarding still saves survey and creates household:**
9. New user with no `household_id` and complete survey answers in localStorage. Navigate to `/onboarding`. Verify `saveSurveyResponse` runs (check `survey_responses` row was created). Verify `createHousehold()` runs (check `households` row and `profiles.household_id` set). Verify InvitePanel is shown.

**Regression — first-time P2 join still works:**
10. New user with `pending_invite_code` set on their profile (via Theme 1 flow) and no `household_id`. Navigate to `/onboarding`. Verify `joinHousehold()` runs (check `profiles.household_id` set to correct household). Verify ConnectedPanel is shown.

**Regression — React strict mode double-invoke (dev only):**
11. In dev mode (where React intentionally double-invokes effects), navigate to `/onboarding` for the first time as a new user. Verify only ONE household is created and only ONE `survey_responses` row is upserted (no duplicates from double-run).

---

## Theme 7: Silent Failure as the Default Error Mode

**Problem summary:** Failures across all four domains are invisible to both users and the system. Empty catch blocks, fire-and-forget webhook calls, and generic "Something went wrong" messages mean that when the pipeline breaks, no one knows which step failed, why it failed, or whether it is recoverable. This amplifies the blast radius of every other bottleneck.

**Approach:** Two layers: user-visible errors and system-level logging — both applied incrementally alongside fixes for other themes.

For user-visible errors: each pipeline step should produce a specific, actionable error message. The `setError()` call in `OnboardingClient` should forward the thrown error's message directly. The `SurveyContext` hydration catch block should dispatch `RESET` on failure so the user gets a clean survey rather than a broken one.

For system-level logging: add structured `console.error("[scope:step]", { userId, error })` at every pipeline step. This is searchable in Vercel's log drain until a proper logging service is integrated.

For localStorage availability: detect on mount whether localStorage is writable and surface a banner warning in the survey UI when it is not.

**Key changes:**

- `components/onboarding/OnboardingClient.tsx` — Replace generic `setError("Something went wrong")` with `setError(err instanceof Error ? err.message : "Something went wrong")`. Add step-level console logging before each `await`: `[onboarding:save_survey]`, `[onboarding:create_household]`, `[onboarding:join_household]`
- `lib/context/survey-context.tsx` — Change hydration empty catch to `catch { dispatch({ type: "RESET" }) }`. Add a separate `useEffect` on mount that tests localStorage availability (attempt a `setItem` with a test key) and exposes a `storageAvailable` flag through context
- `app/survey/layout.tsx` or survey step pages — Consume `storageAvailable` and render a dismissible banner when storage is unavailable: "Your progress won't be saved if you close this tab. Complete the survey in one session."
- `lib/actions/survey.ts`, `lib/actions/onboarding.ts`, `lib/actions/survey-analysis.ts` — Standardize error logging to `console.error("[functionName]", { userId: user.id, error: error.message })`
- `app/auth/callback/route.ts` — Capture the profile insert error result and log it: `console.error("[auth_callback:profile_insert]", profileError)`

**Dependencies:** None — cross-cutting, apply incrementally in parallel with any other theme.

**Effort estimate:** S (a few hours spread across multiple files)

**Risk:** Low. Changes are additive. The only behavioral change is the localStorage reset on hydration failure, which is strictly better than silently running with corrupted state.

### Manual Test Steps

**Prerequisites:** Local Supabase running, dev server at localhost:3000, browser DevTools console open during all tests.

**New functionality — corrupted localStorage triggers clean reset:**
1. In DevTools, set `localStorage.stryvv_survey` to an invalid JSON string: `localStorage.setItem('stryvv_survey', '{bad json{{')`. Navigate to `/survey/1`. Verify the survey starts at step 1 with empty answers — no JS crash, no broken state.
2. Set `stryvv_survey` to valid JSON with a wrong-typed field: `{"currentStep":"not-a-number","highestStep":1,"answers":{}}`. Navigate to `/survey/1`. Verify the survey resets cleanly rather than exhibiting broken step navigation.

**New functionality — localStorage unavailability banner:**
3. In a private/incognito browser window, navigate to `/survey/1`. Verify a visible warning banner appears (e.g. "Your progress won't be saved if you close this tab"). Verify the survey is still fully functional — all steps can be filled out and navigated.
4. In a normal browser window (localStorage available), navigate to `/survey/1`. Verify the warning banner is NOT shown.

**New functionality — specific error messages in onboarding:**
5. Force a `joinHousehold` failure by setting an invalid `pending_invite_code` on a user's profile via service role. Navigate to `/onboarding` as that user. Verify the error message shown is specific (e.g. "Invalid invite code") — NOT the generic "Something went wrong. Please try again."
6. Navigate to `/onboarding` as a user with no survey and no household (should be blocked by Theme 4's completeness guard). Verify the error message is "Please complete the survey before creating your household" — not the generic message.

**New functionality — structured console logging:**
7. Open DevTools console. Run the full P1 onboarding flow. Verify structured log entries appear: `[onboarding:save_survey]`, `[onboarding:create_household]`. Verify `[onboarding:join_household]` does NOT appear for P1.
8. Run the full P2 join flow. Verify `[onboarding:join_household]` appears in console with a household ID.

**Regression — normal survey flow unaffected:**
9. Complete the full 6-step survey in a normal browser window. Verify answers persist across step navigation. Verify no warning banner appears. Verify `/survey/complete` shows the correct money style.

**Regression — normal onboarding still works:**
10. Full P1 onboarding flow: survey → signup → verify email → `/onboarding`. Verify InvitePanel is shown with a valid invite code and no regressions in functionality.

---

## Theme 5: Webhook Delivery Is Fire-and-Forget With No Status Contract

**Problem summary:** `sendSurveyAnalysis()` is the core product value delivery mechanism. It is called with `.catch(console.error)` — not awaited, not retried, and its success or failure is not recorded anywhere. When it fails, the user sees the ConnectedPanel confirming their connection, but the analysis is silently lost. The "Resend Analysis" button provides a manual recovery path, but only P2 sees it — P1 is stuck on InvitePanel indefinitely.

**Approach:** Add a `webhook_status` field to `households` tracking delivery state (`pending` / `sent` / `failed`). This prevents re-sending when already successful (idempotency) and gives the UI a server-side signal for failed deliveries.

Make `sendSurveyAnalysis()` awaitable in the pipeline with proper UI status tracking. Webhook failures should not block the join confirmation screen but should be visible and actionable.

**Key changes:**

- `supabase/migrations/` — New migration adding `webhook_status text check (webhook_status in ('pending', 'sent', 'failed')) default 'pending'` to `households`. New RLS UPDATE policy allowing a household member to update only `webhook_status` on their own household
- `lib/actions/survey-analysis.ts` — At function start, check `household.webhook_status`. If `'sent'`, return early (idempotent). On success, update `webhook_status = 'sent'`. On failure, update to `'failed'`. Move `WEBHOOK_URL` to `process.env.SURVEY_ANALYSIS_WEBHOOK_URL` (the existing hardcoded URL has a TODO comment for this)
- `components/onboarding/OnboardingClient.tsx` — Change fire-and-forget to a proper `await` with `webhookStatus` state (`'sending' | 'sent' | 'failed'`). Render status-appropriate UI in `ConnectedPanel`
- `components/onboarding/ConnectedPanel.tsx` — Accept `webhookStatus` prop. Show "Preparing your analysis..." while sending, success confirmation when sent, "Retry Analysis" button when failed

**Dependencies:** Theme 2 (pipeline idempotency) should be resolved first to prevent duplicate webhook sends on re-run.

**Effort estimate:** M (1–2 days)

**Risk:** The `sendSurveyAnalysis` UPDATE to `webhook_status` runs in P2's session. The RLS UPDATE policy must be scoped via `get_my_household_id()` to prevent a user from manipulating another household's webhook status.

### Manual Test Steps

**Prerequisites:** Local Supabase running, dev server at localhost:3000, n8n webhook URL accessible (or a mock HTTP endpoint like `https://httpbin.org/post` temporarily substituted in `SURVEY_ANALYSIS_WEBHOOK_URL`).

**New functionality — webhook_status set to 'sent' on success:**
1. Run the full happy-path join flow (J1): P1 creates household, P2 joins via invite link, both complete surveys. After P2 lands on `/onboarding` ConnectedPanel, query the DB via service role: `SELECT webhook_status FROM households WHERE id = <household_id>`. Verify `webhook_status = 'sent'`.
2. Verify the UI shows a success/confirmation state on ConnectedPanel — NOT just a loading spinner or ambiguous message.

**New functionality — webhook_status set to 'failed' on error:**
3. Set `SURVEY_ANALYSIS_WEBHOOK_URL` to an invalid URL or a URL that returns a non-200 status. Run the full join flow. After ConnectedPanel loads, query DB: verify `webhook_status = 'failed'`.
4. Verify the UI on ConnectedPanel shows a visible error state with a "Retry Analysis" button — NOT a success message. The join itself should still be shown as successful (household connection confirmed).

**New functionality — resend is idempotent when status is 'sent':**
5. With `webhook_status = 'sent'` in DB, click the "Resend Analysis" (or "Retry") button on ConnectedPanel. Verify the webhook endpoint is NOT called again (check the mock endpoint's request count or server logs). Verify the action returns success immediately.

**New functionality — ConnectedPanel shows loading state during webhook:**
6. With a slow/delayed mock webhook endpoint (e.g. one that takes 2 seconds to respond), run the join flow. Verify ConnectedPanel shows a loading/sending indicator ("Preparing your analysis...") while the webhook is in-flight. Verify the indicator resolves to a success state after the webhook responds.

**New functionality — SURVEY_ANALYSIS_WEBHOOK_URL environment variable:**
7. Remove `SURVEY_ANALYSIS_WEBHOOK_URL` from `.env.local`. Restart the dev server. Run the join flow. Verify a descriptive error is thrown ("Webhook URL not configured") rather than sending to the old hardcoded URL.

**New functionality — RLS prevents updating another household's webhook_status:**
8. Sign in as a user in household A. Using the REST API with that user's JWT, attempt to PATCH `households` where `id = <household_B_id>` setting `webhook_status = 'failed'`. Verify the response is 0 rows updated (RLS blocks it).

**Regression — normal join flow still triggers webhook and shows ConnectedPanel:**
9. Restore the valid `SURVEY_ANALYSIS_WEBHOOK_URL`. Run the full J1 happy path. Verify webhook fires, `webhook_status = 'sent'`, and ConnectedPanel is shown without errors.

**Regression — P1 can still see ConnectedPanel (via Theme 6's server-side panel selection):**
10. After both partners are connected and `webhook_status = 'sent'`, sign in as P1 and navigate to `/onboarding`. Verify P1 sees ConnectedPanel (not InvitePanel) and the webhook status is reflected correctly (no "retry" button visible when status is 'sent').

---

## Theme 6: Onboarding UI State Is Detached From Server State

**Problem summary:** P1's `OnboardingClient` is set to `mode = "creator"` during the initial pipeline run and stays there permanently. There is no polling, real-time subscription, or server query on revisit to detect that P2 has since joined. P1 returning to `/onboarding` after their partner has joined sees "waiting for partner" indefinitely — the highest-impact UX gap for the product's core emotional moment.

**Approach:** The `/onboarding` Server Component (see Theme 2) already pre-fetches household member count. When count is 2, render `ConnectedPanel` directly for P1 — no pipeline re-run needed.

For real-time detection (P1 is on the waiting screen when P2 joins), add a Supabase Realtime subscription on the `profiles` table filtered by `household_id`. When a second profile joins, transition the UI to `ConnectedPanel`.

**Key changes:**

- `app/onboarding/page.tsx` — When `household_id` is set and member count is 2, render `ConnectedPanel` directly (regardless of whether this user was creator or joiner). Pass `householdId` as prop
- `components/onboarding/InvitePanel.tsx` — Accept `householdId` prop. Add Supabase Realtime subscription: `postgres_changes` on `profiles` table, filter `household_id=eq.HOUSEHOLD_ID`, event `INSERT`. On new member join, call `onPartnerJoined` callback to trigger UI transition to `ConnectedPanel`
- `components/onboarding/OnboardingClient.tsx` — Accept `initialPartnerJoined: boolean` prop. If true, skip to `ConnectedPanel` immediately without re-running the pipeline. Add `onPartnerJoined` callback prop for `InvitePanel` to call
- As a simpler MVP fallback (if Realtime is not enabled on the project): add a "Check if partner joined" button on `InvitePanel` that calls a lightweight server action querying household member count

**Dependencies:** Theme 2 (server-side pipeline state) provides `householdId` needed for the Realtime subscription.

**Effort estimate:** M (1–2 days). Server-side panel selection is S; adding Realtime subscription is an additional S–M.

**Risk:** Realtime requires the `profiles` table to have replication enabled in the Supabase project. Verify in the Supabase dashboard before implementing the subscription. The polling/button fallback is sufficient for MVP if Realtime is unavailable.

### Manual Test Steps

**Prerequisites:** Local Supabase running, dev server at localhost:3000, two browser windows available (one for each partner).

**New functionality — P1 returning after P2 joined sees ConnectedPanel:**
1. Complete the full J1 happy path so both P1 and P2 have `household_id` set in DB. Sign out as P1.
2. Sign back in as P1 and navigate to `/onboarding`. Verify ConnectedPanel is shown — NOT InvitePanel with "waiting for partner." The server pre-fetch detects 2 household members and renders the correct panel directly.
3. Hard-refresh the page. Verify ConnectedPanel is still shown without a flash of InvitePanel.

**New functionality — real-time partner join detection:**
4. Open two browser windows. Window 1: sign in as P1 and navigate to `/onboarding` — InvitePanel should show.
5. Window 2: sign in as P2 and run the full join flow (invite link → survey → onboarding). At the moment P2's join completes, observe Window 1. Verify Window 1 automatically transitions to ConnectedPanel WITHOUT a manual page refresh.

**New functionality — "Check if partner joined" fallback button:**
6. Sign in as P1 on `/onboarding` (InvitePanel showing, no partner yet). Click the "Check if partner joined" button. Verify a "Partner hasn't joined yet" message appears — no error.
7. Via service role, manually set P2's `household_id` to match P1's household (simulating an out-of-band join). Click "Check if partner joined" again. Verify the UI transitions to ConnectedPanel.

**Regression — P2 first-time join shows ConnectedPanel immediately:**
8. Run the full P2 join flow. Verify `/onboarding` shows ConnectedPanel immediately after join completes — no extra button click or refresh needed.

**Regression — P1 first-time household creation shows InvitePanel:**
9. New P1 user completes full onboarding. Verify InvitePanel is shown with a valid, copyable invite code. Verify the "Check if partner joined" button is present but clicking it says partner hasn't joined yet.

**Regression — no stale panel flashes on re-render:**
10. Sign in as P1 with a complete household (2 members). Navigate to `/onboarding`. Verify ConnectedPanel renders immediately on first load — no visible flash of InvitePanel before state resolves.

---

## Theme 8: Schema and Type Safety Boundary Violations

**Problem summary:** Data crossing the localStorage deserialization boundary and the `user_metadata` boundary is not validated before use. `JSON.parse()` results are cast directly to `SurveyState` with no type guard. Survey answers are written to the DB with only a key-count check, not a schema validation — meaning partial or malformed answers persist as `is_complete = true`. The `q6_partner_type` DB CHECK constraint (`in ('husband', 'wife')`) has no corresponding frontend Zod validation, so invalid values cause runtime DB errors rather than user-visible form errors.

**Approach:** Add Zod validation at two external data boundaries: localStorage deserialization and the `saveSurveyResponse` server action input.

For localStorage: define a `SurveyStateSchema` Zod schema. In `SurveyProvider` hydration, use `safeParse` and only dispatch `HYDRATE` on success. On failure, dispatch `RESET` (already proposed in Theme 7).

For server actions: `saveSurveyResponse` should validate answers against `SurveyAnswersSchema` before upserting. The `is_complete: true` flag should only be set when all required fields are present and valid — not just `Object.keys(answers).length > 0`.

**Key changes:**

- `lib/validations/survey.ts` — This file already exists. Add or extend with: (1) `SurveyStateSchema` matching the `SurveyState` interface for localStorage validation, (2) ensure `SurveyAnswersSchema` enforces all required fields and matches DB CHECK constraint values (e.g., `q6_partner_type: z.enum(['husband', 'wife'])`)
- `lib/context/survey-context.tsx` — Replace bare `JSON.parse(saved)` cast with `SurveyStateSchema.safeParse(JSON.parse(saved))`. Use `.success` to gate the `HYDRATE` dispatch
- `lib/actions/survey.ts` (`saveSurveyResponse`) — Before the upsert, run answers through `SurveyAnswersSchema.safeParse(answers)`. If validation fails, throw with the Zod error message. Change `is_complete: true` to `is_complete: validationResult.success`
- `app/auth/callback/route.ts` — Add inline Zod validation of `user.user_metadata` before accessing `first_name`/`last_name` fields

**Dependencies:** None — independently implementable. Extends existing `lib/validations/survey.ts`.

**Effort estimate:** S–M (a few hours to 1 day)

**Risk:** Changing `is_complete` to depend on full schema validation means partial surveys will have `is_complete = false`. Update `sendSurveyAnalysis` to explicitly check `is_complete = true` on both rows (not just row count) before firing the webhook.

### Manual Test Steps

**Prerequisites:** Local Supabase running, dev server at localhost:3000, browser DevTools available.

**New functionality — corrupted localStorage triggers clean survey reset:**
1. In DevTools, set `localStorage.stryvv_survey` to an old-schema JSON object missing the `inviteCode` field: `{"currentStep":3,"highestStep":3,"answers":{"q5_nickname":"Alice"}}`. Navigate to `/survey/1`. Verify the survey resets cleanly to step 1 with empty answers (schema mismatch triggers RESET).
2. Set `stryvv_survey` to a fully valid current-schema object. Navigate to `/survey/1`. Verify answers ARE hydrated correctly — schema-valid data is not unnecessarily reset.

**New functionality — saveSurveyResponse rejects partial answers:**
3. Sign in as an authenticated user. Trigger `saveSurveyResponse` with only 2 fields populated (e.g. `q5_nickname` and `q6_partner_type`, all others missing). Verify the action returns a Zod validation error — NOT a 200 with `is_complete = true`. Query DB to confirm no row with `is_complete = true` was inserted.
4. Trigger `saveSurveyResponse` with all required fields at valid enum values. Verify success response and `is_complete = true` in DB.

**New functionality — invalid enum value rejected at server action (not DB):**
5. Trigger `saveSurveyResponse` with `q6_partner_type = "spouse"` (invalid). Verify the error is a Zod validation message — NOT a raw Postgres constraint violation. Error must be human-readable, not a DB error string.
6. Trigger `saveSurveyResponse` with `q10_satisfaction = 15` (out of range 1–10). Verify Zod validation error is returned before reaching the DB.

**New functionality — sendSurveyAnalysis checks is_complete on both rows:**
7. Set up a household where P1 has `is_complete = false` and P2 has `is_complete = true` (set via service role). Call `sendSurveyAnalysis` for that household. Verify it throws "Both partners must complete the survey" (not just checks row count).
8. Set both to `is_complete = true`. Call `sendSurveyAnalysis`. Verify the webhook fires successfully.

**New functionality — user_metadata type safety in auth callback:**
9. Create a user via admin API with no `user_metadata` field. Click the verification link. Verify the profile is created with `first_name = ""` and `last_name = ""` — no runtime error.
10. Create a user with `user_metadata: {"first_name": 99999}` (wrong type). Verify the auth callback coerces to string or uses an empty default — does not crash.

**Regression — complete survey correctly sets is_complete = true:**
11. Run the full 6-step survey in the UI and complete all steps. Navigate to `/onboarding`. Query `survey_responses` via service role. Verify `is_complete = true`, `completed_at IS NOT NULL`, and all question fields are non-null.

**Regression — all 6 survey steps work end-to-end:**
12. Complete all 6 survey steps in order filling every field. Verify each step's validation passes on valid input, the progress bar advances, and `/survey/complete` shows the correct money style based on `q12_my_money_style`.

**Regression — backward navigation preserves answers:**
13. Complete steps 1–3. Click back to step 2 and change an answer. Proceed forward to step 3. Verify step 3 still shows previously entered answers. Verify `highestStep` remains 3 (not reset by the step-2 re-save).

---

## Implementation Sequence

| Order | Theme | Reason |
|---|---|---|
| 1 | **Theme 3** — Profile existence guarantee | Smallest, no dependencies, makes DB state reliable for everything else |
| 2 | **Theme 1** — Server-side invite code | Root fix; Themes 2 and 4 depend on `pending_invite_code` column |
| 2 | **Theme 7** — Error observability | Parallel with Theme 1; adds logging that makes all other changes easier to debug |
| 3 | **Theme 4** — Invite code lifecycle guards | Depends on Theme 1's column; `joinHousehold` guard is independent and can start earlier |
| 4 | **Theme 2** — Pipeline idempotency | Depends on Themes 1, 3, 4 having closed the state gaps the pipeline relied on |
| 4 | **Theme 8** — Schema validation | Can start anytime; completes naturally alongside Theme 2's survey save changes |
| 5 | **Theme 5** — Webhook status tracking | Depends on Theme 2 (idempotent pipeline); schema migration is independent |
| 6 | **Theme 6** — UI server state sync | Depends on Theme 2 (server-side panel selection); Realtime subscription is independent |

**Themes 1 and 4 share overlapping files** (`lib/actions/onboarding.ts`, `app/auth/callback/route.ts`) and should be implemented by the same engineer in the same PR to avoid conflicts.
