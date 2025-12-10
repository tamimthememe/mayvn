"use client"

import { useState, useRef, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Sparkles, Trash2, BarChart3, PenSquare, Grid3X3, RefreshCw, Loader2, Play, Heart, MessageCircle } from 'lucide-react'
import { useRayvn, PostData } from '@/contexts/RayvnContext'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import Image from 'next/image'

// Action button configuration
const actionConfig: Record<string, { label: string; icon: React.ReactNode; action: string }> = {
    'VIEW_ANALYTICS': { label: 'View Analytics', icon: <BarChart3 className="w-3 h-3" />, action: 'VIEW_ANALYTICS' },
    'CREATE_POST': { label: 'Create Post', icon: <PenSquare className="w-3 h-3" />, action: 'CREATE_POST' },
    'VIEW_CONTENT': { label: 'View Content', icon: <Grid3X3 className="w-3 h-3" />, action: 'VIEW_CONTENT' },
    'REFRESH_DATA': { label: 'Refresh Data', icon: <RefreshCw className="w-3 h-3" />, action: 'REFRESH_DATA' },
}

// Parse action and post tags from message content
function parseMessage(content: string, posts: PostData[] = []): { text: string; actions: string[]; postIds: string[] } {
    const actionRegex = /\[ACTION:(\w+)\]/g
    const postRegex = /\[POST:(\d+)\]/g
    const actions: string[] = []
    const postIds: string[] = []
    let match

    while ((match = actionRegex.exec(content)) !== null) {
        actions.push(match[1])
    }

    while ((match = postRegex.exec(content)) !== null) {
        postIds.push(match[1])
    }

    // Fallback: Search for post captions if no explicit tags found
    if (postIds.length === 0 && posts.length > 0) {
        posts.forEach(post => {
            if (!post.caption) return
            // Check if the first 10 chars of the caption appear in the message (case-insensitive)
            const cleanCaption = post.caption.replace(/\n/g, ' ').trim().toLowerCase()
            const cleanContent = content.toLowerCase()
            const snippet = cleanCaption.slice(0, 20)

            if (snippet.length >= 5 && cleanContent.includes(snippet)) {
                if (!postIds.includes(post.id)) {
                    postIds.push(post.id)
                }
            }
        })
    }

    let text = content.replace(actionRegex, '').replace(postRegex, '').trim()
    return { text, actions, postIds }
}

// Post thumbnail component
function PostThumbnail({ post, onClick }: { post: PostData; onClick: () => void }) {
    const imageUrl = post.thumbnail_url || post.media_url

    return (
        <button
            onClick={onClick}
            className="group relative w-full aspect-square rounded-lg overflow-hidden border border-[#2a2a2a] hover:border-primary transition-colors"
        >
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={post.caption || 'Post'}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
                    <Play className="w-8 h-8 text-gray-500" />
                </div>
            )}
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                <div className="flex items-center gap-3 text-white text-sm">
                    <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" /> {post.like_count}
                    </span>
                    <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" /> {post.comments_count}
                    </span>
                </div>
                <span className="text-xs text-primary mt-1">Click to view details</span>
            </div>
            {/* Video indicator */}
            {(post.media_type === 'VIDEO' || post.media_type === 'REEL') && (
                <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
                    <Play className="w-3 h-3 text-white fill-white" />
                </div>
            )}
        </button>
    )
}

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    isStreaming?: boolean
}

interface RayvnChatProps {
    triggerButton?: React.ReactNode
}

export function RayvnChat({ triggerButton }: RayvnChatProps) {
    const { isOpen, openChat, closeChat, metricsContext, handleAction, isLoadingMetrics, getPostById, viewPost, posts } = useRayvn()
    const { user } = useAuth()
    const scrollRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hey there! 👋 I'm Rayvn, your social media assistant. I can help you understand your analytics, suggest content strategies, and answer questions about your performance. What would you like to know?",
        },
    ])

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputValue.trim() || isLoading) return

        const userMessage = inputValue.trim()
        setInputValue('')

        // Add user message
        const userMsgId = `user-${Date.now()}`
        const assistantMsgId = `assistant-${Date.now()}`

        setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: userMessage }])
        setIsLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, { role: 'user', content: userMessage }].map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    metricsContext
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || `HTTP ${response.status}`)
            }

            // Add empty assistant message that will be filled by streaming
            setMessages(prev => [...prev, {
                id: assistantMsgId,
                role: 'assistant',
                content: '',
                isStreaming: true
            }])

            // Handle streaming response
            const reader = response.body?.getReader()
            const decoder = new TextDecoder()

            if (reader) {
                let fullContent = ''
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    const chunk = decoder.decode(value, { stream: true })
                    fullContent += chunk

                    // Update assistant message with streamed content
                    setMessages(prev => prev.map(m =>
                        m.id === assistantMsgId
                            ? { ...m, content: fullContent, isStreaming: true }
                            : m
                    ))
                }

                // Mark streaming as complete
                setMessages(prev => prev.map(m =>
                    m.id === assistantMsgId
                        ? { ...m, isStreaming: false }
                        : m
                ))
            }
        } catch (error) {
            console.error('Chat error:', error)
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            setMessages(prev => [...prev, {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: `I'm sorry, I encountered an error: ${errorMessage}. Please make sure the API key is configured correctly.`
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const clearChat = () => {
        setMessages([
            {
                id: 'welcome',
                role: 'assistant',
                content: "Chat cleared! 🔄 How can I help you today?",
            },
        ])
    }

    return (
        <Sheet open={isOpen} onOpenChange={(open) => open ? openChat() : closeChat()}>
            <SheetTrigger asChild>
                {triggerButton || (
                    <Button variant="ghost" size="icon" className="relative">
                        <Sparkles className="w-5 h-5" />
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent
                side="right"
                className="w-full sm:w-[420px] h-full p-0 flex flex-col bg-[#0a0a0a] border-[#2a2a2a] overflow-hidden"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
                {/* Header */}
                <SheetHeader className="p-4 border-b border-[#2a2a2a] flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-primary/30">
                                <Image
                                    src="/Rayvn/rayvn-small.png"
                                    alt="Rayvn"
                                    width={40}
                                    height={40}
                                    className="object-cover"
                                />
                            </div>
                            <div>
                                <SheetTitle className="text-white text-base">Chat with Rayvn</SheetTitle>
                                <p className="text-xs text-gray-500">
                                    {isLoadingMetrics ? 'Loading your data...' : 'Your AI Social Media Assistant'}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={clearChat}
                            className="text-gray-500 hover:text-white"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </SheetHeader>

                {/* Messages */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4" ref={scrollRef}>
                    <div className="space-y-4">
                        {messages.map((message) => {
                            const { text, actions, postIds } = message.role === 'assistant'
                                ? parseMessage(message.content, posts)
                                : { text: message.content, actions: [], postIds: [] }

                            // Get post data for any referenced posts
                            const referencedPosts = postIds
                                .map(id => getPostById(id))
                                .filter((p): p is PostData => p !== undefined)

                            return (
                                <div
                                    key={message.id}
                                    className={cn(
                                        "flex gap-3",
                                        message.role === 'user' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    {message.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            <Image
                                                src="/Rayvn/rayvn-small.png"
                                                alt="Rayvn"
                                                width={32}
                                                height={32}
                                                className="object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className={cn(
                                        "max-w-[80%] space-y-1 flex flex-col",
                                        message.role === 'user' ? "items-end" : "items-start"
                                    )}>
                                        <span className="text-xs text-gray-400 px-1 mb-1">
                                            {message.role === 'user' ? (user?.displayName || 'You') : 'Rayvn'}
                                        </span>
                                        <div
                                            className={cn(
                                                "rounded-2xl px-4 py-2.5 text-sm",
                                                message.role === 'user'
                                                    ? "bg-primary text-white rounded-br-md"
                                                    : "bg-[#1a1a1a] text-gray-200 rounded-bl-md border border-[#2a2a2a]"
                                            )}
                                        >
                                            <p className="whitespace-pre-wrap">
                                                {text}
                                                {message.isStreaming && (
                                                    <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse" />
                                                )}
                                            </p>
                                        </div>

                                        {/* Post thumbnails - show referenced posts */}
                                        {!message.isStreaming && referencedPosts.length > 0 && (
                                            <div className={cn(
                                                "grid gap-2 mt-2",
                                                referencedPosts.length === 1 ? "grid-cols-1 max-w-[200px]" :
                                                    referencedPosts.length === 2 ? "grid-cols-2" : "grid-cols-3"
                                            )}>
                                                {referencedPosts.map(post => (
                                                    <PostThumbnail
                                                        key={post.id}
                                                        post={post}
                                                        onClick={() => viewPost(post.id)}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Action buttons - only show when not streaming */}
                                        {!message.isStreaming && actions.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {actions.map((action) => {
                                                    const config = actionConfig[action]
                                                    if (!config) return null
                                                    return (
                                                        <Button
                                                            key={action}
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 text-xs bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 hover:text-primary"
                                                            onClick={() => handleAction(config.action)}
                                                        >
                                                            {config.icon}
                                                            <span className="ml-1">{config.label}</span>
                                                        </Button>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}

                        {/* Loading indicator - waiting for response to start */}
                        {isLoading && messages[messages.length - 1]?.role === 'user' && (
                            <div className="flex gap-3 justify-start">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    <Image
                                        src="/Rayvn/rayvn-small.png"
                                        alt="Rayvn"
                                        width={32}
                                        height={32}
                                        className="object-cover"
                                    />
                                </div>
                                <div className="bg-[#1a1a1a] rounded-2xl rounded-bl-md border border-[#2a2a2a] px-4 py-3">
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Input */}
                <div className="p-4 border-t border-[#2a2a2a] flex-shrink-0">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <Input
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ask Rayvn anything..."
                            className="flex-1 bg-[#1a1a1a] border-[#2a2a2a] focus:border-primary text-white placeholder:text-gray-500"
                            disabled={isLoading}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={isLoading || !inputValue.trim()}
                            className="bg-primary hover:bg-primary/90"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </Button>
                    </form>
                    <p className="text-[10px] text-gray-600 mt-2 text-center">
                        Rayvn uses AI to provide insights. Always verify important data.
                    </p>
                </div>
            </SheetContent>
        </Sheet>
    )
}
