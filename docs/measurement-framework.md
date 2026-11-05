# Measurement framework

Author: Jordan Davis. Date: 2026-10-01, updated 2026-11-04. Status: draft for discussion.

How Stryvv measures whether people's financial lives are getting better. This is a companion to [product-vision.md](product-vision.md).

## Principles

1. **One headline score of our own, built from proven items where they fit.** The Stryvv Score (below) measures what Stryvv works on, which no published scale covers. It borrows validated items word for word where they fit, and keeps every raw answer so the formula can be improved later. Use validated instruments as they are for the deeper, occasional reads (self-efficacy, literacy).
2. **Asking has to cost the user almost nothing.** Every measurement is a chat turn, not a form. Weekly asks take under 30 seconds. Longer instruments run rarely.
3. **Take a baseline at onboarding.** Without a before, there is no after. The onboarding chat captures a minimal baseline, and the rest fills in over the first two weeks.
4. **Show users their own progress.** Every metric we collect should come back to the user as a trend or insight. If we can't show it back, we shouldn't ask it.
5. **Measure couples as two people plus a gap.** Each partner answers the same items on their own. The couple metric is the trend in both scores *and* the gap between them.
6. **Compare people only with their own past.** No percentiles, rankings or "average user" scores: a score people compare becomes another thing to chase. The one comparison we show is between partners, as a gap to talk about.
7. **Keep feelings and facts apart.** The Stryvv Score measures how money feels; milestones measure what's true. They're never blended into one number. The gap between them is what the coach works with: feeling secure with no savings is a blind spot, and feeling anxious with six months saved is a sign of not knowing what's "enough".

## The Stryvv Score

Decided 2026-11-04: Stryvv uses its own 0–100 score instead of the CFPB Financial Well-Being score. The CFPB score needs the person's age, which we don't collect, and only measures well-being. The parts were tested against the core ideas of Ramit Sethi (*Money for Couples*), Morgan Housel (*The Psychology of Money*, *The Art of Spending Money*), Dave Ramsey (*The Total Money Makeover*) and Arthur C. Brooks (*Build the Life You Want*, *The Meaning of Your Life*, his Atlantic columns); each part is central to at least two of them.

| Part | What it asks | Grounded in |
|---|---|---|
| **Security** | Are your basic needs covered, now and later? | Ramsey's emergency fund and debt-free steps; Housel's room for error and independence |
| **Satisfaction** | Is what you have enough, and can you rest easy? | Brooks: satisfaction = what you have ÷ what you want; Housel's "enough" and "does this help me sleep at night?" |
| **Alignment** | Does your spending match what matters to you? | Housel: spending reveals values; Sethi's conscious spending; Ramsey's monthly budget |
| **Unity** (people in a relationship) | Are you and your partner on the same page? | Sethi's shared rich life; Ramsey's spouses as a team; Brooks: other people are what make money bring happiness |

Every part counts equally and has its own ring. A low part doesn't hold the others back: someone still building Security can score well on Satisfaction and Alignment.

### Items (version 1)

Two items per part, asked in this order. First comes "Are you married or in a relationship?" (Yes / No, stored as `profiles.in_relationship`). Everyone answers items 1–6; items 7–8 are asked only of people who say yes. They're about how the person sees their partner, so they work before the partner joins Stryvv. Every item is "How well does this describe you?" with five tap answers: Completely · Very well · Somewhat · Very little · Not at all, stored 0–4 in that order (0 = Completely).

| # | Part | Metric | Item | Source |
|---|---|---|---|---|
| 1 | Security | `security_shock` | "I could handle a major unexpected expense." | CFPB, word for word |
| 2 | Security | `security_future` | "I am securing my financial future." | CFPB, word for word |
| 3 | Satisfaction | `satisfaction_enough` | "What I have is enough for me." | Ours (Brooks, Housel) |
| 4 | Satisfaction | `satisfaction_sleep` | "My money choices let me sleep well at night." | Ours (Housel) |
| 5 | Alignment | `alignment_values` | "My spending reflects what matters to me." | Ours (Housel, Sethi) |
| 6 | Alignment | `alignment_tracking` | "I know where my money goes each month." | Ours (Ramsey, Sethi) |
| 7 | Unity | `unity_same_page` | "My partner and I are on the same page about money." | Ours (Sethi, Ramsey) |
| 8 | Unity | `unity_shared_vision` | "We're working toward a shared picture of our rich life." | Ours (Sethi) |

### Scoring (version 1)

1. Turn each answer into 0–100: Completely 100 · Very well 75 · Somewhat 50 · Very little 25 · Not at all 0 (that is, (4 − stored answer) × 25).
2. Each part = the average of its two items (`score_security`, `score_satisfaction`, `score_alignment`, `score_unity`).
3. **Stryvv Score** (`stryvv_score`) = the average of the parts the person has: three for someone on their own, four for someone in a relationship. If that changes later (a new relationship, or a breakup), what the score is made of changes too, so trends mark where Unity started or stopped counting rather than comparing across that point.
4. Round only when storing: the parts and the total are each stored as whole numbers (halves round up), and the total is computed from the unrounded parts.
5. Store `stryvv_score_version` = 1 with every score. If the formula changes, raise the version and recompute old scores from the stored answers.

Example, on your own: Security answers Very well and Somewhat (62.5), Satisfaction Very little and Somewhat (37.5), Alignment Completely and Very well (87.5). Stored parts: 63, 38 and 88. Stryvv Score: (62.5 + 37.5 + 87.5) ÷ 3 = 62.5, stored as 63.

Example, in a relationship: the same answers plus Completely on both Unity items give Unity 100 and a Stryvv Score of (62.5 + 37.5 + 87.5 + 100) ÷ 4 = 71.875, stored as 72.

### Couples

Each partner answers all eight items on their own. The couple view shows both scores, each part side by side, and the gap per part, as the start of the alignment measures in area 6.

## Milestones (the facts)

Tracked separately from the Stryvv Score and never blended into it (principle 7). Self-reported at first; connected accounts (the MX integration) can fill several automatically later. Not part of onboarding.

| Milestone | Measured as | Championed by |
|---|---|---|
| Emergency buffer | Months of essential expenses covered | Ramsey, Housel (room for error) |
| Debt carried over | Debt carried from month to month, other than a mortgage: yes or no, and how much, by type | Ramsey, Brooks |
| Investing for the future | Share of income saved or invested | Ramsey, Sethi, Housel |
| Guilt-free spending | A set guilt-free amount each month: yes or no | Sethi |
| Money dates (couples) | Money talks held this month (see area 6) | Sethi, Ramsey |
| Giving (optional) | Gave to people or causes this month | Ramsey, Brooks |
| Net worth trend | Derived from the above (optional; some users won't want to enter it) | |

## Measurement areas

### 1. Financial health
| Measure | Instrument | Cadence |
|---|---|---|
| Overall financial health | **Stryvv Score** (above): 6 items, or 8 for people in a relationship, 0–100, with a ring per part | Baseline, then monthly |

### 2. Confidence and literacy
| Measure | Instrument | Cadence |
|---|---|---|
| Financial confidence | **Financial Self-Efficacy Scale** (Lown, 6 items) | Baseline, then quarterly |
| Financial literacy | **"Big Three"** literacy questions (Lusardi & Mitchell), plus knowledge checks once lessons move into the app (lessons start on Skool; see the product vision) | Baseline, then as lessons are completed |

### 3. Behavior change (the core of pillar 3)
A **commitment** is a specific behavior the user chooses with the coach, tied to a value or goal. Example: "Takeout max 2×/week, because I want the Japan trip."
| Measure | How | Cadence |
|---|---|---|
| Commitment adherence | Weekly chat check-in: "How many times did you get takeout this week?" Gives an adherence % per commitment | Weekly |
| Category spending | User's own estimate for the targeted category (v1). Actual transactions once accounts are connected (later) | Weekly / monthly |
| Values alignment | "This week my spending reflected what matters to me" (1–7) | Weekly |

### 4. Financial position
See **Milestones** above.

### 5. Rich life progress (pillar 2)
| Measure | How | Cadence |
|---|---|---|
| Goal progress | Each goal has a target (amount or milestone) and a current value, giving % complete and on-track/behind | Updated at monthly check-in |
| Vision clarity | "How clear are you on what a rich life looks like for you?" (1–10). Rises as pillar 2 work is done | Quarterly |

### 6. Couple alignment (only once a partner joins)
| Measure | How | Cadence |
|---|---|---|
| Money check-ins held | Logged "money dates" (with each other, or guided by Stryvv), with a streak and frequency | Logged as they happen |
| Money conflict | "How many money disagreements did you have this week?" + "How did they end?" (resolved / unresolved) | Weekly |
| Wedge ↔ bond | "Right now money feels like something that… pulls us apart (1) ↔ brings us together (7)" | Monthly |
| Alignment gap | Difference between partners' answers on the same items: goals ranking, Stryvv Score parts, wedge/bond. Computed, never asked | Derived |
| Shared goals | Count and progress of goals both partners have adopted | Derived |

## Proposed cadence (what the user actually experiences)

- **Onboarding (in chat, about a minute of measurement):** the relationship question and the Stryvv Score's six items, or eight for people in a relationship. Self-efficacy and literacy are spread over the first week.
- **Weekly pulse (~30 sec, in chat):** commitment adherence, values alignment; plus conflict for couples.
- **Monthly check-in (~3 min):** the Stryvv Score's items, milestones, goal progress; plus wedge/bond for couples. Good to pair with a couple's money date.
- **Quarterly review:** self-efficacy and vision clarity, plus a coach-written "then vs. now" story.

## Headline numbers shown to users

Show only a few, so the home view stays simple:
1. **Stryvv Score** (0–100, with a ring each for Security, Satisfaction, Alignment and, for people in a relationship, Unity): the overall number.
2. **Commitments kept** (% this month): is behavior actually changing?
3. **Rich life progress**: goals on track.
4. **Couple alignment** (couples only): mainly the wedge/bond trend and the gap.

## Open questions

- **Bank connection:** self-report keeps v1 simple and private, but real spending and milestone data needs a connection. An MX integration is being explored (November 2026); it brings cost, security review and compliance.
- **Licensing:** confirm terms for Lown's self-efficacy scale before shipping it. The two CFPB items in the Stryvv Score are public domain.
- **Is the Stryvv Score any good?** It isn't validated. Once a few hundred people have taken it, check that each part's two items agree with each other, that the score moves when people's lives improve, and whether any item adds nothing. Until then, don't publish claims based on it. Version 2 can reweight or swap items; stored answers let us recompute.
- **Joy.** Sethi's guilt-free spending ("I spend on the things I love without guilt") is covered only by the guilt-free milestone. It's the first candidate for a third Satisfaction item if version 2 allows one.
- **The name.** "Stryvv Score" is a working name. The landing page currently promises a couples "Financial Compatibility Score", which the couple view could become.
- **Reminders:** weekly pulses need a nudge. PWA web push works on iOS only once the app is installed to the home screen. Is email an acceptable fallback?
- **Research use:** do we ever want to publish aggregate outcomes ("Stryvv couples report 30% less money conflict")? If so, collect consent at signup.
