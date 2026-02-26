import { create } from 'zustand'
import { User, Session } from '@supabase/supabase-js'
import { supabase, Profile } from './supabase'

interface AuthStore {
    user: User | null
    session: Session | null
    profile: Profile | null
    isLoading: boolean
    error: string | null

    setUser: (user: User | null) => void
    setSession: (session: Session | null) => void
    setProfile: (profile: Profile | null) => void
    setLoading: (isLoading: boolean) => void
    setError: (error: string | null) => void
    initialize: () => Promise<void>
    signOut: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    session: null,
    profile: null,
    isLoading: true,
    error: null,

    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),
    setProfile: (profile) => set({ profile }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),

    initialize: async () => {
        try {
            set({ isLoading: true, error: null })

            // Get current session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

            if (sessionError) throw sessionError

            if (session?.user) {
                set({ user: session.user, session })

                // Fetch profile
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .single()

                if (profileError && profileError.code !== 'PGRST116') {
                    console.error('Error fetching profile:', profileError)
                } else if (profile) {
                    set({ profile })
                }
            }

            // Listen for auth changes
            supabase.auth.onAuthStateChange(async (_event, session) => {
                set({ session, user: session?.user ?? null })

                if (session?.user) {
                    // Fetch updated profile
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('user_id', session.user.id)
                        .single()

                    set({ profile })
                } else {
                    set({ profile: null })
                }
            })

        } catch (error) {
            console.error('Auth initialization error:', error)
            set({ error: error instanceof Error ? error.message : 'Unknown error' })
        } finally {
            set({ isLoading: false })
        }
    },

    signOut: async () => {
        try {
            await supabase.auth.signOut()
            set({ user: null, session: null, profile: null })
        } catch (error) {
            console.error('Sign out error:', error)
            set({ error: error instanceof Error ? error.message : 'Sign out failed' })
        }
    },
}))
