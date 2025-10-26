import { NextRequest, NextResponse } from 'next/server'
import { getInstagramAccessToken } from '@/lib/instagram'

/**
 * Instagram OAuth Callback Handler
 * 
 * This route handles the OAuth callback from Instagram after user authorization.
 * 
 * Flow:
 * 1. User clicks "Connect Instagram" button
 * 2. Redirected to Instagram authorization page
 * 3. User grants permissions
 * 4. Instagram redirects here with authorization code
 * 5. Exchange code for access token
 * 6. Store token and redirect to dashboard
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorReason = searchParams.get('error_reason')
    const errorDescription = searchParams.get('error_description')

    // Handle authorization errors
    if (error) {
      console.error('Instagram authorization error:', {
        error,
        errorReason,
        errorDescription,
      })

      // Redirect back to connect page with error
      return NextResponse.redirect(
        new URL(
          `/dashboard/connectinstagram?error=${encodeURIComponent(errorDescription || 'Authorization failed')}`,
          request.url
        )
      )
    }

    // Validate authorization code
    if (!code) {
      return NextResponse.redirect(
        new URL(
          '/dashboard/connectinstagram?error=No authorization code received',
          request.url
        )
      )
    }

    // Exchange code for access token
    const tokenResponse = await getInstagramAccessToken(code)
    
    if (!tokenResponse.access_token) {
      throw new Error('No access token received from Instagram')
    }

    // TODO: Store the access token securely
    // Options:
    // 1. Store in database (recommended for production)
    // 2. Store in HTTP-only cookie (short-term)
    // 3. Store in session storage (less secure)
    
    // For now, we'll pass it as a URL parameter (NOT RECOMMENDED FOR PRODUCTION)
    // In production, you should:
    // - Store in database associated with user ID
    // - Encrypt the token
    // - Set up token refresh mechanism

    /*
    // Example: Store in database (pseudocode)
    await saveUserInstagramToken({
      userId: getCurrentUserId(), // Get from session/auth
      accessToken: tokenResponse.access_token,
      instagramUserId: tokenResponse.user_id,
      connectedAt: new Date(),
    })
    */

    // Redirect to connect page with success
    const redirectUrl = new URL('/dashboard/connectinstagram', request.url)
    redirectUrl.searchParams.set('success', 'true')
    redirectUrl.searchParams.set('instagram_user_id', tokenResponse.user_id)
    
    // In production, DO NOT pass the token in URL!
    // This is only for demo purposes
    // redirectUrl.searchParams.set('access_token', tokenResponse.access_token)

    return NextResponse.redirect(redirectUrl)

  } catch (error) {
    console.error('Instagram callback error:', error)

    // Redirect back with error
    return NextResponse.redirect(
      new URL(
        `/dashboard/connectinstagram?error=${encodeURIComponent('Failed to connect Instagram account')}`,
        request.url
      )
    )
  }
}

/**
 * Handle POST requests (if needed for token refresh)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refresh_token } = body

    if (!refresh_token) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      )
    }

    // TODO: Implement token refresh logic
    // Use the refreshAccessToken function from @/lib/instagram

    return NextResponse.json({
      message: 'Token refresh not yet implemented',
    })

  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    )
  }
}

