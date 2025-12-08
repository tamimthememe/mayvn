"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useAuth } from "@/contexts/AuthContext"
import { getUserDocument, getUserBrands, UserData, BrandData } from "@/lib/userService"
import {
  LayoutDashboard,
  Calendar,
  FileText,
  MessageSquare,
  ChartBar,
  User,
  Mail,
  Briefcase,
  Building2,
  Tag,
  Palette,
  Type,
  Target,
  Users,
  MessageCircle,
  Globe,
  Sparkles,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [brands, setBrands] = useState<BrandData[]>([])

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        router.push("/login")
        return
      }

      try {
        setLoading(true)
        const [userDoc, userBrands] = await Promise.all([
          getUserDocument(user.uid),
          getUserBrands(user.uid),
        ])
        setUserData(userDoc)
        setBrands(userBrands)
      } catch (error) {
        console.error("Error fetching profile data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, router])

  const getExperienceLabel = (experience?: string) => {
    switch (experience) {
      case "beginner":
        return "I'm new to marketing automation"
      case "intermediate":
        return "I have some experience"
      case "advanced":
        return "I'm an experienced marketer"
      default:
        return "Not specified"
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "instagram":
        return "📷"
      case "linkedin":
        return "💼"
      case "facebook":
        return "👥"
      case "twitter":
        return "🐦"
      case "youtube":
        return "📺"
      default:
        return "🌐"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="fixed left-0 top-0 w-64 h-screen bg-card border-r border-border pb-6 pr-6 pl-6 flex-col hidden md:flex">
          <div className="mb-8">
            <Image 
              src="/logo-full.png" 
              alt="Mayvn Logo" 
              width={160}
              height={60}
              className="w-full h-auto"
            />
          </div>
          <nav className="flex-1 space-y-1">
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link href="/campaigns" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <Calendar className="w-5 h-5" />
              <span>Campaigns</span>
            </Link>
            <Link href="/content" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <FileText className="w-5 h-5" />
              <span>Content</span>
            </Link>
            <Link href="/engagement" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <MessageSquare className="w-5 h-5" />
              <span>Engagement</span>
            </Link>
            <Link href="/analytics" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <ChartBar className="w-5 h-5" />
              <span>Analytics</span>
            </Link>
            <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted text-foreground">
              <User className="w-5 h-5" />
              <span>Profile</span>
            </Link>
          </nav>
        </div>
        <div className="md:ml-64 min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 w-64 h-screen bg-card border-r border-border pb-6 pr-6 pl-6 flex-col">
        <div className="mb-8">
          <Image 
            src="/logo-full.png" 
            alt="Mayvn Logo" 
            width={160}
            height={60}
            className="w-full h-auto"
          />
        </div>

        <nav className="flex-1 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link href="/campaigns" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <Calendar className="w-5 h-5" />
            <span>Campaigns</span>
          </Link>
          <Link href="/content" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <FileText className="w-5 h-5" />
            <span>Content</span>
          </Link>
          <Link href="/engagement" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <MessageSquare className="w-5 h-5" />
            <span>Engagement</span>
          </Link>
          <Link href="/analytics" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <ChartBar className="w-5 h-5" />
            <span>Analytics</span>
          </Link>
          <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted text-foreground">
            <User className="w-5 h-5" />
            <span>Profile</span>
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="md:ml-64 min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Profile</h1>
            <p className="text-muted-foreground">View and manage your personal information and brand details</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Personal Info Section */}
            <div>
              <Card className="p-8 border-primary/20 bg-card/50 backdrop-blur-sm">
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-1">Personal Information</h2>
                  <p className="text-sm text-muted-foreground">Your account details</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                      Email
                    </label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <p className="text-base">{userData?.email || "Not available"}</p>
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-6">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                      Name
                    </label>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <p className="text-base">{userData?.name || "Not available"}</p>
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-6">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                      Experience Level
                    </label>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      <p className="text-base">{getExperienceLabel(userData?.experience)}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right: Brand Info Section */}
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-1">Brand Information</h2>
                <p className="text-sm text-muted-foreground">Your brand details and preferences</p>
              </div>

              {brands.length === 0 ? (
                <Card className="p-12 text-center border-dashed">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-6">No brands found. Complete onboarding to add your first brand.</p>
                  <Link href="/onboarding">
                    <Button>Complete Onboarding</Button>
                  </Link>
                </Card>
              ) : (
                brands.map((brand, index) => (
                  <Card key={index} className="border-secondary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
                    {/* Brand Header */}
                    <div className="p-6 border-b border-border/50 bg-gradient-to-r from-secondary/5 to-transparent">
                      <div className="flex items-start gap-4">
                        {brand.logo?.logo && (
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0 border border-border/50">
                            <Image
                              src={brand.logo.logo}
                              alt={brand.brand_name}
                              width={56}
                              height={56}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold mb-1 truncate">{brand.brand_name}</h3>
                          {brand.tagline && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{brand.tagline}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Brand Details - Accordion */}
                    <div className="p-6">
                      <Accordion type="single" collapsible className="w-full">
                        {/* Business Overview */}
                        {brand.business_overview && (
                          <AccordionItem value="overview" className="border-b border-border/50">
                            <AccordionTrigger className="text-sm font-medium py-3">
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-muted-foreground" />
                                <span>Business Overview</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-4">
                              <p className="text-sm text-muted-foreground leading-relaxed">{brand.business_overview}</p>
                            </AccordionContent>
                          </AccordionItem>
                        )}

                        {/* Brand Values */}
                        {brand.brand_values && brand.brand_values.length > 0 && (
                          <AccordionItem value="values" className="border-b border-border/50">
                            <AccordionTrigger className="text-sm font-medium py-3">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-muted-foreground" />
                                <span>Brand Values</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-4">
                              <div className="flex flex-wrap gap-2">
                                {brand.brand_values.map((value, idx) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm border border-primary/20"
                                  >
                                    {value}
                                  </span>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )}

                        {/* Platforms & Goals */}
                        {(brand.platforms?.length > 0 || brand.goals?.length > 0) && (
                          <AccordionItem value="platforms-goals" className="border-b border-border/50">
                            <AccordionTrigger className="text-sm font-medium py-3">
                              <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-muted-foreground" />
                                <span>Platforms & Goals</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-4 space-y-4">
                              {brand.platforms && brand.platforms.length > 0 && (
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Platforms</label>
                                  <div className="flex flex-wrap gap-2">
                                    {brand.platforms.map((platform, idx) => (
                                      <span
                                        key={idx}
                                        className="px-3 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm border border-secondary/20 flex items-center gap-1.5"
                                      >
                                        <span>{getPlatformIcon(platform)}</span>
                                        {platform}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {brand.goals && brand.goals.length > 0 && (
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Goals</label>
                                  <div className="flex flex-wrap gap-2">
                                    {brand.goals.map((goal, idx) => (
                                      <span
                                        key={idx}
                                        className="px-3 py-1.5 rounded bg-accent/10 text-accent text-sm border border-accent/20"
                                      >
                                        {goal}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        )}

                        {/* Design Elements */}
                        {((brand.colors && brand.colors.length > 0) || (brand.fonts && brand.fonts.length > 0)) && (
                          <AccordionItem value="design" className="border-b border-border/50">
                            <AccordionTrigger className="text-sm font-medium py-3">
                              <div className="flex items-center gap-2">
                                <Palette className="w-4 h-4 text-muted-foreground" />
                                <span>Design Elements</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-4 space-y-4">
                              {brand.colors && brand.colors.length > 0 && (
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Brand Colors</label>
                                  <div className="flex flex-wrap gap-3">
                                    {brand.colors.map((color, idx) => (
                                      <div key={idx} className="flex items-center gap-2">
                                        <div
                                          className="w-10 h-10 rounded-lg border-2 border-border shadow-sm"
                                          style={{ backgroundColor: color }}
                                        />
                                        <span className="text-xs text-muted-foreground font-mono">{color}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {brand.fonts && brand.fonts.length > 0 && (
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Fonts</label>
                                  <div className="flex flex-wrap gap-2">
                                    {brand.fonts.map((font, idx) => (
                                      <span
                                        key={idx}
                                        className="px-3 py-1.5 rounded bg-muted text-sm"
                                      >
                                        {font}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        )}

                        {/* Audience & Voice */}
                        {((brand.target_audience && brand.target_audience.length > 0) || (brand.tone_of_voice && brand.tone_of_voice.length > 0)) && (
                          <AccordionItem value="audience" className="border-b border-border/50">
                            <AccordionTrigger className="text-sm font-medium py-3">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span>Audience & Voice</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-4 space-y-4">
                              {brand.target_audience && brand.target_audience.length > 0 && (
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Target Audience</label>
                                  <div className="flex flex-wrap gap-2">
                                    {brand.target_audience.map((audience, idx) => (
                                      <span
                                        key={idx}
                                        className="px-3 py-1.5 rounded bg-muted text-sm"
                                      >
                                        {audience}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {brand.tone_of_voice && brand.tone_of_voice.length > 0 && (
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Tone of Voice</label>
                                  <div className="flex flex-wrap gap-2">
                                    {brand.tone_of_voice.map((tone, idx) => (
                                      <span
                                        key={idx}
                                        className="px-3 py-1.5 rounded bg-muted text-sm"
                                      >
                                        {tone}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        )}
                      </Accordion>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

