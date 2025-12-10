import { NextRequest, NextResponse } from 'next/server'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const MODEL_NAME = 'llama3'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { commentText, postCaption, brandName } = body

        if (!commentText) {
            return NextResponse.json(
                { error: 'Comment text is required' },
                { status: 400 }
            )
        }

        const prompt = `You are a social media manager for ${brandName || 'a brand'}.
    
    Context:
    Post Caption: "${postCaption || 'No caption'}"
    User Comment: "${commentText}"
    
    Task: Generate 3 distinct, engaging, and professional reply suggestions to the user's comment.
    
    Guidelines:
    1. Tone should be friendly, professional, and on-brand.
    2. Keep replies concise (under 280 characters).
    3. **Context Awareness:**
       - IF the user is asking for a collaboration, brand deal, or specific product inquiry (e.g., "collab?", "send me this", "promoter?", "dm us"), THEN suggest moving to DMs (e.g., "Hey! Let's chat in DMs regarding this!").
       - IF the comment is a general compliment or question, DO NOT suggest DMs unless necessary. Just reply naturally.
    4. Vary the style:
       - Option 1: Grateful & Polite
       - Option 2: Engaging/Question (to continue conversation)
       - Option 3: Witty/Fun (if appropriate) or Helpful
    
    Output format: JSON array of strings. Example: ["Reply 1", "Reply 2", "Reply 3"]
    RETURN ONLY THE JSON ARRAY. NO OTHER TEXT.`

        console.log('[OLLAMA] Generating replies for comment:', commentText.substring(0, 50))

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 minute timeout

        try {
            const response = await fetch(`${OLLAMA_URL}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: MODEL_NAME,
                    prompt: prompt,
                    stream: false,
                    options: {
                        temperature: 0.7,
                    },
                }),
                signal: controller.signal,
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                throw new Error(`OLLAMA API error: ${response.status}`)
            }

            const data = await response.json()
            const generatedText = data.response || ''

            const suggestions = parseSuggestions(generatedText)

            return NextResponse.json({ suggestions })

        } catch (fetchError: any) {
            clearTimeout(timeoutId)
            throw fetchError
        }

    } catch (error: any) {
        console.error('[OLLAMA] Error:', error)
        return NextResponse.json(
            { error: 'Failed to generate replies', details: error.message },
            { status: 500 }
        )
    }
}

function parseSuggestions(text: string): string[] {
    try {
        let cleanedText = text.trim()
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
        cleanedText = cleanedText.replace(/^[^{[]*/, '').replace(/[^}\]]*$/, '')

        const parsed = JSON.parse(cleanedText)
        if (Array.isArray(parsed)) {
            return parsed.map(s => String(s)).slice(0, 3)
        }
    } catch (e) {
        console.error('Failed to parse suggestions JSON:', e)
    }

    // Fallback: try to split by newlines if it looks like a list
    const lines = text.split('\n').filter(l => l.trim().length > 0)
    const listItems = lines.filter(l => /^\d+\.|^-/.test(l.trim()))

    if (listItems.length > 0) {
        return listItems.map(l => l.replace(/^\d+\.|^-/, '').trim()).slice(0, 3)
    }

    return []
}
