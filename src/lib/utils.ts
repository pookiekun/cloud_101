import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Generate 8-character connection code using Base32 (no ambiguous characters)
export function generateConnectionCode(userId: string): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // No O, I, L, 0, 1
    let code = ''

    // Simple hash from userId
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
        hash = ((hash << 5) - hash) + userId.charCodeAt(i)
        hash = hash & hash // Convert to 32bit integer
    }

    // Generate 8 characters
    for (let i = 0; i < 8; i++) {
        const index = Math.abs((hash >> (i * 4)) & 31) % chars.length
        code += chars[index]
    }

    return code
}

// Format connection code with dash: AB12-CD34
export function formatConnectionCode(code: string): string {
    if (code.length !== 8) return code
    return `${code.slice(0, 4)}-${code.slice(4)}`
}

// Validate connection code format
export function isValidConnectionCode(code: string): boolean {
    const cleanCode = code.replace(/-/g, '').toUpperCase()
    return /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/.test(cleanCode)
}

// Format timestamp to relative time
export function formatRelativeTime(date: string | Date): string {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`

    const diffWeeks = Math.floor(diffDays / 7)
    return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`
}
