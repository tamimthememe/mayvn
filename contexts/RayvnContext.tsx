"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useBrand } from '@/contexts/BrandContext'

// Post data structure for chat references
export interface PostData {
    id: string
    media_url: string
    thumbnail_url?: string
    media_type: string
    caption?: string
    like_count: number
    comments_count: number
    reach: number
    engagement: number
}

interface RayvnContextType {
    isOpen: boolean
    openChat: () => void
    closeChat: () => void
    toggleChat: () => void
    metricsContext: string
    setMetricsContext: (context: string) => void
    handleAction: (action: string) => void
    isLoadingMetrics: boolean
    refreshMetrics: () => void
    posts: PostData[]
    getPostById: (id: string) => PostData | undefined
    viewPost: (postId: string) => void
}

const RayvnContext = createContext<RayvnContextType | undefined>(undefined)

export function RayvnProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [metricsContext, setMetricsContext] = useState('')
    const [isLoadingMetrics, setIsLoadingMetrics] = useState(false)
    const [posts, setPosts] = useState<PostData[]>([])
    const router = useRouter()
    const { user } = useAuth()
    const { selectedBrandId } = useBrand()

    const openChat = useCallback(() => setIsOpen(true), [])
    const closeChat = useCallback(() => setIsOpen(false), [])
    const toggleChat = useCallback(() => setIsOpen(prev => !prev), [])

    // Fetch Instagram metrics for Rayvn context
    const fetchMetrics = useCallback(async () => {
        if (!user?.uid || !selectedBrandId) {
            setMetricsContext('No brand selected or user not logged in.')
            return
        }

        setIsLoadingMetrics(true)
        try {
            const res = await fetch(`/api/instagram/insights?userId=${user.uid}&brandId=${selectedBrandId}`)
            const data = await res.json()

            if (!res.ok || data.error) {
                setMetricsContext('Instagram account not connected. Connect your account in settings to get personalized insights.')
                return
            }

            const account = data.account
            const rawPosts = data.mediaInsights || []

            // Store posts for reference
            const processedPosts: PostData[] = rawPosts.map((post: any) => ({
                id: post.id,
                media_url: post.media_url,
                thumbnail_url: post.thumbnail_url,
                media_type: post.media_type,
                caption: post.caption?.slice(0, 100),
                like_count: post.like_count || 0,
                comments_count: post.comments_count || 0,
                reach: post.insights?.reach || 0,
                engagement: (post.like_count || 0) + (post.comments_count || 0) + (post.insights?.saved || 0)
            }))
            setPosts(processedPosts)

            // Calculate totals
            let totalLikes = 0, totalComments = 0, totalSaves = 0, totalShares = 0, totalReach = 0, totalImpressions = 0
            let reelCount = 0, carouselCount = 0, imageCount = 0
            let reelReach = 0, carouselReach = 0, imageReach = 0
            let reelEng = 0, carouselEng = 0, imageEng = 0

            rawPosts.forEach((post: any) => {
                const likes = post.like_count || 0
                const comments = post.comments_count || 0
                const saves = post.insights?.saved || 0
                const shares = post.insights?.shares || 0
                const reach = post.insights?.reach || 0
                const impressions = post.insights?.impressions || 0
                const engagement = likes + comments

                totalLikes += likes
                totalComments += comments
                totalSaves += saves
                totalShares += shares
                totalReach += reach
                totalImpressions += impressions

                if (post.media_type === 'VIDEO' || post.media_type === 'REEL') {
                    reelCount++
                    reelReach += reach
                    reelEng += engagement
                } else if (post.media_type === 'CAROUSEL_ALBUM') {
                    carouselCount++
                    carouselReach += reach
                    carouselEng += engagement
                } else {
                    imageCount++
                    imageReach += reach
                    imageEng += engagement
                }
            })

            const totalEngagement = totalLikes + totalComments
            const engagementRate = totalReach > 0 ? ((totalEngagement / totalReach) * 100).toFixed(2) : '0'

            // Calculate metrics and scores for all posts
            const scoredPosts = rawPosts.map((p: any) => {
                const likes = p.like_count || 0
                const comments = p.comments_count || 0
                const saves = p.insights?.saved || 0
                const shares = p.insights?.shares || 0
                const reach = p.insights?.reach || 0
                const impressions = p.insights?.impressions || 0

                const engagement = likes + comments + saves + shares

                // Weighted Score Calculation
                // Engagement is worth 10 points, Reach is worth 1 point, Impressions worth 0.5
                // This balances high-visibility posts with high-interaction posts
                const score = (engagement * 10) + (reach * 1) + (impressions * 0.5)

                return { ...p, engagement, reach, impressions, score, likes, comments, saves }
            })

            // Sort by Weighted Score (Overall Performance)
            const byScore = [...scoredPosts].sort((a, b) => b.score - a.score)
            const topOverall = byScore.slice(0, 3)
            const bottomOverall = byScore.slice(-3).reverse()

            // Sort by specific metrics
            const byReach = [...scoredPosts].sort((a, b) => b.reach - a.reach).slice(0, 2)
            const byImpressions = [...scoredPosts].sort((a, b) => b.impressions - a.impressions).slice(0, 2)
            const byEngagement = [...scoredPosts].sort((a, b) => b.engagement - a.engagement).slice(0, 2)

            // Format all posts for context (sorted by score)
            const allPostsData = byScore.map((p: any, i: number) => {
                return `${i + 1}. "${p.caption?.slice(0, 50) || 'No caption'}..." | Type: ${p.media_type} | Score: ${Math.round(p.score)} | Eng: ${p.engagement} (L:${p.likes} C:${p.comments} S:${p.saves}) | Reach: ${p.reach} | Imp: ${p.impressions}`
            }).join('\n')

            // Pick "Rayvn's Favorite" (Highest Engagement Rate)
            const favoritePost = [...scoredPosts].sort((a, b) => {
                const rateA = a.reach > 0 ? (a.engagement / a.reach) : 0
                const rateB = b.reach > 0 ? (b.engagement / b.reach) : 0
                return rateB - rateA
            })[0]

            const favReason = favoritePost ? `it has a fantastic engagement rate of ${((favoritePost.engagement / favoritePost.reach) * 100).toFixed(1)}%! Your audience really loved this one.` : ''

            // Include post IDs in the context so Rayvn can reference them with [POST:id]
            const metricsString = `
## User: ${user?.displayName || 'Friend'}
## Instagram Account: @${account?.username || 'Unknown'}
- Followers: ${account?.followers_count?.toLocaleString() || 'N/A'}
- Total Posts: ${account?.media_count || rawPosts.length}

## Overall Performance
- Total Reach: ${totalReach.toLocaleString()}
- Total Impressions: ${totalImpressions.toLocaleString()}
- Total Engagement: ${totalEngagement.toLocaleString()}
- Engagement Rate: ${engagementRate}%

## Rayvn's Personal Favorite 🌟
- Post: "${favoritePost?.caption?.slice(0, 50) || 'No caption'}..."
- Why: ${favReason}

## Top 3 Overall Best Performing Posts (Weighted Score)
${topOverall.map((p: any, i: number) => `${i + 1}. "${p.caption?.slice(0, 50) || 'No caption'}..." | Score: ${Math.round(p.score)} | Reach: ${p.reach} | Eng: ${p.engagement}`).join('\n')}

## Top 2 by Reach (Most Visible)
${byReach.map((p: any, i: number) => `${i + 1}. "${p.caption?.slice(0, 50) || 'No caption'}..." | Reach: ${p.reach}`).join('\n')}

## Top 2 by Engagement (Most Interactive)
${byEngagement.map((p: any, i: number) => `${i + 1}. "${p.caption?.slice(0, 50) || 'No caption'}..." | Eng: ${p.engagement}`).join('\n')}

## Top 2 by Impressions (Most Views)
${byImpressions.map((p: any, i: number) => `${i + 1}. "${p.caption?.slice(0, 50) || 'No caption'}..." | Imp: ${p.impressions}`).join('\n')}

## Bottom 3 Least Performing Posts
${bottomOverall.map((p: any, i: number) => `${i + 1}. "${p.caption?.slice(0, 50) || 'No caption'}..." | Score: ${Math.round(p.score)} | Reach: ${p.reach} | Eng: ${p.engagement}`).join('\n')}

## All Posts Data (Ranked by Overall Score)
${allPostsData}

---
INSTRUCTIONS:
1. NO BOLDING. Do not use **text**.
2. When mentioning a post, simply quote its caption naturally.
3. Do NOT use any special tags like [POST:ID]. Just the caption.
4. BE PERSONAL! Use the user's name (${user?.displayName || 'Friend'}).
5. Feel free to mention "Rayvn's Favorite" if asked what you like best.
`
            console.log('Rayvn Context String:', metricsString)
            setMetricsContext(metricsString)
        } catch (error) {
            console.error('Error fetching metrics for Rayvn:', error)
            setMetricsContext('Unable to fetch Instagram metrics. Please try again later.')
        } finally {
            setIsLoadingMetrics(false)
        }
    }, [user?.uid, selectedBrandId])

    // Auto-fetch metrics when user/brand changes
    useEffect(() => {
        if (user?.uid && selectedBrandId) {
            fetchMetrics()
        }
    }, [user?.uid, selectedBrandId, fetchMetrics])

    const refreshMetrics = useCallback(() => {
        fetchMetrics()
    }, [fetchMetrics])

    const getPostById = useCallback((id: string) => {
        return posts.find(p => p.id === id)
    }, [posts])

    const viewPost = useCallback((postId: string) => {
        closeChat()
        router.push(`/analytics?postId=${postId}`)
    }, [router, closeChat])

    const handleAction = useCallback((action: string) => {
        switch (action) {
            case 'VIEW_ANALYTICS':
                router.push('/analytics')
                closeChat()
                break
            case 'CREATE_POST':
                router.push('/post-generator')
                closeChat()
                break
            case 'VIEW_CONTENT':
                router.push('/analytics?tab=content')
                closeChat()
                break
            case 'REFRESH_DATA':
                refreshMetrics()
                break
            default:
                console.log('Unknown action:', action)
        }
    }, [router, closeChat, refreshMetrics])

    return (
        <RayvnContext.Provider value={{
            isOpen,
            openChat,
            closeChat,
            toggleChat,
            metricsContext,
            setMetricsContext,
            handleAction,
            isLoadingMetrics,
            refreshMetrics,
            posts,
            getPostById,
            viewPost
        }}>
            {children}
        </RayvnContext.Provider>
    )
}

export function useRayvn() {
    const context = useContext(RayvnContext)
    if (context === undefined) {
        throw new Error('useRayvn must be used within a RayvnProvider')
    }
    return context
}
