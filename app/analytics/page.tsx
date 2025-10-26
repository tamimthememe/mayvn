"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sparkles, Download, Share2 } from "lucide-react"

export default function AnalyticsPage() {
  const insights = [
    { title: "Best posting time: 7-9 PM", icon: "🌙", trend: "+15%" },
    { title: "Video content ↑ 24% engagement", icon: "📹", trend: "+24%" },
    { title: "Reels outperform static posts", icon: "⚡", trend: "+18%" },
    { title: "Audience peak: Wednesday", icon: "📊", trend: "+12%" },
  ]

  const platformStats = [
    { platform: "Instagram", followers: "12.5K", engagement: "4.2%", reach: "45K" },
    { platform: "TikTok", followers: "8.3K", engagement: "6.8%", reach: "120K" },
    { platform: "Twitter", followers: "5.2K", engagement: "2.1%", reach: "18K" },
    { platform: "LinkedIn", followers: "3.8K", engagement: "1.9%", reach: "12K" },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed left-0 top-0 w-64 h-screen bg-card border-r border-border p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Mayvn</span>
        </div>

        <nav className="flex-1 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-card-foreground/10 transition-colors"
          >
            <span>📊 Dashboard</span>
          </Link>
          <Link
            href="/campaigns"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-card-foreground/10 transition-colors"
          >
            <span>📅 Campaigns</span>
          </Link>
          <Link
            href="/content"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-card-foreground/10 transition-colors"
          >
            <span>✨ Content</span>
          </Link>
          <Link
            href="/engagement"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-card-foreground/10 transition-colors"
          >
            <span>💬 Engagement</span>
          </Link>
          <Link href="/analytics" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary">
            <span>📈 Analytics</span>
          </Link>
        </nav>
      </div>

      <div className="ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Analytics & Insights</h1>
            <p className="text-muted-foreground">Track your campaign performance</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
          </div>
        </div>

        {/* AI Insights */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">AI Insights</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {insights.map((insight, i) => (
              <Card
                key={i}
                className="border-primary/20 bg-gradient-to-br from-primary/10 to-accent/10 p-6 hover:border-primary/50 transition-all animate-bounce-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="text-3xl mb-3">{insight.icon}</div>
                <p className="font-medium text-sm mb-2">{insight.title}</p>
                <p className="text-lg font-bold text-accent">{insight.trend}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Platform Stats */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Platform Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-semibold">Platform</th>
                  <th className="text-left py-4 px-4 font-semibold">Followers</th>
                  <th className="text-left py-4 px-4 font-semibold">Engagement</th>
                  <th className="text-left py-4 px-4 font-semibold">Reach</th>
                </tr>
              </thead>
              <tbody>
                {platformStats.map((stat, i) => (
                  <tr
                    key={i}
                    className="border-b border-border/50 hover:bg-card/50 transition-colors animate-slide-in-left"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <td className="py-4 px-4 font-medium">{stat.platform}</td>
                    <td className="py-4 px-4 text-muted-foreground">{stat.followers}</td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium">
                        {stat.engagement}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">{stat.reach}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
