import { NextRequest, NextResponse } from 'next/server'

// Set this to a secret string of your choice
const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || 'mayvn_instagram_webhook_token'

/**
 * Instagram Webhook Handler
 * 
 * GET: Webhook verification (called by Meta when you set up the webhook)
 * POST: Receive incoming events (messages, reactions, etc.)
 */

// Webhook Verification (GET request from Meta)
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    console.log('[Instagram Webhook] Verification request received:', { mode, token, challenge })

    // Check if mode and token are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[Instagram Webhook] Verification successful!')
        // Return the challenge to complete verification
        return new NextResponse(challenge, { status: 200 })
    } else {
        console.error('[Instagram Webhook] Verification failed - token mismatch')
        return new NextResponse('Forbidden', { status: 403 })
    }
}

// Receive Incoming Events (POST request from Meta)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        console.log('[Instagram Webhook] Event received:', JSON.stringify(body, null, 2))

        // Process the webhook event
        // The structure is: body.entry[].messaging[] for messages
        if (body.object === 'instagram') {
            body.entry?.forEach((entry: any) => {
                entry.messaging?.forEach((event: any) => {
                    if (event.message) {
                        console.log('[Instagram Webhook] New message from:', event.sender?.id)
                        console.log('[Instagram Webhook] Message:', event.message.text)
                        // TODO: Store message in database, trigger notifications, etc.
                    }
                    if (event.reaction) {
                        console.log('[Instagram Webhook] Reaction received:', event.reaction)
                    }
                })
            })
        }

        // Always return 200 OK to acknowledge receipt
        return NextResponse.json({ status: 'ok' }, { status: 200 })

    } catch (error) {
        console.error('[Instagram Webhook] Error processing event:', error)
        // Still return 200 to prevent Meta from retrying
        return NextResponse.json({ status: 'error' }, { status: 200 })
    }
}
