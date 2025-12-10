import { NextResponse } from 'next/server';

// Fallback hashtags for when API is unavailable
const FALLBACK_TAGS: Record<string, string[]> = {
    viral: ['#viral', '#trending', '#fyp', '#explore', '#instagood', '#reels', '#instadaily', '#love', '#photooftheday', '#instagram'],
    tech: ['#tech', '#technology', '#innovation', '#ai', '#coding', '#programming', '#developer', '#software', '#startup', '#digital'],
    fashion: ['#fashion', '#style', '#ootd', '#fashionblogger', '#instafashion', '#fashionista', '#outfit', '#streetstyle', '#fashiongram', '#trendy'],
    gym: ['#gym', '#fitness', '#workout', '#fit', '#motivation', '#bodybuilding', '#training', '#fitnessmotivation', '#muscle', '#health']
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const keyword = searchParams.get('keyword') || 'viral';
        const rapidApiKey = process.env.RAPIDAPI_KEY;

        if (!rapidApiKey) {
            console.error('RAPIDAPI_KEY not found in environment variables');
            return NextResponse.json({
                tags: FALLBACK_TAGS[keyword.toLowerCase()] || FALLBACK_TAGS.viral,
                isFallback: true,
                note: 'API key not configured - using fallback data'
            });
        }

        // Using Social Media Hashtag Generator API from RapidAPI
        const response = await fetch(
            `https://social-media-hashtag-generator-api.p.rapidapi.com/generate?keyword=${encodeURIComponent(keyword)}&filter=top`,
            {
                method: 'GET',
                headers: {
                    'x-rapidapi-host': 'social-media-hashtag-generator-api.p.rapidapi.com',
                    'x-rapidapi-key': rapidApiKey
                }
            }
        );

        if (!response.ok) {
            throw new Error(`RapidAPI request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Debug: Log the actual response structure
        console.log('[InstaTrends] API Response:', JSON.stringify(data, null, 2));

        // Extract hashtags from the response
        // The API returns: { success: true, message: "success", data: { keyword: "...", hashtags: [...] } }
        let tags: string[] = [];

        // Check for the correct nested structure
        if (data.data && data.data.hashtags && Array.isArray(data.data.hashtags)) {
            console.log('[InstaTrends] Found data.data.hashtags array');
            tags = data.data.hashtags;
        } else if (data.hashtags && Array.isArray(data.hashtags)) {
            console.log('[InstaTrends] Found data.hashtags array');
            tags = data.hashtags;
        } else if (data.tags && Array.isArray(data.tags)) {
            console.log('[InstaTrends] Found data.tags array');
            tags = data.tags;
        } else if (data.data && Array.isArray(data.data)) {
            console.log('[InstaTrends] Found data.data array');
            tags = data.data;
        } else if (Array.isArray(data)) {
            console.log('[InstaTrends] Data is an array');
            tags = data;
        } else {
            console.log('[InstaTrends] Unknown response structure, trying to extract any array');
            // Try to find any array in the response
            const searchObject = (obj: any, depth = 0): string[] | null => {
                if (depth > 3) return null; // Prevent infinite recursion
                for (const key of Object.keys(obj)) {
                    if (Array.isArray(obj[key]) && obj[key].length > 0) {
                        console.log(`[InstaTrends] Found array at depth ${depth}, key: ${key}`);
                        return obj[key];
                    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                        const result = searchObject(obj[key], depth + 1);
                        if (result) return result;
                    }
                }
                return null;
            };
            const foundTags = searchObject(data);
            if (foundTags) tags = foundTags;
        }

        console.log('[InstaTrends] Extracted tags:', tags);

        // Ensure all tags start with #
        tags = tags.map((tag: string) =>
            tag.trim().startsWith('#') ? tag.trim() : `#${tag.trim()}`
        ).filter((tag: string) => tag.length > 1); // Remove empty tags

        console.log('[InstaTrends] Final tags after formatting:', tags);

        // If no tags returned, use fallback
        if (tags.length === 0) {
            console.log('[InstaTrends] No tags found, using fallback');
            return NextResponse.json({
                tags: FALLBACK_TAGS[keyword.toLowerCase()] || FALLBACK_TAGS.viral,
                isFallback: true,
                note: 'No tags available from API'
            });
        }

        // Limit to top 20 tags
        return NextResponse.json({
            tags: tags.slice(0, 20),
            isFallback: false
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('RapidAPI Hashtag Generator error:', errorMessage);

        // Extract keyword for fallback
        const { searchParams } = new URL(request.url);
        const keyword = searchParams.get('keyword') || 'viral';

        // Return fallback tags
        return NextResponse.json({
            tags: FALLBACK_TAGS[keyword.toLowerCase()] || FALLBACK_TAGS.viral,
            isFallback: true,
            note: 'Using fallback data due to API error'
        });
    }
}
