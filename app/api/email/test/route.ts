import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

type EnvConfig = {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
  to: string
}

function getConfig(): EnvConfig {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 0)
  const secure = String(process.env.SMTP_SECURE || "").toLowerCase() === "true"
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM || user || ""
  const to = process.env.SMTP_TEST_TO

  if (!host || !port || !user || !pass || !from || !to) {
    const missing = [
      ["SMTP_HOST", host],
      ["SMTP_PORT", port],
      ["SMTP_SECURE", process.env.SMTP_SECURE],
      ["SMTP_USER", user],
      ["SMTP_PASS", pass ? "***" : ""],
      ["SMTP_FROM", from],
      ["SMTP_TEST_TO", to],
    ]
      .filter(([, v]) => !v)
      .map(([k]) => k)
    throw new Error(`Missing SMTP env: ${missing.join(", ")}`)
  }

  return { host, port, secure, user, pass, from, to }
}

export async function POST() {
  try {
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

    const subject = "Mayvn test email"
    const text = "This is a test email from Mayvn SMTP."
    const html = `<p>This is a <strong>test email</strong> from Mayvn SMTP.</p>`

    const info = await transporter.sendMail({
      from: cfg.from,
      to: cfg.to,
      subject,
      text,
      html,
    })

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      envelope: info.envelope,
      accepted: info.accepted,
      rejected: info.rejected,
    })
  } catch (error: any) {
    console.error("[email/test] error", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to send test email",
      },
      { status: 500 }
    )
  }
}

