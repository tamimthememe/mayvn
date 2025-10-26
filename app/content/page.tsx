"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sparkles, Copy, RefreshCw, ThumbsUp, Share2 } from "lucide-react"

export default function ContentGenerationPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState([
    {
      id: 1,
      caption: "Just dropped our new collection and honestly? We're obsessed. The energy is immaculate. 🔥",
      hashtags: "#NewCollection #FashionDrop #StyleGoals #TrendAlert",
      platform: "Instagram",
    },
    {
      id: 2,
      caption: "POV: You finally found the perfect product that actually delivers on its promises 👀",
      hashtags: "#ProductRecommendation #GameChanger #MustHave",
      platform: "TikTok",
    },
    {
      id: 3,
      caption: "Excited to announce our latest innovation in the space. This is going to change everything.",
      hashtags: "#Innovation #TechNews #FutureIsNow",
      platform: "LinkedIn",
    },
  ])

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed left-0 top-0 w-64 h-screen bg-card border-r border-border p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Mayvn</span>
        </div>

        <nav className="flex-1 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-card-foreground/10 transition-colors"
          >
            <span>📊 Dashboard</span>
          </Link>
          <Link
            href="/campaigns"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-card-foreground/10 transition-colors"
          >
            <span>📅 Campaigns</span>
          </Link>
          <Link href="/content" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary">
            <span>✨ Content</span>
          </Link>
          <Link
            href="/engagement"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-card-foreground/10 transition-colors"
          >
            <span>💬 Engagement</span>
          </Link>
          <Link
            href="/analytics"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-card-foreground/10 transition-colors"
          >
            <span>📈 Analytics</span>
          </Link>
        </nav>
      </div>

      <div className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">AI Content Generation</h1>
          <p className="text-muted-foreground">Create engaging content in seconds</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Brief */}
          <div className="lg:col-span-1">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6 space-y-6 sticky top-8">
              <div>
                <h3 className="font-semibold mb-3">Campaign Brief</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Campaign</p>
                    <p className="font-medium">Summer Sale Campaign</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Platforms</p>
                    <p className="font-medium">Instagram, TikTok, LinkedIn</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tone</p>
                    <p className="font-medium">Playful & Engaging</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Goal</p>
                    <p className="font-medium">Engagement & Sales</p>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleGenerate}
                className="w-full bg-gradient-to-r from-primary to-accent"
                disabled={isGenerating}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isGenerating ? "Generating..." : "Generate Content"}
              </Button>
            </Card>
          </div>

          {/* Right Panel - Generated Content */}
          <div className="lg:col-span-2 space-y-4">
            {generatedContent.map((content, i) => (
              <Card
                key={content.id}
                className="border-border/50 bg-card/50 backdrop-blur-sm p-6 hover:border-primary/50 transition-all animate-slide-in-left"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium px-3 py-1 rounded-full bg-primary/20 text-primary">
                      {content.platform}
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-input/50 rounded-lg p-4 border border-border/50">
                    <p className="text-foreground leading-relaxed">{content.caption}</p>
                  </div>

                  <div className="bg-input/50 rounded-lg p-4 border border-border/50">
                    <p className="text-sm text-muted-foreground">{content.hashtags}</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                      <ThumbsUp className="w-4 h-4 mr-2" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                      <Share2 className="w-4 h-4 mr-2" /> Schedule
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
