"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

interface SocialConnectionsProps {
  formData: any
  onUpdateData: (updates: any) => void
}

const SOCIAL_PLATFORMS = [
  { id: "instagram", name: "Instagram", color: "from-pink-500 to-purple-500" },
  { id: "twitter", name: "Twitter/X", color: "from-slate-700 to-slate-900" },
  { id: "tiktok", name: "TikTok", color: "from-black to-slate-800" },
  { id: "linkedin", name: "LinkedIn", color: "from-blue-600 to-blue-800" },
]

export function SocialConnections({ formData, onUpdateData }: SocialConnectionsProps) {
  const handleConnect = (platformId: string) => {
    // In a real app, this would open OAuth flow
    const newAccounts = {
      ...formData.socialAccounts,
      [platformId]: `connected_${Date.now()}`,
    }
    onUpdateData({ socialAccounts: newAccounts })
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">Connect your social media accounts to get started</p>

      <div className="space-y-3">
        {SOCIAL_PLATFORMS.map((platform) => (
          <Card
            key={platform.id}
            className={`p-4 border-border/50 bg-gradient-to-r ${platform.color} bg-opacity-10 hover:bg-opacity-20 transition-all`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{platform.name}</span>
              {formData.socialAccounts[platform.id] ? (
                <div className="flex items-center gap-2 text-green-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Connected</span>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleConnect(platform.id)}
                  className="flex items-center gap-2"
                >
                  Connect
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          You can connect additional accounts later. Start with at least one platform to begin creating content.
        </p>
      </div>
    </div>
  )
}
