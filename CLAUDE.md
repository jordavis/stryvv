# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server (localhost:3000)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

There is no test suite configured.

## Architecture

**Stryvv** is a Next.js 16 App Router app for couples aligning on financial goals. Built with TypeScript, Tailwind CSS v4, shadcn/ui, and Supabase (auth + PostgreSQL).

### Key Flows

1. **Landing** (`/`) → **Signup/Login** → **Survey** (`/survey/[step]`) → **Onboarding** (`/onboarding`) → **Connected** (household created)
2. **Partner join**: `/invite/[code]` → joins existing household

### Auth

- Supabase SSR auth via `@supabase/ssr`
- `proxy.ts` (root) is the Next.js middleware — refreshes sessions and protects routes
- Auth callback at `/auth/callback` exchanges code for session and creates profile on first login
- Public routes: `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback`, `/survey/*`, `/invite/*`

### Survey Wizard

- 6-step form at `/survey/[step]` (dynamic route)
- State managed by `SurveyContext` (`lib/context/survey-context.tsx`) using `useReducer` + `localStorage` (key: `stryvv_survey`)
- Cannot skip ahead past `highestStep`; can navigate backward freely
- Zod schemas in `lib/validations/survey.ts`; types in `lib/types/survey.ts`

### Supabase Clients

| File | Use |
|------|-----|
| `lib/supabase/server.ts` | Server Components, Server Actions, Route Handlers |
| `lib/supabase/client.ts` | Client Components (`"use client"`) |

### Server Actions

- `lib/actions/survey.ts` — `saveSurveyResponse()`: persists survey answers to `survey_responses` table
- `lib/actions/onboarding.ts` — `createHousehold()` (generates 6-char nanoid invite code) and `joinHousehold(inviteCode)`

### Database Tables

- `profiles` — `household_id`, `first_name`, `last_name`, linked to Supabase auth user
- `households` — `invite_code` (6-char uppercase)
- `survey_responses` — all answers, linked to user + household

### Component Organization

- `components/ui/` — shadcn/ui primitives (New York style, stone base color)
- `components/landing/` — marketing page sections
- `components/survey/` — wizard steps (`Step1Form`–`Step6Form`), `ShapeRanker`, `SurveyProgress`
- `components/onboarding/` — `OnboardingClient`, `InvitePanel`, `ConnectedPanel`

### Styling

- Tailwind CSS v4 — config is via `@tailwindcss/postcss` in `postcss.config.mjs`, no `tailwind.config.js`
- `cn()` helper in `lib/utils.ts` (clsx + tailwind-merge)
- Brand: dark blue `#0b2545` header

### Path Aliases

`@/*` maps to the project root (e.g., `@/lib/utils`, `@/components/ui/button`).

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```
