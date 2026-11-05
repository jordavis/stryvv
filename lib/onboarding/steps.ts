// The onboarding sequence: three steps, and the topics inside the two chat steps.
// The server, not the model, decides which topic comes next (see flow.ts).

export type ChatStepId = "story" | "rich"
export type StepId = ChatStepId | "baseline"

export type Topic = {
  id: string
  /** Shown in the header: "Money history · 2/4". */
  label: string
  /** What the coach should learn in this topic (goes into the system prompt). */
  focus: string
  /** The coach's opening question for the topic. */
  opening: string
  /** A short example answer, so people know how much to say. */
  example: string
  /** Tap-to-answer chips. People can tap any number, type instead, or both. */
  chips?: string[]
}

export type ChatStep = {
  id: ChatStepId
  number: 1 | 3
  title: string
  /** The header's topic prefix: "Money history". */
  section: string
  /** The one-tap shortcut under the message box. */
  shortcut: string
  topics: Topic[]
}

export const STORY_STEP: ChatStep = {
  id: "story",
  number: 1,
  title: "Your money story",
  section: "Money history",
  shortcut: "Nothing comes to mind",
  topics: [
    {
      id: "growing-up",
      label: "Growing up",
      focus: "how money worked in the home they grew up in: who handled it, whether it was tight or comfortable, whether anyone talked about it",
      opening: "Let's start where your money story started. What was money like in the home you grew up in?",
      example: "Money was tight and nobody talked about it. Dad paid the bills and Mom stretched the groceries.",
    },
    {
      id: "feelings-rules",
      label: "Feelings and rules",
      focus: "how money felt to them as a kid, and the unspoken rules about money they picked up",
      opening: "How did money feel back then, and what unspoken rules about it did you pick up?",
      example: "It felt stressful. The rule was: never ask for anything, and don't spend on yourself.",
      chips: [
        "Stressful",
        "Secure",
        "Never talked about",
        "Something to fight about",
        "Scarce",
        "Plentiful",
        "Something to be ashamed of",
        "Exciting",
      ],
    },
    {
      id: "carry-today",
      label: "What you carry",
      focus: "which patterns or beliefs from their upbringing they still notice in themselves today",
      opening: "Which of those patterns or beliefs do you still notice in yourself today?",
      example: "I still feel guilty buying anything for myself, even when we can afford it.",
    },
    {
      id: "win",
      label: "A win",
      focus: "a money win they're proud of, big or small",
      opening: "Tell me about a money win you're proud of, big or small.",
      example: "Paying off my car without any help.",
    },
  ],
}

export const RICH_STEP: ChatStep = {
  id: "rich",
  number: 3,
  title: "Your rich life",
  section: "Rich life",
  shortcut: "Not right now",
  topics: [
    {
      id: "vision",
      label: "Your vision",
      focus: "what a rich life looks like for them, in concrete everyday terms, focused on what money can affect",
      opening:
        "Picture your life a few years from now, going really well. What does a rich life look like for you?",
      example: "Weekends free with the kids, a trip to Japan every couple of years, and not checking prices at the grocery store.",
    },
    {
      id: "first-goal",
      label: "A first goal",
      focus: "one goal that would move them toward that life, with an amount and a date only if they know them",
      opening: "What's one goal that would move you toward that life? If you know an amount or a date, add it.",
      example: "Save $6,000 for Japan by next fall.",
    },
  ],
}

export const CHAT_STEPS: Record<ChatStepId, ChatStep> = { story: STORY_STEP, rich: RICH_STEP }

export const STEP_TITLES: Record<StepId, string> = {
  story: STORY_STEP.title,
  baseline: "Where you are today",
  rich: RICH_STEP.title,
}

export const STEP_NUMBERS: Record<StepId, 1 | 2 | 3> = { story: 1, baseline: 2, rich: 3 }

/** The coach's message that opens a topic: the question plus an example answer. */
export function openingMessage(step: ChatStep, topicIndex: number, firstName?: string): string {
  const topic = step.topics[topicIndex]
  const intro =
    step.id === "story" && topicIndex === 0
      ? `Hi${firstName ? ` ${firstName}` : ""}! I'm your Stryvv coach. For the next few minutes I'll ask a few questions about your money story. There are no wrong answers, and you can skip anything.\n\n`
      : step.id === "rich" && topicIndex === 0
        ? "Now for the fun part: the life you want money to help you build.\n\n"
        : ""
  return `${intro}${topic.opening}\n\n*For example: "${topic.example}"*`
}
