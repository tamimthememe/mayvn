"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react"

export default function CampaignCreationPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    goal: "",
    platforms: [],
    budget: "",
    tone: "balanced",
  })

  const goals = [
    { id: "awareness", label: "Brand Awareness", emoji: "👀" },
    { id: "engagement", label: "Engagement", emoji: "💬" },
    { id: "sales", label: "Sales", emoji: "💰" },
    { id: "leads", label: "Lead Generation", emoji: "📧" },
  ]

  const platforms = [
    { id: "instagram", name: "Instagram", icon: "📸" },
    { id: "tiktok", name: "TikTok", icon: "🎵" },
    { id: "twitter", name: "Twitter", icon: "𝕏" },
    { id: "linkedin", name: "LinkedIn", icon: "💼" },
  ]

  const handlePlatformToggle = (platformId: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter((p) => p !== platformId)
        : [...prev.platforms, platformId],
    }))
  }

  const handleNext = () => {
    if (step < 5) setStep(step + 1)
  }

  const handlePrev = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleComplete = () => {
    window.location.href = "/dashboard"
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <div className="mb-12">
            <div className="flex justify-between mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`flex-1 h-1 mx-1 rounded-full transition-all duration-300 ${
                    i <= step ? "bg-gradient-to-r from-primary to-accent" : "bg-border"
                  }`}
                ></div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center">Step {step} of 5</p>
          </div>

          {step === 1 && (
            <Card className="border-primary/20 bg-card/50 backdrop-blur-sm p-8 space-y-6 animate-slide-in-right">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Campaign Name</h2>
                <p className="text-muted-foreground">Give your campaign a catchy name</p>
              </div>
              <Input
                placeholder="e.g., Summer Vibes 2025"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-input border-border/50 text-lg py-6"
              />
              <div className="flex gap-3 pt-4">
                <Button variant="outline" disabled className="flex-1 bg-transparent">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={handleNext} className="flex-1 bg-gradient-to-r from-primary to-accent">
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          )}

          {step === 2 && (
            <Card className="border-primary/20 bg-card/50 backdrop-blur-sm p-8 space-y-6 animate-slide-in-right">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Campaign Goal</h2>
                <p className="text-muted-foreground">What's your main objective?</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {goals.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => setFormData({ ...formData, goal: goal.id })}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                      formData.goal === goal.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="text-2xl mb-2">{goal.emoji}</div>
                    <div className="text-sm font-medium">{goal.label}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handlePrev} className="flex-1 bg-transparent">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={handleNext} className="flex-1 bg-gradient-to-r from-primary to-accent">
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          )}

          {step === 3 && (
            <Card className="border-primary/20 bg-card/50 backdrop-blur-sm p-8 space-y-6 animate-slide-in-right">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Select Platforms</h2>
                <p className="text-muted-foreground">Where should we post?</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {platforms.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => handlePlatformToggle(platform.id)}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                      formData.platforms.includes(platform.id)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="text-2xl mb-2">{platform.icon}</div>
                    <div className="text-sm font-medium">{platform.name}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handlePrev} className="flex-1 bg-transparent">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={handleNext} className="flex-1 bg-gradient-to-r from-primary to-accent">
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          )}

          {step === 4 && (
            <Card className="border-primary/20 bg-card/50 backdrop-blur-sm p-8 space-y-6 animate-slide-in-right">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Budget</h2>
                <p className="text-muted-foreground">What's your monthly budget?</p>
              </div>
              <Input
                placeholder="e.g., $500"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="bg-input border-border/50 text-lg py-6"
              />
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handlePrev} className="flex-1 bg-transparent">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={handleNext} className="flex-1 bg-gradient-to-r from-primary to-accent">
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          )}

          {step === 5 && (
            <Card className="border-primary/20 bg-card/50 backdrop-blur-sm p-8 space-y-6 animate-slide-in-right">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Campaign Tone</h2>
                <p className="text-muted-foreground">How should your content sound?</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: "playful", label: "Playful", emoji: "😎" },
                  { id: "professional", label: "Professional", emoji: "💼" },
                  { id: "bold", label: "Bold", emoji: "🔥" },
                  { id: "balanced", label: "Balanced", emoji: "⚖️" },
                ].map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => setFormData({ ...formData, tone: tone.id })}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                      formData.tone === tone.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="text-2xl mb-2">{tone.emoji}</div>
                    <div className="text-sm font-medium">{tone.label}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handlePrev} className="flex-1 bg-transparent">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={handleComplete} className="flex-1 bg-gradient-to-r from-primary to-accent">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Create Campaign
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
