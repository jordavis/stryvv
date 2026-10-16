# Plan: Sign up and sign in with a 6-digit email code

From: intent.md / spec.md (2026-10-14). Approved: Jordan Davis, 2026-10-14.

## Files that change

**Design foundation (first use of the Stryvv Design System in code)**
- `app/globals.css` (edit): a `.stryvv-app` block with the design system's color tokens for light and dark (`teal`, `teal-deep`, `teal-soft`, `on-teal`, `bg`, `surface`, `surface-sunken`, `border`, `border-strong`, `ink`, `ink-muted`, `ink-faint`, `danger`, `danger-soft`), plus radius and font variables. Values are copied from the design system's `tokens.json`, and the block cites it. The landing page's existing variables are untouched.
- `app/(auth)/layout.tsx` (new): loads Manrope and Figtree with `next/font/google`, applies `.stryvv-app`, and centers a phone-width column. It's shared by the signup, verify, login and forgot-password pages.
- `app/(app)/layout.tsx` (new): the same fonts and tokens for signed-in pages; it redirects to `/login` if there's no user.
- `components/app/button.tsx`, `text-field.tsx`, `code-input.tsx`, `auth-card.tsx`, `form-message.tsx` (new): the design system's Button, TextField, CodeInput and card, rebuilt as typed React components on Tailwind and the tokens. They have real `<label>`s, `aria-invalid` and `aria-describedby`, 16px inputs and 44px+ touch targets.

**Logic**
- `lib/validation/auth.ts` (new): Zod schemas `signUpSchema`, `signInSchema`, `codeSchema`, `emailSchema`, `newPasswordSchema`, and `normalizePhone()`, which uses `libphonenumber-js/min` and defaults to the US. Server-only import.
- `lib/validation/auth.test.ts` (new): written first. It covers names (trimmed, 1–100), email, 8-character passwords, the checkbox, 6-digit codes only, and phone numbers (`(555) 555-0100` → `+15555550100`, `+44 20 7946 0958` kept, letters and too-short numbers rejected).
- `lib/terms.ts` (new): `export const TERMS_VERSION = "2026-10-placeholder"`.
- `lib/actions/auth.ts` (new): the server actions `signUp`, `verifyCode`, `resendCode`, `signIn`, `requestPasswordReset`, `resetPassword`, `signOut`. They validate with Zod, use the session client, map Supabase errors to the spec's messages, and never log personal data.
- `lib/actions/auth-errors.ts` + `auth-errors.test.ts` (new): one function that maps Supabase auth error codes (`invalid_credentials`, `email_not_confirmed`, `otp_expired`, `over_email_send_rate_limit`, and so on) to the spec's wording. It's unit-tested so the account-discovery rules (spec requirements 4, 9, 10) can't regress.
- `package.json` (edit, via `npm install libphonenumber-js`).

**Pages**
- `app/(auth)/signup/page.tsx`, `verify/page.tsx`, `login/page.tsx`, `forgot-password/page.tsx` (new). The forms are client components using `useActionState` with the server actions. The email moves from signup to verify in a short-lived, httpOnly cookie, not in the URL (data-security rule: no personal data in URLs).
- `app/(app)/welcome/page.tsx` (new): "You're in, {first name}" and a sign-out button.
- `app/terms/page.tsx`, `app/privacy/page.tsx` (new): placeholder text.
- `lib/supabase/proxy.ts` (edit): public routes, signed-in-only routes, and redirecting signed-in people away from the auth pages (spec requirements 12 and 13).

**Supabase (local stack, in the repo)**
- `supabase/config.toml` (edit): `enable_confirmations = true`, `minimum_password_length = 8`, `site_url = "http://localhost:3000"`, plus localhost redirect URLs and the template paths.
- `supabase/templates/confirm-signup.html`, `reset-password.html` (new): branded emails with `{{ .Token }}` in large type and the 1-hour expiry, with plain-text-friendly markup.

**Docs**
- `CLAUDE.md`, `README.md` (edit): the auth flow, where the pages are, how to read codes from the local test inbox, and the design-token block.
- `docs/work/2026-10-14-signup-email-code/plan.md`: kept in step with what's built.

## Order of work
1. Write `lib/validation/auth.test.ts` and `auth-errors.test.ts` first; they fail.
2. `npm install libphonenumber-js`; write the schemas, phone normalization and error mapping until the tests pass.
3. Add the design tokens to `globals.css`, the two route-group layouts, and the `components/app/` pieces.
4. Write the server actions.
5. Build the pages: signup → verify → welcome → login → forgot password → terms/privacy.
6. Update the proxy route rules.
7. Update `config.toml` and add the email templates, then restart the local stack (`supabase stop --no-backup`, then `npm run db:start`) so auth uses them.
8. Run the whole flow by hand against the local stack, reading codes from the local test inbox (`http://127.0.0.1:54324`).
9. Update the docs, run `npm run check` and `npm run build`, and open the PR.
10. After merge, Jordan enters the Production setup values from the spec, and I check a real signup end to end on `app.stryvv.com`.

## Risks
- **An auth bug lets an unverified person in.** Guard: Supabase issues no session until the code is verified; `/welcome` checks the user on the server; tested by hand by trying `/welcome` right after signup without the code.
- **Error messages reveal whether an account exists.** Guard: one tested mapping function; sign-up for an existing email shows "Check your email" (tested by hand with a second signup).
- **The design tokens leak into the landing page.** Guard: the tokens live only under `.stryvv-app`; the landing page is checked visually afterwards.
- **Local and production settings differ.** Guard: the spec's Production setup table is copied into the PR description as a checklist.
- **Emails don't arrive in production** (SMTP or DNS). Guard: step 10 runs a real signup to a real inbox before anyone else is told about `/signup`.

## Proof
- `npm run check` green, including the new validation and error-mapping tests.
- `npm run build` green; the route list shows the new pages.
- Browser pane, at phone and desktop width, light and dark, against the local stack:
  1. Sign up → the code arrives in the local test inbox → wrong code shows the error → right code lands on Welcome with the first name.
  2. Sign out → sign in → Welcome.
  3. Forgot password → code → new password → Welcome; the old password no longer works.
  4. Sign up again with the same email → "Check your email", with no error that reveals the account.
  5. Signed out, `/welcome` → `/login`; signed in, `/signup` → `/welcome`; `/dashboard` → `/coming-soon`.
- Read-only database check afterwards: the new profile has names, phone in `+1…` format, `terms_version` and `terms_accepted_at`.
- Screenshots of the signup, verify and welcome screens in the PR.

## Changes while building (2026-10-14)
- **Wrong and expired codes share one message.** Supabase returns `otp_expired` for both, so the app can't say which (spec requirement 7 updated).
- **`lib/validation/auth.ts` doesn't import `server-only`.** The package isn't installed and throws under Vitest; the file comment says to import it from server code only.
- **The resend countdown restarts from inside the resend action,** not from an effect (React's lint rule against setting state in effects).
- **The "use a different email" action is `startOver`,** since a name starting with `use` reads as a React hook.
- **The logo is resized by Next.js** (`sizes="133px"`) instead of shipping the 4,688-pixel PNG.
- **Added `npm run dev:local` (`scripts/dev-local.sh`) and a `dev-local` preview entry.** They run the app against the local Supabase stack, so testing never touches production.


## Changes after code review (2026-10-15)
- **A reset whose new password can't be saved finishes on `/set-password`** (new signed-in page, action `setNewPassword`). Verifying the recovery code signs the browser in and uses the code up, so retrying on `/forgot-password` was impossible.
- **The terms version is caught up in the signed-in layout** (`lib/auth/terms.ts`) if `accept_terms()` failed after verification.
- **The email cookies moved to `lib/auth/remembered-email.ts`,** out of the `"use server"` file, so reading them isn't a public action. The unused `getResetEmail` and `rememberedEmail` prop are gone.
- **Forgot-password reports outages** (5xx or no answer) with the generic error; other errors still look like success (`mapResetRequestError`, tested).
- **Signing in unverified stays on `/login` with an error if the new code couldn't be sent.**
- **The code screen links to sign-in,** for a repeat sign-up of an already-verified address (no code is sent then).
- **The sign-up form's phone check allows 7–15 digits** (`lib/validation/hints.ts`, tested), so short international numbers aren't blocked before the server sees them.
- **Local `email_sent` rate limit raised from 2 to 30 an hour.**

## To do

- **Find out why email from `support@stryvv.com` lands in Gmail's spam folder** (reported 2026-10-15). Things to check:
  - Resend shows `stryvv.com` as **Verified**, and the message headers show `spf=pass`, `dkim=pass` with `d=stryvv.com`, and `dmarc=pass` (Gmail → ⋮ → Show original).
  - DMARC is `p=quarantine` on a brand-new sending domain. Consider `p=none` with reports while the domain builds a reputation, then tighten it.
  - The root SPF record only includes Cloudflare's routing. That's fine if Resend's bounce domain (`send.stryvv.com`) is what Gmail checks; confirm in the headers.
  - Domain reputation: new domains start cold. Send a steady trickle of real messages, and register `stryvv.com` with Google Postmaster Tools to watch spam rates.
  - Content: run a message through a spam checker (e.g. mail-tester.com). A plain-text part, a physical address in the footer and a short, specific subject usually help.
