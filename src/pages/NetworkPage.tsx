import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Users, Linkedin } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import challenges from '@/data/challenges.json'
import toast from 'react-hot-toast'

interface Connection {
    id: string
    user_a_id: string
    user_b_id: string
    challenge_id: number
    created_at: string
    partner_profile?: {
        full_name: string
        linkedin_url: string
    }
}

export default function NetworkPage() {
    const { profile } = useAuthStore()
    const [connections, setConnections] = useState<Connection[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetchConnections()
    }, [profile])

    const fetchConnections = async () => {
        if (!profile) return

        try {
            setLoading(true)

            // Fetch connections where user is either user_a or user_b (using profile ID)
            const { data, error } = await supabase
                .from('connections')
                .select(`
                    *,
                    user_a:profiles!connections_user_a_id_fkey(*),
                    user_b:profiles!connections_user_b_id_fkey(*)
                `)
                .or(`user_a_id.eq.${profile.id},user_b_id.eq.${profile.id}`)
                .order('created_at', { ascending: false })

            if (error) throw error

            // Map connections to include partner profile data
            const connectionsWithProfiles = (data || []).map((conn: any) => {
                // Determine which profile is the partner
                const partnerProfile = conn.user_a_id === profile.id ? conn.user_b : conn.user_a

                return {
                    ...conn,
                    partner_profile: partnerProfile || undefined,
                }
            })

            setConnections(connectionsWithProfiles)
        } catch (error) {
            console.error('Error fetching connections:', error)
            toast.error('Failed to load connections')
        } finally {
            setLoading(false)
        }
    }

    const filteredConnections = connections.filter((conn) =>
        conn.partner_profile?.full_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
    )

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        return date.toLocaleDateString()
    }

    if (loading) {
        return (
            <div className="min-h-screen pt-8 pb-24 px-4 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-stellar-purple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-moon-gray">Loading your network...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-8 pb-24 px-4">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto mb-6"
            >
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-bold text-star-white">My Network</h1>
                    <div className="flex items-center gap-2 text-stellar-purple">
                        <Users className="w-5 h-5" />
                        <span className="text-2xl font-bold">{connections.length}</span>
                    </div>
                </div>
                <p className="text-moon-gray">People you've connected with at CLOUD 101</p>
            </motion.div>

            {/* Search Bar */}
            {connections.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="max-w-2xl mx-auto mb-6"
                >
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-moon-gray" />
                        <input
                            type="text"
                            placeholder="Search connections..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-lg bg-cosmic-blue/20 border border-stellar-purple/30 text-star-white placeholder-moon-gray focus:outline-none focus:border-stellar-purple transition-colors"
                        />
                    </div>
                </motion.div>
            )}

            {/* Connections List */}
            <div className="max-w-2xl mx-auto space-y-4">
                {filteredConnections.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12"
                    >
                        {searchQuery ? (
                            <>
                                <Search className="w-16 h-16 text-moon-gray/50 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-star-white mb-2">
                                    No results found
                                </h3>
                                <p className="text-moon-gray">
                                    Try searching for a different name
                                </p>
                            </>
                        ) : (
                            <>
                                <Users className="w-16 h-16 text-moon-gray/50 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-star-white mb-2">
                                    No connections yet
                                </h3>
                                <p className="text-moon-gray mb-4">
                                    Start scanning QR codes to build your network!
                                </p>
                                <button
                                    onClick={() => window.location.href = '/grid'}
                                    className="px-6 py-3 rounded-lg bg-stellar-purple hover:bg-stellar-purple/90 text-star-white font-semibold transition-all"
                                >
                                    Start Connecting
                                </button>
                            </>
                        )}
                    </motion.div>
                ) : (
                    filteredConnections.map((connection, index) => {
                        const challenge = challenges.challenges[connection.challenge_id - 1]
                        const partnerInitials = connection.partner_profile?.full_name
                            .split(' ')
                            .map((w) => w[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()

                        return (
                            <motion.div
                                key={connection.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-5 rounded-xl bg-cosmic-blue/20 border border-stellar-purple/30 hover:border-stellar-purple/50 transition-all"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Avatar */}
                                    <div className="w-14 h-14 rounded-full bg-stellar-purple/30 border-2 border-stellar-purple flex items-center justify-center flex-shrink-0">
                                        <span className="text-lg font-bold text-stellar-purple">
                                            {partnerInitials}
                                        </span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <h3 className="text-lg font-semibold text-star-white truncate">
                                                {connection.partner_profile?.full_name}
                                            </h3>
                                            <span className="text-xs text-moon-gray whitespace-nowrap">
                                                {formatDate(connection.created_at)}
                                            </span>
                                        </div>

                                        {/* Challenge Badge */}
                                        {challenge && (
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stellar-purple/20 border border-stellar-purple/50 mb-3">
                                                <span className="text-lg">{challenge.emoji}</span>
                                                <span className="text-sm font-medium text-stellar-purple">
                                                    {challenge.title}
                                                </span>
                                            </div>
                                        )}

                                        {/* LinkedIn Link */}
                                        {connection.partner_profile?.linkedin_url && (
                                            <a
                                                href={connection.partner_profile.linkedin_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-sm text-moon-gray hover:text-stellar-purple transition-colors"
                                            >
                                                <Linkedin className="w-4 h-4" />
                                                View LinkedIn Profile
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
