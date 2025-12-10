import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

type EnvConfig = {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
}

function getConfig(): EnvConfig {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 0)
  const secure = String(process.env.SMTP_SECURE || "").toLowerCase() === "true"
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM || user || ""

  if (!host || !port || !user || !pass || !from) {
    const missing = [
      ["SMTP_HOST", host],
      ["SMTP_PORT", port],
      ["SMTP_SECURE", process.env.SMTP_SECURE],
      ["SMTP_USER", user],
      ["SMTP_PASS", pass ? "***" : ""],
      ["SMTP_FROM", from],
    ]
      .filter(([, v]) => !v)
      .map(([k]) => k)
    throw new Error(`Missing SMTP env: ${missing.join(", ")}`)
  }

  return { host, port, secure, user, pass, from }
}

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, text } = await request.json()

    if (!Array.isArray(to) || to.length === 0) {
      return NextResponse.json({ error: "to[] is required" }, { status: 400 })
    }
    if (!subject || typeof subject !== "string") {
      return NextResponse.json({ error: "subject is required" }, { status: 400 })
    }
    if (!html && !text) {
      return NextResponse.json({ error: "html or text is required" }, { status: 400 })
    }

    const cfg = getConfig()

    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: {
        user: cfg.user,
        pass: cfg.pass,
      },
    })

    const info = await transporter.sendMail({
      from: cfg.from,
      to,
      subject,
      html: html || undefined,
      text: text || undefined,
    })

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      envelope: info.envelope,
      accepted: info.accepted,
      rejected: info.rejected,
    })
  } catch (error: any) {
    console.error("[email/send] error", error)
    return NextResponse.json(
      { error: error?.message || "Failed to send email" },
      { status: 500 }
    )
  }
}

