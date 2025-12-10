"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/Sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { useBrand } from "@/contexts/BrandContext"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertCircle,
  BarChart,
  CalendarClock,
  ChevronRight,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  Timer,
  Users,
} from "lucide-react"
import { getBrandPosts, saveBrandPost, type BrandPost } from "@/lib/userService"

type Idea = {
  idea: string
  concept: string
  visual_style: string
  creativity_score?: number
  brand_alignment_score?: number
  engagement_score?: number
  clarity_score?: number
  total_score?: number
}

type PlannedPost = BrandPost & {
  plannedAt?: string
  channels?: string[]
  ideaId?: string
  scores?: {
    creativity?: number
    alignment?: number
    engagement?: number
    clarity?: number
    total?: number
  }
}

type EmailDraft = {
  subject: string
  preview: string
  html: string
  text: string
  idea?: string
}

type DebugEvent = {
  ts?: string
  stage:
    | "auth"
    | "brand"
    | "ideas"
    | "schedule"
    | "publish"
    | "analytics"
    | "engagement"
    | "storage"
    | "system"
  message: string
  detail?: Record<string, unknown>
  level?: "info" | "warn" | "error"
}

const MAX_DEBUG = 120

export default function CampaignOrchestratorPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { selectedBrand, loading: brandLoading } = useBrand()

  const [ideas, setIdeas] = useState<Idea[]>([])
  const [ideasLoading, setIdeasLoading] = useState(false)
  const [ideasError, setIdeasError] = useState<string | null>(null)

  const [posts, setPosts] = useState<PlannedPost[]>([])
  const [postsLoading, setPostsLoading] = useState(false)

  const [insights, setInsights] = useState<any>(null)
  const [engagement, setEngagement] = useState<any[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [engagementLoading, setEngagementLoading] = useState(false)

  const [emailDraft, setEmailDraft] = useState<EmailDraft>({
    subject: "",
    preview: "",
    html: "",
    text: "",
  })
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [recipients, setRecipients] = useState<string[]>([])
  const [recipientInput, setRecipientInput] = useState("")
  const [sendLoading, setSendLoading] = useState(false)
  const [sendStatus, setSendStatus] = useState<string | null>(null)

  const [autoWindowDays, setAutoWindowDays] = useState(7)
  const [autoStartHour, setAutoStartHour] = useState(9)

  const [debug, setDebug] = useState<DebugEvent[]>([])
  const debugRef = useRef<HTMLDivElement | null>(null)

  const pushDebug = useCallback((entry: DebugEvent) => {
    setDebug((prev) => {
      const next = [{ ...entry, ts: entry.ts || new Date().toISOString(), level: entry.level || "info" }, ...prev]
      return next.slice(0, MAX_DEBUG)
    })
  }, [])

  // Auth/brand guard
  useEffect(() => {
    if (!authLoading && !user) {
      pushDebug({ stage: "auth", message: "No user; redirect to login", level: "warn", ts: new Date().toISOString() })
      router.push("/login")
    }
  }, [authLoading, user, router, pushDebug])

  // Load posts for current brand
  const loadPosts = useCallback(async () => {
    if (!user || !selectedBrand?.id) return
    setPostsLoading(true)
    try {
      const brandPosts = await getBrandPosts(user.uid, selectedBrand.id)
      const mapped: PlannedPost[] = brandPosts
        .map((p) => ({
          ...p,
          plannedAt: (p as any).plannedAt,
          channels: (p as any).channels,
          ideaId: (p as any).ideaId,
          scores: (p as any).scores,
        }))
        .sort((a, b) => {
          const aDate = a.plannedAt ? new Date(a.plannedAt).getTime() : 0
          const bDate = b.plannedAt ? new Date(b.plannedAt).getTime() : 0
          return aDate - bDate
        })
      setPosts(mapped)
      pushDebug({ stage: "storage", message: `Loaded ${mapped.length} posts for brand`, detail: { brandId: selectedBrand.id } })
    } catch (err) {
      pushDebug({
        stage: "storage",
        message: "Failed to load posts",
        detail: { error: (err as Error)?.message },
        level: "error",
      })
    } finally {
      setPostsLoading(false)
    }
  }, [user, selectedBrand?.id, pushDebug])

  useEffect(() => {
    if (user && selectedBrand?.id) {
      loadPosts()
    }
  }, [user, selectedBrand?.id, loadPosts])

  // Generate ideas
  const generateIdeas = useCallback(async () => {
    if (!selectedBrand) {
      setIdeasError("Please select a brand first.")
      return
    }
    setIdeasError(null)
    setIdeasLoading(true)
    try {
      pushDebug({ stage: "ideas", message: "Requesting ideas from Ollama" })
      const res = await fetch("/api/ollama/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandData: selectedBrand }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || data?.details || "Failed to generate ideas")
      }
      setIdeas(data.ideas || [])
      pushDebug({ stage: "ideas", message: `Received ${data.ideas?.length || 0} ideas` })
    } catch (err) {
      const message = (err as Error)?.message || "Unknown error"
      setIdeasError(message)
      pushDebug({ stage: "ideas", message: "Idea generation failed", detail: { message }, level: "error" })
    } finally {
      setIdeasLoading(false)
    }
  }, [selectedBrand, pushDebug])

  // Auto slot helper
  const computePlannedAt = useCallback(
    (index: number) => {
      const start = new Date()
      start.setHours(autoStartHour, 0, 0, 0)
      const dayOffset = Math.floor(index / 2) // two posts per day by default
      const slotOffsetHours = (index % 2) * 4 // 4h spacing inside a day
      start.setDate(start.getDate() + Math.min(dayOffset, autoWindowDays - 1))
      start.setHours(start.getHours() + slotOffsetHours)
      return start.toISOString()
    },
    [autoWindowDays, autoStartHour]
  )

  const scheduleIdea = useCallback(
    async (idea: Idea, ideaIndex: number) => {
      if (!user || !selectedBrand?.id) return
      const plannedAt = computePlannedAt(posts.length + ideaIndex)
      const payload: Omit<BrandPost, "id" | "createdAt" | "updatedAt"> & Record<string, any> = {
        title: idea.idea,
        caption: idea.concept,
        status: "scheduled",
        framesJson: JSON.stringify([]),
        plannedAt,
        channels: ["instagram"],
        ideaId: `${Date.now()}-${ideaIndex}`,
        scores: {
          creativity: idea.creativity_score,
          alignment: idea.brand_alignment_score,
          engagement: idea.engagement_score,
          clarity: idea.clarity_score,
          total: idea.total_score,
        },
      }
      try {
        pushDebug({ stage: "schedule", message: "Saving scheduled post", detail: { plannedAt } })
        await saveBrandPost(user.uid, selectedBrand.id, null, payload)
        await loadPosts()
      } catch (err) {
        pushDebug({
          stage: "schedule",
          message: "Failed to save scheduled post",
          detail: { error: (err as Error)?.message },
          level: "error",
        })
      }
    },
    [user, selectedBrand?.id, computePlannedAt, loadPosts, posts.length, pushDebug]
  )

  // Publish simulation
  const publishNow = useCallback(
    async (post: PlannedPost) => {
      if (!user || !selectedBrand?.id || !post.id) return
      try {
        pushDebug({ stage: "publish", message: "Publishing post (simulated)", detail: { postId: post.id } })
        await saveBrandPost(user.uid, selectedBrand.id, post.id, {
          title: post.title,
          caption: post.caption || "",
          framesJson: post.framesJson,
          status: "published",
          publishedAt: new Date().toISOString(),
        } as any)
        await loadPosts()
      } catch (err) {
        pushDebug({
          stage: "publish",
          message: "Failed to publish post",
          detail: { error: (err as Error)?.message },
          level: "error",
        })
      }
    },
    [user, selectedBrand?.id, loadPosts, pushDebug]
  )

  const runSchedulerOnce = useCallback(async () => {
    const now = Date.now()
    const due = posts.filter((p) => p.status === "scheduled" && p.plannedAt && new Date(p.plannedAt).getTime() <= now)
    if (!due.length) {
      pushDebug({ stage: "publish", message: "Scheduler tick: no due posts" })
      return
    }
    for (const post of due) {
      await publishNow(post)
    }
  }, [posts, publishNow, pushDebug])

  // Analytics & engagement
  const loadInsights = useCallback(async () => {
    if (!user || !selectedBrand?.id) return
    setAnalyticsLoading(true)
    try {
      pushDebug({ stage: "analytics", message: "Fetching Instagram insights" })
      const res = await fetch(
        `/api/instagram/insights?userId=${encodeURIComponent(user.uid)}&brandId=${encodeURIComponent(selectedBrand.id)}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to fetch insights")
      setInsights(data)
      pushDebug({ stage: "analytics", message: "Insights loaded" })
    } catch (err) {
      pushDebug({
        stage: "analytics",
        message: "Failed to fetch insights",
        detail: { error: (err as Error)?.message },
        level: "error",
      })
    } finally {
      setAnalyticsLoading(false)
    }
  }, [user, selectedBrand?.id, pushDebug])

  const loadEngagement = useCallback(async () => {
    if (!user || !selectedBrand?.id) return
    setEngagementLoading(true)
    try {
      pushDebug({ stage: "engagement", message: "Fetching recent engagement" })
      const res = await fetch(
        `/api/instagram/engagement?userId=${encodeURIComponent(user.uid)}&brandId=${encodeURIComponent(selectedBrand.id)}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to fetch engagement")
      setEngagement(data.items || [])
      pushDebug({ stage: "engagement", message: `Loaded ${data.items?.length || 0} engagement items` })
    } catch (err) {
      pushDebug({
        stage: "engagement",
        message: "Failed to fetch engagement",
        detail: { error: (err as Error)?.message },
        level: "error",
      })
    } finally {
      setEngagementLoading(false)
    }
  }, [user, selectedBrand?.id, pushDebug])

  // Auto-scroll debug when new entries appear
  useEffect(() => {
    if (debugRef.current) {
      debugRef.current.scrollTop = 0
    }
  }, [debug])

  const scheduled = useMemo(() => posts.filter((p) => p.status === "scheduled"), [posts])
  const published = useMemo(() => posts.filter((p) => p.status === "published"), [posts])
  const bestIdea = useMemo(() => {
    if (!ideas.length) return null
    return [...ideas].sort((a, b) => (b.total_score || 0) - (a.total_score || 0))[0]
  }, [ideas])

  const brandName = selectedBrand?.brand_name || "Brand"

  const handleAddRecipient = useCallback(() => {
    const trimmed = recipientInput.trim()
    if (!trimmed) return
    if (recipients.includes(trimmed)) {
      setRecipientInput("")
      return
    }
    setRecipients((prev) => [...prev, trimmed])
    setRecipientInput("")
  }, [recipientInput, recipients])

  const handleRemoveRecipient = useCallback(
    (email: string) => {
      setRecipients((prev) => prev.filter((r) => r !== email))
    },
    []
  )

  const generateEmail = useCallback(async () => {
    if (!selectedBrand) {
      setEmailError("Select a brand first.")
      return
    }
    if (!bestIdea) {
      setEmailError("Generate ideas first, then craft an email.")
      return
    }
    setEmailError(null)
    setEmailLoading(true)
    setSendStatus(null)
    try {
      pushDebug({ stage: "ideas", message: "Generating email from brand DNA and top idea" })
      const res = await fetch("/api/ollama/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandData: selectedBrand, idea: bestIdea.idea }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || data?.details || "Failed to generate email")
      }
      const email = data.email || {}
      setEmailDraft({
        subject: email.subject || "",
        preview: email.preview || "",
        html: email.html || "",
        text: email.text || "",
        idea: bestIdea.idea,
      })
      pushDebug({ stage: "ideas", message: "Email generated", detail: { subject: email.subject } })
    } catch (err) {
      const message = (err as Error)?.message || "Unknown error"
      setEmailError(message)
      pushDebug({ stage: "ideas", message: "Email generation failed", detail: { message }, level: "error" })
    } finally {
      setEmailLoading(false)
    }
  }, [bestIdea, selectedBrand, pushDebug])

  const sendEmail = useCallback(async () => {
    if (!recipients.length) {
      setSendStatus("Add at least one recipient.")
      return
    }
    if (!emailDraft.subject || !emailDraft.html) {
      setSendStatus("Generate an email first.")
      return
    }
    setSendStatus(null)
    setSendLoading(true)
    try {
      pushDebug({ stage: "publish", message: "Sending email batch", detail: { recipients: recipients.length } })
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipients,
          subject: emailDraft.subject,
          html: emailDraft.html,
          text: emailDraft.text || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "Failed to send email")
      }
      setSendStatus(`Sent! Accepted: ${data.accepted?.length || 0}`)
      pushDebug({
        stage: "publish",
        message: "Emails sent",
        detail: { accepted: data.accepted, rejected: data.rejected },
      })
    } catch (err) {
      const message = (err as Error)?.message || "Unknown error"
      setSendStatus(`Send failed: ${message}`)
      pushDebug({ stage: "publish", message: "Email send failed", detail: { message }, level: "error" })
    } finally {
      setSendLoading(false)
    }
  }, [recipients, emailDraft, pushDebug])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="md:ml-64 md:w-[calc(100%-16rem)] w-full px-4 md:px-6 pt-16 md:pt-20 pb-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="w-4 h-4" />
              Fully Automated Campaign
            </div>
            <h1 className="text-3xl font-bold mt-1">Campaign Orchestrator</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Generate → Schedule → Publish → Measure → Adjust. All in one place, text-only for now.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={runSchedulerOnce} disabled={postsLoading}>
              <Timer className="w-4 h-4 mr-2" />
              Run Scheduler
            </Button>
            <Button onClick={generateIdeas} disabled={ideasLoading || brandLoading || !selectedBrand}>
              {ideasLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Plan
            </Button>
          </div>
        </div>

        {/* Guards */}
        {authLoading || brandLoading ? (
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span>Loading context…</span>
            </div>
          </Card>
        ) : !selectedBrand ? (
          <Card className="p-6 border-dashed text-center">
            <p className="text-lg font-semibold mb-2">Select a brand to start</p>
            <p className="text-muted-foreground text-sm">
              All campaign steps require an active brand. Use the brand switcher in the sidebar.
            </p>
          </Card>
        ) : (
          <>
            {/* Hero + funnel */}
            <Card className="p-6 md:p-8 bg-gradient-to-br from-primary/10 via-accent/10 to-background border-primary/20">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    End-to-end marketing funnel
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                    We generate, schedule, email, and optimize your entire campaign.
                  </h2>
                  <p className="text-muted-foreground text-sm md:text-base">
                    Brand DNA, content ideas, outbound emails, scheduling, and performance feedback are stitched into a single
                    automated flow. You watch the funnel, we move the leads.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Brand: {brandName}</Badge>
                    <Badge variant="secondary">Ideas: {ideas.length}</Badge>
                    <Badge variant="secondary">Scheduled: {scheduled.length}</Badge>
                    <Badge variant="secondary">Published: {published.length}</Badge>
                  </div>
                </div>
                <div className="flex-1 w-full lg:w-auto">
                  <div className="relative w-full max-w-sm mx-auto">
                    <div className="space-y-2">
                      {[
                        { label: "Attract", color: "from-primary/70 to-accent", value: "Ideation", padding: 4 },
                        { label: "Nurture", color: "from-secondary/70 to-primary/60", value: "Email + Posts", padding: 3.5 },
                        { label: "Convert", color: "from-emerald-500/70 to-secondary/70", value: "CTAs & Offers", padding: 3 },
                        { label: "Measure", color: "from-blue-500/60 to-primary/60", value: "Insights", padding: 2.5 },
                      ].map((step, idx) => (
                        <div
                          key={step.label}
                          className={`mx-auto rounded-full bg-gradient-to-r ${step.color} text-white shadow-lg flex items-center justify-between px-4`}
                          style={{ width: `${100 - idx * 12}%`, padding: `${step.padding}rem 1rem` }}
                        >
                          <span className="text-sm font-semibold">{step.label}</span>
                          <span className="text-xs opacity-90">{step.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="absolute -inset-x-6 -bottom-4 blur-3xl opacity-40 bg-primary/30 h-12 rounded-full" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Overview / counts */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Brand</div>
                    <div className="text-lg font-semibold">{brandName}</div>
                  </div>
                  <Target className="w-4 h-4 text-primary" />
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Scheduled</div>
                    <div className="text-2xl font-bold">{scheduled.length}</div>
                  </div>
                  <Timer className="w-4 h-4 text-primary" />
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Published</div>
                    <div className="text-2xl font-bold">{published.length}</div>
                  </div>
                  <Send className="w-4 h-4 text-primary" />
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Ideas in queue</div>
                    <div className="text-2xl font-bold">{ideas.length}</div>
                  </div>
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
              </Card>
            </div>

            {/* Email automation */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <h2 className="text-lg font-semibold">AI-crafted email</h2>
                    <p className="text-sm text-muted-foreground">Turn your top idea into a brand-perfect outbound email.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={generateIdeas} disabled={ideasLoading || brandLoading}>
                    {ideasLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Refresh ideas
                  </Button>
                  <Button size="sm" onClick={generateEmail} disabled={emailLoading || !bestIdea}>
                    {emailLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Generate email
                  </Button>
                </div>
              </div>
              {emailError && (
                <div className="p-3 border border-red-500/30 bg-red-500/10 rounded text-sm text-red-500 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <span>{emailError}</span>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="p-4 border-dashed">
                  <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                    <Users className="w-4 h-4 text-primary" />
                    Recipients
                  </div>
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="recipient@example.com"
                      value={recipientInput}
                      onChange={(e) => setRecipientInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddRecipient()
                        }
                      }}
                    />
                    <Button onClick={handleAddRecipient} variant="secondary">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recipients.length === 0 && (
                      <span className="text-xs text-muted-foreground">No recipients yet.</span>
                    )}
                    {recipients.map((r) => (
                      <Badge key={r} variant="secondary" className="gap-1">
                        {r}
                        <button onClick={() => handleRemoveRecipient(r)} className="text-xs text-muted-foreground hover:text-foreground">
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Button onClick={sendEmail} disabled={sendLoading} className="flex-1">
                      {sendLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                      Send email
                    </Button>
                  </div>
                  {sendStatus && <p className="text-xs text-muted-foreground mt-2">{sendStatus}</p>}
                </Card>
                <Card className="p-4 lg:col-span-2 space-y-3 bg-card/80 border-border/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Subject</div>
                      <Input
                        value={emailDraft.subject}
                        onChange={(e) => setEmailDraft((prev) => ({ ...prev, subject: e.target.value }))}
                        placeholder="Subject line"
                      />
                    </div>
                    <Badge variant="outline">From: brand DNA</Badge>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Preview line</div>
                    <Input
                      value={emailDraft.preview}
                      onChange={(e) => setEmailDraft((prev) => ({ ...prev, preview: e.target.value }))}
                      placeholder="Inbox preview"
                    />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Email body (HTML)</div>
                    <Textarea
                      rows={8}
                      value={emailDraft.html}
                      onChange={(e) => setEmailDraft((prev) => ({ ...prev, html: e.target.value }))}
                      placeholder="Generated email will appear here"
                      className="font-mono text-xs"
                    />
                  </div>
                  {emailDraft.idea && (
                    <p className="text-xs text-muted-foreground">Crafted from idea: “{emailDraft.idea}”.</p>
                  )}
                </Card>
              </div>
            </Card>

            {/* Idea generation */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h2 className="text-lg font-semibold">Generated ideas</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">Select ideas to auto-schedule across your window.</p>
                </div>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    className="w-20"
                    min={1}
                    max={30}
                    value={autoWindowDays}
                    onChange={(e) => setAutoWindowDays(Number(e.target.value) || 7)}
                  />
                  <span className="text-xs text-muted-foreground">days</span>
                  <Input
                    type="number"
                    className="w-20"
                    min={0}
                    max={23}
                    value={autoStartHour}
                    onChange={(e) => setAutoStartHour(Number(e.target.value) || 9)}
                  />
                  <span className="text-xs text-muted-foreground">start hr</span>
                </div>
              </div>
              {ideasError && (
                <div className="p-3 border border-red-500/30 bg-red-500/10 rounded text-sm text-red-500 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <span>{ideasError}</span>
                </div>
              )}
              {ideasLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-28" />
                  ))}
                </div>
              ) : ideas.length === 0 ? (
                <div className="border border-dashed rounded p-6 text-sm text-muted-foreground text-center">
                  No ideas yet. Click “Generate Plan”.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ideas.map((idea, idx) => (
                    <Card key={idx} className="p-4 space-y-3 border-border/60">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Idea</div>
                          <div className="font-semibold leading-tight">{idea.idea}</div>
                        </div>
                        {typeof idea.total_score === "number" && (
                          <Badge variant="secondary">{idea.total_score.toFixed(1)}/10</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-3">{idea.concept}</div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          {[
                            ["C", idea.creativity_score],
                            ["A", idea.brand_alignment_score],
                            ["E", idea.engagement_score],
                            ["Cl", idea.clarity_score],
                          ].map(([label, val]) => (
                            <span key={label as string} className="rounded px-2 py-0.5 bg-muted">
                              {label}:{typeof val === "number" ? (val as number).toFixed(1) : "–"}
                            </span>
                          ))}
                        </div>
                        <Button size="sm" onClick={() => scheduleIdea(idea, idx)}>
                          <CalendarClock className="w-4 h-4 mr-2" />
                          Auto-schedule
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>

            {/* Schedule & publish */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-primary" />
                  <h2 className="text-lg font-semibold">Schedule & Publish</h2>
                </div>
                <Button variant="outline" size="sm" onClick={loadPosts} disabled={postsLoading}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
              {postsLoading ? (
                <Skeleton className="h-24" />
              ) : scheduled.length === 0 && published.length === 0 ? (
                <div className="border border-dashed rounded p-6 text-center text-sm text-muted-foreground">
                  Nothing scheduled yet. Add ideas to the plan.
                </div>
              ) : (
                <div className="space-y-3">
                  {[...scheduled, ...published].map((post) => (
                    <Card key={post.id} className="p-4 border-border/60">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{post.title}</span>
                            <Badge variant={post.status === "published" ? "secondary" : "outline"}>
                              {post.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {post.plannedAt
                              ? `Planned: ${new Date(post.plannedAt).toLocaleString()}`
                              : "No planned time"}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {post.status === "scheduled" && (
                            <Button size="sm" onClick={() => publishNow(post)}>
                              <Send className="w-4 h-4 mr-1" />
                              Publish now
                            </Button>
                          )}
                        </div>
                      </div>
                      {post.caption && (
                        <div className="text-sm text-muted-foreground mt-2 line-clamp-3">{post.caption}</div>
                      )}
                      {post.scores && (
                        <div className="flex gap-2 text-xs text-muted-foreground mt-2 flex-wrap">
                          {Object.entries(post.scores).map(([k, v]) =>
                            typeof v === "number" ? (
                              <span key={k} className="px-2 py-0.5 rounded bg-muted">
                                {k}:{v.toFixed(1)}
                              </span>
                            ) : null
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </Card>

            {/* Insights & Engagement */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">Instagram Insights</h3>
                  </div>
                  <Button size="sm" variant="outline" onClick={loadInsights} disabled={analyticsLoading}>
                    {analyticsLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    Sync
                  </Button>
                </div>
                {analyticsLoading ? (
                  <Skeleton className="h-24" />
                ) : insights ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Metric label="Impressions" value={insights?.insights?.impressions} />
                    <Metric label="Reach" value={insights?.insights?.reach} />
                    <Metric label="Likes" value={insights?.insights?.likes} />
                    <Metric label="Comments" value={insights?.insights?.comments} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No insights yet. Connect Instagram and sync.</p>
                )}
              </Card>
              <Card className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquareIcon />
                    <h3 className="font-semibold">Engagement</h3>
                  </div>
                  <Button size="sm" variant="outline" onClick={loadEngagement} disabled={engagementLoading}>
                    {engagementLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    Sync
                  </Button>
                </div>
                {engagementLoading ? (
                  <Skeleton className="h-24" />
                ) : engagement.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No engagement loaded yet.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {engagement.slice(0, 10).map((item, idx) => (
                      <div key={idx} className="rounded border border-border/50 p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold">{item.author || "Unknown"}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.timestamp ? new Date(item.timestamp).toLocaleString() : ""}
                          </span>
                        </div>
                        <div className="text-sm mt-1">{item.content}</div>
                        <div className="text-xs text-muted-foreground mt-1">{item.type}</div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Debug */}
            <Card className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">Debug stream</h3>
              </div>
              <div
                ref={debugRef}
                className="border border-border/60 rounded bg-muted/30 max-h-72 overflow-y-auto text-sm space-y-2 p-3"
              >
                {debug.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Actions will appear here.</p>
                ) : (
                  debug.map((d, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Badge
                        variant={d.level === "warn" ? "secondary" : "outline"}
                        className={d.level === "error" ? "border-red-500 text-red-500" : ""}
                      >
                        {d.stage}
                      </Badge>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(d.ts).toLocaleTimeString()} • {d.level || "info"}
                        </div>
                        <div>{d.message}</div>
                        {d.detail && (
                          <pre className="text-[11px] bg-background/60 border border-border/50 rounded p-2 mt-1 whitespace-pre-wrap break-all">
                            {JSON.stringify(d.detail, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}

function Metric({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded border border-border/60 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{typeof value === "number" ? value.toLocaleString() : "—"}</div>
    </div>
  )
}

function MessageSquareIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12c0 4.418-4.03 8-9 8-1.37 0-2.67-.242-3.84-.685L3 20l1.25-3.75C3.48 14.94 3 13.52 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
}

