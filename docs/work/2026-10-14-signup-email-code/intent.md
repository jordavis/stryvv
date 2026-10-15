# Intent: Sign up and sign in with a 6-digit email code

Author: Jordan Davis. Date: 2026-10-14. Status: accepted. Lane: careful.
Links: [product-vision.md](../../product-vision.md), [design-references.md](../../design-references.md), mockups on the [Stryvv Core Screens](https://claude.ai/artifact/59SH5WnEdcQxGio7RjQ7ME) canvas (Sign up, Verify email).

## Problem
Nobody can create an account. The cutover left production on the new schema with no accounts, and the live site is the landing page plus a coming-soon page. Every feature on the roadmap starts with a signed-in person. The product vision makes signup step one, ahead of the onboarding chat.

## Proposed outcome
- **Sign up** on one mobile-first card, as in the mockup: first and last name, email, mobile number, password, and one checkbox ("I'm 18 or older and agree to the Terms of Service and Privacy Policy").
- **Verify the email with a 6-digit code**, typed into one large field on the next screen, with "Resend code" and a hint to check spam. The account works only after the code is entered.
- **Sign in** with email and password. **Forgot password** emails a 6-digit code, then lets the person set a new password.
- **Accepting the terms is recorded** on the profile through `accept_terms()`, with the version they agreed to.
- **The mobile number is stored as entered**, with basic format checks. It isn't verified yet; texting comes later.
- **Emails come from `support@stryvv.com` through Resend**, not Supabase's default sender, so they're reliable and branded, and a reply reaches a real person.
- **After verifying, people land on a simple welcome screen** ("You're in. Your money story starts here soon."), with a sign-out link. It's a placeholder until the onboarding chat exists.
- **Signup is hidden for now.** It works on the live site at `app.stryvv.com/signup` for Jordan and testers, but the landing page keeps pointing to coming soon until onboarding is ready.

We'll know it worked when:
- a new person can sign up, receive the code from a Stryvv address, verify, sign out and sign back in on a phone;
- their profile row has their names, phone number and terms version;
- someone who hasn't verified can't reach any signed-in page.

## Affected users and systems
- **Users:** new sign-ups (testers only until onboarding ships).
- **Pages:** new `/signup`, `/verify`, `/login`, `/forgot-password` and `/welcome`; `lib/supabase/proxy.ts` (public vs. signed-in routes).
- **Supabase Auth settings** (in the dashboard, not the repo): email confirmation turned on, email templates switched to show a 6-digit code, custom SMTP pointed at Resend, allowed redirect URLs, password rules.
- **Database:** `profiles` (created by the existing trigger from signup metadata) and `accept_terms()`. No schema change is expected.
- **Resend:** sending domain and SMTP credentials.
- **Domains:** a new `app.stryvv.com` (Cloudflare DNS record pointing at Vercel, added as a Vercel domain). Inbound mail for `support@stryvv.com`.
- **Design:** the first real screens built with the Stryvv Design System (Manrope and Figtree, teal and navy tokens).

## Constraints
- **Auth is the front door to everyone's financial data.** It goes in the careful lane, follows the `data-security` skill, and is tested end to end.
- **No secrets in the repo.** The Resend SMTP password lives only in Supabase's dashboard.
- **Phone numbers and emails are personal data:** never logged, and never sent to OpenAI.
- **Mobile-first and accessible:** 16px inputs, real labels, errors that say how to fix them, and touch targets of 44px or more.
- **Built so a native app can reuse the same backend later.** Supabase Auth's standard flows only; no web-only tricks.

## Out of scope
- The onboarding chat, home screen and partner invite screens.
- Opening signup from the landing page (a one-line switch once onboarding is ready).
- Text-message verification or reminders.
- Social sign-in (Google, Apple) and passkeys.
- Writing the actual Terms of Service and Privacy Policy (needs a lawyer). The links point to placeholder pages until then.

## Decisions (2026-10-14)
- Returning people sign in with **email and password**, plus forgot-password by emailed code.
- **Collect the mobile number now, verify it later.**
- **Signup stays hidden** until onboarding is ready; verified people see a welcome placeholder.
- **Send auth emails through Resend** from Stryvv's domain.
- **Sender address: `support@stryvv.com`**, so replies reach someone. The domain's DNS already has Resend's sending records (DKIM at `resend._domainkey`, SPF and bounce MX on `send.stryvv.com`, DMARC `p=quarantine`), checked 2026-10-14. Confirm in the Resend dashboard that it shows as verified.
- **The app lives at `app.stryvv.com`.** `stryvv.com` stays the separate marketing site. Email links, Supabase's site URL and allowed redirect URLs all use `app.stryvv.com` (plus `localhost:3000` for development).
- **Passwords: at least 8 characters.** No breached-password check for now.
- **Code and resend limits: Supabase's defaults.**

## Open questions
- **`stryvv.com` can't receive email yet.** It has no MX record, so a reply to `support@stryvv.com` would bounce. Needs inbound mail before launch, for example Cloudflare Email Routing forwarding `support@` to Jordan's inbox (free, since the domain's DNS is on Cloudflare). Carried into the spec as a prerequisite.
