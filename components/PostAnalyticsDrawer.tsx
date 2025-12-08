"use client"

import { X, Eye, Users, Heart, Bookmark, Share2, Clock, Play, MessageCircle, Reply, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// ============================================
// DATA INTERFACES (Mirroring Instagram Graph API)
// ============================================

export interface CommentData {
    id: string
    text: string
    username: string
    sentiment: 'positive' | 'neutral' | 'negative'
}

export interface PostData {
    // Core
    id: string
    media_url: string
    thumbnail_url?: string
    caption: string
    timestamp: string
    media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REEL'

    // Insights
    reach: number
    impressions: number
    engagement_count: number
    saved_count: number
    shares_count?: number
    likes_count?: number
    comments_count?: number

    // Video Specific (Optional)
    video_duration?: number // in seconds
    ig_reels_avg_watch_time?: number // in seconds
    ig_reels_video_view_total_time?: number

    // Comments
    comments?: CommentData[]
}

// ============================================
// MOCK DATA FOR TESTING
// ============================================

export const MOCK_POST_DATA: PostData = {
    id: "17895695668004550",
    media_url: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600",
    thumbnail_url: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=300",
    caption: "Exploring the beautiful streets of Tokyo 🇯🇵 #travel #japan #tokyo #wanderlust",
    timestamp: "2024-10-24T17:00:00Z",
    media_type: "REEL",

    reach: 15420,
    impressions: 21580,
    engagement_count: 1842,
    saved_count: 234,
    shares_count: 89,
    likes_count: 1653,
    comments_count: 78,

    video_duration: 30,
    ig_reels_avg_watch_time: 22,
    ig_reels_video_view_total_time: 339060,

    comments: [
        { id: "c1", username: "travel_lover", text: "This is absolutely stunning! Adding to my bucket list 🎌", sentiment: "positive" },
        { id: "c2", username: "japan_fan", text: "I visited last month, you captured it perfectly!", sentiment: "positive" },
        { id: "c3", username: "random_user", text: "What camera did you use?", sentiment: "neutral" },
        { id: "c4", username: "critic_123", text: "Meh, looks like every other travel video", sentiment: "negative" },
    ]
}

// ============================================
// COMPONENT PROPS
// ============================================

interface PostAnalyticsDrawerProps {
    isOpen: boolean
    onClose: () => void
    post: PostData | null
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    }) + ' • ' + date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    })
}

function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toLocaleString()
}

function getMediaTypeBadge(type: string): { label: string; color: string } {
    const badges: Record<string, { label: string; color: string }> = {
        'IMAGE': { label: 'Photo', color: 'bg-primary/20 text-primary' },
        'VIDEO': { label: 'Video', color: 'bg-primary/20 text-primary' },
        'REEL': { label: 'Reel', color: 'bg-primary/20 text-primary' },
        'CAROUSEL_ALBUM': { label: 'Carousel', color: 'bg-primary/20 text-primary' },
    }
    return badges[type] || { label: type, color: 'bg-muted text-muted-foreground' }
}

function getSentimentColor(sentiment: string): string {
    const colors: Record<string, string> = {
        'positive': 'border-l-green-500',
        'neutral': 'border-l-muted-foreground',
        'negative': 'border-l-red-500',
    }
    return colors[sentiment] || 'border-l-muted-foreground'
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function PostAnalyticsDrawer({ isOpen, onClose, post }: PostAnalyticsDrawerProps) {
    if (!post) return null

    // Computed Metrics
    const rewatchRate = post.reach > 0 ? (post.impressions / post.reach) : 0
    const isHighRewatch = rewatchRate > 1.2
    const engagementRate = post.reach > 0 ? ((post.engagement_count / post.reach) * 100).toFixed(1) : '0.0'

    // Video Retention
    const isVideo = post.media_type === 'VIDEO' || post.media_type === 'REEL'
    const watchTimePercent = (post.video_duration && post.ig_reels_avg_watch_time)
        ? (post.ig_reels_avg_watch_time / post.video_duration) * 100
        : 0
    const retentionColor = watchTimePercent > 60 ? 'bg-green-500' : watchTimePercent < 30 ? 'bg-red-500' : 'bg-yellow-500'

    const badge = getMediaTypeBadge(post.media_type)

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-lg bg-background border-l border-border z-50 
                    transform transition-transform duration-300 ease-out overflow-y-auto
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-muted/80 hover:bg-muted transition-colors z-10"
                >
                    <X className="w-5 h-5 text-muted-foreground" />
                </button>

                {/* ================================ */}
                {/* A. HEADER SECTION */}
                {/* ================================ */}
                <div className="relative">
                    {/* Post Image/Thumbnail */}
                    <div className="aspect-video w-full bg-muted">
                        <img
                            src={post.thumbnail_url || post.media_url}
                            alt="Post thumbnail"
                            className="w-full h-full object-cover"
                        />
                        {isVideo && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <Play className="w-8 h-8 text-white fill-white" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Overlay Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent">
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                                {badge.label}
                            </span>
                            <span className="text-muted-foreground text-sm">
                                {formatTimestamp(post.timestamp)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-6">

                    {/* Caption Preview */}
                    <p className="text-muted-foreground text-sm line-clamp-2">
                        {post.caption}
                    </p>

                    {/* ================================ */}
                    {/* B. PERFORMANCE GRID (4 Cards) */}
                    {/* ================================ */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Reach Card */}
                        <Card className="p-4 bg-card/50 border-border/50">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="w-4 h-4 text-primary" />
                                <span className="text-xs text-muted-foreground uppercase tracking-wide">Reach</span>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{formatNumber(post.reach)}</p>
                            <p className="text-xs text-muted-foreground mt-1">Unique accounts</p>
                        </Card>

                        {/* Impressions Card with Rewatch Rate */}
                        <Card className="p-4 bg-card/50 border-border/50">
                            <div className="flex items-center gap-2 mb-2">
                                <Eye className="w-4 h-4 text-primary" />
                                <span className="text-xs text-muted-foreground uppercase tracking-wide">Impressions</span>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{formatNumber(post.impressions)}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">{rewatchRate.toFixed(1)}x rewatch</span>
                                {isHighRewatch && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-500/20 text-green-400 font-medium">
                                        High Rewatch
                                    </span>
                                )}
                            </div>
                        </Card>

                        {/* Engagement Card with Rate */}
                        <Card className="p-4 bg-card/50 border-border/50">
                            <div className="flex items-center gap-2 mb-2">
                                <Heart className="w-4 h-4 text-primary" />
                                <span className="text-xs text-muted-foreground uppercase tracking-wide">Engagement</span>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{formatNumber(post.engagement_count)}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <TrendingUp className="w-3 h-3 text-green-400" />
                                <span className="text-xs text-green-400 font-medium">{engagementRate}% rate</span>
                            </div>
                        </Card>

                        {/* Saves Card */}
                        <Card className="p-4 bg-card/50 border-border/50">
                            <div className="flex items-center gap-2 mb-2">
                                <Bookmark className="w-4 h-4 text-primary" />
                                <span className="text-xs text-muted-foreground uppercase tracking-wide">Saves</span>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{formatNumber(post.saved_count)}</p>
                            {post.shares_count !== undefined && post.shares_count > 0 && (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <Share2 className="w-3 h-3" />
                                    {formatNumber(post.shares_count)} shares
                                </p>
                            )}
                        </Card>
                    </div>

                    {/* ================================ */}
                    {/* C. RETENTION SECTION (Video Only) */}
                    {/* ================================ */}
                    {isVideo && post.video_duration && post.ig_reels_avg_watch_time && (
                        <Card className="p-4 bg-card/50 border-border/50">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-medium text-foreground">Audience Retention</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {post.ig_reels_avg_watch_time}s / {post.video_duration}s
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${retentionColor} rounded-full transition-all duration-500`}
                                    style={{ width: `${Math.min(watchTimePercent, 100)}%` }}
                                />
                            </div>

                            <div className="flex justify-between mt-2">
                                <span className="text-xs text-muted-foreground">Average Watch Time</span>
                                <span className={`text-xs font-medium ${watchTimePercent > 60 ? 'text-green-400' :
                                    watchTimePercent < 30 ? 'text-red-400' : 'text-yellow-400'
                                    }`}>
                                    {watchTimePercent.toFixed(0)}% retention
                                </span>
                            </div>
                        </Card>
                    )}

                    {/* ================================ */}
                    {/* D. CONVERSATION SECTION */}
                    {/* ================================ */}
                    {post.comments && post.comments.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <MessageCircle className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-foreground">Top Comments</span>
                                <span className="text-xs text-muted-foreground">({post.comments.length})</span>
                            </div>

                            <div className="space-y-2">
                                {post.comments.slice(0, 3).map((comment) => (
                                    <div
                                        key={comment.id}
                                        className={`p-3 bg-muted/30 rounded-lg border-l-4 ${getSentimentColor(comment.sentiment)}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <span className="text-xs text-muted-foreground font-medium">@{comment.username}</span>
                                                <p className="text-sm text-foreground mt-0.5">{comment.text}</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2 text-muted-foreground hover:text-foreground hover:bg-muted"
                                            >
                                                <Reply className="w-3 h-3 mr-1" />
                                                <span className="text-xs">Reply</span>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {post.comments.length > 3 && (
                                <Button
                                    variant="ghost"
                                    className="w-full mt-3 text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                    View all {post.comments.length} comments
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
