import { NextRequest, NextResponse } from 'next/server'
import { getUserToken } from '@/lib/db'

/**
 * Instagram Account API
 * 
 * Fetches account information, posts, and post details from Instagram Graph API.
 * 
 * GET /api/instagram/account?userId=xxx - Get account info
 * GET /api/instagram/account?userId=xxx&posts=true - Get account with posts
 * GET /api/instagram/account?userId=xxx&mediaId=xxx - Get specific post with comments
 */

const GRAPH_API_BASE = 'https://graph.facebook.com/v18.0'

export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get('userId')
        const getPosts = request.nextUrl.searchParams.get('posts') === 'true'
        const mediaId = request.nextUrl.searchParams.get('mediaId')

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            )
        }

        // Get user's token
        const tokenData = await getUserToken(userId)
        if (!tokenData) {
            return NextResponse.json(
                { error: 'Not connected. Please connect your Instagram account.' },
                { status: 401 }
            )
        }

        if (tokenData.isExpired) {
            return NextResponse.json(
                { error: 'Token expired. Please reconnect your Instagram account.' },
                { status: 401 }
            )
        }

        const { accessToken, instagramUserId } = tokenData

        // If mediaId is provided, get that specific post with comments
        if (mediaId) {
            return await getMediaWithComments(mediaId, accessToken)
        }

        // Get account info
        const accountInfo = await getAccountInfo(instagramUserId, accessToken)

        // If posts requested, also get posts
        if (getPosts) {
            const posts = await getAccountPosts(instagramUserId, accessToken)
            return NextResponse.json({
                success: true,
                account: accountInfo,
                posts: posts,
            })
        }

        return NextResponse.json({
            success: true,
            account: accountInfo,
        })

    } catch (error) {
        console.error('[Instagram Account API] Error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch account data' },
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

async function getAccountPosts(instagramUserId: string, accessToken: string, limit: number = 25) {
    const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count'
    const url = `${GRAPH_API_BASE}/${instagramUserId}/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`

    const response = await fetch(url)

    if (!response.ok) {
        const error = await response.json()
        console.error('[Instagram] Posts error:', error)
        throw new Error(error.error?.message || 'Failed to fetch posts')
    }

    const data = await response.json()
    return data.data || []
}

async function getMediaWithComments(mediaId: string, accessToken: string) {
    // Get media details
    const mediaFields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count'
    const mediaUrl = `${GRAPH_API_BASE}/${mediaId}?fields=${mediaFields}&access_token=${accessToken}`

    const mediaResponse = await fetch(mediaUrl)

    if (!mediaResponse.ok) {
        const error = await mediaResponse.json()
        console.error('[Instagram] Media error:', error)
        throw new Error(error.error?.message || 'Failed to fetch media')
    }

    const media = await mediaResponse.json()

    // Get comments with from field (contains user info including username)
    const commentsUrl = `${GRAPH_API_BASE}/${mediaId}/comments?fields=id,text,timestamp,from{id,username},like_count,replies{id,text,timestamp,from{id,username},like_count}&access_token=${accessToken}`


    console.log('[Instagram] Fetching comments...')
    const commentsResponse = await fetch(commentsUrl)

    let comments: Array<{
        id: string
        text: string
        timestamp: string
        username: string
        like_count: number
        replies?: { data: Array<{ id: string; text: string; timestamp: string; username: string }> }
    }> = []

    if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json()
        console.log('[Instagram] Comments count:', commentsData.data?.length || 0)
        console.log('[Instagram] Raw comment data:', JSON.stringify(commentsData.data?.[0], null, 2))


        // Map comments with username from 'from' field
        comments = (commentsData.data || []).map((comment: {
            id: string
            text: string
            timestamp: string
            from?: { id: string; username: string }
            like_count?: number
            replies?: { data: Array<{ id: string; text: string; timestamp: string; from?: { id: string; username: string } }> }
        }, index: number) => ({
            id: comment.id,
            text: comment.text,
            timestamp: comment.timestamp,
            username: comment.from?.username || `User ${index + 1}`,
            like_count: comment.like_count || 0,
            replies: comment.replies ? {
                data: comment.replies.data.map((reply) => ({
                    id: reply.id,
                    text: reply.text,
                    timestamp: reply.timestamp,
                    username: reply.from?.username || 'User'
                }))
            } : undefined
        }))

    } else {
        const errorData = await commentsResponse.json()
        console.error('[Instagram] Comments error:', errorData)
    }

    return NextResponse.json({
        success: true,
        media: media,
        comments: comments,
    })
}
