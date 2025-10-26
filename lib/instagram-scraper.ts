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

    // Demo mode for testing - use "demo" as username
    if (cleanUsername.toLowerCase() === 'demo') {
      return getDemoProfile()
    }

    // Try multiple methods to fetch Instagram data
    let data: any = null
    let method = 'unknown'

    // Method 1: Try the newer graphql endpoint
    try {
      const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${cleanUsername}`
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'X-IG-App-ID': '936619743392459',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
        },
      })

      if (response.ok) {
        data = await response.json()
        method = 'graphql'
      }
    } catch (err) {
      console.log('Method 1 failed, trying alternative...')
    }

    // Method 2: Try the classic __a=1 endpoint
    if (!data) {
      try {
        const url = `https://www.instagram.com/${cleanUsername}/?__a=1&__d=dis`
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
          },
        })

        if (response.ok) {
          data = await response.json()
          method = 'classic'
        } else if (response.status === 404) {
          throw new Error('Instagram profile not found')
        }
      } catch (err) {
        console.log('Method 2 failed, trying HTML scraping...')
      }
    }

    // Method 3: Scrape HTML page
    if (!data) {
      try {
        const url = `https://www.instagram.com/${cleanUsername}/`
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        })

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Instagram profile not found')
          }
          throw new Error(`Failed to fetch Instagram profile (Status: ${response.status})`)
        }

        const html = await response.text()
        
        // Extract JSON data from HTML
        const scriptRegex = /<script type="application\/ld\+json"[^>]*>(.+?)<\/script>/gs
        const matches = html.match(scriptRegex)
        
        if (matches && matches.length > 0) {
          const jsonStr = matches[0].replace(/<script[^>]*>/, '').replace(/<\/script>/, '')
          const ldJson = JSON.parse(jsonStr)
          
          // Try to find shared data
          const sharedDataRegex = /window\._sharedData = ({.+?});<\/script>/
          const sharedMatch = html.match(sharedDataRegex)
          
          if (sharedMatch) {
            data = JSON.parse(sharedMatch[1])
            method = 'html-shared'
          }
        }
      } catch (err) {
        console.error('All methods failed:', err)
      }
    }

    if (!data) {
      throw new Error('Unable to fetch Instagram data. Instagram may be blocking requests. Please try again later or use a different account.')
    }

    // Extract user data based on the method used
    let user: any = null
    
    if (method === 'graphql') {
      user = data?.data?.user
    } else if (method === 'classic') {
      user = data?.graphql?.user || data?.user
    } else if (method === 'html-shared') {
      user = data?.entry_data?.ProfilePage?.[0]?.graphql?.user
    }
    
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
        likes: node.edge_liked_by?.count || node.edge_media_preview_like?.count || 0,
        comments: node.edge_media_to_comment?.count || node.edge_media_preview_comment?.count || 0,
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

  } catch (error: any) {
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

/**
 * Get demo profile data for testing
 * Use username "demo" to see this
 */
export function getDemoProfile(): ScrapedInstagramProfile {
  return {
    username: 'demo',
    fullName: 'Demo Account',
    bio: '🎨 Demo Instagram profile for testing | 📸 Sample content | 💡 Try entering "demo" as username!',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo',
    isVerified: true,
    isPrivate: false,
    followersCount: 125000,
    followingCount: 892,
    postsCount: 347,
    posts: [
      {
        id: '1',
        shortcode: 'demo1',
        imageUrl: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=400&fit=crop',
        caption: 'Excited to share our new product line! What do you think? 🚀 #NewLaunch #Innovation',
        likes: 8420,
        comments: 234,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        isVideo: false,
      },
      {
        id: '2',
        shortcode: 'demo2',
        imageUrl: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&h=400&fit=crop',
        caption: 'Behind the scenes of our latest photoshoot 📸✨',
        likes: 6890,
        comments: 178,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        isVideo: true,
        videoViews: 45200,
      },
      {
        id: '3',
        shortcode: 'demo3',
        imageUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=400&fit=crop',
        caption: 'Celebrating 125K followers! Thank you all for the amazing support 🎉💙',
        likes: 12540,
        comments: 456,
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        isVideo: false,
      },
      {
        id: '4',
        shortcode: 'demo4',
        imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=400&fit=crop',
        caption: 'Monday motivation: Dream big, work hard, stay focused! 💪',
        likes: 5890,
        comments: 123,
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        isVideo: false,
      },
      {
        id: '5',
        shortcode: 'demo5',
        imageUrl: 'https://images.unsplash.com/photo-1552581234-26160f608093?w=400&h=400&fit=crop',
        caption: 'Team meeting vibes ☕️📊 What's your favorite workspace setup?',
        likes: 4100,
        comments: 89,
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        isVideo: false,
      },
      {
        id: '6',
        shortcode: 'demo6',
        imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop',
        caption: 'Golden hour magic 🌅 Our favorite time to create content!',
        likes: 9120,
        comments: 267,
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        isVideo: true,
        videoViews: 62300,
      },
      {
        id: '7',
        shortcode: 'demo7',
        imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=400&fit=crop',
        caption: 'New tech arriving at the studio! Stay tuned 💻✨',
        likes: 7200,
        comments: 145,
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        isVideo: false,
      },
      {
        id: '8',
        shortcode: 'demo8',
        imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=400&fit=crop',
        caption: 'Collaboration makes everything better 🤝 #TeamWork',
        likes: 5600,
        comments: 98,
        timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        isVideo: false,
      },
      {
        id: '9',
        shortcode: 'demo9',
        imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=400&fit=crop',
        caption: 'Creative process in action 🎨 What are you working on today?',
        likes: 6780,
        comments: 167,
        timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        isVideo: false,
      },
      {
        id: '10',
        shortcode: 'demo10',
        imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=400&fit=crop',
        caption: 'Coding session: Building something amazing! 👨‍💻🚀',
        likes: 8900,
        comments: 234,
        timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        isVideo: false,
      },
    ],
  }
}

