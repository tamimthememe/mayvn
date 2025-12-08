"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sparkles, Heart, Share2, MessageCircle } from "lucide-react"
import { Sidebar } from "@/components/Sidebar"

export default function EngagementPage() {
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true)
  const [engagementItems] = useState([
    {
      id: 1,
      type: "mention",
      author: "Sarah Chen",
      content: "@mayvn your new feature is insane! 🔥",
      sentiment: "positive",
      platform: "Twitter",
      timestamp: "2 hours ago",
    },
    {
      id: 2,
      type: "comment",
      author: "Alex Rivera",
      content: "How much does this cost?",
      sentiment: "neutral",
      platform: "Instagram",
      timestamp: "1 hour ago",
    },
    {
      id: 3,
      type: "message",
      author: "Jordan Kim",
      content: "Interested in partnership opportunities",
      sentiment: "positive",
      platform: "LinkedIn",
      timestamp: "30 min ago",
    },
    {
      id: 4,
      type: "comment",
      author: "Casey Morgan",
      content: "This is exactly what I needed!",
      sentiment: "positive",
      platform: "TikTok",
      timestamp: "15 min ago",
    },
  ])

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "😊"
      case "neutral":
        return "😐"
      case "negative":
        return "😠"
      default:
        return "😊"
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "text-green-400"
      case "neutral":
        return "text-yellow-400"
      case "negative":
        return "text-red-400"
      default:
        return "text-green-400"
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />

      <div className="md:ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Engagement Hub</h1>
          <p className="text-muted-foreground">Manage all your mentions, comments, and messages</p>
        </div>

        {/* Auto-Reply Toggle */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">AI Auto-Reply</h3>
              <p className="text-sm text-muted-foreground">Automatically respond to common questions</p>
            </div>
            <button
              onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                autoReplyEnabled ? "bg-primary" : "bg-border"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  autoReplyEnabled ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </Card>

        {/* Engagement Feed */}
        <div className="space-y-4">
          {engagementItems.map((item, i) => (
            <Card
              key={item.id}
              className="border-border/50 bg-card/50 backdrop-blur-sm p-6 hover:border-primary/50 transition-all animate-slide-in-left"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                        {item.author.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold">{item.author}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.platform} • {item.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>
                  <span className={`text-2xl ${getSentimentColor(item.sentiment)}`}>
                    {getSentimentEmoji(item.sentiment)}
                  </span>
                </div>

                <p className="text-foreground leading-relaxed">{item.content}</p>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                    <Heart className="w-4 h-4 mr-2" /> Like
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                    <MessageCircle className="w-4 h-4 mr-2" /> Reply
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                    <Share2 className="w-4 h-4 mr-2" /> Share
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
