# Measurement framework

Author: Jordan Davis. Date: 2026-10-01. Status: draft for discussion.

How Stryvv measures whether people's financial lives are getting better. This is a companion to [product-vision.md](product-vision.md).

## Principles

1. **Use validated instruments where they exist.** Make up our own items only where none fit, such as the couple-specific ones. Validated scales make the before/after numbers credible to users, and eventually to marketing and research partners.
2. **Asking has to cost the user almost nothing.** Every measurement is a chat turn, not a form. Weekly asks take under 30 seconds. Longer instruments run rarely.
3. **Take a baseline at onboarding.** Without a before, there is no after. The onboarding chat captures a minimal baseline, and the rest fills in over the first two weeks.
4. **Show users their own progress.** Every metric we collect should come back to the user as a trend or insight. If we can't show it back, we shouldn't ask it.
5. **Measure couples as two people plus a gap.** Each partner answers the same items on their own. The couple metric is the trend in both scores *and* the gap between them.

## Measurement areas

### 1. Financial well-being (qualitative, validated)
| Measure | Instrument | Cadence |
|---|---|---|
| Overall financial well-being | **CFPB Financial Well-Being Scale**, 5-item short form (public domain, gives a 0–100 score with national benchmarks) | Baseline, then monthly |
| Financial stress | Single-item pulse: "How stressed do you feel about money this week?" (1–10). Optionally the **InCharge Financial Distress/Financial Well-Being Scale** (8 items) for a deeper quarterly read | Weekly pulse; quarterly deep read |
| Money satisfaction | "How satisfied are you with your financial life right now?" (1–10) | Baseline, then monthly |

### 2. Confidence and literacy
| Measure | Instrument | Cadence |
|---|---|---|
| Financial confidence | **Financial Self-Efficacy Scale** (Lown, 6 items) | Baseline, then quarterly |
| Financial literacy | **"Big Three"** literacy questions (Lusardi & Mitchell), plus knowledge checks built into lessons | Baseline, then as lessons are completed |

### 3. Behavior change (the core of pillar 3)
A **commitment** is a specific behavior the user chooses with the coach, tied to a value or goal. Example: "Takeout max 2×/week, because I want the Japan trip."
| Measure | How | Cadence |
|---|---|---|
| Commitment adherence | Weekly chat check-in: "How many times did you get takeout this week?" Gives an adherence % per commitment | Weekly |
| Category spending | User's own estimate for the targeted category (v1). Actual transactions once accounts are connected (later) | Weekly / monthly |
| Values alignment | "This week my spending reflected what matters to me" (1–7) | Weekly |

### 4. Financial position (quantitative)
| Measure | How | Cadence |
|---|---|---|
| Savings / emergency fund | Self-reported balance or "months of expenses covered" | Monthly |
| Debt (non-mortgage) | Self-reported total, by type | Monthly |
| Net worth trend | Derived from the above (optional; some users won't want to enter it) | Monthly |

### 5. Rich life progress (pillar 2)
| Measure | How | Cadence |
|---|---|---|
| Goal progress | Each goal has a target (amount or milestone) and a current value, giving % complete and on-track/behind | Updated at monthly check-in |
| Vision clarity | "How clear are you on what a rich life looks like for you?" (1–10). Rises as pillar 2 work is done | Baseline, then quarterly |

### 6. Couple alignment (only once a partner joins)
| Measure | How | Cadence |
|---|---|---|
| Money check-ins held | Logged "money dates" (with each other, or guided by Stryvv), with a streak and frequency | Logged as they happen |
| Money conflict | "How many money disagreements did you have this week?" + "How did they end?" (resolved / unresolved) | Weekly |
| Wedge ↔ bond | "Right now money feels like something that… pulls us apart (1) ↔ brings us together (7)" | Monthly |
| Alignment gap | Difference between partners' answers on the same items: goals ranking, stress, satisfaction, wedge/bond. Computed, never asked | Derived |
| Shared goals | Count and progress of goals both partners have adopted | Derived |

## Proposed cadence (what the user actually experiences)

- **Onboarding (in chat, ~3 min of measurement):** CFPB 5-item, stress, satisfaction, vision clarity. Self-efficacy and literacy are spread over the first week.
- **Weekly pulse (~30 sec, in chat):** stress, commitment adherence, values alignment; plus conflict for couples.
- **Monthly check-in (~3 min):** CFPB 5-item, satisfaction, balances, goal progress; plus wedge/bond for couples. Good to pair with a couple's money date.
- **Quarterly review:** self-efficacy and the deep stress scale, plus a coach-written "then vs. now" story.

## Headline numbers shown to users

Show only a few, so the home view stays simple:
1. **Financial Well-Being score** (0–100, CFPB): the overall health number.
2. **Commitments kept** (% this month): is behavior actually changing?
3. **Rich life progress**: goals on track.
4. **Couple alignment** (couples only): mainly the wedge/bond trend and the gap.

## Open questions

- **Bank connection:** self-report keeps v1 simple and private, but real category-spending data needs a connection (e.g. Plaid). That brings cost, security review and compliance. Defer to v2?
- **Licensing:** confirm terms for Lown's self-efficacy scale and the InCharge scale before shipping them. CFPB is public domain.
- **Reminders:** weekly pulses need a nudge. PWA web push works on iOS only once the app is installed to the home screen. Is email an acceptable fallback?
- **Research use:** do we ever want to publish aggregate outcomes ("Stryvv couples report 30% less money conflict")? If so, collect consent at signup.
