"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { memo, useMemo, useState } from "react"
import {
    LayoutDashboard,
    Calendar,
    FileText,
    MessageSquare,
    ChartBar,
    User,
    CalendarDays,
    PenTool,
    ChevronDown,
    Instagram,
    Mail,
    Linkedin,
    TrendingUp,
} from "lucide-react"
import { BrandSwitcher } from "./BrandSwitcher"
import { cn } from "@/lib/utils"

// Reddit icon (lucide doesn't have one)
const RedditIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
)

// Analytics sub-navigation items
const analyticsSubNav = [
    {
        name: "Instagram",
        href: "/analytics",
        icon: Instagram,
        color: "text-pink-500",
    },
    {
        name: "Reddit",
        href: "/analytics/reddit",
        icon: RedditIcon,
        color: "text-orange-500",
    },
    {
        name: "Email",
        href: "/analytics/email",
        icon: Mail,
        color: "text-blue-400",
    },
    {
        name: "LinkedIn",
        href: "/analytics/linkedin",
        icon: Linkedin,
        color: "text-blue-600",
    },
    {
        name: "Trends",
        href: "/analytics/trends",
        icon: TrendingUp,
        color: "text-green-500",
    },
]

const navigation = [
    {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        name: "Campaigns",
        href: "/campaigns",
        icon: Calendar,
    },
    {
        name: "Content",
        href: "/content",
        icon: FileText,
    },
    {
        name: "Engagement",
        href: "/engagement",
        icon: MessageSquare,
    },
    {
        name: "Post Planner",
        href: "/post-planner",
        icon: CalendarDays,
    },
    {
        name: "Post Generator",
        href: "/post-generator",
        icon: PenTool,
    },
    {
        name: "Profile",
        href: "/dashboard/profile",
        icon: User,
    },
]

function SidebarContent() {
    const pathname = usePathname()
    const [analyticsOpen, setAnalyticsOpen] = useState(() =>
        pathname?.startsWith("/analytics") || false
    )

    // Check if we're on any analytics page
    const isAnalyticsActive = pathname?.startsWith("/analytics") || false

    const navigationItems = useMemo(() => {
        return navigation.map((item) => {
            const isActive = pathname === item.href ||
                (item.href !== "/dashboard" && pathname?.startsWith(item.href))

            return (
                <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                        isActive
                            ? "bg-muted text-foreground"
                            : "hover:bg-muted text-muted-foreground"
                    )}
                >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm">{item.name}</span>
                </Link>
            )
        })
    }, [pathname])

    return (
        <div className="hidden md:flex fixed left-0 top-0 w-52 h-screen bg-card border-r border-border pb-5 pr-4 pl-4 flex-col">
            <div className="mb-8 pt-5 -mx-4 px-2">
                <BrandSwitcher />
            </div>

            <nav className="flex-1 space-y-1">
                {/* Regular nav items before Analytics */}
                {navigationItems.slice(0, 4)}

                {/* Analytics with dropdown */}
                <div>
                    <button
                        onClick={() => setAnalyticsOpen(!analyticsOpen)}
                        className={cn(
                            "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors",
                            isAnalyticsActive
                                ? "bg-muted text-foreground"
                                : "hover:bg-muted text-muted-foreground"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <ChartBar className="w-4 h-4" />
                            <span className="text-sm">Analytics</span>
                        </div>
                        <ChevronDown
                            className={cn(
                                "w-4 h-4 transition-transform duration-200",
                                analyticsOpen && "rotate-180"
                            )}
                        />
                    </button>

                    {/* Dropdown items */}
                    <div className={cn(
                        "overflow-hidden transition-all duration-200",
                        analyticsOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                    )}>
                        <div className="ml-4 mt-1 space-y-1 border-l border-border/50 pl-3">
                            {analyticsSubNav.map((item) => {
                                const isActive = pathname === item.href

                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm",
                                            isActive
                                                ? "bg-muted text-foreground"
                                                : "hover:bg-muted text-muted-foreground"
                                        )}
                                    >
                                        <item.icon className={cn("w-4 h-4", item.color)} />
                                        <span>{item.name}</span>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Regular nav items after Analytics */}
                {navigationItems.slice(4)}
            </nav>
        </div>
    )
}

export const Sidebar = memo(SidebarContent)
