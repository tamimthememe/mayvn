"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowRight, ArrowLeft, Check, Target, Users, Zap, Calendar } from "lucide-react"
import Link from "next/link"

export default function NewCampaignPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    objective: "",
    targetAudience: [] as string[],
    platforms: [] as string[],
    budget: "",
    duration: "",
    startDate: "",
  })

  const steps = [
    { title: "Campaign Basics", icon: Zap },
    { title: "Target Audience", icon: Users },
    { title: "Platforms", icon: Target },
    { title: "Budget & Timeline", icon: Calendar },
    { title: "Review", icon: Check },
  ]

  const objectives = [
    { id: "awareness", label: "Brand Awareness" },
    { id: "engagement", label: "Engagement" },
    { id: "conversion", label: "Conversions" },
    { id: "traffic", label: "Website Traffic" },
    { id: "leads", label: "Lead Generation" },
    { id: "sales", label: "Sales" },
  ]

  const audiences = [
    { id: "age-18-24", label: "18-24 years old" },
    { id: "age-25-34", label: "25-34 years old" },
    { id: "age-35-44", label: "35-44 years old" },
    { id: "age-45-54", label: "45-54 years old" },
    { id: "age-55+", label: "55+ years old" },
    { id: "students", label: "Students" },
    { id: "professionals", label: "Professionals" },
    { id: "entrepreneurs", label: "Entrepreneurs" },
  ]

  const platforms = [
    { id: "instagram", name: "Instagram", icon: "📷" },
    { id: "tiktok", name: "TikTok", icon: "🎵" },
    { id: "twitter", name: "Twitter/X", icon: "𝕏" },
    { id: "linkedin", name: "LinkedIn", icon: "💼" },
    { id: "facebook", name: "Facebook", icon: "f" },
    { id: "youtube", name: "YouTube", icon: "▶️" },
  ]

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

  const toggleAudience = (audienceId: string) => {
    setFormData((prev) => ({
      ...prev,
      targetAudience: prev.targetAudience.includes(audienceId)
        ? prev.targetAudience.filter((a) => a !== audienceId)
        : [...prev.targetAudience, audienceId],
    }))
  }

  const togglePlatform = (platformId: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter((p) => p !== platformId)
        : [...prev.platforms, platformId],
    }))
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.name && formData.description && formData.objective
      case 1:
        return formData.targetAudience.length > 0
      case 2:
        return formData.platforms.length > 0
      case 3:
        return formData.budget && formData.duration && formData.startDate
      default:
        return true
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm mb-2 inline-block"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold">Create New Campaign</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={i} className="flex items-center flex-1">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                      i <= currentStep
                        ? "bg-gradient-to-br from-primary to-accent border-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {i < currentStep ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300 ${
                        i < currentStep ? "bg-gradient-to-r from-primary to-accent" : "bg-border"
                      }`}
                    ></div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>

        {/* Form Content */}
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm p-8 mb-8">
          {/* Step 0: Campaign Basics */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold mb-2">{steps[0].title}</h2>
                <p className="text-muted-foreground">Let's start with the basics of your campaign</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Campaign Name</label>
                  <Input
                    placeholder="e.g., Summer Sale 2025"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-input border-border/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    placeholder="Describe your campaign goals and what you want to achieve..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-input border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Campaign Objective</label>
                  <div className="grid grid-cols-2 gap-3">
                    {objectives.map((obj) => (
                      <button
                        key={obj.id}
                        onClick={() => setFormData({ ...formData, objective: obj.id })}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                          formData.objective === obj.id
                            ? "border-primary bg-primary/10"
                            : "border-border/50 bg-card/50 hover:border-primary/50"
                        }`}
                      >
                        <span className="font-medium text-sm">{obj.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Target Audience */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold mb-2">{steps[1].title}</h2>
                <p className="text-muted-foreground">Who do you want to reach with this campaign?</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {audiences.map((audience) => (
                  <button
                    key={audience.id}
                    onClick={() => toggleAudience(audience.id)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-3 ${
                      formData.targetAudience.includes(audience.id)
                        ? "border-secondary bg-secondary/10"
                        : "border-border/50 bg-card/50 hover:border-secondary/50"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        formData.targetAudience.includes(audience.id)
                          ? "border-secondary bg-secondary"
                          : "border-border"
                      }`}
                    >
                      {formData.targetAudience.includes(audience.id) && (
                        <Check className="w-3 h-3 text-secondary-foreground" />
                      )}
                    </div>
                    <span className="font-medium text-sm">{audience.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Platforms */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold mb-2">{steps[2].title}</h2>
                <p className="text-muted-foreground">Which platforms do you want to use?</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {platforms.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                      formData.platforms.includes(platform.id)
                        ? "border-accent bg-accent/10"
                        : "border-border/50 bg-card/50 hover:border-accent/50"
                    }`}
                  >
                    <span className="text-3xl">{platform.icon}</span>
                    <span className="font-medium text-sm">{platform.name}</span>
                    {formData.platforms.includes(platform.id) && <Check className="w-4 h-4 text-accent absolute" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Budget & Timeline */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold mb-2">{steps[3].title}</h2>
                <p className="text-muted-foreground">Set your budget and campaign timeline</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Budget</label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      type="number"
                      placeholder="5000"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="bg-input border-border/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Campaign Duration</label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full bg-input border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Select duration</option>
                    <option value="1-week">1 Week</option>
                    <option value="2-weeks">2 Weeks</option>
                    <option value="1-month">1 Month</option>
                    <option value="3-months">3 Months</option>
                    <option value="6-months">6 Months</option>
                    <option value="1-year">1 Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="bg-input border-border/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold mb-2">{steps[4].title}</h2>
                <p className="text-muted-foreground">Review your campaign details before creating</p>
              </div>

              <div className="space-y-4">
                <div className="bg-card/50 border border-border/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Campaign Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Objective:</span>
                      <span className="font-medium capitalize">{formData.objective}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Budget:</span>
                      <span className="font-medium">${formData.budget}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium capitalize">{formData.duration}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-card/50 border border-border/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Platforms</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.platforms.map((platformId) => {
                      const platform = platforms.find((p) => p.id === platformId)
                      return (
                        <span
                          key={platformId}
                          className="px-3 py-1 rounded-full bg-accent/20 text-accent border border-accent/30 text-sm"
                        >
                          {platform?.name}
                        </span>
                      )
                    })}
                  </div>
                </div>

                <div className="bg-card/50 border border-border/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Target Audience</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.targetAudience.map((audienceId) => {
                      const audience = audiences.find((a) => a.id === audienceId)
                      return (
                        <span
                          key={audienceId}
                          className="px-3 py-1 rounded-full bg-secondary/20 text-secondary border border-secondary/30 text-sm"
                        >
                          {audience?.label}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Navigation */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex-1 border-border/50 bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          {currentStep === steps.length - 1 ? (
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
                Create Campaign
                <Check className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}
