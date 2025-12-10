"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import PostAnalyticsDrawer, { PostData, MOCK_POST_DATA, CommentData } from "@/components/PostAnalyticsDrawer"
import { useAuth } from "@/contexts/AuthContext"
import { useBrand } from "@/contexts/BrandContext"
import { useRayvn } from "@/contexts/RayvnContext"
import {
  Instagram,
  Users,
  Heart,
  Eye,
  Bookmark,
  Loader2,
  RefreshCcw,
  BarChart3,
  Key,
  Play,
  Image as ImageIcon,
  Layers,
  Sparkles,
  MessageCircle,
  Share2,
  Trophy,
  Clock,
  Target,
  ArrowRight
} from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts"


interface AccountInfo {
  id: string
  username: string
  name?: string
  profile_picture_url?: string
  followers_count?: number
  follows_count?: number
  media_count?: number
}

interface ApiMediaInsight {
  id: string
  caption?: string
  media_type: string
  media_url?: string
  thumbnail_url?: string
  timestamp: string
  like_count?: number
  comments_count?: number
  insights?: {
    impressions?: number
    reach?: number
    saved?: number
    plays?: number
    shares?: number
  }
  comments?: Array<{
    id: string
    text: string
    username: string
    timestamp: string
  }>
}

// Helper function to calculate Content Power Score
const calculateContentPowerScore = (
  likes: number,
  comments: number,
  shares: number,
  saves: number,
  reach: number
): number => {
  if (reach === 0) return 0
  const rawScore = ((likes + comments + shares + saves) / reach) * 100
  return Math.min(rawScore, 10)
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function InstagramAnalyticsPage() {
  const { user, loading: authLoading } = useAuth()
  const { selectedBrandId, selectedBrand, loading: brandLoading } = useBrand()
  const searchParams = useSearchParams()

  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [posts, setPosts] = useState<PostData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Connected Instagram accounts for this brand
  const [connectedAccounts, setConnectedAccounts] = useState<Array<{
    instagramUserId: string
    username: string
    isActive: boolean
  }>>([])
  const [selectedInstagramUserId, setSelectedInstagramUserId] = useState<string | null>(null)

  // Token state for adding new account
  const [accessToken, setAccessToken] = useState("")
  const [instagramUserId, setInstagramUserId] = useState("")
  const [appId, setAppId] = useState("")
  const [appSecret, setAppSecret] = useState("")
  const [isSavingToken, setIsSavingToken] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [tokenInfo, setTokenInfo] = useState<{ type: string, expiresInDays: number } | null>(null)

  // Drawer state
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Totals
  const [totals, setTotals] = useState({
    impressions: 0,
    reach: 0,
    engagement: 0,
    saves: 0,
    likes: 0,
    comments: 0,
    shares: 0
  })

  // Active tab state
  const [activeTab, setActiveTab] = useState("overview")

  // Chart data - derived from actual posts
  const overviewChartData = useMemo(() => {
    if (posts.length === 0) return months.slice(0, 6).map(m => ({ name: m, value: 0, value2: 0 }))

    // Group posts by month and aggregate reach/engagement
    const monthlyData: { [key: string]: { reach: number, engagement: number } } = {}
    posts.forEach(post => {
      const date = new Date(post.timestamp)
      const monthKey = months[date.getMonth()]
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { reach: 0, engagement: 0 }
      }
      monthlyData[monthKey].reach += post.reach || 0
      monthlyData[monthKey].engagement += post.engagement_count || 0
    })

    // Get last 6 months with data
    const currentMonth = new Date().getMonth()
    const result = []
    for (let i = 5; i >= 0; i--) {
      const monthIdx = (currentMonth - i + 12) % 12
      const monthName = months[monthIdx]
      result.push({
        name: monthName,
        value: monthlyData[monthName]?.reach || 0,
        value2: monthlyData[monthName]?.engagement || 0
      })
    }
    return result
  }, [posts])

  // Weekly activity - derived from posts
  const weeklyData = useMemo(() => {
    if (posts.length === 0) return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => ({ name: d, value: 0 }))

    // Group posts by day of week
    const dayData: { [key: string]: number } = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 }
    posts.forEach(post => {
      const date = new Date(post.timestamp)
      const dayName = days[date.getDay()]
      dayData[dayName] += post.engagement_count || 0
    })

    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
      name: day,
      value: dayData[day] || 0
    }))
  }, [posts])

  // Content type performance - derived from posts
  const contentTypeStats = useMemo(() => {
    const stats: { [key: string]: { count: number, reach: number, engagement: number } } = {
      REEL: { count: 0, reach: 0, engagement: 0 },
      CAROUSEL_ALBUM: { count: 0, reach: 0, engagement: 0 },
      IMAGE: { count: 0, reach: 0, engagement: 0 }
    }

    posts.forEach(post => {
      const type = post.media_type === 'VIDEO' ? 'REEL' : post.media_type
      if (stats[type]) {
        stats[type].count++
        stats[type].reach += post.reach || 0
        stats[type].engagement += post.engagement_count || 0
      }
    })

    return {
      reels: {
        avgReach: stats.REEL.count > 0 ? Math.round(stats.REEL.reach / stats.REEL.count) : 0,
        engRate: stats.REEL.reach > 0 ? ((stats.REEL.engagement / stats.REEL.reach) * 100).toFixed(1) : '0',
        count: stats.REEL.count
      },
      carousels: {
        avgReach: stats.CAROUSEL_ALBUM.count > 0 ? Math.round(stats.CAROUSEL_ALBUM.reach / stats.CAROUSEL_ALBUM.count) : 0,
        engRate: stats.CAROUSEL_ALBUM.reach > 0 ? ((stats.CAROUSEL_ALBUM.engagement / stats.CAROUSEL_ALBUM.reach) * 100).toFixed(1) : '0',
        count: stats.CAROUSEL_ALBUM.count
      },
      photos: {
        avgReach: stats.IMAGE.count > 0 ? Math.round(stats.IMAGE.reach / stats.IMAGE.count) : 0,
        engRate: stats.IMAGE.reach > 0 ? ((stats.IMAGE.engagement / stats.IMAGE.reach) * 100).toFixed(1) : '0',
        count: stats.IMAGE.count
      }
    }
  }, [posts])

  // Engagement breakdown for donut - uses real totals
  const engagementBreakdown = useMemo(() => [
    { name: 'Likes', value: totals.likes, color: '#047286' },
    { name: 'Comments', value: totals.comments, color: '#0ea5e9' },
    { name: 'Shares', value: totals.shares, color: '#06b6d4' },
    { name: 'Saves', value: totals.saves, color: '#14b8a6' },
  ], [totals])

  // Get Rayvn context for metrics injection
  const { setMetricsContext } = useRayvn()

  // Cache key for sessionStorage
  const getCacheKey = (brandId: string, igUserId?: string) =>
    `mayvn_analytics_${brandId}_${igUserId || 'default'}`

  useEffect(() => {
    if (user?.uid && selectedBrandId) {
      // Check for cached data first
      const cacheKey = getCacheKey(selectedBrandId, selectedInstagramUserId)
      const cached = sessionStorage.getItem(cacheKey)

      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached)
          const ageMinutes = (Date.now() - timestamp) / 1000 / 60

          // Use cache if less than 5 minutes old
          if (ageMinutes < 5) {
            applyData(data)
            setLoading(false)
            return
          }
        } catch (e) {
          console.error('Cache parse error:', e)
        }
      }

      fetchData()
    }
  }, [user?.uid, selectedBrandId, selectedInstagramUserId])

  // Apply data to state (used by both cache and fetch)
  const applyData = (data: any) => {
    setAccount(data.account || null)

    if (data.allAccounts) {
      setConnectedAccounts(data.allAccounts)
    }
    if (data.currentInstagramUserId) {
      setSelectedInstagramUserId(data.currentInstagramUserId)
    }

    let totalLikes = 0
    let totalComments = 0
    let totalShares = 0
    let totalSaves = 0

    const transformedPosts: PostData[] = (data.mediaInsights || []).map((media: ApiMediaInsight) => {
      const reach = media.insights?.reach || 0
      const impressions = media.insights?.impressions || 0
      const likes = media.like_count || 0
      const comments = media.comments_count || 0
      const saved = media.insights?.saved || 0
      const shares = media.insights?.shares || 0

      totalLikes += likes
      totalComments += comments
      totalShares += shares
      totalSaves += saved

      return {
        id: media.id,
        media_url: media.media_url || '',
        thumbnail_url: media.thumbnail_url,
        caption: media.caption || '',
        timestamp: media.timestamp,
        media_type: media.media_type as PostData['media_type'],
        reach,
        impressions,
        engagement_count: likes + comments,
        saved_count: saved,
        shares_count: shares,
        likes_count: likes,
        comments_count: comments,
        video_duration: 30,
        ig_reels_avg_watch_time: media.media_type === 'VIDEO' || media.media_type === 'REEL' ? 18 : undefined,
        comments: (media.comments || []).map((c: { id: string; text: string; username: string }, i: number) => ({
          id: c.id,
          text: c.text,
          username: c.username,
          sentiment: i % 3 === 0 ? 'positive' : i % 3 === 1 ? 'neutral' : 'negative' as const
        })),
      }
    })

    setPosts(transformedPosts)

    setTotals({
      impressions: data.insights?.impressions || 0,
      reach: data.insights?.reach || 0,
      engagement: totalLikes + totalComments,
      saves: totalSaves,
      likes: totalLikes,
      comments: totalComments,
      shares: totalShares
    })

    setIsConnected(true)
  }

  const fetchData = async (instagramId?: string, forceRefresh = false) => {
    setLoading(true)
    setError(null)

    try {
      if (!user?.uid || !selectedBrandId) {
        throw new Error('Not authenticated or no brand selected')
      }

      const igId = instagramId || selectedInstagramUserId
      const cacheKey = getCacheKey(selectedBrandId, igId)

      // Check cache unless force refresh
      if (!forceRefresh) {
        const cached = sessionStorage.getItem(cacheKey)
        if (cached) {
          try {
            const { data, timestamp } = JSON.parse(cached)
            const ageMinutes = (Date.now() - timestamp) / 1000 / 60
            if (ageMinutes < 5) {
              applyData(data)
              setLoading(false)
              return
            }
          } catch (e) { }
        }
      }

      let url = `/api/instagram/insights?userId=${user.uid}&brandId=${selectedBrandId}`
      if (igId) {
        url += `&instagramUserId=${igId}`
      }

      const res = await fetch(url)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Not connected')
      }

      // Cache the response
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }))

      applyData(data)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
      setIsConnected(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveToken = async () => {
    if (!accessToken.trim() || !instagramUserId.trim()) {
      setTokenError("Both fields are required")
      return
    }

    setIsSavingToken(true)
    setTokenError(null)

    try {
      const response = await fetch('/api/token/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid,
          brandId: selectedBrandId,
          accessToken: accessToken.trim(),
          instagramUserId: instagramUserId.trim(),
          appId: appId.trim() || undefined,
          appSecret: appSecret.trim() || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save token')
      }

      if (data.tokenType) {
        setTokenInfo({
          type: data.tokenType,
          expiresInDays: data.expiresInDays || 0
        })
      }

      setAccessToken("")
      setAppId("")
      setAppSecret("")
      setIsConnected(true)
      fetchData(undefined, true) // Force refresh to bypass cache
    } catch (err) {
      setTokenError(err instanceof Error ? err.message : 'Failed to save token')
    } finally {
      setIsSavingToken(false)
    }
  }

  const openPostDrawer = (post: PostData) => {
    setSelectedPost(post)
    setIsDrawerOpen(true)
  }

  // Handle postId from URL (when clicking from Rayvn chat)
  useEffect(() => {
    const postId = searchParams.get('postId')
    if (postId && posts.length > 0) {
      const post = posts.find(p => p.id === postId)
      if (post) {
        openPostDrawer(post)
      }
    }
  }, [searchParams, posts])

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toLocaleString()
  }

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
      case 'REEL':
        return <Play className="w-4 h-4" />
      case 'CAROUSEL_ALBUM':
        return <Layers className="w-4 h-4" />
      default:
        return <ImageIcon className="w-4 h-4" />
    }
  }

  // Calculate Content Power Score
  const contentPowerScore = useMemo(() => {
    return calculateContentPowerScore(
      totals.likes,
      totals.comments,
      totals.shares,
      totals.saves,
      totals.reach
    )
  }, [totals])

  // Top performing posts
  const topPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => (b.engagement_count + b.saved_count) - (a.engagement_count + a.saved_count))
      .slice(0, 5)
  }, [posts])

  // Update Rayvn metrics context when data changes
  useEffect(() => {
    if (account || posts.length > 0) {
      const metricsString = `
## Instagram Account: @${account?.username || 'Unknown'}
- Followers: ${account?.followers_count?.toLocaleString() || 'N/A'}
- Following: ${account?.follows_count?.toLocaleString() || 'N/A'}
- Total Posts: ${account?.media_count || posts.length}

## Overall Performance (from ${posts.length} analyzed posts)
- Total Reach: ${totals.reach.toLocaleString()}
- Total Impressions: ${totals.impressions.toLocaleString()}
- Total Likes: ${totals.likes.toLocaleString()}
- Total Comments: ${totals.comments.toLocaleString()}
- Total Saves: ${totals.saves.toLocaleString()}
- Total Shares: ${totals.shares.toLocaleString()}
- Engagement Rate: ${totals.reach > 0 ? ((totals.engagement / totals.reach) * 100).toFixed(2) : '0'}%

## Content Type Breakdown
- Reels: ${contentTypeStats.reels.count} posts, avg reach ${contentTypeStats.reels.avgReach.toLocaleString()}, ${contentTypeStats.reels.engRate}% eng rate
- Carousels: ${contentTypeStats.carousels.count} posts, avg reach ${contentTypeStats.carousels.avgReach.toLocaleString()}, ${contentTypeStats.carousels.engRate}% eng rate  
- Photos: ${contentTypeStats.photos.count} posts, avg reach ${contentTypeStats.photos.avgReach.toLocaleString()}, ${contentTypeStats.photos.engRate}% eng rate

## Top 3 Performing Posts
${topPosts.slice(0, 3).map((p, i) => `${i + 1}. ${p.caption?.slice(0, 50) || 'No caption'} - ${p.engagement_count} engagements, ${p.reach} reach`).join('\n')}
`
      setMetricsContext(metricsString)
    }
  }, [account, posts, totals, contentTypeStats, topPosts, setMetricsContext])

  // ================================
  // AUTH LOADING STATE
  // ================================
  if (authLoading || brandLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // ================================
  // NOT AUTHENTICATED
  // ================================
  if (!user) {
    return (
      <div className="px-4 md:px-6 pb-8">
        <div className="max-w-lg mx-auto">
          <Card className="p-8 bg-card/80 border-border/50 backdrop-blur-xl text-center">
            <Instagram className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-4">Please log in to access Instagram Analytics</p>
            <Button onClick={() => window.location.href = '/login'}>
              Go to Login
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  // ================================
  // NO BRAND SELECTED
  // ================================
  if (!selectedBrandId) {
    return (
      <div className="px-4 md:px-6 pb-8">
        <div className="max-w-lg mx-auto">
          <Card className="p-8 bg-card/80 border-border/50 backdrop-blur-xl text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No Brand Selected</h2>
            <p className="text-muted-foreground mb-4">
              Please select a brand from the sidebar to view Instagram Analytics
            </p>
            <Button onClick={() => window.location.href = '/brand-dna'}>
              Manage Brands
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  // ================================
  // TOKEN INPUT SCREEN
  // ================================
  if (!isConnected && !loading) {
    return (
      <div className="px-4 md:px-6 pb-8">
        <div className="max-w-lg mx-auto">
          <Card className="p-8 bg-card/80 border-border/50 backdrop-blur-xl">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-primary via-primary/80 to-primary/60 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/25">
                <Instagram className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Instagram Analytics</h1>
              <p className="text-muted-foreground">Enter your credentials to view performance insights</p>
            </div>

            {(tokenError || error) && (
              <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                {tokenError || error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <Label htmlFor="igUserId">Instagram User ID</Label>
                <Input
                  id="igUserId"
                  placeholder="e.g., 17841462302230932"
                  value={instagramUserId}
                  onChange={(e) => setInstagramUserId(e.target.value)}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Find this in Graph API Explorer: /me/accounts?fields=instagram_business_account
                </p>
              </div>
              <div>
                <Label htmlFor="token">Access Token</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="Paste your EAA... token"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Short-lived tokens expire in 1 hour. Add App credentials below for 60-day token.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-4">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Get 60-Day Token (Optional)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter your Meta App credentials to automatically exchange for a long-lived token.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="appId" className="text-xs">App ID</Label>
                    <Input
                      id="appId"
                      placeholder="App ID"
                      value={appId}
                      onChange={(e) => setAppId(e.target.value)}
                      className="mt-1 h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="appSecret" className="text-xs">App Secret</Label>
                    <Input
                      id="appSecret"
                      type="password"
                      placeholder="App Secret"
                      value={appSecret}
                      onChange={(e) => setAppSecret(e.target.value)}
                      className="mt-1 h-9 text-sm"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSaveToken}
                disabled={isSavingToken || !accessToken || !instagramUserId}
                className="w-full h-12"
              >
                {isSavingToken ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Connecting...</>
                ) : (
                  <><Key className="w-5 h-5 mr-2" /> Connect & View Analytics</>
                )}
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-border/50">
              <Button
                variant="ghost"
                onClick={() => {
                  setPosts([MOCK_POST_DATA])
                  setAccount({
                    id: 'demo',
                    username: 'demo_account',
                    name: 'Demo Account',
                    followers_count: 12500,
                    follows_count: 432,
                    media_count: 86
                  })
                  setTotals({
                    impressions: 21580,
                    reach: 15420,
                    engagement: 1842,
                    saves: 234,
                    likes: 1520,
                    comments: 322,
                    shares: 156
                  })
                  setIsConnected(true)
                }}
                className="w-full text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Try Demo Mode
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // ================================
  // LOADING STATE
  // ================================
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 shadow-xl">
          <p className="text-xs text-gray-400">{label}</p>
          <p className="text-sm font-semibold text-white">{payload[0].value.toFixed(0)}</p>
        </div>
      )
    }
    return null
  }

  // ================================
  // MAIN ANALYTICS DASHBOARD - BENTO GRID LAYOUT
  // ================================
  return (
    <div className="px-4 md:px-6 pb-8">
      {/* Account Summary - Persists across all tabs */}
      {account && (
        <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Left: Profile Picture & Name */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary via-primary/80 to-[#0ea5e9]/60 p-0.5 flex-shrink-0">
                {account.profile_picture_url ? (
                  <img src={account.profile_picture_url} className="w-full h-full rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#1a1a1a] flex items-center justify-center">
                    <Instagram className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{account.name || 'Instagram Account'}</h2>
                <p className="text-sm text-gray-400">@{account.username}</p>
              </div>
            </div>

            {/* Right: Stats */}
            <div className="flex items-center gap-6 md:gap-8">
              <div className="text-center">
                <p className="text-xl font-bold text-white">{formatNumber(account.followers_count || 0)}</p>
                <p className="text-xs text-gray-500">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">{account.media_count || 0}</p>
                <p className="text-xs text-gray-500">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-primary">{contentPowerScore.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">Eng. Rate</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">{formatNumber(totals.engagement || 0)}</p>
                <p className="text-xs text-gray-500">Engagement</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vercel-style Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-[#1a1a1a] p-1 rounded-lg border border-[#2a2a2a]">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">
              All Content
            </TabsTrigger>
            <TabsTrigger value="audience" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">
              Audience
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">
              Settings
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchData()} className="border-[#333] bg-[#1a1a1a] hover:bg-[#2a2a2a]">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overview Tab - Bento Grid Layout */}
        <TabsContent value="overview" className="mt-0">
          {/* Top Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">

            <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs text-gray-400">Total Reach</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{formatNumber(totals.reach)}</span>
              </div>
              <span className="text-xs text-gray-500">{posts.length} posts analyzed</span>
            </div>

            <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs text-gray-400">Total Engagements</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{formatNumber(totals.engagement)}</span>
              </div>
              <span className="text-xs text-gray-500">likes + comments</span>
            </div>

            <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs text-gray-400">Engagement Rate</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">{contentPowerScore.toFixed(1)}%</span>
              </div>
              <span className="text-xs text-gray-500">engagement / reach</span>
            </div>

            <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs text-gray-400">Followers</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{formatNumber(account?.followers_count || 0)}</span>
              </div>
              <span className="text-xs text-gray-500">current count</span>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">

            {/* LEFT COLUMN - Overview Section */}
            <div className="col-span-12 lg:col-span-8 space-y-4">
              {/* Overview Card with Chart */}
              <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Growth Overview</h2>
                  <select className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-primary">
                    <option>Last 30 Days</option>
                    <option>Last 3 Months</option>
                    <option>Last Year</option>
                  </select>
                </div>

                {/* Area Chart */}
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={overviewChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#047286" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#047286" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorValue2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#666', fontSize: 11 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#666', fontSize: 11 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#047286"
                        strokeWidth={2}
                        fill="url(#colorValue)"
                        name="Reach"
                      />
                      <Area
                        type="monotone"
                        dataKey="value2"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        fill="url(#colorValue2)"
                        name="Engagement"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#2a2a2a]">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-sm text-gray-400">Reach</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#0ea5e9]" />
                    <span className="text-sm text-gray-400">Engagement</span>
                  </div>
                </div>
              </div>

              {/* Engagement Breakdown Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Engagement Bar Chart */}
                <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] p-5">
                  <h3 className="text-lg font-semibold text-white mb-4">Weekly Activity</h3>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#666', fontSize: 10 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#666', fontSize: 10 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                          dataKey="value"
                          fill="#047286"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Engagement Donut */}
                <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] p-5">
                  <h3 className="text-lg font-semibold text-white mb-4">Engagement Breakdown</h3>
                  <div className="flex items-center gap-4">
                    <div className="h-[140px] w-[140px] relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={engagementBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={65}
                            dataKey="value"
                            paddingAngle={2}
                            stroke="none"
                          >
                            {engagementBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-lg font-bold text-white">{formatNumber(totals.engagement || 2232)}</span>
                        <span className="text-[10px] text-gray-500">Total</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      {engagementBreakdown.map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-xs text-gray-400">{item.name}</span>
                          </div>
                          <span className="text-xs font-medium text-white">{formatNumber(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Performance Row */}
              <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Content Performance by Type</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Play className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-white">Reels ({contentTypeStats.reels.count})</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Avg. Reach</span>
                        <span className="text-white font-medium">{formatNumber(contentTypeStats.reels.avgReach)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Eng. Rate</span>
                        <span className="text-primary font-medium">{contentTypeStats.reels.engRate}%</span>
                      </div>
                      <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(parseFloat(contentTypeStats.reels.engRate) * 10, 100)}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#0ea5e9]/20 flex items-center justify-center">
                        <Layers className="w-4 h-4 text-[#0ea5e9]" />
                      </div>
                      <span className="text-sm font-medium text-white">Carousels ({contentTypeStats.carousels.count})</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Avg. Reach</span>
                        <span className="text-white font-medium">{formatNumber(contentTypeStats.carousels.avgReach)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Eng. Rate</span>
                        <span className="text-[#0ea5e9] font-medium">{contentTypeStats.carousels.engRate}%</span>
                      </div>
                      <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                        <div className="h-full bg-[#0ea5e9] rounded-full" style={{ width: `${Math.min(parseFloat(contentTypeStats.carousels.engRate) * 10, 100)}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#06b6d4]/20 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-[#06b6d4]" />
                      </div>
                      <span className="text-sm font-medium text-white">Photos ({contentTypeStats.photos.count})</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Avg. Reach</span>
                        <span className="text-white font-medium">{formatNumber(contentTypeStats.photos.avgReach)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Eng. Rate</span>
                        <span className="text-[#06b6d4] font-medium">{contentTypeStats.photos.engRate}%</span>
                      </div>
                      <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                        <div className="h-full bg-[#06b6d4] rounded-full" style={{ width: `${Math.min(parseFloat(contentTypeStats.photos.engRate) * 10, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Metrics & Top Posts */}
            <div className="col-span-12 lg:col-span-4 space-y-4">

              {/* Metric Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Bookmark className="w-4 h-4 text-primary" />
                    <span className="text-xs text-gray-400">Total Saves</span>
                  </div>
                  <p className="text-xl font-bold text-white">{formatNumber(totals.saves)}</p>
                  <span className="text-xs text-gray-500">across all posts</span>
                </div>
                <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Share2 className="w-4 h-4 text-primary" />
                    <span className="text-xs text-gray-400">Total Shares</span>
                  </div>
                  <p className="text-xl font-bold text-white">{formatNumber(totals.shares)}</p>
                  <span className="text-xs text-gray-500">across all posts</span>
                </div>
              </div>

              {/* Top Posts */}
              <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] p-5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Top Performing Posts
                </h3>

                <div className="space-y-3">
                  {(topPosts.length > 0 ? topPosts : []).slice(0, 3).map((post, index) => (
                    <div
                      key={post.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                      onClick={() => post.id && openPostDrawer(post)}
                    >
                      <div className="w-14 h-14 rounded-lg bg-[#1a1a1a] border border-[#333] flex items-center justify-center overflow-hidden flex-shrink-0">
                        {post.media_url ? (
                          <img src={post.thumbnail_url || post.media_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          getMediaIcon(post.media_type)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{post.caption?.slice(0, 30) || `Post #${index + 1}`}</p>
                        <p className="text-xs text-gray-500">{formatNumber(post.engagement_count + post.saved_count)} engagements</p>
                      </div>
                      <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md">
                        <span className="text-xs font-bold text-primary">#{index + 1}</span>
                      </div>
                    </div>
                  ))}
                  {topPosts.length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-4">No posts yet</p>
                  )}
                </div>

                {posts.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-4 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={() => setActiveTab("content")}
                  >
                    View All Posts
                  </Button>
                )}
              </div>

              {/* Recent Posts */}
              <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] p-5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Recent Posts
                </h3>
                <div className="space-y-3">
                  {posts.slice(0, 3).map((post, idx) => (
                    <div key={post.id} className="flex items-start gap-3 cursor-pointer hover:bg-[#1a1a1a] p-2 rounded-lg transition-colors" onClick={() => openPostDrawer(post)}>
                      <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] border border-[#333] flex items-center justify-center overflow-hidden flex-shrink-0">
                        {post.media_url ? (
                          <img src={post.thumbnail_url || post.media_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          getMediaIcon(post.media_type)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{post.caption?.slice(0, 40) || 'No caption'}...</p>
                        <p className="text-xs text-gray-500">{formatNumber(post.engagement_count)} engagements • {formatNumber(post.reach)} reach</p>
                      </div>
                    </div>
                  ))}
                  {posts.length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-4">No recent posts</p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </TabsContent>

        {/* All Content Tab */}
        <TabsContent value="content">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Post Performance
              </h2>
              <span className="text-sm text-muted-foreground">{posts.length} posts</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer bg-[#1a1a1a] border border-[#2a2a2a] hover:border-primary/50 transition-colors"
                  onClick={() => openPostDrawer(post)}
                >
                  {/* Image */}
                  {post.media_url ? (
                    <img
                      src={post.thumbnail_url || post.media_url}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-600" />
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-6">

                    {/* Top: Platform Badge */}
                    <div className="self-start transform -translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                      <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                        <Instagram className="w-3 h-3 text-white" />
                        <span className="text-[10px] font-medium text-white uppercase tracking-wider">Instagram</span>
                      </div>
                    </div>

                    {/* Bottom: Content */}
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      {/* Caption */}
                      <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 mb-3 drop-shadow-md">
                        {post.caption || 'Untitled Post'}
                      </h3>

                      {/* Stats Row */}
                      <div className="flex items-center justify-between border-t border-white/20 pt-3">
                        <div className="flex items-center gap-4 text-gray-200 text-sm font-medium">
                          <div className="flex items-center gap-1.5">
                            <Heart className="w-4 h-4 text-white fill-white/20" />
                            <span>{formatNumber(post.likes_count || 0)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MessageCircle className="w-4 h-4 text-white fill-white/20" />
                            <span>{formatNumber(post.comments_count || 0)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-wide">
                          View
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {posts.length === 0 && (
              <Card className="p-12 text-center bg-[#141414] border-[#2a2a2a]">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No posts found</p>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience">
          <Card className="p-12 text-center bg-[#141414] border-[#2a2a2a]">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Audience Insights</h3>
            <p className="text-muted-foreground">Detailed audience demographics and behavior analytics coming soon.</p>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card className="p-6 bg-[#141414] border-[#2a2a2a]">
            <h3 className="text-xl font-semibold mb-4">Account Settings</h3>
            {account && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 p-0.5">
                    {account.profile_picture_url ? (
                      <img src={account.profile_picture_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-[#1a1a1a] flex items-center justify-center">
                        <Instagram className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-semibold">@{account.username}</p>
                    {account.name && <p className="text-sm text-muted-foreground">{account.name}</p>}
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{formatNumber(account.followers_count || 0)} followers</span>
                      <span>{formatNumber(account.media_count || 0)} posts</span>
                    </div>
                  </div>
                </div>
                <Button variant="destructive" onClick={() => setIsConnected(false)}>
                  Disconnect Account
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Post Analytics Drawer */}
      <PostAnalyticsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        post={selectedPost}
      />
    </div>
  )
}
