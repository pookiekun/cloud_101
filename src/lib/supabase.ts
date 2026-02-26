import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
    global: {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
    },
})

// Types
export interface Profile {
    id: string
    user_id: string
    full_name: string
    linkedin_url: string
    profile_picture_url?: string
    connection_code: string
    created_at: string
    updated_at: string
}

export interface Connection {
    id: string
    user_a_id: string
    user_b_id: string
    challenge_id: number
    connection_method: 'qr_scan' | 'manual_code'
    created_at: string
}

export interface BingoGridSlot {
    id: string
    user_id: string
    slot_index: number
    challenge_id?: number
    connection_id?: string
    updated_at: string
}
