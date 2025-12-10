# AI-Powered Instagram Hashtag Generator 🤖

## 🎯 Overview

This feature uses **TinyLlama AI** to intelligently generate brand-specific keywords based on your business overview, then fetches trending hashtags for each keyword using RapidAPI.

---

## 🔄 How It Works:

### **Step 1: Business Overview Input**
- User enters a description of their business
- Example: "We're a sustainable fashion brand targeting Gen-Z consumers who care about eco-friendly clothing"

### **Step 2: AI Keyword Generation**
- TinyLlama analyzes the business overview
- Generates 5 relevant keywords that describe the content the brand needs
- Example keywords: `sustainable`, `fashion`, `eco`, `trendy`, `style`

### **Step 3: Hashtag Fetching**
- For each AI-generated keyword, fetch trending hashtags from RapidAPI
- User can click on any keyword to see its hashtags
- Each keyword gets a unique gradient color

### **Step 4: Copy & Use**
- Click any hashtag to copy it to clipboard
- Use in Instagram posts, stories, reels, etc.

---

## 📁 Files Created:

1. **`app/api/generate-keywords/route.ts`**
   - API endpoint that calls TinyLlama via Ollama
   - Generates 5 brand-specific keywords
   - Includes fallback to default keywords if AI fails

2. **`components/InstaAITrends.tsx`**
   - Main UI component
   - Business overview input
   - AI keyword generation
   - Hashtag display with dynamic colors

3. **`app/analytics/trends/page.tsx`**
   - Updated to use the new AI-powered component

---

## 🎨 Features:

✨ **AI-Powered**: Uses TinyLlama to understand your brand  
✨ **Dynamic Keywords**: Generates 5 unique keywords per business  
✨ **Color-Coded**: Each keyword gets a unique gradient  
✨ **Click-to-Copy**: Easy clipboard functionality  
✨ **Smooth UX**: Loading states, animations, error handling  
✨ **Fallback Support**: Works even if AI or API fails  

---

## 🧪 How to Test:

1. Navigate to `/analytics/trends`
2. Enter a business overview in the textarea:
   ```
   We're a tech startup building AI tools for content creators. 
   We focus on automation, creativity, and helping creators save time.
   ```
3. Click "Generate Keywords with AI"
4. Wait for TinyLlama to generate 5 keywords
5. Click on any keyword to see trending hashtags
6. Click hashtags to copy them

---

## 🔧 Requirements:

- ✅ **Ollama** running locally (port 11434)
- ✅ **TinyLlama model** installed (`ollama pull tinyllama`)
- ✅ **RapidAPI key** in `.env.local`

---

## 💡 Example Flow:

**Input:**
```
We're a fitness coaching business helping busy professionals 
stay healthy through quick home workouts and meal planning.
```

**AI-Generated Keywords:**
1. `fitness`
2. `workout`
3. `health`
4. `nutrition`
5. `wellness`

**Hashtags for "fitness":**
`#fitness` `#fitnessmotivation` `#fitnessgoals` `#fitnesslife` ...

---

## 🎯 Benefits:

- **Brand-Specific**: Hashtags are tailored to YOUR business
- **Time-Saving**: No manual hashtag research needed
- **Trending**: Always get current, popular hashtags
- **Intelligent**: AI understands context and generates relevant keywords

---

**Enjoy your AI-powered hashtag generator! 🚀**
