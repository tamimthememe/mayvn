"use client"

import { useState, useEffect } from "react"
import { Hash, Loader2, AlertCircle, RefreshCw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TagsResponse {
    tags: string[]
    isFallback?: boolean
    note?: string
}

type Category = "Viral" | "Tech" | "Fashion" | "Gym"

const CATEGORIES: Category[] = ["Viral", "Tech", "Fashion", "Gym"]

const CATEGORY_COLORS: Record<Category, string> = {
    Viral: "from-pink-500 to-purple-500",
    Tech: "from-blue-500 to-cyan-500",
    Fashion: "from-rose-500 to-orange-500",
    Gym: "from-green-500 to-emerald-500"
}

const CATEGORY_ICONS: Record<Category, string> = {
    Viral: "🔥",
    Tech: "💻",
    Fashion: "👗",
    Gym: "💪"
}

export function InstaTrends() {
    const [tags, setTags] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isFallback, setIsFallback] = useState(false)
    const [activeCategory, setActiveCategory] = useState<Category>("Viral")

    const fetchTags = async (category: Category) => {
        setLoading(true)
        setError(null)
        setIsFallback(false)

        try {
            const res = await fetch(`/api/insta-trends?keyword=${category.toLowerCase()}`)
            const data: TagsResponse = await res.json()

            if (!res.ok) {
                throw new Error(data.note || "Failed to fetch tags")
            }

            setTags(data.tags || [])
            setIsFallback(data.isFallback || false)
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Something went wrong"
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTags(activeCategory)
    }, [activeCategory])

    const handleCategoryClick = (category: Category) => {
        setActiveCategory(category)
    }

    const handleCopyTag = (tag: string) => {
        navigator.clipboard.writeText(tag)
        // Optional: Add a toast notification here
    }

    return (
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-card/50 p-6 shadow-lg backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30">
                    <Hash className="h-5 w-5 text-pink-500" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-lg bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                        Instagram Trending Tags
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        {isFallback ? "Sample Data" : "Powered by AI"}
                    </p>
                </div>
                {!loading && !error && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fetchTags(activeCategory)}
                        className="h-8 w-8 rounded-lg hover:bg-pink-500/10"
                    >
                        <RefreshCw className="h-4 w-4 text-pink-500" />
                    </Button>
                )}
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
                {CATEGORIES.map((category) => (
                    <button
                        key={category}
                        onClick={() => handleCategoryClick(category)}
                        disabled={loading}
                        className={`
                            relative px-4 py-2 rounded-full font-medium text-sm
                            transition-all duration-300 transform
                            ${activeCategory === category
                                ? `bg-gradient-to-r ${CATEGORY_COLORS[category]} text-white shadow-lg scale-105`
                                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:scale-105"
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed
                            hover:shadow-md
                        `}
                    >
                        <span className="mr-1.5">{CATEGORY_ICONS[category]}</span>
                        {category}
                        {activeCategory === category && (
                            <Sparkles className="inline-block ml-1.5 h-3 w-3 animate-pulse" />
                        )}
                    </button>
                ))}
            </div>

            {/* Fallback Notice */}
            {isFallback && !loading && !error && (
                <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                        Showing sample tags. Connect RapidAPI for live data.
                    </p>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="space-y-3">
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading tags...</span>
                    </div>
                    {/* Skeleton Loader */}
                    <div className="flex flex-wrap gap-2">
                        {[...Array(12)].map((_, i) => (
                            <div
                                key={i}
                                className="h-9 w-24 rounded-full bg-gradient-to-r from-muted/50 to-muted animate-pulse"
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
                    <p className="text-sm font-medium text-foreground mb-1">{error}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchTags(activeCategory)}
                        className="gap-2 mt-3"
                    >
                        <RefreshCw className="h-3 w-3" />
                        Try Again
                    </Button>
                </div>
            )}

            {/* Tags Display */}
            {!loading && !error && tags.length > 0 && (
                <div className="flex flex-wrap gap-2.5">
                    {tags.map((tag, index) => (
                        <button
                            key={index}
                            onClick={() => handleCopyTag(tag)}
                            className={`
                                group relative inline-flex items-center px-4 py-2 rounded-full 
                                text-sm font-semibold
                                bg-gradient-to-r ${CATEGORY_COLORS[activeCategory]}/10
                                border border-transparent
                                hover:border-current hover:shadow-lg
                                transition-all duration-300 transform hover:scale-110
                                cursor-pointer
                            `}
                            style={{
                                animationDelay: `${index * 50}ms`,
                                animation: "fadeInUp 0.5s ease-out forwards"
                            }}
                        >
                            <Hash className={`h-3.5 w-3.5 mr-1 bg-gradient-to-r ${CATEGORY_COLORS[activeCategory]} bg-clip-text text-transparent`} />
                            <span className={`bg-gradient-to-r ${CATEGORY_COLORS[activeCategory]} bg-clip-text text-transparent group-hover:opacity-80`}>
                                {tag.replace('#', '')}
                            </span>

                            {/* Tooltip */}
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                Click to copy
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && tags.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                    No tags available
                </p>
            )}

            {/* Add animation keyframes via inline style */}
            <style jsx>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    )
}
