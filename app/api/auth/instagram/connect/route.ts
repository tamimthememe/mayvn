import { NextRequest, NextResponse } from 'next/server'
import { getInstagramAuthUrl } from '@/lib/instagram'

/**
 * Instagram OAuth Connection Initiator
 * 
 * This route initiates the Instagram OAuth flow by redirecting users
 * to Instagram's authorization page.
 * 
 * Usage:
 * - Call this endpoint when user clicks "Connect Instagram"
 * - User will be redirected to Instagram to grant permissions
 * - After granting, Instagram redirects to callback route
 */

export async function GET(request: NextRequest) {
  try {
    // Optional: Validate user session here
    // const session = await getSession(request)
    // if (!session) {
    //   return NextResponse.redirect(new URL('/login', request.url))
    // }

    // Define the Instagram permissions (scopes) you need
    const scopes = [
      'user_profile',      // Access to user's profile info
      'user_media',        // Access to user's media (posts)
    ]

    // For Business/Creator accounts, you can request additional scopes:
    // 'instagram_business_basic'
    // 'instagram_business_manage_messages'
    // 'instagram_business_manage_comments'
    // 'instagram_business_content_publish'

    // Generate the Instagram authorization URL
    const authUrl = getInstagramAuthUrl(scopes)

    // Optional: Store state parameter for CSRF protection
    // const state = generateRandomState()
    // await saveOAuthState(userId, state)
    // authUrl += `&state=${state}`

    // Redirect user to Instagram authorization page
    return NextResponse.redirect(authUrl)

  } catch (error) {
    console.error('Instagram connect error:', error)

    // Redirect back to connect page with error
    return NextResponse.redirect(
      new URL(
        '/dashboard/connectinstagram?error=Failed to initiate Instagram connection',
        request.url
      )
    )
  }
}

/**
 * Handle POST requests for programmatic connection
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    // Validate user ID
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Generate auth URL
    const scopes = ['user_profile', 'user_media']
    const authUrl = getInstagramAuthUrl(scopes)

    // Return URL for client-side redirect
    return NextResponse.json({
      authUrl,
      message: 'Instagram authorization URL generated',
    })

  } catch (error) {
    console.error('Instagram connect POST error:', error)
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    )
  }
}

