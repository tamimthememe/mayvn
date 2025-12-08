"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Check, Trash2, RefreshCw, MessageSquare, Info, AlertTriangle, CheckCircle, BarChart3, FileText } from "lucide-react"
import { useNotifications } from "@/contexts/NotificationsContext"
import { cn } from "@/lib/utils"
import Image from "next/image"

function formatTimeAgo(date: Date | string) {
    const d = new Date(date)
    const seconds = Math.floor((new Date().getTime() - d.getTime()) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return d.toLocaleDateString()
}

export function NotificationsSidebar() {
    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        checkForNewComments,
        isCheckingComments
    } = useNotifications()

    const [isOpen, setIsOpen] = useState(false)

    const unreadNotifications = notifications.filter(n => !n.read)

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
            case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
            case 'comment': return <MessageSquare className="w-4 h-4 text-blue-500" />
            case 'analytics': return <BarChart3 className="w-4 h-4 text-purple-500" />
            case 'content': return <FileText className="w-4 h-4 text-orange-500" />
            default: return <Info className="w-4 h-4 text-gray-500" />
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0">
                <SheetHeader className="p-6 border-b">
                    <div className="flex items-center justify-between">
                        <SheetTitle>Notifications</SheetTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => checkForNewComments()}
                                disabled={isCheckingComments}
                                title="Check for new comments"
                            >
                                <RefreshCw className={cn("w-4 h-4", isCheckingComments && "animate-spin")} />
                            </Button>
                            {notifications.length > 0 && (
                                <Button variant="ghost" size="sm" onClick={() => clearAll()}>
                                    Clear all
                                </Button>
                            )}
                        </div>
                    </div>
                </SheetHeader>

                <Tabs defaultValue="unread" className="flex-1 flex flex-col">
                    <div className="px-6 pt-4">
                        <TabsList className="w-full justify-start">
                            <TabsTrigger value="unread" className="flex-1">Unread ({unreadCount})</TabsTrigger>
                            <TabsTrigger value="all" className="flex-1">All ({notifications.length})</TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1 p-6">
                        <TabsContent value="unread" className="mt-0 space-y-4">
                            {unreadNotifications.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8">
                                    No unread notifications
                                </div>
                            ) : (
                                unreadNotifications.map(notification => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onRead={() => markAsRead(notification.id)}
                                        onDelete={() => deleteNotification(notification.id)}
                                        getIcon={getIcon}
                                    />
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="all" className="mt-0 space-y-4">
                            {notifications.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8">
                                    No notifications yet
                                </div>
                            ) : (
                                notifications.map(notification => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onRead={() => markAsRead(notification.id)}
                                        onDelete={() => deleteNotification(notification.id)}
                                        getIcon={getIcon}
                                    />
                                ))
                            )}
                        </TabsContent>
                    </ScrollArea>

                    {unreadCount > 0 && (
                        <div className="p-4 border-t bg-muted/50">
                            <Button className="w-full" onClick={() => markAllAsRead()}>
                                Mark all as read
                            </Button>
                        </div>
                    )}
                </Tabs>
            </SheetContent>
        </Sheet>
    )
}

function NotificationItem({ notification, onRead, onDelete, getIcon }: any) {
    return (
        <div className={cn(
            "flex gap-4 p-4 rounded-lg border transition-colors",
            notification.read ? "bg-background" : "bg-muted/30 border-primary/20"
        )}>
            <div className="mt-1">
                {getIcon(notification.type)}
            </div>
            <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm font-medium leading-none", !notification.read && "text-primary")}>
                        {notification.title}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimeAgo(notification.timestamp)}
                    </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {notification.message}
                </p>
                {notification.metadata?.mediaUrl && (
                    <div className="mt-2 relative w-full h-32 rounded-md overflow-hidden bg-muted">
                        <Image
                            src={notification.metadata.mediaUrl}
                            alt="Media preview"
                            fill
                            className="object-cover"
                        />
                    </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                    {!notification.read && (
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onRead}>
                            Mark read
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive" onClick={onDelete}>
                        Dismiss
                    </Button>
                </div>
            </div>
        </div>
    )
}
