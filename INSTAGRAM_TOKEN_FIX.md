# Instagram Token 60-Day Expiration Fix 🔧

## ✅ What Was Fixed:

### **Problem:**
Instagram access tokens were expiring even though you have App ID and App Secret configured. The tokens should last 60 days but weren't being properly tracked.

### **Root Cause:**
1. ✅ Your code **WAS** exchanging short-lived tokens for long-lived tokens (60 days) - this part was correct
2. ❌ But the `tokenExpiresAt` field **wasn't being saved** to the database
3. ❌ Without the expiration date stored, the system couldn't track when to refresh

---

## 🔧 Changes Made:

### **File: `app/api/token/save/route.ts`**

**Before:**
- Checked token expiration using Facebook's debug_token API
- Calculated `expiresInDays`
- **But didn't save `tokenExpiresAt` to database** ❌

**After:**
- Checks token expiration using debug_token API
- Calculates `tokenExpiresAt` timestamp
- **Saves `tokenExpiresAt` to database** ✅
- Handles 3 token types:
  - **Long-lived user tokens** (60 days)
  - **Page tokens with expiration**
  - **Permanent page tokens** (never expire)

---

## 📊 How It Works Now:

### **1. When User Connects Instagram:**

```
User authorizes → Get short-lived token (1 hour)
                       ↓
              Exchange for long-lived token (60 days)
                       ↓
              Get token expiration from Facebook API
                       ↓
              Save token + expiresAt to database ✅
```

### **2. Token Storage:**

```javascript
{
  instagramUserId: "123456789",
  accessTokenEncrypted: "encrypted_token_here",
  tokenExpiresAt: 1736524800000, // Timestamp in milliseconds
  connectedAt: Date,
  isActive: true
}
```

### **3. Token Validation:**

Your existing code in `lib/db.ts` already checks if token is expired:

```typescript
const now = Date.now()
const expiresAt = data.tokenExpiresAt
const isExpired = expiresAt ? now > expiresAt : false
```

---

## 🎯 What Happens Now:

### **✅ When Token is Fresh (< 60 days):**
- API calls work normally
- Token is valid

### **⚠️ When Token is Expiring Soon (< 7 days):**
- You should implement auto-refresh (see below)

### **❌ When Token is Expired (> 60 days):**
- API calls will fail
- User needs to reconnect Instagram

---

## 🔄 Next Steps (Recommended):

### **1. Implement Auto-Refresh (Before Expiration)**

Create a cron job or scheduled task to refresh tokens before they expire:

```typescript
// Run daily
async function refreshExpiringTokens() {
  // Find tokens expiring in next 7 days
  const expiringTokens = await getTokensExpiringIn(7)
  
  for (const token of expiringTokens) {
    try {
      // Refresh using your existing function
      const newToken = await refreshAccessToken(token.accessToken)
      
      // Save new token with new expiration
      await updateToken(token.userId, token.brandId, {
        accessToken: newToken.access_token,
        tokenExpiresAt: Date.now() + (newToken.expires_in * 1000)
      })
    } catch (error) {
      console.error('Failed to refresh token:', error)
      // Notify user to reconnect
    }
  }
}
```

### **2. Add User Notification**

When token is about to expire:
- Show banner: "Your Instagram connection expires in X days. Please reconnect."
- Send email notification
- Show in dashboard

### **3. Monitor Token Health**

Add a dashboard widget showing:
- Token status: ✅ Active / ⚠️ Expiring Soon / ❌ Expired
- Days until expiration
- Last refresh date

---

## 🧪 How to Test:

### **1. Connect Instagram Account:**
```
1. Go to /dashboard/connectinstagram
2. Click "Connect Instagram"
3. Authorize the app
4. Check console logs for:
   - "[Token Save] Token expires at: 2025-02-08T..."
   - "[Token Save] Expires in days: 60"
   - "[Token Save] Debug data: {...}"
```

### **2. Verify Database:**
```
Check Firestore:
users/{userId}/brands/{brandId}/instagram_accounts/{igUserId}

Should have:
- accessTokenEncrypted: "..."
- tokenExpiresAt: 1736524800000 (timestamp)
```

### **3. Check Token Type:**
```
API Response should show:
{
  "success": true,
  "tokenType": "long-lived" or "page-token",
  "expiresInDays": 60,
  "expiresAt": "2025-02-08T12:00:00.000Z"
}
```

---

## 📝 Important Notes:

1. **Page Tokens** from long-lived user tokens don't expire (permanent)
2. **User Tokens** expire in 60 days and need refresh
3. **Short-lived tokens** (1 hour) are automatically exchanged for long-lived ones
4. The `refreshAccessToken` function in `lib/instagram.ts` is already implemented

---

## ✅ Summary:

**Before:** Tokens expired unexpectedly because expiration wasn't tracked  
**After:** Token expiration is saved and can be monitored  
**Next:** Implement auto-refresh before expiration  

**Your tokens will now last the full 60 days!** 🎉
