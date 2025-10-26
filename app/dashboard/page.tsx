"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Plus,
  Settings,
  Bell,
  Search,
  ChevronRight,
  Sparkles,
  Zap,
  Heart,
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("week")

  const stats = [
    {
      label: "Active Campaigns",
      value: "12",
      change: "+3 this week",
      icon: Calendar,
      color: "from-primary to-purple-600",
    },
    {
      label: "Content Generated",
      value: "248",
      change: "+45 this week",
      icon: Sparkles,
      color: "from-secondary to-teal-600",
    },
    {
      label: "Total Engagement",
      value: "12.5K",
      change: "+2.3K this week",
      icon: Heart,
      color: "from-accent to-pink-600",
    },
    {
      label: "Avg. Reach",
      value: "45.2K",
      change: "+8.5% this week",
      icon: TrendingUp,
      color: "from-indigo-500 to-purple-600",
    },
  ]

  const recentCampaigns = [
    {
      id: 1,
      name: "Summer Collection Launch",
      platforms: ["Instagram", "TikTok"],
      status: "Active",
      engagement: "3.2K",
      reach: "45.2K",
      posts: 8,
    },
    {
      id: 2,
      name: "Back to School Promo",
      platforms: ["Instagram", "Facebook"],
      status: "Scheduled",
      engagement: "1.8K",
      reach: "28.5K",
      posts: 5,
    },
    {
      id: 3,
      name: "Holiday Gift Guide",
      platforms: ["TikTok", "YouTube"],
      status: "Draft",
      engagement: "0",
      reach: "0",
      posts: 3,
    },
  ]

  const quickActions = [
    {
      icon: Plus,
      label: "New Campaign",
      href: "/dashboard/campaigns/new",
      color: "from-primary to-purple-600",
    },
    {
      icon: Sparkles,
      label: "Generate Content",
      href: "/dashboard/content",
      color: "from-secondary to-teal-600",
    },
    {
      icon: Calendar,
      label: "Schedule Posts",
      href: "/dashboard/schedule",
      color: "from-accent to-pink-600",
    },
    {
      icon: BarChart3,
      label: "View Analytics",
      href: "/dashboard/analytics",
      color: "from-indigo-500 to-purple-600",
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Mayvn Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-input border border-border/50 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search campaigns..."
                className="bg-transparent border-0 outline-none text-sm w-48"
              />
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-sm font-bold">
              JD
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, John!</h2>
          <p className="text-muted-foreground">Here's what's happening with your campaigns today</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <Card
                key={i}
                className="border-border/50 bg-card/50 backdrop-blur-sm p-6 hover:border-primary/50 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} p-2.5 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-full h-full text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold">{stat.value}</h3>
                  </div>
                  <p className="text-xs text-secondary">{stat.change}</p>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, i) => {
              const Icon = action.icon
              return (
                <Link key={i} href={action.href}>
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6 hover:border-primary/50 transition-all duration-300 cursor-pointer group h-full">
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-br ${action.color} p-2.5 mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-full h-full text-white" />
                    </div>
                    <p className="font-medium group-hover:text-primary transition-colors">{action.label}</p>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Recent Campaigns</h3>
              <Link href="/dashboard/campaigns">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {recentCampaigns.map((campaign) => (
                <Card
                  key={campaign.id}
                  className="border-border/50 bg-card/50 backdrop-blur-sm p-6 hover:border-primary/50 transition-all duration-300 group cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                        {campaign.name}
                      </h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        {campaign.platforms.map((platform) => (
                          <span
                            key={platform}
                            className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
                          >
                            {platform}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        campaign.status === "Active"
                          ? "bg-secondary/20 text-secondary border border-secondary/30"
                          : campaign.status === "Scheduled"
                            ? "bg-primary/20 text-primary border border-primary/30"
                            : "bg-muted/20 text-muted-foreground border border-muted/30"
                      }`}
                    >
                      {campaign.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Engagement</p>
                      <p className="text-lg font-semibold">{campaign.engagement}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Reach</p>
                      <p className="text-lg font-semibold">{campaign.reach}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Posts</p>
                      <p className="text-lg font-semibold">{campaign.posts}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Performance Overview */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6">
              <h4 className="font-semibold mb-4">Performance Overview</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Engagement Rate</span>
                    <span className="text-sm font-semibold text-secondary">+12.5%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-secondary to-teal-500"></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Reach Growth</span>
                    <span className="text-sm font-semibold text-primary">+8.3%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-gradient-to-r from-primary to-purple-500"></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Conversion Rate</span>
                    <span className="text-sm font-semibold text-accent">+5.2%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-1/2 bg-gradient-to-r from-accent to-pink-500"></div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Upcoming Events */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6">
              <h4 className="font-semibold mb-4">Upcoming Events</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3 pb-3 border-b border-border/50">
                  <div className="w-2 h-2 rounded-full bg-secondary mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Campaign goes live</p>
                    <p className="text-xs text-muted-foreground">Tomorrow at 10:00 AM</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 pb-3 border-b border-border/50">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Weekly report ready</p>
                    <p className="text-xs text-muted-foreground">Friday at 5:00 PM</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New feature available</p>
                    <p className="text-xs text-muted-foreground">Next Monday</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Pro Tip */}
            <Card className="border-border/50 bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm p-6 border-primary/30">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-2">Pro Tip</h4>
                  <p className="text-sm text-muted-foreground">
                    Use AI content generation to create 10x more posts in half the time. Try it now!
                  </p>
                  <Link href="/dashboard/content">
                    <Button size="sm" className="mt-3 bg-primary hover:bg-primary/90">
                      Generate Content
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
