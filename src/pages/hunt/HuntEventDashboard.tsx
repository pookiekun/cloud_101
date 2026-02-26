import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { Users, Copy, Check, RefreshCw, Skull } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'


interface HuntEvent {
    id: string
    name: string
    description?: string
    event_code: string
    max_players_per_session: number
    architecture_id: 1 | 2
    status: string
}

interface SessionData {
    id: string
    session_name: string
    session_code: string
    status: string
    player_count: number
}


export default function HuntEventDashboard() {
    const { eventId } = useParams<{ eventId: string }>()
    const navigate = useNavigate()
    const { profile } = useAuthStore()
    const [event, setEvent] = useState<HuntEvent | null>(null)
    const [sessions, setSessions] = useState<SessionData[]>([])
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState<string | null>(null)

    const [startingGame, setStartingGame] = useState(false)

    useEffect(() => {
        if (eventId && profile) {
            fetchEventData()
        }
    }, [eventId, profile])

    const fetchEventData = async () => {
        try {
            // Fetch event
            const { data: eventData, error: eventError } = await supabase
                .from('hunt_events')
                .select('*')
                .eq('id', eventId)
                .single()

            if (eventError) throw eventError
            setEvent(eventData)

            // Fetch all sessions for this event
            const { data: sessionsData, error: sessionsError } = await supabase
                .from('hunt_sessions')
                .select('id, session_name, session_code, status')
                .eq('event_id', eventId)
                .order('session_name')

            if (sessionsError) throw sessionsError

            // Fetch player counts for each session
            const sessionsWithCounts = await Promise.all(
                (sessionsData || []).map(async (session) => {
                    const { count } = await supabase
                        .from('hunt_players')
                        .select('*', { count: 'exact', head: true })
                        .eq('session_id', session.id)

                    return {
                        ...session,
                        player_count: count || 0,
                    }
                })
            )

            setSessions(sessionsWithCounts)
        } catch (error) {
            console.error('Error fetching event data:', error)
            toast.error('Failed to load event')
        } finally {
            setLoading(false)
        }
    }

    const handleCopyCode = (code: string, type: 'event' | 'session') => {
        navigator.clipboard.writeText(code)
        setCopied(code)
        toast.success(`${type === 'event' ? 'Event' : 'Session'} code copied!`)
        setTimeout(() => setCopied(null), 2000)
    }


    // Auto-assign imposters and start game immediately
    const openRoleAssignment = async (session: SessionData) => {
        setStartingGame(true)

        try {
            // Fetch players for this session
            const { data: players, error: fetchError } = await supabase
                .from('hunt_players')
                .select('*')
                .eq('session_id', session.id)

            if (fetchError) {
                console.error('Error fetching players:', fetchError)
                toast.error('Failed to load players')
                setStartingGame(false)
                return
            }

            if (!players || players.length < 4) {
                toast.error('Need at least 4 players to start')
                setStartingGame(false)
                return
            }

            // AUTO-ASSIGN IMPOSTERS based on player count
            const numImposters = players.length >= 7 ? 2 : 1

            // Shuffle players and pick first N as imposters
            const shuffled = [...players].sort(() => Math.random() - 0.5)
            const imposterIds = shuffled.slice(0, numImposters).map(p => p.player_id)

            console.log(`🎲 Auto-assigning ${numImposters} imposter(s) from ${players.length} players`)

            // Update all players: set is_imposter for selected ones
            for (const player of players) {
                const isImposter = imposterIds.includes(player.player_id)
                await supabase
                    .from('hunt_players')
                    .update({ is_imposter: isImposter })
                    .eq('id', player.id)
            }

            console.log('✅ Imposters assigned')

            // Activate session
            await supabase
                .from('hunt_sessions')
                .update({ status: 'active' })
                .eq('id', session.id)

            console.log('✅ Game started successfully!')
            toast.success(`${session.session_name} started with ${numImposters} imposter(s)!`)
            fetchEventData()
        } catch (error) {
            console.error('❌ Error starting game:', error)
            toast.error('Failed to start game')
        } finally {
            setStartingGame(false)
        }
    }



    if (loading) {
        return (
            <div className="min-h-screen pt-8 pb-24 px-4 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-stellar-purple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-moon-gray">Loading event dashboard...</p>
                </div>
            </div>
        )
    }

    if (!event) {
        return (
            <div className="min-h-screen pt-8 pb-24 px-4 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-moon-gray mb-4">Event not found</p>
                    <button
                        onClick={() => navigate('/hunt')}
                        className="px-6 py-3 rounded-lg bg-stellar-purple text-star-white font-semibold"
                    >
                        Back to Hunt
                    </button>
                </div>
            </div>
        )
    }

    const totalPlayers = sessions.reduce((sum, s) => sum + s.player_count, 0)
    const activeSessions = sessions.filter((s) => s.status === 'active').length
    const completeSessions = sessions.filter((s) => s.status === 'complete').length

    return (
        <div className="min-h-screen pt-8 pb-24 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-star-white mb-2">
                                {event.name}
                            </h1>
                            {event.description && (
                                <p className="text-moon-gray">{event.description}</p>
                            )}
                        </div>
                        <button
                            onClick={fetchEventData}
                            className="p-2 rounded-lg bg-stellar-purple/20 hover:bg-stellar-purple/30 transition-colors"
                        >
                            <RefreshCw className="w-5 h-5 text-stellar-purple" />
                        </button>
                    </div>

                    {/* Event Code */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stellar-purple/20 border border-stellar-purple">
                        <span className="text-sm text-moon-gray">Event Code:</span>
                        <span className="text-xl font-mono font-bold text-stellar-purple">
                            {event.event_code}
                        </span>
                        <button
                            onClick={() => handleCopyCode(event.event_code, 'event')}
                            className="p-1 rounded hover:bg-stellar-purple/20"
                        >
                            {copied === event.event_code ? (
                                <Check className="w-4 h-4 text-green-400" />
                            ) : (
                                <Copy className="w-4 h-4 text-stellar-purple" />
                            )}
                        </button>
                    </div>
                </motion.div>

                {/* Stats Overview */}
                <div className="grid md:grid-cols-4 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-4 rounded-xl bg-cosmic-blue/20 border border-stellar-purple/30 text-center"
                    >
                        <p className="text-sm text-moon-gray mb-1">Total Players</p>
                        <p className="text-3xl font-bold text-stellar-purple">{totalPlayers}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="p-4 rounded-xl bg-cosmic-blue/20 border border-stellar-purple/30 text-center"
                    >
                        <p className="text-sm text-moon-gray mb-1">Total Sessions</p>
                        <p className="text-3xl font-bold text-star-white">{sessions.length}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-4 rounded-xl bg-cosmic-blue/20 border border-stellar-purple/30 text-center"
                    >
                        <p className="text-sm text-moon-gray mb-1">Active</p>
                        <p className="text-3xl font-bold text-green-400">{activeSessions}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="p-4 rounded-xl bg-cosmic-blue/20 border border-stellar-purple/30 text-center"
                    >
                        <p className="text-sm text-moon-gray mb-1">Complete</p>
                        <p className="text-3xl font-bold text-blue-400">{completeSessions}</p>
                    </motion.div>
                </div>

                {/* Actions - Removed Start All since manual assignment is required */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mb-6"
                >
                    <p className="text-sm text-moon-gray italic">
                        * Assign roles for each session manually to start
                    </p>
                </motion.div>

                {/* Sessions Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sessions.map((session, index) => {
                        const statusColor =
                            session.status === 'active'
                                ? 'bg-green-500/20 border-green-500 text-green-400'
                                : session.status === 'complete'
                                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                    : 'bg-cosmic-blue/20 border-stellar-purple/30 text-moon-gray'

                        const isReady = session.player_count >= 4

                        return (
                            <motion.div
                                key={session.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + index * 0.05 }}
                                className={`p-5 rounded-xl border-2 transition-all ${statusColor}`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-star-white mb-1">
                                            {session.session_name}
                                        </h3>
                                        <span className="text-xs px-2 py-1 rounded bg-stellar-purple/20 text-stellar-purple">
                                            {session.status}
                                        </span>
                                    </div>
                                    <Users className="w-5 h-5" />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-moon-gray">Players:</span>
                                        <span className={`font-semibold ${isReady ? 'text-green-400' : 'text-moon-gray'}`}>
                                            {session.player_count} / {event.max_players_per_session}
                                            {isReady && ' ✓'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 px-3 py-2 rounded bg-space-navy text-stellar-purple font-mono text-sm">
                                            {session.session_code}
                                        </code>
                                        <button
                                            onClick={() => handleCopyCode(session.session_code, 'session')}
                                            className="p-2 rounded bg-stellar-purple/20 hover:bg-stellar-purple/30 transition-colors"
                                        >
                                            {copied === session.session_code ? (
                                                <Check className="w-4 h-4 text-green-400" />
                                            ) : (
                                                <Copy className="w-4 h-4 text-stellar-purple" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Individual Start Button - Opens Role Assignment */}
                                    {session.status === 'lobby' && (
                                        <button
                                            onClick={() => openRoleAssignment(session)}
                                            disabled={!isReady || startingGame}
                                            className={`
                                                mt-3 w-full py-2 px-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all
                                                ${isReady && !startingGame
                                                    ? 'bg-stellar-purple hover:bg-stellar-purple/80 text-white'
                                                    : 'bg-stellar-purple/20 text-moon-gray cursor-not-allowed'
                                                }
                                            `}
                                        >
                                            {startingGame ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Skull className="w-4 h-4" />
                                            )}
                                            {startingGame ? 'Starting...' : (isReady ? 'Assign Roles & Start' : 'Need 4+ Players')}

                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Instructions */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 p-4 rounded-lg bg-stellar-purple/10 border border-stellar-purple/20"
                >
                    <h3 className="font-semibold text-star-white mb-2">Instructions:</h3>
                    <ol className="text-sm text-moon-gray space-y-1 list-decimal list-inside">
                        <li>Share session codes with participants</li>
                        <li>Players join specific sessions using their codes</li>
                        <li>Each session needs minimum 4 players to start</li>
                        <li>Start sessions individually or click "Start All Ready Sessions"</li>
                    </ol>
                </motion.div>


            </div>
        </div>
    )
}

// Helper function: Deal cards to all players in a session

