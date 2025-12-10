export class RedditController {
    /**
     * Generate a random challenge string.
     */
    static async generateChallenge(): Promise<string> {
        const randomString = Math.random().toString(36).substring(2, 8);
        return `mayvn-${randomString}`;
    }

    /**
     * Verify if the user has placed the challenge code in their Reddit bio.
     */
    static async verifyOwnership(redditUsername: string, expectedChallenge: string): Promise<boolean> {
        try {
            console.log(`[Reddit] Verifying ${redditUsername} for code ${expectedChallenge}...`);

            const response = await fetch(`https://www.reddit.com/user/${redditUsername}/about.json`, {
                headers: {
                    'User-Agent': 'Mayvn/1.0.0 (Verification Bot)'
                }
            });

            if (!response.ok) {
                if (response.status === 404) throw new Error('Reddit user not found');
                throw new Error(`Reddit API error: ${response.statusText}`);
            }

            const data = await response.json();

            // Check multiple possible locations for the bio
            const bio1 = data?.data?.public_description || '';
            const bio2 = data?.data?.subreddit?.public_description || '';
            const bio3 = data?.data?.subreddit?.description || '';

            const bio = `${bio1} ${bio2} ${bio3}`;
            console.log(`[Reddit] Found bio content: "${bio}"`);

            return bio.includes(expectedChallenge);

        } catch (error: any) {
            console.error('[Reddit] Verification failed:', error.message);
            throw error;
        }
    }

    /**
     * Fetch analytics for a Reddit user.
     */
    static async fetchAnalytics(redditUsername: string): Promise<any> {
        try {
            console.log(`[Reddit] Fetching analytics for ${redditUsername}...`);

            const [aboutRes, postsRes] = await Promise.all([
                fetch(`https://www.reddit.com/user/${redditUsername}/about.json`, {
                    headers: { 'User-Agent': 'Mayvn/1.0.0 (Analytics Bot)' }
                }),
                fetch(`https://www.reddit.com/user/${redditUsername}/submitted.json?limit=50`, {
                    headers: { 'User-Agent': 'Mayvn/1.0.0 (Analytics Bot)' }
                })
            ]);

            if (!aboutRes.ok || !postsRes.ok) {
                throw new Error(`Reddit API error`);
            }

            const accountData = await aboutRes.json();
            const postsData = await postsRes.json();

            return {
                account: accountData,
                posts: postsData
            };

        } catch (error: any) {
            console.error('[Reddit] Analytics fetch failed:', error.message);
            throw error;
        }
    }
}
