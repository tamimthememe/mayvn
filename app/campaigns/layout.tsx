"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover"
import { useIsMobile } from "@/hooks/use-mobile"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  FileText,
  MessageSquare,
  ChartBar,
  Menu,
  Search,
  Bell,
  Settings,
  Sparkles,
  Plus,
} from "lucide-react"
import { Sidebar } from "@/components/Sidebar"
import { BrandSwitcher } from "@/components/BrandSwitcher"

export default function CampaignsLayout({ children }: { children: React.ReactNode }) {
  const [cmdOpen, setCmdOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const isMobile = useIsMobile()
  const router = useRouter()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Header */}
      <header className="fixed top-0 left-0 md:left-64 right-0 border-b border-border/50 bg-card/30 backdrop-blur-sm z-40" suppressHydrationWarning>
        <div className="w-full px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
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
                    <Link href="/campaigns" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted text-foreground">
                      <CalendarIcon className="w-5 h-5" />
                      <span>Campaigns</span>
                    </Link>
                    <Link href="/content" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                      <FileText className="w-5 h-5" />
                      <span>Content</span>
                    </Link>
                    <Link href="/engagement" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                      <MessageSquare className="w-5 h-5" />
                      <span>Engagement</span>
                    </Link>
                    <Link href="/analytics" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                      <ChartBar className="w-5 h-5" />
                      <span>Analytics</span>
                    </Link>
                    <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                      <span>Profile</span>
                    </Link>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
            {!isMobile && (
              <Popover open={cmdOpen} onOpenChange={setCmdOpen}>
                <PopoverAnchor asChild>
                  <div className="hidden sm:flex items-center gap-2 bg-input border border-border/50 rounded-lg px-3 py-2 w-64 md:w-96" suppressHydrationWarning>
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
                        {[{icon: Sparkles, label: 'Generate Content', href: '/content'}, {icon: Plus, label: 'Create Campaign', href: '/campaigns/create'}]
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
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
            <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-xs md:text-sm font-bold">
              JD
            </div>
          </div>
        </div>
      </header>

      <main className="md:ml-64 md:w-[calc(100%-16rem)] w-full px-4 md:px-6 pt-16 md:pt-20 pb-8">
        {/* Sub-navigation */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto">
          {[
            { label: 'Overview', href: '/campaigns' },
            { label: 'Create', href: '/campaigns/create' },
            { label: 'Generate', href: '/campaigns/generate' },
            { label: 'Refine', href: '/campaigns/refine' },
            { label: 'Schedule', href: '/campaigns/schedule' },
            { label: 'Optimize', href: '/campaigns/optimize' },
          ].map((tab) => (
            <Link key={tab.href} href={tab.href} className="px-3 py-1.5 rounded-md border border-border/50 bg-card hover:border-primary/40 text-sm">
              {tab.label}
            </Link>
          ))}
        </div>
        {children}
      </main>
    </div>
  )
}


