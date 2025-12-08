"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { useBrand } from './BrandContext'
import {
    Notification,
    subscribeToNotifications,
    markNotificationRead as dbMarkRead,
    markAllNotificationsRead as dbMarkAllRead,
    deleteNotification as dbDelete,
    clearAllNotifications as dbClearAll
} from '@/lib/notifications'

// ============================================================================
// Types
// ============================================================================

interface NotificationsContextType {
    notifications: Notification[]
    unreadCount: number
    loading: boolean
    markAsRead: (notificationId: string) => Promise<void>
    markAllAsRead: () => Promise<void>
    deleteNotification: (notificationId: string) => Promise<void>
    clearAll: () => Promise<void>
    checkForNewComments: () => Promise<void>
    isCheckingComments: boolean
}

// ============================================================================
// Context
// ============================================================================

const NotificationsContext = createContext<NotificationsContextType>({
    notifications: [],
    unreadCount: 0,
    loading: true,
    markAsRead: async () => { },
    markAllAsRead: async () => { },
    deleteNotification: async () => { },
    clearAll: async () => { },
    checkForNewComments: async () => { },
    isCheckingComments: false,
})

export const useNotifications = () => useContext(NotificationsContext)

// ============================================================================
// Provider
// ============================================================================

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()
    const { selectedBrandId } = useBrand()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [isCheckingComments, setIsCheckingComments] = useState(false)

    // Subscribe to real-time notifications
    useEffect(() => {
        if (!user?.uid) {
            setNotifications([])
            setLoading(false)
            return
        }

        setLoading(true)

        const unsubscribe = subscribeToNotifications(user.uid, (newNotifications) => {
            setNotifications(newNotifications)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [user?.uid])

    // Calculate unread count
    const unreadCount = notifications.filter(n => !n.read).length

    // Mark single notification as read
    const markAsRead = useCallback(async (notificationId: string) => {
        if (!user?.uid) return

        // Optimistic update
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        )

        await dbMarkRead(user.uid, notificationId)
    }, [user?.uid])

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        if (!user?.uid) return

        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))

        await dbMarkAllRead(user.uid)
    }, [user?.uid])

    // Delete notification
    const deleteNotification = useCallback(async (notificationId: string) => {
        if (!user?.uid) return

        // Optimistic update
        setNotifications(prev => prev.filter(n => n.id !== notificationId))

        await dbDelete(user.uid, notificationId)
    }, [user?.uid])

    // Clear all
    const clearAll = useCallback(async () => {
        if (!user?.uid) return

        // Optimistic update
        setNotifications([])

        await dbClearAll(user.uid)
    }, [user?.uid])

    // Check for new comments
    const checkForNewComments = useCallback(async () => {
        if (!user?.uid || !selectedBrandId || isCheckingComments) return

        setIsCheckingComments(true)

        try {
            const response = await fetch('/api/notifications/check-comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.uid,
                    brandId: selectedBrandId
                })
            })

            const data = await response.json()

            if (data.success && data.newCommentsCount > 0) {
                console.log(`[Notifications] Found ${data.newCommentsCount} new comments`)
            }
        } catch (error) {
            console.error('[Notifications] Error checking for new comments:', error)
        } finally {
            setIsCheckingComments(false)
        }
    }, [user?.uid, selectedBrandId, isCheckingComments])

    // Auto-check for new comments every 10 minutes
    useEffect(() => {
        if (!user?.uid || !selectedBrandId) return

        let isMounted = true

        const doCheck = async () => {
            if (!isMounted) return

            try {
                const response = await fetch('/api/notifications/check-comments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user.uid,
                        brandId: selectedBrandId
                    })
                })

                const data = await response.json()

                if (data.success && data.newCommentsCount > 0) {
                    console.log(`[Notifications] Found ${data.newCommentsCount} new comments`)
                }
            } catch (error) {
                console.error('[Notifications] Error checking for new comments:', error)
            }
        }

        // Check after 5 seconds on mount/brand change
        const initialCheck = setTimeout(doCheck, 5000)

        // Then check every 10 minutes
        const interval = setInterval(doCheck, 10 * 60 * 1000)

        return () => {
            isMounted = false
            clearTimeout(initialCheck)
            clearInterval(interval)
        }
    }, [user?.uid, selectedBrandId]) // Removed checkForNewComments dependency

    const value = {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        checkForNewComments,
        isCheckingComments,
    }

    return (
        <NotificationsContext.Provider value={value}>
            {children}
        </NotificationsContext.Provider>
    )
}
