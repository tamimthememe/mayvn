import { NextRequest, NextResponse } from 'next/server'

/**
 * OLLAMA Business Ideas Generator API
 * 
 * Uses OLLAMA qwen2.5:1.5b model to generate business ideas based on brand data
 */

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const MODEL_NAME = process.env.OLLAMA_MODEL || 'qwen2.5:1.5b'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { brandData } = body

    if (!brandData) {
      return NextResponse.json(
        { error: 'Brand data is required' },
        { status: 400 }
      )
    }

    // Build prompt using brand data
    const prompt = buildPrompt(brandData)

    console.log('[OLLAMA] Generating business ideas for brand:', brandData.brand_name)
    console.log('[OLLAMA] Using model:', MODEL_NAME)
    console.log('[OLLAMA] URL:', `${OLLAMA_URL}/api/generate`)

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 900000) // 15 minute timeout

    try {
      // Call OLLAMA API
      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.8,
            top_p: 0.9,
          },
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[OLLAMA] Error response:', errorText)
        throw new Error(`OLLAMA API error: ${response.status} ${response.statusText}. Make sure OLLAMA is running and the model ${MODEL_NAME} is installed.`)
      }

      const data = await response.json()
      const generatedText = data.response || ''

      console.log('[OLLAMA] Raw response length:', generatedText.length)
      console.log('[OLLAMA] Raw response preview:', generatedText.substring(0, 200))

      // Parse the generated carousel post concepts with scores (expecting JSON)
      const ideas = parseIdeasWithScores(generatedText)

      console.log('[OLLAMA] Generated', ideas.length, 'carousel post concepts with scores')

      return NextResponse.json({
        success: true,
        ideas,
        rawResponse: generatedText,
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      logFallbackError(fetchError)

      const fallbackIdeas = buildFallbackIdeas(brandData)

      return NextResponse.json({
        success: true,
        ideas: fallbackIdeas,
        rawResponse: '',
        fallback: true,
        error: fetchError.message || 'Model inference failed',
      })
    }
  } catch (error: any) {
    console.error('[OLLAMA] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })

    return NextResponse.json(
      {
        error: 'Failed to generate business ideas',
        details: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

function buildPrompt(brandData: any): string {
  const brandName = brandData.brand_name || 'the brand'
  const tagline = brandData.tagline || ''
  const businessOverview = brandData.business_overview || ''
  const brandValues = brandData.brand_values?.join(', ') || ''
  const targetAudience = brandData.target_audience?.join(', ') || ''
  const toneOfVoice = brandData.tone_of_voice?.join(', ') || ''
  const colors = brandData.colors?.join(', ') || ''
  const fonts = brandData.fonts?.join(', ') || ''

  return `You are a creative AI tasked with generating Instagram carousel post concepts for the brand ${brandName}.

Brand Overview:
- Name: ${brandName}
${tagline ? `- Tagline: ${tagline}` : ''}
${businessOverview ? `- Business: ${businessOverview}` : ''}
${brandValues ? `- Brand Values: ${brandValues}` : ''}
${targetAudience ? `- Audience: ${targetAudience}` : ''}
${toneOfVoice ? `- Tone: ${toneOfVoice}` : ''}
${colors ? `- Colors: ${colors}` : ''}
${fonts ? `- Fonts: ${fonts}` : ''}

Instructions (Read carefully and follow exactly):

1. Generate **10 unique, bold, risky, and creative Instagram carousel post concepts** based on the above brand DNA.

2. Each post concept must include:
    - **idea:** A bold, catchy, high-impact idea that would stop people from scrolling.
    - **concept:** A strategic explanation linking the idea to brand values, tone, and audience.
    - **visual_style:** A clear, descriptive explanation of what the post should look like visually. Include details about the main subject, background, colors, text/logo placement, visual effects, and overall mood. This should be a simple description, not an image generation prompt.

3. Your ideas must emphasize:
- modern design
- future-forward creativity
- automation
- human-like interaction
- brand recognition

4. Avoid generic, boring, or “safe” ideas. Push boundaries.

5. For each concept, assign scores from 1–10:
- **creativity_score**
- **brand_alignment_score**
- **engagement_score**
- **clarity_score**
- **total_score** = average of the four scores (as a decimal)

6. Output EVERYTHING in a **valid JSON array** with EXACTLY this structure:

[
  {
    "idea": "...",
    "concept": "...",
    "visual_style": "FULL PROMPT HERE",
    "creativity_score": 0,
    "brand_alignment_score": 0,
    "engagement_score": 0,
    "clarity_score": 0,
    "total_score": 0.0
  },
  ...
]

IMPORTANT:
- Return **ONLY** valid JSON.
- Return **EXACTLY 10** concepts.
- Do NOT include any text outside the JSON.
- Each concept must have only **one** visual_style prompt.`
}

function parseIdeasWithScores(text: string): Array<{ 
  idea: string
  concept: string
  visual_style: string
  creativity_score: number
  brand_alignment_score: number
  engagement_score: number
  clarity_score: number
  total_score: number
}> {
  try {
    // Clean the text - remove any markdown code blocks
    let cleanedText = text.trim()
    cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    cleanedText = cleanedText.replace(/^[^{[]*/, '').replace(/[^}\]]*$/, '') // Remove text before [ and after ]
    
    // Replace placeholder X with a default value for parsing, then we'll recalculate
    cleanedText = cleanedText.replace(/:\s*X\s*([,}])/g, ': 5$1')
    cleanedText = cleanedText.replace(/:\s*"X"\s*([,}])/g, ': 5$1')
    
    // Try to extract JSON from the response
    const jsonMatch = cleanedText.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      let jsonStr = jsonMatch[0]
      
      // Try to fix common JSON issues
      jsonStr = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']') // Remove trailing commas
      jsonStr = jsonStr.replace(/([{,]\s*)(\w+)(\s*):/g, '$1"$2":') // Add quotes to unquoted keys
      
      const parsed = JSON.parse(jsonStr)
      
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Validate and clean the data
        return parsed
          .filter((item: any) => item && typeof item === 'object')
          .map((item: any) => {
            const creativity = parseScore(item.creativity_score || item.creativityScore || item['creativity_score'])
            const brandAlignment = parseScore(item.brand_alignment_score || item.brandAlignmentScore || item['brand_alignment_score'])
            const engagement = parseScore(item.engagement_score || item.engagementScore || item['engagement_score'])
            const clarity = parseScore(item.clarity_score || item.clarityScore || item['clarity_score'])
            
            // Recalculate total if it was invalid
            const total = (creativity + brandAlignment + engagement + clarity) / 4
            const providedTotal = parseScore(item.total_score || item.totalScore || item['total_score'])
            const finalTotal = (providedTotal >= 1 && providedTotal <= 10) ? providedTotal : total

            return {
              idea: item.idea || item.Idea || '',
              concept: item.concept || item.Concept || '',
              visual_style: item.visual_style || item.visualStyle || item['visual_style'] || '',
              creativity_score: creativity,
              brand_alignment_score: brandAlignment,
              engagement_score: engagement,
              clarity_score: clarity,
              total_score: Math.round(finalTotal * 10) / 10,
            }
          })
          .filter((item: any) => item.idea && item.concept && item.visual_style)
          .slice(0, 10)
      }
    }

    // Fallback: try parsing the entire cleaned text as JSON
    try {
      const parsed = JSON.parse(cleanedText)
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item: any) => item && typeof item === 'object')
          .map((item: any) => {
            const creativity = parseScore(item.creativity_score || item.creativityScore || item['creativity_score'])
            const brandAlignment = parseScore(item.brand_alignment_score || item.brandAlignmentScore || item['brand_alignment_score'])
            const engagement = parseScore(item.engagement_score || item.engagementScore || item['engagement_score'])
            const clarity = parseScore(item.clarity_score || item.clarityScore || item['clarity_score'])
            
            const total = (creativity + brandAlignment + engagement + clarity) / 4
            const providedTotal = parseScore(item.total_score || item.totalScore || item['total_score'])
            const finalTotal = (providedTotal >= 1 && providedTotal <= 10) ? providedTotal : total

            return {
              idea: item.idea || item.Idea || '',
              concept: item.concept || item.Concept || '',
              visual_style: item.visual_style || item.visualStyle || item['visual_style'] || '',
              creativity_score: creativity,
              brand_alignment_score: brandAlignment,
              engagement_score: engagement,
              clarity_score: clarity,
              total_score: Math.round(finalTotal * 10) / 10,
            }
          })
          .filter((item: any) => item.idea && item.concept && item.visual_style)
          .slice(0, 10)
      }
    } catch (e) {
      // Continue to fallback
    }
  } catch (error) {
    console.error('[OLLAMA] JSON parsing error:', error)
    console.error('[OLLAMA] Text that failed to parse:', text.substring(0, 500))
  }

  // If JSON parsing fails, return error message
  return [{
    idea: 'Failed to parse response',
    concept: 'The AI response could not be parsed as JSON. Please try regenerating.',
    visual_style: 'Error state',
    creativity_score: 5,
    brand_alignment_score: 5,
    engagement_score: 5,
    clarity_score: 5,
    total_score: 5,
  }]
}

function parseScore(value: any): number {
  if (typeof value === 'number') {
    return Math.max(1, Math.min(10, value))
  }
  if (typeof value === 'string') {
    const num = parseFloat(value)
    if (!isNaN(num)) {
      return Math.max(1, Math.min(10, num))
    }
  }
  return 5 // Default score
}

function buildFallbackIdeas(brandData: any) {
  const brandName = brandData?.brand_name || 'your brand'
  const primaryValue = brandData?.brand_values?.[0] || 'brand value'
  const audience = brandData?.target_audience?.[0] || 'audience'

  return Array.from({ length: 3 }, (_, index) => ({
    idea: `Fallback carousel idea ${index + 1} for ${brandName}`,
    concept: `Highlight ${primaryValue} for ${audience} with a clear CTA`,
    visual_style: 'Clean, on-brand colors with simple typography and product focus.',
    creativity_score: 5,
    brand_alignment_score: 6,
    engagement_score: 5,
    clarity_score: 6,
    total_score: 5.5,
  }))
}

function logFallbackError(err: any) {
  const message = err?.message || 'Unknown model error'
  const logger = process.env.NODE_ENV === 'test' ? console.warn : console.error
  logger('[OLLAMA] Primary generation failed, using fallback:', message)
}

