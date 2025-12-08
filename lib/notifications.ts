/**
 * Notifications Database Service
 * 
 * Stores notifications in Firebase Firestore under:
 * users/{userId}/notifications/{notificationId}
 * 
 * Features:
 * - Create notifications
 * - Mark as read
 * - Delete notifications
 * - Real-time listener support
 */

import { db } from './firebase'
import {
    doc,
    collection,
    getDoc,
    getDocs,
    setDoc,
    deleteDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    Timestamp,
    writeBatch
} from 'firebase/firestore'

// ============================================================================
// Types
// ============================================================================

export interface Notification {
    id: string
    userId: string
    brandId?: string
    type: 'success' | 'info' | 'warning' | 'engagement' | 'content' | 'analytics' | 'comment'
    title: string
    message: string
    timestamp: Date
    read: boolean
    actionUrl?: string
    icon?: 'instagram' | 'sparkles' | 'trending' | 'calendar' | 'message' | 'heart' | 'alert' | 'comment'
    metadata?: {
        postId?: string
        commentId?: string
        commentText?: string
        commenterUsername?: string
        mediaUrl?: string
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

function getNotificationsCollection(userId: string) {
    return collection(db, 'users', userId, 'notifications')
}

function getNotificationDoc(userId: string, notificationId: string) {
    return doc(db, 'users', userId, 'notifications', notificationId)
}

// ============================================================================
// Create Notification
// ============================================================================

export async function createNotification(
    userId: string,
    notification: Omit<Notification, 'id' | 'userId' | 'timestamp' | 'read'>
): Promise<Notification> {
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const newNotification: Notification = {
        id: notificationId,
        userId,
        ...notification,
        timestamp: new Date(),
        read: false,
    }

    const docData: Record<string, unknown> = {
        id: notificationId,
        userId,
        type: newNotification.type,
        title: newNotification.title,
        message: newNotification.message,
        timestamp: Timestamp.fromDate(newNotification.timestamp),
        read: false,
    }

    if (notification.brandId) docData.brandId = notification.brandId
    if (notification.actionUrl) docData.actionUrl = notification.actionUrl
    if (notification.icon) docData.icon = notification.icon
    if (notification.metadata) docData.metadata = notification.metadata

    await setDoc(getNotificationDoc(userId, notificationId), docData)

    console.log(`[Notifications] Created notification for user ${userId}: ${notification.title}`)
    return newNotification
}

// ============================================================================
// Get Notifications
// ============================================================================

export async function getUserNotifications(
    userId: string,
    limitCount: number = 50
): Promise<Notification[]> {
    try {
        const collectionRef = getNotificationsCollection(userId)
        const q = query(
            collectionRef,
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        )

        const querySnapshot = await getDocs(q)

        const notifications: Notification[] = querySnapshot.docs.map(doc => {
            const data = doc.data()
            return {
                id: data.id,
                userId: data.userId,
                brandId: data.brandId,
                type: data.type,
                title: data.title,
                message: data.message,
                timestamp: data.timestamp?.toDate() || new Date(),
                read: data.read,
                actionUrl: data.actionUrl,
                icon: data.icon,
                metadata: data.metadata,
            } as Notification
        })

        return notifications
    } catch (error) {
        console.error('[Notifications] Error getting notifications:', error)
        return []
    }
}

// ============================================================================
// Get Unread Count
// ============================================================================

export async function getUnreadCount(userId: string): Promise<number> {
    try {
        const collectionRef = getNotificationsCollection(userId)
        const q = query(collectionRef, where('read', '==', false))
        const querySnapshot = await getDocs(q)
        return querySnapshot.size
    } catch (error) {
        console.error('[Notifications] Error getting unread count:', error)
        return 0
    }
}

// ============================================================================
// Mark Notification as Read
// ============================================================================

export async function markNotificationRead(
    userId: string,
    notificationId: string
): Promise<void> {
    try {
        await updateDoc(getNotificationDoc(userId, notificationId), { read: true })
        console.log(`[Notifications] Marked notification ${notificationId} as read`)
    } catch (error) {
        console.error('[Notifications] Error marking as read:', error)
    }
}

// ============================================================================
// Mark All Notifications as Read
// ============================================================================

export async function markAllNotificationsRead(userId: string): Promise<void> {
    try {
        const collectionRef = getNotificationsCollection(userId)
        const q = query(collectionRef, where('read', '==', false))
        const querySnapshot = await getDocs(q)

        const batch = writeBatch(db)
        querySnapshot.docs.forEach(doc => {
            batch.update(doc.ref, { read: true })
        })

        await batch.commit()
        console.log(`[Notifications] Marked all notifications as read for user ${userId}`)
    } catch (error) {
        console.error('[Notifications] Error marking all as read:', error)
    }
}

// ============================================================================
// Delete Notification
// ============================================================================

export async function deleteNotification(
    userId: string,
    notificationId: string
): Promise<void> {
    try {
        await deleteDoc(getNotificationDoc(userId, notificationId))
        console.log(`[Notifications] Deleted notification ${notificationId}`)
    } catch (error) {
        console.error('[Notifications] Error deleting notification:', error)
    }
}

// ============================================================================
// Clear All Notifications
// ============================================================================

export async function clearAllNotifications(userId: string): Promise<void> {
    try {
        const collectionRef = getNotificationsCollection(userId)
        const querySnapshot = await getDocs(collectionRef)

        const batch = writeBatch(db)
        querySnapshot.docs.forEach(doc => {
            batch.delete(doc.ref)
        })

        await batch.commit()
        console.log(`[Notifications] Cleared all notifications for user ${userId}`)
    } catch (error) {
        console.error('[Notifications] Error clearing notifications:', error)
    }
}

// ============================================================================
// Real-time Listener
// ============================================================================

export function subscribeToNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void,
    limitCount: number = 50
): () => void {
    const collectionRef = getNotificationsCollection(userId)
    const q = query(
        collectionRef,
        orderBy('timestamp', 'desc'),
        limit(limitCount)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifications: Notification[] = snapshot.docs.map(doc => {
            const data = doc.data()
            return {
                id: data.id,
                userId: data.userId,
                brandId: data.brandId,
                type: data.type,
                title: data.title,
                message: data.message,
                timestamp: data.timestamp?.toDate() || new Date(),
                read: data.read,
                actionUrl: data.actionUrl,
                icon: data.icon,
                metadata: data.metadata,
            } as Notification
        })

        callback(notifications)
    }, (error) => {
        console.error('[Notifications] Subscription error:', error)
        // Call callback with empty array on error to prevent infinite loading
        callback([])
    })

    return unsubscribe
}

// ============================================================================
// Create Comment Notification
// ============================================================================

export async function createCommentNotification(
    userId: string,
    brandId: string,
    brandName: string,
    postId: string,
    commentId: string,
    commenterUsername: string,
    commentText: string,
    mediaUrl?: string
): Promise<Notification> {
    // Truncate comment text for notification preview
    const previewText = commentText.length > 100
        ? commentText.substring(0, 100) + '...'
        : commentText

    return createNotification(userId, {
        brandId,
        type: 'comment',
        title: `${brandName}: New comment from @${commenterUsername}`,
        message: previewText,
        icon: 'comment',
        actionUrl: '/analytics',
        metadata: {
            postId,
            commentId,
            commentText,
            commenterUsername,
            mediaUrl,
        }
    })
}
