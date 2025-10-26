/**
 * Instagram Public Data Scraper
 * 
 * Fetches publicly available Instagram profile data without requiring authentication.
 * Works by parsing Instagram's public profile pages.
 */

export interface ScrapedInstagramProfile {
  username: string
  fullName: string
  bio: string
  profilePicUrl: string
  isVerified: boolean
  isPrivate: boolean
  followersCount: number
  followingCount: number
  postsCount: number
  posts: ScrapedInstagramPost[]
}

export interface ScrapedInstagramPost {
  id: string
  shortcode: string
  imageUrl: string
  caption: string
  likes: number
  comments: number
  timestamp: string
  isVideo: boolean
  videoViews?: number
}

/**
 * Scrape Instagram profile data
 * 
 * @param username - Instagram username (without @)
 * @returns Profile data with recent posts
 */
export async function scrapeInstagramProfile(username: string): Promise<ScrapedInstagramProfile> {
  try {
    // Remove @ if present
    const cleanUsername = username.replace('@', '').trim()
    
    if (!cleanUsername) {
      throw new Error('Username is required')
    }

    // Fetch the profile page
    const url = `https://www.instagram.com/${cleanUsername}/?__a=1&__d=dis`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Instagram profile not found')
      }
      throw new Error('Failed to fetch Instagram profile')
    }

    const data = await response.json()
    
    // Extract user data from the response
    const user = data?.graphql?.user || data?.data?.user
    
    if (!user) {
      throw new Error('Unable to parse Instagram profile data')
    }

    // Extract posts
    const edges = user.edge_owner_to_timeline_media?.edges || []
    const posts: ScrapedInstagramPost[] = edges.slice(0, 12).map((edge: any) => {
      const node = edge.node
      return {
        id: node.id,
        shortcode: node.shortcode,
        imageUrl: node.display_url || node.thumbnail_src,
        caption: node.edge_media_to_caption?.edges[0]?.node?.text || '',
        likes: node.edge_liked_by?.count || 0,
        comments: node.edge_media_to_comment?.count || 0,
        timestamp: new Date(node.taken_at_timestamp * 1000).toISOString(),
        isVideo: node.is_video || false,
        videoViews: node.video_view_count,
      }
    })

    // Build profile object
    const profile: ScrapedInstagramProfile = {
      username: user.username,
      fullName: user.full_name || user.username,
      bio: user.biography || '',
      profilePicUrl: user.profile_pic_url_hd || user.profile_pic_url,
      isVerified: user.is_verified || false,
      isPrivate: user.is_private || false,
      followersCount: user.edge_followed_by?.count || 0,
      followingCount: user.edge_follow?.count || 0,
      postsCount: user.edge_owner_to_timeline_media?.count || 0,
      posts,
    }

    return profile

  } catch (error) {
    console.error('Instagram scraping error:', error)
    throw error
  }
}

/**
 * Validate Instagram username format
 * 
 * @param username - Username to validate
 * @returns Whether username is valid
 */
export function isValidUsername(username: string): boolean {
  const cleanUsername = username.replace('@', '').trim()
  // Instagram usernames: 1-30 chars, alphanumeric, periods, underscores
  const regex = /^[a-zA-Z0-9._]{1,30}$/
  return regex.test(cleanUsername)
}

/**
 * Calculate engagement rate from profile data
 * 
 * @param profile - Scraped profile data
 * @returns Engagement rate percentage
 */
export function calculateEngagementRate(profile: ScrapedInstagramProfile): number {
  if (profile.posts.length === 0 || profile.followersCount === 0) {
    return 0
  }

  const totalEngagement = profile.posts.reduce(
    (sum, post) => sum + post.likes + post.comments,
    0
  )
  
  const avgEngagement = totalEngagement / profile.posts.length
  const engagementRate = (avgEngagement / profile.followersCount) * 100

  return Math.round(engagementRate * 10) / 10 // Round to 1 decimal
}

/**
 * Get average likes per post
 * 
 * @param posts - Array of posts
 * @returns Average likes
 */
export function getAverageLikes(posts: ScrapedInstagramPost[]): number {
  if (posts.length === 0) return 0
  const total = posts.reduce((sum, post) => sum + post.likes, 0)
  return Math.round(total / posts.length)
}

/**
 * Get average comments per post
 * 
 * @param posts - Array of posts
 * @returns Average comments
 */
export function getAverageComments(posts: ScrapedInstagramPost[]): number {
  if (posts.length === 0) return 0
  const total = posts.reduce((sum, post) => sum + post.comments, 0)
  return Math.round(total / posts.length)
}

/**
 * Format large numbers for display
 * 
 * @param num - Number to format
 * @returns Formatted string (e.g., "1.2K", "2.5M")
 */
export function formatCount(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toLocaleString()
}

/**
 * Get relative time string
 * 
 * @param timestamp - ISO timestamp string
 * @returns Relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(timestamp: string): string {
  const now = new Date()
  const past = new Date(timestamp)
  const diffMs = now.getTime() - past.getTime()
  
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  const diffWeeks = Math.floor(diffMs / 604800000)
  const diffMonths = Math.floor(diffMs / 2592000000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffWeeks < 4) return `${diffWeeks}w ago`
  if (diffMonths < 12) return `${diffMonths}mo ago`
  return past.toLocaleDateString()
}

/**
 * Error class for Instagram scraping errors
 */
export class InstagramScraperError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'InstagramScraperError'
  }
}

