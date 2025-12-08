import { NextRequest, NextResponse } from 'next/server'
import { saveUserToken, saveInstagramAccount } from '@/lib/db'

/**
 * Save Direct Token API
 * 
 * Allows saving a token generated directly from Meta Developer Console
 * for quick testing without going through OAuth flow.
 * 
 * POST /api/token/save
 */

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId, accessToken, instagramUserId } = body

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            )
        }

        if (!accessToken) {
            return NextResponse.json(
                { error: 'Access token is required' },
                { status: 400 }
            )
        }

        if (!instagramUserId) {
            return NextResponse.json(
                { error: 'Instagram User ID is required' },
                { status: 400 }
            )
        }

        // Save token (will be encrypted by db.ts)
        // Tokens from "Generate token" in Meta console are typically long-lived (60 days)
        await saveUserToken(
            userId,
            instagramUserId,
            accessToken,
            'long_lived',
            5184000 // 60 days in seconds
        )

        // Save basic account info
        await saveInstagramAccount(
            userId,
            instagramUserId,
            'connected_user', // We don't have username from direct token
            'BUSINESS'
        )

        console.log(`[Token API] Saved direct token for user ${userId}`)

        return NextResponse.json({
            success: true,
            message: 'Token saved successfully',
        })

    } catch (error) {
        console.error('[Token API] Error:', error)
        return NextResponse.json(
            { error: 'Failed to save token' },
            { status: 500 }
        )
    }
}
