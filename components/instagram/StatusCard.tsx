"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Instagram, CheckCircle2, AlertCircle, Clock } from "lucide-react"
import { InstagramConnectButton } from "./ConnectButton"

interface InstagramStatusCardProps {
  isConnected?: boolean
  username?: string
  lastSync?: Date
  postsCount?: number
  followersCount?: number
  engagementRate?: number
  onConnect?: () => void
  onDisconnect?: () => void
  className?: string
}

/**
 * Instagram Status Card Component
 * 
 * Displays the current Instagram connection status with key metrics.
 * 
 * Features:
 * - Connection status indicator
 * - Key metrics display
 * - Last sync timestamp
 * - Quick connect/disconnect
 */

export function InstagramStatusCard({
  isConnected = false,
  username,
  lastSync,
  postsCount = 0,
  followersCount = 0,
  engagementRate = 0,
  onConnect,
  onDisconnect,
  className = "",
}: InstagramStatusCardProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getLastSyncText = (): string => {
    if (!lastSync) return 'Never synced'
    
    const now = new Date()
    const diffMs = now.getTime() - lastSync.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return lastSync.toLocaleDateString()
  }

  return (
    <Card className={`border-border/50 bg-card/50 backdrop-blur-sm p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${isConnected ? 'bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500' : 'bg-muted'} flex items-center justify-center`}>
            <Instagram className={`w-6 h-6 ${isConnected ? 'text-white' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Instagram</h3>
            {isConnected && username ? (
              <p className="text-sm text-muted-foreground">@{username}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Not connected</p>
            )}
          </div>
        </div>

        {/* Status Badge */}
        {isConnected ? (
          <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        ) : (
          <Badge className="bg-muted/50 text-muted-foreground hover:bg-muted/70">
            <AlertCircle className="w-3 h-3 mr-1" />
            Disconnected
          </Badge>
        )}
      </div>

      {/* Metrics */}
      {isConnected ? (
        <div className="space-y-4 mb-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-background/50 border border-border/50">
              <div className="text-lg font-bold">{formatNumber(postsCount)}</div>
              <div className="text-xs text-muted-foreground">Posts</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50 border border-border/50">
              <div className="text-lg font-bold">{formatNumber(followersCount)}</div>
              <div className="text-xs text-muted-foreground">Followers</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50 border border-border/50">
              <div className="text-lg font-bold">{engagementRate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Engagement</div>
            </div>
          </div>

          {/* Last Sync */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Last synced {getLastSyncText()}</span>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Connect your Instagram account to access insights, manage content, and engage with your audience.
          </p>
        </div>
      )}

      {/* Action Button */}
      <InstagramConnectButton
        isConnected={isConnected}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        variant={isConnected ? "outline" : "default"}
        fullWidth
        showIcon
      />
    </Card>
  )
}

