"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sparkles, Copy, RefreshCw, Save, Trash2, Download, Zap } from "lucide-react"
import Link from "next/link"

export default function ContentGenerationPage() {
  const [prompt, setPrompt] = useState("")
  const [contentType, setContentType] = useState("caption")
  const [tone, setTone] = useState("professional")
  const [platform, setPlatform] = useState("instagram")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string[]>([])
  const [savedContent, setSavedContent] = useState<string[]>([])

  const contentTypes = [
    { id: "caption", label: "Caption", icon: "📝" },
    { id: "hashtags", label: "Hashtags", icon: "#️⃣" },
    { id: "post", label: "Full Post", icon: "📄" },
    { id: "email", label: "Email", icon: "✉️" },
    { id: "ad", label: "Ad Copy", icon: "📢" },
    { id: "story", label: "Story Text", icon: "📖" },
  ]

  const tones = [
    { id: "professional", label: "Professional" },
    { id: "casual", label: "Casual" },
    { id: "funny", label: "Funny" },
    { id: "inspirational", label: "Inspirational" },
    { id: "urgent", label: "Urgent" },
    { id: "friendly", label: "Friendly" },
  ]

  const platforms = [
    { id: "instagram", label: "Instagram" },
    { id: "tiktok", label: "TikTok" },
    { id: "twitter", label: "Twitter/X" },
    { id: "linkedin", label: "LinkedIn" },
    { id: "facebook", label: "Facebook" },
    { id: "youtube", label: "YouTube" },
  ]

  const mockGeneratedContent = [
    "🚀 Ready to transform your marketing game? Our AI-powered platform helps you create stunning content in seconds. Say goodbye to writer's block and hello to consistent, engaging posts across all platforms. #MarketingAutomation #ContentCreation",
    "✨ Tired of spending hours on content creation? Let AI do the heavy lifting while you focus on strategy. Generate captions, hashtags, and full posts instantly. Your audience will love the consistency. #SmartMarketing",
    "💡 Content creation just got easier. Our AI understands your brand voice and creates posts that resonate with your audience. More time for strategy, less time on creation. #MarketingTech",
  ]

  const handleGenerate = async () => {
    setIsGenerating(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setGeneratedContent(mockGeneratedContent)
    setIsGenerating(false)
  }

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const handleSave = (content: string) => {
    if (!savedContent.includes(content)) {
      setSavedContent([...savedContent, content])
    }
  }

  const handleRemoveSaved = (content: string) => {
    setSavedContent(savedContent.filter((c) => c !== content))
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
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              AI Content Generator
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="space-y-6">
            <Card className="border-primary/20 bg-card/50 backdrop-blur-sm p-6">
              <h2 className="text-xl font-bold mb-4">Content Brief</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">What do you want to create?</label>
                  <textarea
                    placeholder="Describe what you want to say... e.g., 'Announce our new summer collection with focus on sustainability and eco-friendly materials'"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full bg-input border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    rows={5}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Content Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {contentTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setContentType(type.id)}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-1 ${
                          contentType === type.id
                            ? "border-primary bg-primary/10"
                            : "border-border/50 bg-card/50 hover:border-primary/50"
                        }`}
                      >
                        <span className="text-xl">{type.icon}</span>
                        <span className="text-xs font-medium">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Tone</label>
                  <div className="grid grid-cols-3 gap-2">
                    {tones.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTone(t.id)}
                        className={`p-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                          tone === t.id
                            ? "border-secondary bg-secondary/10 text-secondary"
                            : "border-border/50 bg-card/50 hover:border-secondary/50"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-input border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {platforms.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={!prompt || isGenerating}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  {isGenerating ? (
                    <>
                      <Zap className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Saved Content */}
            {savedContent.length > 0 && (
              <Card className="border-secondary/20 bg-card/50 backdrop-blur-sm p-6">
                <h3 className="text-lg font-bold mb-4">Saved Content ({savedContent.length})</h3>
                <div className="space-y-3">
                  {savedContent.map((content, i) => (
                    <div key={i} className="p-3 bg-secondary/10 border border-secondary/20 rounded-lg group">
                      <p className="text-sm line-clamp-2 mb-2">{content}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleCopy(content)} className="text-xs h-7">
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveSaved(content)}
                          className="text-xs h-7 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Output Panel */}
          <div className="space-y-6">
            {generatedContent.length > 0 ? (
              <>
                <Card className="border-accent/20 bg-card/50 backdrop-blur-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Generated Content</h2>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="text-primary hover:text-primary"
                    >
                      <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {generatedContent.map((content, i) => (
                      <div
                        key={i}
                        className="p-4 bg-accent/10 border border-accent/20 rounded-lg group hover:border-accent/50 transition-all duration-300"
                      >
                        <p className="text-sm mb-3 leading-relaxed">{content}</p>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopy(content)}
                            className="border-border/50 bg-transparent text-xs h-8"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSave(content)}
                            className="border-border/50 bg-transparent text-xs h-8"
                          >
                            <Save className="w-3 h-3 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-border/50 bg-transparent text-xs h-8 ml-auto"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Export
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Tips */}
                <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm p-6 border-primary/30">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Pro Tips
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Be specific in your brief for better results</li>
                    <li>• Try different tones to find what resonates</li>
                    <li>• Save your favorites for future reference</li>
                    <li>• Mix and match content from different generations</li>
                  </ul>
                </Card>
              </>
            ) : (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-12 flex flex-col items-center justify-center min-h-96">
                <Sparkles className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No content generated yet</h3>
                <p className="text-muted-foreground text-center">
                  Fill in your content brief and click "Generate Content" to get started
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
