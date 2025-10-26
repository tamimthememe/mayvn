"use client"

import { Card } from "@/components/ui/card"
import { Check } from "lucide-react"

interface GoalSelectionProps {
  formData: any
  onUpdateData: (updates: any) => void
}

const GOALS = [
  { id: "growth", name: "Grow Followers", description: "Increase your audience size" },
  { id: "engagement", name: "Boost Engagement", description: "Get more likes, comments, shares" },
  { id: "sales", name: "Drive Sales", description: "Convert followers to customers" },
  { id: "brand", name: "Build Brand", description: "Establish brand authority" },
  { id: "content", name: "Save Time", description: "Automate content creation" },
  { id: "analytics", name: "Better Analytics", description: "Understand your audience" },
]

export function GoalSelection({ formData, onUpdateData }: GoalSelectionProps) {
  const toggleGoal = (goalId: string) => {
    const newGoals = formData.goals.includes(goalId)
      ? formData.goals.filter((g: string) => g !== goalId)
      : [...formData.goals, goalId]
    onUpdateData({ goals: newGoals })
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">What are your main goals? (Select at least one)</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GOALS.map((goal) => (
          <Card
            key={goal.id}
            onClick={() => toggleGoal(goal.id)}
            className={`p-4 cursor-pointer transition-all duration-200 border-2 ${
              formData.goals.includes(goal.id)
                ? "border-primary bg-primary/10"
                : "border-border/50 hover:border-primary/50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{goal.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
              </div>
              {formData.goals.includes(goal.id) && <Check className="w-5 h-5 text-primary flex-shrink-0" />}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
