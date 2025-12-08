import { NextRequest, NextResponse } from 'next/server'
import { getBrandInstagramAccounts } from '@/lib/db'
import { createCommentNotification } from '@/lib/notifications'
import { getUserSettings } from '@/lib/settings'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

/**
 * Check for New Comments API
 * 
 * This endpoint polls Instagram for new comments on posts and creates
 * notifications for any new comments found.
 * 
 * It keeps track of the last checked comment ID to avoid duplicate notifications.
 * 
 * POST /api/notifications/check-comments
 * Body: { userId, brandId }
 */

const GRAPH_API_BASE = 'https://graph.facebook.com/v18.0'

interface CommentData {
    id: string
    text: string
    timestamp: string
    from?: {
        id: string
        username: string
    }
    username?: string
}

interface MediaItem {
    id: string
    media_url?: string
    thumbnail_url?: string
    media_type: string
}

// Get or create the last checked state for a brand
async function getLastCheckedState(userId: string, brandId: string): Promise<{
    lastCheckedAt: Date | null
    checkedCommentIds: string[]
}> {
    try {
        const docRef = doc(db, 'users', userId, 'brands', brandId, 'comment_check_state', 'latest')
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
            const data = docSnap.data()
            return {
                lastCheckedAt: data.lastCheckedAt?.toDate() || null,
                checkedCommentIds: data.checkedCommentIds || []
            }
        }
    } catch (error) {
        console.error('[CheckComments] Error getting last checked state:', error)
    }

    return { lastCheckedAt: null, checkedCommentIds: [] }
}

// Update the last checked state
async function updateLastCheckedState(
    userId: string,
    brandId: string,
    checkedCommentIds: string[]
): Promise<void> {
    try {
        const docRef = doc(db, 'users', userId, 'brands', brandId, 'comment_check_state', 'latest')
        await setDoc(docRef, {
            lastCheckedAt: new Date(),
            checkedCommentIds: checkedCommentIds.slice(-500) // Keep last 500 comment IDs to prevent unlimited growth
        })
    } catch (error) {
        console.error('[CheckComments] Error updating last checked state:', error)
    }
}

// Fetch recent media from Instagram
async function fetchRecentMedia(instagramUserId: string, accessToken: string): Promise<MediaItem[]> {
    try {
        const url = `${GRAPH_API_BASE}/${instagramUserId}/media?fields=id,media_url,thumbnail_url,media_type&limit=10&access_token=${accessToken}`
        const response = await fetch(url)
        const data = await response.json()

        if (data.error) {
            console.error('[CheckComments] Error fetching media:', data.error.message)
            return []
        }

        return data.data || []
    } catch (error) {
        console.error('[CheckComments] Error fetching media:', error)
        return []
    }
}

// Fetch comments for a media item
async function fetchComments(mediaId: string, accessToken: string): Promise<CommentData[]> {
    try {
        const url = `${GRAPH_API_BASE}/${mediaId}/comments?fields=id,text,timestamp,from{id,username},username&limit=50&access_token=${accessToken}`
        const response = await fetch(url)
        const data = await response.json()

        if (data.error) {
            console.error('[CheckComments] Error fetching comments:', data.error.message)
            return []
        }

        return data.data || []
    } catch (error) {
        console.error('[CheckComments] Error fetching comments:', error)
        return []
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId, brandId } = body

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        if (!brandId) {
            return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 })
        }

        // Get Instagram accounts for this brand
        const accounts = await getBrandInstagramAccounts(userId, brandId)

        if (accounts.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No Instagram accounts connected',
                newCommentsCount: 0
            })
        }

        // Check user settings
        const settings = await getUserSettings(userId)
        if (!settings.notifications.comments) {
            console.log(`[CheckComments] Comment notifications disabled for user ${userId}`)
            return NextResponse.json({
                success: true,
                message: 'Comment notifications disabled',
                newCommentsCount: 0
            })
        }

        // Get brand name
        let brandName = 'your brand'
        try {
            const brandDocRef = doc(db, 'users', userId, 'brands', brandId)
            const brandDocSnap = await getDoc(brandDocRef)
            if (brandDocSnap.exists()) {
                brandName = brandDocSnap.data().brand_name || 'your brand'
            }
        } catch (error) {
            console.error('[CheckComments] Error getting brand name:', error)
        }

        // Get last checked state
        const { checkedCommentIds } = await getLastCheckedState(userId, brandId)
        const checkedSet = new Set(checkedCommentIds)

        let totalNewComments = 0
        const newCheckedIds: string[] = [...checkedCommentIds]

        // Check each connected account
        for (const accountData of accounts) {
            if (accountData.isExpired) continue

            const { accessToken, account } = accountData
            const instagramUserId = account.instagramUserId

            console.log(`[CheckComments] Checking comments for account @${account.username}`)

            // Get recent media
            const mediaItems = await fetchRecentMedia(instagramUserId, accessToken)

            for (const media of mediaItems) {
                // Get comments for this media
                const comments = await fetchComments(media.id, accessToken)

                for (const comment of comments) {
                    // Skip if already processed
                    if (checkedSet.has(comment.id)) continue

                    // Get username from either from.username or direct username field
                    const commenterUsername = comment.from?.username || comment.username || 'someone'

                    // Create notification for new comment
                    await createCommentNotification(
                        userId,
                        brandId,
                        brandName,
                        media.id,
                        comment.id,
                        commenterUsername,
                        comment.text,
                        media.media_url || media.thumbnail_url
                    )

                    // Mark as processed
                    checkedSet.add(comment.id)
                    newCheckedIds.push(comment.id)
                    totalNewComments++

                    console.log(`[CheckComments] New comment from @${commenterUsername}: "${comment.text.substring(0, 50)}..."`)
                }
            }
        }

        // Update checked state
        await updateLastCheckedState(userId, brandId, newCheckedIds)

        console.log(`[CheckComments] Found ${totalNewComments} new comments for brand ${brandId}`)

        return NextResponse.json({
            success: true,
            newCommentsCount: totalNewComments,
            message: totalNewComments > 0
                ? `Found ${totalNewComments} new comment${totalNewComments > 1 ? 's' : ''}`
                : 'No new comments'
        })

    } catch (error) {
        console.error('[CheckComments] Error:', error)
        return NextResponse.json(
            { error: 'Failed to check for new comments' },
            { status: 500 }
        )
    }
}
