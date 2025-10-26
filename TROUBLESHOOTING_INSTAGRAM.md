# Instagram Scraper - Troubleshooting Guide

## Current Status

Instagram actively blocks direct scraping attempts. The scraper has been updated with:
- ✅ Multiple fallback methods
- ✅ Demo mode for testing
- ✅ Better error handling
- ✅ Detailed logging

## Quick Test - Demo Mode

**You can test the feature immediately using demo data:**

1. Navigate to `/dashboard/connectinstagram`
2. Enter `demo` as the username
3. Click "View Profile"
4. See a sample profile with 10 posts!

This lets you test the entire UI without any API limitations.

## The Instagram Scraping Challenge

### Why It's Difficult

Instagram has implemented several anti-scraping measures:
- **CORS restrictions** - Blocks requests from web browsers
- **Rate limiting** - Limits requests per IP
- **Login requirements** - Some data requires authentication
- **Dynamic content** - Uses JavaScript rendering
- **Bot detection** - Identifies and blocks automated requests

### Current Implementation

The scraper tries 3 different methods in order:

1. **GraphQL API** (`/api/v1/users/web_profile_info/`)
   - Newest Instagram endpoint
   - Requires X-IG-App-ID header
   - Works sometimes

2. **Classic endpoint** (`/?__a=1`)
   - Older method
   - Being phased out
   - Hit or miss

3. **HTML scraping**
   - Parse the HTML page directly
   - Extract embedded JSON data
   - Most reliable but complex

## Solutions

### Option 1: Use Demo Mode (Immediate)

**Best for**: Testing UI, development, demos

```typescript
// Enter "demo" as username
// Returns sample data instantly
```

**Pros:**
- ✅ Works immediately
- ✅ No limitations
- ✅ Great for testing UI
- ✅ Shows all features

**Cons:**
- ❌ Not real data
- ❌ Same data every time

### Option 2: Use a Proxy Service (Recommended for Production)

**Best for**: Production use, reliability

Popular services:
- **RapidAPI Instagram API** - $0-50/month
- **Apify Instagram Scraper** - Pay per use
- **ScraperAPI** - Handles proxies/captchas
- **BrightData** - Enterprise solution

**Pros:**
- ✅ Reliable
- ✅ Handles rate limits
- ✅ No blocking issues
- ✅ Better data access

**Cons:**
- ❌ Costs money
- ❌ Requires API keys
- ❌ External dependency

### Option 3: Use Instagram Basic Display API (OAuth)

**Best for**: User's own profiles, full access

**Pros:**
- ✅ Official Instagram API
- ✅ Reliable and supported
- ✅ Access to more data
- ✅ No scraping issues

**Cons:**
- ❌ Requires user authentication
- ❌ Complex OAuth flow
- ❌ Can only access user's own account
- ❌ Need Facebook Developer app

### Option 4: Run Your Own Proxy

**Best for**: High volume, cost optimization

Setup:
- Use rotating proxies
- Run browser automation (Puppeteer/Playwright)
- Deploy on cloud servers
- Rotate user agents

**Pros:**
- ✅ Full control
- ✅ Cost effective at scale
- ✅ No third-party dependencies

**Cons:**
- ❌ Complex setup
- ❌ Maintenance overhead
- ❌ Need infrastructure
- ❌ Still can be detected

## Implementation Examples

### Using RapidAPI

```typescript
// lib/instagram-rapidapi.ts
export async function fetchWithRapidAPI(username: string) {
  const response = await fetch(
    `https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url=${username}`,
    {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
        'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com'
      }
    }
  )
  return response.json()
}
```

### Using Puppeteer

```typescript
// lib/instagram-puppeteer.ts
import puppeteer from 'puppeteer'

export async function scrapeWithPuppeteer(username: string) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(`https://www.instagram.com/${username}/`)
  
  // Extract data from page
  const data = await page.evaluate(() => {
    return window._sharedData
  })
  
  await browser.close()
  return data
}
```

## Checking Logs

When using the scraper, check your terminal for logs:

```bash
[Instagram Scraper] Fetching profile for: username
[Instagram Scraper] Starting scrape...
[Instagram Scraper] Method 1 failed, trying alternative...
[Instagram Scraper] Method 2 failed, trying HTML scraping...
[Instagram Scraper] Error details: {...}
```

These logs will help diagnose issues.

## Common Errors

### Error: "Failed to fetch Instagram profile"

**Cause**: Instagram is blocking the request

**Solutions**:
1. Try `demo` username to test UI
2. Wait a few minutes and try again
3. Use a different network/VPN
4. Consider using a proxy service

### Error: "Instagram profile not found"

**Cause**: Username doesn't exist or is misspelled

**Solutions**:
1. Check spelling
2. Try without @ symbol
3. Verify account exists on Instagram.com

### Error: "This account is private"

**Cause**: Profile is set to private

**Solutions**:
1. Only works with public profiles
2. Try a different public account
3. Use demo mode for testing

### Error: "Instagram may be blocking requests"

**Cause**: Too many requests from your IP

**Solutions**:
1. Wait 5-10 minutes
2. Try from a different network
3. Use demo mode
4. Consider proxy service

## Production Recommendations

For production use, we recommend:

### 1. Add Caching

```typescript
// Cache profiles for 1 hour
const cache = new Map<string, { data: any, expires: number }>()

export async function getCachedProfile(username: string) {
  const cached = cache.get(username)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }
  
  const data = await scrapeInstagramProfile(username)
  cache.set(username, {
    data,
    expires: Date.now() + 3600000 // 1 hour
  })
  
  return data
}
```

### 2. Rate Limiting

```typescript
// Limit to 10 requests per minute
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10
})
```

### 3. Use Proxy Service

For reliable production use, integrate with RapidAPI or similar:

```bash
# Add to .env
RAPIDAPI_KEY=your_key_here
```

### 4. Fallback Chain

```typescript
// Try multiple methods
try {
  return await rapidAPIFetch(username)
} catch {
  try {
    return await directScrape(username)
  } catch {
    return await getCachedData(username) || getDemoProfile()
  }
}
```

## Current Workaround

**For immediate use:**

1. Enter `demo` as username
2. See fully functional UI with sample data
3. All features work (posts, analytics, etc.)
4. Perfect for:
   - Testing UI
   - Demos to clients
   - Development
   - Screenshots

## Next Steps

### Short Term
- ✅ Use demo mode for testing
- ✅ Show the beautiful UI
- ✅ Get feedback on design

### Medium Term
- 🔄 Integrate with RapidAPI
- 🔄 Add caching layer
- 🔄 Implement rate limiting

### Long Term
- 📋 Consider Instagram Basic Display API
- 📋 Build proxy infrastructure
- 📋 Add more social platforms

## Support Resources

- [Instagram Basic Display API Docs](https://developers.facebook.com/docs/instagram-basic-display-api)
- [RapidAPI Instagram APIs](https://rapidapi.com/collection/instagram-api)
- [Apify Instagram Scraper](https://apify.com/apify/instagram-scraper)

## Questions?

### Q: Will scraping get me banned?
**A:** Instagram doesn't ban IPs for moderate scraping. However, they do block excessive requests. Using demo mode or a proxy service avoids this.

### Q: Is the demo mode enough?
**A:** Demo mode is perfect for testing the UI and showing the design. For real user data, you'll need a proxy service or API.

### Q: What's the best solution?
**A:** For production, use RapidAPI or similar service. For development, demo mode works great.

### Q: Can I scrape my own profile?
**A:** Use Instagram Basic Display API for your own profile - it's official and reliable.

### Q: How much does RapidAPI cost?
**A:** Plans start around $10-50/month depending on usage. Some have free tiers for testing.

---

## Try Demo Mode Now!

1. Go to `/dashboard/connectinstagram`
2. Type `demo`
3. Click "View Profile"
4. Enjoy the full experience! 🎉

The demo shows:
- ✓ Complete profile with stats
- ✓ 10 beautiful posts with images
- ✓ Real engagement metrics
- ✓ Working analytics tab
- ✓ All animations and hover effects

Perfect for testing, demos, and development!

