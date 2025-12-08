"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { getUserSettings, updateNotificationSetting } from "@/lib/settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Loader2, Bell, Shield, Mail, Zap, MessageSquare, Menu, Settings as SettingsIcon, LayoutDashboard, Calendar as CalendarIcon, FileText, ChartBar } from "lucide-react"
import { Sidebar } from "@/components/Sidebar"
import { NotificationsSidebar } from "@/components/NotificationsSidebar"
import { BrandSwitcher } from "@/components/BrandSwitcher"
import Link from "next/link"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function SettingsPage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [settings, setSettings] = useState<any>(null)

    useEffect(() => {
        async function loadSettings() {
            if (user?.uid) {
                const data = await getUserSettings(user.uid)
                setSettings(data)
                setLoading(false)
            }
        }
        loadSettings()
    }, [user])

    const handleToggle = async (key: string, value: boolean) => {
        if (!user?.uid || !settings) return

        // Optimistic update
        setSettings((prev: any) => ({
            ...prev,
            notifications: {
                ...prev.notifications,
                [key]: value
            }
        }))

        try {
            await updateNotificationSetting(user.uid, key as any, value)
        } catch (error) {
            console.error("Failed to update setting", error)
            // Revert on error
            setSettings((prev: any) => ({
                ...prev,
                notifications: {
                    ...prev.notifications,
                    [key]: !value
                }
            }))
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Sidebar */}
            <Sidebar />

            {/* Header */}
            <header className="fixed top-0 left-0 md:left-52 right-0 border-b border-border/50 bg-card/30 backdrop-blur-sm z-40">
                <div className="w-full px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="md:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon">
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
                                        <Link href="/analytics" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                                            <ChartBar className="w-5 h-5" />
                                            <span>Analytics</span>
                                        </Link>
                                    </nav>
                                </SheetContent>
                            </Sheet>
                        </div>
                        <h1 className="text-lg font-semibold">Settings</h1>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4">
                        <NotificationsSidebar />
                        <Button variant="ghost" size="icon" className="bg-muted text-foreground">
                            <SettingsIcon className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="md:ml-52 md:w-[calc(100%-13rem)] w-full px-4 md:px-6 pt-20 pb-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Preferences</CardTitle>
                            <CardDescription>Choose what you want to be notified about.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between space-x-4">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-primary/10 rounded-full">
                                        <MessageSquare className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="comments">Comments</Label>
                                        <p className="text-sm text-muted-foreground">Receive notifications when someone comments on your posts.</p>
                                    </div>
                                </div>
                                <Switch
                                    id="comments"
                                    checked={settings?.notifications?.comments ?? true}
                                    onCheckedChange={(checked) => handleToggle('comments', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between space-x-4">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-orange-500/10 rounded-full">
                                        <Zap className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="updates">Product Updates</Label>
                                        <p className="text-sm text-muted-foreground">Get notified about new features and improvements.</p>
                                    </div>
                                </div>
                                <Switch
                                    id="updates"
                                    checked={settings?.notifications?.updates ?? true}
                                    onCheckedChange={(checked) => handleToggle('updates', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between space-x-4">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-red-500/10 rounded-full">
                                        <Shield className="w-5 h-5 text-red-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="security">Security Alerts</Label>
                                        <p className="text-sm text-muted-foreground">Receive alerts about suspicious activity.</p>
                                    </div>
                                </div>
                                <Switch
                                    id="security"
                                    checked={settings?.notifications?.security ?? true}
                                    onCheckedChange={(checked) => handleToggle('security', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between space-x-4">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-blue-500/10 rounded-full">
                                        <Mail className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="marketing">Marketing Emails</Label>
                                        <p className="text-sm text-muted-foreground">Receive emails about offers and promotions.</p>
                                    </div>
                                </div>
                                <Switch
                                    id="marketing"
                                    checked={settings?.notifications?.marketing ?? false}
                                    onCheckedChange={(checked) => handleToggle('marketing', checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
