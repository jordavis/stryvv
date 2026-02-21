import {
  Zap,
  BarChart3,
  Users,
  Shield,
  Workflow,
  Globe,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    icon: Workflow,
    title: "Workflow Automation",
    description:
      "Build automated workflows with a visual drag-and-drop editor. No code required.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description:
      "Live dashboards that update instantly. Track KPIs, spot trends, and make data-driven decisions.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Shared workspaces, real-time editing, and smart notifications that keep everyone in sync.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "SOC 2 compliant with end-to-end encryption, SSO, and granular access controls.",
  },
  {
    icon: Zap,
    title: "Instant Integrations",
    description:
      "Connect 200+ tools in one click. Sync data across your entire stack effortlessly.",
  },
  {
    icon: Globe,
    title: "Global Scale",
    description:
      "Edge-deployed infrastructure with 99.99% uptime. Fast everywhere, for every team member.",
  },
]

export function Features() {
  return (
    <section id="features" className="border-y bg-muted/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Built for modern teams
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Powerful features that work together to multiply your output.
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
