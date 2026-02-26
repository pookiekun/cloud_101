import { create } from 'zustand'
import { Connection, Profile } from './supabase'

export interface ConnectionWithProfile extends Connection {
    profile?: Profile
}

interface NetworkStore {
    connections: ConnectionWithProfile[]
    searchTerm: string
    sortBy: 'recent' | 'alphabetical' | 'challenge'
    isLoading: boolean

    setConnections: (connections: ConnectionWithProfile[]) => void
    addConnection: (connection: ConnectionWithProfile) => void
    setSearchTerm: (term: string) => void
    setSortBy: (sortBy: 'recent' | 'alphabetical' | 'challenge') => void
    setLoading: (isLoading: boolean) => void
    getFilteredConnections: () => ConnectionWithProfile[]
}

export const useNetworkStore = create<NetworkStore>((set, get) => ({
    connections: [],
    searchTerm: '',
    sortBy: 'recent',
    isLoading: false,

    setConnections: (connections) => set({ connections }),

    addConnection: (connection) => {
        const current = get().connections
        if (!current.find(c => c.id === connection.id)) {
            set({ connections: [connection, ...current] })
        }
    },

    setSearchTerm: (term) => set({ searchTerm: term }),

    setSortBy: (sortBy) => set({ sortBy }),

    setLoading: (isLoading) => set({ isLoading }),

    getFilteredConnections: () => {
        const { connections, searchTerm, sortBy } = get()

        // Filter by search term
        let filtered = connections
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            filtered = connections.filter(c =>
                c.profile?.full_name?.toLowerCase().includes(term)
            )
        }

        // Sort
        const sorted = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'alphabetical':
                    return (a.profile?.full_name || '').localeCompare(b.profile?.full_name || '')
                case 'challenge':
                    return a.challenge_id - b.challenge_id
                case 'recent':
                default:
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            }
        })

        return sorted
    },
}))
