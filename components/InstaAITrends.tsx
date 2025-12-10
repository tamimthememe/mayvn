"use client"

import { useState, useEffect } from "react"
import { Hash, Loader2, AlertCircle, Sparkles, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { useBrand } from "@/contexts/BrandContext"
import { getBrandById } from "@/lib/userService"

interface TagsResponse {
    tags: string[]
    isFallback?: boolean
    note?: string
}

interface KeywordsResponse {
    keywords: string[]
    rawResponse?: string
    fallback?: boolean
}

// Dynamic gradient colors for AI-generated keywords
const GRADIENT_COLORS = [
    "from-pink-500 to-purple-500",
    "from-blue-500 to-cyan-500",
    "from-rose-500 to-orange-500",
    "from-green-500 to-emerald-500",
    "from-violet-500 to-fuchsia-500"
]

export function InstaAITrends() {
    const { user } = useAuth()
    const { selectedBrandId } = useBrand()
    const [businessOverview, setBusinessOverview] = useState("")
    const [brandName, setBrandName] = useState("")
    const [targetAudience, setTargetAudience] = useState<string[]>([])
    const [brandValues, setBrandValues] = useState<string[]>([])
    const [keywords, setKeywords] = useState<string[]>([])
    const [tags, setTags] = useState<string[]>([])
    const [loadingOverview, setLoadingOverview] = useState(true)
    const [loadingKeywords, setLoadingKeywords] = useState(false)
    const [loadingTags, setLoadingTags] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isFallback, setIsFallback] = useState(false)
    const [activeKeyword, setActiveKeyword] = useState<string | null>(null)
    const [keywordColors, setKeywordColors] = useState<Record<string, string>>({})

    // Fetch business overview from database on mount
    useEffect(() => {
        const fetchBusinessOverview = async () => {
            console.log('[InstaAITrends] Starting fetch, user:', !!user, 'selectedBrandId:', selectedBrandId)

            if (!user || !selectedBrandId) {
                setLoadingOverview(false)
                if (!selectedBrandId) {
                    console.error('[InstaAITrends] No brand selected')
                    setError('No brand selected')
                }
                return
            }

            try {
                console.log('[InstaAITrends] Fetching brand data for:', user.uid, selectedBrandId)

                // Fetch brand data directly using userService (same as profile page)
                const brandData = await getBrandById(user.uid, selectedBrandId)
                console.log('[InstaAITrends] Brand data:', brandData)

                if (!brandData) {
                    throw new Error('Brand not found')
                }

                const overview = brandData.business_overview || ''
                console.log('[InstaAITrends] Business overview found:', !!overview, 'length:', overview.length)

                if (overview) {
                    setBusinessOverview(overview)
                    setBrandName(brandData.brand_name || '')
                    setTargetAudience(brandData.target_audience || [])
                    setBrandValues(brandData.brand_values || [])
                    // Auto-generate keywords
                    generateKeywords(overview, brandData.target_audience, brandData.brand_values)
                } else {
                    console.warn('[InstaAITrends] No business overview in brand data')
                    setError('No business overview found. Please add one in your brand settings.')
                }

            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : "Failed to load business overview"
                console.error('[InstaAITrends] Error:', errorMessage, err)
                setError(errorMessage)
            } finally {
                setLoadingOverview(false)
            }
        }

        fetchBusinessOverview()
    }, [user, selectedBrandId])

    // Generate keywords from business overview
    const generateKeywords = async (overview: string, audience?: string[], values?: string[]) => {
        setLoadingKeywords(true)
        setError(null)
        setKeywords([])
        setTags([])
        setActiveKeyword(null)

        try {
            const res = await fetch('/api/generate-keywords', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessOverview: overview,
                    targetAudience: audience || targetAudience,
                    brandValues: values || brandValues
                })
            })

            const data: KeywordsResponse = await res.json()

            if (!res.ok) {
                throw new Error('Failed to generate keywords')
            }

            const generatedKeywords = data.keywords || []
            setKeywords(generatedKeywords)

            // Assign colors to keywords
            const colors: Record<string, string> = {}
            generatedKeywords.forEach((keyword, index) => {
                colors[keyword] = GRADIENT_COLORS[index % GRADIENT_COLORS.length]
            })
            setKeywordColors(colors)

            // DON'T auto-fetch hashtags - let user review keywords first
            console.log('[InstaAITrends] Keywords generated:', generatedKeywords)

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to generate keywords"
            setError(errorMessage)
        } finally {
            setLoadingKeywords(false)
        }
    }

    // Fetch hashtags for a specific keyword
    const fetchTags = async (keyword: string) => {
        setLoadingTags(true)
        setError(null)
        setIsFallback(false)
        setActiveKeyword(keyword)

        try {
            const res = await fetch(`/api/insta-trends?keyword=${encodeURIComponent(keyword)}`)
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
            setLoadingTags(false)
        }
    }

    const handleCopyTag = (tag: string) => {
        navigator.clipboard.writeText(tag)
        // Optional: Add a toast notification here
    }

    // Loading state while fetching business overview
    if (loadingOverview) {
        return (
            <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-card/50 p-6 shadow-lg backdrop-blur-sm">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
                    <span className="ml-3 text-sm text-muted-foreground">Loading your brand data...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-card/50 p-6 shadow-lg backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30">
                    <Brain className="h-5 w-5 text-pink-500" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-lg bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                        AI-Powered Hashtag Generator
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        {brandName ? `For ${brandName}` : "Powered by TinyLlama"}
                    </p>
                </div>
            </div>

            {/* Loading Keywords State */}
            {loadingKeywords && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
                    <span className="ml-3 text-sm text-muted-foreground">Generating AI keywords...</span>
                </div>
            )}

            {/* AI-Generated Keywords */}
            {!loadingKeywords && keywords.length > 0 && (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-muted-foreground">
                            AI-generated keywords for your brand:
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => generateKeywords(businessOverview)}
                            className="text-xs gap-2"
                        >
                            <Sparkles className="h-3 w-3" />
                            Regenerate
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {keywords.map((keyword, index) => (
                            <div
                                key={keyword}
                                className={`
                                    relative px-4 py-2 rounded-full font-medium text-sm capitalize
                                    bg-gradient-to-r ${keywordColors[keyword]} text-white shadow-md
                                    transition-all duration-300
                                `}
                                style={{
                                    animationDelay: `${index * 100}ms`,
                                    animation: "fadeInUp 0.5s ease-out forwards"
                                }}
                            >
                                {keyword}
                            </div>
                        ))}
                    </div>

                    {/* Generate Hashtags Button */}
                    <div className="flex items-center justify-center mb-6">
                        <Button
                            onClick={() => {
                                if (keywords.length > 0) {
                                    setActiveKeyword(keywords[0])
                                    fetchTags(keywords[0])
                                }
                            }}
                            disabled={loadingTags || keywords.length === 0}
                            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 gap-2"
                        >
                            {loadingTags ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Generating Hashtags...
                                </>
                            ) : (
                                <>
                                    <Hash className="h-4 w-4" />
                                    Generate Hashtags for These Keywords
                                </>
                            )}
                        </Button>
                    </div>
                </>
            )}

            {/* Fallback Notice */}
            {isFallback && !loadingTags && !error && (
                <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                        Showing sample tags. Connect RapidAPI for live data.
                    </p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            {/* Loading Tags State */}
            {loadingTags && (
                <div className="space-y-3">
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading hashtags...</span>
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

            {/* Tags Display */}
            {!loadingTags && !error && tags.length > 0 && activeKeyword && (
                <div className="flex flex-wrap gap-2.5">
                    {tags.map((tag, index) => (
                        <button
                            key={index}
                            onClick={() => handleCopyTag(tag)}
                            className={`
                                group relative inline-flex items-center px-4 py-2 rounded-full 
                                text-sm font-semibold
                                bg-gradient-to-r ${keywordColors[activeKeyword]}/10
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
                            <Hash className={`h-3.5 w-3.5 mr-1 bg-gradient-to-r ${keywordColors[activeKeyword]} bg-clip-text text-transparent`} />
                            <span className={`bg-gradient-to-r ${keywordColors[activeKeyword]} bg-clip-text text-transparent group-hover:opacity-80`}>
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
            {!loadingTags && !error && tags.length === 0 && activeKeyword && (
                <p className="text-sm text-muted-foreground text-center py-8">
                    No tags available for "{activeKeyword}"
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
