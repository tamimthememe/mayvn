"use client"

import { Sidebar } from "@/components/Sidebar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { NotificationsSidebar } from "@/components/NotificationsSidebar"
import { BrandSwitcher } from "@/components/BrandSwitcher"
import Link from "next/link"
import {
    Menu,
    Settings,
    LayoutDashboard,
    Calendar as CalendarIcon,
    FileText,
    MessageSquare,
    ChartBar,
} from "lucide-react"

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Main Sidebar (same as dashboard) */}
            <Sidebar />

            {/* Header */}
            <header className="fixed top-0 left-0 md:left-52 right-0 border-b border-border/50 bg-card/30 backdrop-blur-sm z-40" suppressHydrationWarning>
                <div className="w-full px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        {/* Mobile hamburger */}
                        <div className="md:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label="Open menu">
                                        <Menu className="w-5 h-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-72 p-0">
                                    <div className="p-6 border-b border-border/50">
                                        <BrandSwitcher />
                                    </div>
                                    <nav className="p-4 space-y-1">
                                        <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                                            <LayoutDashboard className="w-5 h-5" />
                                            <span>Dashboard</span>
                                        </Link>
                                        <Link href="/campaigns" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                                            <CalendarIcon className="w-5 h-5" />
                                            <span>Campaigns</span>
                                        </Link>
                                        <Link href="/content" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                                            <FileText className="w-5 h-5" />
                                            <span>Content</span>
                                        </Link>
                                        <Link href="/analytics" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted text-foreground">
                                            <ChartBar className="w-5 h-5" />
                                            <span>Analytics</span>
                                        </Link>
                                    </nav>
                                </SheetContent>
                            </Sheet>
                        </div>

                        {/* Page Title */}
                        <h1 className="text-lg font-semibold hidden sm:block">Analytics</h1>
                    </div>

                    <div className="flex items-center gap-3 md:gap-4">
                        <NotificationsSidebar />
                        <Link href="/dashboard/settings">
                            <Button variant="ghost" size="icon">
                                <Settings className="w-5 h-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content - uses same width as dashboard (w-52 sidebar) */}
            <main className="md:ml-52 md:w-[calc(100%-13rem)] w-full pt-16 md:pt-20">
                {children}
            </main>
        </div>
    )
}
