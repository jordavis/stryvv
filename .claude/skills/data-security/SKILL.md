---
name: data-security
description: Stryvv data-access and privacy rules. Use whenever writing or reviewing code that queries Supabase, adds a server action or API route, changes auth or proxy.ts, sends user data to OpenAI or Resend, logs anything, or changes database schema/RLS.
---

# Stryvv data security

Stryvv holds people's financial attitudes, history and goals. The core promise: **nobody can see another person's data**, except a linked partner, who sees only the categories that person is currently sharing.

The schema is in `supabase/migrations/` (see `CLAUDE.md` → Data).

## Rules

1. **Authenticate first.** Every server action and route handler starts with `supabase.auth.getUser()` from `lib/supabase/server.ts` and returns 401 / throws if there's no user. Never trust a user ID, owner ID or partnership ID from the request body.
2. **Scope by owner from the server.**
   Every row has an `owner_id`. Write only rows owned by the authenticated user. Read a partner's rows only through queries that RLS filters with `partner_sharing(category)`; never re-implement the sharing check in app code, and never copy one person's data into another person's rows. Transcripts (`conversations`, `messages`) are never shared.
3. **RLS is the backstop, not the plan.** Use the session client so RLS applies. Every new table gets RLS enabled, with policies scoped to `auth.uid()` and `partner_sharing()` (inside a scalar subquery, so it runs once per query), in the same migration that creates it, plus a pgTAP test in `supabase/tests/` showing a stranger reads nothing. Partnerships change only through the database functions (`create_invite`, `accept_invite`, `end_partnership`). Server-owned facts (timestamps, terms acceptance) are not client-writable: use column-level grants or a function. Run `npm run test:db` after any schema or policy change.
4. **A service-role client is a last resort.** There isn't one today; add it only if truly needed, as a server-only module. Only in server-only code, only when there's no user session (e.g. webhooks or background analysis), with a comment explaining why. Never import it from a `"use client"` file or anything under `components/`.
5. **Validate input with Zod** at every boundary (actions, routes), with size limits on free text (for chat, cap each message, e.g. `z.string().min(1).max(10000)`, and the number of messages per request).
6. **No PII or answers in logs.** Don't `console.log` chat content, money history, goals, check-in answers, emails, phone numbers or names. Log IDs and error codes.
7. **Minimize what goes to OpenAI.** Send only the fields the prompt needs. No emails, phone numbers or last names, and no other person's data beyond what RLS returns for the signed-in user. Build AI context through the session client, so the same sharing rules apply to what the coach sees. Treat model output as untrusted: render it through `markdownToHtml` in `lib/markdown.ts` (which escapes HTML), never through raw `dangerouslySetInnerHTML` of model text.
8. **Secrets stay server-side.** Only `NEXT_PUBLIC_*` vars may reach the browser. `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` and `RESEND_API_KEY` never appear in client code.
9. **Invite codes are bearer tokens.** Rate-limit or otherwise protect anything that looks them up, and never list them.

## When reviewing

For each rule above, check the diff. Report a violation as **Important** with the file:line and the rule number.
