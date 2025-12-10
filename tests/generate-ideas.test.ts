import { describe, it, expect, vi, afterEach } from 'vitest'
import { POST as generateIdeas } from '../app/api/ollama/generate-ideas/route'

const sampleBrand = {
  brand_name: 'Acme Brand',
  tagline: 'Do more with less',
  brand_values: ['innovation', 'trust'],
  target_audience: ['creators', 'marketers'],
  tone_of_voice: ['playful', 'confident'],
  colors: ['#000000', '#FFFFFF'],
  fonts: ['Inter'],
}

const makeRequest = (jsonData: any) =>
  ({
    json: vi.fn().mockResolvedValue(jsonData),
  }) as any

const buildIdeasPayload = () =>
  Array.from({ length: 10 }, (_, index) => ({
    idea: `Idea ${index + 1}`,
    concept: `Concept ${index + 1}`,
    visual_style: `Visual ${index + 1}`,
    creativity_score: 8,
    brand_alignment_score: 8,
    engagement_score: 8,
    clarity_score: 8,
    total_score: 8,
  }))

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('Generate ideas API', () => {
  it('TC_G1 user can trigger generation for an existing campaign', async () => {
    console.info('🧪 TC_G1 start: user triggers content generation')
    const ideas = buildIdeasPayload()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ response: JSON.stringify(ideas) }), {
          status: 200,
        })
      )
    )

    const res = await generateIdeas(makeRequest({ brandData: sampleBrand }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.ideas).toHaveLength(10)
    console.info('✅ TC_G1 pass: generation returned ideas=', body.ideas.length)
  })

  it('TC_G2 returns structured AI content with valid campaign data', async () => {
    console.info('🧪 TC_G2 start: structured AI content with valid data')
    const ideas = buildIdeasPayload()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ response: JSON.stringify(ideas) }), {
          status: 200,
        })
      )
    )

    const res = await generateIdeas(makeRequest({ brandData: sampleBrand }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.ideas[0]).toMatchObject({
      idea: expect.any(String),
      concept: expect.any(String),
      visual_style: expect.any(String),
      creativity_score: expect.any(Number),
      brand_alignment_score: expect.any(Number),
      engagement_score: expect.any(Number),
      clarity_score: expect.any(Number),
      total_score: expect.any(Number),
    })
    console.info('✅ TC_G2 pass: first idea keys OK')
  })

  it('TC_G3 handles missing campaign context with a clear error', async () => {
    console.info('🧪 TC_G3 start: missing campaign context')
    const res = await generateIdeas(makeRequest({}))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toContain('Brand data is required')
    console.info('✅ TC_G3 pass: validation error returned')
  })

  it('TC_G4 falls back when model inference fails', async () => {
    console.info('🧪 TC_G4 start: model failure fallback')
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('model timeout')))

    const res = await generateIdeas(makeRequest({ brandData: sampleBrand }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.fallback).toBe(true)
    expect(body.ideas.length).toBeGreaterThan(0)
    console.info('✅ TC_G4 pass: fallback ideas count=', body.ideas.length)
  })
})

