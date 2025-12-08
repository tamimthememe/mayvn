import { NextRequest, NextResponse } from 'next/server'

/**
 * Image Generation API
 * 
 * Generates images from prompts using Stable Diffusion (via Python service)
 * Phase 2: Mock implementation with validation and prompt parsing
 */

/**
 * Parse prompt with --neg format into positive and negative prompts
 * Example: "prompt text --neg blurry, --neg text" 
 * Returns: { positivePrompt: "prompt text", negativePrompt: "blurry, text" }
 */
function parsePrompt(fullPrompt: string): { positivePrompt: string; negativePrompt: string } {
  if (!fullPrompt || typeof fullPrompt !== 'string') {
    return {
      positivePrompt: '',
      negativePrompt: 'blurry, low-resolution, distorted, text, watermark'
    }
  }

  // Check if prompt contains --neg separator
  if (fullPrompt.includes(' --neg ')) {
    const parts = fullPrompt.split(' --neg ', 2)
    const positivePrompt = parts[0].trim()
    
    // Extract negative prompts and clean up --neg prefixes
    let negativePrompt = parts[1] || ''
    negativePrompt = negativePrompt.replace(/--neg\s*/g, '').trim()
    
    // Ensure we have default negative prompts if none provided
    const defaultNegatives = 'blurry, low-resolution, distorted, text, watermark, logo, brand mark, signature'
    if (!negativePrompt) {
      negativePrompt = defaultNegatives
    } else {
      // Add default negatives if not already present
      const negativesList = negativePrompt.split(',').map(n => n.trim().toLowerCase())
      const defaultList = defaultNegatives.split(',').map(n => n.trim().toLowerCase())
      const missingDefaults = defaultList.filter(d => !negativesList.includes(d))
      if (missingDefaults.length > 0) {
        negativePrompt = `${negativePrompt}, ${missingDefaults.join(', ')}`
      }
    }
    
    return {
      positivePrompt,
      negativePrompt
    }
  }
  
  // No --neg found, return full prompt as positive with default negatives
  return {
    positivePrompt: fullPrompt.trim(),
    negativePrompt: 'blurry, low-resolution, distorted, text, watermark, logo, brand mark, signature, text artifacts, words, letters, typography, writing'
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, frameId, width, height } = body

    // Step 2.2: Request validation
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { 
          error: 'Prompt is required',
          details: 'Please provide a valid prompt string'
        },
        { status: 400 }
      )
    }

    if (!frameId || typeof frameId !== 'string') {
      return NextResponse.json(
        { 
          error: 'Frame ID is required',
          details: 'Please provide a valid frame ID'
        },
        { status: 400 }
      )
    }

    // Width and height are optional, but validate if provided
    const imageWidth = width && typeof width === 'number' && width > 0 ? width : 1024
    const imageHeight = height && typeof height === 'number' && height > 0 ? height : 1024

    // Validate dimensions (reasonable limits)
    if (imageWidth > 2048 || imageHeight > 2048) {
      return NextResponse.json(
        { 
          error: 'Invalid dimensions',
          details: 'Image dimensions cannot exceed 2048px'
        },
        { status: 400 }
      )
    }

    // Step 2.3: Parse prompt
    const { positivePrompt, negativePrompt } = parsePrompt(prompt)

    console.log('[IMAGE-GEN] Generating image for frame:', frameId)
    console.log('[IMAGE-GEN] Positive prompt:', positivePrompt.substring(0, 100) + '...')
    console.log('[IMAGE-GEN] Negative prompt:', negativePrompt.substring(0, 100) + '...')
    console.log('[IMAGE-GEN] Dimensions:', imageWidth, 'x', imageHeight)

    // Step 2.4: Mock response (will be replaced in Phase 6 with actual Python service call)
    // For now, return a placeholder image URL
    const mockImageUrl = `https://via.placeholder.com/${imageWidth}x${imageHeight}?text=Image+Generation+Coming+Soon`

    return NextResponse.json({
      success: true,
      imageUrl: mockImageUrl,
      parsedPrompt: {
        positive: positivePrompt,
        negative: negativePrompt
      },
      dimensions: {
        width: imageWidth,
        height: imageHeight
      },
      frameId: frameId,
      // Phase 2 mock indicator
      mock: true
    })

  } catch (error: any) {
    console.error('[IMAGE-GEN] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })

    return NextResponse.json(
      {
        error: 'Failed to generate image',
        details: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

