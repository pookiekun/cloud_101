import { useEffect, useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { Users, Play, Copy, Check, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { useHuntPlayersSubscription, useHuntSessionSubscription } from '@/lib/huntSubscriptions'
import architectures from '@/data/architectures.json'
import toast from 'react-hot-toast'

export default function HuntLobbyPage() {
    const { sessionId } = useParams<{ sessionId: string }>()
    const navigate = useNavigate()
    const { profile } = useAuthStore()
    const [session, setSession] = useState<any>(null)
    const [players, setPlayers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [starting, setStarting] = useState(false)
    const [copied, setCopied] = useState(false)
    const hasNavigated = useRef(false)

    // Real-time subscriptions for automatic updates
    const fetchSessionData = useCallback(async () => {
        if (!sessionId || !profile) return

        try {
            // Fetch session
            const { data: sessionData, error: sessionError } = await supabase
                .from('hunt_sessions')
                .select('*')
                .eq('id', sessionId)
                .single()

            if (sessionError) throw sessionError
            setSession(sessionData)

            // Fetch players
            const { data: playersData, error: playersError } = await supabase
                .from('hunt_players')
                .select('*, profile:player_id(full_name, linkedin_url)')
                .eq('session_id', sessionId)

            if (playersError) throw playersError
            setPlayers(playersData || [])

            setLoading(false)
        } catch (error) {
            console.error('Error fetching session:', error)
            toast.error('Failed to load session')
            setLoading(false)
        }
    }, [sessionId, profile])

    // Subscribe to player joins/leaves (auto-refetch when players change)
    useHuntPlayersSubscription(sessionId, fetchSessionData)

    // Subscribe to session status changes (e.g., game start)
    useHuntSessionSubscription(sessionId, (updatedSession) => {
        console.log('🔔 Session update received:', updatedSession)
        setSession(updatedSession)
        if (updatedSession.status === 'active') {
            toast.success('Game starting!')
            navigate(`/hunt/play/${sessionId}`)
        }
    })

    // AGGRESSIVE POLLING: Check every 1 second and navigate if active
    useEffect(() => {
        if (!sessionId) return

        console.log('🔄 Starting polling for session status changes...')

        const pollInterval = setInterval(async () => {
            if (hasNavigated.current) {
                console.log('⏭️ Already navigated, skipping poll')
                return
            }

            try {
                const { data: sessionData, error } = await supabase
                    .from('hunt_sessions')
                    .select('status')
                    .eq('id', sessionId)
                    .single()

                if (error) {
                    console.error('❌ Polling error:', error)
                    return
                }

                console.log('🔍 POLL - Session status:', sessionData?.status)

                // Navigate if status is 'active' - NO OTHER CONDITIONS!
                if (sessionData?.status === 'active') {
                    hasNavigated.current = true
                    console.log('✅✅✅ SESSION IS ACTIVE - NAVIGATING NOW!')
                    toast.success('Game starting!')
                    navigate(`/hunt/play/${sessionId}`)
                }
            } catch (error) {
                console.error('❌ Polling exception:', error)
            }
        }, 1000) // Check every 1 second

        return () => {
            console.log('🛑 Stopping polling')
            clearInterval(pollInterval)
        }
    }, [sessionId, navigate])

    useEffect(() => {
        fetchSessionData()
    }, [fetchSessionData])

    const handleCopyCode = () => {
        if (session?.session_code) {
            navigator.clipboard.writeText(session.session_code)
            setCopied(true)
            toast.success('Code copied!')
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleStartGame = async () => {
        if (!sessionId) return

        setStarting(true)
        try {
            // Update session status to 'active'
            const { error } = await supabase
                .from('hunt_sessions')
                .update({ status: 'active' })
                .eq('id', sessionId)

            if (error) throw error

            toast.success('Game starting!')
            navigate(`/hunt/play/${sessionId}`)
        } catch (error) {
            console.error('Error starting game:', error)
            toast.error('Failed to start game')
        } finally {
            setStarting(false)
        }
    }

    const handleLeaveSession = () => {
        navigate('/hunt')
    }

    const architecture = architectures.architectures.find(
        (a) => a.id === session?.architecture_id
    )

    const isOrganizer = session?.organizer_id === profile?.user_id

    if (loading) {
        return (
            <div className="min-h-screen pt-8 pb-24 px-4 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-16 h-16 text-stellar-purple animate-spin mx-auto mb-4" />
                    <p className="text-moon-gray">Loading lobby...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-8 pb-24 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-6"
                >
                    <h1 className="text-3xl font-bold text-star-white mb-2">
                        Hunt Lobby
                    </h1>
                    <p className="text-moon-gray">
                        {architecture?.name || 'Loading...'}
                    </p>
                    {isOrganizer && session?.event_id && (
                        <button
                            onClick={() => navigate(`/hunt/event/${session.event_id}`)}
                            className="mt-3 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors"
                        >
                            📊 Manage Event Dashboard
                        </button>
                    )}
                </motion.div>

                {/* Session Code Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6 p-6 rounded-xl bg-stellar-purple/20 border-2 border-stellar-purple text-center"
                >
                    <p className="text-sm text-moon-gray mb-2">Session Code</p>
                    <div className="flex items-center justify-center gap-3">
                        <span className="text-4xl font-mono font-bold text-stellar-purple tracking-wider">
                            {session?.session_code || 'LOADING'}
                        </span>
                        <button
                            onClick={handleCopyCode}
                            className="p-2 rounded-lg bg-stellar-purple/20 hover:bg-stellar-purple/30 transition-colors"
                        >
                            {copied ? (
                                <Check className="w-5 h-5 text-green-400" />
                            ) : (
                                <Copy className="w-5 h-5 text-stellar-purple" />
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-moon-gray mt-2">
                        Share this code with other players
                    </p>
                </motion.div>

                {/* Players List */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6 p-6 rounded-xl bg-cosmic-blue/20 border border-stellar-purple/30"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-star-white flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Players ({players.length})
                        </h3>
                        {players.length >= 4 && (
                            <span className="text-sm text-green-400">✓ Ready to start</span>
                        )}
                    </div>

                    <div className="space-y-3">
                        {players.length === 0 ? (
                            <p className="text-center text-moon-gray py-4">
                                Waiting for players to join...
                            </p>
                        ) : (
                            players.map((player, index) => {
                                const initials = player.profile?.full_name
                                    ?.split(' ')
                                    .map((w: string) => w[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase() || '??'

                                return (
                                    <motion.div
                                        key={player.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-stellar-purple/10 border border-stellar-purple/20"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-stellar-purple/30 border-2 border-stellar-purple flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm font-bold text-stellar-purple">
                                                {initials}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-star-white font-medium truncate">
                                                {player.profile?.full_name || 'Unknown'}
                                            </p>
                                            {player.player_id === session?.organizer_id && (
                                                <span className="text-xs text-stellar-purple">
                                                    Organizer
                                                </span>
                                            )}
                                        </div>
                                        {player.player_id === profile?.user_id && (
                                            <span className="text-xs text-moon-gray">(You)</span>
                                        )}
                                    </motion.div>
                                )
                            })
                        )}
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-3"
                >
                    {isOrganizer && (
                        <button
                            onClick={handleStartGame}
                            disabled={players.length < 4 || starting}
                            className="w-full py-4 px-6 rounded-lg bg-stellar-purple hover:bg-stellar-purple/90 disabled:bg-stellar-purple/30 disabled:cursor-not-allowed text-star-white font-semibold flex items-center justify-center gap-3 transition-all"
                        >
                            {starting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Starting Game...
                                </>
                            ) : (
                                <>
                                    <Play className="w-5 h-5" />
                                    Start Game
                                </>
                            )}
                        </button>
                    )}

                    <button
                        onClick={handleLeaveSession}
                        className="w-full py-3 px-6 rounded-lg border border-stellar-purple/50 text-moon-gray hover:text-star-white hover:border-stellar-purple font-medium flex items-center justify-center gap-2 transition-all"
                    >
                        Leave Lobby
                    </button>
                </motion.div>

                {/* Info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-6 p-4 rounded-lg bg-stellar-purple/10 border border-stellar-purple/20 text-center"
                >
                    {players.length < 4 ? (
                        <p className="text-sm text-moon-gray">
                            Need at least 4 players to start. {4 - players.length} more needed!
                        </p>
                    ) : isOrganizer ? (
                        <p className="text-sm text-moon-gray">
                            You're the organizer. Click "Start Game" when everyone is ready!
                        </p>
                    ) : (
                        <p className="text-sm text-moon-gray">
                            Waiting for the organizer to start the game...
                        </p>
                    )}
                </motion.div>
            </div>
        </div>
    )
}
