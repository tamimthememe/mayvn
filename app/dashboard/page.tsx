"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useRouter } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from "@/components/ui/popover"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/contexts/AuthContext"
import { useBrand } from "@/contexts/BrandContext"
import { Sidebar } from "@/components/Sidebar"
import { BrandSwitcher } from "@/components/BrandSwitcher"
import { NotificationsSidebar } from "@/components/NotificationsSidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getUserDocument } from "@/lib/userService"
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Menu,
  Plus,
  Settings,
  Search,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Zap,
  Heart,
  LayoutDashboard,
  MessageSquare,
  FileText,
  ChartBar,
  User,
  Building2,
  LogOut,
  Users,
  Eye,
  Instagram,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { RayvnProvider } from "@/contexts/RayvnContext"
import { RayvnChat } from "@/components/RayvnChat"
import PostAnalyticsDrawer, { PostData } from "@/components/PostAnalyticsDrawer"

// Type for featured posts
type FeaturedPost = {
  id: string
  image: string
  caption?: string
  platform: 'instagram' | 'reddit' | 'placeholder'
  likes?: number
  comments?: number
  permalink?: string
  // Full post data for the drawer
  fullPostData?: PostData
}

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth()
  const { selectedBrand, loading: brandLoading } = useBrand()
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [userData, setUserData] = useState<{ name?: string; email?: string } | null>(null)
  const [featuredPosts, setFeaturedPosts] = useState<FeaturedPost[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const isMobile = useIsMobile()

  // Protect route - redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  // Load user data for avatar
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          const userDoc = await getUserDocument(user.uid)
          if (userDoc) {
            setUserData({
              name: userDoc.name,
              email: userDoc.email,
            })
          } else {
            setUserData({
              name: user.displayName || undefined,
              email: user.email || undefined,
            })
          }
        } catch (error) {
          console.error("Error loading user data:", error)
          setUserData({
            name: user.displayName || undefined,
            email: user.email || undefined,
          })
        }
      }
    }
    loadUserData()
  }, [user])

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Failed to log out", error)
    }
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)
    }
    if (email) {
      return email.substring(0, 2).toUpperCase()
    }
    return "U"
  }

  // Stats data with icons - outlined card style
  const stats = [
    { title: "Active Campaigns", value: "12", change: "+3 this week", icon: Calendar },
    { title: "Content Generated", value: "248", change: "+45 this week", icon: Sparkles },
    { title: "Total Engagement", value: "12.5K", change: "+2.3K this week", icon: Heart },
    { title: "Avg. Reach", value: "45.2K", change: "+8.5% this week", icon: BarChart3 },
  ]

  // Placeholder posts for when not connected
  const placeholderPosts: FeaturedPost[] = [
    { id: '1', image: '/smp-1.jpg', caption: 'Connect Instagram to see your best posts', platform: 'placeholder' },
    { id: '2', image: '/smp-2.jpeg', caption: 'Connect Reddit to see top posts', platform: 'placeholder' },
    { id: '3', image: '/smp-3.jpeg', caption: 'Your best performing content', platform: 'placeholder' },
  ]

  // Fetch best performing posts from connected accounts
  useEffect(() => {
    const fetchFeaturedPosts = async () => {
      if (!user?.uid || !selectedBrand?.id) {
        setFeaturedPosts(placeholderPosts)
        setLoadingPosts(false)
        return
      }

      setLoadingPosts(true)
      const posts: FeaturedPost[] = []

      // Fetch Instagram posts
      try {
        const igResponse = await fetch(`/api/instagram/insights?userId=${user.uid}&brandId=${selectedBrand.id}`)
        if (igResponse.ok) {
          const igData = await igResponse.json()
          // API returns mediaInsights, not posts
          if (igData.mediaInsights && igData.mediaInsights.length > 0) {
            // Sort by engagement (likes + comments) and take top 3
            const sortedPosts = [...igData.mediaInsights]
              .sort((a: any, b: any) => ((b.like_count || 0) + (b.comments_count || 0)) - ((a.like_count || 0) + (a.comments_count || 0)))
              .slice(0, 3)

            sortedPosts.forEach((post: any) => {
              // For videos/reels, use thumbnail_url; for images, prefer media_url
              let imageUrl = '/smp-1.jpg'
              if (post.media_type === 'VIDEO' || post.media_type === 'REEL') {
                imageUrl = post.thumbnail_url || post.media_url || '/smp-1.jpg'
              } else {
                imageUrl = post.media_url || post.thumbnail_url || '/smp-1.jpg'
              }

              console.log(`[Dashboard] Post ${post.id}: type=${post.media_type}, image=${imageUrl?.substring(0, 50)}...`)

              // Build full PostData for the drawer
              const fullPostData: PostData = {
                id: post.id,
                media_url: post.media_url || '',
                thumbnail_url: post.thumbnail_url,
                caption: post.caption || '',
                timestamp: post.timestamp,
                media_type: post.media_type || 'IMAGE',
                reach: post.insights?.reach || 0,
                impressions: post.insights?.impressions || 0,
                engagement_count: (post.like_count || 0) + (post.comments_count || 0),
                saved_count: post.insights?.saved || 0,
                shares_count: post.insights?.shares || 0,
                likes_count: post.like_count || 0,
                comments_count: post.comments_count || 0,
                comments: post.comments || []
              }

              posts.push({
                id: post.id,
                image: imageUrl,
                caption: post.caption || 'Instagram Post',
                platform: 'instagram',
                likes: post.like_count || 0,
                comments: post.comments_count || 0,
                permalink: post.permalink,
                fullPostData
              })
            })
          }
        }
      } catch (e) {
        console.error('Error fetching Instagram posts:', e)
      }

      // Fetch Reddit posts (if connected)
      try {
        const redditResponse = await fetch(`/api/reddit/posts?userId=${user.uid}&brandId=${selectedBrand.id}`)
        if (redditResponse.ok) {
          const redditData = await redditResponse.json()
          if (redditData.posts && redditData.posts.length > 0) {
            // Sort by score and take top 2
            const sortedPosts = [...redditData.posts]
              .sort((a: any, b: any) => b.score - a.score)
              .slice(0, 2)

            sortedPosts.forEach((post: any) => {
              if (post.thumbnail && post.thumbnail.startsWith('http')) {
                posts.push({
                  id: post.id,
                  image: post.thumbnail,
                  caption: post.title || 'Reddit Post',
                  platform: 'reddit',
                  likes: post.score,
                  comments: post.num_comments,
                  permalink: post.url
                })
              }
            })
          }
        }
      } catch (e) {
        console.error('Error fetching Reddit posts:', e)
      }

      // If we got posts, use them; otherwise use placeholders
      if (posts.length > 0) {
        setFeaturedPosts(posts.slice(0, 3))
      } else {
        setFeaturedPosts(placeholderPosts)
      }
      setLoadingPosts(false)
    }

    fetchFeaturedPosts()
  }, [user?.uid, selectedBrand?.id])

  // Auto-rotate carousel every 5 seconds
  useEffect(() => {
    if (featuredPosts.length === 0) return
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredPosts.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [featuredPosts.length])

  const nextSlide = useCallback(() => {
    if (featuredPosts.length === 0) return
    setCurrentSlide((prev) => (prev + 1) % featuredPosts.length)
  }, [featuredPosts.length])

  const prevSlide = useCallback(() => {
    if (featuredPosts.length === 0) return
    setCurrentSlide((prev) => (prev - 1 + featuredPosts.length) % featuredPosts.length)
  }, [featuredPosts.length])

  // Recent Campaigns data
  const recentCampaigns = [
    {
      id: 1,
      name: "Summer Collection Launch",
      status: "Active",
      platforms: ["Instagram", "TikTok"],
      engagement: "3.2K",
      reach: "45.2K",
      posts: 8,
      image: "/smp-4.jpg",
    },
    {
      id: 2,
      name: "Back to School Promo",
      status: "Scheduled",
      platforms: ["Instagram", "Facebook"],
      engagement: "1.8K",
      reach: "28.5K",
      posts: 5,
      image: "/smp-5.jpeg",
    },
    {
      id: 3,
      name: "Holiday Gift Guide",
      status: "Draft",
      platforms: ["TikTok", "YouTube"],
      engagement: "-",
      reach: "-",
      posts: 0,
      image: "/smp-6.jpg",
    },
  ]

  // Performance metrics
  const performanceMetrics = [
    { label: "Engagement Rate", value: 72, change: "+12.6%" },
    { label: "Reach Growth", value: 58, change: "+8.3%" },
    { label: "Conversion Rate", value: 45, change: "+5.2%" },
  ]

  // Upcoming events
  const upcomingEvents = [
    { title: "Campaign goes live", date: "08/12/2025", color: "bg-primary" },
    { title: "Weekly report ready", date: "10/12/2025", color: "bg-primary" },
    { title: "New feature available", date: "13/12/2025", color: "bg-amber-500" },
  ]

  if (authLoading || brandLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <RayvnProvider>
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <Sidebar />

        {/* Header */}
        <header className="fixed top-0 left-0 md:left-52 right-0 border-b border-border/50 bg-card/30 backdrop-blur-sm z-40">
          <div className="w-full px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Open menu">
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 p-0">
                    <div className="p-6 border-b border-border/50">
                      <BrandSwitcher />
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
              {!isMobile && (
                <Popover open={cmdOpen} onOpenChange={setCmdOpen}>
                  <PopoverAnchor asChild>
                    <div className="hidden sm:flex items-center gap-2 bg-input border border-border/50 rounded-lg px-3 py-2 w-80 md:w-[32rem]">
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
                          {[{ icon: Sparkles, label: 'Generate Content', href: '/post-generator' }, { icon: Plus, label: 'New Campaign', href: '/campaigns/new' }]
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
              <RayvnChat
                triggerButton={
                  <Button variant="ghost" size="icon" className="text-primary hover:text-primary">
                    <Sparkles className="w-5 h-5" />
                  </Button>
                }
              />
              <NotificationsSidebar />
              <Link href="/dashboard/settings">
                <Button variant="ghost" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full">
                    <Avatar className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-primary to-accent">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs md:text-sm font-bold">
                        {getInitials(userData?.name, userData?.email)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userData?.name || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{userData?.email || user?.email || ""}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                    <User className="w-4 h-4 mr-2" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="md:ml-52 md:w-[calc(100%-13rem)] w-full px-4 md:px-6 pt-16 md:pt-20 pb-6 md:pb-8">
          {!selectedBrand ? (
            <Card className="p-12 text-center border-dashed">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">No Brand Selected</h2>
              <p className="text-muted-foreground mb-6">Please select a brand from the sidebar or add a new one to view your dashboard.</p>
              <Button onClick={() => router.push("/brand-dna")}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Brand
              </Button>
            </Card>
          ) : (
            <>
              {/* Welcome Section */}
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">
                  Welcome back, {userData?.name?.split(" ")[0] || "John"}!
                </h1>
                <p className="text-muted-foreground text-sm">
                  Here's what's happening with your campaigns today
                </p>
              </div>

              {/* Stats Grid - Outlined card style with icons */}
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
                {stats.map((stat, index) => (
                  <Card key={index} className="p-4 bg-card border border-border/50 hover:border-primary/50 transition-all">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <stat.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">{stat.title}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-primary mt-1">{stat.change}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Featured Posts Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Featured Posts</h2>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">Auto-rotates every 5s</span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={prevSlide}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={nextSlide}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Posts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {loadingPosts ? (
                    // Loading skeleton with shimmer effect
                    [1, 2, 3].map((i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                        <div className="absolute inset-0 animate-shimmer" />
                      </div>
                    ))
                  ) : (
                    featuredPosts.map((post, idx) => (
                      <div
                        key={post.id}
                        className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] ${idx === currentSlide ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : ''}`}
                        onClick={() => {
                          setCurrentSlide(idx)
                          // For Instagram posts with full data, open the drawer
                          if (post.platform === 'instagram' && post.fullPostData) {
                            setSelectedPost(post.fullPostData)
                            setIsDrawerOpen(true)
                          } else if (post.permalink) {
                            // For Reddit or placeholders, open the URL
                            window.open(post.permalink, '_blank')
                          }
                        }}
                      >
                        <Image
                          src={post.image}
                          alt={post.caption || `Featured post ${post.id}`}
                          fill
                          className="object-cover"
                        />
                        {/* Platform badge */}
                        {post.platform !== 'placeholder' && (
                          <div className="absolute top-2 left-2 z-10">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm ${post.platform === 'instagram' ? 'bg-pink-500/80 text-white' : 'bg-orange-500/80 text-white'}`}>
                              {post.platform === 'instagram' ? 'Instagram' : 'Reddit'}
                            </span>
                          </div>
                        )}
                        {/* Hover caption overlay - same as Content page */}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
                          <div className="mx-2 mb-2 max-w-[95%] rounded-[5px] border border-primary/40 bg-[#12292d] backdrop-blur-sm text-white p-3 shadow-md">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${post.platform === 'instagram' ? 'bg-pink-500/60' : post.platform === 'reddit' ? 'bg-orange-500/60' : 'bg-gray-500/60'}`}>
                                {post.platform === 'placeholder' ? 'Sample' : post.platform}
                              </span>
                              {post.likes !== undefined && (
                                <div className="flex items-center gap-2 text-[10px]">
                                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likes}</span>
                                  {post.comments !== undefined && (
                                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{post.comments}</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <p className="text-xs leading-relaxed opacity-90 line-clamp-2">
                              {post.caption?.slice(0, 100)}{post.caption && post.caption.length > 100 ? '...' : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card
                    className="p-6 flex flex-col items-center justify-center gap-3 border border-border/50 hover:border-primary/50 transition-all cursor-pointer"
                    onClick={() => router.push("/campaigns/new")}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm">New Campaign</span>
                  </Card>
                  <Card
                    className="p-6 flex flex-col items-center justify-center gap-3 border border-border/50 hover:border-primary/50 transition-all cursor-pointer"
                    onClick={() => router.push("/post-generator")}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm">Generate Content</span>
                  </Card>
                  <Card
                    className="p-6 flex flex-col items-center justify-center gap-3 border border-border/50 hover:border-primary/50 transition-all cursor-pointer"
                    onClick={() => router.push("/post-planner")}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm">Schedule Posts</span>
                  </Card>
                  <Card
                    className="p-6 flex flex-col items-center justify-center gap-3 border border-border/50 hover:border-primary/50 transition-all cursor-pointer"
                    onClick={() => router.push("/analytics")}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm">View Analytics</span>
                  </Card>
                </div>
              </div>

              {/* Connect Your Platforms */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Connect Your Platforms</h2>
                <div className="flex gap-4">
                  <Card className="p-4 w-fit border border-border/50 hover:border-primary/50 transition-all cursor-pointer" onClick={() => router.push("/analytics")}>
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center mb-3">
                      <Instagram className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-medium">Instagram</p>
                    <p className="text-xs text-muted-foreground">● Not Connected</p>
                  </Card>
                </div>
              </div>

              {/* Recent Campaigns + Performance Overview */}
              <div className="grid lg:grid-cols-3 gap-6 mb-8">
                {/* Recent Campaigns */}
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Recent Campaigns</h2>
                    <Button variant="link" className="text-primary p-0 h-auto" onClick={() => router.push("/campaigns")}>
                      View All <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {recentCampaigns.map((campaign) => (
                      <Card key={campaign.id} className="p-4 border border-border/50 hover:border-primary/30 transition-all cursor-pointer">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-2">{campaign.name}</h3>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {campaign.platforms.map((platform) => (
                                <span key={platform} className="px-2 py-0.5 text-xs rounded border border-primary/30 text-primary">
                                  {platform}
                                </span>
                              ))}
                            </div>
                            <div className="flex gap-6 text-xs text-muted-foreground">
                              <div>
                                <span className="block text-[10px] uppercase tracking-wider">Engagement</span>
                                <span className="text-foreground font-medium">{campaign.engagement}</span>
                              </div>
                              <div>
                                <span className="block text-[10px] uppercase tracking-wider">Reach</span>
                                <span className="text-foreground font-medium">{campaign.reach}</span>
                              </div>
                              <div>
                                <span className="block text-[10px] uppercase tracking-wider">Posts</span>
                                <span className="text-foreground font-medium">{campaign.posts}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 text-xs rounded-full font-medium ${campaign.status === 'Active' ? 'bg-green-500/20 text-green-400' :
                              campaign.status === 'Scheduled' ? 'bg-primary/20 text-primary' :
                                'bg-muted text-muted-foreground'
                              }`}>
                              {campaign.status}
                            </span>
                            <div className="w-16 h-20 rounded-lg overflow-hidden bg-muted relative hidden sm:block">
                              <Image src={campaign.image} alt="" fill className="object-cover" />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Performance Overview */}
                  <Card className="p-5 border border-border/50">
                    <h3 className="font-semibold mb-4">Performance Overview</h3>
                    <div className="space-y-4">
                      {performanceMetrics.map((metric, idx) => (
                        <div key={idx}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">{metric.label}</span>
                            <span className="text-primary font-medium">{metric.change}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${metric.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Upcoming Events */}
                  <Card className="p-5 border border-border/50">
                    <h3 className="font-semibold mb-4">Upcoming Events</h3>
                    <div className="space-y-3">
                      {upcomingEvents.map((event, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${event.color}`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{event.title}</p>
                            <p className="text-xs text-muted-foreground">{event.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Post Analytics Drawer */}
      <PostAnalyticsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        post={selectedPost}
      />
    </RayvnProvider>
  )
}
