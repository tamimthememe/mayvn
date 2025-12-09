import { NextRequest, NextResponse } from 'next/server'
import { getActiveBrandInstagramAccount } from '@/lib/db'

const GRAPH_API_BASE = 'https://graph.facebook.com/v18.0'
const INSTAGRAM_API_BASE = 'https://graph.instagram.com'

export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get('userId')
        const brandId = request.nextUrl.searchParams.get('brandId')

        if (!userId || !brandId) {
            return NextResponse.json(
                { error: 'User ID and Brand ID are required' },
                { status: 400 }
            )
        }

        const accountData = await getActiveBrandInstagramAccount(userId, brandId)
        if (!accountData) {
            return NextResponse.json({ items: [] })
        }

        const { accessToken, account } = accountData
        const instagramUserId = account.instagramUserId

        const items: any[] = []

        // 1. Fetch Comments from recent media
        try {
            const mediaUrl = GRAPH_API_BASE + '/' + instagramUserId + '/media?fields=id,caption,permalink,timestamp,comments.limit(5){id,text,username,timestamp,replies}&limit=10&access_token=' + accessToken
            const mediaResponse = await fetch(mediaUrl)

            if (mediaResponse.ok) {
                const mediaData = await mediaResponse.json()
                if (mediaData.data) {
                    for (const media of mediaData.data) {
                        if (media.comments && media.comments.data) {
                            for (const comment of media.comments.data) {
                                items.push({
                                    id: comment.id,
                                    type: 'comment',
                                    author: comment.username || 'Unknown',
                                    content: comment.text,
                                    timestamp: comment.timestamp,
                                    platform: 'Instagram',
                                    sentiment: 'neutral',
                                    permalink: media.permalink,
                                    mediaId: media.id
                                })
                            }
                        }
                    }
                }
            } else {
                console.error('[Instagram Engagement] Failed to fetch media:', await mediaResponse.text())
            }
        } catch (e) {
            console.error('[Instagram Engagement] Error fetching comments:', e)
        }

        // 2. Fetch DMs (Conversations)
        try {
            console.log('[Instagram Engagement] Fetching conversations for ' + instagramUserId + '...')

            let convUrl = INSTAGRAM_API_BASE + '/' + instagramUserId + '/conversations?platform=instagram&fields=id,updated_time,messages.limit(1){id,message,from,created_time}&limit=10&access_token=' + accessToken
            console.log('[Instagram Engagement] Trying graph.instagram.com...')
            let convResponse = await fetch(convUrl)

            if (!convResponse.ok) {
                const err1 = await convResponse.text()
                console.log('[Instagram Engagement] graph.instagram.com failed:', err1)
                console.log('[Instagram Engagement] Trying graph.facebook.com...')
                convUrl = GRAPH_API_BASE + '/' + instagramUserId + '/conversations?platform=instagram&fields=id,updated_time,messages.limit(1){id,message,from,created_time}&limit=10&access_token=' + accessToken
                convResponse = await fetch(convUrl)
            }

            if (convResponse.ok) {
                const convData = await convResponse.json()
                console.log('[Instagram Engagement] Conversations data:', JSON.stringify(convData, null, 2))

                if (convData.data) {
                    for (const conv of convData.data) {
                        const lastMsg = conv.messages && conv.messages.data && conv.messages.data[0]
                        if (lastMsg) {
                            items.push({
                                id: conv.id,
                                type: 'message',
                                author: lastMsg.from && lastMsg.from.username ? lastMsg.from.username : 'Unknown',
                                content: lastMsg.message,
                                timestamp: lastMsg.created_time,
                                platform: 'Instagram',
                                sentiment: 'neutral',
                                permalink: null
                            })
                        }
                    }
                }
            } else {
                const errText = await convResponse.text()
                console.warn('[Instagram Engagement] Failed to fetch conversations:', errText)
            }
        } catch (e) {
            console.error('[Instagram Engagement] Error fetching conversations:', e)
        }

        items.sort(function (a, b) {
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        })

        return NextResponse.json({ items: items })

    } catch (error) {
        console.error('[Instagram Engagement] Internal error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
