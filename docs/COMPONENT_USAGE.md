# Instagram Components - Usage Guide

## Quick Reference

This guide shows how to use the Instagram components in your application.

---

## 1. Instagram Connect Button

**Location**: `components/instagram/ConnectButton.tsx`

### Basic Usage

```tsx
import { InstagramConnectButton } from "@/components/instagram/ConnectButton"

export default function MyPage() {
  const handleConnect = async () => {
    // Redirect to OAuth or call API
    window.location.href = '/api/auth/instagram/connect'
  }

  const handleDisconnect = async () => {
    // Call disconnect API
    await fetch('/api/auth/instagram/disconnect', {
      method: 'POST',
      body: JSON.stringify({ userId: 'current-user-id' })
    })
  }

  return (
    <InstagramConnectButton
      isConnected={false}
      onConnect={handleConnect}
      onDisconnect={handleDisconnect}
    />
  )
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isConnected` | `boolean` | `false` | Connection status |
| `onConnect` | `() => void` | `undefined` | Connect callback |
| `onDisconnect` | `() => void` | `undefined` | Disconnect callback |
| `className` | `string` | `""` | Additional CSS classes |
| `variant` | `"default" \| "outline" \| "ghost"` | `"default"` | Button style |
| `size` | `"sm" \| "default" \| "lg"` | `"default"` | Button size |
| `showIcon` | `boolean` | `true` | Show icon |
| `fullWidth` | `boolean` | `false` | Full width button |

### Examples

**Default Button:**
```tsx
<InstagramConnectButton
  isConnected={false}
  onConnect={handleConnect}
/>
```

**Outline Variant (Connected):**
```tsx
<InstagramConnectButton
  isConnected={true}
  onDisconnect={handleDisconnect}
  variant="outline"
/>
```

**Full Width, Large:**
```tsx
<InstagramConnectButton
  isConnected={false}
  onConnect={handleConnect}
  fullWidth
  size="lg"
/>
```

**Without Icon:**
```tsx
<InstagramConnectButton
  isConnected={false}
  onConnect={handleConnect}
  showIcon={false}
/>
```

---

## 2. Instagram Status Card

**Location**: `components/instagram/StatusCard.tsx`

### Basic Usage

```tsx
import { InstagramStatusCard } from "@/components/instagram/StatusCard"

export default function Dashboard() {
  return (
    <InstagramStatusCard
      isConnected={true}
      username="your_brand"
      lastSync={new Date()}
      postsCount={347}
      followersCount={24500}
      engagementRate={8.2}
      onConnect={handleConnect}
      onDisconnect={handleDisconnect}
    />
  )
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isConnected` | `boolean` | `false` | Connection status |
| `username` | `string` | `undefined` | Instagram username |
| `lastSync` | `Date` | `undefined` | Last sync timestamp |
| `postsCount` | `number` | `0` | Number of posts |
| `followersCount` | `number` | `0` | Follower count |
| `engagementRate` | `number` | `0` | Engagement rate % |
| `onConnect` | `() => void` | `undefined` | Connect callback |
| `onDisconnect` | `() => void` | `undefined` | Disconnect callback |
| `className` | `string` | `""` | Additional CSS classes |

### Examples

**Not Connected:**
```tsx
<InstagramStatusCard
  isConnected={false}
  onConnect={handleConnect}
/>
```

**Connected with Stats:**
```tsx
<InstagramStatusCard
  isConnected={true}
  username="mayvn_official"
  lastSync={new Date(Date.now() - 3600000)} // 1 hour ago
  postsCount={152}
  followersCount={48200}
  engagementRate={12.4}
  onDisconnect={handleDisconnect}
/>
```

**In a Grid Layout:**
```tsx
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
  <InstagramStatusCard {...instagramData} />
  <TikTokStatusCard {...tiktokData} />
  <TwitterStatusCard {...twitterData} />
</div>
```

---

## 3. Using Instagram API Utilities

**Location**: `lib/instagram.ts`

### Authentication Flow

```tsx
import { getInstagramAuthUrl, getInstagramAccessToken } from "@/lib/instagram"

// 1. Redirect user to Instagram
const authUrl = getInstagramAuthUrl(['user_profile', 'user_media'])
window.location.href = authUrl

// 2. Handle callback (in your API route)
const { access_token } = await getInstagramAccessToken(code)
```

### Fetch Profile Data

```tsx
import { getInstagramProfile, getInstagramMedia } from "@/lib/instagram"

// Get user profile
const profile = await getInstagramProfile(accessToken)
console.log(profile.username, profile.media_count)

// Get user posts
const posts = await getInstagramMedia(accessToken, 25)
console.log(posts.length, posts[0].caption)
```

### Get Post Insights

```tsx
import { getMediaInsights, getMediaComments } from "@/lib/instagram"

// Get post analytics
const insights = await getMediaInsights(postId, accessToken)
console.log(insights.impressions, insights.reach)

// Get post comments
const comments = await getMediaComments(postId, accessToken)
console.log(comments.length, comments[0].text)
```

### Utility Functions

```tsx
import { 
  formatCount, 
  getRelativeTime, 
  calculateEngagementRate,
  getBestPostingTimes 
} from "@/lib/instagram"

// Format numbers
formatCount(24500) // "24.5K"
formatCount(1234567) // "1.2M"

// Relative time
getRelativeTime("2024-10-26T10:00:00Z") // "2 hours ago"

// Engagement rate
calculateEngagementRate(1000, 50, 10000) // 10.5%

// Best times to post
const bestTimes = getBestPostingTimes(posts)
// ["18:00 - 19:00", "20:00 - 21:00", "12:00 - 13:00"]
```

---

## 4. Complete Integration Example

Here's a complete example of integrating Instagram in a dashboard:

```tsx
"use client"

import { useState, useEffect } from "react"
import { InstagramStatusCard } from "@/components/instagram/StatusCard"
import { getInstagramProfile, getInstagramMedia } from "@/lib/instagram"

export default function SocialDashboard() {
  const [instagramData, setInstagramData] = useState({
    isConnected: false,
    username: '',
    postsCount: 0,
    followersCount: 0,
    engagementRate: 0,
    lastSync: null as Date | null,
  })

  const handleConnect = async () => {
    // Redirect to OAuth
    window.location.href = '/api/auth/instagram/connect'
  }

  const handleDisconnect = async () => {
    try {
      await fetch('/api/auth/instagram/disconnect', {
        method: 'POST',
        body: JSON.stringify({ userId: 'current-user-id' })
      })
      
      setInstagramData({
        isConnected: false,
        username: '',
        postsCount: 0,
        followersCount: 0,
        engagementRate: 0,
        lastSync: null,
      })
    } catch (error) {
      console.error('Disconnect error:', error)
    }
  }

  const loadInstagramData = async () => {
    try {
      // Get stored access token
      const token = localStorage.getItem('instagram_token')
      if (!token) return

      // Fetch profile
      const profile = await getInstagramProfile(token)
      
      // Fetch posts
      const posts = await getInstagramMedia(token, 10)
      
      // Calculate engagement
      const totalLikes = posts.reduce((sum, post) => sum + (post.like_count || 0), 0)
      const avgLikes = totalLikes / posts.length
      const engagementRate = (avgLikes / 10000) * 100 // Assuming 10k followers

      setInstagramData({
        isConnected: true,
        username: profile.username,
        postsCount: profile.media_count,
        followersCount: 10000, // From Business API
        engagementRate,
        lastSync: new Date(),
      })
    } catch (error) {
      console.error('Load data error:', error)
    }
  }

  useEffect(() => {
    loadInstagramData()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Social Media Dashboard</h1>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InstagramStatusCard
          {...instagramData}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />
      </div>
    </div>
  )
}
```

---

## 5. Styling Customization

### Custom Button Colors

```tsx
<InstagramConnectButton
  className="bg-blue-500 hover:bg-blue-600"
  onConnect={handleConnect}
/>
```

### Custom Card Styling

```tsx
<InstagramStatusCard
  className="border-2 border-pink-500 shadow-lg"
  isConnected={true}
  {...props}
/>
```

### Dark Mode Support

All components automatically support dark mode via Tailwind's dark mode classes.

---

## 6. Error Handling

```tsx
import { handleInstagramError, InstagramAPIError } from "@/lib/instagram"

try {
  const profile = await getInstagramProfile(token)
} catch (error) {
  const message = handleInstagramError(error)
  // Display user-friendly error message
  toast.error(message)
}
```

---

## 7. TypeScript Types

All components and functions are fully typed:

```tsx
import type { 
  InstagramProfile, 
  InstagramMedia, 
  InstagramComment,
  InstagramInsights 
} from "@/lib/instagram"

const profile: InstagramProfile = await getInstagramProfile(token)
const posts: InstagramMedia[] = await getInstagramMedia(token)
```

---

## Tips & Best Practices

1. **Store Tokens Securely**
   - Never store in localStorage for production
   - Use HTTP-only cookies or database
   - Encrypt sensitive data

2. **Handle Rate Limits**
   - Cache API responses
   - Implement retry logic
   - Show loading states

3. **Error Messages**
   - Use the built-in error handler
   - Show user-friendly messages
   - Log errors for debugging

4. **Refresh Tokens**
   - Implement auto-refresh
   - Handle token expiration
   - Request new permissions if needed

5. **Testing**
   - Test with mock data first
   - Test all error scenarios
   - Test on mobile devices

---

## Common Patterns

### Loading State
```tsx
{isLoading ? (
  <Skeleton className="h-48" />
) : (
  <InstagramStatusCard {...data} />
)}
```

### Conditional Rendering
```tsx
{instagramConnected && (
  <div className="grid grid-cols-3 gap-4">
    {posts.map(post => (
      <PostCard key={post.id} post={post} />
    ))}
  </div>
)}
```

### With Toast Notifications
```tsx
import { toast } from "sonner"

const handleConnect = async () => {
  try {
    await connectInstagram()
    toast.success("Instagram connected successfully!")
  } catch (error) {
    toast.error("Failed to connect Instagram")
  }
}
```

---

## Need Help?

- Check the main documentation: `README_INSTAGRAM_FEATURE.md`
- Review the setup guide: `docs/SETUP_INSTAGRAM.md`
- See feature docs: `docs/INSTAGRAM_CONNECT.md`
- Inspect component source code for more details

---

**Happy coding! 🚀**

