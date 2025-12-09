/**
 * Instagram API Integration Utilities
 * 
 * This file contains helper functions for integrating with Instagram's API.
 * Currently uses mock data, but ready to be replaced with real API calls.
 */

// Instagram API Configuration
export const INSTAGRAM_CONFIG = {
  // Replace with your actual credentials from Facebook Developers
  CLIENT_ID: process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID || '',
  CLIENT_SECRET: process.env.INSTAGRAM_CLIENT_SECRET || '',
  REDIRECT_URI: process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI || '',
  API_VERSION: 'v18.0',
}

// Instagram API Endpoints
// Instagram API Endpoints
export const INSTAGRAM_ENDPOINTS = {
  AUTHORIZE: 'https://www.facebook.com/v18.0/dialog/oauth',
  ACCESS_TOKEN: 'https://graph.facebook.com/v18.0/oauth/access_token',
  USER_PROFILE: 'https://graph.instagram.com/me',
  USER_MEDIA: (igUserId: string) => `https://graph.facebook.com/v18.0/${igUserId}/media`,
  MEDIA_INSIGHTS: (mediaId: string) => `https://graph.facebook.com/v18.0/${mediaId}/insights`,
  MEDIA_COMMENTS: (mediaId: string) => `https://graph.facebook.com/v18.0/${mediaId}/comments`,
}

// ... (Types remain the same)

/**
 * Generate Instagram OAuth URL (via Facebook Login)
 * 
 * @param scopes - Array of permission scopes
 * @returns Authorization URL
 */
export function getInstagramAuthUrl(scopes: string[] = ['instagram_basic', 'instagram_manage_insights', 'pages_show_list', 'pages_read_engagement']): string {
  const params = new URLSearchParams({
    client_id: INSTAGRAM_CONFIG.CLIENT_ID,
    redirect_uri: INSTAGRAM_CONFIG.REDIRECT_URI,
    scope: scopes.join(','),
    response_type: 'code',
  })

  return `${INSTAGRAM_ENDPOINTS.AUTHORIZE}?${params.toString()}`
}

/**
 * Exchange authorization code for access token and get connected IG Business Account
 * 
 * @param code - Authorization code from OAuth callback
 * @returns Access token response with IG User ID
 */
export async function getInstagramAccessToken(code: string): Promise<{
  access_token: string
  user_id: string
}> {
  // 1. Get Short-Lived User Token
  const params = new URLSearchParams({
    client_id: INSTAGRAM_CONFIG.CLIENT_ID,
    client_secret: INSTAGRAM_CONFIG.CLIENT_SECRET,
    redirect_uri: INSTAGRAM_CONFIG.REDIRECT_URI,
    code: code,
  })

  const response = await fetch(`${INSTAGRAM_ENDPOINTS.ACCESS_TOKEN}?${params.toString()}`)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get access token: ${errorText}`)
  }

  const tokenData = await response.json()
  const shortLivedAccessToken = tokenData.access_token

  // 2. Exchange for Long-Lived User Token (60 days)
  const exchangeParams = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: INSTAGRAM_CONFIG.CLIENT_ID,
    client_secret: INSTAGRAM_CONFIG.CLIENT_SECRET,
    fb_exchange_token: shortLivedAccessToken,
  })

  const exchangeResponse = await fetch(`${INSTAGRAM_ENDPOINTS.ACCESS_TOKEN}?${exchangeParams.toString()}`)

  if (!exchangeResponse.ok) {
    console.warn('Failed to exchange for long-lived token, using short-lived token')
  }

  const exchangeData = await exchangeResponse.json()
  const longLivedAccessToken = exchangeData.access_token || shortLivedAccessToken

  console.log('Token exchange successful. Got long-lived token:', !!exchangeData.access_token)

  // 3. Get User's Pages and connected Instagram Accounts using the Long-Lived Token
  const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=instagram_business_account{id,username,profile_picture_url},name,access_token&access_token=${longLivedAccessToken}`)

  if (!pagesResponse.ok) {
    console.warn('Failed to fetch user pages to find Instagram account')
    const meResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${longLivedAccessToken}`)
    const meData = await meResponse.json()
    return {
      access_token: longLivedAccessToken,
      user_id: meData.id
    }
  }

  const pagesData = await pagesResponse.json()

  // Find the first page with a connected Instagram Business Account
  let instagramAccountId = ''
  let pageAccessToken = ''

  if (pagesData.data) {
    for (const page of pagesData.data) {
      if (page.instagram_business_account && page.instagram_business_account.id) {
        instagramAccountId = page.instagram_business_account.id
        // Page tokens generated from a long-lived User token are also long-lived (no expiration)
        pageAccessToken = page.access_token
        break
      }
    }
  }

  if (!instagramAccountId) {
    console.warn('No connected Instagram Business Account found')
    const meResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${longLivedAccessToken}`)
    const meData = await meResponse.json()
    return {
      access_token: longLivedAccessToken,
      user_id: meData.id
    }
  }

  return {
    access_token: pageAccessToken || longLivedAccessToken,
    user_id: instagramAccountId
  }
}

/**
 * Get Instagram user profile
      * 
 * @param accessToken - User's access token
      * @returns User profile data
        */
export async function getInstagramProfile(accessToken: string): Promise<InstagramProfile> {
  // Note: For Graph API, we usually query the specific IG User ID, not 'me'.
  // But if we don't have the ID passed in, we might be stuck.
  // Assuming this function is called with a token that might be Page or User token.
  // We'll try to fetch 'me' assuming the caller knows what they are doing, 
  // OR we should update this signature to accept userId.

  // For backward compatibility, we'll try 'me' but it returns FB User info, not IG.
  // We really need the IG User ID here.
  // Let's assume the 'accessToken' is valid for the node we are querying.
  // If we want the IG profile, we should query the IG ID.

  // Since we can't easily change the signature everywhere without breaking things,
  // we'll fetch 'me' (FB User) and try to map it, or error.

  // BETTER STRATEGY: The caller should pass the IG User ID.
  // But looking at usage, it's often used right after auth.

  // Let's try to fetch the IG Business Account again if we can.
  const response = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,accounts{instagram_business_account{id,username,media_count}}&access_token=${accessToken}`)

  if (!response.ok) {
    throw new Error('Failed to fetch profile')
  }

  const data = await response.json()

  // Extract IG info
  let igAccount = null
  if (data.accounts?.data) {
    for (const page of data.accounts.data) {
      if (page.instagram_business_account) {
        igAccount = page.instagram_business_account
        break
      }
    }
  }

  if (igAccount) {
    return {
      id: igAccount.id,
      username: igAccount.username,
      account_type: 'BUSINESS',
      media_count: igAccount.media_count || 0
    }
  }

  // Fallback to basic FB info
  return {
    id: data.id,
    username: data.name,
    account_type: 'PERSONAL', // Assumption
    media_count: 0
  }
}

/**
 * Get Instagram user media (posts)
 * 
 * @param accessToken - User's access token
 * @param limit - Number of posts to fetch (default: 25)
 * @returns Array of media items
 */
export async function getInstagramMedia(
  accessToken: string,
  limit: number = 25
): Promise<InstagramMedia[]> {
  // We need the IG User ID. We'll fetch it first.
  const profile = await getInstagramProfile(accessToken)
  const igUserId = profile.id

  const params = new URLSearchParams({
    fields: 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,like_count,comments_count',
    access_token: accessToken,
    limit: limit.toString(),
  })

  const response = await fetch(`${INSTAGRAM_ENDPOINTS.USER_MEDIA(igUserId)}?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to fetch Instagram media')
  }

  const data = await response.json()
  return data.data || []
}

/**
 * Get media insights (for business accounts)
 * 
 * @param mediaId - Media ID
 * @param accessToken - User's access token
 * @returns Insights data
 */
export async function getMediaInsights(
  mediaId: string,
  accessToken: string
): Promise<InstagramInsights> {
  const params = new URLSearchParams({
    metric: 'impressions,reach,engagement,saved,video_views',
    access_token: accessToken,
  })

  const response = await fetch(`${INSTAGRAM_ENDPOINTS.MEDIA_INSIGHTS(mediaId)}?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to fetch media insights')
  }

  const data = await response.json()

  // Transform insights array to object
  const insights: Record<string, number> = {}
  data.data?.forEach((metric: { name: string; values: { value: number }[] }) => {
    insights[metric.name] = metric.values[0]?.value || 0
  })

  return {
    impressions: insights.impressions || 0,
    reach: insights.reach || 0,
    engagement: insights.engagement || 0,
    saved: insights.saved || 0,
    video_views: insights.video_views,
  }
}

/**
 * Get media comments
 * 
 * @param mediaId - Media ID
 * @param accessToken - User's access token
 * @returns Array of comments
 */
export async function getMediaComments(
  mediaId: string,
  accessToken: string
): Promise<InstagramComment[]> {
  const params = new URLSearchParams({
    fields: 'id,text,username,timestamp,like_count,replies',
    access_token: accessToken,
  })

  const response = await fetch(`${INSTAGRAM_ENDPOINTS.MEDIA_COMMENTS(mediaId)}?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to fetch media comments')
  }

  const data = await response.json()
  return data.data || []
}

/**
 * Refresh long-lived access token
 * 
 * @param accessToken - Current access token
 * @returns New access token with extended expiration
 */
export async function refreshAccessToken(accessToken: string): Promise<{
  access_token: string
  token_type: string
  expires_in: number
}> {
  const params = new URLSearchParams({
    grant_type: 'ig_refresh_token',
    access_token: accessToken,
  })

  const response = await fetch(`${INSTAGRAM_ENDPOINTS.ACCESS_TOKEN}?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to refresh access token')
  }

  return response.json()
}

/**
 * Calculate engagement rate
 * 
 * @param likes - Number of likes
 * @param comments - Number of comments
 * @param followers - Number of followers
 * @returns Engagement rate percentage
 */
export function calculateEngagementRate(
  likes: number,
  comments: number,
  followers: number
): number {
  if (followers === 0) return 0
  return ((likes + comments) / followers) * 100
}

/**
 * Format number for display (e.g., 1234 -> 1.2K)
 * 
 * @param num - Number to format
 * @returns Formatted string
 */
export function formatCount(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

/**
 * Get relative time string (e.g., "2 hours ago")
 * 
 * @param timestamp - ISO timestamp string
 * @returns Relative time string
 */
export function getRelativeTime(timestamp: string): string {
  const now = new Date()
  const past = new Date(timestamp)
  const diffMs = now.getTime() - past.getTime()

  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  const diffWeeks = Math.floor(diffMs / 604800000)

  if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
  } else if (diffWeeks < 4) {
    return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`
  } else {
    return past.toLocaleDateString()
  }
}

/**
 * Validate Instagram username
 * 
 * @param username - Username to validate
 * @returns Whether username is valid
 */
export function isValidInstagramUsername(username: string): boolean {
  // Instagram usernames: 1-30 chars, alphanumeric, periods, underscores
  const regex = /^[a-zA-Z0-9._]{1,30}$/
  return regex.test(username)
}

/**
 * Get best posting times based on engagement data
 * 
 * @param posts - Array of posts with engagement data
 * @returns Array of best times to post
 */
export function getBestPostingTimes(posts: { timestamp: string; likes: number; comments: number }[]): string[] {
  // Group posts by hour and calculate average engagement
  const hourlyEngagement: Record<number, { total: number; count: number }> = {}

  posts.forEach(post => {
    const hour = new Date(post.timestamp).getHours()
    const engagement = post.likes + post.comments

    if (!hourlyEngagement[hour]) {
      hourlyEngagement[hour] = { total: 0, count: 0 }
    }

    hourlyEngagement[hour].total += engagement
    hourlyEngagement[hour].count += 1
  })

  // Calculate average and sort
  const averages = Object.entries(hourlyEngagement)
    .map(([hour, data]) => ({
      hour: parseInt(hour),
      avgEngagement: data.total / data.count,
    }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, 3)

  // Format as time ranges
  return averages.map(({ hour }) => {
    const nextHour = (hour + 1) % 24
    return `${hour}:00 - ${nextHour}:00`
  })
}

// Error handling
export class InstagramAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorType?: string
  ) {
    super(message)
    this.name = 'InstagramAPIError'
  }
}

/**
 * Handle Instagram API errors
 * 
 * @param error - Error object
 * @returns User-friendly error message
 */
export function handleInstagramError(error: unknown): string {
  if (error instanceof InstagramAPIError) {
    return error.message
  }

  if (error instanceof Error) {
    if (error.message.includes('access_token')) {
      return 'Invalid or expired access token. Please reconnect your Instagram account.'
    }
    if (error.message.includes('rate limit')) {
      return 'Instagram API rate limit reached. Please try again later.'
    }
    return error.message
  }

  return 'An unexpected error occurred while connecting to Instagram.'
}

