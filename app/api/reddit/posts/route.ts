import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get('userId')
        const brandId = request.nextUrl.searchParams.get('brandId')

        if (!userId || !brandId) {
            return NextResponse.json({ error: 'userId and brandId required' }, { status: 400 })
        }

        // Get the brand document to find the connected Reddit username
        const brandRef = doc(db, 'users', userId, 'brands', brandId)
        const brandSnap = await getDoc(brandRef)

        if (!brandSnap.exists()) {
            return NextResponse.json({ posts: [] })
        }

        const brandData = brandSnap.data()
        const redditUsername = brandData.redditUsername || brandData.reddit_username

        if (!redditUsername) {
            return NextResponse.json({ posts: [] })
        }

        // Fetch posts from Reddit
        const postsRes = await fetch(
            `https://www.reddit.com/user/${redditUsername}/submitted.json?limit=25`,
            {
                headers: { 'User-Agent': 'Mayvn/1.0.0 (Dashboard)' }
            }
        )

        if (!postsRes.ok) {
            console.error('[Reddit Posts] Failed to fetch:', postsRes.statusText)
            return NextResponse.json({ posts: [] })
        }

        const postsData = await postsRes.json()

        // Transform the posts into a simpler format
        const posts = (postsData.data?.children || []).map((child: any) => {
            const post = child.data
            return {
                id: post.id,
                title: post.title,
                selftext: post.selftext,
                score: post.score,
                num_comments: post.num_comments,
                created_utc: post.created_utc,
                subreddit: post.subreddit,
                url: `https://reddit.com${post.permalink}`,
                thumbnail: post.thumbnail && post.thumbnail !== 'self' && post.thumbnail !== 'default'
                    ? post.thumbnail
                    : null,
                preview: post.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&') || null
            }
        })

        return NextResponse.json({ posts })

    } catch (error) {
        console.error('[Reddit Posts] Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
