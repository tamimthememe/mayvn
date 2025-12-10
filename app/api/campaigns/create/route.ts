import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

type CampaignPayload = {
  name: string
  goals: string[]
  platforms: string[]
  audience: string[]
  description?: string
}

const DATA_DIR = path.join(process.cwd(), "data")
const DATA_FILE = path.join(DATA_DIR, "campaigns.json")

async function ensureFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.access(DATA_FILE)
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf-8")
  }
}

async function readCampaigns() {
  await ensureFile()
  const raw = await fs.readFile(DATA_FILE, "utf-8")
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeCampaigns(data: any[]) {
  await ensureFile()
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8")
}

function validatePayload(body: any): { valid: boolean; errors?: string[] } {
  const errors: string[] = []
  if (!body?.name) errors.push("name is required")
  if (!Array.isArray(body?.goals) || body.goals.length === 0) errors.push("goals are required")
  if (!Array.isArray(body?.platforms) || body.platforms.length === 0) errors.push("platforms are required")
  if (!Array.isArray(body?.audience) || body.audience.length === 0) errors.push("audience is required")
  return { valid: errors.length === 0, errors }
}

function isAuthorized(req: NextRequest) {
  const userHeader = req.headers.get("x-user-id")
  return Boolean(userHeader)
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({
    fields: ["name", "goals", "platforms", "audience"],
    required: ["name", "goals", "platforms", "audience"],
  })
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()

  const validation = validatePayload(body)
  if (!validation.valid) {
    return NextResponse.json({ error: "Validation failed", details: validation.errors }, { status: 400 })
  }

  if (body.forceFail) {
    return NextResponse.json({ error: "Simulated persistence failure" }, { status: 503 })
  }

  const campaigns = await readCampaigns()
  const now = new Date().toISOString()
  const campaign = {
    id: crypto.randomUUID(),
    name: body.name,
    goals: body.goals,
    platforms: body.platforms,
    audience: body.audience,
    description: body.description || "",
    createdAt: now,
  }

  campaigns.push(campaign)
  await writeCampaigns(campaigns)

  return NextResponse.json({ campaign })
}

