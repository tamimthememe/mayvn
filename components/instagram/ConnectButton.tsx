"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Instagram, Loader2, CheckCircle2 } from "lucide-react"

interface ConnectButtonProps {
  isConnected?: boolean
  onConnect?: () => void
  onDisconnect?: () => void
  className?: string
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "default" | "lg"
  showIcon?: boolean
  fullWidth?: boolean
}

/**
 * Instagram Connect Button Component
 * 
 * A reusable button component for connecting/disconnecting Instagram accounts.
 * 
 * Features:
 * - Loading states
 * - Connected/disconnected states
 * - Customizable appearance
 * - Accessible
 */

export function InstagramConnectButton({
  isConnected = false,
  onConnect,
  onDisconnect,
  className = "",
  variant = "default",
  size = "default",
  showIcon = true,
  fullWidth = false,
}: ConnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    
    try {
      if (isConnected) {
        await onDisconnect?.()
      } else {
        await onConnect?.()
      }
    } catch (error) {
      console.error("Instagram connection error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isConnected) {
    return (
      <Button
        onClick={handleClick}
        disabled={isLoading}
        variant={variant}
        size={size}
        className={`${className} ${fullWidth ? 'w-full' : ''}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Disconnecting...
          </>
        ) : (
          <>
            {showIcon && <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />}
            Connected
          </>
        )}
      </Button>
    )
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={`${className} ${fullWidth ? 'w-full' : ''} ${variant === 'default' ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 hover:opacity-90' : ''}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          {showIcon && <Instagram className="w-4 h-4 mr-2" />}
          Connect Instagram
        </>
      )}
    </Button>
  )
}

