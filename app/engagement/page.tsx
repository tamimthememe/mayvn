"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  RefreshCw,
  Loader2,
  Instagram,
  Heart,
  MessageCircle,
  X,
  ArrowLeft,
  Send,
  Clock,
  Eye,
  AlertCircle,
  CheckCircle2,
  Menu,
  Search,
  Sparkles,
  Settings,
  LogOut,
  User,
  LayoutDashboard,
  Calendar,
  FileText,
  MessageSquare,
  ChartBar,
  Plus
} from "lucide-react"
import { Sidebar } from "@/components/Sidebar"
import { BrandSwitcher } from "@/components/BrandSwitcher"
import { NotificationsSidebar } from "@/components/NotificationsSidebar"
import { RayvnChat } from "@/components/RayvnChat"
import { useAuth } from "@/contexts/AuthContext"
import { useBrand } from "@/contexts/BrandContext"
import { RayvnProvider } from "@/contexts/RayvnContext"
import { useIsMobile } from "@/hooks/use-mobile"
import { getUserDocument } from "@/lib/userService"

interface Comment {
  id: string
  text: string
  username: string
  timestamp: string
  replied?: boolean
  replies?: Array<{
    id: string
    text: string
    username: string
    timestamp: string
  }>
}

interface Post {
  id: string
  media_url: string
  thumbnail_url?: string
  caption: string
  timestamp: string
  media_type: string
  like_count: number
  comments_count: number
  permalink?: string
  comments: Comment[]
}

export default function EngagementPage() {
  const { user, logout, loading: authLoading } = useAuth()
  const { selectedBrand, loading: brandLoading } = useBrand()
  const router = useRouter()
  const isMobile = useIsMobile()

  const [posts, setPosts] = useState<Post[]>([])
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Header state
  const [cmdOpen, setCmdOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [userData, setUserData] = useState<{ name?: string; email?: string } | null>(null)

  // Reply state
  const [replyingTo, setReplyingTo] = useState<string | null>(null) // comment id
  const [replyText, setReplyText] = useState('')
  const [isReplying, setIsReplying] = useState(false)

  // Suggestions state
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>({})
  const [loadingSuggestions, setLoadingSuggestions] = useState<Record<string, boolean>>({})

  // Queue for processing suggestions
  const [processingQueue, setProcessingQueue] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

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
            // Fallback to auth user data
            setUserData({
              name: user.displayName || 'User',
              email: user.email || '',
            })
          }
        } catch (error) {
          console.error("Error loading user data:", error)
        }
      }
    }
    loadUserData()
  }, [user])

  const fetchPosts = async () => {
    if (!user?.uid || !selectedBrand?.id) return

    setIsLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/instagram/insights?userId=${user.uid}&brandId=${selectedBrand.id}`)
      if (!response.ok) throw new Error('Failed to fetch posts')

      const data = await response.json()
      // Transform mediaInsights to our Post format
      const transformedPosts: Post[] = (data.mediaInsights || []).map((media: any) => ({
        id: media.id,
        media_url: media.media_url || '',
        thumbnail_url: media.thumbnail_url,
        caption: media.caption || '',
        timestamp: media.timestamp,
        media_type: media.media_type,
        like_count: media.like_count || 0,
        comments_count: media.comments_count || 0,
        permalink: media.permalink,
        comments: (media.comments || []).map((c: any) => ({
          id: c.id,
          text: c.text,
          username: c.username || c.from?.username || 'Unknown',
          timestamp: c.timestamp || new Date().toISOString(),
          replied: (c.replies && c.replies.length > 0),
          replies: (c.replies || []).map((r: any) => ({
            id: r.id,
            text: r.text,
            username: r.username || r.from?.username || 'Unknown',
            timestamp: r.timestamp || new Date().toISOString()
          }))
        }))
      }))
      setPosts(transformedPosts)
    } catch (err) {
      console.error(err)
      setError('Failed to load posts')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [user?.uid, selectedBrand?.id])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const getImageUrl = (post: Post) => {
    if (post.media_type === 'VIDEO' || post.media_type === 'REEL') {
      return post.thumbnail_url || post.media_url || '/smp-1.jpg'
    }
    return post.media_url || post.thumbnail_url || '/smp-1.jpg'
  }

  const getUnrepliedCount = (post: Post) => {
    return post.comments.filter(c => !c.replied).length
  }

  const handleReply = async (commentId: string) => {
    if (!replyText.trim() || !user?.uid || !selectedBrand?.id) return

    setIsReplying(true)
    try {
      const response = await fetch('/api/instagram/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          brandId: selectedBrand.id,
          commentId,
          message: replyText
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to post reply')
      }

      // Update local state to show the reply was posted
      if (selectedPost) {
        const updatedComments = selectedPost.comments.map(c => {
          if (c.id === commentId) {
            return {
              ...c,
              replied: true,
              replies: [
                ...(c.replies || []),
                {
                  id: data.replyId,
                  text: replyText,
                  username: 'You',
                  timestamp: new Date().toISOString()
                }
              ]
            }
          }
          return c
        })
        setSelectedPost({ ...selectedPost, comments: updatedComments })
      }

      setReplyText('')
      setReplyingTo(null)
    } catch (err) {
      console.error('Reply error:', err)
      alert(err instanceof Error ? err.message : 'Failed to post reply')
    } finally {
      setIsReplying(false)
    }
  }

  const generateSuggestions = async (commentId: string, commentText: string) => {
    if (!selectedPost) return

    setLoadingSuggestions(prev => ({ ...prev, [commentId]: true }))
    try {
      const response = await fetch('/api/ollama/generate-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentText,
          postCaption: selectedPost.caption,
          brandName: selectedBrand?.name
        })
      })

      const data = await response.json()
      if (data.suggestions) {
        setSuggestions(prev => ({ ...prev, [commentId]: data.suggestions }))
      }
    } catch (error) {
      console.error('Failed to generate suggestions:', error)
    } finally {
      setLoadingSuggestions(prev => ({ ...prev, [commentId]: false }))
    }
  }

  // Add unreplied comments to queue when post is selected
  useEffect(() => {
    if (selectedPost) {
      const unrepliedIds = selectedPost.comments
        .filter(c => !c.replied && !suggestions[c.id])
        .map(c => c.id)

      if (unrepliedIds.length > 0) {
        setProcessingQueue(prev => [...new Set([...prev, ...unrepliedIds])])
      }
    }
  }, [selectedPost])

  // Process queue
  useEffect(() => {
    const processQueue = async () => {
      if (isProcessing || processingQueue.length === 0 || !selectedPost) return

      setIsProcessing(true)
      const commentId = processingQueue[0]
      const comment = selectedPost.comments.find(c => c.id === commentId)

      if (comment && !suggestions[commentId]) {
        await generateSuggestions(commentId, comment.text)
      }

      setProcessingQueue(prev => prev.slice(1))
      setIsProcessing(false)
    }

    processQueue()
  }, [processingQueue, isProcessing, selectedPost])

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
                      <Link href="/engagement" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted text-foreground">
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{userData?.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userData?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {userData?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="pt-24 md:pt-28 md:ml-52 p-4 md:p-8">
          {selectedPost ? (
            // Detail View
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-9rem)] flex flex-col">
              {/* Back button */}
              <Button
                variant="ghost"
                className="mb-4 hover:bg-muted self-start"
                onClick={() => setSelectedPost(null)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Posts
              </Button>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
                {/* Left: Post Image */}
                <div className="group relative h-full rounded-xl overflow-hidden bg-muted">
                  <Image
                    src={getImageUrl(selectedPost)}
                    alt={selectedPost.caption || 'Post'}
                    fill
                    className="object-cover"
                  />
                  {/* Media type badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="text-xs px-2 py-1 rounded-full bg-pink-500/80 text-white backdrop-blur-sm">
                      {selectedPost.media_type === 'VIDEO' || selectedPost.media_type === 'REEL' ? selectedPost.media_type : 'Instagram'}
                    </span>
                  </div>

                  {/* Hover caption overlay - slides up from bottom */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
                    <div className="mx-3 mb-3 rounded-lg border border-primary/40 bg-[#12292d]/95 backdrop-blur-md text-white p-4 shadow-xl">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-pink-500/60">
                          Instagram
                        </span>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1.5">
                            <Heart className="w-4 h-4" /> {selectedPost.like_count}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MessageCircle className="w-4 h-4" /> {selectedPost.comments_count}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-white/90 line-clamp-3 leading-relaxed">
                        {selectedPost.caption || 'No caption'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Comments Only */}
                <div className="flex flex-col h-full overflow-hidden">
                  {/* Header with timestamp and stats inline */}
                  <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Instagram className="w-5 h-5 text-pink-500" />
                      <span className="font-semibold">Instagram Post</span>
                      <span className="text-sm text-muted-foreground">• {formatTime(selectedPost.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Heart className="w-4 h-4 text-red-400" /> {selectedPost.like_count}
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <MessageCircle className="w-4 h-4 text-blue-400" /> {selectedPost.comments_count}
                      </span>
                      <span className="flex items-center gap-1.5 text-amber-400">
                        <AlertCircle className="w-4 h-4" /> {getUnrepliedCount(selectedPost)} unreplied
                      </span>
                    </div>
                  </div>

                  {/* Comments Section - Scrollable */}
                  <div className="flex-1 overflow-hidden flex flex-col min-h-0 font-dm-sans">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 flex-shrink-0">
                      <MessageCircle className="w-4 h-4" />
                      Comments ({selectedPost.comments.length})
                    </h3>

                    {selectedPost.comments.length === 0 ? (
                      <Card className="p-6 border-border/50 bg-card/50 text-center text-muted-foreground flex-1 flex flex-col items-center justify-center">
                        <MessageCircle className="w-10 h-10 mb-3 opacity-50" />
                        <p className="text-sm">No comments on this post yet</p>
                      </Card>
                    ) : (
                      <div className="flex-1 overflow-y-auto space-y-6 pr-2 pb-4">
                        {selectedPost.comments.map((comment, idx) => (
                          <div key={comment.id} className="relative group">
                            {/* Main Comment Card */}
                            <div className="flex gap-3 bg-card/40 border border-border/40 rounded-xl p-4 hover:border-primary/20 transition-colors">
                              {/* Avatar */}
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                                  {comment.username.charAt(0).toUpperCase()}
                                </div>
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-sm text-foreground">{comment.username}</span>
                                  <span className="text-xs text-muted-foreground">{formatTime(comment.timestamp)}</span>
                                </div>

                                <p className="text-sm text-foreground/90 leading-relaxed mb-2">
                                  {comment.text}
                                </p>

                                {/* Rayvn Suggestions (Auto-generated) */}
                                {loadingSuggestions[comment.id] && !suggestions[comment.id] && (
                                  <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                                    <Sparkles className="w-3 h-3" />
                                    <span>Rayvn is thinking...</span>
                                  </div>
                                )}

                                {suggestions[comment.id] && !comment.replied && (
                                  <div className="mb-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <p className="text-[10px] font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                                      <Sparkles className="w-3 h-3 text-primary" />
                                      Rayvn Suggestions
                                    </p>
                                    <div className="flex flex-col gap-2">
                                      {suggestions[comment.id].map((suggestion, i) => (
                                        <button
                                          key={i}
                                          onClick={() => {
                                            setReplyingTo(comment.id)
                                            setReplyText(suggestion)
                                          }}
                                          className="text-xs text-left p-2.5 rounded-lg bg-primary/5 hover:bg-primary/10 text-foreground/90 transition-colors border border-primary/10 hover:border-primary/30"
                                        >
                                          {suggestion}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-4">
                                  <button
                                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => {
                                      if (replyingTo === comment.id) {
                                        setReplyingTo(null)
                                        setReplyText('')
                                      } else {
                                        setReplyingTo(comment.id)
                                        setReplyText('')
                                      }
                                    }}
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    Reply
                                  </button>

                                  {/* Placeholder for Like button since API doesn't support liking yet */}
                                  <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                    <Heart className="w-3.5 h-3.5" />
                                    Like
                                  </button>
                                </div>

                                {/* Reply Input */}
                                {replyingTo === comment.id && (
                                  <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="flex gap-2">
                                      <Input
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder={`Reply to @${comment.username}...`}
                                        className="flex-1 h-9 text-sm bg-muted/30 border-border/50 focus-visible:ring-1"
                                        disabled={isReplying}
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleReply(comment.id)
                                          }
                                        }}
                                      />
                                      <Button
                                        size="sm"
                                        className="h-9 px-3"
                                        onClick={() => handleReply(comment.id)}
                                        disabled={!replyText.trim() || isReplying}
                                      >
                                        {isReplying ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <Send className="w-4 h-4" />
                                        )}
                                      </Button>
                                    </div>


                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                              <div className="relative mt-4 ml-5">
                                {/* Connecting Line */}
                                <div className="absolute top-[-20px] left-[0px] bottom-6 w-[2px] bg-border/40 rounded-full"></div>

                                <div className="space-y-4">
                                  {comment.replies.map((reply) => (
                                    <div key={reply.id} className="relative flex gap-3 pl-6">
                                      {/* Curved connector for each reply */}
                                      <div className="absolute top-[-10px] left-[0px] w-6 h-6 border-b-2 border-l-2 border-border/40 rounded-bl-xl"></div>

                                      {/* Reply Card */}
                                      <div className="flex-1 flex gap-3 bg-card/30 border border-border/30 rounded-xl p-3 hover:border-primary/20 transition-colors">
                                        {/* Reply Avatar */}
                                        <div className="flex-shrink-0 z-10">
                                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-background">
                                            {reply.username.charAt(0).toUpperCase()}
                                          </div>
                                        </div>

                                        {/* Reply Content */}
                                        <div className="flex-1 min-w-0 pt-0.5">
                                          <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-semibold text-sm text-foreground flex items-center gap-1">
                                              {reply.username}
                                              {reply.username === 'You' && <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">You</span>}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{formatTime(reply.timestamp)}</span>
                                          </div>
                                          <p className="text-sm text-foreground/90 leading-relaxed">
                                            {reply.text}
                                          </p>

                                          {/* Reply Actions */}
                                          <div className="flex items-center gap-4 mt-1.5">
                                            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                              <Heart className="w-3 h-3" />
                                              Like
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reply on Instagram button */}
                  <Button
                    className="w-full mt-4 flex-shrink-0"
                    onClick={() => window.open(selectedPost.permalink, '_blank')}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Reply on Instagram
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Grid View
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">Engagement Hub</h1>
                  <p className="text-muted-foreground">Manage comments and engagement on your posts</p>
                </div>
                <Button onClick={fetchPosts} disabled={isLoading} variant="outline">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Refresh
                </Button>
              </div>

              {/* Loading State */}
              {isLoading && posts.length === 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden bg-muted relative">
                      <div className="absolute inset-0 animate-shimmer" />
                    </div>
                  ))}
                </div>
              )}

              {/* Error State */}
              {error && (
                <Card className="p-8 border-border/50 bg-card/50 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                  <p className="text-red-400">{error}</p>
                  <Button onClick={fetchPosts} className="mt-4">
                    Try Again
                  </Button>
                </Card>
              )}

              {/* Posts Grid */}
              {!isLoading && !error && posts.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {posts.map((post, idx) => (
                    <div
                      key={post.id}
                      className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:ring-2 hover:ring-primary/50 animate-fade-in"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                      onClick={() => setSelectedPost(post)}
                    >
                      <Image
                        src={getImageUrl(post)}
                        alt={post.caption || 'Post'}
                        fill
                        className="object-cover"
                      />

                      {/* Platform badge */}
                      <div className="absolute top-2 left-2 z-10">
                        <span className="text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm bg-pink-500/80 text-white">
                          {post.media_type === 'VIDEO' || post.media_type === 'REEL' ? post.media_type : 'Instagram'}
                        </span>
                      </div>

                      {/* Unreplied comments badge */}
                      {getUnrepliedCount(post) > 0 && (
                        <div className="absolute top-2 right-2 z-10 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                          {getUnrepliedCount(post)} unreplied
                        </div>
                      )}

                      {/* Hover caption overlay - slides up from bottom */}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
                        <div className="mx-2 mb-2 max-w-[95%] rounded-[5px] border border-primary/40 bg-[#12292d] backdrop-blur-sm text-white p-3 shadow-md">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/60">
                              Instagram
                            </span>
                            <div className="flex items-center gap-3 text-[10px]">
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3" /> {post.like_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" /> {post.comments_count}
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-white/90 line-clamp-2 leading-relaxed">
                            {post.caption || 'No caption'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && posts.length === 0 && (
                <Card className="p-12 border-border/50 bg-card/50 text-center">
                  <Instagram className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No Posts Found</h3>
                  <p className="text-muted-foreground mb-6">
                    Connect your Instagram account to see your posts and manage engagement.
                  </p>
                  <Button onClick={() => window.location.href = '/social-accounts'}>
                    Connect Instagram
                  </Button>
                </Card>
              )}
            </div>
          )}
        </main>
      </div>
    </RayvnProvider>
  )
}
