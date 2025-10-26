/**
 * Instagram Utilities (Client-Safe)
 * 
 * These functions can be used in both client and server components
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
 * Calculate engagement rate from profile data
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

  return Math.round(engagementRate * 10) / 10
}

/**
 * Get average likes per post
 */
export function getAverageLikes(posts: ScrapedInstagramPost[]): number {
  if (posts.length === 0) return 0
  const total = posts.reduce((sum, post) => sum + post.likes, 0)
  return Math.round(total / posts.length)
}

/**
 * Get average comments per post
 */
export function getAverageComments(posts: ScrapedInstagramPost[]): number {
  if (posts.length === 0) return 0
  const total = posts.reduce((sum, post) => sum + post.comments, 0)
  return Math.round(total / posts.length)
}

/**
 * Format large numbers for display
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
 * Validate Instagram username format
 */
export function isValidUsername(username: string): boolean {
  const cleanUsername = username.replace('@', '').trim()
  const regex = /^[a-zA-Z0-9._]{1,30}$/
  return regex.test(cleanUsername)
}

