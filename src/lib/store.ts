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

// Guard against multiple simultaneous initialize() calls
// (can happen on mobile when the page regains focus / visibility)
let initializeCalled = false

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
        // Prevent double-init race that produces AbortError
        if (initializeCalled) return
        initializeCalled = true

        try {
            set({ isLoading: true, error: null })

            // getSession() reads from local storage — no network call, no AbortError
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

            if (sessionError) {
                // Non-fatal: session simply doesn't exist yet
                console.warn('Session read error (non-fatal):', sessionError.message)
            }

            if (session?.user) {
                set({ user: session.user, session })

                // Fetch profile — explicit timeout so we don't hang forever
                try {
                    const { data: profile, error: profileError } = await Promise.race([
                        supabase
                            .from('profiles')
                            .select('*')
                            .eq('user_id', session.user.id)
                            .maybeSingle(),
                        new Promise<never>((_, reject) =>
                            setTimeout(() => reject(new Error('Profile fetch timed out')), 8000)
                        ),
                    ]) as any

                    if (profileError && profileError.code !== 'PGRST116') {
                        // PGRST116 = no rows returned (first-time user, no profile yet) — fine
                        console.warn('Profile fetch warning:', profileError.message)
                    } else if (profile) {
                        set({ profile })
                    }
                } catch (profileErr: any) {
                    // Timeout or network error fetching profile — non-fatal, user just goes to setup
                    console.warn('Could not fetch profile:', profileErr.message)
                }
            }

            // Listen for auth changes (token refresh, sign-in from another tab, etc.)
            supabase.auth.onAuthStateChange(async (_event, session) => {
                set({ session, user: session?.user ?? null })

                if (session?.user) {
                    try {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('user_id', session.user.id)
                            .maybeSingle()
                        set({ profile: profile ?? null })
                    } catch {
                        // Ignore profile fetch error on auth state change
                    }
                } else {
                    set({ profile: null })
                }
            })

        } catch (error: any) {
            // AbortError from Supabase internal init — harmless, ignore it
            if (error?.name === 'AbortError') {
                console.warn('Auth init AbortError (harmless, ignoring)')
            } else {
                console.error('Auth initialization error:', error)
                set({ error: error instanceof Error ? error.message : 'Unknown error' })
            }
        } finally {
            // Allow re-initialization if the page is fully refreshed
            // (module is re-evaluated on hard reload so initializeCalled resets anyway)
            set({ isLoading: false })
        }
    },

    signOut: async () => {
        try {
            initializeCalled = false  // Allow re-init after sign-out
            await supabase.auth.signOut()
            set({ user: null, session: null, profile: null })
        } catch (error) {
            console.error('Sign out error:', error)
            set({ error: error instanceof Error ? error.message : 'Sign out failed' })
        }
    },
}))
