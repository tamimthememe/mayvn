import { describe, it, expect, beforeEach } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import { GET, POST } from '../app/api/campaigns/create/route'

const dataFile = path.join(process.cwd(), 'data', 'campaigns.json')

const authHeaders = { 'x-user-id': 'tester' }

const makeRequest = (method: 'GET' | 'POST', payload?: any, headers: Record<string, string> = authHeaders) =>
  ({
    headers: new Headers(headers),
    json: async () => payload,
    method,
  }) as any

beforeEach(async () => {
  await fs.mkdir(path.dirname(dataFile), { recursive: true })
  await fs.writeFile(dataFile, '[]', 'utf-8')
})

describe('Create Campaign API', () => {
  it('TC_C1 authorized user can access Create Campaign form fields', async () => {
    console.info('🧪 TC_C1 start: authorized user loads form fields')
    const res = await GET(makeRequest('GET'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.fields).toEqual(expect.arrayContaining(['name', 'goals', 'platforms', 'audience']))
    console.info('✅ TC_C1 pass: fields returned', body.fields)
  })

  it('TC_C2 successful creation with valid details', async () => {
    console.info('🧪 TC_C2 start: create campaign with valid payload')
    const payload = {
      name: 'Gen-Z Summer Push',
      goals: ['awareness', 'engagement'],
      platforms: ['instagram', 'tiktok'],
      audience: ['gen-z-18-24'],
    }

    const res = await POST(makeRequest('POST', payload))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.campaign).toMatchObject({
      name: payload.name,
      goals: payload.goals,
      platforms: payload.platforms,
      audience: payload.audience,
    })

    const stored = JSON.parse(await fs.readFile(dataFile, 'utf-8'))
    expect(stored).toHaveLength(1)
    console.info('✅ TC_C2 pass: stored campaigns=', stored.length)
  })

  it('TC_C3 shows validation errors for missing required fields', async () => {
    console.info('🧪 TC_C3 start: validation errors on missing fields')
    const res = await POST(makeRequest('POST', { name: '', goals: [], platforms: [], audience: [] }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.details).toEqual(expect.arrayContaining(['name is required', 'goals are required']))
    console.info('✅ TC_C3 pass: validation messages=', body.details)
  })

  it('TC_C4 blocks unauthorized users', async () => {
    console.info('🧪 TC_C4 start: unauthorized access')
    const res = await POST(makeRequest('POST', {}, {}))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toContain('Unauthorized')
    console.info('✅ TC_C4 pass: unauthorized blocked')
  })

  it('TC_C5 retries/handles persistence failure', async () => {
    console.info('🧪 TC_C5 start: simulated DB failure')
    const payload = {
      name: 'Gen-Z Summer Push',
      goals: ['awareness'],
      platforms: ['instagram'],
      audience: ['gen-z-18-24'],
      forceFail: true,
    }

    const res = await POST(makeRequest('POST', payload))
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.error).toContain('failure')

    const stored = JSON.parse(await fs.readFile(dataFile, 'utf-8'))
    expect(stored).toHaveLength(0)
    console.info('✅ TC_C5 pass: no campaigns persisted on failure')
  })
})

