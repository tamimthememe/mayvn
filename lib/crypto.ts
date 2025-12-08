/**
 * Crypto Utilities for Token Encryption
 * 
 * Provides simple encryption/decryption for storing sensitive data.
 * In production, use a more robust solution with proper key management.
 */

import crypto from 'crypto'

// Encryption key from environment or fallback for development
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'mayvn-dev-key-32-chars-exactly!!'
const ALGORITHM = 'aes-256-cbc'
const IV_LENGTH = 16

/**
 * Encrypt a string using AES-256-CBC
 */
export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'utf8'), iv)
    let encrypted = cipher.update(text)
    encrypted = Buffer.concat([encrypted, cipher.final()])
    return iv.toString('hex') + ':' + encrypted.toString('hex')
}

/**
 * Decrypt a string encrypted with the encrypt function
 */
export function decrypt(text: string): string {
    const textParts = text.split(':')
    const iv = Buffer.from(textParts.shift()!, 'hex')
    const encryptedText = Buffer.from(textParts.join(':'), 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'utf8'), iv)
    let decrypted = decipher.update(encryptedText)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    return decrypted.toString()
}
