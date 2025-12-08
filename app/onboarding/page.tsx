"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowRight, ArrowLeft, Check, Sparkles, Instagram, Linkedin, Facebook, Twitter, Youtube, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { useBrand } from "@/contexts/BrandContext"
import { updateUserExperience, createBrandDocument } from "@/lib/userService"
import Image from "next/image"

interface BrandDNA {
  accent_color: string
  brand_name: string
  brand_values: string[]
  business_overview: string
  colors: string[]
  fonts: string[]
  images: string[]
  logo: {
    logo: string
    logo_small: string
  }
  main_font: string
  tagline: string
  target_audience: string[]
  tone_of_voice: string[]
}

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { refreshBrands, setSelectedBrandId } = useBrand()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [brandDNA, setBrandDNA] = useState<BrandDNA | null>(null)
  const [formData, setFormData] = useState({
    platforms: [] as string[],
    goals: [] as string[],
    experience: "",
  })

  // Load brand DNA from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedDNA = localStorage.getItem('brandDNA')
      if (storedDNA) {
        try {
          const data = JSON.parse(storedDNA)
          setBrandDNA(data)
        } catch (err) {
          console.error('Failed to parse stored brand DNA:', err)
        }
      }
    }
  }, [])

  const steps = [
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

  const handleComplete = async () => {
    if (!user) {
      router.push("/login")
      return
    }

    if (!brandDNA) {
      setError("Brand DNA not found. Please go back and extract your brand DNA first.")
      return
    }

    try {
      setLoading(true)
      
      // Update user experience (user-level)
      if (formData.experience) {
        await updateUserExperience(user.uid, formData.experience)
      }

      // Create brand document with brand DNA + onboarding data
      const brandId = await createBrandDocument(user.uid, {
        brand_name: brandDNA.brand_name,
        tagline: brandDNA.tagline,
        brand_values: brandDNA.brand_values || [],
        business_overview: brandDNA.business_overview,
        colors: brandDNA.colors || [],
        fonts: brandDNA.fonts || [],
        images: brandDNA.images || [],
        logo: brandDNA.logo,
        main_font: brandDNA.main_font,
        accent_color: brandDNA.accent_color,
        target_audience: brandDNA.target_audience || [],
        tone_of_voice: brandDNA.tone_of_voice || [],
        platforms: formData.platforms,
        goals: formData.goals,
        company: brandDNA.brand_name, // Use brand name as company
      })

      // Clear brand DNA from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('brandDNA')
      }

      // Refresh brands and select the newly created brand
      await refreshBrands()
      setSelectedBrandId(brandId)

      router.push("/dashboard")
    } catch (error) {
      console.error("Error completing onboarding:", error)
      setError("Failed to save onboarding data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.platforms.length > 0
      case 1:
        return formData.goals.length > 0
      case 2:
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
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}
            
            {!brandDNA && (
              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  No brand DNA found. Please extract your brand DNA first before completing onboarding.
                </p>
                <Link href="/brand-dna">
                  <Button variant="outline" size="sm" className="mt-3">
                    Go to Brand DNA
                  </Button>
                </Link>
              </div>
            )}
            {/* Step 0: Platforms */}
            {currentStep === 0 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">{steps[0].title}</h2>
                  <p className="text-muted-foreground">{steps[0].description}</p>
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

            {/* Step 1: Goals */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">{steps[1].title}</h2>
                  <p className="text-muted-foreground">{steps[1].description}</p>
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

            {/* Step 2: Experience */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">{steps[2].title}</h2>
                  <p className="text-muted-foreground">{steps[2].description}</p>
                </div>
                <div className="space-y-4">
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
              </div>
            )}

            {/* Step 3: Complete */}
            {currentStep === 3 && (
              <div className="space-y-8 text-center animate-fade-in">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-secondary to-accent rounded-2xl flex items-center justify-center animate-bounce">
                    <Check className="w-8 h-8 text-secondary-foreground" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold mb-4">{steps[3].title}</h1>
                  <p className="text-base sm:text-lg text-muted-foreground mb-6">{steps[3].description}</p>
                  <div className="bg-card/50 border border-primary/20 rounded-lg p-6 text-left space-y-3">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-secondary" />
                      <span>Account setup complete</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-secondary" />
                      <span>{formData.platforms.length} platforms selected</span>
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
                <Button 
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  {loading ? "Saving..." : "Go to Dashboard"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
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
