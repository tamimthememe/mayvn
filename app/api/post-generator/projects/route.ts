import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

type StoredProject = {
  id: string
  title: string
  brandId?: string
  frames: any[]
  createdAt: string
  updatedAt: string
}

const DATA_DIR = path.join(process.cwd(), "data")
const DATA_FILE = path.join(DATA_DIR, "post-projects.json")

async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.access(DATA_FILE)
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf-8")
  }
}

async function readProjects(): Promise<StoredProject[]> {
  await ensureDataFile()
  const raw = await fs.readFile(DATA_FILE, "utf-8")
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeProjects(projects: StoredProject[]) {
  await ensureDataFile()
  await fs.writeFile(DATA_FILE, JSON.stringify(projects, null, 2), "utf-8")
}

export async function GET() {
  const projects = await readProjects()
  return NextResponse.json({ projects })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, brandId, frames } = body

    if (!Array.isArray(frames)) {
      return NextResponse.json({ error: "frames array is required" }, { status: 400 })
    }

    const projects = await readProjects()
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const project: StoredProject = {
      id,
      title: title || "Untitled project",
      brandId,
      frames,
      createdAt: now,
      updatedAt: now,
    }

    projects.push(project)
    await writeProjects(projects)

    return NextResponse.json({ project })
  } catch (err) {
    console.error("[projects POST] error", err)
    return NextResponse.json({ error: "Failed to save project" }, { status: 500 })
  }
}



