"use client"

import { Card } from "@/components/ui/card"
import { Check } from "lucide-react"

interface PlatformPreferencesProps {
  formData: any
  onUpdateData: (updates: any) => void
}

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: "📷" },
  { id: "twitter", name: "Twitter/X", icon: "𝕏" },
  { id: "tiktok", name: "TikTok", icon: "🎵" },
  { id: "linkedin", name: "LinkedIn", icon: "💼" },
  { id: "facebook", name: "Facebook", icon: "f" },
  { id: "youtube", name: "YouTube", icon: "▶️" },
]

export function PlatformPreferences({ formData, onUpdateData }: PlatformPreferencesProps) {
  const togglePlatform = (platformId: string) => {
    const newPlatforms = formData.platforms.includes(platformId)
      ? formData.platforms.filter((p: string) => p !== platformId)
      : [...formData.platforms, platformId]
    onUpdateData({ platforms: newPlatforms })
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">Which platforms do you want to manage?</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {PLATFORMS.map((platform) => (
          <Card
            key={platform.id}
            onClick={() => togglePlatform(platform.id)}
            className={`p-4 cursor-pointer transition-all duration-200 border-2 ${
              formData.platforms.includes(platform.id)
                ? "border-primary bg-primary/10"
                : "border-border/50 hover:border-primary/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{platform.icon}</span>
                <span className="font-medium text-sm">{platform.name}</span>
              </div>
              {formData.platforms.includes(platform.id) && <Check className="w-5 h-5 text-primary" />}
            </div>
          </Card>
        ))}
      </div>

      <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          You can add or remove platforms anytime from your dashboard settings.
        </p>
      </div>
    </div>
  )
}
