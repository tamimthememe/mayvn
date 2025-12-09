import { NextRequest, NextResponse } from 'next/server'
import { getActiveBrandInstagramAccount } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get('userId')
        const brandId = request.nextUrl.searchParams.get('brandId')

        if (!userId || !brandId) {
            return NextResponse.json({ error: 'Missing userId or brandId' }, { status: 400 })
        }

        const accountData = await getActiveBrandInstagramAccount(userId, brandId)
        if (!accountData) {
            return NextResponse.json({ error: 'No active Instagram account found in DB' }, { status: 404 })
        }

        const { accessToken, account } = accountData
        const instagramUserId = account.instagramUserId

        const diagnostics: any = {
            account: {
                instagramUserId,
                username: account.username,
                hasToken: !!accessToken
            },
            checks: {}
        }

        // 1. Check Token Validity & Scopes
        try {
            // We use the token itself to debug itself (works for Graph API)
            const debugResponse = await fetch(`https://graph.facebook.com/v18.0/debug_token?input_token=${accessToken}&access_token=${accessToken}`)
            const debugData = await debugResponse.json()
            diagnostics.checks.token = {
                valid: debugData.data?.is_valid,
                scopes: debugData.data?.scopes,
                expires_at: debugData.data?.expires_at,
                error: debugData.error
            }
        } catch (e: any) {
            diagnostics.checks.token = { error: e.message }
        }

        // 2. Check Instagram Business Account Link
        try {
            const meResponse = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,accounts{instagram_business_account,name}&access_token=${accessToken}`)
            const meData = await meResponse.json()
            diagnostics.checks.facebook_user = {
                id: meData.id,
                name: meData.name,
                pages_count: meData.accounts?.data?.length || 0,
                connected_ig_account: meData.accounts?.data?.find((p: any) => p.instagram_business_account)?.instagram_business_account
            }
        } catch (e: any) {
            diagnostics.checks.facebook_user = { error: e.message }
        }

        // 3. Check Conversations (DMs) Access
        try {
            const convResponse = await fetch(`https://graph.facebook.com/v18.0/${instagramUserId}/conversations?platform=instagram&limit=1&access_token=${accessToken}`)
            const convData = await convResponse.json()
            diagnostics.checks.conversations = {
                success: convResponse.ok,
                data_count: convData.data?.length,
                error: convData.error
            }
        } catch (e: any) {
            diagnostics.checks.conversations = { error: e.message }
        }

        // 4. Check Media Access
        try {
            const mediaResponse = await fetch(`https://graph.facebook.com/v18.0/${instagramUserId}/media?limit=1&access_token=${accessToken}`)
            const mediaData = await mediaResponse.json()
            diagnostics.checks.media = {
                success: mediaResponse.ok,
                data_count: mediaData.data?.length,
                error: mediaData.error
            }
        } catch (e: any) {
            diagnostics.checks.media = { error: e.message }
        }

        return NextResponse.json(diagnostics, { status: 200 })

    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 })
    }
}
