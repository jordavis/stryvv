import {
  Brain,
  Heart,
  MessageCircle,
  Target,
  BarChart3,
  Users,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    icon: Brain,
    title: "Money Mindset Profiles",
    description:
      "Discover your financial personality — Optimizer, Dreamer, Worrier, or Avoider — and what it means for how you handle money.",
  },
  {
    icon: Users,
    title: "Couples Comparison",
    description:
      "See your results side-by-side with your partner's. Understand where you naturally align and where your differences create friction.",
  },
  {
    icon: MessageCircle,
    title: "Conversation Starters",
    description:
      "Get personalized prompts designed to open up productive money conversations — not arguments. Start talking, not fighting.",
  },
  {
    icon: Target,
    title: "Shared Goals Framework",
    description:
      "Map your financial priorities together. Identify what you both want and create a roadmap you're both excited to follow.",
  },
  {
    icon: BarChart3,
    title: "Financial Compatibility Score",
    description:
      "A clear picture of how compatible your money styles are, and practical advice for the gaps.",
  },
  {
    icon: Heart,
    title: "Built for Couples",
    description:
      "Every feature is designed for two. Stryvv works when both partners are engaged — and gently nudges when they're not.",
  },
]

export function Features() {
  return (
    <section id="features" className="border-y bg-muted/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to get financially aligned
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Stryvv gives couples the clarity, language, and tools to manage money as a team.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <feature.icon className="size-8 text-primary" />
                <CardTitle className="mt-2">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
