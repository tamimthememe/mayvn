"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MessageSquare, Heart, Share2, Users, Settings, Reply, Trash2, BarChart3, Eye } from "lucide-react"
import Link from "next/link"

export default function EngagementPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "comments" | "audience" | "personalization">("overview")
  const [selectedComment, setSelectedComment] = useState<number | null>(null)

  const engagementMetrics = [
    {
      label: "Total Engagement",
      value: "12.5K",
      change: "+15.3%",
      icon: Heart,
      color: "from-accent to-pink-600",
    },
    {
      label: "Comments",
      value: "2.3K",
      change: "+8.2%",
      icon: MessageSquare,
      color: "from-primary to-purple-600",
    },
    {
      label: "Shares",
      value: "1.8K",
      change: "+12.5%",
      icon: Share2,
      color: "from-secondary to-teal-600",
    },
    {
      label: "Reach",
      value: "45.2K",
      change: "+22.1%",
      icon: Eye,
      color: "from-indigo-500 to-purple-600",
    },
  ]

  const comments = [
    {
      id: 1,
      author: "Sarah Johnson",
      avatar: "SJ",
      platform: "Instagram",
      content: "This is amazing! Love the new collection 🔥",
      timestamp: "2 hours ago",
      likes: 45,
      status: "new",
    },
    {
      id: 2,
      author: "Mike Chen",
      avatar: "MC",
      platform: "TikTok",
      content: "When will this be available?",
      timestamp: "4 hours ago",
      likes: 12,
      status: "new",
    },
    {
      id: 3,
      author: "Emma Davis",
      avatar: "ED",
      platform: "Instagram",
      content: "Already ordered! Can't wait to receive it 😍",
      timestamp: "1 day ago",
      likes: 89,
      status: "replied",
    },
    {
      id: 4,
      author: "Alex Rodriguez",
      avatar: "AR",
      platform: "Facebook",
      content: "Is this sustainable?",
      timestamp: "1 day ago",
      likes: 23,
      status: "new",
    },
  ]

  const audienceInsights = [
    { label: "Total Followers", value: "125.4K", change: "+5.2K this month" },
    { label: "Engagement Rate", value: "4.8%", change: "+0.3% this month" },
    { label: "Top Audience Age", value: "25-34", change: "45% of followers" },
    { label: "Top Location", value: "United States", change: "38% of followers" },
  ]

  const personalizationRules = [
    {
      id: 1,
      name: "Auto-reply to questions",
      description: "Automatically reply to common questions",
      enabled: true,
    },
    {
      id: 2,
      name: "Highlight positive comments",
      description: "Pin comments with high engagement",
      enabled: true,
    },
    {
      id: 3,
      name: "Filter spam comments",
      description: "Automatically hide spam and inappropriate content",
      enabled: true,
    },
    {
      id: 4,
      name: "Personalized recommendations",
      description: "Show content recommendations based on audience",
      enabled: false,
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm mb-2 inline-block"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              Engagement & Personalization
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border/50 overflow-x-auto">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "comments", label: "Comments", icon: MessageSquare },
            { id: "audience", label: "Audience", icon: Users },
            { id: "personalization", label: "Personalization", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 font-medium flex items-center gap-2 border-b-2 transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Metrics Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {engagementMetrics.map((metric, i) => {
                const Icon = metric.icon
                return (
                  <Card
                    key={i}
                    className="border-border/50 bg-card/50 backdrop-blur-sm p-6 hover:border-primary/50 transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${metric.color} p-2.5 group-hover:scale-110 transition-transform`}
                      >
                        <Icon className="w-full h-full text-white" />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-3xl font-bold">{metric.value}</h3>
                      <span className="text-sm text-secondary">{metric.change}</span>
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Engagement Trends */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6">
                <h3 className="text-lg font-bold mb-4">Engagement Trend</h3>
                <div className="space-y-4">
                  {[
                    { label: "Monday", value: 2400, max: 3000 },
                    { label: "Tuesday", value: 2800, max: 3000 },
                    { label: "Wednesday", value: 2100, max: 3000 },
                    { label: "Thursday", value: 2900, max: 3000 },
                    { label: "Friday", value: 3200, max: 3000 },
                    { label: "Saturday", value: 2600, max: 3000 },
                    { label: "Sunday", value: 2200, max: 3000 },
                  ].map((day, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{day.label}</span>
                        <span className="text-sm text-muted-foreground">{day.value}</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent"
                          style={{ width: `${(day.value / day.max) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6">
                <h3 className="text-lg font-bold mb-4">Top Performing Posts</h3>
                <div className="space-y-3">
                  {[
                    { title: "Summer Collection Launch", engagement: 3.2 },
                    { title: "Behind the Scenes", engagement: 2.8 },
                    { title: "Customer Testimonial", engagement: 2.5 },
                    { title: "Weekly Tips", engagement: 2.1 },
                    { title: "Flash Sale", engagement: 1.9 },
                  ].map((post, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-card/50 border border-border/50 rounded-lg"
                    >
                      <span className="text-sm font-medium line-clamp-1">{post.title}</span>
                      <span className="text-sm text-secondary font-semibold">{post.engagement}K</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === "comments" && (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button variant="outline" className="border-border/50 bg-transparent">
                All Comments
              </Button>
              <Button variant="outline" className="border-border/50 bg-transparent">
                New
              </Button>
              <Button variant="outline" className="border-border/50 bg-transparent">
                Replied
              </Button>
            </div>

            {comments.map((comment) => (
              <Card
                key={comment.id}
                className={`border-border/50 bg-card/50 backdrop-blur-sm p-6 hover:border-primary/50 transition-all duration-300 cursor-pointer ${
                  selectedComment === comment.id ? "border-primary" : ""
                }`}
                onClick={() => setSelectedComment(selectedComment === comment.id ? null : comment.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-primary-foreground">
                    {comment.avatar}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{comment.author}</h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                        {comment.platform}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          comment.status === "new" ? "bg-accent/20 text-accent" : "bg-secondary/20 text-secondary"
                        }`}
                      >
                        {comment.status === "new" ? "New" : "Replied"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{comment.content}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{comment.timestamp}</span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {comment.likes}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="text-xs h-8">
                      <Reply className="w-3 h-3 mr-1" />
                      Reply
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs h-8 text-destructive hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Audience Tab */}
        {activeTab === "audience" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {audienceInsights.map((insight, i) => (
                <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-sm p-6">
                  <p className="text-sm text-muted-foreground mb-2">{insight.label}</p>
                  <h3 className="text-3xl font-bold mb-1">{insight.value}</h3>
                  <p className="text-xs text-secondary">{insight.change}</p>
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6">
                <h3 className="text-lg font-bold mb-4">Audience by Age</h3>
                <div className="space-y-3">
                  {[
                    { range: "18-24", percentage: 25 },
                    { range: "25-34", percentage: 45 },
                    { range: "35-44", percentage: 18 },
                    { range: "45-54", percentage: 8 },
                    { range: "55+", percentage: 4 },
                  ].map((age, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{age.range}</span>
                        <span className="text-sm text-muted-foreground">{age.percentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent"
                          style={{ width: `${age.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6">
                <h3 className="text-lg font-bold mb-4">Top Locations</h3>
                <div className="space-y-2">
                  {[
                    { country: "United States", percentage: 38 },
                    { country: "United Kingdom", percentage: 18 },
                    { country: "Canada", percentage: 12 },
                    { country: "Australia", percentage: 10 },
                    { country: "Other", percentage: 22 },
                  ].map((location, i) => (
                    <div key={i} className="flex items-center justify-between p-2">
                      <span className="text-sm">{location.country}</span>
                      <span className="text-sm font-semibold text-secondary">{location.percentage}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Personalization Tab */}
        {activeTab === "personalization" && (
          <div className="space-y-4">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm p-6 border-primary/30">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                Personalization Settings
              </h3>
              <p className="text-sm text-muted-foreground">
                Customize how Mayvn personalizes your content and engagement strategy
              </p>
            </Card>

            {personalizationRules.map((rule) => (
              <Card key={rule.id} className="border-border/50 bg-card/50 backdrop-blur-sm p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{rule.name}</h4>
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                  </div>
                  <button
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      rule.enabled ? "bg-secondary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        rule.enabled ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </Card>
            ))}

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6">
              <h4 className="font-semibold mb-4">Brand Voice Settings</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Brand Tone</label>
                  <select className="w-full bg-input border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option>Professional</option>
                    <option>Casual</option>
                    <option>Friendly</option>
                    <option>Inspirational</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Brand Keywords</label>
                  <input
                    type="text"
                    placeholder="e.g., sustainable, innovative, customer-first"
                    className="w-full bg-input border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
                  Save Settings
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
