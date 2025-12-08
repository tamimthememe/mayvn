/**
 * Mock Database Service
 * 
 * Provides a simulated database for storing user Instagram credentials and tokens.
 * In production, replace this with your actual database implementation
 * (e.g., Firebase, PostgreSQL, MongoDB).
 * 
 * SECURITY NOTES:
 * - Client Secrets are stored ENCRYPTED using AES-256-CBC
 * - Access tokens are stored ENCRYPTED
 * - This mock uses in-memory storage - data will be lost on restart
 */

import { encrypt, decrypt } from './crypto'

// ============================================================================
// Types
// ============================================================================

export interface UserCredentials {
    userId: string
    clientId: string
    clientSecretEncrypted: string // Stored encrypted
    createdAt: Date
    updatedAt: Date
}

export interface UserToken {
    userId: string
    instagramUserId: string
    accessTokenEncrypted: string // Stored encrypted
    tokenType: 'short_lived' | 'long_lived'
    expiresAt: Date
    createdAt: Date
}

export interface InstagramAccount {
    userId: string
    instagramUserId: string
    username: string
    profilePictureUrl?: string
    accountType: 'BUSINESS' | 'CREATOR' | 'PERSONAL'
    isConnected: boolean
    connectedAt: Date
}

// ============================================================================
// Mock In-Memory Storage with globalThis for persistence across API routes
// ============================================================================

// Use globalThis to ensure data persists across API route instances
// This is needed in Next.js dev mode where each API route may run in different contexts
declare global {
    // eslint-disable-next-line no-var
    var __instagramCredentials: Map<string, UserCredentials> | undefined
    // eslint-disable-next-line no-var
    var __instagramTokens: Map<string, UserToken> | undefined
    // eslint-disable-next-line no-var
    var __instagramAccounts: Map<string, InstagramAccount> | undefined
}

// Initialize or get existing stores from globalThis
const credentialsStore = globalThis.__instagramCredentials ?? new Map<string, UserCredentials>()
const tokensStore = globalThis.__instagramTokens ?? new Map<string, UserToken>()
const accountsStore = globalThis.__instagramAccounts ?? new Map<string, InstagramAccount>()

// Save to globalThis for persistence
globalThis.__instagramCredentials = credentialsStore
globalThis.__instagramTokens = tokensStore
globalThis.__instagramAccounts = accountsStore

// ============================================================================
// Credentials Management (Client ID & Secret)
// ============================================================================

/**
 * Save user's Meta App credentials
 * Client Secret is encrypted before storage
 * 
 * @param userId - The user's unique identifier
 * @param clientId - Meta App Client ID (stored as plaintext)
 * @param clientSecret - Meta App Client Secret (will be encrypted)
 */
export async function saveUserCredentials(
    userId: string,
    clientId: string,
    clientSecret: string
): Promise<UserCredentials> {
    // Encrypt the client secret before storing
    const encryptedSecret = encrypt(clientSecret)

    const credentials: UserCredentials = {
        userId,
        clientId,
        clientSecretEncrypted: encryptedSecret,
        createdAt: new Date(),
        updatedAt: new Date(),
    }

    credentialsStore.set(userId, credentials)
    console.log(`[DB] Saved credentials for user: ${userId}`)

    return credentials
}

/**
 * Get user's Meta App credentials
 * Client Secret is returned decrypted
 * 
 * @param userId - The user's unique identifier
 * @returns Credentials with decrypted secret, or null if not found
 */
export async function getUserCredentials(
    userId: string
): Promise<{ clientId: string; clientSecret: string } | null> {
    const credentials = credentialsStore.get(userId)

    if (!credentials) {
        console.log(`[DB] No credentials found for user: ${userId}`)
        return null
    }

    // Decrypt the client secret before returning
    const decryptedSecret = decrypt(credentials.clientSecretEncrypted)

    return {
        clientId: credentials.clientId,
        clientSecret: decryptedSecret,
    }
}

/**
 * Check if user has saved credentials
 * 
 * @param userId - The user's unique identifier
 * @returns true if credentials exist
 */
export async function hasUserCredentials(userId: string): Promise<boolean> {
    return credentialsStore.has(userId)
}

/**
 * Delete user's credentials
 * 
 * @param userId - The user's unique identifier
 */
export async function deleteUserCredentials(userId: string): Promise<void> {
    credentialsStore.delete(userId)
    console.log(`[DB] Deleted credentials for user: ${userId}`)
}

// ============================================================================
// Token Management (Access Tokens)
// ============================================================================

/**
 * Save user's Instagram access token
 * Token is encrypted before storage
 * 
 * @param userId - The user's unique identifier
 * @param instagramUserId - Instagram user ID
 * @param accessToken - The access token (will be encrypted)
 * @param tokenType - 'short_lived' or 'long_lived'
 * @param expiresIn - Token lifetime in seconds
 */
export async function saveUserToken(
    userId: string,
    instagramUserId: string,
    accessToken: string,
    tokenType: 'short_lived' | 'long_lived',
    expiresIn: number
): Promise<UserToken> {
    // Encrypt the access token before storing
    const encryptedToken = encrypt(accessToken)

    // Calculate expiration date
    const expiresAt = new Date(Date.now() + expiresIn * 1000)

    const token: UserToken = {
        userId,
        instagramUserId,
        accessTokenEncrypted: encryptedToken,
        tokenType,
        expiresAt,
        createdAt: new Date(),
    }

    tokensStore.set(userId, token)
    console.log(`[DB] Saved ${tokenType} token for user: ${userId}, expires: ${expiresAt.toISOString()}`)

    return token
}

/**
 * Get user's Instagram access token
 * Returns decrypted token
 * 
 * @param userId - The user's unique identifier
 * @returns Token info with decrypted access token, or null if not found/expired
 */
export async function getUserToken(
    userId: string
): Promise<{
    accessToken: string
    instagramUserId: string
    tokenType: 'short_lived' | 'long_lived'
    expiresAt: Date
    isExpired: boolean
} | null> {
    const token = tokensStore.get(userId)

    if (!token) {
        console.log(`[DB] No token found for user: ${userId}`)
        return null
    }

    // Decrypt the access token
    const decryptedToken = decrypt(token.accessTokenEncrypted)

    // Check if token is expired
    const isExpired = new Date() > token.expiresAt

    if (isExpired) {
        console.log(`[DB] Token expired for user: ${userId}`)
    }

    return {
        accessToken: decryptedToken,
        instagramUserId: token.instagramUserId,
        tokenType: token.tokenType,
        expiresAt: token.expiresAt,
        isExpired,
    }
}

/**
 * Delete user's token
 * 
 * @param userId - The user's unique identifier
 */
export async function deleteUserToken(userId: string): Promise<void> {
    tokensStore.delete(userId)
    console.log(`[DB] Deleted token for user: ${userId}`)
}

// ============================================================================
// Instagram Account Management
// ============================================================================

/**
 * Save connected Instagram account info
 */
export async function saveInstagramAccount(
    userId: string,
    instagramUserId: string,
    username: string,
    accountType: 'BUSINESS' | 'CREATOR' | 'PERSONAL',
    profilePictureUrl?: string
): Promise<InstagramAccount> {
    const account: InstagramAccount = {
        userId,
        instagramUserId,
        username,
        profilePictureUrl,
        accountType,
        isConnected: true,
        connectedAt: new Date(),
    }

    accountsStore.set(userId, account)
    console.log(`[DB] Saved Instagram account @${username} for user: ${userId}`)

    return account
}

/**
 * Get user's connected Instagram account
 */
export async function getInstagramAccount(
    userId: string
): Promise<InstagramAccount | null> {
    return accountsStore.get(userId) || null
}

/**
 * Disconnect Instagram account
 */
export async function disconnectInstagramAccount(userId: string): Promise<void> {
    const account = accountsStore.get(userId)
    if (account) {
        account.isConnected = false
        accountsStore.set(userId, account)
    }
    // Also delete token
    await deleteUserToken(userId)
    console.log(`[DB] Disconnected Instagram account for user: ${userId}`)
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get full user status (for dashboard display)
 */
export async function getUserInstagramStatus(userId: string): Promise<{
    hasCredentials: boolean
    isConnected: boolean
    account: InstagramAccount | null
    tokenStatus: 'valid' | 'expired' | 'none'
}> {
    const hasCredentials = await hasUserCredentials(userId)
    const account = await getInstagramAccount(userId)
    const token = await getUserToken(userId)

    let tokenStatus: 'valid' | 'expired' | 'none' = 'none'
    if (token) {
        tokenStatus = token.isExpired ? 'expired' : 'valid'
    }

    return {
        hasCredentials,
        isConnected: account?.isConnected || false,
        account,
        tokenStatus,
    }
}
