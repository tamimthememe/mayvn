import { db } from './firebase'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

export interface UserSettings {
    notifications: {
        comments: boolean
        marketing: boolean
        security: boolean
        updates: boolean
    }
    theme?: 'light' | 'dark' | 'system'
}

export const DEFAULT_SETTINGS: UserSettings = {
    notifications: {
        comments: true,
        marketing: false,
        security: true,
        updates: true
    },
    theme: 'system'
}

export async function getUserSettings(userId: string): Promise<UserSettings> {
    try {
        const docRef = doc(db, 'users', userId, 'settings', 'preferences')
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
            return { ...DEFAULT_SETTINGS, ...docSnap.data() } as UserSettings
        }

        // If no settings exist, create default ones
        await setDoc(docRef, DEFAULT_SETTINGS)
        return DEFAULT_SETTINGS
    } catch (error) {
        console.error('Error fetching user settings:', error)
        return DEFAULT_SETTINGS
    }
}

export async function updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
    try {
        const docRef = doc(db, 'users', userId, 'settings', 'preferences')
        await setDoc(docRef, settings, { merge: true })
    } catch (error) {
        console.error('Error updating user settings:', error)
        throw error
    }
}

export async function updateNotificationSetting(
    userId: string,
    key: keyof UserSettings['notifications'],
    value: boolean
): Promise<void> {
    try {
        const currentSettings = await getUserSettings(userId)
        const newSettings = {
            ...currentSettings,
            notifications: {
                ...currentSettings.notifications,
                [key]: value
            }
        }
        await updateUserSettings(userId, newSettings)
    } catch (error) {
        console.error('Error updating notification setting:', error)
        throw error
    }
}
