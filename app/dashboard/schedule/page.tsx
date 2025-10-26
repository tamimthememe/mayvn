"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Send,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"

export default function SchedulingPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 9))
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")

  const scheduledPosts = [
    {
      id: 1,
      title: "Summer Collection Launch",
      platforms: ["Instagram", "TikTok"],
      scheduledTime: new Date(2025, 9, 28, 10, 0),
      status: "scheduled",
      content: "Check out our new summer collection! 🌞",
      image: "📷",
    },
    {
      id: 2,
      title: "Weekly Tips",
      platforms: ["LinkedIn"],
      scheduledTime: new Date(2025, 9, 29, 9, 0),
      status: "scheduled",
      content: "5 tips to boost your marketing ROI",
      image: "💡",
    },
    {
      id: 3,
      title: "Flash Sale Announcement",
      platforms: ["Instagram", "Facebook"],
      scheduledTime: new Date(2025, 9, 30, 14, 0),
      status: "scheduled",
      content: "Limited time offer - 50% off everything!",
      image: "🎉",
    },
    {
      id: 4,
      title: "Behind the Scenes",
      platforms: ["TikTok"],
      scheduledTime: new Date(2025, 10, 1, 16, 0),
      status: "scheduled",
      content: "Day in the life at our studio",
      image: "🎬",
    },
    {
      id: 5,
      title: "Customer Testimonial",
      platforms: ["Instagram"],
      scheduledTime: new Date(2025, 10, 2, 11, 0),
      status: "published",
      content: "Amazing feedback from our customers",
      image: "⭐",
    },
  ]

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const getPostsForDate = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return scheduledPosts.filter((post) => {
      const postDate = new Date(post.scheduledTime)
      return (
        postDate.getDate() === day &&
        postDate.getMonth() === currentMonth.getMonth() &&
        postDate.getFullYear() === currentMonth.getFullYear()
      )
    })
  }

  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" })
  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDay = getFirstDayOfMonth(currentMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

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
              <Calendar className="w-6 h-6 text-primary" />
              Schedule & Publish
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className={viewMode === "calendar" ? "bg-primary" : "border-border/50 bg-transparent"}
            >
              Calendar
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "bg-primary" : "border-border/50 bg-transparent"}
            >
              List
            </Button>
            <Link href="/dashboard/content">
              <Button size="sm" className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Post
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === "calendar" ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <Card className="border-primary/20 bg-card/50 backdrop-blur-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">{monthName}</h2>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handlePrevMonth}
                      className="border-border/50 bg-transparent"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleNextMonth}
                      className="border-border/50 bg-transparent"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-2">
                  {/* Empty cells for days before month starts */}
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square"></div>
                  ))}

                  {/* Days of month */}
                  {days.map((day) => {
                    const postsForDay = getPostsForDate(day)
                    const isToday =
                      day === new Date().getDate() &&
                      currentMonth.getMonth() === new Date().getMonth() &&
                      currentMonth.getFullYear() === new Date().getFullYear()

                    return (
                      <button
                        key={day}
                        onClick={() =>
                          setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))
                        }
                        className={`aspect-square p-2 rounded-lg border-2 transition-all duration-200 flex flex-col items-start justify-start text-left ${
                          isToday
                            ? "border-secondary bg-secondary/10"
                            : selectedDate?.getDate() === day && selectedDate?.getMonth() === currentMonth.getMonth()
                              ? "border-primary bg-primary/10"
                              : "border-border/50 bg-card/50 hover:border-primary/50"
                        }`}
                      >
                        <span className={`text-xs font-semibold ${isToday ? "text-secondary" : "text-foreground"}`}>
                          {day}
                        </span>
                        {postsForDay.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-0.5">
                            {postsForDay.slice(0, 2).map((post, i) => (
                              <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent" title={post.title}></div>
                            ))}
                            {postsForDay.length > 2 && (
                              <span className="text-xs text-muted-foreground">+{postsForDay.length - 2}</span>
                            )}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="mt-6 pt-6 border-t border-border/50 flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-accent"></div>
                    <span className="text-muted-foreground">Scheduled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-secondary"></div>
                    <span className="text-muted-foreground">Today</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Selected Date Posts */}
            <div>
              <Card className="border-accent/20 bg-card/50 backdrop-blur-sm p-6">
                <h3 className="text-lg font-bold mb-4">
                  {selectedDate
                    ? selectedDate.toLocaleDateString("default", { month: "short", day: "numeric" })
                    : "Select a date"}
                </h3>

                {selectedDate && getPostsForDate(selectedDate.getDate()).length > 0 ? (
                  <div className="space-y-3">
                    {getPostsForDate(selectedDate.getDate()).map((post) => (
                      <div key={post.id} className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
                        <div className="flex items-start gap-2 mb-2">
                          <span className="text-xl">{post.image}</span>
                          <div className="flex-1">
                            <p className="text-sm font-semibold line-clamp-1">{post.title}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {post.scheduledTime.toLocaleTimeString("default", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-wrap mb-2">
                          {post.platforms.map((platform) => (
                            <span
                              key={platform}
                              className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary"
                            >
                              {platform}
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="text-xs h-6 flex-1">
                            <Edit2 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-6 flex-1 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">No posts scheduled for this date</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {scheduledPosts.map((post) => (
              <Card
                key={post.id}
                className="border-border/50 bg-card/50 backdrop-blur-sm p-6 hover:border-primary/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{post.image}</span>
                      <div>
                        <h3 className="font-semibold">{post.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="w-4 h-4" />
                          {post.scheduledTime.toLocaleString("default", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{post.content}</p>
                    <div className="flex flex-wrap gap-2">
                      {post.platforms.map((platform) => (
                        <span
                          key={platform}
                          className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary border border-primary/30"
                        >
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                        post.status === "published"
                          ? "bg-secondary/20 text-secondary border border-secondary/30"
                          : "bg-primary/20 text-primary border border-primary/30"
                      }`}
                    >
                      {post.status === "published" ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Published
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          Scheduled
                        </>
                      )}
                    </span>

                    <div className="flex gap-2">
                      {post.status === "scheduled" && (
                        <>
                          <Button size="sm" variant="ghost" className="text-xs h-8">
                            <Edit2 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="ghost" className="text-xs h-8">
                            <Send className="w-3 h-3 mr-1" />
                            Publish Now
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
