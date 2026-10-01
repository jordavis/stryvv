## What and why

<!-- One or two sentences. -->

Work folder: <!-- docs/work/YYYY-MM-DD-slug, or "quick lane" -->

## Verification

```
<!-- paste the npm run check summary lines -->
```

- [ ] `npm run check` passes
- [ ] UI changes checked in the browser (desktop + mobile width)
- [ ] `plan.md` matches what was built (if there is one)

## Risk

- [ ] Touches auth, household data access, or RLS
- [ ] Changes database schema
- [ ] Changes what is sent to OpenAI or Resend
- [ ] Needs new env vars (added to `.env.example` and Vercel)
