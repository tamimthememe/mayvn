

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

        const systemPrompt = getSystemPrompt(metricsContext || 'No metrics data available yet.');

        // Add system prompt to the beginning of messages
        const allMessages = [
            { role: 'system', content: systemPrompt },
            ...messages.map((m: any) => ({
                role: m.role,
                content: m.content
            }))
        ];

        console.log('[Rayvn API] Sending request to Ollama (llama3)...');

        const response = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama3',
                messages: allMessages,
                stream: true,
                options: {
                    temperature: 0.7, // Creativity
                    top_k: 50,
                    top_p: 0.9,
                }
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        // Create a streaming response
        const stream = new ReadableStream({
            async start(controller) {
                if (!response.body) return;
                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value, { stream: true });
                        const lines = chunk.split('\n').filter(line => line.trim() !== '');

                        for (const line of lines) {
                            try {
                                const json = JSON.parse(line);
                                if (json.message && json.message.content) {
                                    controller.enqueue(json.message.content);
                                }
                                if (json.done) {
                                    // Optional: handle completion stats
                                }
                            } catch (e) {
                                console.error('Error parsing JSON chunk:', e);
                            }
                        }
                    }
                } finally {
                    controller.close();
                    reader.releaseLock();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
            },
        });

    } catch (error: any) {
        console.error('[Rayvn API] Error:', error?.message || error);
        return Response.json({
            error: error?.message || 'Failed to process chat request'
        }, { status: 500 });
    }
}
