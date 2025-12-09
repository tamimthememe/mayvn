"use client"

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useBrand } from '@/contexts/BrandContext'
import { RedditConnectModal } from '@/components/RedditConnectModal'
import RedditPostAnalyticsDrawer, { RedditPostData } from '@/components/RedditPostAnalyticsDrawer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Loader2, MessageSquare, ArrowUpCircle, ExternalLink, RefreshCw, Calendar, Trophy, TrendingUp, Image as ImageIcon, LayoutGrid, List } from 'lucide-react'
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    BarChart,
    Bar
} from "recharts"

export default function RedditAnalyticsPage() {
    const { user } = useAuth()
    const { selectedBrand } = useBrand()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [analyticsData, setAnalyticsData] = useState<any>(null)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState("overview")
    const [selectedPost, setSelectedPost] = useState<RedditPostData | null>(null)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    const fetchAnalytics = async () => {
        if (!user?.uid || !selectedBrand) {
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        setError('')

        try {
            const redditUsername = selectedBrand.redditUsername
            const isVerified = selectedBrand.isRedditVerified

            if (!redditUsername || !isVerified) {
                setIsConnected(false)
                setIsLoading(false)
                return
            }

            setIsConnected(true)

            const res = await fetch(`/api/reddit/analytics?username=${redditUsername}`)
            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error)
            } else {
                setAnalyticsData(data)
            }
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Failed to fetch analytics')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchAnalytics()
    }, [user?.uid, selectedBrand])

    const openPostDrawer = (post: RedditPostData) => {
        setSelectedPost(post)
        setIsDrawerOpen(true)
    }

    // Process Data
    const account = analyticsData?.account?.data
    const posts: RedditPostData[] = analyticsData?.posts?.data?.children?.map((c: any) => c.data) || []

    const stats = useMemo(() => {
        if (!account) return null
        return {
            totalKarma: account.total_karma,
            postKarma: account.link_karma,
            commentKarma: account.comment_karma,
            accountCreated: new Date(account.created_utc * 1000).toLocaleDateString(),
            totalPosts: posts.length,
            avgScore: posts.length > 0 ? Math.round(posts.reduce((acc, p) => acc + p.score, 0) / posts.length) : 0
        }
    }, [account, posts])

    // Chart Data: Score over time
    const chartData = useMemo(() => {
        return [...posts]
            .sort((a, b) => a.created_utc - b.created_utc)
            .map((post) => ({
                date: new Date(post.created_utc * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                score: post.score,
                comments: post.num_comments
            }))
    }, [posts])

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
        return num.toLocaleString()
    }

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 shadow-xl">
                    <p className="text-xs text-gray-400">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

    return (
        <div className="px-4 md:px-6 pb-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <span className="bg-[#047286] p-1.5 rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold">R</span>
                        Reddit Analytics
                    </h1>
                    <p className="text-gray-400 mt-1">Track your performance across Reddit communities.</p>
                </div>
                {isConnected && (
                    <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={isLoading} className="bg-[#1a1a1a] border-[#333] hover:bg-[#2a2a2a] text-white">
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                )}
            </div>

            {isLoading && !analyticsData ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-[#047286]" />
                </div>
            ) : !isConnected ? (
                <Card className="bg-[#141414] border-[#2a2a2a] text-center p-12">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-[#047286]/20 flex items-center justify-center">
                            <span className="text-[#047286] text-2xl font-bold">R</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Connect your Reddit Account</h2>
                        <p className="text-gray-400 max-w-md">
                            Verify your account to unlock analytics, track post performance, and get AI insights for your Reddit content.
                        </p>
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-[#047286] hover:bg-[#047286]/90 text-white px-8"
                        >
                            Connect Reddit
                        </Button>
                    </div>
                </Card>
            ) : (
                <>
                    {/* Account Summary Card */}
                    {account && (
                        <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] p-5">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                {/* Left: Profile */}
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#047286] to-[#0ea5e9] p-0.5 flex-shrink-0">
                                        {account.icon_img ? (
                                            <img src={account.icon_img.split('?')[0]} className="w-full h-full rounded-full object-cover bg-[#1a1a1a]" alt="" />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-[#1a1a1a] flex items-center justify-center">
                                                <span className="text-white font-bold text-xl">R</span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">{account.subreddit?.title || account.name}</h2>
                                        <p className="text-sm text-gray-400">u/{account.name}</p>
                                    </div>
                                </div>

                                {/* Right: Stats */}
                                <div className="flex items-center gap-6 md:gap-12">
                                    <div className="text-center">
                                        <p className="text-xl font-bold text-white">{formatNumber(stats?.totalKarma || 0)}</p>
                                        <p className="text-xs text-gray-500">Total Karma</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xl font-bold text-white">{formatNumber(stats?.postKarma || 0)}</p>
                                        <p className="text-xs text-gray-500">Post Karma</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xl font-bold text-white">{formatNumber(stats?.commentKarma || 0)}</p>
                                        <p className="text-xs text-gray-500">Comment Karma</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xl font-bold text-[#047286]">{stats?.accountCreated}</p>
                                        <p className="text-xs text-gray-500">Joined</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="bg-[#1a1a1a] p-1 rounded-lg border border-[#2a2a2a] mb-6">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">Overview</TabsTrigger>
                            <TabsTrigger value="content" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">All Content</TabsTrigger>
                            <TabsTrigger value="settings" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">Settings</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-6 mt-0">
                            {/* Top Stats Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card className="bg-[#141414] border-[#2a2a2a] p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-[#047286]/20 flex items-center justify-center">
                                            <Trophy className="w-4 h-4 text-[#047286]" />
                                        </div>
                                        <span className="text-xs text-gray-400">Total Karma</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-white">{formatNumber(stats?.totalKarma || 0)}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">lifetime score</span>
                                </Card>

                                <Card className="bg-[#141414] border-[#2a2a2a] p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-[#0ea5e9]/20 flex items-center justify-center">
                                            <MessageSquare className="w-4 h-4 text-[#0ea5e9]" />
                                        </div>
                                        <span className="text-xs text-gray-400">Total Comments</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-white">{formatNumber(posts.reduce((acc, p) => acc + p.num_comments, 0))}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">across all posts</span>
                                </Card>

                                <Card className="bg-[#141414] border-[#2a2a2a] p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-[#06b6d4]/20 flex items-center justify-center">
                                            <TrendingUp className="w-4 h-4 text-[#06b6d4]" />
                                        </div>
                                        <span className="text-xs text-gray-400">Avg Upvote Ratio</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-white">
                                            {posts.length > 0
                                                ? Math.round(posts.reduce((acc, p) => acc + (p.upvote_ratio || 0), 0) / posts.length * 100)
                                                : 0}%
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-500">average approval</span>
                                </Card>

                                <Card className="bg-[#141414] border-[#2a2a2a] p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                            <Calendar className="w-4 h-4 text-purple-500" />
                                        </div>
                                        <span className="text-xs text-gray-400">Account Age</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-bold text-white">{stats?.accountCreated}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">joined date</span>
                                </Card>
                            </div>

                            <div className="grid grid-cols-12 gap-4">
                                {/* LEFT COLUMN - Overview Section */}
                                <div className="col-span-12 lg:col-span-8 space-y-4">
                                    {/* Overview Card with Chart */}
                                    <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-lg font-semibold text-white">Growth Overview</h2>
                                            <select className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-[#047286]">
                                                <option>Last 30 Days</option>
                                                <option>All Time</option>
                                            </select>
                                        </div>

                                        {/* Area Chart */}
                                        <div className="h-[280px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#047286" stopOpacity={0.4} />
                                                            <stop offset="95%" stopColor="#047286" stopOpacity={0} />
                                                        </linearGradient>
                                                        <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <XAxis
                                                        dataKey="date"
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
                                                        dataKey="score"
                                                        stroke="#047286"
                                                        strokeWidth={2}
                                                        fill="url(#colorScore)"
                                                        name="Score"
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="comments"
                                                        stroke="#0ea5e9"
                                                        strokeWidth={2}
                                                        fill="url(#colorComments)"
                                                        name="Comments"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Legend */}
                                        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#2a2a2a]">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-[#047286]" />
                                                <span className="text-sm text-gray-400">Score</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-[#0ea5e9]" />
                                                <span className="text-sm text-gray-400">Comments</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Row: Weekly Activity & Breakdown */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Weekly Activity Bar Chart */}
                                        <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] p-5">
                                            <h3 className="text-lg font-semibold text-white mb-4">Weekly Activity</h3>
                                            <div className="h-[180px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => ({
                                                            name: day,
                                                            value: posts.filter(p => new Date(p.created_utc * 1000).getDay() === idx).length
                                                        }))}
                                                        margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                                                    >
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10 }} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10 }} />
                                                        <Tooltip content={<CustomTooltip />} />
                                                        <Bar dataKey="value" fill="#047286" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Engagement Breakdown (Score vs Comments) */}
                                        <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] p-5">
                                            <h3 className="text-lg font-semibold text-white mb-4">Engagement Breakdown</h3>
                                            <div className="flex items-center gap-4">
                                                <div className="h-[140px] w-[140px] relative flex items-center justify-center">
                                                    {/* Simple Donut Representation */}
                                                    <div className="relative w-32 h-32 rounded-full border-8 border-[#047286] flex items-center justify-center">
                                                        <div className="absolute inset-0 rounded-full border-8 border-[#0ea5e9] clip-path-half" style={{ clipPath: `inset(0 0 0 50%)` }}></div>
                                                        <div className="text-center">
                                                            <span className="text-lg font-bold text-white block">{formatNumber(stats?.totalKarma || 0)}</span>
                                                            <span className="text-[10px] text-gray-500">Total Karma</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-[#047286]" />
                                                            <span className="text-xs text-gray-400">Post Karma</span>
                                                        </div>
                                                        <span className="text-xs font-medium text-white">{formatNumber(stats?.postKarma || 0)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-[#0ea5e9]" />
                                                            <span className="text-xs text-gray-400">Comment Karma</span>
                                                        </div>
                                                        <span className="text-xs font-medium text-white">{formatNumber(stats?.commentKarma || 0)}</span>
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
                                                <ArrowUpCircle className="w-4 h-4 text-[#047286]" />
                                                <span className="text-xs text-gray-400">Post Karma</span>
                                            </div>
                                            <p className="text-xl font-bold text-white">{formatNumber(stats?.postKarma || 0)}</p>
                                            <span className="text-xs text-gray-500">from submissions</span>
                                        </div>
                                        <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <MessageSquare className="w-4 h-4 text-[#0ea5e9]" />
                                                <span className="text-xs text-gray-400">Comment Karma</span>
                                            </div>
                                            <p className="text-xl font-bold text-white">{formatNumber(stats?.commentKarma || 0)}</p>
                                            <span className="text-xs text-gray-500">from discussions</span>
                                        </div>
                                    </div>

                                    {/* Top Posts */}
                                    <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] p-5">
                                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                            <Trophy className="w-5 h-5 text-[#047286]" />
                                            Top Performing Posts
                                        </h3>

                                        <div className="space-y-3">
                                            {[...posts].sort((a, b) => b.score - a.score).slice(0, 3).map((post, index) => {
                                                const hasImage = post.post_hint === 'image' || (post.url && post.url.match(/\.(jpeg|jpg|gif|png)$/));
                                                const imageUrl = hasImage ? post.url : (post.thumbnail && post.thumbnail.startsWith('http') ? post.thumbnail : null);

                                                return (
                                                    <div
                                                        key={post.id}
                                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                                                        onClick={() => openPostDrawer(post)}
                                                    >
                                                        <div className="w-14 h-14 rounded-lg bg-[#1a1a1a] border border-[#333] flex items-center justify-center overflow-hidden flex-shrink-0">
                                                            {imageUrl ? (
                                                                <img src={imageUrl} className="w-full h-full object-cover" alt="" />
                                                            ) : (
                                                                <MessageSquare className="w-6 h-6 text-[#047286]" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-white truncate">{post.title}</p>
                                                            <p className="text-xs text-gray-500">{formatNumber(post.score)} score • {formatNumber(post.num_comments)} comments</p>
                                                        </div>
                                                        <div className="flex items-center gap-1 bg-[#047286]/10 px-2 py-1 rounded-md">
                                                            <span className="text-xs font-bold text-[#047286]">#{index + 1}</span>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                            {posts.length === 0 && (
                                                <p className="text-xs text-gray-500 text-center py-4">No posts yet</p>
                                            )}
                                        </div>

                                        {posts.length > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full mt-4 text-[#047286] hover:text-[#047286] hover:bg-[#047286]/10"
                                                onClick={() => setActiveTab("content")}
                                            >
                                                View All Posts
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="content" className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {posts.map((post) => {
                                    const hasImage = post.post_hint === 'image' || (post.url && post.url.match(/\.(jpeg|jpg|gif|png)$/));
                                    const imageUrl = hasImage ? post.url : (post.thumbnail && post.thumbnail.startsWith('http') ? post.thumbnail : null);

                                    return (
                                        <div
                                            key={post.id}
                                            className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#047286]/50 transition-colors"
                                            onClick={() => openPostDrawer(post)}
                                        >
                                            {/* Image */}
                                            {imageUrl ? (
                                                <img
                                                    src={imageUrl}
                                                    alt=""
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center bg-[#1a1a1a] p-6 text-center">
                                                    <div className="w-12 h-12 rounded-full bg-[#047286]/10 flex items-center justify-center mb-3">
                                                        <MessageSquare className="w-6 h-6 text-[#047286]" />
                                                    </div>
                                                    <p className="text-gray-500 text-xs font-medium line-clamp-3">{post.title}</p>
                                                </div>
                                            )}

                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-6">

                                                {/* Top: Platform Badge */}
                                                <div className="self-start transform -translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                                                    <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                                                        <span className="bg-[#047286] p-0.5 rounded-full w-3 h-3 flex items-center justify-center text-[6px] font-bold text-white">R</span>
                                                        <span className="text-[10px] font-medium text-white uppercase tracking-wider">Reddit</span>
                                                    </div>
                                                </div>

                                                {/* Bottom: Content */}
                                                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                    {/* Caption */}
                                                    <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 mb-3 drop-shadow-md">
                                                        {post.title}
                                                    </h3>

                                                    {/* Stats Row */}
                                                    <div className="flex items-center justify-between border-t border-white/20 pt-3">
                                                        <div className="flex items-center gap-4 text-gray-200 text-sm font-medium">
                                                            <div className="flex items-center gap-1.5">
                                                                <ArrowUpCircle className="w-4 h-4 text-white fill-white/20" />
                                                                <span>{formatNumber(post.score)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <MessageSquare className="w-4 h-4 text-white fill-white/20" />
                                                                <span>{formatNumber(post.num_comments)}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1 text-[#047286] text-xs font-bold uppercase tracking-wide">
                                                            View
                                                            <ExternalLink className="w-3 h-3" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </TabsContent>

                        <TabsContent value="settings">
                            <Card className="p-6 bg-[#141414] border-[#2a2a2a]">
                                <h3 className="text-xl font-semibold text-white mb-4">Account Settings</h3>
                                {account && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#047286] to-[#0ea5e9] p-0.5">
                                                {account.icon_img ? (
                                                    <img src={account.icon_img.split('?')[0]} alt="" className="w-full h-full rounded-full object-cover bg-[#1a1a1a]" />
                                                ) : (
                                                    <div className="w-full h-full rounded-full bg-[#1a1a1a] flex items-center justify-center">
                                                        <span className="text-white font-bold text-xl">R</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-lg font-semibold text-white">u/{account.name}</p>
                                                <p className="text-sm text-gray-400">Connected Reddit Account</p>
                                                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                                                    <span>{formatNumber(stats?.totalKarma || 0)} karma</span>
                                                    <span>{stats?.accountCreated}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            onClick={async () => {
                                                if (!user?.uid || !selectedBrand?.id) return;
                                                // Import dynamically to avoid top-level SSR issues if any
                                                const { updateBrandDocument } = await import('@/lib/userService');
                                                await updateBrandDocument(user.uid, selectedBrand.id, {
                                                    redditUsername: null,
                                                    redditChallenge: null,
                                                    isRedditVerified: false
                                                });
                                                window.location.reload();
                                            }}
                                        >
                                            Disconnect Account
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        </TabsContent>
                    </Tabs>
                </>
            )}

            <RedditConnectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false)
                    fetchAnalytics()
                }}
            />

            <RedditPostAnalyticsDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                post={selectedPost}
            />
        </div>
    )
}
