import { NextRequest, NextResponse } from "next/server"

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434"
const MODEL_NAME = process.env.OLLAMA_MODEL || "qwen2.5:1.5b"

type BrandDNA = {
  brand_name?: string
  tagline?: string
  brand_values?: string[]
  business_overview?: string
  target_audience?: string[]
  tone_of_voice?: string[]
  colors?: string[]
  fonts?: string[]
  accent_color?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { brandData, idea } = body

    if (!brandData) {
      return NextResponse.json({ error: "brandData is required" }, { status: 400 })
    }

    const prompt = buildPrompt(brandData as BrandDNA, idea as string | undefined)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 900000)

    try {
      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL_NAME,
          prompt,
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
        throw new Error(
          `OLLAMA error ${response.status}: ${response.statusText}. Details: ${errorText?.slice(0, 240)}`
        )
      }

      const data = await response.json()
      const text = data.response || ""
      const parsed = parseEmail(text)

      return NextResponse.json({ success: true, email: parsed, raw: text })
    } catch (err: any) {
      clearTimeout(timeoutId)
      if (err.name === "AbortError") {
        throw new Error("Email generation timed out (5m).")
      }
      throw err
    }
  } catch (error: any) {
    console.error("[generate-email] error", error)
    return NextResponse.json(
      { error: error?.message || "Failed to generate email copy" },
      { status: 500 }
    )
  }
}

function buildPrompt(brand: BrandDNA, idea?: string) {
  const name = brand.brand_name || "the brand"
  const tagline = brand.tagline ? `Tagline: ${brand.tagline}` : ""
  const values = brand.brand_values?.length ? `Values: ${brand.brand_values.join(", ")}` : ""
  const overview = brand.business_overview ? `Business: ${brand.business_overview}` : ""
  const audience = brand.target_audience?.length ? `Audience: ${brand.target_audience.join(", ")}` : ""
  const tone = brand.tone_of_voice?.length ? `Tone: ${brand.tone_of_voice.join(", ")}` : ""
  const colors = brand.colors?.length ? `Colors: ${brand.colors.join(", ")}` : ""
  const fonts = brand.fonts?.length ? `Fonts: ${brand.fonts.join(", ")}` : ""
  const accent = brand.accent_color ? `Accent: ${brand.accent_color}` : ""

  const hook = idea ? `Focus idea: ${idea}` : "Create an evergreen brand email."

  return `
You are an elite lifecycle marketer and copywriter.
Write exactly ONE outbound email for ${name}.

Brand DNA:
- Name: ${name}
- ${tagline}
- ${overview}
- ${values}
- ${audience}
- ${tone}
- ${colors}
- ${fonts}
- ${accent}

${hook}

STRICT RULES (follow exactly):
- Return ONLY valid JSON. No prose, no markdown, no code fences.
- Shape:
{
  "subject": "string (<=70 chars)",
  "preview": "string (<=120 chars)",
  "html": "string",
  "text": "string"
}
- subject: captivating but not clickbait.
- preview: plain sentence, no emojis.
- html: lightweight, inline styles only, single clear CTA button linking to https://mayvn.ai or "#" if unsure. No code fences. No backticks. No nested JSON. Use <div>, <p>, <h2>, <button>, <a>. Keep under 1200 chars.
- text: plaintext twin of html, short paragraphs, CTA as a URL.
- Tone: match brand tone; avoid spam trigger words and exclamation spam.
- NEVER wrap the JSON in backticks or fences.
`
}

function parseEmail(text: string) {
  try {
    let cleaned = text.trim()
    cleaned = cleaned.replace(/```json/gi, "").replace(/```/g, "")
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) cleaned = match[0]
    const parsed = JSON.parse(cleaned)
    return {
      subject: parsed.subject || "",
      preview: parsed.preview || "",
      html: parsed.html || "",
      text: parsed.text || "",
    }
  } catch (e) {
    const safe = text.replace(/```/g, "").slice(0, 800)
    return {
      subject: "Your brand update",
      preview: safe.slice(0, 100),
      html: `<div style="font-family: Arial, sans-serif; color:#111; background:#fff; padding:16px;">
  <h2 style="margin:0 0 12px;">Your brand update</h2>
  <p style="margin:0 0 12px;">${safe}</p>
  <a href="https://mayvn.ai" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Learn more</a>
</div>`,
      text: safe,
    }
  }
}

