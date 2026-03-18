# Partner Onboarding User Journeys

## How the System Works

Survey answers live in `localStorage` (`stryvv_survey` key) — they survive page refreshes but are lost on device/browser change. The invite code is also stored inside the same localStorage key (`inviteCode` field) when a user arrives via `/invite/[code]` or `/survey?invite=CODE`.

`/onboarding` is the critical hub: on mount it reads localStorage, saves the survey to DB, checks for an `inviteCode`, then either joins an existing household or creates a new one — and finally clears localStorage.

- Login always redirects to `/onboarding`
- Signup → email verify → `/auth/callback` → `/onboarding`

---

## Partner 1 — The Inviter

```
[P1 arrives at app]
│
├─ A. No account
│   │
│   ├─ A1. Survey first (intended flow) ──────────────────────────────── ✅ HAPPY PATH
│   │       Visit / → /survey/1 → complete 6 steps → /survey/complete
│   │       → /signup → verify email → /auth/callback → /onboarding
│   │       OnboardingClient: saves survey, no inviteCode → createHousehold()
│   │       → InvitePanel shown with invite link
│   │
│   ├─ A2. Signup first, survey later ─────────────────────────────────── ⚠️ GAP
│   │       Visit /signup → verify email → /onboarding
│   │       OnboardingClient: no survey in localStorage (skipped) → createHousehold()
│   │       → InvitePanel shown, but P1 has NO survey_response in DB
│   │       → sendSurveyAnalysis() will fail when P2 joins ("Both partners must complete survey")
│   │
│   └─ A3. Signup first, then takes survey ────────────────────────────── ⚠️ UNCLEAR
│           Visit /signup → verify email → /onboarding (creates household, clears localStorage)
│           Then navigates back to /survey → completes survey → /survey/complete
│           Already logged in → clicks "Sign in" → /onboarding runs again
│           Saves survey answers, createHousehold() returns EXISTING invite code
│           → Functionally works, but double onboarding run is fragile
│
└─ B. Has account
    │
    ├─ B1. No household, no survey in localStorage ────────────────────── ⚠️ SAME AS A2
    │       Login → /onboarding → no survey in localStorage, no inviteCode
    │       → createHousehold() succeeds, InvitePanel shown
    │       → No survey_response in DB — analysis will fail when P2 joins
    │
    ├─ B2. No household, survey IN localStorage ───────────────────────── ✅ WORKS
    │       (same browser, did survey, was interrupted before verifying email)
    │       Login → /onboarding → survey saved, no inviteCode → createHousehold()
    │       → Works correctly
    │
    ├─ B3. Has household already (returning user) ────────────────────── ✅ HANDLED
    │       Login → /onboarding → createHousehold() detects existing household_id
    │       → returns existing invite_code → InvitePanel shown
    │
    └─ B4. Has household, partner already joined ─────────────────────── ❓ UNKNOWN
            Login → /onboarding → createHousehold() returns invite code
            → shows InvitePanel still? Or connected state?
            OnboardingClient does not check if partner is already connected
```

---

## Partner 2 — The Joiner

```
[P2 receives invite]
│
├─ Entry via invite LINK /invite/ABC123
│   │
│   ├─ C1. No account, no prior survey in localStorage ───────────────── ✅ HAPPY PATH
│   │       /invite/ABC123 → click "Start my survey"
│   │       → /survey?invite=ABC123 → invite code stored in localStorage → /survey/1
│   │       → completes survey → /survey/complete
│   │       → /signup → verify email → /auth/callback → /onboarding
│   │       OnboardingClient: saves survey, finds inviteCode → joinHousehold(ABC123)
│   │       → ConnectedPanel → sendSurveyAnalysis() fires
│   │
│   ├─ C2. No account, HAS prior survey in localStorage ───────────────── ⚠️ MIXED
│   │       (P2 had started a survey previously in the same browser)
│   │       /invite/ABC123 → click "Start my survey"
│   │       → /survey?invite=ABC123 → invite code stored, BUT redirected to current step (not step 1)
│   │       → P2 sees a partially-filled survey from before, not a fresh start
│   │       If they complete it → /signup → /onboarding → old survey saved (with invite code) → joins household
│   │       → Functionally works if they fill it all out, but confusing UX
│   │
│   ├─ C3. No account, skips survey, goes straight to /signup ─────────── ⚠️ GAP
│   │       /invite/ABC123 → navigates away without clicking "Start my survey"
│   │       → inviteCode NEVER stored in localStorage
│   │       → verify email → /onboarding → no inviteCode → createHousehold() → becomes P1!
│   │       → No way to join original household
│   │
│   ├─ C4. Has account, no household ─────────────────────────────────── ✅ WORKS
│   │       /invite/ABC123 → "Start my survey" → completes survey
│   │       → /survey/complete → "Sign in" → login → /onboarding
│   │       OnboardingClient: saves survey, finds inviteCode → joinHousehold(ABC123)
│   │
│   ├─ C5. Has account, skips survey, logs in directly ────────────────── ⚠️ GAP
│   │       /invite/ABC123 → goes to /login without clicking anything
│   │       → inviteCode NOT in localStorage → /onboarding → createHousehold()
│   │       → Becomes a new P1, doesn't join the intended household
│   │
│   └─ C6. Has account, ALREADY IN A HOUSEHOLD ───────────────────────── ⚠️ GAP
│           /invite/ABC123 → clicks "Start my survey" → invite code stored
│           → survey → login → /onboarding → joinHousehold(ABC123)
│           → UPDATE profiles SET household_id = new household (overwrites existing!)
│           → No guard against switching households
│
└─ Entry via MANUAL invite code (no link) ───────────────────────────── ⚠️ GAP
        No UI exists to enter an invite code manually.
        P2 must arrive via the /invite/[code] link — there is no fallback entry point.
```

---

## Test Matrix

| ID | Journey | P1 State | P2 State | Expected Outcome | Status |
|---|---|---|---|---|---|
| J1 | Both new users via invite link | New, no account | New, no account | Both connected, analysis sent | ✅ Happy path |
| J2 | P1 signs up before doing survey | New, skips survey | New via link | Household created, analysis fails (no P1 survey) | ⚠️ Gap |
| J3 | P2 skips invite flow entirely | Has account | New, goes direct to /signup | P2 becomes creator, orphaned from P1 | ⚠️ Gap |
| J4 | P1 returning user | Has household | — | Returns existing invite code | ✅ Handled |
| J5 | P2 has existing account, no household | Has account | Has account, no household | Joins correctly after survey | ✅ Works |
| J6 | P2 already in a household | Has account | Has account + household | Overwrites P2's existing household | ⚠️ Gap |
| J7 | P2 has prior survey in browser | New user | New user, has old localStorage | Resumes old survey but invite code is saved | ⚠️ Mixed |
| J8 | P1 gets interrupted before email verify | New user | — | Survey in localStorage survives, saves on 2nd /onboarding run | ❓ Unknown |
| J9 | P2 on different device/browser | New user | New user, no localStorage | Works — invite code flows through URL not localStorage | ✅ Works |
| J10 | P1 clears browser before verifying email | New user | — | Survey and invite code lost permanently | ⚠️ Known limitation |

---

## Priority Gaps to Address

1. **J2 / A2 / B1** — P1 has no survey when partner joins; `sendSurveyAnalysis()` fails silently with "Both partners must complete the survey". Needs a guard or a redirect back to survey before household creation.

2. **J3 / C3 / C5** — The invite code lives only in `localStorage` and is only set by going through the survey flow. If P2 navigates directly to `/login` or `/signup` without clicking "Start my survey" on the invite page, the invite code is never stored and they become a new household creator instead of a joiner. Needs a more durable invite code handoff (e.g. URL param persisted through auth callback).

3. **J6** — No guard prevents a user already in a household from joining a second one, silently overwriting their `household_id`. Needs a check in `joinHousehold()` or on the `/onboarding` page.

4. **B4** — Unknown behavior when P1 returns to `/onboarding` after their partner has already joined. The `OnboardingClient` always shows `InvitePanel` for creators; it doesn't detect that the household is already complete and should show a connected/results state.
