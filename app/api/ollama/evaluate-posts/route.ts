import { NextRequest, NextResponse } from 'next/server'

/**
 * OLLAMA Post Evaluation API
 * 
 * Uses OLLAMA qwen2.5:1.5b model to evaluate carousel post concepts with scores
 */

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const MODEL_NAME = process.env.OLLAMA_MODEL || 'qwen2.5:1.5b'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { brandData, posts } = body

    if (!brandData) {
      return NextResponse.json(
        { error: 'Brand data is required' },
        { status: 400 }
      )
    }

    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json(
        { error: 'Posts array is required' },
        { status: 400 }
      )
    }

    // Build prompt using brand data and posts
    const prompt = buildPrompt(brandData, posts)

    console.log('[OLLAMA] Evaluating', posts.length, 'carousel post concepts for brand:', brandData.brand_name)
    console.log('[OLLAMA] Using model:', MODEL_NAME)

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minute timeout

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
            temperature: 0.7,
            top_p: 0.9,
          },
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[OLLAMA] Error response:', errorText)
        throw new Error(`OLLAMA API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const generatedText = data.response || ''

      // Parse the generated scores (expecting JSON)
      const evaluatedPosts = parseScores(generatedText, posts)

      console.log('[OLLAMA] Evaluated', evaluatedPosts.length, 'posts')

      return NextResponse.json({
        success: true,
        posts: evaluatedPosts,
        rawResponse: generatedText,
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        console.error('[OLLAMA] Request timeout after 2 minutes')
        throw new Error('Evaluation timed out. OLLAMA is taking too long to respond.')
      }
      
      if (fetchError.code === 'ECONNREFUSED' || fetchError.message?.includes('fetch failed')) {
        console.error('[OLLAMA] Connection refused')
        throw new Error(`Cannot connect to OLLAMA at ${OLLAMA_URL}`)
      }
      
      throw fetchError
    }
  } catch (error: any) {
    console.error('[OLLAMA] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })

    return NextResponse.json(
      {
        error: 'Failed to evaluate posts',
        details: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

function buildPrompt(brandData: any, posts: Array<{ idea: string; concept: string; visual_style: string }>): string {
  const brandName = brandData.brand_name || 'the brand'
  const tagline = brandData.tagline || ''
  const businessOverview = brandData.business_overview || ''
  const brandValues = brandData.brand_values?.join(', ') || ''
  const targetAudience = brandData.target_audience?.join(', ') || ''
  const toneOfVoice = brandData.tone_of_voice?.join(', ') || ''
  const colors = brandData.colors?.join(', ') || ''
  const fonts = brandData.fonts?.join(', ') || ''

  const postsText = posts.map((post, index) => 
    `Post ${index + 1}:
- Idea: ${post.idea}
- Concept: ${post.concept}
- Visual Style: ${post.visual_style}`
  ).join('\n\n')

  return `You are a marketing AI tasked with evaluating Instagram carousel post concepts for the brand ${brandName}.

Brand Overview:
- Name: ${brandName}
${tagline ? `- Tagline: ${tagline}` : ''}
${businessOverview ? `- Business: ${businessOverview}` : ''}
${brandValues ? `- Brand Values: ${brandValues}` : ''}
${targetAudience ? `- Audience: ${targetAudience}` : ''}
${toneOfVoice ? `- Tone: ${toneOfVoice}` : ''}
${colors ? `- Colors: ${colors}` : ''}
${fonts ? `- Fonts: ${fonts}` : ''}

Input:

You will receive a list of Instagram carousel post ideas, each with:
- Idea
- Concept
- Visual Style

Task:

For each post idea, assign a **score from 1 to 10** for the following factors:
1. **Creativity / Boldness:** How unique and attention-grabbing the idea is
2. **Brand Alignment:** How well it reflects ${brandName}'s values and DNA
3. **Engagement Potential:** Likelihood of driving clicks, shares, and saves
4. **Clarity / Understandability:** How easy it is for the audience to grasp the message

Output format (JSON):

[
  {
    "idea": "...",
    "creativity_score": 8,
    "brand_alignment_score": 7,
    "engagement_score": 9,
    "clarity_score": 8,
    "total_score": 8.0
  },
  ...
]

IMPORTANT:
- Use actual numbers from 1 to 10 for all scores (not X or placeholders)
- total_score should be the average of the 4 factor scores, calculated as a decimal number
- Return ONLY valid JSON, no additional text before or after
- Make sure all scores are numbers, not strings

Posts to evaluate:

${postsText}

Evaluate all ${posts.length} posts and return the scores in JSON format:`
}

function parseScores(text: string, originalPosts: Array<{ idea: string; concept: string; visual_style: string }>): Array<{
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
        // Match evaluated posts with original posts by idea
        return originalPosts.map((originalPost, index) => {
          const evaluated = parsed[index] || parsed.find((p: any) => 
            p.idea && (p.idea.includes(originalPost.idea.substring(0, 20)) || originalPost.idea.includes(p.idea.substring(0, 20)))
          ) || {}

          const creativity = parseScore(evaluated.creativity_score || evaluated.creativityScore || evaluated['creativity_score'])
          const brandAlignment = parseScore(evaluated.brand_alignment_score || evaluated.brandAlignmentScore || evaluated['brand_alignment_score'])
          const engagement = parseScore(evaluated.engagement_score || evaluated.engagementScore || evaluated['engagement_score'])
          const clarity = parseScore(evaluated.clarity_score || evaluated.clarityScore || evaluated['clarity_score'])
          
          // Recalculate total if it was invalid
          const total = (creativity + brandAlignment + engagement + clarity) / 4
          const providedTotal = parseScore(evaluated.total_score || evaluated.totalScore || evaluated['total_score'])
          const finalTotal = (providedTotal >= 1 && providedTotal <= 10) ? providedTotal : total

          return {
            ...originalPost,
            creativity_score: creativity,
            brand_alignment_score: brandAlignment,
            engagement_score: engagement,
            clarity_score: clarity,
            total_score: Math.round(finalTotal * 10) / 10, // Round to 1 decimal
          }
        })
      }
    }

    // Fallback: try parsing the entire cleaned text as JSON
    try {
      const parsed = JSON.parse(cleanedText)
      if (Array.isArray(parsed)) {
        return originalPosts.map((originalPost, index) => {
          const evaluated = parsed[index] || {}
          const creativity = parseScore(evaluated.creativity_score || evaluated.creativityScore || evaluated['creativity_score'])
          const brandAlignment = parseScore(evaluated.brand_alignment_score || evaluated.brandAlignmentScore || evaluated['brand_alignment_score'])
          const engagement = parseScore(evaluated.engagement_score || evaluated.engagementScore || evaluated['engagement_score'])
          const clarity = parseScore(evaluated.clarity_score || evaluated.clarityScore || evaluated['clarity_score'])
          
          const total = (creativity + brandAlignment + engagement + clarity) / 4
          const providedTotal = parseScore(evaluated.total_score || evaluated.totalScore || evaluated['total_score'])
          const finalTotal = (providedTotal >= 1 && providedTotal <= 10) ? providedTotal : total

          return {
            ...originalPost,
            creativity_score: creativity,
            brand_alignment_score: brandAlignment,
            engagement_score: engagement,
            clarity_score: clarity,
            total_score: Math.round(finalTotal * 10) / 10,
          }
        })
      }
    } catch (e) {
      // Continue to fallback
    }
  } catch (error) {
    console.error('[OLLAMA] JSON parsing error:', error)
    console.error('[OLLAMA] Text that failed to parse:', text.substring(0, 500))
  }

  // Fallback: return original posts with default scores
  console.warn('[OLLAMA] Using fallback scores - could not parse LLM response')
  return originalPosts.map(post => ({
    ...post,
    creativity_score: 5,
    brand_alignment_score: 5,
    engagement_score: 5,
    clarity_score: 5,
    total_score: 5,
  }))
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

