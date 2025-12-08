"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PostAnalyticsDrawer, { PostData, MOCK_POST_DATA, CommentData } from "@/components/PostAnalyticsDrawer"
import { useAuth } from "@/contexts/AuthContext"
import { useBrand } from "@/contexts/BrandContext"
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
  ChevronDown,
  Plus
} from "lucide-react"


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

export default function InstagramAnalyticsPage() {
  const { user, loading: authLoading } = useAuth()
  const { selectedBrandId, selectedBrand, loading: brandLoading } = useBrand()

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
  const [showAccountDropdown, setShowAccountDropdown] = useState(false)

  // Token state for adding new account
  const [accessToken, setAccessToken] = useState("")
  const [instagramUserId, setInstagramUserId] = useState("")
  const [appId, setAppId] = useState("")
  const [appSecret, setAppSecret] = useState("")
  const [isSavingToken, setIsSavingToken] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [showAddAccount, setShowAddAccount] = useState(false)
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
    saves: 0
  })

  useEffect(() => {
    if (user?.uid && selectedBrandId) {
      fetchData()
    }
  }, [user?.uid, selectedBrandId, selectedInstagramUserId])

  const fetchData = async (instagramId?: string) => {
    setLoading(true)
    setError(null)

    try {
      if (!user?.uid || !selectedBrandId) {
        throw new Error('Not authenticated or no brand selected')
      }

      // Build URL with optional instagramUserId
      let url = `/api/instagram/insights?userId=${user.uid}&brandId=${selectedBrandId}`
      if (instagramId || selectedInstagramUserId) {
        url += `&instagramUserId=${instagramId || selectedInstagramUserId}`
      }

      const res = await fetch(url)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Not connected')
      }

      setAccount(data.account || null)

      // Store connected accounts for switcher
      if (data.allAccounts) {
        setConnectedAccounts(data.allAccounts)
      }
      if (data.currentInstagramUserId) {
        setSelectedInstagramUserId(data.currentInstagramUserId)
      }

      const transformedPosts: PostData[] = (data.mediaInsights || []).map((media: ApiMediaInsight) => {
        const reach = media.insights?.reach || 0
        const impressions = media.insights?.impressions || 0
        const likes = media.like_count || 0
        const comments = media.comments_count || 0
        const saved = media.insights?.saved || 0

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
          shares_count: media.insights?.shares,
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
        engagement: data.insights?.likes + data.insights?.comments || 0,
        saves: data.insights?.saves || 0
      })

      setIsConnected(true)
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

      // Store token info for display
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
      fetchData()
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

              {/* Long-lived token credentials */}
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

            {/* Demo Mode */}
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
                    saves: 234
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

  // ================================
  // MAIN ANALYTICS VIEW
  // ================================
  return (
    <div className="px-4 md:px-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Instagram Analytics</h1>
          <p className="text-muted-foreground text-sm">Deep dive into your post performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchData()}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsConnected(false)}>
            Change Account
          </Button>
        </div>
      </div>

      {/* Account Card */}
      {account && (
        <Card className="p-6 mb-8 bg-card/60 border-border/50">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 p-1">
              {account.profile_picture_url ? (
                <img src={account.profile_picture_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                  <Instagram className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold">@{account.username}</h2>
              {account.name && <p className="text-muted-foreground">{account.name}</p>}
            </div>
            <div className="flex gap-10 text-center">
              <div>
                <p className="text-3xl font-bold">{formatNumber(account.followers_count || 0)}</p>
                <p className="text-sm text-muted-foreground">Followers</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{formatNumber(account.follows_count || 0)}</p>
                <p className="text-sm text-muted-foreground">Following</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{formatNumber(account.media_count || 0)}</p>
                <p className="text-sm text-muted-foreground">Posts</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Totals Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-5 bg-card/60 border-border/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold">{formatNumber(totals.reach)}</p>
          <span className="text-sm text-muted-foreground">Total Reach</span>
        </Card>

        <Card className="p-5 bg-card/60 border-border/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold">{formatNumber(totals.impressions)}</p>
          <span className="text-sm text-muted-foreground">Impressions</span>
        </Card>

        <Card className="p-5 bg-card/60 border-border/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold">{formatNumber(totals.engagement)}</p>
          <span className="text-sm text-muted-foreground">Engagement</span>
        </Card>

        <Card className="p-5 bg-card/60 border-border/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Bookmark className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold">{formatNumber(totals.saves)}</p>
          <span className="text-sm text-muted-foreground">Saves</span>
        </Card>
      </div>

      {/* Posts Grid */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Post Performance
          </h2>
          <span className="text-sm text-muted-foreground">{posts.length} posts</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {posts.map((post) => (
            <Card
              key={post.id}
              className="relative overflow-hidden cursor-pointer group bg-card/60 border-border/50 hover:border-primary/50 transition-all duration-300"
              onClick={() => openPostDrawer(post)}
            >
              <div className="aspect-square bg-muted">
                {post.media_url ? (
                  <img
                    src={post.thumbnail_url || post.media_url}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}

                <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-xs flex items-center gap-1">
                  {getMediaIcon(post.media_type)}
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                  <div className="grid grid-cols-2 gap-2 w-full text-xs">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-primary" />
                      {formatNumber(post.impressions)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-primary" />
                      {formatNumber(post.reach)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-primary" />
                      {formatNumber(post.engagement_count)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Bookmark className="w-3 h-3 text-primary" />
                      {formatNumber(post.saved_count)}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {posts.length === 0 && (
          <Card className="p-12 text-center bg-card/60 border-border/50">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No posts found</p>
          </Card>
        )}
      </div>

      {/* Post Analytics Drawer */}
      <PostAnalyticsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        post={selectedPost}
      />
    </div>
  )
}
