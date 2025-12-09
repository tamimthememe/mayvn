"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/Sidebar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { NotificationsSidebar } from "@/components/NotificationsSidebar"
import { BrandSwitcher } from "@/components/BrandSwitcher"
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { getUserDocument } from "@/lib/userService"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import {
    Menu,
    Settings,
    LayoutDashboard,
    Calendar as CalendarIcon,
    FileText,
    MessageSquare,
    ChartBar,
    Search,
    Sparkles,
    Plus,
    User,
    LogOut,
} from "lucide-react"
import { RayvnProvider } from "@/contexts/RayvnContext"
import { RayvnChat } from "@/components/RayvnChat"

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth()
    const router = useRouter()
    const isMobile = useIsMobile()
    const [cmdOpen, setCmdOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [userData, setUserData] = useState<{ name?: string; email?: string } | null>(null)

    // Load user data for avatar
    useEffect(() => {
        const loadUserData = async () => {
            if (user) {
                try {
                    const userDoc = await getUserDocument(user.uid)
                    if (userDoc) {
                        setUserData({
                            name: userDoc.name,
                            email: userDoc.email,
                        })
                    } else {
                        setUserData({
                            name: user.displayName || undefined,
                            email: user.email || undefined,
                        })
                    }
                } catch (error) {
                    console.error("Error loading user data:", error)
                    setUserData({
                        name: user.displayName || undefined,
                        email: user.email || undefined,
                    })
                }
            }
        }
        loadUserData()
    }, [user])

    const handleLogout = async () => {
        try {
            await logout()
            router.push("/login")
        } catch (error) {
            console.error("Failed to log out", error)
        }
    }

    const getInitials = (name?: string, email?: string) => {
        if (name) {
            return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)
        }
        if (email) {
            return email.substring(0, 2).toUpperCase()
        }
        return "U"
    }

    return (
        <RayvnProvider>
            <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
                {/* Main Sidebar (same as dashboard) */}
                <Sidebar />

                {/* Header - Matching Dashboard Style */}
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

                            {/* Search Bar - Same as Dashboard */}
                            {!isMobile && (
                                <Popover open={cmdOpen} onOpenChange={setCmdOpen}>
                                    <PopoverAnchor asChild>
                                        <div className="hidden sm:flex items-center gap-2 bg-input border border-border/50 rounded-lg px-3 py-2 w-80 md:w-[32rem]">
                                            <Search className="w-4 h-4 text-muted-foreground" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => { setSearchQuery(e.target.value); if (!cmdOpen) setCmdOpen(true) }}
                                                onFocus={() => setCmdOpen(true)}
                                                placeholder="Search campaigns, actions…"
                                                className="bg-transparent border-0 outline-none text-sm flex-1"
                                            />
                                            <kbd className="hidden md:inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground border border-border/60">Ctrl K</kbd>
                                        </div>
                                    </PopoverAnchor>
                                    <PopoverContent align="start" sideOffset={8} className="p-2 w-[min(90vw,36rem)]">
                                        <div className="max-h-72 overflow-y-auto divide-y divide-border/50">
                                            <div className="py-1">
                                                <p className="px-2 pb-1 text-xs text-muted-foreground">Actions</p>
                                                <div className="flex flex-col">
                                                    {[{ icon: Sparkles, label: 'Generate Content', href: '/post-generator' }, { icon: Plus, label: 'New Campaign', href: '/campaigns/new' }]
                                                        .filter(a => a.label.toLowerCase().includes(searchQuery.toLowerCase()))
                                                        .map((a, i) => (
                                                            <button key={i} onClick={() => { setCmdOpen(false); router.push(a.href) }} className="flex items-center gap-2 px-2 py-2 text-sm hover:bg-muted rounded">
                                                                <a.icon className="w-4 h-4 text-muted-foreground" />
                                                                <span>{a.label}</span>
                                                            </button>
                                                        ))}
                                                </div>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>

                        <div className="flex items-center gap-3 md:gap-4">
                            <RayvnChat
                                triggerButton={
                                    <Button variant="ghost" size="icon" className="text-primary hover:text-primary">
                                        <Sparkles className="w-5 h-5" />
                                    </Button>
                                }
                            />
                            <NotificationsSidebar />
                            <Link href="/dashboard/settings">
                                <Button variant="ghost" size="icon">
                                    <Settings className="w-5 h-5" />
                                </Button>
                            </Link>

                            {/* User Avatar Dropdown - Same as Dashboard */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full">
                                        <Avatar className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-primary to-accent">
                                            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs md:text-sm font-bold">
                                                {getInitials(userData?.name, userData?.email)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{userData?.name || "User"}</p>
                                            <p className="text-xs leading-none text-muted-foreground">{userData?.email || user?.email || ""}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                                        <User className="w-4 h-4 mr-2" />
                                        <span>Profile</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                                        <LogOut className="w-4 h-4 mr-2" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                {/* Main Content - uses same width as dashboard (w-52 sidebar) */}
                <main className="md:ml-52 md:w-[calc(100%-13rem)] w-full pt-16 md:pt-20">
                    {children}
                </main>
            </div>
        </RayvnProvider>
    )
}
