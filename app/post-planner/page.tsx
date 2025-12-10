"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/Sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDays, Plus, Calendar, Clock, Image as ImageIcon, FileText, Video, Link as LinkIcon, Sparkles, Loader2, RefreshCw, Star, TrendingUp, Target, Lightbulb, X } from "lucide-react"
import { useBrand } from "@/contexts/BrandContext"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"

export default function PostPlannerPage() {
  const { selectedBrand, loading: brandLoading } = useBrand()
  const { user } = useAuth()
  const router = useRouter()
  const [ideas, setIdeas] = useState<Array<{ 
    idea: string
    concept: string
    visual_style: string
    creativity_score?: number
    brand_alignment_score?: number
    engagement_score?: number
    clarity_score?: number
    total_score?: number
    imagePrompt?: string
    generatingPrompt?: boolean
  }>>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  const generateBusinessIdeas = async () => {
    if (!selectedBrand) {
      setError("Please select a brand first")
      return
    }

    setGenerating(true)
    setError(null)
    setIdeas([])

    // Create AbortController for cancellation
    const controller = new AbortController()
    setAbortController(controller)
    
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 900000) // 15 minute client-side timeout

    try {
      const response = await fetch('/api/ollama/generate-ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandData: selectedBrand,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      setAbortController(null)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to generate carousel post concepts')
      }

      if (data.success && data.ideas) {
        setIdeas(data.ideas)
        setGenerating(false)
        // Scores are now included in the generation response, no need to evaluate separately
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err: any) {
      clearTimeout(timeoutId)
      setAbortController(null)
      
      // Don't show error if it was manually cancelled
      if (err.name === 'AbortError') {
        setGenerating(false)
        return
      }
      
      console.error('Error generating carousel concepts:', err)
      
      let errorMessage = 'Failed to generate carousel post concepts'
      if (err.message) {
        errorMessage = err.message
      }
      
      setError(`${errorMessage}. Make sure OLLAMA is running (ollama serve) and the model qwen2.5:1.5b is installed (ollama pull qwen2.5:1.5b). Check the browser console for more details.`)
      setGenerating(false)
    }
  }

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
      setGenerating(false)
      setError(null)
    }
  }

  const generateImagePrompt = async (index: number) => {
    if (!selectedBrand) return

    const idea = ideas[index]
    if (!idea || idea.generatingPrompt || idea.imagePrompt) return

    // Update the idea to show it's generating
    setIdeas(prev => prev.map((item, i) => 
      i === index ? { ...item, generatingPrompt: true } : item
    ))

    try {
      const response = await fetch('/api/ollama/generate-image-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idea: idea.idea,
          concept: idea.concept,
          brandData: selectedBrand,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to generate image prompt')
      }

      if (data.success && data.imagePrompt) {
        // Update the idea with the generated prompt
        setIdeas(prev => prev.map((item, i) => 
          i === index ? { ...item, imagePrompt: data.imagePrompt, generatingPrompt: false } : item
        ))
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err: any) {
      console.error('Error generating image prompt:', err)
      setError(`Failed to generate image prompt: ${err.message}`)
      // Reset generating state
      setIdeas(prev => prev.map((item, i) => 
        i === index ? { ...item, generatingPrompt: false } : item
      ))
    }
  }

  // Auto-generate ideas when brand is selected (only once)
  useEffect(() => {
    if (selectedBrand && !brandLoading && ideas.length === 0 && !generating) {
      generateBusinessIdeas()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBrand?.id, brandLoading])

  if (brandLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <Sidebar />
        <main className="md:ml-64 md:w-[calc(100%-16rem)] w-full px-4 md:px-6 pt-16 md:pt-20 pb-6 md:pb-8">
          <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    )
  }

  if (!selectedBrand) {
    return (
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <Sidebar />
        <main className="md:ml-64 md:w-[calc(100%-16rem)] w-full px-4 md:px-6 pt-16 md:pt-20 pb-6 md:pb-8">
          <div className="max-w-7xl mx-auto">
            <Card className="p-12 text-center border-dashed">
              <CalendarDays className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">No Brand Selected</h2>
              <p className="text-muted-foreground mb-6">Please select a brand from the sidebar to generate carousel post concepts.</p>
            </Card>
          </div>
        </main>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="md:ml-64 md:w-[calc(100%-16rem)] w-full px-4 md:px-6 pt-16 md:pt-20 pb-6 md:pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Post Planner</h1>
                <p className="text-muted-foreground">
                  Generate AI-powered Instagram carousel post concepts based on your brand DNA
                </p>
              </div>
              <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            </div>
          </div>

          {/* Instagram Carousel Post Concepts Generator */}
          <Card className="p-8 mb-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold">Instagram Carousel Post Concepts</h2>
                  <p className="text-sm text-muted-foreground">AI-generated carousel ideas for {selectedBrand.brand_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {generating && (
                  <Button 
                    onClick={stopGeneration}
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                  >
                    <X className="w-4 h-4" />
                    Stop
                  </Button>
                )}
                <Button 
                  onClick={generateBusinessIdeas} 
                  disabled={generating}
                  variant="outline"
                  className="gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Regenerate
                    </>
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {generating && ideas.length === 0 ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
                <p className="text-muted-foreground">Generating carousel post concepts with scores using AI...</p>
                <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
              </div>
            ) : ideas.length > 0 ? (
              <div className="space-y-6">
                {ideas.map((post, index) => (
                  <Card 
                    key={index} 
                    className="p-6 border-border/50 bg-card/50 backdrop-blur-sm hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-5">
                      {/* Header with number and total score */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-base font-bold text-primary">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            {/* Idea as Title */}
                            <h3 className="text-xl font-bold text-foreground leading-tight mb-2">{post.idea}</h3>
                            {/* Concept as Description */}
                            <p className="text-base leading-relaxed text-muted-foreground">{post.concept}</p>
                          </div>
                        </div>
                        {/* Total Score Badge */}
                        {post.total_score !== undefined && (
                          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 flex-shrink-0">
                            <Star className="w-5 h-5 text-primary fill-primary" />
                            <span className="text-base font-bold text-primary">{post.total_score?.toFixed(1)}/10</span>
                          </div>
                        )}
                      </div>

                      {/* Visual Style Description */}
                      <div className="pt-4 border-t border-border/50">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <ImageIcon className="w-4 h-4 text-secondary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-foreground mb-1.5">Visual Style</h4>
                            <p className="text-sm leading-relaxed text-muted-foreground">{post.visual_style}</p>
                          </div>
                        </div>
                      </div>

                      {/* Image Generation Prompt */}
                      <div className="pt-4 border-t border-border/50">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="text-sm font-semibold text-foreground">Image Generation Prompt</h4>
                          {!post.imagePrompt && (
                            <Button
                              onClick={() => generateImagePrompt(index)}
                              disabled={post.generatingPrompt}
                              size="sm"
                              variant="outline"
                              className="gap-2"
                            >
                              {post.generatingPrompt ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5" />
                                  Generate Prompt
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                        {post.imagePrompt ? (
                          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                            <p className="text-sm leading-relaxed text-foreground font-mono whitespace-pre-wrap break-words">{post.imagePrompt}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Click "Generate Prompt" to create an image generation prompt for this post</p>
                        )}
                      </div>
                      
                      {/* Scores */}
                      {post.total_score !== undefined && (
                        <div className="pt-4 border-t border-border/50">
                          <h4 className="text-sm font-semibold text-foreground mb-3">Performance Scores</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex flex-col gap-2 p-3 rounded-lg bg-muted/30">
                              <div className="flex items-center gap-2">
                                <Lightbulb className="w-4 h-4 text-yellow-500" />
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Creativity</span>
                              </div>
                              <span className="text-2xl font-bold">{post.creativity_score?.toFixed(1) || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col gap-2 p-3 rounded-lg bg-muted/30">
                              <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-blue-500" />
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Brand Align</span>
                              </div>
                              <span className="text-2xl font-bold">{post.brand_alignment_score?.toFixed(1) || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col gap-2 p-3 rounded-lg bg-muted/30">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-green-500" />
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Engagement</span>
                              </div>
                              <span className="text-2xl font-bold">{post.engagement_score?.toFixed(1) || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col gap-2 p-3 rounded-lg bg-muted/30">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-purple-500" />
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Clarity</span>
                              </div>
                              <span className="text-2xl font-bold">{post.clarity_score?.toFixed(1) || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Click "Regenerate" to generate carousel post concepts</p>
                <p className="text-sm mt-2">Concepts will be tailored to your brand data</p>
              </div>
            )}
          </Card>

          {/* Scheduled Posts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Posts */}
            <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Today's Posts</h3>
                </div>
                <span className="text-sm text-muted-foreground">0 scheduled</span>
              </div>
              <div className="text-center py-8 text-muted-foreground">
                <p>No posts scheduled for today</p>
              </div>
            </Card>

            {/* Upcoming Posts */}
            <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Upcoming Posts</h3>
                </div>
                <span className="text-sm text-muted-foreground">0 scheduled</span>
              </div>
              <div className="text-center py-8 text-muted-foreground">
                <p>No upcoming posts</p>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <ImageIcon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Image Post</span>
                </div>
              </Card>
              <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-3">
                    <Video className="w-6 h-6 text-secondary" />
                  </div>
                  <span className="text-sm font-medium">Video Post</span>
                </div>
              </Card>
              <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                    <FileText className="w-6 h-6 text-accent" />
                  </div>
                  <span className="text-sm font-medium">Text Post</span>
                </div>
              </Card>
              <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <LinkIcon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Link Post</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

