import { db } from './firebase'
import { doc, getDoc, setDoc, collection, getDocs, query, where, updateDoc, deleteDoc } from 'firebase/firestore'
import { decrypt } from './crypto'

export interface InstagramAccount {
    instagramUserId: string
    username: string
    name?: string
    profilePictureUrl?: string
    accessToken?: string
    accessTokenEncrypted?: string
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

        // Try accessTokenEncrypted first
        if (data.accessTokenEncrypted) {
            try {
                token = decrypt(data.accessTokenEncrypted)
            } catch (e) {
                console.error('Failed to decrypt token from accessTokenEncrypted', e)
            }
        }

        // If token looks encrypted (contains : from IV), try to decrypt
        if (token && token.includes(':') && token.length > 50) {
            try {
                token = decrypt(token)
            } catch (e) {
                console.error('Failed to decrypt token from accessToken', e)
            }
        }

        return {
            account: { ...data, accessToken: token, isActive: data.isActive ?? true } as InstagramAccount,
            accessToken: token,
            isExpired: false
        }
    }

    // 2. Fallback: Check brand document
    const brandRef = doc(db, 'users', userId, 'brands', brandId)
    const brandSnap = await getDoc(brandRef)
    if (brandSnap.exists()) {
        const data = brandSnap.data()
        let token = data.instagramAccessToken || data.accessToken || data.igAccessToken
        const igUserId = data.instagramUserId || data.igUserId

        if (data.accessTokenEncrypted) {
            try {
                token = decrypt(data.accessTokenEncrypted)
            } catch (e) {
                console.error('Failed to decrypt token from brand doc', e)
            }
        }

        if (token && token.includes(':') && token.length > 50) {
            try {
                token = decrypt(token)
            } catch (e) {
                console.error('Failed to decrypt token from brand doc accessToken', e)
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
            return snapshot.docs.map(docSnap => {
                const data = docSnap.data()
                let token = data.accessToken

                console.log('[DB] Raw data:', {
                    hasAccessToken: !!data.accessToken,
                    hasAccessTokenEncrypted: !!data.accessTokenEncrypted,
                    accessTokenLength: data.accessToken?.length
                })

                // Try accessTokenEncrypted first
                if (data.accessTokenEncrypted) {
                    try {
                        console.log('[DB] Decrypting from accessTokenEncrypted...')
                        token = decrypt(data.accessTokenEncrypted)
                        console.log('[DB] Decrypted successfully, length:', token?.length)
                    } catch (e) {
                        console.error('[DB] Failed to decrypt from accessTokenEncrypted:', e)
                    }
                }

                // If token looks encrypted (contains : from IV), try to decrypt
                if (token && token.includes(':') && token.length > 50) {
                    try {
                        console.log('[DB] Token looks encrypted, decrypting from accessToken...')
                        token = decrypt(token)
                        console.log('[DB] Decrypted successfully, length:', token?.length)
                    } catch (e) {
                        console.error('[DB] Failed to decrypt from accessToken:', e)
                    }
                }

                return {
                    account: { ...data, accessToken: token, isActive: data.isActive ?? true } as InstagramAccount,
                    accessToken: token,
                    isExpired: false
                }
            })
        }

        // Fallback: Check if token is directly on the brand document
        const brandRef = doc(db, 'users', userId, 'brands', brandId)
        const brandSnap = await getDoc(brandRef)
        if (brandSnap.exists()) {
            const data = brandSnap.data()

            let token = data.instagramAccessToken || data.accessToken || data.igAccessToken
            const igUserId = data.instagramUserId || data.igUserId

            if (data.accessTokenEncrypted) {
                try {
                    token = decrypt(data.accessTokenEncrypted)
                } catch (e) {
                    console.error('Failed to decrypt token from brand doc', e)
                }
            }

            if (token && token.includes(':') && token.length > 50) {
                try {
                    token = decrypt(token)
                } catch (e) {
                    console.error('Failed to decrypt token from brand doc accessToken', e)
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
            }
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
