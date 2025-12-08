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

async function readProjects(): Promise<StoredProject[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8")
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeProjects(projects: StoredProject[]) {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(DATA_FILE, JSON.stringify(projects, null, 2), "utf-8")
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const projects = await readProjects()
  const project = projects.find((p) => p.id === params.id)
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json({ project })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { title, frames } = body

    const projects = await readProjects()
    const idx = projects.findIndex((p) => p.id === params.id)
    if (idx === -1) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const existing = projects[idx]
    const updated: StoredProject = {
      ...existing,
      title: title ?? existing.title,
      frames: Array.isArray(frames) ? frames : existing.frames,
      updatedAt: new Date().toISOString(),
    }

    projects[idx] = updated
    await writeProjects(projects)

    return NextResponse.json({ project: updated })
  } catch (err) {
    console.error("[projects PUT] error", err)
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
  }
}



