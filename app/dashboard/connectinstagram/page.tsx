"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Instagram, 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark,
  User,
  Users,
  Grid3x3,
  TrendingUp,
  Eye,
  Share2,
  Sparkles,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  ExternalLink,
  AlertCircle,
  Search
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ScrapedInstagramProfile } from "@/lib/instagram-scraper"
import { formatCount, getRelativeTime, calculateEngagementRate, getAverageLikes, getAverageComments } from "@/lib/instagram-scraper"

export default function ConnectInstagramPage() {
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [profile, setProfile] = useState<ScrapedInstagramProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<string | null>(null)
  const [animateCards, setAnimateCards] = useState(false)

  useEffect(() => {
    if (profile) {
      // Stagger animation for cards
      setTimeout(() => setAnimateCards(true), 300)
    }
  }, [profile])

  const handleFetchProfile = async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (!username.trim()) {
      setError("Please enter an Instagram username")
      return
    }

    setIsLoading(true)
    setError(null)
    setProfile(null)
    setAnimateCards(false)

    try {
      const response = await fetch('/api/instagram/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch profile')
      }

      setProfile(data.profile)
      setError(null)
    } catch (err: any) {
      console.error('Error fetching profile:', err)
      setError(err.message || 'Failed to fetch Instagram profile')
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setProfile(null)
    setUsername("")
    setError(null)
    setAnimateCards(false)
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {/* Background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div 
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div 
            className="absolute top-1/2 left-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="relative min-h-screen flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-2xl">
            {/* Back button */}
            <Link href="/dashboard">
              <Button variant="ghost" className="mb-6 hover:bg-primary/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>

            {/* Main connection card */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-xl p-8 sm:p-12 relative overflow-hidden">
              {/* Animated gradient border effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-orange-500/20 animate-pulse pointer-events-none"></div>
              
              <div className="relative space-y-8">
                {/* Instagram icon with animation */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 rounded-3xl blur-xl opacity-50 animate-pulse"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 rounded-3xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
                      <Instagram className="w-12 h-12 text-white" />
                    </div>
                  </div>
                </div>

                {/* Title and description */}
                <div className="text-center space-y-4">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 bg-clip-text text-transparent">
                    View Instagram Profile
                  </h1>
                  <p className="text-lg text-muted-foreground max-w-md mx-auto">
                    Enter any public Instagram username to view their profile, recent posts, and analytics
                  </p>
                </div>

                {/* Features grid */}
                <div className="grid md:grid-cols-2 gap-4 py-6">
                  {[
                    { icon: Grid3x3, title: "Recent Posts", desc: "View latest public posts" },
                    { icon: Heart, title: "Engagement Metrics", desc: "Likes, comments, shares" },
                    { icon: Users, title: "Follower Stats", desc: "Followers & following count" },
                    { icon: TrendingUp, title: "Analytics", desc: "Engagement rate & insights" },
                  ].map((feature, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-br from-background/50 to-card/50 border border-border/50 hover:border-primary/50 transition-all duration-300 group"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <feature.icon className="w-5 h-5 text-pink-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                        <p className="text-xs text-muted-foreground">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Username input form */}
                <form onSubmit={handleFetchProfile} className="flex flex-col gap-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Enter Instagram username (e.g., @username)"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full h-14 pl-12 text-lg bg-background/50 border-border/50 focus:border-pink-500/50"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-500">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  {/* Submit button */}
                  <Button
                    type="submit"
                    disabled={isLoading || !username.trim()}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 hover:opacity-90 transition-opacity shadow-lg shadow-pink-500/25"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Fetching Profile...
                      </>
                    ) : (
                      <>
                        <Instagram className="w-5 h-5 mr-2" />
                        View Profile
                      </>
                    )}
                  </Button>

                  {/* Info text */}
                  <p className="text-xs text-muted-foreground text-center">
                    Only public profile data will be displayed. Private accounts cannot be viewed.
                  </p>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Calculate insights from profile data
  const engagementRate = calculateEngagementRate(profile)
  const avgLikes = getAverageLikes(profile.posts)
  const avgComments = getAverageComments(profile.posts)

  // Connected view with data preview
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleReset}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Instagram className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Instagram Profile</h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>@{profile.username}</span>
                  </div>
                </div>
              </div>
            </div>
            <Button onClick={handleReset} variant="outline" className="border-pink-500/50 text-pink-500 hover:bg-pink-500/10">
              Search Another
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-700 ${animateCards ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Profile section */}
        <Card className={`border-border/50 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-orange-500/5 backdrop-blur-sm p-8 mb-8 transition-all duration-500 ${animateCards ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Profile picture */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <img
                src={profile.profilePicUrl}
                alt={profile.username}
                className="relative w-24 h-24 rounded-full border-4 border-background ring-2 ring-pink-500/50"
              />
            </div>

            {/* Profile info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold">{profile.fullName}</h2>
                {profile.isVerified && (
                  <Badge className="bg-blue-500 hover:bg-blue-600">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {profile.isPrivate && (
                  <Badge variant="outline">
                    Private
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mb-4">@{profile.username}</p>
              {profile.bio && <p className="text-sm mb-4">{profile.bio}</p>}

              {/* Stats */}
              <div className="flex flex-wrap gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatCount(profile.postsCount)}</div>
                  <div className="text-xs text-muted-foreground">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatCount(profile.followersCount)}</div>
                  <div className="text-xs text-muted-foreground">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatCount(profile.followingCount)}</div>
                  <div className="text-xs text-muted-foreground">Following</div>
                </div>
              </div>
            </div>

            {/* View profile button */}
            <a href={`https://www.instagram.com/${profile.username}/`} target="_blank" rel="noopener noreferrer">
              <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90">
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Instagram
              </Button>
            </a>
          </div>
        </Card>

        {/* Insights cards */}
        <div className={`grid md:grid-cols-3 gap-4 mb-8 transition-all duration-500 delay-100 ${animateCards ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {[
            {
              label: "Engagement Rate",
              value: `${engagementRate}%`,
              icon: TrendingUp,
              color: "from-green-500 to-emerald-500",
              change: "Per post",
            },
            {
              label: "Avg. Likes per Post",
              value: formatCount(avgLikes),
              icon: Heart,
              color: "from-pink-500 to-rose-500",
              change: `${profile.posts.length} posts`,
            },
            {
              label: "Avg. Comments",
              value: formatCount(avgComments),
              icon: MessageCircle,
              color: "from-blue-500 to-cyan-500",
              change: "Per post",
            },
          ].map((insight, i) => (
            <Card
              key={i}
              className="border-border/50 bg-card/50 backdrop-blur-sm p-6 hover:border-primary/50 transition-all duration-300 group"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${insight.color} p-2.5 mb-4 group-hover:scale-110 transition-transform`}>
                <insight.icon className="w-full h-full text-white" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{insight.label}</p>
                <div className="text-2xl font-bold">{insight.value}</div>
                <p className="text-xs text-green-500">{insight.change}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Content tabs */}
        <div className={`transition-all duration-500 delay-200 ${animateCards ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="posts" className="flex items-center gap-2">
                <Grid3x3 className="w-4 h-4" />
                Posts
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Posts tab */}
            <TabsContent value="posts" className="space-y-6">
              {profile.posts.length === 0 ? (
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-12 text-center">
                  <Grid3x3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No posts available</h3>
                  <p className="text-sm text-muted-foreground">
                    {profile.isPrivate ? "This account is private" : "No posts found for this account"}
                  </p>
                </Card>
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  {profile.posts.map((post, i) => (
                  <Card
                    key={post.id}
                    className={`border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden hover:border-primary/50 transition-all duration-300 cursor-pointer group ${
                      selectedPost === post.id ? 'ring-2 ring-pink-500' : ''
                    }`}
                    onClick={() => setSelectedPost(selectedPost === post.id ? null : post.id)}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {/* Post image */}
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={post.imageUrl}
                        alt="Post"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {post.isVideo && (
                        <div className="absolute top-3 right-3 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <div className="flex items-center gap-4 text-white text-sm">
                          <div className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {formatCount(post.likes)}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {post.comments}
                          </div>
                          {post.isVideo && post.videoViews && (
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {formatCount(post.videoViews)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Post info */}
                    <div className="p-4 space-y-3">
                      <p className="text-sm line-clamp-2">{post.caption || 'No caption'}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{getRelativeTime(post.timestamp)}</span>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {formatCount(post.likes)}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {post.comments}
                          </div>
                        </div>
                      </div>

                      {/* Engagement metrics */}
                      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/50">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-pink-500 mb-1">
                            <Heart className="w-4 h-4" />
                          </div>
                          <div className="text-xs font-semibold">{formatCount(post.likes)}</div>
                          <div className="text-xs text-muted-foreground">Likes</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                            <MessageCircle className="w-4 h-4" />
                          </div>
                          <div className="text-xs font-semibold">{post.comments}</div>
                          <div className="text-xs text-muted-foreground">Comments</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Analytics tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Best performing posts */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    Top Performing Posts
                  </h3>
                  {profile.posts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No posts available</p>
                  ) : (
                    <div className="space-y-3">
                      {profile.posts
                        .sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments))
                        .slice(0, 3)
                        .map((post, i) => (
                          <div key={post.id} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50 hover:border-primary/50 transition-all duration-300">
                            <img src={post.imageUrl} alt="Post" className="w-16 h-16 rounded-lg object-cover" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm line-clamp-1 mb-1">{post.caption || 'No caption'}</p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Heart className="w-3 h-3 text-pink-500" />
                                  {formatCount(post.likes)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageCircle className="w-3 h-3 text-blue-500" />
                                  {post.comments}
                                </span>
                              </div>
                            </div>
                            <Badge variant="secondary">#{i + 1}</Badge>
                          </div>
                        ))}
                    </div>
                  )}
                </Card>

                {/* Profile metrics */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Profile Metrics
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                      <span className="text-sm">Total Posts</span>
                      <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">
                        {formatCount(profile.postsCount)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                      <span className="text-sm">Engagement Rate</span>
                      <Badge className="bg-blue-500/20 text-blue-500 hover:bg-blue-500/30">
                        {engagementRate}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                      <span className="text-sm">Followers</span>
                      <Badge className="bg-purple-500/20 text-purple-500 hover:bg-purple-500/30">
                        {formatCount(profile.followersCount)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                      <span className="text-sm">Following</span>
                      <Badge className="bg-pink-500/20 text-pink-500 hover:bg-pink-500/30">
                        {formatCount(profile.followingCount)}
                      </Badge>
                    </div>
                  </div>
                </Card>

                {/* Quick stats */}
                <Card className="border-border/50 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-orange-500/10 backdrop-blur-sm p-6 md:col-span-2">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-500" />
                    Engagement Stats
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <div className="text-2xl font-bold">{profile.posts.length}</div>
                      <div className="text-xs text-muted-foreground">Posts Shown</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <div className="text-2xl font-bold">{formatCount(avgLikes)}</div>
                      <div className="text-xs text-muted-foreground">Avg. Likes</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <div className="text-2xl font-bold">{formatCount(avgComments)}</div>
                      <div className="text-xs text-muted-foreground">Avg. Comments</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <div className="text-2xl font-bold">{engagementRate}%</div>
                      <div className="text-xs text-muted-foreground">Engagement Rate</div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

