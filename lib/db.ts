import { db } from './firebase'
import { doc, getDoc, setDoc, collection, getDocs, query, where, updateDoc, deleteDoc } from 'firebase/firestore'
import { decrypt } from './crypto'

export interface InstagramAccount {
    instagramUserId: string
    username: string
    name?: string
    profilePictureUrl?: string
    accessToken: string
    tokenExpiresAt?: number
    connectedAt: Date
    isActive?: boolean
}

export async function saveInstagramAccount(userId: string, brandId: string, account: InstagramAccount) {
    const accountRef = doc(db, 'users', userId, 'brands', brandId, 'instagram_accounts', account.instagramUserId)
    await setDoc(accountRef, account, { merge: true })
}

export async function getInstagramAccount(userId: string, brandId: string, instagramUserId: string) {
    // 1. Try specific account document
    const accountRef = doc(db, 'users', userId, 'brands', brandId, 'instagram_accounts', instagramUserId)
    const snapshot = await getDoc(accountRef)
    if (snapshot.exists()) {
        const data = snapshot.data()
        let token = data.accessToken
        if (!token && data.accessTokenEncrypted) {
            try {
                token = decrypt(data.accessTokenEncrypted)
            } catch (e) {
                console.error('Failed to decrypt token', e)
            }
        }
        return {
            account: { ...data, accessToken: token, isActive: data.isActive ?? true } as InstagramAccount,
            accessToken: token,
            isExpired: false // TODO: Implement expiration check
        }
    }

    // 2. Fallback: Check brand document if the requested ID matches (or if we just want *an* account)
    const brandRef = doc(db, 'users', userId, 'brands', brandId)
    const brandSnap = await getDoc(brandRef)
    if (brandSnap.exists()) {
        const data = brandSnap.data()
        let token = data.instagramAccessToken || data.accessToken || data.igAccessToken
        const igUserId = data.instagramUserId || data.igUserId

        // Try encrypted token on brand doc
        if (!token && data.accessTokenEncrypted) {
            try {
                token = decrypt(data.accessTokenEncrypted)
            } catch (e) {
                console.error('Failed to decrypt token from brand doc', e)
            }
        }

        if (token && igUserId && igUserId === instagramUserId) {
            const account: InstagramAccount = {
                instagramUserId: igUserId,
                username: data.instagramUsername || data.username || 'Instagram Account',
                accessToken: token,
                connectedAt: new Date(),
                isActive: true,
                profilePictureUrl: data.instagramProfilePic || data.profilePic
            }
            return {
                account,
                accessToken: token,
                isExpired: false
            }
        }
    }

    return null
}

export async function getBrandInstagramAccounts(userId: string, brandId: string) {
    try {
        const accountsRef = collection(db, 'users', userId, 'brands', brandId, 'instagram_accounts')
        const snapshot = await getDocs(accountsRef)

        if (!snapshot.empty) {
            return snapshot.docs.map(doc => {
                const data = doc.data()
                let token = data.accessToken
                if (!token && data.accessTokenEncrypted) {
                    try {
                        token = decrypt(data.accessTokenEncrypted)
                    } catch (e) {
                        console.error('Failed to decrypt token', e)
                    }
                }
                return {
                    account: { ...data, accessToken: token, isActive: data.isActive ?? true } as InstagramAccount,
                    accessToken: token,
                    isExpired: false // TODO: Implement expiration check
                }
            })
        }

        // Fallback: Check if token is directly on the brand document
        const brandRef = doc(db, 'users', userId, 'brands', brandId)
        const brandSnap = await getDoc(brandRef)
        if (brandSnap.exists()) {
            const data = brandSnap.data()
            console.log('[DB] Brand document data:', JSON.stringify(data, null, 2)) // Log entire brand doc

            // Check for various possible field names for the token
            let token = data.instagramAccessToken || data.accessToken || data.igAccessToken
            const igUserId = data.instagramUserId || data.igUserId

            // Try encrypted token on brand doc
            if (!token && data.accessTokenEncrypted) {
                try {
                    token = decrypt(data.accessTokenEncrypted)
                } catch (e) {
                    console.error('Failed to decrypt token from brand doc', e)
                }
            }

            if (token && igUserId) {
                console.log('[DB] Found token on brand document')
                const account: InstagramAccount = {
                    instagramUserId: igUserId,
                    username: data.instagramUsername || data.username || 'Instagram Account',
                    accessToken: token,
                    connectedAt: new Date(),
                    isActive: true,
                    profilePictureUrl: data.instagramProfilePic || data.profilePic
                }
                return [{
                    account,
                    accessToken: token,
                    isExpired: false
                }]
            } else {
                console.log('[DB] Token or UserID missing on brand document')
            }
        } else {
            console.log('[DB] Brand document not found')
        }

        return []
    } catch (error) {
        console.error('Error getting brand instagram accounts:', error)
        return []
    }
}

export async function getActiveBrandInstagramAccount(userId: string, brandId: string) {
    const accounts = await getBrandInstagramAccounts(userId, brandId)
    return accounts.length > 0 ? accounts[0] : null
}
