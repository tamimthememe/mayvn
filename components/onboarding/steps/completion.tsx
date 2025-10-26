"use client"

import { Sparkles, CheckCircle2 } from "lucide-react"

interface CompletionProps {
  formData: any
  onUpdateData: (updates: any) => void
}

export function Completion({ formData }: CompletionProps) {
  return (
    <div className="space-y-8 text-center py-8">
      <div className="flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-2xl opacity-50"></div>
          <div className="relative bg-gradient-to-br from-primary to-accent p-4 rounded-full">
            <CheckCircle2 className="w-16 h-16 text-primary-foreground" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-3xl font-bold">You're All Set!</h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Welcome to Mayvn, {formData.fullName}! Your account is ready to go. Let's create some amazing content.
        </p>
      </div>

      <div className="bg-card/50 border border-primary/20 rounded-lg p-6 space-y-4 text-left">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          What's Next?
        </h3>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <span className="text-primary font-bold">1.</span>
            <span>Explore your dashboard and customize your preferences</span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary font-bold">2.</span>
            <span>Create your first campaign using our AI-powered wizard</span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary font-bold">3.</span>
            <span>Schedule posts and watch your engagement grow</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
