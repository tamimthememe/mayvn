import { NextRequest, NextResponse } from 'next/server'

/**
 * OLLAMA Image Prompt Generator API
 * 
 * Generates a production-ready image generation prompt for a specific post idea
 */

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const MODEL_NAME = process.env.OLLAMA_MODEL || 'qwen2.5:1.5b'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { idea, concept, brandData } = body

    if (!idea || !concept || !brandData) {
      return NextResponse.json(
        { error: 'Idea, concept, and brand data are required' },
        { status: 400 }
      )
    }

    // Build prompt for image generation
    const prompt = buildImagePromptPrompt(idea, concept, brandData)

    console.log('[OLLAMA] Generating image prompt for idea:', idea.substring(0, 50))
    console.log('[OLLAMA] Using model:', MODEL_NAME)

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 1 minute timeout

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
        throw new Error(`OLLAMA API error: ${response.status} ${response.statusText}. Make sure OLLAMA is running and the model ${MODEL_NAME} is installed.`)
      }

      const data = await response.json()
      const generatedText = data.response || ''

      console.log('[OLLAMA] Raw response length:', generatedText.length)
      console.log('[OLLAMA] Raw response preview:', generatedText.substring(0, 200))

      // Parse and clean the image prompt
      const imagePrompt = parseImagePrompt(generatedText)

      return NextResponse.json({
        success: true,
        imagePrompt,
        rawResponse: generatedText,
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        console.error('[OLLAMA] Request timeout after 1 minute')
        throw new Error('Request timed out. OLLAMA is taking too long to respond.')
      }
      
      if (fetchError.code === 'ECONNREFUSED' || fetchError.message?.includes('fetch failed')) {
        console.error('[OLLAMA] Connection refused')
        throw new Error(`Cannot connect to OLLAMA at ${OLLAMA_URL}. Make sure OLLAMA is running: ollama serve`)
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
        error: 'Failed to generate image prompt',
        details: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

function buildImagePromptPrompt(idea: string, concept: string, brandData: any): string {
  const brandName = brandData.brand_name || 'the brand'
  const tagline = brandData.tagline || ''
  const brandValues = brandData.brand_values?.join(', ') || ''
  const targetAudience = brandData.target_audience?.join(', ') || ''
  const toneOfVoice = brandData.tone_of_voice?.join(', ') || ''
  const colors = brandData.colors?.join(', ') || ''
  const fonts = brandData.fonts?.join(', ') || ''

  return `You are an expert AI prompt engineer specialized in creating high-end image-generation prompts.

Brand Context:
- Brand: ${brandName}
${tagline ? `- Tagline: ${tagline}` : ''}
${brandValues ? `- Brand Values: ${brandValues}` : ''}
${targetAudience ? `- Target Audience: ${targetAudience}` : ''}
${toneOfVoice ? `- Tone of Voice: ${toneOfVoice}` : ''}
${colors ? `- Brand Colors: ${colors} (CRITICAL: These colors MUST be prominently featured in the image)` : ''}
${fonts ? `- Brand Fonts: ${fonts}` : ''}

User's Request: ${concept}

Your task: Generate a SINGLE, production-ready image generation prompt for this Instagram carousel post. The user's request describes the main subject and what they want to see in the image. Use their description as the foundation for the main subject and visual elements.

CRITICAL COLOR REQUIREMENTS:
${colors ? `- The brand colors "${colors}" MUST be the PRIMARY color palette used throughout the image
- These colors should dominate the background, accents, text, and key visual elements
- Use these exact brand colors as the foundation for the entire color scheme
- Ensure brand colors are prominent and immediately recognizable
- Integrate brand colors into gradients, overlays, highlights, and shadows where appropriate` : '- Use colors that align with the brand identity and post concept'}

STYLE-SELECTION RULES:
- If the subject involves a physical object, product, food, or person → use hyperrealism
- If the subject involves UI, dashboards, interfaces, apps, SaaS, tech → use minimalism or clean vector aesthetic
- If the subject is futuristic, conceptual, or AI-related → use neon, holographic, or cyberpunk 3D
- If the subject is branding or corporate → use clean grids, soft shadows, and accent colors
- If the concept calls for creativity → choose digital illustration, 3D stylized, or other fitting styles

REQUIRED ELEMENTS:
1. Describe in detail what the image should look like based on the user's request:
   - **MAIN SUBJECT: Use the user's request ("${concept}") to determine and describe the main subject. The main subject described in the user's request MUST be the primary focus and MUST be centered in the frame.**
   ${colors ? `- **PRIMARY FOCUS**: Use the brand colors "${colors}" as the dominant color scheme throughout the entire image
   - Specify exactly how these brand colors appear: as background gradients, accent highlights, border colors, etc.
   - Ensure brand colors are the most prominent visual element` : ''}
   - **COMPOSITION: The main subject from the user's request MUST be centered in the frame, positioned at the center of the image**
   - Visual elements and details based on the user's request (centered)
   - Background, colors, and overall aesthetic (${colors ? `heavily featuring brand colors "${colors}"` : 'aligned with brand identity'})
   - Mood, atmosphere, and style that matches the brand and the user's request
   - **CRITICAL: The image must contain NO TEXT, NO WORDS, NO LETTERS, NO TYPOGRAPHY, NO LOGO, NO BRAND MARKS, and NO WATERMARKS of any kind. This is a pure visual image only with just the subject and background.**

2. While describing, naturally incorporate these quality tags:
   hyper-realistic, (8k ultra-detailed), macro lens, sharp focus, cinematic lighting

3. While describing, naturally incorporate these composition tags:
   centered composition (main subject at center), soft shadows, shallow depth of field

4. At the end, include these negative prompts:
   --neg blurry, --neg low-resolution, --neg distorted anatomy, --neg text artifacts, --neg messy background, --neg oversaturated colors, --neg text, --neg words, --neg letters, --neg typography, --neg writing, --neg logo, --neg watermark, --neg brand mark, --neg signature

OUTPUT FORMAT:
Create a SINGLE, flowing prompt that explains the image in detail based on the user's request ("${concept}") while naturally incorporating all the required tags. ${colors ? `Make sure to explicitly mention and emphasize the brand colors "${colors}" throughout the description.` : ''} The format should be:

"[Start by describing the main subject from the user's request (${concept}) centered in the frame, ${colors ? `then describe how brand colors "${colors}" are used as the primary palette, ` : ''}including detailed visual description of the subject, background (${colors ? `featuring brand colors "${colors}"` : 'with brand-aligned colors'}), colors, visual effects, mood, naturally incorporating: hyper-realistic, (8k ultra-detailed), macro lens, sharp focus, cinematic lighting, centered composition, soft shadows, shallow depth of field] --neg blurry, --neg low-resolution, --neg distorted anatomy, --neg text artifacts, --neg messy background, --neg oversaturated colors, --neg text, --neg words, --neg letters, --neg typography, --neg writing, --neg logo, --neg watermark, --neg brand mark, --neg signature"

IMPORTANT:
- Return ONLY the image generation prompt
- Do NOT include any explanation, labels, or additional text
- Make it a single, continuous prompt optimized for professional image generation
- The prompt should be specific to this post idea and brand
${colors ? `- **MOST IMPORTANT**: The brand colors "${colors}" must be explicitly mentioned and described as the primary color scheme in the prompt` : ''}

Generate the image prompt now:`
}

function parseImagePrompt(text: string): string {
  try {
    // Clean the text
    let cleaned = text.trim()
    
    // Remove markdown code blocks if present
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    
    // Remove common prefixes like "Image Prompt:" or "Prompt:"
    cleaned = cleaned.replace(/^(image\s+)?prompt:?\s*/i, '')
    
    // Remove quotes if the entire response is wrapped in quotes
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
        (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
      cleaned = cleaned.slice(1, -1)
    }
    
    // Extract the prompt if it's in a JSON structure
    const jsonMatch = cleaned.match(/"image[_\s]?prompt"\s*:\s*"([^"]+)"/i)
    if (jsonMatch) {
      return jsonMatch[1]
    }
    
    // If it looks like JSON, try to parse it
    if (cleaned.startsWith('{') || cleaned.startsWith('[')) {
      try {
        const parsed = JSON.parse(cleaned)
        if (typeof parsed === 'string') {
          return parsed
        }
        if (parsed.imagePrompt || parsed.image_prompt || parsed.prompt) {
          return parsed.imagePrompt || parsed.image_prompt || parsed.prompt
        }
      } catch (e) {
        // Not valid JSON, continue
      }
    }
    
    // Return the cleaned text (first 2000 chars to avoid extremely long prompts)
    return cleaned.substring(0, 2000).trim()
  } catch (error) {
    console.error('[OLLAMA] Error parsing image prompt:', error)
    return text.trim().substring(0, 2000)
  }
}

