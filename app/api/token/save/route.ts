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

        // Determine token expiration and type
        let tokenExpiresAt: number | undefined
        let tokenType = 'unknown'
        let expiresInDays = 0

        try {
            // Use token debug endpoint to check expiration
            const debugResponse = await fetch(
                `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${accessToken}`
            )
            if (debugResponse.ok) {
                const debugData = await debugResponse.json()
                console.log('[Token Save] Debug data:', debugData)

                if (debugData.data?.expires_at) {
                    // expires_at is in seconds, convert to milliseconds
                    tokenExpiresAt = debugData.data.expires_at * 1000
                    const expiresAtDate = new Date(tokenExpiresAt)
                    const now = new Date()
                    expiresInDays = Math.ceil((expiresAtDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

                    console.log('[Token Save] Token expires at:', expiresAtDate.toISOString())
                    console.log('[Token Save] Expires in days:', expiresInDays)

                    if (expiresInDays > 30) {
                        tokenType = 'long-lived'
                    } else if (expiresInDays > 0) {
                        tokenType = 'short-lived'
                    }
                } else if (debugData.data?.data_access_expires_at) {
                    // For page tokens, use data_access_expires_at
                    tokenExpiresAt = debugData.data.data_access_expires_at * 1000
                    tokenType = 'page-token'
                    const expiresAtDate = new Date(tokenExpiresAt)
                    const now = new Date()
                    expiresInDays = Math.ceil((expiresAtDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    console.log('[Token Save] Page token expires at:', expiresAtDate.toISOString())
                } else {
                    // No expiration means it's a never-expiring page token
                    console.log('[Token Save] Token has no expiration (page token)')
                    tokenType = 'page-token-permanent'
                    // Set expiration to 60 days from now as a safety measure
                    tokenExpiresAt = Date.now() + (60 * 24 * 60 * 60 * 1000)
                }
            }
        } catch (e) {
            console.warn('[Token Save] Could not determine token type:', e)
            // Default to 60 days if we can't determine
            tokenExpiresAt = Date.now() + (60 * 24 * 60 * 60 * 1000)
        }

        // Save to database with expiration
        await saveInstagramAccount(userId, brandId, {
            instagramUserId,
            username: 'Instagram Account', // Will be updated when we fetch profile
            accessTokenEncrypted: encryptedToken,
            tokenExpiresAt: tokenExpiresAt,
            connectedAt: new Date(),
            isActive: true,
        })

        return NextResponse.json({
            success: true,
            message: 'Token saved successfully',
            tokenType,
            expiresInDays,
            expiresAt: tokenExpiresAt ? new Date(tokenExpiresAt).toISOString() : undefined
        })

    } catch (error) {
        console.error('[Token Save] Error:', error)
        return NextResponse.json(
            { error: 'Failed to save token' },
            { status: 500 }
        )
    }
}
