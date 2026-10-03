# Design references

Author: Jordan Davis. Date: 2026-10-01. Status: draft.

These are interaction patterns taken from a reference health app. Jordan likes the **interactions** in it. Its content and its crimson color scheme are **not** to be copied. Stryvv's visual identity (colors, type, components) lives in the **Stryvv Design System** in Claude Design: https://claude.ai/artifact/3YN9n22vGGKBZ3q1eZxVHj. The first screen mockups (signup, onboarding chat, home) are on the **Stryvv Core Screens** canvas: https://claude.ai/artifact/59SH5WnEdcQxGio7RjQ7ME

## Signup
- One centered card: first and last name side by side, then email and password, with password rules shown as helper text under the field.
- One consent checkbox (18+, Terms, Privacy). The primary button stays disabled until the form is valid.
- **Email verification uses a 6-digit code**, not a magic link. One large code input, "Resend code," and a hint to check spam.

## Onboarding chat
- Onboarding happens in a **modal/sheet that sits over the home screen**, so the user can see where they'll end up.
- **Header:** "STEP n OF N", the sub-topic with its own count ("Allergies · 1/4"), a section title, a progress bar, and **"Skip for now"** on every step.
- **The first message of each topic comes with an example answer** ("…penicillin, hives"), so people know how much detail to give.
- **Quick-reply chips** ("Tap any that apply, or just type below"). Users can tap chips or type freely; neither is required.
- **A one-tap "none" shortcut** sits under the input ("I have no known allergies"). An explicit "none" is recorded as different from never having been asked.
- **The AI asks short follow-ups one at a time** to fill in missing fields (year, frequency, age), then recaps.
- **A "Check these before we save them" review card:** each captured item becomes an editable card with attribute chips, "+ Add a note," edit (pencil) and remove (×). Options like Prescription / Not a prescription are toggle buttons.
- **The save button is sticky and says what it will save:** "Save 2 entries & continue." Below it is a free-text field, "Anything to change or add...", so corrections happen in plain language.
- **Structured pre-step:** simple numeric facts (height and weight there) use a short form step instead of chat. Use chat for open-ended topics and plain fields for simple numbers.

## Home (desktop)
- A large greeting headline with the **ask bar right under it** and 2 suggested-prompt chips.
- Module cards below it. An empty module still shows what it does and has one clear call to action ("Set a goal with…", "Connect wearable", "Upload a report").
- **First-run coach-mark tour** ("1 OF 4", Next / Skip tour) walks through the modules.

## Home (mobile)
- A large page title and section labels in small caps ("YOUR GOALS").
- **Goal card:** a goal in plain words, the data source and how long it has run, a big delta number, % to target, and a progress bar. "+ Add a goal" sits inside the same card.
- **Bottom tab bar** with 3 tabs, plus a **floating AI button** with a callout ("Chat with …") on first visit.
- **Metric tiles** in a 2-column grid: label, big number, status pill ("Normal"), and a trend line ("No change this week"). Score rings or gauges are used for composite scores.
- **Report card:** "Updated Sep 20 — labs, wearables and treatments, read together." For Stryvv this is the coach's periodic write-up.

## What maps to Stryvv
| Reference | Stryvv |
|---|---|
| Medical profile chat (allergies, conditions, treatments, family history) | Onboarding chat: money history, rich-life vision, baseline measures |
| Review cards before saving | Confirming captured money-history themes, goals and commitments |
| "I have no known X" | "Nothing comes to mind" / "Not right now" |
| Height/weight form step | Baseline numbers (savings, debt ranges) and the CFPB scale's 5 taps |
| Goal card with % to target | Rich-life goals |
| Biomarkers / optimization score | Financial Well-Being score and the other headline numbers |
| Wearables tiles | Money data tiles (from MX or manual entry) |
| Health report | Monthly or quarterly coach write-up |
