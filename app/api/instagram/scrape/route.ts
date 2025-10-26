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
    const profile = await scrapeInstagramProfile(username)

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
    console.error('Instagram scraping error:', error)

    // Handle specific errors
    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'Instagram profile not found. Please check the username.' },
        { status: 404 }
      )
    }

    if (error.message?.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a few minutes.' },
        { status: 429 }
      )
    }

    // Generic error
    return NextResponse.json(
      { error: 'Failed to fetch Instagram profile. Please try again.' },
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

