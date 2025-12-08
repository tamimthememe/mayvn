import { NextRequest, NextResponse } from 'next/server'
import { getInstagramAccount, getBrandInstagramAccounts } from '@/lib/db'

/**
 * Instagram Insights API
 * 
 * Fetches Instagram account info and media insights from the Graph API.
 * 
 * GET /api/instagram/insights?userId=xxx&brandId=xxx - Get account info and media insights
 * GET /api/instagram/insights?userId=xxx&brandId=xxx&instagramUserId=xxx - Get specific account
 */

const GRAPH_API_BASE = 'https://graph.facebook.com/v18.0'

export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get('userId')
        const brandId = request.nextUrl.searchParams.get('brandId')
        const instagramUserIdParam = request.nextUrl.searchParams.get('instagramUserId')

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            )
        }

        if (!brandId) {
            return NextResponse.json(
                { error: 'Brand ID is required' },
                { status: 400 }
            )
        }

        let accessToken: string
        let instagramUserId: string
        let allAccounts: Array<{ instagramUserId: string; username: string; isActive: boolean }> = []

        // Get all accounts for this brand (for the account switcher)
        console.error(`[Instagram Insights] Request for userId: ${userId}, brandId: ${brandId}`)
        const brandAccounts = await getBrandInstagramAccounts(userId, brandId)
        console.error(`[Instagram Insights] Found ${brandAccounts.length} accounts`)
        brandAccounts.forEach(a => console.error(` - Account: ${a.account.instagramUserId}, Active: ${a.account.isActive}`))

        allAccounts = brandAccounts.map(a => ({
            instagramUserId: a.account.instagramUserId,
            username: a.account.username,
            isActive: a.account.isActive && !a.isExpired,
        }))

        if (brandAccounts.length === 0) {
            return NextResponse.json(
                { error: 'Not connected. Please connect your Instagram account.' },
                { status: 401 }
            )
        }

        // If specific account requested, use that; otherwise use first active
        if (instagramUserIdParam) {
            const accountData = await getInstagramAccount(userId, brandId, instagramUserIdParam)
            if (!accountData) {
                return NextResponse.json(
                    { error: 'Instagram account not found' },
                    { status: 404 }
                )
            }
            if (accountData.isExpired) {
                return NextResponse.json(
                    { error: 'Token expired. Please reconnect your Instagram account.' },
                    { status: 401 }
                )
            }
            accessToken = accountData.accessToken
            instagramUserId = accountData.account.instagramUserId
        } else {
            // Use first active account
            const activeAccount = brandAccounts.find(a => a.account.isActive && !a.isExpired)
            if (!activeAccount) {
                return NextResponse.json(
                    { error: 'No active Instagram accounts. Please reconnect.' },
                    { status: 401 }
                )
            }
            accessToken = activeAccount.accessToken
            instagramUserId = activeAccount.account.instagramUserId
        }

        console.log(`[Instagram Insights] Using account ${instagramUserId}, Token length: ${accessToken?.length}, Token prefix: ${accessToken?.substring(0, 5)}...`)

        if (!accessToken) {
            console.error('[Instagram Insights] Access token is missing')
            return NextResponse.json(
                { error: 'Access token is missing. Please reconnect.' },
                { status: 401 }
            )
        }

        // Get account info
        const accountInfo = await getAccountInfo(instagramUserId, accessToken)

        // Get media with insights
        const mediaInsights = await getMediaWithInsights(instagramUserId, accessToken)

        // Calculate totals
        let totalImpressions = 0
        let totalReach = 0
        let totalLikes = 0
        let totalComments = 0
        let totalSaves = 0

        for (const media of mediaInsights) {
            totalImpressions += media.insights?.impressions || 0
            totalReach += media.insights?.reach || 0
            totalLikes += media.like_count || 0
            totalComments += media.comments_count || 0
            totalSaves += media.insights?.saved || 0
        }

        return NextResponse.json({
            success: true,
            account: accountInfo,
            currentInstagramUserId: instagramUserId,
            allAccounts, // For account switcher
            mediaInsights: mediaInsights,
            insights: {
                impressions: totalImpressions,
                reach: totalReach,
                likes: totalLikes,
                comments: totalComments,
                saves: totalSaves,
            }
        })

    } catch (error) {
        console.error('[Instagram Insights API] Error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch insights' },
            { status: 500 }
        )
    }
}

async function getAccountInfo(instagramUserId: string, accessToken: string) {
    const fields = 'id,username,name,biography,profile_picture_url,followers_count,follows_count,media_count,website'
    const url = `${GRAPH_API_BASE}/${instagramUserId}?fields=${fields}&access_token=${accessToken}`

    const response = await fetch(url)

    if (!response.ok) {
        const error = await response.json()
        console.error('[Instagram] Account info error:', error)
        throw new Error(error.error?.message || 'Failed to fetch account info')
    }

    return await response.json()
}

async function getCommentsForMedia(mediaId: string, accessToken: string) {
    const commentsUrl = `${GRAPH_API_BASE}/${mediaId}/comments?fields=id,text,timestamp,from{id,username}&limit=10&access_token=${accessToken}`
    const commentsResponse = await fetch(commentsUrl)

    if (!commentsResponse.ok) {
        return []
    }

    const commentsData = await commentsResponse.json()
    return (commentsData.data || []).map((comment: {
        id: string
        text: string
        timestamp: string
        from?: { id: string; username: string }
    }, index: number) => ({
        id: comment.id,
        text: comment.text,
        username: comment.from?.username || `User ${index + 1}`,
        timestamp: comment.timestamp
    }))
}

async function getMediaWithInsights(instagramUserId: string, accessToken: string, limit: number = 25) {
    // First get the media list
    const mediaFields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count'
    const mediaUrl = `${GRAPH_API_BASE}/${instagramUserId}/media?fields=${mediaFields}&limit=${limit}&access_token=${accessToken}`

    console.log('[Instagram] Fetching media list...')
    const mediaResponse = await fetch(mediaUrl)

    if (!mediaResponse.ok) {
        const error = await mediaResponse.json()
        console.error('[Instagram] Media error:', error)
        throw new Error(error.error?.message || 'Failed to fetch media')
    }

    const mediaData = await mediaResponse.json()
    const mediaList = mediaData.data || []
    console.log(`[Instagram] Found ${mediaList.length} media items`)

    // Fetch insights for each media item
    const mediaWithInsights = await Promise.all(
        mediaList.map(async (media: { id: string; media_type: string; like_count?: number; comments_count?: number;[key: string]: unknown }) => {
            try {
                // For CAROUSEL_ALBUM, insights are limited/deprecated, use estimation
                if (media.media_type === 'CAROUSEL_ALBUM') {
                    console.log(`[Instagram] Skipping insights for CAROUSEL_ALBUM ${media.id} (using estimates)`)
                    const comments = await getCommentsForMedia(media.id, accessToken)
                    return {
                        ...media,
                        insights: {
                            reach: (media.like_count || 0) * 5,
                            impressions: (media.like_count || 0) * 10,
                            saved: Math.floor((media.like_count || 0) * 0.1)
                        },
                        comments
                    }
                }

                // For REEL, VIDEO, and IMAGE - use reach and saved which are most reliable
                // Note: 'impressions' is deprecated for media created after July 2024
                let insightMetrics = 'reach,saved'

                // For reels, we can try to get shares as well
                if (media.media_type === 'REEL') {
                    insightMetrics = 'reach,saved,shares'
                }

                const insightsUrl = `${GRAPH_API_BASE}/${media.id}/insights?metric=${insightMetrics}&access_token=${accessToken}`
                const insightsResponse = await fetch(insightsUrl)

                let insights: {
                    impressions?: number
                    reach?: number
                    saved?: number
                    plays?: number
                    shares?: number
                } = {}

                if (insightsResponse.ok) {
                    const insightsData = await insightsResponse.json()
                    // Parse insights
                    for (const insight of insightsData.data || []) {
                        const metricName = insight.name as keyof typeof insights
                        insights[metricName] = insight.values?.[0]?.value || 0
                    }
                    // Estimate impressions from reach (typically 1.5x reach)
                    if (!insights.impressions && insights.reach) {
                        insights.impressions = Math.floor(insights.reach * 1.5)
                    }
                    console.log(`[Instagram] Media ${media.id} (${media.media_type}) insights:`, insights)
                } else {
                    // Log the error but don't fail - some media may not have insights
                    const errorData = await insightsResponse.json()
                    console.log(`[Instagram] No insights for media ${media.id} (${media.media_type}):`, errorData.error?.message || 'Unknown error')

                    // Fallback: estimate basic metrics from like_count and comments_count
                    insights = {
                        impressions: (media.like_count || 0) * 10,
                        reach: (media.like_count || 0) * 5,
                        saved: Math.floor((media.like_count || 0) * 0.1)
                    }
                }

                // Get comments for this media
                const comments = await getCommentsForMedia(media.id, accessToken)

                return {
                    ...media,
                    insights,
                    comments
                }
            } catch (err) {
                console.error(`[Instagram] Error fetching insights for media ${media.id}:`, err)
                return {
                    ...media,
                    insights: {
                        impressions: (media.like_count || 0) * 10,
                        reach: (media.like_count || 0) * 5,
                        saved: 0
                    },
                    comments: []
                }
            }
        })
    )

    return mediaWithInsights
}
