import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// System prompt for Rayvn personality
const getSystemPrompt = (metricsContext: string) => `You are Rayvn, a social media friend and assistant.

## Tone & Style
- You are Rayvn, a social media enthusiast and friend.
- Speak in the first person ("I love this post", "I think you should...").
- **NEVER say "based on the data" or "from what I see".** Just say it!
- **NEVER put quotes around words like "favorite".**
- Be opinionated! If a post is good, say "I love this one!"
- **NEVER use markdown bolding.**
- Keep it short and punchy.

## Your Data
${metricsContext}

## CRITICAL: MENTIONING POSTS
When you talk about a specific post, simply refer to it by its caption.
- Example: "Your post 'Website Design for KFC' performed well."
- Do NOT use any special ID tags.
- Just quote the caption naturally.

## Actions
End with these tags if relevant:
[ACTION:VIEW_ANALYTICS] (for detailed stats)
[ACTION:CREATE_POST] (to make content)
[ACTION:VIEW_CONTENT] (to see all posts)
`;

export async function POST(req: Request) {
    try {
        const { messages, metricsContext } = await req.json();

        const result = await streamText({
            model: google('gemini-2.5-flash-lite'),
            system: getSystemPrompt(metricsContext || 'No metrics data available yet.'),
            messages: messages.map((m: any) => ({
                role: m.role as 'user' | 'assistant',
                content: m.content
            })),
        });

        return result.toTextStreamResponse();
    } catch (error: any) {
        console.error('[Rayvn API] Error:', error?.message || error);
        return Response.json({
            error: error?.message || 'Failed to process chat request'
        }, { status: 500 });
    }
}
