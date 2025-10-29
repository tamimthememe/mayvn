"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
// Command palette UI removed for desktop dropdown; keeping only icons/actions
import { useRouter } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from "@/components/ui/popover"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Menu,
  Plus,
  Settings,
  Bell,
  Search,
  ChevronRight,
  Sparkles,
  Zap,
  Heart,
  LayoutDashboard,
  MessageSquare,
  FileText,
  ChartBar,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("week")
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC',
    }).format(d)
  

  const stats = [
    {
      label: "Active Campaigns",
      value: "12",
      change: "+3 this week",
      icon: Calendar,
      color: "from-secondary to-teal-600",
    },
    {
      label: "Content Generated",
      value: "248",
      change: "+45 this week",
      icon: Sparkles,
      color: "from-secondary to-teal-600",
    },
    {
      label: "Total Engagement",
      value: "12.5K",
      change: "+2.3K this week",
      icon: Heart,
      color: "from-secondary to-teal-600",
    },
    {
      label: "Avg. Reach",
      value: "45.2K",
      change: "+8.5% this week",
      icon: TrendingUp,
      color: "from-secondary to-teal-600",
    },
  ]

  const recentCampaigns = [
    {
      id: 1,
      name: "Summer Collection Launch",
      platforms: ["Instagram", "TikTok"],
      status: "Active",
      engagement: "3.2K",
      reach: "45.2K",
      posts: 8,
    },
    {
      id: 2,
      name: "Back to School Promo",
      platforms: ["Instagram", "Facebook"],
      status: "Scheduled",
      engagement: "1.8K",
      reach: "28.5K",
      posts: 5,
    },
    {
      id: 3,
      name: "Holiday Gift Guide",
      platforms: ["TikTok", "YouTube"],
      status: "Draft",
      engagement: "0",
      reach: "0",
      posts: 3,
    },
  ]

  const quickActions = [
    {
      icon: Plus,
      label: "New Campaign",
      href: "/dashboard/campaigns/new",
      color: "from-secondary to-teal-600",
    },
    {
      icon: Sparkles,
      label: "Generate Content",
      href: "/content",
      color: "from-secondary to-teal-600",
    },
    {
      icon: Calendar,
      label: "Schedule Posts",
      href: "/dashboard/schedule",
      color: "from-secondary to-teal-600",
    },
    {
      icon: BarChart3,
      label: "View Analytics",
      href: "/dashboard/analytics",
      color: "from-secondary to-teal-600",
    },
  ]

  const socialConnections = [
    {
      name: "Instagram",
      icon: "📷",
      connected: false,
      href: "/dashboard/connectinstagram",
      gradient: "from-pink-500 via-purple-500 to-orange-500",
    },
  ]

  const generatedPosts = [
    {
      id: 1,
      title: "New Drop: Summer Essentials ☀️",
      body:
        "Beat the heat in style. Our lightweight tees and breathable fabrics are here! #SummerFit #Style",
      image: "/smp-1.jpg",
      platform: "Instagram",
      likes: 1240,
      comments: 87,
    },
    {
      id: 2,
      title: "Behind the Scenes 🎬",
      body:
        "Sneak peek from today’s shoot. Which color are you loving most?",
      image: "/smp-2.jpeg",
      platform: "TikTok",
      likes: 980,
      comments: 42,
    },
    {
      id: 3,
      title: "Community Spotlight 💡",
      body:
        "Shoutout to @alex for styling our jacket like a pro. Get featured by tagging us!",
      image: "/smp-3.jpeg",
      platform: "Facebook",
      likes: 650,
      comments: 23,
    },
    {
      id: 4,
      title: "New Drop: Summer Essentials ☀️",
      body:
        "Beat the heat in style. Our lightweight tees and breathable fabrics are here! #SummerFit #Style",
      image: "/smp-4.jpg",
      platform: "Instagram",
      likes: 1240,
      comments: 87,
    },
    {
      id: 5,
      title: "Behind the Scenes 🎬",
      body:
        "Sneak peek from today’s shoot. Which color are you loving most?",
      image: "/smp-5.jpeg",
      platform: "TikTok",
      likes: 980,
      comments: 42,
    },
    {
      id: 6,
      title: "Community Spotlight 💡",
      body:
        "Shoutout to @alex for styling our jacket like a pro. Get featured by tagging us!",
      image: "/smp-6.jpg",
      platform: "Facebook",
      likes: 650,
      comments: 23,
    },
  ]

  const upcomingEvents = [
    { date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1), label: "Campaign goes live" },
    { date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 3), label: "Weekly report ready" },
    { date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 6), label: "New feature available" },
  ]
  

  // Auto-advance the carousel every 5 seconds
  useEffect(() => {
    if (!carouselApi) return
    const interval = setInterval(() => {
      try {
        carouselApi.scrollNext()
      } catch {}
    }, 5000)
    return () => clearInterval(interval)
  }, [carouselApi])

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
  const isMobile = useIsMobile()
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
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted text-foreground">
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
          <Link
            href="/content"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
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
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted text-foreground">
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
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
            {/* Search - inline command palette dropdown */}
            {!isMobile && (
            <Popover open={cmdOpen} onOpenChange={setCmdOpen}>
              <PopoverAnchor asChild>
                <div className="hidden sm:flex items-center gap-2 bg-input border border-border/50 rounded-lg px-3 py-2 w-80 md:w-[32rem]" suppressHydrationWarning>
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
                      {[{icon: Sparkles, label: 'Generate Content', href: '/dashboard/content'}, {icon: Plus, label: 'New Campaign', href: '/dashboard/campaigns/new'}, {icon: ChartBar, label: 'View Analytics', href: '/dashboard/analytics'}, {icon: Calendar, label: 'Schedule Posts', href: '/dashboard/schedule'}]
                        .filter(a => a.label.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((a, i) => (
                          <button key={i} onClick={() => { setCmdOpen(false); router.push(a.href) }} className="flex items-center gap-2 px-2 py-2 text-sm hover:bg-muted rounded">
                            <a.icon className="w-4 h-4 text-muted-foreground" />
                            <span>{a.label}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                  <div className="py-1">
                    <p className="px-2 pb-1 text-xs text-muted-foreground">Campaigns</p>
                    <div className="flex flex-col">
                      {recentCampaigns
                        .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((c) => (
                          <button key={c.id} onClick={() => { setCmdOpen(false); router.push('/dashboard/campaigns') }} className="flex items-center gap-2 px-2 py-2 text-sm hover:bg-muted rounded">
                            <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
                            <span>{c.name}</span>
                          </button>
                        ))}
                      {searchQuery && recentCampaigns.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                        <div className="px-2 py-2 text-xs text-muted-foreground">No campaigns found</div>
                      )}
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
                      {[{icon: Sparkles, label: 'Generate Content', href: '/content'}, {icon: Plus, label: 'New Campaign', href: '/dashboard/campaigns/new'}]
                        .filter(a => a.label.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((a, i) => (
                          <button key={i} onClick={() => { setCmdOpen(false); router.push(a.href) }} className="flex items-center gap-2 px-2 py-2 text-sm hover:bg-muted rounded">
                            <a.icon className="w-4 h-4 text-muted-foreground" />
                            <span>{a.label}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                  <div className="py-1">
                    <p className="px-2 pb-1 text-xs text-muted-foreground">Navigate</p>
                    <div className="flex flex-col">
                      {[
                        {icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard'},
                        {icon: FileText, label: 'Content', href: '/content'},
                      ]
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

      {/* Main Content */}
      <main className="md:ml-64 md:w-[calc(100%-16rem)] w-full px-4 md:px-6 pt-16 md:pt-20 pb-6 md:pb-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-semibold mb-2">Welcome back, John!</h2>
          <p className="text-muted-foreground">Here's what's happening with your campaigns today</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <Card
                key={i}
                className="border-border/50 bg-card/80 backdrop-blur-sm p-5 hover:border-primary/50 transition-all duration-300 group"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} p-2.5 group-hover:scale-110 transition-transform flex-shrink-0`}
                  >
                    <Icon className="w-full h-full text-white" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                    <h3 className="text-2xl font-semibold">{stat.value}</h3>
                    <p className="text-xs">
                      <span className={stat.change.startsWith('+') ? 'text-green-500' : stat.change.startsWith('-') ? 'text-red-500' : 'text-secondary'}>
                        {stat.change}
                      </span>
                    </p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Generated Posts Carousel */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Featured Posts</h3>
            <div className="text-sm text-muted-foreground">Auto-rotates every 5s</div>
          </div>
          <Carousel className="relative w-full overflow-hidden" opts={{ loop: true }} setApi={setCarouselApi}>
            <CarouselContent className="ml-0">
              {generatedPosts.map((post) => (
                <CarouselItem key={post.id} className="basis-full sm:basis-1/2 lg:basis-1/3">
                  <Card className="border-border/50 bg-card/80 backdrop-blur-sm p-0 overflow-hidden">
                    <div className="w-full">
                      <div className="group relative w-full aspect-square bg-muted">
                        <Image
                          src={post.image}
                          alt={post.title}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover"
                          priority={false}
                        />
                        {/* Hover caption overlay at bottom inside the image */}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
                          <div className="mx-2 mb-2 max-w-[95%] rounded-[5px] border border-primary/40 bg-[#12292d] backdrop-blur-sm text-white p-3 shadow-md">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-background/60 border border-border/40">{post.platform}</span>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="inline-flex items-center gap-1"><Heart className="w-3 h-3" />{post.likes}</span>
                                <span className="inline-flex items-center gap-1"><MessageSquare className="w-3 h-3" />{post.comments}</span>
                              </div>
                            </div>
                            <h4 className="font-medium text-sm leading-snug mb-0.5">{post.title}</h4>
                            <p className="text-xs leading-relaxed opacity-90 line-clamp-2">{post.body}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2 md:left-4" />
            <CarouselNext className="right-2 md:right-4" />
          </Carousel>
        </div>

        

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {quickActions.map((action, i) => {
              const Icon = action.icon
              return (
                <Link key={i} href={action.href}>
                  <Card className="border-border/50 bg-card/80 backdrop-blur-sm p-5 hover:border-primary/50 transition-all duration-300 cursor-pointer group h-full flex flex-col justify-center items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} p-2.5 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-full h-full text-white" />
                    </div>
                    <p className="font-medium text-sm text-center group-hover:text-primary transition-colors">{action.label}</p>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Social Connections */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Connect Your Platforms</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {socialConnections.map((platform, i) => (
              <Link key={i} href={platform.href}>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6 hover:border-primary/50 transition-all duration-300 cursor-pointer group h-full relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${platform.gradient} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${platform.gradient} p-2.5 mb-4 group-hover:scale-110 transition-transform flex items-center justify-center text-2xl`}>
                      {platform.icon}
                    </div>
                    <p className="font-medium mb-2">{platform.name}</p>
                    <div className="flex items-center gap-2">
                      {platform.connected ? (
                        <span className="text-xs text-green-500 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          Connected
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-muted-foreground/50"></span>
                          Not Connected
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Recent Campaigns</h3>
              <Link href="/dashboard/campaigns">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {recentCampaigns.map((campaign) => {
                const previews = [
                  "/smp-1.jpg",
                  "/smp-2.jpeg",
                  "/smp-3.jpeg",
                  "/smp-4.jpg",
                ]
                const previewImage = previews[campaign.id % previews.length]
                return (
                <Card
                  key={campaign.id}
                  className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm p-6 hover:border-primary/50 transition-all duration-300 group cursor-pointer"
                >
                  <div
                    className="flare flare-animate bg-accent/20 h-40 w-40 -top-10 -right-10"
                    style={{
                      ['--duration' as any]: '95s',
                      ['--tx-start' as any]: '0px',
                      ['--ty-start' as any]: '0px',
                      ['--tx1' as any]: '18px',
                      ['--ty1' as any]: '-12px',
                      ['--tx2' as any]: '-14px',
                      ['--ty2' as any]: '20px',
                      ['--tx3' as any]: '10px',
                      ['--ty3' as any]: '-16px',
                      ['--scale' as any]: '1',
                      ['--opacity' as any]: '0.28',
                    } as React.CSSProperties}
                  />
                  <div
                    className="flare flare-animate bg-primary/15 h-32 w-32 -bottom-12 -left-8"
                    style={{
                      ['--duration' as any]: '110s',
                      animationDelay: '-25s',
                      ['--tx-start' as any]: '0px',
                      ['--ty-start' as any]: '0px',
                      ['--tx1' as any]: '-10px',
                      ['--ty1' as any]: '12px',
                      ['--tx2' as any]: '16px',
                      ['--ty2' as any]: '-18px',
                      ['--tx3' as any]: '-12px',
                      ['--ty3' as any]: '14px',
                      ['--scale' as any]: '1',
                      ['--opacity' as any]: '0.22',
                    } as React.CSSProperties}
                  />
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-medium text-lg mb-2 group-hover:text-primary transition-colors">
                        {campaign.name}
                      </h4>
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        {campaign.platforms.map((platform) => (
                          <span
                            key={platform}
                            className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
                          >
                            {platform}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Engagement</p>
                          <p className="text-base font-semibold">{campaign.engagement}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Reach</p>
                          <p className="text-base font-semibold">{campaign.reach}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Posts</p>
                          <p className="text-base font-semibold">{campaign.posts}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-3 py-1 rounded-md text-xs font-medium ${
                        campaign.status === "Active"
                          ? "bg-green-500/20 text-green-500 border border-green-500/30"
                          : campaign.status === "Scheduled"
                            ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
                            : "bg-red-500/20 text-red-500 border border-red-500/30"
                      }`}
                    >
                      {campaign.status}
                    </span>
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border/50 shadow-sm">
                        <Image src={previewImage} alt="Post preview" fill className="object-cover" />
                    </div>
                    </div>
                  </div>
                </Card>
              )})}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Performance Overview */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm p-6">
              <h4 className="font-semibold mb-4">Performance Overview</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Engagement Rate</span>
                    <span className="text-sm font-semibold text-green-500">+12.5%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-[#047286] to-[#047286]/80"></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Reach Growth</span>
                    <span className="text-sm font-semibold text-green-500">+8.3%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-gradient-to-r from-[#047286] to-[#047286]/80"></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Conversion Rate</span>
                    <span className="text-sm font-semibold text-green-500">+5.2%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-1/2 bg-gradient-to-r from-[#047286] to-[#047286]/80"></div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Upcoming Events */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Upcoming Events</h4>
              </div>
              <div className="space-y-3">
                {upcomingEvents.map((e, idx) => (
                  <div key={idx} className={`flex items-start gap-3 ${idx < upcomingEvents.length - 1 ? 'pb-3 border-b border-border/50' : ''}`}>
                    <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-secondary' : idx === 1 ? 'bg-primary' : 'bg-accent'} mt-2`}></div>
                  <div className="flex-1">
                      <p className="text-sm font-medium">{e.label}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(e.date)}</p>
                </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Pro Tip */}
            <Card className="border-border/50 bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm p-6 border-primary/30">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-2">Pro Tip</h4>
                  <p className="text-sm text-muted-foreground">
                    Use AI content generation to create 10x more posts in half the time. Try it now!
                  </p>
                  <Link href="/dashboard/content">
                    <Button size="sm" className="mt-3 bg-primary hover:bg-primary/90">
                      Generate Content
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      
    </div>
  )
}
