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
export const INSTAGRAM_ENDPOINTS = {
  AUTHORIZE: 'https://api.instagram.com/oauth/authorize',
  ACCESS_TOKEN: 'https://api.instagram.com/oauth/access_token',
  USER_PROFILE: 'https://graph.instagram.com/me',
  USER_MEDIA: 'https://graph.instagram.com/me/media',
  MEDIA_INSIGHTS: (mediaId: string) => `https://graph.instagram.com/${mediaId}/insights`,
  MEDIA_COMMENTS: (mediaId: string) => `https://graph.instagram.com/${mediaId}/comments`,
}

// Types
export interface InstagramProfile {
  id: string
  username: string
  account_type: 'BUSINESS' | 'CREATOR' | 'PERSONAL'
  media_count: number
}

export interface InstagramMedia {
  id: string
  caption?: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url: string
  permalink: string
  thumbnail_url?: string
  timestamp: string
  username: string
  like_count?: number
  comments_count?: number
}

export interface InstagramComment {
  id: string
  text: string
  username: string
  timestamp: string
  like_count?: number
  replies?: InstagramComment[]
}

export interface InstagramInsights {
  impressions: number
  reach: number
  engagement: number
  saved: number
  video_views?: number
}

/**
 * Generate Instagram OAuth URL
 * 
 * @param scopes - Array of permission scopes
 * @returns Authorization URL
 */
export function getInstagramAuthUrl(scopes: string[] = ['user_profile', 'user_media']): string {
  const params = new URLSearchParams({
    client_id: INSTAGRAM_CONFIG.CLIENT_ID,
    redirect_uri: INSTAGRAM_CONFIG.REDIRECT_URI,
    scope: scopes.join(','),
    response_type: 'code',
  })

  return `${INSTAGRAM_ENDPOINTS.AUTHORIZE}?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 * 
 * @param code - Authorization code from OAuth callback
 * @returns Access token response
 */
export async function getInstagramAccessToken(code: string): Promise<{
  access_token: string
  user_id: string
}> {
  const formData = new FormData()
  formData.append('client_id', INSTAGRAM_CONFIG.CLIENT_ID)
  formData.append('client_secret', INSTAGRAM_CONFIG.CLIENT_SECRET)
  formData.append('grant_type', 'authorization_code')
  formData.append('redirect_uri', INSTAGRAM_CONFIG.REDIRECT_URI)
  formData.append('code', code)

  const response = await fetch(INSTAGRAM_ENDPOINTS.ACCESS_TOKEN, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Failed to get access token')
  }

  return response.json()
}

/**
 * Get Instagram user profile
 * 
 * @param accessToken - User's access token
 * @returns User profile data
 */
export async function getInstagramProfile(accessToken: string): Promise<InstagramProfile> {
  const params = new URLSearchParams({
    fields: 'id,username,account_type,media_count',
    access_token: accessToken,
  })

  const response = await fetch(`${INSTAGRAM_ENDPOINTS.USER_PROFILE}?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to fetch Instagram profile')
  }

  return response.json()
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
  const params = new URLSearchParams({
    fields: 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username',
    access_token: accessToken,
    limit: limit.toString(),
  })

  const response = await fetch(`${INSTAGRAM_ENDPOINTS.USER_MEDIA}?${params.toString()}`)

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

