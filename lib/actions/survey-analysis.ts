"use server"

import OpenAI from "openai"
import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { SURVEY_QUESTIONS } from "@/lib/constants/survey-questions"
import type { SurveyAnswers } from "@/lib/types/survey"

// ---------------------------------------------------------------------------
// System prompt for the OpenAI call
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are the Stryvv AI Coach, guiding couples toward greater financial harmony.
You've been given survey responses from two partners. Your job is to produce a Couples Alignment Snapshot — a clear, encouraging, and fun summary of their current money mindsets.

How to Interpret Responses:
- Celebrate alignment: Call it out naturally with light praise (e.g., "Great to see you both on the same page about…").
- Highlight differences as opportunities: Frame them as areas where more conversation could bring clarity and strength ("Here's an opportunity to find balance together").
- Avoid judgment: Never call one choice "better" than another. Instead, focus on balance, complementarity, and opportunities for alignment.
- Stay warm and constructive: The tone should feel like a friendly, insightful coach — not clinical or overly formal.

Context for Key Survey Areas:
- Finances Setup → reveals structure and engagement.
- Money Style → saver, spender, avoider, optimizer, etc.
- Shapes Personality Test:
  - Square → structured, detail-oriented, predictability
  - Circle → relationship-focused, empathetic, alignment with others, harmony
  - Triangle → goal-driven, decisive, purpose-driven, understand goals and reasons
  - Squiggle → creative, spontaneous, visionary, expression and exploration, sense of freedom
- Goals & Priorities → stability, upgrades, debt payoff, etc.
- Money Conversations → frequency + tone = comfort & communication style.
- Challenges → emotional and practical hurdles.
- Wins & Memories → positivity, what's working.
- Learning Style & Satisfaction → guides future coaching.

Celebrate strengths first, gently call out blind spots, and highlight how differences may complement each other.

Structure of the Output — use numbered sections with emojis:

🔑 1. How You Manage Money
🧠 2. Money Styles (self-assessment AND partner assessment separately)
🌈 3. Personality Types (shapes)
💡 4. Current Financial Challenge
🏆 5. Recent Financial Win
🎯 6. Alignment on Goals
🌟 7. Wins & Memories
✅ 8. Next Steps

For each section show both partners' answers then a ➡️ callout (vary the label: "➡️ Strength:", "➡️ Opportunity for growth:", "➡️ Insight:" etc.)

Next Steps section must end with: "You've already taken a huge step by reflecting individually — now it's time to explore your alignment together with Stryvv. Find a moment to talk through your Couples Alignment Snapshot with your partner. Pick a relaxed, non-rushed time, create a calm environment, and remember: the goal is connection, not decision-making."

Important rules:
- Only use actual data provided — never invent or infer missing responses.
- If a field is blank, note it as "(no response provided)" or skip that insight.
- Frame differences as "opportunities for alignment," never as problems.
- Use warm, couple-friendly language throughout.
- Output formatted markdown with headings, bullet points, and bold highlights.`

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function serializeAnswer(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (Array.isArray(value)) return value.join(", ")
  return String(value)
}

function buildPartnerText(
  label: string,
  response: SurveyAnswers & { user_id: string }
): string {
  const partnerType = serializeAnswer(response.q6_partner_type)
  const nickname = serializeAnswer(response.q5_nickname)
  const header = `Partner ${label} (${partnerType} - ${nickname}):`
  const lines = SURVEY_QUESTIONS.map(({ fieldKey, question }) => {
    const answer = serializeAnswer(response[fieldKey as keyof SurveyAnswers])
    return `- ${question}: [ANSWER: ${answer || "(no response provided)"}]`
  })
  return [header, ...lines].join("\n")
}

function markdownToHtml(md: string): string {
  let html = md
  // Escape any raw HTML characters from user content before processing markdown
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
  return html
    // headings
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // bullet points
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    // wrap consecutive <li> blocks in <ul>
    .replace(/(<li>[^]*?<\/li>\n?)+/gm, (match) => `<ul>${match}</ul>`)
    // newlines → <br> (preserve spacing between non-tag lines)
    .replace(/\n/g, "<br>\n")
}

// ---------------------------------------------------------------------------
// Main exported action
// ---------------------------------------------------------------------------
export async function sendSurveyAnalysis(
  householdId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { data: callerProfile, error: callerError } = await supabase
      .from("profiles")
      .select("household_id")
      .eq("id", user.id)
      .single()

    if (callerError || !callerProfile || callerProfile.household_id !== householdId) {
      throw new Error("You do not have permission to access this household")
    }

    // 1. Fetch profiles in the household ordered by created_at ASC
    //    First profile = partner1 (creator), second = partner2 (joiner)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, created_at, first_name")
      .eq("household_id", householdId)
      .order("created_at", { ascending: true })

    if (profilesError) throw new Error(profilesError.message)
    if (!profiles || profiles.length < 2) {
      throw new Error("Both partners must be in the household before sending analysis")
    }

    const [partner1Profile, partner2Profile] = profiles

    // 2. Fetch survey responses for both partners
    const { data: responses, error: responsesError } = await supabase
      .from("survey_responses")
      .select("*")
      .eq("household_id", householdId)
      .in("user_id", [partner1Profile.id, partner2Profile.id])

    if (responsesError) throw new Error(responsesError.message)
    if (!responses || responses.length < 2) {
      throw new Error("Both partners must complete the survey before sending analysis")
    }

    const partner1Response = responses.find((r) => r.user_id === partner1Profile.id) as
      | (SurveyAnswers & { user_id: string })
      | undefined
    const partner2Response = responses.find((r) => r.user_id === partner2Profile.id) as
      | (SurveyAnswers & { user_id: string })
      | undefined

    if (!partner1Response || !partner2Response) {
      throw new Error("Could not match survey responses to partners")
    }

    // 3. Look up both partners' emails via admin client
    const admin = createAdminClient()

    const [{ data: user1Data, error: user1Error }, { data: user2Data, error: user2Error }] =
      await Promise.all([
        admin.auth.admin.getUserById(partner1Profile.id),
        admin.auth.admin.getUserById(partner2Profile.id),
      ])

    if (user1Error) throw new Error(`Could not fetch partner 1 email: ${user1Error.message}`)
    if (user2Error) throw new Error(`Could not fetch partner 2 email: ${user2Error.message}`)

    const partner1Email = user1Data.user?.email
    const partner2Email = user2Data.user?.email

    if (!partner1Email || !partner2Email) {
      throw new Error("Could not retrieve email addresses for both partners")
    }

    // 4. Build the OpenAI user message
    const partner1Text = buildPartnerText("1", partner1Response)
    const partner2Text = buildPartnerText("2", partner2Response)
    const userMessage = `${partner1Text}\n\n${partner2Text}`

    // 5. Call OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    })
    const snapshot = completion.choices[0].message.content ?? ""

    // 6. Save snapshot to DB
    await admin.from("snapshots").upsert({
      household_id: householdId,
      content: snapshot,
      updated_at: new Date().toISOString(),
    }, { onConflict: "household_id" })

    // 7. Convert markdown to HTML and send via Resend
    const htmlContent = markdownToHtml(snapshot)
    const resend = new Resend(process.env.RESEND_API_KEY)

    const emailResults = await Promise.allSettled([
      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: partner1Email,
        subject: "Your Couples Alignment Snapshot is ready",
        html: htmlContent,
      }),
      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: partner2Email,
        subject: "Your Couples Alignment Snapshot is ready",
        html: htmlContent,
      }),
    ])

    const failed = emailResults.filter((r) => r.status === "rejected")
    if (failed.length > 0) {
      console.error("[sendSurveyAnalysis] Email delivery failed:", failed)
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[sendSurveyAnalysis]", message)
    return { success: false, error: message }
  }
}
