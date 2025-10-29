"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowRight, ArrowLeft, Check, Sparkles, Instagram, Linkedin, Facebook, Twitter, Youtube } from "lucide-react"
import Link from "next/link"

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    company: "",
    platforms: [] as string[],
    goals: [] as string[],
    experience: "",
  })

  const steps = [
    {
      title: "Welcome to Mayvn",
      description: "Let's get you set up in just a few minutes",
    },
    {
      title: "Tell us about yourself",
      description: "Help us personalize your experience",
    },
    {
      title: "Choose your platforms",
      description: "Select where you want to automate",
    },
    {
      title: "What are your goals?",
      description: "Tell us what you want to achieve",
    },
    {
      title: "Your experience level",
      description: "Help us tailor the right features for you",
    },
    {
      title: "You're all set!",
      description: "Ready to transform your marketing",
    },
  ]

  const platforms = [
    { id: "instagram", name: "Instagram", Icon: Instagram },
    { id: "tiktok", name: "TikTok", Icon: null as any },
    { id: "twitter", name: "Twitter/X", Icon: Twitter },
    { id: "linkedin", name: "LinkedIn", Icon: Linkedin },
    { id: "facebook", name: "Facebook", Icon: Facebook },
    { id: "youtube", name: "YouTube", Icon: Youtube },
  ]

  const goals = [
    { id: "growth", name: "Grow followers", icon: "📈" },
    { id: "engagement", name: "Boost engagement", icon: "💬" },
    { id: "sales", name: "Drive sales", icon: "💰" },
    { id: "brand", name: "Build brand awareness", icon: "🎯" },
    { id: "content", name: "Save time on content", icon: "⏱️" },
    { id: "analytics", name: "Better analytics", icon: "📊" },
  ]

  const handlePlatformToggle = (platformId: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter((p) => p !== platformId)
        : [...prev.platforms, platformId],
    }))
  }

  const handleGoalToggle = (goalId: string) => {
    setFormData((prev) => ({
      ...prev,
      goals: prev.goals.includes(goalId) ? prev.goals.filter((g) => g !== goalId) : [...prev.goals, goalId],
    }))
  }

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

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.fullName && formData.email && formData.company
      case 2:
        return formData.platforms.length > 0
      case 3:
        return formData.goals.length > 0
      case 4:
        return formData.experience
      default:
        return true
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-72 h-72 bg-secondary/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative min-h-screen flex items-start sm:items-center justify-center px-4 pt-24 sm:pt-0 pb-12">
        <div className="w-full max-w-2xl">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-4">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 mx-1 rounded-full transition-all duration-300 ${
                    i <= currentStep ? "bg-gradient-to-r from-primary to-accent" : "bg-muted"
                  }`}
                ></div>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>

          {/* Main card */}
          <Card className="border-primary/20 bg-card/50 backdrop-blur-sm p-6 sm:p-10">
            {/* Step 0: Welcome */}
            {currentStep === 0 && (
              <div className="space-y-8 text-center animate-fade-in">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">{steps[0].title}</h1>
                  <p className="text-base sm:text-lg text-muted-foreground">{steps[0].description}</p>
                </div>
                <div className="space-y-4 pt-4">
                  <p className="text-muted-foreground">
                    Join thousands of creators automating their marketing with AI-powered content generation and
                    scheduling.
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="font-semibold text-primary">10K+</div>
                      <div className="text-muted-foreground">Campaigns</div>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/20">
                      <div className="font-semibold text-secondary">500K+</div>
                      <div className="text-muted-foreground">Posts</div>
                    </div>
                    <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                      <div className="font-semibold text-accent">3.5x</div>
                      <div className="text-muted-foreground">Engagement</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">{steps[1].title}</h2>
                  <p className="text-muted-foreground">{steps[1].description}</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <Input
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="bg-input border-border/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-input border-border/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Company/Brand Name</label>
                    <Input
                      placeholder="Your Company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="bg-input border-border/50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Platforms */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">{steps[2].title}</h2>
                  <p className="text-muted-foreground">{steps[2].description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {platforms.map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => handlePlatformToggle(platform.id)}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-3 ${
                        formData.platforms.includes(platform.id)
                          ? "border-primary bg-primary/10"
                          : "border-border/50 bg-card/50 hover:border-primary/50"
                      }`}
                    >
                      {platform.Icon ? (
                        <platform.Icon className="w-5 h-5" />
                      ) : (
                        <div className="w-5 h-5 rounded-sm bg-white text-black text-[10px] font-bold flex items-center justify-center">T</div>
                      )}
                      <span className="font-medium">{platform.name}</span>
                      {formData.platforms.includes(platform.id) && <Check className="w-5 h-5 ml-auto text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Goals */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">{steps[3].title}</h2>
                  <p className="text-muted-foreground">{steps[3].description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {goals.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => handleGoalToggle(goal.id)}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-3 ${
                        formData.goals.includes(goal.id)
                          ? "border-accent bg-accent/10"
                          : "border-border/50 bg-card/50 hover:border-accent/50"
                      }`}
                    >
                      <span className="hidden sm:inline text-2xl">{goal.icon}</span>
                      <span className="font-medium text-sm">{goal.name}</span>
                      {formData.goals.includes(goal.id) && <Check className="w-5 h-5 ml-auto text-accent" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Experience */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">{steps[4].title}</h2>
                  <p className="text-muted-foreground">{steps[4].description}</p>
                </div>
                <div className="space-y-3">
                  {[
                    { id: "beginner", label: "I'm new to marketing automation" },
                    { id: "intermediate", label: "I have some experience" },
                    { id: "advanced", label: "I'm an experienced marketer" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setFormData({ ...formData, experience: option.id })}
                      className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        formData.experience === option.id
                          ? "border-secondary bg-secondary/10"
                          : "border-border/50 bg-card/50 hover:border-secondary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            formData.experience === option.id ? "border-secondary bg-secondary" : "border-border"
                          }`}
                        >
                          {formData.experience === option.id && (
                            <div className="w-2 h-2 bg-secondary-foreground rounded-full"></div>
                          )}
                        </div>
                        <span className="font-medium">{option.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Complete */}
            {currentStep === 5 && (
              <div className="space-y-8 text-center animate-fade-in">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-secondary to-accent rounded-2xl flex items-center justify-center animate-bounce">
                    <Check className="w-8 h-8 text-secondary-foreground" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold mb-4">{steps[5].title}</h1>
                  <p className="text-base sm:text-lg text-muted-foreground mb-6">{steps[5].description}</p>
                  <div className="bg-card/50 border border-primary/20 rounded-lg p-6 text-left space-y-3">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-secondary" />
                      <span>Account created for {formData.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-secondary" />
                      <span>{formData.platforms.length} platforms connected</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-secondary" />
                      <span>Personalized dashboard ready</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8 pt-8 border-t border-border/50">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="w-full sm:flex-1 border-border/50 bg-transparent"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              {currentStep === steps.length - 1 ? (
                <Link href="/dashboard" className="w-full sm:flex-1">
                  <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className="w-full sm:flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </Card>

          {/* Skip option */}
          {currentStep < steps.length - 1 && (
            <div className="text-center mt-6">
              <Link href="/dashboard">
                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Skip for now
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
