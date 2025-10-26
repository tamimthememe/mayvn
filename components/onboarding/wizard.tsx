"use client"

import { useState } from "react"
import { ChevronRight, ChevronLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AccountSetup } from "./steps/account-setup"
import { PlatformPreferences } from "./steps/platform-preferences"
import { SocialConnections } from "./steps/social-connections"
import { GoalSelection } from "./steps/goal-selection"
import { Completion } from "./steps/completion"

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    company: "",
    role: "",
    platforms: [] as string[],
    goals: [] as string[],
    socialAccounts: {} as Record<string, string>,
  })

  const steps = [
    { title: "Account Setup", component: AccountSetup },
    { title: "Platform Preferences", component: PlatformPreferences },
    { title: "Social Connections", component: SocialConnections },
    { title: "Goals & Interests", component: GoalSelection },
    { title: "All Set!", component: Completion },
  ]

  const CurrentStepComponent = steps[currentStep].component

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleUpdateData = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  const isLastStep = currentStep === steps.length - 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card/30 to-background flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                    index < currentStep
                      ? "bg-primary text-primary-foreground"
                      : index === currentStep
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/50"
                        : "bg-card border border-border text-muted-foreground"
                  }`}
                >
                  {index < currentStep ? <Check className="w-5 h-5" /> : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300 ${
                      index < currentStep ? "bg-primary" : "bg-border"
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold">{steps[currentStep].title}</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
        </div>

        {/* Step content */}
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm p-8 mb-8">
          <CurrentStepComponent formData={formData} onUpdateData={handleUpdateData} />
        </Card>

        {/* Navigation buttons */}
        <div className="flex gap-4 justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center gap-2 bg-transparent"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          {!isLastStep && (
            <Button
              onClick={handleNext}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}

          {isLastStep && (
            <Button
              onClick={() => (window.location.href = "/dashboard")}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              Go to Dashboard
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Skip option */}
        {currentStep < steps.length - 1 && (
          <div className="text-center mt-4">
            <button
              onClick={() => setCurrentStep(steps.length - 1)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Skip to finish
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
