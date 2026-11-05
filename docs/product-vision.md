# Stryvv product vision

Author: Jordan Davis. Date: 2026-10-01. Status: draft.

## What Stryvv is

Stryvv helps people find the money behaviors that hold them back and change them. It works first for the individual, then for the couple. Couples are the main audience, but nobody needs a partner to get value. A partner can be added at any time.

## Product principles

- **Mobile-first.** Phone is the primary device. Desktop is secondary.
- **Extremely easy and intuitive.** Users shouldn't have to learn anything.
- **Chat over forms.** Onboarding happens in one concise chat, not a separate survey or a multi-step flow.
- **Individual first, couple second.** A single person gets the full core experience. Adding a partner unlocks the couple layer and doesn't gate anything.

## The three pillars

1. **Money history.** Understand and record how you grew up with money and the money story you tell yourself, because that story drives what you do today.
2. **Dreams and goals.** Understand what you want from life, focused on the parts money can affect.
3. **Behavior alignment.** Bring your day-to-day money behavior in line with the values you want to live by. Work past the parts of your money history, and the current habits, that stand between you and those goals.

## Outcomes we want to track

| Outcome | Individual | Couple |
|---|---|---|
| Financial health: stress about your financial situation | ✓ | ✓ |
| Financial happiness: progress toward your goals | ✓ | ✓ |
| Behavior alignment: behavior matches stated intent | ✓ | ✓ |
| Couple alignment: on the same page, fewer fights and disagreements | | ✓ |
| Financial progress | ✓ | ✓ |
| Financial literacy and confidence | ✓ | ✓ |

## Decisions

| Date | Decision |
|---|---|
| 2026-10-01 | **Signup is step one.** The chat starts after an account exists, which keeps data simple. |
| 2026-10-01 | **Outcomes are measured both quantitatively and qualitatively.** See [measurement-framework.md](measurement-framework.md). |
| 2026-10-01 | **Partners choose what they share, and sharing everything is the default.** The product teaches that the couples happiest with money are open and grow together. |
| 2026-10-01 | **Platform: an installable PWA optimized for phones.** Native App Store apps come later, so avoid choices that make that move harder. |
| 2026-10-01 | **Fresh start.** All current users are test accounts, so there's no data migration and the schema can be redesigned. |
| 2026-10-01 | **After onboarding: a home screen with an "Ask Stryvv about your finances" chat bar at the top, plus key modules.** See Home screen below. |
| 2026-10-01 | **Data integrations are added over time,** ranked by complexity, cost and user value. MX is available at no cost, so it's the first aggregator to try. Other candidates: Plaid, Flex, Spinwheel, Method, payroll providers. |
| 2026-10-01 | **Budgeting tools (YNAB, Copilot, Monarch, ...): collect data manually in v1.** Show a "Connect" button anyway and count clicks to gauge demand before building any integration. |
| 2026-10-01 | **Reminders: email is an acceptable fallback** when web push isn't available. |
| 2026-10-01 | **Light and dark themes are both first-class.** The app follows the phone's setting by default, with a manual override in settings. Tokens for both live in the Stryvv Design System. |
| 2026-11-04 | **Lessons start on Skool; the app is where people act on them.** Lessons are taught in a Skool community first, and people use the Stryvv app to put what they learned into practice (goals, commitments, check-ins). The lessons move into the app later. |
| 2026-11-04 | **Stryvv's own score.** The Stryvv Score (Security, Satisfaction, Alignment, and Unity for couples) replaces the CFPB well-being score as the headline number. Milestones such as an emergency buffer and debt are tracked separately. See [measurement-framework.md](measurement-framework.md). |

## Home screen

The chat bar sits at the top ("Ask Stryvv about your finances"), with suggested prompts. Below it are these modules:

1. **What you're working toward:** rich-life targets and next steps (pillar 2).
2. **Your money data:** connect bank accounts and other financial systems through aggregators, and payroll later. Manual entry until those connections exist.
3. **Behaviors** (working name; rebrand to something positive and exciting): the changes the user is actively working on (pillar 3).
4. **Learning:** short, interactive lessons from the best available sources. At first these live on Skool and the module links out to them; the in-app version below comes later. They start high-level across all topics, and the user can drill deeper in any topic until the content runs out. At the deepest level, the user can talk to an expert or get book recommendations on that topic.
5. **Financial health scores:** the headline numbers from the measurement framework.
6. **Upload documents:** tax returns, pay stubs and similar, to capture data that bank statements don't show.

## Open questions

- Rebrand name for "Behaviors."
- Learning content: do we license it, curate links to it, or write our own lessons with AI help and cite sources? Who are the "experts" at the deepest level?
- **Skool integration (future, once there's demand).** Skool offers a REST API and an MCP server, but both need its VIP plan at $69/month (as of 2026-11-04, per [Skool's recording](https://www.skool.com/skool-extensions/skool-api-skool-mcp-recording)). Worth scoping when lessons are in use: for example, showing a finished Skool lesson in Stryvv and prompting the matching commitment.
