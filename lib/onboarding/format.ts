const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

/** A goal's amount and date as short chips: "$6,000", "by Oct 2027". */
export function formatGoalDetails(goal: { targetAmount: number | null; targetDate: string | null }): string[] {
  const details: string[] = []
  if (goal.targetAmount !== null) details.push(money.format(goal.targetAmount))
  if (goal.targetDate) {
    const date = new Date(`${goal.targetDate}T12:00:00`)
    details.push(`by ${date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`)
  }
  return details
}
