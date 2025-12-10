import { NextResponse } from 'next/server';

// Fallback sample trends for when API is unavailable
const SAMPLE_TRENDS = [
    'AI Revolution',
    'Climate Change',
    'Taylor Swift',
    'NFL Playoffs',
    'ChatGPT',
    'Stock Market',
    'Holiday Shopping',
    'Netflix Series',
    'Bitcoin Price',
    'iPhone 16',
    'Elon Musk',
    'World Cup',
    'New Year 2025',
    'Super Bowl',
    'Grammy Awards'
];

export async function GET() {
    try {
        const rapidApiKey = process.env.RAPIDAPI_KEY;

        if (!rapidApiKey) {
            console.error('RAPIDAPI_KEY not found in environment variables');
            return NextResponse.json({
                trends: SAMPLE_TRENDS,
                isSample: true,
                note: 'API key not configured - using sample data'
            });
        }

        // Using Google Trends API from RapidAPI (apidojo)
        const response = await fetch(
            'https://google-trends1.p.rapidapi.com/daily_trends?geo=US',
            {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': rapidApiKey,
                    'X-RapidAPI-Host': 'google-trends1.p.rapidapi.com'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`RapidAPI request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Navigate to the trending searches in RapidAPI response
        const trendingSearches = data?.default?.trendingSearchesDays?.[0]?.trendingSearches || [];

        // Extract just the query strings
        const trends: string[] = trendingSearches.map(
            (item: { title: { query: string } }) => item.title.query
        );

        // If no trends returned, use sample data
        if (trends.length === 0) {
            return NextResponse.json({
                trends: SAMPLE_TRENDS,
                isSample: true,
                note: 'No trends available from API'
            });
        }

        return NextResponse.json({ trends, isSample: false });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('RapidAPI Trends error:', errorMessage);

        // Return sample trends as fallback
        return NextResponse.json({
            trends: SAMPLE_TRENDS,
            isSample: true,
            note: 'Using sample data due to API error'
        });
    }
}
