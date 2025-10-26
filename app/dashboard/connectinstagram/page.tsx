"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
  ExternalLink
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

// Mock Instagram data for preview
const mockInstagramData = {
  profile: {
    username: "your_brand",
    fullName: "Your Brand Name",
    bio: "🌟 Creating amazing content | 📍 Based in NYC | 💼 DM for collabs",
    profilePicture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    followersCount: 24500,
    followingCount: 892,
    postsCount: 347,
    isVerified: true,
  },
  posts: [
    {
      id: "1",
      imageUrl: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=400&fit=crop",
      caption: "Excited to share our new product line! What do you think? 🚀 #NewLaunch #Innovation",
      likes: 3420,
      comments: 156,
      shares: 89,
      views: 45200,
      timestamp: "2 hours ago",
      isVideo: false,
    },
    {
      id: "2",
      imageUrl: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&h=400&fit=crop",
      caption: "Behind the scenes of our latest photoshoot 📸✨",
      likes: 2890,
      comments: 98,
      shares: 45,
      views: 38500,
      timestamp: "1 day ago",
      isVideo: true,
    },
    {
      id: "3",
      imageUrl: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=400&fit=crop",
      caption: "Celebrating 25K followers! Thank you all for the amazing support 🎉💙",
      likes: 5240,
      comments: 234,
      shares: 120,
      views: 62300,
      timestamp: "3 days ago",
      isVideo: false,
    },
    {
      id: "4",
      imageUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=400&fit=crop",
      caption: "Monday motivation: Dream big, work hard, stay focused! 💪",
      likes: 1890,
      comments: 67,
      shares: 34,
      views: 28400,
      timestamp: "5 days ago",
      isVideo: false,
    },
    {
      id: "5",
      imageUrl: "https://images.unsplash.com/photo-1552581234-26160f608093?w=400&h=400&fit=crop",
      caption: "Team meeting vibes ☕️📊 What's your favorite workspace setup?",
      likes: 2100,
      comments: 89,
      shares: 56,
      views: 31200,
      timestamp: "1 week ago",
      isVideo: false,
    },
    {
      id: "6",
      imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop",
      caption: "Golden hour magic 🌅 Our favorite time to create content!",
      likes: 4120,
      comments: 178,
      shares: 92,
      views: 52100,
      timestamp: "1 week ago",
      isVideo: true,
    },
  ],
  recentComments: [
    {
      id: "c1",
      postId: "1",
      username: "sarah_designs",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      text: "This looks absolutely stunning! Can't wait to get my hands on it 😍",
      likes: 45,
      timestamp: "1 hour ago",
      replies: 3,
    },
    {
      id: "c2",
      postId: "1",
      username: "mike_tech",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
      text: "When will this be available for purchase?",
      likes: 23,
      timestamp: "2 hours ago",
      replies: 1,
    },
    {
      id: "c3",
      postId: "2",
      username: "emily_photo",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
      text: "The lighting is perfect! What camera do you use?",
      likes: 67,
      timestamp: "1 day ago",
      replies: 5,
    },
    {
      id: "c4",
      postId: "3",
      username: "alex_creative",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
      text: "Congrats on 25K! Well deserved! 🎉",
      likes: 89,
      timestamp: "3 days ago",
      replies: 2,
    },
    {
      id: "c5",
      postId: "3",
      username: "jessica_brand",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica",
      text: "Your content is always so inspiring! Keep it up 💯",
      likes: 56,
      timestamp: "3 days ago",
      replies: 0,
    },
  ],
  insights: {
    avgLikes: 3110,
    avgComments: 137,
    avgShares: 73,
    engagementRate: 8.2,
    reachGrowth: 12.5,
    topPerformingTime: "6-8 PM",
  },
}

export default function ConnectInstagramPage() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [showData, setShowData] = useState(false)
  const [selectedPost, setSelectedPost] = useState<string | null>(null)
  const [animateCards, setAnimateCards] = useState(false)

  useEffect(() => {
    if (isConnected && showData) {
      // Stagger animation for cards
      setTimeout(() => setAnimateCards(true), 300)
    }
  }, [isConnected, showData])

  const handleConnect = () => {
    setIsConnecting(true)
    // Simulate OAuth flow
    setTimeout(() => {
      setIsConnecting(false)
      setIsConnected(true)
      setTimeout(() => setShowData(true), 500)
    }, 2000)
  }

  const handleDisconnect = () => {
    setShowData(false)
    setTimeout(() => {
      setIsConnected(false)
      setAnimateCards(false)
    }, 300)
  }

  if (!isConnected) {
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
                    Connect Your Instagram
                  </h1>
                  <p className="text-lg text-muted-foreground max-w-md mx-auto">
                    Link your Instagram account to access insights, manage content, and engage with your audience
                  </p>
                </div>

                {/* Features grid */}
                <div className="grid md:grid-cols-2 gap-4 py-6">
                  {[
                    { icon: Grid3x3, title: "All Posts", desc: "Access your complete feed" },
                    { icon: Heart, title: "Engagement Metrics", desc: "Likes, comments, shares" },
                    { icon: MessageCircle, title: "Comments & Replies", desc: "Manage conversations" },
                    { icon: TrendingUp, title: "Analytics", desc: "Track growth & insights" },
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

                {/* Connect button */}
                <div className="flex flex-col gap-4">
                  <Button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 hover:opacity-90 transition-opacity shadow-lg shadow-pink-500/25"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Connecting to Instagram...
                      </>
                    ) : (
                      <>
                        <Instagram className="w-5 h-5 mr-2" />
                        Connect Instagram Account
                      </>
                    )}
                  </Button>

                  {/* Info text */}
                  <p className="text-xs text-muted-foreground text-center">
                    By connecting, you agree to Instagram's terms. Your data is secure and encrypted.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Connected view with data preview
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Instagram className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Instagram Connected</h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>@{mockInstagramData.profile.username}</span>
                  </div>
                </div>
              </div>
            </div>
            <Button onClick={handleDisconnect} variant="outline" className="border-pink-500/50 text-pink-500 hover:bg-pink-500/10">
              Disconnect
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-700 ${showData ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Profile section */}
        <Card className={`border-border/50 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-orange-500/5 backdrop-blur-sm p-8 mb-8 transition-all duration-500 ${animateCards ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Profile picture */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <img
                src={mockInstagramData.profile.profilePicture}
                alt={mockInstagramData.profile.username}
                className="relative w-24 h-24 rounded-full border-4 border-background ring-2 ring-pink-500/50"
              />
            </div>

            {/* Profile info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold">{mockInstagramData.profile.fullName}</h2>
                {mockInstagramData.profile.isVerified && (
                  <Badge className="bg-blue-500 hover:bg-blue-600">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mb-4">@{mockInstagramData.profile.username}</p>
              <p className="text-sm mb-4">{mockInstagramData.profile.bio}</p>

              {/* Stats */}
              <div className="flex flex-wrap gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{mockInstagramData.profile.postsCount.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{(mockInstagramData.profile.followersCount / 1000).toFixed(1)}K</div>
                  <div className="text-xs text-muted-foreground">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{mockInstagramData.profile.followingCount.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Following</div>
                </div>
              </div>
            </div>

            {/* View profile button */}
            <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90">
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Instagram
            </Button>
          </div>
        </Card>

        {/* Insights cards */}
        <div className={`grid md:grid-cols-4 gap-4 mb-8 transition-all duration-500 delay-100 ${animateCards ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {[
            {
              label: "Avg. Engagement Rate",
              value: `${mockInstagramData.insights.engagementRate}%`,
              icon: TrendingUp,
              color: "from-green-500 to-emerald-500",
              change: "+1.2%",
            },
            {
              label: "Avg. Likes per Post",
              value: mockInstagramData.insights.avgLikes.toLocaleString(),
              icon: Heart,
              color: "from-pink-500 to-rose-500",
              change: "+340",
            },
            {
              label: "Avg. Comments",
              value: mockInstagramData.insights.avgComments.toLocaleString(),
              icon: MessageCircle,
              color: "from-blue-500 to-cyan-500",
              change: "+23",
            },
            {
              label: "Reach Growth",
              value: `+${mockInstagramData.insights.reachGrowth}%`,
              icon: Eye,
              color: "from-purple-500 to-indigo-500",
              change: "This week",
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
            <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
              <TabsTrigger value="posts" className="flex items-center gap-2">
                <Grid3x3 className="w-4 h-4" />
                Posts
              </TabsTrigger>
              <TabsTrigger value="comments" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Comments
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Posts tab */}
            <TabsContent value="posts" className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                {mockInstagramData.posts.map((post, i) => (
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
                            {(post.likes / 1000).toFixed(1)}K
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {post.comments}
                          </div>
                          {post.isVideo && (
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {(post.views / 1000).toFixed(1)}K
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Post info */}
                    <div className="p-4 space-y-3">
                      <p className="text-sm line-clamp-2">{post.caption}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{post.timestamp}</span>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {(post.likes / 1000).toFixed(1)}K
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {post.comments}
                          </div>
                        </div>
                      </div>

                      {/* Engagement metrics */}
                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/50">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-pink-500 mb-1">
                            <Heart className="w-4 h-4" />
                          </div>
                          <div className="text-xs font-semibold">{(post.likes / 1000).toFixed(1)}K</div>
                          <div className="text-xs text-muted-foreground">Likes</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                            <MessageCircle className="w-4 h-4" />
                          </div>
                          <div className="text-xs font-semibold">{post.comments}</div>
                          <div className="text-xs text-muted-foreground">Comments</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-purple-500 mb-1">
                            <Share2 className="w-4 h-4" />
                          </div>
                          <div className="text-xs font-semibold">{post.shares}</div>
                          <div className="text-xs text-muted-foreground">Shares</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Comments tab */}
            <TabsContent value="comments" className="space-y-4">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Recent Comments</h3>
                  <Badge variant="secondary">{mockInstagramData.recentComments.length} New</Badge>
                </div>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {mockInstagramData.recentComments.map((comment, i) => (
                      <div
                        key={comment.id}
                        className="flex items-start gap-4 p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/50 transition-all duration-300"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <img
                          src={comment.avatar}
                          alt={comment.username}
                          className="w-10 h-10 rounded-full ring-2 ring-pink-500/30"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{comment.username}</span>
                            <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                          </div>
                          <p className="text-sm">{comment.text}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <button className="flex items-center gap-1 hover:text-pink-500 transition-colors">
                              <Heart className="w-3 h-3" />
                              {comment.likes}
                            </button>
                            <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                              <MessageCircle className="w-3 h-3" />
                              Reply
                            </button>
                            {comment.replies > 0 && (
                              <span className="text-primary">{comment.replies} replies</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </TabsContent>

            {/* Analytics tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Engagement trends */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Engagement Trends
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Post Engagement</span>
                        <span className="text-sm font-semibold text-green-500">↑ 12.5%</span>
                      </div>
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div className="h-full w-[82%] bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Story Views</span>
                        <span className="text-sm font-semibold text-blue-500">↑ 8.3%</span>
                      </div>
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div className="h-full w-[68%] bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Follower Growth</span>
                        <span className="text-sm font-semibold text-purple-500">↑ 15.7%</span>
                      </div>
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div className="h-full w-[75%] bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Content Reach</span>
                        <span className="text-sm font-semibold text-pink-500">↑ 10.2%</span>
                      </div>
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div className="h-full w-[71%] bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Best performing posts */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    Top Performing Content
                  </h3>
                  <div className="space-y-3">
                    {mockInstagramData.posts.slice(0, 3).map((post, i) => (
                      <div key={post.id} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50 hover:border-primary/50 transition-all duration-300">
                        <img src={post.imageUrl} alt="Post" className="w-16 h-16 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm line-clamp-1 mb-1">{post.caption}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3 text-pink-500" />
                              {(post.likes / 1000).toFixed(1)}K
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
                </Card>

                {/* Audience insights */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Audience Insights
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                      <span className="text-sm">Best Time to Post</span>
                      <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">
                        {mockInstagramData.insights.topPerformingTime}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                      <span className="text-sm">Avg. Engagement Rate</span>
                      <Badge className="bg-blue-500/20 text-blue-500 hover:bg-blue-500/30">
                        {mockInstagramData.insights.engagementRate}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                      <span className="text-sm">Growth Rate</span>
                      <Badge className="bg-purple-500/20 text-purple-500 hover:bg-purple-500/30">
                        +{mockInstagramData.insights.reachGrowth}%
                      </Badge>
                    </div>
                  </div>
                </Card>

                {/* Quick stats */}
                <Card className="border-border/50 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-orange-500/10 backdrop-blur-sm p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-500" />
                    Quick Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <div className="text-2xl font-bold">{mockInstagramData.posts.length}</div>
                      <div className="text-xs text-muted-foreground">Recent Posts</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <div className="text-2xl font-bold">{mockInstagramData.recentComments.length}</div>
                      <div className="text-xs text-muted-foreground">New Comments</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <div className="text-2xl font-bold">{mockInstagramData.insights.avgLikes}</div>
                      <div className="text-xs text-muted-foreground">Avg. Likes</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <div className="text-2xl font-bold">{mockInstagramData.insights.avgComments}</div>
                      <div className="text-xs text-muted-foreground">Avg. Comments</div>
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

