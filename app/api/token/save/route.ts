import { NextRequest, NextResponse } from 'next/server'
import { saveInstagramAccount } from '@/lib/db'
import { encrypt } from '@/lib/crypto'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId, brandId, accessToken, instagramUserId, appId, appSecret } = body

        if (!userId || !brandId || !accessToken || !instagramUserId) {
            return NextResponse.json(
                { error: 'Missing required fields: userId, brandId, accessToken, and instagramUserId are required' },
                { status: 400 }
            )
        }

        // Encrypt the access token before storing
        let encryptedToken = accessToken
        try {
            encryptedToken = encrypt(accessToken)
        } catch (e) {
            console.warn('[Token Save] Could not encrypt token, storing as-is')
        }

        // Save to database
        // Note: We save as accessTokenEncrypted so db.ts knows to decrypt it
        await saveInstagramAccount(userId, brandId, {
            instagramUserId,
            username: 'Instagram Account', // Will be updated when we fetch profile
            accessTokenEncrypted: encryptedToken,
            connectedAt: new Date(),
            isActive: true,
        })

        // Determine token type (short-lived vs long-lived)
        // Short-lived tokens are typically about 1 hour
        // Long-lived tokens are about 60 days
        let tokenType = 'unknown'
        let expiresInDays = 0

        try {
            // Use token debug endpoint to check expiration
            const debugResponse = await fetch(
                `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${accessToken}`
            )
            if (debugResponse.ok) {
                const debugData = await debugResponse.json()
                if (debugData.data?.expires_at) {
                    const expiresAt = new Date(debugData.data.expires_at * 1000)
                    const now = new Date()
                    expiresInDays = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

                    if (expiresInDays > 30) {
                        tokenType = 'long-lived'
                    } else if (expiresInDays > 0) {
                        tokenType = 'short-lived'
                    }
                }
            }
        } catch (e) {
            console.warn('[Token Save] Could not determine token type')
        }

        return NextResponse.json({
            success: true,
            message: 'Token saved successfully',
            tokenType,
            expiresInDays
        })

    } catch (error) {
        console.error('[Token Save] Error:', error)
        return NextResponse.json(
            { error: 'Failed to save token' },
            { status: 500 }
        )
    }
}
