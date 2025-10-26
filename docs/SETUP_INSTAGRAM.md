# Instagram Connect - Setup Guide

## What's Been Created

I've built a fully functional Instagram connection page with the following features:

### ✨ Key Features

1. **Beautiful Connection Screen**
   - Animated Instagram-branded design
   - Feature highlights
   - Smooth connection flow

2. **Comprehensive Data Preview**
   - Profile information with stats
   - Recent posts grid (6 posts shown)
   - Comments feed with replies
   - Advanced analytics dashboard

3. **Engaging Animations**
   - Gradient backgrounds with pulse effects
   - Card hover animations
   - Staggered content reveals
   - Smooth transitions between states

4. **Three Content Tabs**
   - **Posts**: Visual grid with engagement metrics
   - **Comments**: Conversation management
   - **Analytics**: Performance insights

## How to Test

### Option 1: Run Development Server

```bash
npm run dev
```

Then navigate to:
1. `http://localhost:3000/dashboard` - See the new "Connect Your Platforms" section
2. Click the Instagram card
3. Or go directly to `http://localhost:3000/dashboard/connectinstagram`

### Option 2: Manual Navigation

1. Start your Next.js dev server
2. Go to `/dashboard/connectinstagram`
3. Click "Connect Instagram Account"
4. Watch the 2-second loading animation
5. Explore the connected state with mock data

## File Structure

```
app/
  dashboard/
    connectinstagram/
      page.tsx          # Main Instagram connection page
    page.tsx            # Updated with Instagram card link

docs/
  INSTAGRAM_CONNECT.md  # Comprehensive documentation
  SETUP_INSTAGRAM.md    # This file

components/
  ui/
    badge.tsx          # Used for status badges
    tabs.tsx           # Tab navigation
    scroll-area.tsx    # Scrollable content areas
    (other existing components...)
```

## Mock Data

The page currently uses **realistic mock data** including:
- Profile with 24.5K followers
- 6 recent posts with engagement metrics
- 5 recent comments from different users
- Analytics insights and trends

## Next Steps

### 1. Customize the Mock Data
Edit the `mockInstagramData` object in `app/dashboard/connectinstagram/page.tsx` to match your design preferences.

### 2. Integrate Real Instagram API

Replace mock data with real API calls:

```typescript
// Example: Using Instagram Basic Display API
const fetchInstagramData = async (accessToken: string) => {
  const response = await fetch(
    `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`
  )
  return response.json()
}
```

### 3. Add OAuth Flow

Implement Instagram OAuth 2.0:
1. Register app at Facebook Developers
2. Get Client ID and Client Secret
3. Set up redirect URI
4. Handle authorization callback
5. Store access tokens securely (use Firebase or your backend)

### 4. Persist Connection State

Store connection status in your database:
```typescript
// Example with Firebase
import { doc, updateDoc } from 'firebase/firestore'

const saveInstagramConnection = async (userId: string, instagramData: any) => {
  await updateDoc(doc(db, 'users', userId), {
    instagram: {
      connected: true,
      username: instagramData.username,
      accessToken: instagramData.accessToken, // Store encrypted!
      connectedAt: new Date()
    }
  })
}
```

### 5. Add More Platforms

Follow the same pattern for other social platforms:
- TikTok
- Twitter/X
- LinkedIn
- Facebook
- YouTube

## Customization Options

### Change Colors

The Instagram gradient is defined in multiple places:
```typescript
// Update these gradient classes:
"from-pink-500 via-purple-500 to-orange-500"
```

### Adjust Animations

Animation delays are set with `animationDelay`:
```typescript
style={{ animationDelay: `${i * 100}ms` }}
```

### Modify Layout

Grid layouts can be adjusted:
```typescript
// Current: 3 columns on medium+ screens
className="grid md:grid-cols-3 gap-4"

// Change to 4 columns:
className="grid md:grid-cols-4 gap-4"
```

## Troubleshooting

### Issue: Page not loading
**Solution**: Make sure you're navigating to the correct route: `/dashboard/connectinstagram`

### Issue: Animations not working
**Solution**: Check that `tw-animate-css` is installed and imported in `globals.css`

### Issue: Images not displaying
**Solution**: The mock data uses external URLs (Unsplash). Check your internet connection.

### Issue: Components not found
**Solution**: Ensure all UI components exist in `components/ui/`. They should all be present based on your package.json.

## API Integration Guide

### Instagram Basic Display API

1. **Create Facebook App**
   - Go to [Facebook Developers](https://developers.facebook.com)
   - Create new app
   - Add Instagram Basic Display product

2. **Configure OAuth**
   ```typescript
   const INSTAGRAM_AUTH_URL = `https://api.instagram.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=user_profile,user_media&response_type=code`
   ```

3. **Exchange Code for Token**
   ```typescript
   const getAccessToken = async (code: string) => {
     const response = await fetch('https://api.instagram.com/oauth/access_token', {
       method: 'POST',
       body: new FormData({
         client_id: CLIENT_ID,
         client_secret: CLIENT_SECRET,
         grant_type: 'authorization_code',
         redirect_uri: REDIRECT_URI,
         code: code
       })
     })
     return response.json()
   }
   ```

4. **Fetch User Data**
   ```typescript
   const getUserPosts = async (accessToken: string) => {
     const response = await fetch(
       `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username&access_token=${accessToken}`
     )
     return response.json()
   }
   ```

### Instagram Graph API (Business Accounts)

For more features (insights, comments, mentions):
1. Convert to Business/Creator account
2. Connect to Facebook Page
3. Use Graph API endpoints

## Production Checklist

Before deploying to production:

- [ ] Replace mock data with real API calls
- [ ] Implement proper OAuth flow
- [ ] Store tokens securely (encrypted)
- [ ] Add error handling
- [ ] Implement token refresh logic
- [ ] Add loading states
- [ ] Handle rate limits
- [ ] Add analytics tracking
- [ ] Test on mobile devices
- [ ] Add proper error messages
- [ ] Implement retry logic
- [ ] Add data caching
- [ ] Set up monitoring/logging

## Support

For questions or issues:
1. Check the documentation in `docs/INSTAGRAM_CONNECT.md`
2. Review Next.js and Instagram API documentation
3. Check browser console for errors

## Resources

- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Radix UI](https://www.radix-ui.com)

---

**Enjoy your new Instagram connection feature! 🚀**

