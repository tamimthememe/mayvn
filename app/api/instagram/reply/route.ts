import { NextRequest, NextResponse } from 'next/server'
import { getInstagramAccount, getBrandInstagramAccounts } from '@/lib/db'

const GRAPH_API_BASE = 'https://graph.facebook.com/v18.0'

/**
 * POST /api/instagram/reply
 * Reply to a comment on Instagram
 * 
 * Body: { userId, brandId, commentId, message }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId, brandId, commentId, message, instagramUserId } = body

        if (!userId || !brandId || !commentId || !message) {
            return NextResponse.json(
                { error: 'userId, brandId, commentId, and message are required' },
                { status: 400 }
            )
        }

        // Get the access token - either from specific account or first active account
        let accountData = null

        if (instagramUserId) {
            accountData = await getInstagramAccount(userId, brandId, instagramUserId)
        } else {
            // Get the first active account for this brand
            const accounts = await getBrandInstagramAccounts(userId, brandId)
            if (accounts.length > 0) {
                const activeAccount = accounts.find(a => a.account.isActive && !a.isExpired) || accounts[0]
                accountData = activeAccount.account
            }
        }

        if (!accountData) {
            return NextResponse.json(
                { error: 'Instagram account not connected' },
                { status: 401 }
            )
        }

        const { accessToken } = accountData

        // Post reply to the comment
        const replyUrl = `${GRAPH_API_BASE}/${commentId}/replies`
        const response = await fetch(replyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                access_token: accessToken
            })
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('[Instagram Reply] Error:', data)
            return NextResponse.json(
                { error: data.error?.message || 'Failed to post reply' },
                { status: response.status }
            )
        }

        console.log('[Instagram Reply] Success:', data)
        return NextResponse.json({
            success: true,
            replyId: data.id,
            message: 'Reply posted successfully'
        })

    } catch (error) {
        console.error('[Instagram Reply] Error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to post reply' },
            { status: 500 }
        )
    }
}
