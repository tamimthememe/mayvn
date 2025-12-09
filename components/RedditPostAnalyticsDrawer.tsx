import { useState, useEffect } from "react"
import { X, MessageSquare, ArrowUpCircle, ExternalLink, Award, TrendingUp, Share2, Loader2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface RedditPostData {
    id: string
    title: string
    subreddit: string
    author: string
    created_utc: number
    score: number
    num_comments: number
    upvote_ratio: number
    url: string
    thumbnail?: string
    permalink: string
    post_hint?: string
    selftext?: string
}

interface RedditComment {
    id: string
    author: string
    body: string
    score: number
    created_utc: number
    replies?: any
}

interface RedditPostAnalyticsDrawerProps {
    isOpen: boolean
    onClose: () => void
    post: RedditPostData | null
}

function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp * 1000)
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

export default function RedditPostAnalyticsDrawer({ isOpen, onClose, post }: RedditPostAnalyticsDrawerProps) {
    const [comments, setComments] = useState<RedditComment[]>([])
    const [isLoadingComments, setIsLoadingComments] = useState(false)

    useEffect(() => {
        if (isOpen && post?.id) {
            fetchComments(post.id)
        } else {
            setComments([])
        }
    }, [isOpen, post?.id])

    const fetchComments = async (postId: string) => {
        setIsLoadingComments(true)
        try {
            const response = await fetch(`https://www.reddit.com/comments/${postId}.json?sort=top&limit=10`)
            const data = await response.json()

            if (Array.isArray(data) && data.length > 1) {
                const commentChildren = data[1].data.children
                const parsedComments = commentChildren
                    .filter((c: any) => c.kind === 't1')
                    .map((c: any) => ({
                        id: c.data.id,
                        author: c.data.author,
                        body: c.data.body,
                        score: c.data.score,
                        created_utc: c.data.created_utc
                    }))
                setComments(parsedComments)
            }
        } catch (error) {
            console.error("Failed to fetch comments:", error)
        } finally {
            setIsLoadingComments(false)
        }
    }

    if (!post) return null

    const hasImage = post.post_hint === 'image' || (post.url && post.url.match(/\.(jpeg|jpg|gif|png)$/));
    const imageUrl = hasImage ? post.url : (post.thumbnail && post.thumbnail.startsWith('http') ? post.thumbnail : null);

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-lg bg-[#0a0a0a] border-l border-[#2a2a2a] z-50 
                    transform transition-transform duration-300 ease-out flex flex-col
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-colors z-10 text-gray-400"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Header Section */}
                    <div className="relative">
                        {imageUrl ? (
                            <div className="aspect-video w-full bg-[#1a1a1a]">
                                <img
                                    src={imageUrl}
                                    alt="Post thumbnail"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="aspect-video w-full bg-[#1a1a1a] flex items-center justify-center p-8">
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-full bg-[#047286]/20 flex items-center justify-center mx-auto mb-4">
                                        <MessageSquare className="w-8 h-8 text-[#047286]" />
                                    </div>
                                    <p className="text-gray-500 text-sm">Text Post</p>
                                </div>
                            </div>
                        )}

                        {/* Overlay Info */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a0a] to-transparent">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#047286]/20 text-[#047286]">
                                    r/{post.subreddit}
                                </span>
                                <span className="text-gray-400 text-sm">
                                    {formatTimestamp(post.created_utc)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-2">{post.title}</h2>
                            {post.selftext && (
                                <p className="text-gray-400 text-sm line-clamp-4">
                                    {post.selftext}
                                </p>
                            )}
                        </div>

                        {/* Performance Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Score Card */}
                            <Card className="p-4 bg-[#141414] border-[#2a2a2a]">
                                <div className="flex items-center gap-2 mb-2">
                                    <ArrowUpCircle className="w-4 h-4 text-[#047286]" />
                                    <span className="text-xs text-gray-400 uppercase tracking-wide">Score</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{formatNumber(post.score)}</p>
                                <p className="text-xs text-gray-500 mt-1">Upvotes - Downvotes</p>
                            </Card>

                            {/* Comments Card */}
                            <Card className="p-4 bg-[#141414] border-[#2a2a2a]">
                                <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="w-4 h-4 text-[#047286]" />
                                    <span className="text-xs text-gray-400 uppercase tracking-wide">Comments</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{formatNumber(post.num_comments)}</p>
                                <p className="text-xs text-gray-500 mt-1">Total discussions</p>
                            </Card>

                            {/* Upvote Ratio */}
                            <Card className="p-4 bg-[#141414] border-[#2a2a2a]">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="w-4 h-4 text-[#047286]" />
                                    <span className="text-xs text-gray-400 uppercase tracking-wide">Upvote Ratio</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{(post.upvote_ratio * 100).toFixed(0)}%</p>
                                <div className="w-full bg-[#2a2a2a] h-1.5 rounded-full mt-2">
                                    <div
                                        className="bg-[#047286] h-1.5 rounded-full"
                                        style={{ width: `${post.upvote_ratio * 100}%` }}
                                    />
                                </div>
                            </Card>

                            {/* Actions */}
                            <Card className="p-4 bg-[#141414] border-[#2a2a2a] flex flex-col justify-center gap-2">
                                <Button variant="outline" size="sm" className="w-full justify-start text-gray-400 hover:text-white border-[#333] hover:bg-[#2a2a2a]" onClick={() => window.open(`https://reddit.com${post.permalink}`, '_blank')}>
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    View on Reddit
                                </Button>
                                <Button variant="outline" size="sm" className="w-full justify-start text-gray-400 hover:text-white border-[#333] hover:bg-[#2a2a2a]">
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Share
                                </Button>
                            </Card>
                        </div>

                        {/* Comments Section */}
                        <div className="pt-6 border-t border-[#2a2a2a]">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-[#047286]" />
                                Top Comments
                            </h3>

                            {isLoadingComments ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-[#047286]" />
                                </div>
                            ) : comments.length > 0 ? (
                                <div className="space-y-4">
                                    {comments.map((comment) => (
                                        <div key={comment.id} className="bg-[#141414] rounded-xl p-4 border border-[#2a2a2a]">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center border border-[#333]">
                                                        <User className="w-3 h-3 text-gray-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-[#047286]">u/{comment.author}</span>
                                                    <span className="text-xs text-gray-500">• {formatTimestamp(comment.created_utc).split('•')[0]}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                                    <ArrowUpCircle className="w-3 h-3" />
                                                    {formatNumber(comment.score)}
                                                </div>
                                            </div>
                                            <div className="pl-8">
                                                {(() => {
                                                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                                                    const parts = comment.body.split(urlRegex);
                                                    return (
                                                        <div className="text-sm text-gray-300 leading-relaxed">
                                                            {parts.map((part, index) => {
                                                                if (part.match(urlRegex)) {
                                                                    // Clean URL (remove trailing punctuation)
                                                                    let cleanUrl = part.replace(/[)\].,;]+$/, '');

                                                                    // Fix Reddit API encoded characters (common in preview links)
                                                                    cleanUrl = cleanUrl.replace(/&amp;/g, '&');

                                                                    const isImage = /\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i.test(cleanUrl) ||
                                                                        cleanUrl.includes('preview.redd.it') ||
                                                                        cleanUrl.includes('i.redd.it') ||
                                                                        cleanUrl.includes('imgur.com');

                                                                    if (isImage) {
                                                                        return (
                                                                            <div key={index} className="block mt-3 mb-3">
                                                                                <div className="rounded-lg overflow-hidden max-w-full md:max-w-[400px] border border-[#2a2a2a] bg-black/20">
                                                                                    <img
                                                                                        src={cleanUrl}
                                                                                        alt="Comment attachment"
                                                                                        className="w-full h-auto object-contain max-h-[400px]"
                                                                                        loading="lazy"
                                                                                        onError={(e) => {
                                                                                            const target = e.currentTarget;
                                                                                            // Try removing query params if it fails first time
                                                                                            if (target.src.includes('?') && !target.dataset.retried) {
                                                                                                target.dataset.retried = 'true';
                                                                                                target.src = target.src.split('?')[0];
                                                                                            } else {
                                                                                                target.style.display = 'none';
                                                                                                target.parentElement!.style.display = 'none';
                                                                                            }
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    }
                                                                    return (
                                                                        <a key={index} href={cleanUrl} target="_blank" rel="noopener noreferrer" className="text-[#0ea5e9] hover:underline break-all">
                                                                            {cleanUrl}
                                                                        </a>
                                                                    );
                                                                }
                                                                return <span key={index}>{part}</span>;
                                                            })}
                                                        </div>
                                                    );
                                                })()}
                                                <div className="flex items-center gap-3 mt-3">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 px-2 text-xs text-gray-500 hover:text-white hover:bg-[#2a2a2a]"
                                                        onClick={() => window.open(`https://www.reddit.com${post.permalink}${comment.id}`, '_blank')}
                                                    >
                                                        <MessageSquare className="w-3 h-3 mr-1.5" />
                                                        Reply on Reddit
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    No comments found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
