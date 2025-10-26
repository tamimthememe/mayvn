import { NextRequest, NextResponse } from 'next/server'
import { scrapeInstagramProfile, isValidUsername } from '@/lib/instagram-scraper'

/**
 * Instagram Profile Scraper API
 * 
 * Fetches public Instagram profile data by username
 * No authentication required - only public data
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username } = body

    console.log('[Instagram Scraper] Fetching profile for:', username)

    // Validate username
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    if (!isValidUsername(username)) {
      return NextResponse.json(
        { error: 'Invalid Instagram username format' },
        { status: 400 }
      )
    }

    // Scrape the profile
    console.log('[Instagram Scraper] Starting scrape...')
    const profile = await scrapeInstagramProfile(username)
    console.log('[Instagram Scraper] Scrape successful! Posts found:', profile.posts.length)

    // Check if profile is private
    if (profile.isPrivate && profile.posts.length === 0) {
      return NextResponse.json(
        { 
          error: 'This account is private',
          profile: {
            username: profile.username,
            fullName: profile.fullName,
            isPrivate: true,
          }
        },
        { status: 403 }
      )
    }

    // Return the scraped data
    return NextResponse.json({
      success: true,
      profile,
    })

  } catch (error: any) {
    console.error('[Instagram Scraper] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })

    // Handle specific errors
    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'Instagram profile not found. Please check the username.' },
        { status: 404 }
      )
    }

    if (error.message?.includes('rate limit') || error.message?.includes('blocking')) {
      return NextResponse.json(
        { error: 'Instagram is currently blocking requests. This is a known limitation. Please try using a third-party service or wait a few minutes.' },
        { status: 429 }
      )
    }

    // Generic error with more details
    return NextResponse.json(
      { 
        error: 'Failed to fetch Instagram profile. Instagram may be blocking scraping requests.',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for quick username checks
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const username = searchParams.get('username')

  if (!username) {
    return NextResponse.json(
      { error: 'Username is required' },
      { status: 400 }
    )
  }

  if (!isValidUsername(username)) {
    return NextResponse.json(
      { valid: false, error: 'Invalid username format' },
      { status: 200 }
    )
  }

  return NextResponse.json({
    valid: true,
    username: username.replace('@', '').trim(),
  })
}

