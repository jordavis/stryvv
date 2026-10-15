# Spec: Sign up and sign in with a 6-digit email code

From: intent.md (2026-10-14). Status: accepted.

## Requirements

**Sign up**
1. `/signup` shows one card with: first name, last name, email, mobile number, password, and an "I'm 18 or older and agree to the Terms of Service and Privacy Policy" checkbox. "Create account" stays disabled until every field is valid and the box is ticked.
2. The server checks everything again, so the browser's checks are never trusted:
   - names: 1 to 100 characters after trimming;
   - email: a valid address;
   - password: at least 8 characters;
   - mobile: a valid number, stored in international format (for example `+15555550100`); US numbers can be entered without `+1`;
   - checkbox: ticked.
3. A valid signup creates an unverified account, emails a 6-digit code from `support@stryvv.com`, and goes to `/verify`.
4. Signing up with an email that already has an account looks exactly the same to the person ("Check your email"), so the form can't be used to find out who has an account.

**Verify**
5. `/verify` shows the email address the code went to, one large code field (digits only, filled automatically from the email on phones), "Verify", "Resend code" and "Use a different email".
6. The right code signs the person in, records their acceptance of the current terms version (requirement 15), and goes to `/welcome`.
7. A wrong or expired code shows one message ("That code isn't right or has expired…"), keeps the field, and lets them try again or resend. (Changed while building: Supabase returns the same error for both, so the app can't tell them apart.) Resending is disabled for 60 seconds after each send, with a visible countdown.
8. The account can't be used for anything until the code has been entered.

**Sign in, forgot password, sign out**
9. `/login` takes email and password. A wrong email or wrong password both show "That email and password don't match." If the email isn't verified yet, a new code is sent and the person goes to `/verify`.
10. `/forgot-password` takes an email and always answers "If there's an account for that email, we've sent a code." The next screen takes the 6-digit code and a new password (at least 8 characters). Success signs them in and goes to `/welcome`.
11. Signing out, from `/welcome`, ends the session and goes to `/login`.

**Access**
12. Without a session, these pages are public: `/`, `/coming-soon`, `/signup`, `/verify`, `/login`, `/forgot-password`, `/terms` and `/privacy`. `/welcome` redirects to `/login`. Every other page redirects to `/coming-soon`, as today.
13. With a session, `/signup`, `/verify`, `/login` and `/forgot-password` redirect to `/welcome`.
14. The landing page still links only to `/coming-soon`. Signup is reachable by its address alone.

**Data**
15. After verification the profile row (created by the existing `on_auth_user_created` trigger) has the first name, last name and phone number from signup. `terms_version` holds the server's current version string, and `terms_accepted_at` holds the time of verification, written by `accept_terms()`.
16. `/welcome` shows "You're in, {first name}" and a sign-out link, read from the person's own profile.

**Email**
17. Every auth email is sent through Resend from `Stryvv <support@stryvv.com>`, shows the code in large type, says how long it lasts (1 hour), and works in plain-text email apps.

## User experience

All screens follow the [Stryvv Core Screens](https://claude.ai/artifact/59SH5WnEdcQxGio7RjQ7ME) mockups (Sign up, Verify email) and the Stryvv Design System: Manrope for headings, Figtree for text, teal primary buttons, 16px inputs, light and dark themes. They're designed for a phone first.

| Screen | Empty | Working | Error | Done |
|---|---|---|---|---|
| Sign up | Button disabled, helper text under password | Button shows "Creating account…" and the form is locked | Field errors next to the field ("Add the rest of your email, like name@example.com"); a general error above the button if Supabase is unreachable | Goes to Verify |
| Verify | Code field focused; "Resend code" counting down | "Checking…" | "That code isn't right or has expired. Check the email, or send a new code." | Goes to Welcome |
| Sign in | Button disabled until both fields are filled | "Signing in…" | "That email and password don't match." | Goes to Welcome |
| Forgot password | Email field | "Sending…" | Only network errors are shown | Code and new-password step, then Welcome |
| Welcome | — | — | — | "You're in, Jordan." plus one line that onboarding is coming, and "Sign out" |

The partner, onboarding and home screens are out of scope. Nobody can be partnered yet, so there is no partner state here.

`/terms` and `/privacy` are placeholder pages saying the full text is coming. The real text needs a lawyer.

## Data and API changes

**No schema change.** The existing trigger fills `profiles` from the signup metadata (`first_name`, `last_name`, `phone`), and `accept_terms()` writes the terms fields.

**App code**
- `app/(auth)/`: a route group with its own layout (Manrope and Figtree through `next/font`, design-system tokens) holding the `signup`, `verify`, `login` and `forgot-password` pages. The landing page's styling is untouched.
- `app/(app)/welcome/page.tsx`: the first signed-in page.
- `app/terms/page.tsx`, `app/privacy/page.tsx`: placeholders.
- `lib/actions/auth.ts`: server actions `signUp`, `verifyCode`, `resendCode`, `signIn`, `requestPasswordReset`, `resetPassword`, `signOut`. Each one validates with Zod, uses the session client from `lib/supabase/server.ts`, and returns `{ ok } | { error: { field?, message } }`. Nothing returns Supabase's raw error text.
- `lib/validation/auth.ts`: Zod schemas and phone normalization, with unit tests.
- `lib/terms.ts`: `TERMS_VERSION`, a constant on the server. The client never sends a version.
- `components/app/`: `Button`, `TextField`, `CodeInput` and `AuthCard`, built from the design system's components and tokens.
- `app/globals.css`: the design-system color, type and radius tokens as CSS variables, scoped so the landing page keeps its current look.
- `lib/supabase/proxy.ts`: the route rules in requirements 12 and 13.

**Supabase calls**
| Step | Call |
|---|---|
| Sign up | `auth.signUp({ email, password, options: { data: { first_name, last_name, phone } } })` |
| Verify | `auth.verifyOtp({ email, token, type: 'email' })`, then `rpc('accept_terms', { _version: TERMS_VERSION })` |
| Resend | `auth.resend({ type: 'signup', email })` |
| Sign in | `auth.signInWithPassword({ email, password })` |
| Forgot | `auth.resetPasswordForEmail(email)`, then `verifyOtp({ email, token, type: 'recovery' })` and `auth.updateUser({ password })` |
| Sign out | `auth.signOut()` |

**Auth settings, kept in the repo for the local stack** (`supabase/config.toml`, `supabase/templates/*.html`):
- `enable_confirmations = true`
- `minimum_password_length = 8`
- `otp_length = 6`
- `otp_expiry = 3600`
- `site_url = "http://localhost:3000"`
- "Confirm signup" and "Reset password" templates that use `{{ .Token }}`

Locally, emails land in the Supabase stack's built-in test inbox (Mailpit), so the whole flow can be tested without sending real email.

## Security and privacy

- **Every action starts on the server** with Zod validation; the session comes from cookies set by `@supabase/ssr`. Server actions have Next.js's built-in same-origin check.
- **No account discovery:** sign-up, forgot-password and sign-in messages are the same whether or not the email exists (requirements 4, 9, 10).
- **Brute force:** Supabase rate-limits sign-ins, sign-ups, code checks and emails (defaults kept, as decided). A code lasts 1 hour, and a new code replaces the old one.
- **Terms:** the version comes from the server, the time from the database (`accept_terms()`), never from the client.
- **Personal data:** email, phone and names are never logged, and nothing in this feature calls OpenAI. Logs carry error codes only.
- **Secrets:** the Resend SMTP password is entered only in Supabase's dashboard. Nothing new goes in the repo or in Vercel.
- **The profile is the person's own:** RLS already limits `profiles` to its owner, and the welcome page reads through the session client.

## Production setup (Jordan, in dashboards)

| Where | Setting |
|---|---|
| Cloudflare DNS | `app.stryvv.com`: CNAME to Vercel's target (shown when the domain is added in Vercel), DNS only (grey cloud) |
| Vercel | Add `app.stryvv.com` to the Stryvv project |
| Cloudflare Email Routing | Forward `support@stryvv.com` to your inbox, so replies don't bounce. **Done 2026-10-14.** |
| Resend | Confirm `stryvv.com` is Verified; create an SMTP key |
| Supabase → Auth → URL configuration | Site URL `https://app.stryvv.com`; redirect URLs `https://app.stryvv.com/**`, `http://localhost:3000/**` |
| Supabase → Auth → Providers → Email | Confirm email on; minimum password length 8; code length 6; expiry 3600 |
| Supabase → Auth → SMTP | Host `smtp.resend.com`, port 465, user `resend`, password = Resend SMTP key, sender `support@stryvv.com`, name `Stryvv` |
| Supabase → Auth → Email templates | Paste "Confirm signup" and "Reset password" from `supabase/templates/` |

## Concerns flagged

- **Hidden signup isn't private signup.** Anyone who guesses `/signup` can make an account. They'd only see the welcome placeholder, and accounts are free to delete. → Decided 2026-10-14: accept for now. No switch.
- **Terms are "accepted" at verification, not at the checkbox.** There's no session until the code is entered, so `accept_terms()` can't run earlier. The difference is seconds, and the checkbox is required to submit. → Accept, and note it in the privacy policy.
- **Phone parsing needs a library.** Reliable international number handling means `libphonenumber-js` (the "min" metadata). → Use it on the server only, in `lib/validation/auth.ts`, so it doesn't add to page weight. The browser does a light format check.
- **Production auth settings live in the dashboard, not the repo,** so they can drift from `config.toml`. → Keep templates and settings in the repo, and list the dashboard values above. Supabase's CLI can push auth config (`supabase config push`); we could adopt that later with Jordan running it.
- **The free Supabase plan pauses after a week without activity.** Testers would hit a paused project. → Acceptable while hidden. Revisit at launch.
- **Email from `support@` when the inbox doesn't exist yet.** → Done 2026-10-14: Cloudflare Email Routing is live (MX `route1-3.mx.cloudflare.net`).
- **First real use of the design system in code.** Tokens and components could drift from the Claude Design system. → Copy token values exactly from the design system's `tokens.json`, and keep them in one CSS block that cites it.
- **No automated browser test yet.** The flow involves email codes and cookies, so a unit test isn't enough. → Prove it by hand in the browser pane against the local stack and Mailpit, recorded in the PR. Adding Playwright end-to-end tests is worth a follow-up intent.

## Answers to intent's open questions
- **Sender address?** → `support@stryvv.com` (decided).
- **Where does the app live?** → `app.stryvv.com` (decided).
- **Password rules?** → At least 8 characters, no breached-password check (decided).
- **Code and resend limits?** → Supabase defaults (decided).
- **`stryvv.com` can't receive email?** → Resolved: Cloudflare Email Routing set up 2026-10-14.
