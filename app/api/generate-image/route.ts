import { NextRequest, NextResponse } from 'next/server'

/**
 * Image Generation API
 * 
 * Generates images from prompts using Stable Diffusion (via Python service)
 * Phase 2: Mock implementation with validation and prompt parsing
 */

// Configure route to allow long-running requests (CPU image generation can take 5-15 minutes)
export const maxDuration = 1800 // 30 minutes (Vercel Pro plan max, adjust for your hosting)
export const runtime = 'nodejs' // Use Node.js runtime for longer timeouts

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

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, frameId, width, height, brandData } = body

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
    
    // Extract brand_id from brandData if available
    let brandId: string | undefined = undefined
    if (brandData) {
      // Prefer Firestore document ID, fallback to normalized brand_name
      brandId = brandData.id || (brandData.brand_name ? brandData.brand_name.toLowerCase().replace(/[^\w\-_]/g, '_').replace(/_+/g, '_').trim() : undefined)
      if (brandId) {
        console.log('[IMAGE-GEN] Brand ID:', brandId)
      }
    }

    // Step 2.4: Call Python service for async image generation
    try {
      const pythonServicePayload: any = {
        prompt: positivePrompt,
        negative_prompt: negativePrompt,
        width: imageWidth,
        height: imageHeight,
        num_inference_steps: 30, // Default steps for good quality
      }
      
      // Add brand_id if available
      if (brandId) {
        pythonServicePayload.brand_id = brandId
        pythonServicePayload.lora_weights = 0.8 // Default LoRA weight
      }
      
      // Add brand_data for metadata storage
      if (brandData) {
        pythonServicePayload.brand_data = brandData
      }
      
      console.log('[IMAGE-GEN] Creating async job:', PYTHON_SERVICE_URL)
      console.log('[IMAGE-GEN] Payload:', JSON.stringify(pythonServicePayload, null, 2).substring(0, 500))
      
      // Step 1: Create async job (returns immediately with job_id)
      const jobResponse = await fetch(`${PYTHON_SERVICE_URL}/generate-async`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pythonServicePayload),
        signal: AbortSignal.timeout(10000), // 10 second timeout for job creation
      })
      
      if (!jobResponse.ok) {
        const errorText = await jobResponse.text()
        throw new Error(`Failed to create job: ${jobResponse.status} ${errorText}`)
      }
      
      const jobData = await jobResponse.json()
      const jobId = jobData.job_id
      
      console.log('[IMAGE-GEN] Job created:', jobId)
      
      // Step 2: Poll for job completion
      const maxPollAttempts = 180 // 30 minutes max (180 * 10 seconds)
      const pollInterval = 10000 // Poll every 10 seconds
      let pollAttempts = 0
      
      while (pollAttempts < maxPollAttempts) {
        await new Promise(resolve => setTimeout(resolve, pollInterval))
        pollAttempts++
        
        console.log(`[IMAGE-GEN] Polling job status (attempt ${pollAttempts}/${maxPollAttempts})...`)
        
        const statusResponse = await fetch(`${PYTHON_SERVICE_URL}/job/${jobId}/status`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000), // 5 second timeout for status check
        })
        
        if (!statusResponse.ok) {
          throw new Error(`Failed to check job status: ${statusResponse.status}`)
        }
        
        const statusData = await statusResponse.json()
        console.log(`[IMAGE-GEN] Job status: ${statusData.status}`)
        
        if (statusData.status === 'completed') {
          // Job completed successfully
          if (statusData.result && statusData.result.success && statusData.result.image_base64) {
            const pythonData = statusData.result
            
            console.log('[IMAGE-GEN] Job completed successfully')
            
            const imageUrl = pythonData.image_base64
            
            // Verify it's a valid data URI
            if (!imageUrl.startsWith('data:image/')) {
              console.warn('[IMAGE-GEN] Image base64 does not start with data:image/, may be invalid')
            }
            
            return NextResponse.json({
              success: true,
              imageUrl: imageUrl,
              parsedPrompt: {
                positive: positivePrompt,
                negative: negativePrompt
              },
              dimensions: {
                width: imageWidth,
                height: imageHeight
              },
              frameId: frameId,
              device: pythonData.device,
              mock: pythonData.mock || false
            })
          } else {
            throw new Error('Job completed but no image data in result')
          }
        } else if (statusData.status === 'failed') {
          // Job failed
          throw new Error(statusData.error || 'Image generation failed')
        }
        // If status is 'pending' or 'processing', continue polling
      }
      
      // If we've exhausted all polling attempts
      throw new Error('Image generation timed out after 30 minutes')
      
    } catch (fetchError: any) {
      // If Python service is not available, provide helpful error message
      if (fetchError.name === 'AbortError' || 
          fetchError.code === 'ECONNREFUSED' || 
          fetchError.message?.includes('fetch failed') ||
          fetchError.message?.includes('ERR_NAME_NOT_RESOLVED') ||
          fetchError.message?.includes('Cannot connect to Python service')) {
        
        console.error('[IMAGE-GEN] Python service connection error:', fetchError.message)
        console.error('[IMAGE-GEN] Service URL:', PYTHON_SERVICE_URL)
        
        // Don't return mock - return an error so user knows to start the service
        return NextResponse.json(
          {
            error: 'Python service unavailable',
            details: `Cannot connect to image generation service at ${PYTHON_SERVICE_URL}. Please start the Python service by running: cd python-service && python main.py`,
            serviceUrl: PYTHON_SERVICE_URL,
            hint: 'Make sure the Python service is running on port 8000'
          },
          { status: 503 } // Service Unavailable
        )
      }
      
      // For other errors, re-throw with better context
      console.error('[IMAGE-GEN] Unexpected error:', fetchError)
      throw fetchError
    }

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



