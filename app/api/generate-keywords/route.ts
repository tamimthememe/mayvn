import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { businessOverview, targetAudience, brandValues } = await request.json();

        if (!businessOverview || typeof businessOverview !== 'string') {
            return NextResponse.json({ error: 'Business overview is required' }, { status: 400 });
        }

        const audienceText = targetAudience && targetAudience.length > 0 ? targetAudience.join(', ') : 'general audience';
        const valuesText = brandValues && brandValues.length > 0 ? brandValues.join(', ') : 'innovation, creativity';

        const systemPrompt = '<|system|>\nYou are an expert Social Media Strategist. Generate 5 SINGLE-WORD keywords for hashtag research.\n- Each keyword must be exactly ONE WORD (no spaces, no phrases).\n- Keywords: specific, trend-aware, searchable.\n- Output: comma-separated list of 5 single words ONLY.\n- NO generic words: modern, quality, innovative.\n- Example output: AIMarketing, GenZ, Creators, Automation, Content\n</s>';

        const userPrompt = 'BRAND: ' + businessOverview + ' | VALUES: ' + valuesText + ' | AUDIENCE: ' + audienceText + ' | Generate 5 keywords:';

        console.log('[GenerateKeywords] Calling TinyLlama');

        const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'qwen2.5:1.5b',
                prompt: systemPrompt + '\n\n' + userPrompt,
                stream: false,
                options: { temperature: 0.7 }
            }),
        });

        if (!ollamaResponse.ok) {
            throw new Error('Ollama request failed: ' + ollamaResponse.status);
        }

        const ollamaData = await ollamaResponse.json();
        const generatedText = ollamaData.response || '';

        console.log('[GenerateKeywords] Raw response:', generatedText);

        let keywords = generatedText
            .split(',')
            .map((word: string) => word.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''))
            .filter((word: string) => word.length > 0 && word.length < 25 && !word.includes(' '))
            .map((word: string) => word.split(' ')[0])
            .slice(0, 5);

        const defaultKeywords = ['viral', 'trending', 'creative', 'engaging', 'popular'];
        while (keywords.length < 5) {
            keywords.push(defaultKeywords[keywords.length]);
        }

        console.log('[GenerateKeywords] Final keywords:', keywords);

        return NextResponse.json({
            keywords: keywords.slice(0, 5),
            rawResponse: generatedText
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[GenerateKeywords] Error:', errorMessage);

        return NextResponse.json({
            keywords: ['viral', 'trending', 'creative', 'engaging', 'popular'],
            error: errorMessage,
            fallback: true
        });
    }
}
