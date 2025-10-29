"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sparkles, Copy, RefreshCw, Save, Trash2, Download, Zap, LayoutDashboard, MessageSquare, FileText, ChartBar, Calendar, Search, Bell, Settings, Heart, MoreHorizontal, User, Share2, RefreshCw as Retweet, BadgeCheck, CheckCircle2, Menu, Plus } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Popover, PopoverContent, PopoverAnchor, PopoverTrigger } from "@/components/ui/popover"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { useEffect } from "react"

type SavedPost = {
  id: string
  image: string
  caption: string
  hashtags: string[]
  platform: string
  date: Date
}

export default function ContentGenerationPage() {
  const [showCreateFlow, setShowCreateFlow] = useState(false)
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([
    {
      id: "1",
      image: "/smp-1.jpg",
      caption: "New Drop: Summer Essentials ☀️ Beat the heat in style. Our lightweight tees and breathable fabrics are here!",
      hashtags: ["#SummerFit", "#Style", "#NewDrop", "#Fashion"],
      platform: "instagram",
      date: new Date(Date.now() - 86400000 * 2)
    },
    {
      id: "2",
      image: "/smp-2.jpeg",
      caption: "Behind the Scenes 🎬 Sneak peek from today's shoot. Which color are you loving most?",
      hashtags: ["#BehindTheScenes", "#Photoshoot", "#BTS"],
      platform: "instagram",
      date: new Date(Date.now() - 86400000 * 1)
    },
    {
      id: "3",
      image: "/smp-3.jpeg",
      caption: "Community Spotlight 💡 Shoutout to @alex for styling our jacket like a pro. Get featured by tagging us!",
      hashtags: ["#Community", "#UserGenerated", "#Style"],
      platform: "facebook",
      date: new Date(Date.now() - 86400000 * 3)
    },
    {
      id: "4",
      image: "/smp-4.jpg",
      caption: "Limited time offer! 🔥 Get 20% off on all summer collections. Use code SUMMER20 at checkout.",
      hashtags: ["#Sale", "#SummerSale", "#Discount"],
      platform: "twitter",
      date: new Date(Date.now() - 86400000 * 4)
    },
    {
      id: "5",
      image: "/smp-5.jpeg",
      caption: "Weekend vibes ✨ Nothing beats a casual Sunday outfit that's both comfortable and stylish.",
      hashtags: ["#Weekend", "#Casual", "#Style"],
      platform: "instagram",
      date: new Date(Date.now() - 86400000 * 5)
    },
    {
      id: "6",
      image: "/smp-6.jpg",
      caption: "Introducing our eco-friendly line 🌱 Made with sustainable materials for a better tomorrow.",
      hashtags: ["#EcoFriendly", "#Sustainable", "#Green"],
      platform: "linkedin",
      date: new Date(Date.now() - 86400000 * 6)
    }
  ])
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [prompt, setPrompt] = useState("")
  const [tone, setTone] = useState("professional")
  const [platforms, setPlatforms] = useState<string[]>(["instagram"]) 
  const [uploads, setUploads] = useState<string[]>([])
  const [moodSelections, setMoodSelections] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [captionsByPlatform, setCaptionsByPlatform] = useState<Record<string,string>>({})
  const [hashtagsByPlatform, setHashtagsByPlatform] = useState<Record<string,string[]>>({})
  const [selectedPreviewPlatform, setSelectedPreviewPlatform] = useState<string>("instagram")
  const [newHashtag, setNewHashtag] = useState("")
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const isMobile = useIsMobile()

  // Command palette shortcut: Ctrl/Cmd + K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const tones = [
    { id: "professional", label: "Professional" },
    { id: "casual", label: "Casual" },
    { id: "funny", label: "Funny" },
    { id: "inspirational", label: "Inspirational" },
    { id: "urgent", label: "Urgent" },
    { id: "friendly", label: "Friendly" },
  ]
  const platformOptions = [
    { id: "instagram", label: "Instagram", icon: "/icons/instagram.svg" },
    { id: "tiktok", label: "TikTok", icon: "/icons/tiktok.svg" },
    { id: "facebook", label: "Facebook", icon: "/icons/facebook.svg" },
    { id: "linkedin", label: "LinkedIn", icon: "/icons/linkedin.svg" },
    { id: "twitter", label: "X/Twitter", icon: "/icons/x.svg" },
    { id: "youtube", label: "YouTube", icon: "/icons/youtube.svg" },
  ]

  const handleUpload = (files: FileList | null) => {
    if (!files) return
    const urls = Array.from(files).slice(0, 6).map((f) => URL.createObjectURL(f))
    setUploads((prev) => [...prev, ...urls].slice(0, 6))
  }

  const togglePlatform = (id: string) => {
    setPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const moodboardImages = [
    "/smp-1.jpg",
    "/smp-2.jpeg",
    "/smp-3.jpeg",
    "/smp-4.jpg",
    "/smp-5.jpeg",
    "/smp-6.jpg",
  ]

  const toggleMood = (src: string) => {
    setMoodSelections((prev) => {
      if (prev.includes(src)) return prev.filter((s) => s !== src)
      if (prev.length >= 3) return prev
      return [...prev, src]
    })
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    await new Promise((r) => setTimeout(r, 1200))
    setGeneratedImage(moodSelections[0] ?? uploads[0] ?? "/smp-1.jpg")
    const targetPlatforms = platforms.length ? platforms : ["instagram","facebook","twitter"]
    const captions: Record<string,string> = {}
    const tags: Record<string,string[]> = {}
    targetPlatforms.forEach((p) => {
      if (p === 'instagram') {
        captions[p] = `✨ ${prompt || 'New drop'} — crafted for you. Tap link in bio.`
        tags[p] = ["#mayvn", "#style", "#trend", "#newdrop"]
      } else if (p === 'facebook') {
        captions[p] = `${prompt || 'New drop'}\n\nDiscover more on our page and share your thoughts!`
        tags[p] = ["#Mayvn", "#Community"]
      } else if (p === 'twitter') {
        captions[p] = `${prompt || 'New drop'} — now live. `
        tags[p] = ["#mayvn", "#now"]
      } else {
        captions[p] = prompt || 'New post'
        tags[p] = ["#mayvn"]
      }
    })
    setCaptionsByPlatform(captions)
    setHashtagsByPlatform(tags)
    setIsGenerating(false)
    setSelectedPreviewPlatform(platforms[0] ?? "instagram")
    setStep(3)
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
          <Link
            href="/campaigns"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <Calendar className="w-5 h-5" />
            <span>Campaigns</span>
          </Link>
          <Link href="/content" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted text-foreground">
            <FileText className="w-5 h-5" />
            <span>Content</span>
          </Link>
          <Link
            href="/engagement"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Engagement</span>
          </Link>
          <Link
            href="/analytics"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <ChartBar className="w-5 h-5" />
            <span>Analytics</span>
          </Link>
        </nav>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 md:left-64 right-0 border-b border-border/50 bg-card/30 backdrop-blur-sm z-40" suppressHydrationWarning>
        <div className="w-full px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Mobile hamburger */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Open menu">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <div className="p-6 border-b border-border/50">
                    <Image src="/logo-full.png" alt="Mayvn Logo" width={140} height={50} className="h-auto w-auto" />
                  </div>
                  <nav className="p-4 space-y-1">
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                      <LayoutDashboard className="w-5 h-5" />
                      <span>Dashboard</span>
                    </Link>
                    <Link href="/campaigns" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                      <Calendar className="w-5 h-5" />
                      <span>Campaigns</span>
                    </Link>
                    <Link href="/content" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted text-foreground">
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
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
            {/* Search - inline command palette dropdown */}
            {!isMobile && (
            <Popover open={cmdOpen} onOpenChange={setCmdOpen}>
              <PopoverAnchor asChild>
                <div className="hidden sm:flex items-center gap-2 bg-input border border-border/50 rounded-lg px-3 py-2 w-64 md:w-96" suppressHydrationWarning>
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); if (!cmdOpen) setCmdOpen(true) }}
                    onFocus={() => setCmdOpen(true)}
                    placeholder="Search campaigns, actions…"
                    className="bg-transparent border-0 outline-none text-sm flex-1"
                  />
                  <kbd className="hidden md:inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground border border-border/60">Ctrl K</kbd>
                </div>
              </PopoverAnchor>
              <PopoverContent align="start" sideOffset={8} className="p-2 w-[min(90vw,36rem)]">
                <div className="max-h-72 overflow-y-auto divide-y divide-border/50">
                  <div className="py-1">
                    <p className="px-2 pb-1 text-xs text-muted-foreground">Actions</p>
                    <div className="flex flex-col">
                      {[{icon: Sparkles, label: 'Generate Content', href: '/content'}, {icon: Plus, label: 'New Campaign', href: '/campaigns/new'}, {icon: ChartBar, label: 'View Analytics', href: '/analytics'}, {icon: Calendar, label: 'Schedule Posts', href: '/schedule'}]
                        .filter(a => a.label.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((a, i) => (
                          <button key={i} onClick={() => { setCmdOpen(false); router.push(a.href) }} className="flex items-center gap-2 px-2 py-2 text-sm hover:bg-muted rounded">
                            <a.icon className="w-4 h-4 text-muted-foreground" />
                            <span>{a.label}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            )}
          </div>
          {/* Mobile search */}
          <div className="flex items-center gap-2 sm:hidden w-full">
            {isMobile && (
            <Popover open={cmdOpen} onOpenChange={setCmdOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 w-full justify-start px-3">
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" sideOffset={8} className="p-2 w-[min(98vw,28rem)]">
                <div className="flex items-center gap-2 bg-input border border-border/50 rounded-lg px-3 py-2 mb-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search…"
                    className="bg-transparent border-0 outline-none text-sm flex-1"
                  />
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-border/50">
                  <div className="py-1">
                    <p className="px-2 pb-1 text-xs text-muted-foreground">Actions</p>
                    <div className="flex flex-col">
                      {[{icon: Sparkles, label: 'Generate Content', href: '/content'}]
                        .filter(a => a.label.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((a, i) => (
                          <button key={i} onClick={() => { setCmdOpen(false); router.push(a.href) }} className="flex items-center gap-2 px-2 py-2 text-sm hover:bg-muted rounded">
                            <a.icon className="w-4 h-4 text-muted-foreground" />
                            <span>{a.label}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            )}
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
            <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-xs md:text-sm font-bold">
              JD
            </div>
          </div>
        </div>
      </header>

      <main className="md:ml-64 md:w-[calc(100%-16rem)] w-full px-4 md:px-8 pt-16 md:pt-20 pb-8">
        {!showCreateFlow ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold">Content Library</h1>
              <Button onClick={() => {
                setShowCreateFlow(true)
                setStep(1)
              }} className="bg-primary hover:bg-primary/90">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Content
              </Button>
            </div>

            {/* Grid of saved posts */}
            {savedPosts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedPosts.map((post) => (
                  <Card key={post.id} className="border-border/50 bg-card/80 backdrop-blur-sm p-0 overflow-hidden">
                    <div className="w-full">
                      <div className="group relative w-full aspect-square bg-muted">
                        <Image
                          src={post.image}
                          alt={post.caption}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover"
                          priority={false}
                        />
                        {/* Hover caption overlay */}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
                          <div className="mx-2 mb-2 max-w-[95%] rounded-[5px] border border-primary/40 bg-[#12292d] backdrop-blur-sm text-white p-3 shadow-md">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-background/60 border border-border/40">{post.platform}</span>
                            </div>
                            <h4 className="font-medium text-sm leading-snug mb-0.5">{post.caption.slice(0, 50)}{post.caption.length > 50 ? '...' : ''}</h4>
                            <p className="text-xs leading-relaxed opacity-90 line-clamp-2">{post.hashtags.join(" ")}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm p-12 flex flex-col items-center justify-center min-h-96">
                <Sparkles className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No content yet</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Generate your first post to get started
                </p>
                <Button onClick={() => {
                  setShowCreateFlow(true)
                  setStep(1)
                }} className="bg-primary hover:bg-primary/90">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Content
                </Button>
              </Card>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold">Create Content</h1>
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">Step {step} of 3</div>
                <Button variant="outline" onClick={() => {
                  setShowCreateFlow(false)
                  setStep(1)
                }}>Cancel</Button>
              </div>
            </div>

            {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 border-border/50 bg-card/80 backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-4">Content Brief</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">What do you want to say?</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={6}
                    placeholder="Announce our new summer collection…"
                    className="w-full bg-input border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-vertical"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-3">Tone</label>
                  <div className="flex flex-wrap gap-2">
                    {tones.map((t) => (
                      <button key={t.id} onClick={() => setTone(t.id)} className={`px-3 py-2 rounded-lg border text-sm ${tone===t.id? 'border-primary bg-primary/10' : 'border-border/50 hover:border-primary/40'}`}>{t.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-3">Platforms</label>
                  <div className="flex flex-wrap gap-3">
                    {platformOptions.map((p) => (
                      <button key={p.id} onClick={() => togglePlatform(p.id)} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${platforms.includes(p.id)?'border-primary bg-primary/10':'border-border/50 hover:border-primary/40'}`}>
                        <span className="inline-block w-4 h-4">
                          {/* icon placeholder */}
                          <span className="block w-4 h-4 rounded-full bg-muted" />
                        </span>
                        <span className="text-sm">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => setStep(2)} disabled={!prompt} className="bg-primary hover:bg-primary/90">Next</Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-border/50 bg-card/80 backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-4">Upload Images (optional)</h2>
              <div className="border-2 border-dashed border-border/60 rounded-xl p-6 text-center">
                <input id="upload" type="file" accept="image/*" multiple onChange={(e)=>handleUpload(e.target.files)} className="hidden" />
                <label htmlFor="upload" className="inline-flex items-center gap-2 px-4 py-2 rounded-md border cursor-pointer hover:bg-muted/40">
                  <Download className="w-4 h-4" />
                  <span>Choose files</span>
                </label>
                <p className="text-xs text-muted-foreground mt-2">Up to 6 images</p>
                      </div>
              {uploads.length>0 && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {uploads.map((src,i)=> (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                      <Image src={src} alt="upload" fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
              </Card>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 pb-24">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Moodboard</h2>
              <div className="text-sm text-muted-foreground">Select up to 3</div>
            </div>
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]"><div className="contents">
              {moodboardImages.map((src) => (
                <button key={src} onClick={()=>toggleMood(src)} className="mb-4 break-inside-avoid relative w-full">
                  <div className={`relative overflow-hidden rounded-xl border ${moodSelections.includes(src)?'border-primary ring-2 ring-primary/50':'border-border/50'}`}>
                    <Image src={src} alt="mood" width={800} height={1000} className="w-full h-auto object-cover" />
                    {moodSelections.includes(src) && (
                      <span className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-primary text-primary-foreground">Selected</span>
                    )}
                  </div>
                </button>
              ))}
              {uploads.map((src,i)=> (
                <button key={`u-${i}`} onClick={()=>toggleMood(src)} className="mb-4 break-inside-avoid relative w-full">
                  <div className={`relative overflow-hidden rounded-xl border ${moodSelections.includes(src)?'border-primary ring-2 ring-primary/50':'border-border/50'}`}>
                    <Image src={src} alt="upload" width={800} height={1000} className="w-full h-auto object-cover" />
                  </div>
                </button>
              ))}
            </div></div>
            <div className="flex justify-start">
              <Button variant="outline" onClick={()=>setStep(1)}>Back</Button>
            </div>
            {/* Floating action bar */}
            <div className="fixed right-6 bottom-6 z-40">
              <Button onClick={handleGenerate} disabled={isGenerating || (moodSelections.length===0 && uploads.length===0)} className="shadow-lg">
                {isGenerating? (<><Zap className="w-4 h-4 mr-2 animate-spin"/>Generating…</>):(<><Sparkles className="w-4 h-4 mr-2"/>Generate</>)}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 border-border/50 bg-card/80 backdrop-blur-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Generated Post</h2>
                  {/* Mobile: platform selector under title */}
                  <div className="mt-2 flex flex-wrap gap-2 sm:hidden">
                    {(platforms.length ? platforms : ["instagram","facebook","twitter"]).map((p) => (
                      <button
                        key={p}
                        onClick={() => setSelectedPreviewPlatform(p)}
                        className={`px-3 py-1.5 rounded-full text-xs border ${selectedPreviewPlatform===p ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-primary/40'}`}
                      >
                        {p === 'twitter' ? 'X/Twitter' : p.charAt(0).toUpperCase()+p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Desktop: selector on the right */}
                <div className="hidden sm:flex flex-wrap gap-2">
                  {(platforms.length ? platforms : ["instagram","facebook","twitter"]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setSelectedPreviewPlatform(p)}
                      className={`px-3 py-1.5 rounded-full text-xs border ${selectedPreviewPlatform===p ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-primary/40'}`}
                    >
                      {p === 'twitter' ? 'X/Twitter' : p.charAt(0).toUpperCase()+p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mx-auto w-full max-w-[520px]">
                {/* X/Twitter layout: header + caption above media */}
                {selectedPreviewPlatform === 'twitter' && (
                  <div className="mb-3 text-sm">
                    <div className="flex items-center gap-2 text-white">
                      <div className="w-8 h-8 rounded-full bg-muted" />
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Brand</span>
                        <BadgeCheck className="w-4 h-4 text-sky-400" />
                        <span className="text-muted-foreground">@brand · now</span>
                      </div>
                    </div>
                    <p className="mt-2 leading-relaxed">
                      {captionsByPlatform['twitter'] || ''}{" "}
                      {(hashtagsByPlatform['twitter'] || []).length > 0 && (
                        <span className="text-primary">{(hashtagsByPlatform['twitter']||[]).join(" ")}</span>
                      )}
                    </p>
                  </div>
                )}

                <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-muted">
                  {generatedImage && (
                    <Image src={generatedImage} alt="generated" fill className="object-cover" />
                  )}
                  {/* Simple platform mockups */}
                  {/* Instagram overlay */}
                  {(selectedPreviewPlatform === 'instagram') && (
                    <>
                      <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/40 to-transparent p-3 flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-white/80" />
                          <span className="text-xs">brand_account</span>
                        </div>
                        <MoreHorizontal className="w-4 h-4" />
                      </div>
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-3 text-white">
                        <div className="flex items-center gap-3">
                          <Heart className="w-4 h-4" />
                          <MessageSquare className="w-4 h-4" />
                        </div>
                      </div>
                    </>
                  )}
                  {/* Facebook overlay */}
                  {(selectedPreviewPlatform === 'facebook') && (
                    <>
                      <div className="absolute top-0 inset-x-0 bg-black/50 p-3 text-white flex items-center gap-2">
                        <User className="w-5 h-5" />
                        <span className="text-xs font-medium">Brand Page</span>
                      </div>
                      <div className="absolute bottom-0 inset-x-0 bg-black/40 p-2 text-white text-xs">
                        <div className="flex items-center gap-4">
                          <span>Like</span>
                          <span>Comment</span>
                          <span>Share</span>
                        </div>
                      </div>
                    </>
                  )}
                  {/* X/Twitter overlay: only actions bar below */}
                  {(selectedPreviewPlatform === 'twitter') && (
                    <div className="absolute bottom-0 inset-x-0 p-2 text-white text-xs bg-gradient-to-t from-black/60 to-transparent">
                      <div className="flex items-center gap-8">
                        <div className="inline-flex items-center gap-1"><MessageSquare className="w-4 h-4" /> 63</div>
                        <div className="inline-flex items-center gap-1"><Retweet className="w-4 h-4" /> 112</div>
                        <div className="inline-flex items-center gap-1"><Heart className="w-4 h-4" /> 1.1K</div>
                        <div className="inline-flex items-center gap-1"><Share2 className="w-4 h-4" /> 12K</div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Feed-style caption preview under the image */}
                <div className="mt-3 text-sm">
                  {/* Instagram-style description */}
                  {(selectedPreviewPlatform === 'instagram') && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-muted" />
                        <span className="font-medium">brand_account</span>
                      </div>
                      <p className="leading-relaxed">
                        {captionsByPlatform['instagram'] || ''}
                        {(hashtagsByPlatform['instagram']||[]).length > 0 && (
                          <span className="ml-1 text-primary">
                            {" "}
                            {(hashtagsByPlatform['instagram']||[]).join(" ")}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                  {/* Facebook-style description */}
                  {(selectedPreviewPlatform === 'facebook') && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-muted" />
                        <div>
                          <div className="font-semibold">Brand Page</div>
                          <div className="text-xs text-muted-foreground">Just now · Public</div>
                        </div>
                      </div>
                      <p className="leading-relaxed">
                        {captionsByPlatform['facebook'] || ''}{" "}
                        {(hashtagsByPlatform['facebook']||[]).length > 0 && (
                          <span className="text-primary">{(hashtagsByPlatform['facebook']||[]).join(" ")}</span>
                        )}
                      </p>
                    </div>
                  )}
                  {/* X/Twitter-style description is above image */}
                </div>
              </div>
            </Card>
            <Card className="p-6 border-border/50 bg-card/80 backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-4">Caption & Hashtags</h2>
              <div className="space-y-4">
                <textarea
                  value={captionsByPlatform[selectedPreviewPlatform] || ''}
                  onChange={(e)=> setCaptionsByPlatform((prev)=> ({...prev, [selectedPreviewPlatform]: e.target.value}))}
                  rows={6}
                  className="w-full bg-input border border-border/50 rounded-lg px-3 py-2 text-sm"
                />
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Hashtags</label>
                  <div className="flex flex-wrap gap-2">
                    {(hashtagsByPlatform[selectedPreviewPlatform]||[]).map((h,i)=>(
                      <div key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
                        <span className="text-xs">{h}</span>
                        <button
                          onClick={() => {
                            setHashtagsByPlatform((prev) => ({
                              ...prev,
                              [selectedPreviewPlatform]: (prev[selectedPreviewPlatform] || []).filter((_, idx) => idx !== i)
                            }))
                          }}
                          className="ml-1 hover:bg-primary/20 rounded p-0.5"
                        >
                          <span className="text-xs">×</span>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newHashtag}
                      onChange={(e) => setNewHashtag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newHashtag.trim()) {
                          const tag = newHashtag.trim().startsWith('#') ? newHashtag.trim() : `#${newHashtag.trim()}`
                          setHashtagsByPlatform((prev) => ({
                            ...prev,
                            [selectedPreviewPlatform]: [...(prev[selectedPreviewPlatform] || []), tag]
                          }))
                          setNewHashtag("")
                        }
                      }}
                      placeholder="Add hashtag (press Enter)"
                      className="flex-1 bg-input border border-border/50 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (newHashtag.trim()) {
                          const tag = newHashtag.trim().startsWith('#') ? newHashtag.trim() : `#${newHashtag.trim()}`
                          setHashtagsByPlatform((prev) => ({
                            ...prev,
                            [selectedPreviewPlatform]: [...(prev[selectedPreviewPlatform] || []), tag]
                          }))
                          setNewHashtag("")
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                        </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={()=>setStep(2)}>Back</Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={()=>{
                      const cap = captionsByPlatform[selectedPreviewPlatform] || ''
                      const tags = (hashtagsByPlatform[selectedPreviewPlatform]||[]).join(' ')
                      navigator.clipboard.writeText(`${cap}\n${tags}`)
                    }}><Copy className="w-4 h-4 mr-2"/>Copy</Button>
                    <Button className="bg-primary hover:bg-primary/90" onClick={() => {
                      if (generatedImage) {
                        const newPost: SavedPost = {
                          id: Date.now().toString(),
                          image: generatedImage,
                          caption: captionsByPlatform[selectedPreviewPlatform] || '',
                          hashtags: hashtagsByPlatform[selectedPreviewPlatform] || [],
                          platform: selectedPreviewPlatform,
                          date: new Date()
                        }
                        setSavedPosts([...savedPosts, newPost])
                        setSaveDialogOpen(true)
                      }
                    }}><Save className="w-4 h-4 mr-2"/>Save</Button>
                  </div>
                </div>
              </div>
              </Card>
          </div>
        )}
          </>
        )}
      </main>

      {/* Save Confirmation Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle>Post Saved</DialogTitle>
            </div>
            <DialogDescription>
              Your post has been saved successfully. You can find it in your saved content library.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button onClick={() => {
              setSaveDialogOpen(false)
              setShowCreateFlow(false)
              setStep(1)
              // Reset form
              setPrompt("")
              setUploads([])
              setMoodSelections([])
              setGeneratedImage(null)
              setCaptionsByPlatform({})
              setHashtagsByPlatform({})
            }} className="bg-primary hover:bg-primary/90">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
