import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams } from 'react-router-dom'
import { Skull, Shield, Users, QrCode, Copy, Check, RefreshCw, Play, Monitor } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import QRCode from 'react-qr-code'
import toast from 'react-hot-toast'
import architectures from '@/data/architectures.json'

interface Player {
    id: string
    player_id: string
    is_imposter: boolean
    is_organizer: boolean
    joined_at: string
    profile?: {
        full_name: string
        linkedin_url?: string
    }
}

interface Session {
    id: string
    session_code: string
    status: 'lobby' | 'active' | 'complete'
    organizer_id: string
    architecture_id: 1 | 2
}

// Imposter count scaling: ~1 per 6 players, max 10
function recommendedImposters(playerCount: number): number {
    return Math.min(10, Math.max(1, Math.round(playerCount / 6)))
}

// Assign a component to a player by index (wraps around component list)
function getComponentForPlayer(playerIndex: number, architectureId: 1 | 2) {
    const arch = architectures.architectures.find(a => a.id === architectureId)
    if (!arch) return null
    const comp = arch.components[playerIndex % arch.components.length]
    return comp
}

export default function HuntSimplePage() {
    const { sessionId } = useParams<{ sessionId: string }>()
    const { profile } = useAuthStore()
    const userId = profile?.user_id  // stable reference, no getUser() needed per-poll

    const [session, setSession] = useState<Session | null>(null)
    const [players, setPlayers] = useState<Player[]>([])
    const [loading, setLoading] = useState(true)
    const [starting, setStarting] = useState(false)
    const [copied, setCopied] = useState(false)
    const [myCard, setMyCard] = useState<{ isImposter: boolean; component?: any } | null>(null)
    const [gameStarted, setGameStarted] = useState(false)

    const isOrganizer = session?.organizer_id === userId
    const joinUrl = `${window.location.origin}/hunt/simple/${sessionId}`

    const fetchData = useCallback(async () => {
        if (!sessionId || !userId) return
        try {
            const { data: sessionData, error: sErr } = await supabase
                .from('hunt_sessions')
                .select('*')
                .eq('id', sessionId)
                .single()
            if (sErr) throw sErr
            setSession(sessionData)

            // Auto-join: if player not in session yet, add them (QR scan flow)
            const { data: existingPlayer } = await supabase
                .from('hunt_players')
                .select('id')
                .eq('session_id', sessionId)
                .eq('player_id', userId)
                .single()

            if (!existingPlayer && sessionData?.organizer_id !== userId && sessionData?.status === 'lobby') {
                await supabase.from('hunt_players').insert({
                    session_id: sessionId,
                    player_id: userId,
                    is_organizer: false,
                    is_imposter: false,
                })
            }

            const { data: playersData, error: pErr } = await supabase
                .from('hunt_players')
                .select('*, profile:player_id(full_name, linkedin_url)')
                .eq('session_id', sessionId)
                .order('joined_at', { ascending: true })
            if (pErr) throw pErr
            setPlayers(playersData || [])

            // If game is active, compute my card (only once — stop re-computing if already set)
            if (sessionData?.status === 'active') {
                setGameStarted(true)
                setMyCard(prev => {
                    if (prev) return prev  // already resolved, don't flicker
                    const me = (playersData || []).find((p: Player) => p.player_id === userId)
                    if (!me) return prev
                    if (me.is_imposter) return { isImposter: true }
                    const crewPlayers = (playersData || []).filter((p: Player) => !p.is_imposter)
                    const myCrewIndex = crewPlayers.findIndex((p: Player) => p.player_id === userId)
                    const component = getComponentForPlayer(myCrewIndex, sessionData.architecture_id)
                    return { isImposter: false, component }
                })
            }
        } catch (err) {
            console.error('Error fetching data:', err)
        } finally {
            setLoading(false)
        }
    }, [sessionId, userId])

    // Poll every 2 seconds for live player list + game start
    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 2000)
        return () => clearInterval(interval)
    }, [fetchData])

    const toggleImposter = async (player: Player) => {
        if (!isOrganizer || gameStarted) return
        const newVal = !player.is_imposter
        await supabase
            .from('hunt_players')
            .update({ is_imposter: newVal })
            .eq('id', player.id)
        setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, is_imposter: newVal } : p))
    }

    const handleStartGame = async () => {
        if (!sessionId || !isOrganizer) return
        setStarting(true)
        try {
            const { error } = await supabase
                .from('hunt_sessions')
                .update({ status: 'active' })
                .eq('id', sessionId)
            if (error) throw error
            toast.success('Game started! Players can see their cards now.')
            setGameStarted(true)
            fetchData()
        } catch (err) {
            console.error('Error starting game:', err)
            toast.error('Failed to start game')
        } finally {
            setStarting(false)
        }
    }

    const handleCopyCode = () => {
        if (session?.session_code) {
            navigator.clipboard.writeText(session.session_code)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
            toast.success('Code copied!')
        }
    }

    const impostersCount = players.filter(p => p.is_imposter).length
    const recommended = recommendedImposters(players.length)

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-stellar-purple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-moon-gray">Loading game...</p>
                </div>
            </div>
        )
    }

    // ─── PLAYER VIEW: Game active → show card ────────────────────────────────
    if (gameStarted && !isOrganizer && myCard) {
        return (
            <div className="min-h-screen pt-8 pb-24 px-4 flex items-center justify-center">
                <div className="max-w-sm w-full">
                    <AnimatePresence>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        >
                            {myCard.isImposter ? (
                                // ── IMPOSTER CARD
                                <div className="p-8 rounded-2xl bg-red-900/40 border-4 border-red-500 text-center shadow-2xl shadow-red-900/50">
                                    <motion.div
                                        animate={{ rotate: [0, -5, 5, -5, 0] }}
                                        transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.5 }}
                                    >
                                        <Skull className="w-24 h-24 text-red-500 mx-auto mb-4" />
                                    </motion.div>
                                    <h1 className="text-4xl font-black text-red-400 mb-2">IMPOSTER</h1>
                                    <p className="text-red-300 text-lg font-semibold mb-6">You are the imposter!</p>
                                    <div className="p-4 rounded-xl bg-red-900/40 border border-red-500/40 text-left space-y-2">
                                        <p className="text-sm text-red-200 font-semibold">Your mission:</p>
                                        <ul className="text-sm text-red-300 space-y-1">
                                            <li>• Mingle with everyone and listen to their components</li>
                                            <li>• When asked what your component is, pick any name and bluff convincingly</li>
                                            <li>• If others suspect you, deny everything!</li>
                                            <li>• You win if the group can't identify you</li>
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                // ── CREW CARD
                                <div className="p-8 rounded-2xl bg-green-900/40 border-4 border-green-500 text-center shadow-2xl shadow-green-900/50">
                                    <div className="text-7xl mb-4">{myCard.component?.icon}</div>
                                    <h1 className="text-3xl font-black text-green-400 mb-1">
                                        {myCard.component?.name}
                                    </h1>
                                    <p className="text-xs text-green-600 uppercase tracking-widest font-semibold mb-4">
                                        {myCard.component?.role}
                                    </p>
                                    <div className="p-4 rounded-xl bg-green-900/40 border border-green-500/40 text-left mb-4">
                                        <p className="text-sm text-green-200 leading-relaxed">
                                            {myCard.component?.brief}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-space-navy/60 border border-green-500/20 text-left">
                                        <p className="text-xs text-green-400 font-semibold mb-1">Your mission:</p>
                                        <p className="text-xs text-moon-gray">
                                            Walk around, explain your component to others, and help find the imposter!
                                        </p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        )
    }

    // ─── PLAYER VIEW: Waiting for game to start ───────────────────────────────
    if (!isOrganizer) {
        const me = players.find(p => p.player_id === profile?.user_id)
        return (
            <div className="min-h-screen pt-8 pb-24 px-4 flex items-center justify-center">
                <div className="max-w-sm w-full text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-8 rounded-2xl bg-cosmic-blue/20 border-2 border-stellar-purple/50"
                    >
                        <Shield className="w-16 h-16 text-stellar-purple mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-star-white mb-2">You're In!</h1>
                        {me?.profile?.full_name && (
                            <p className="text-stellar-purple font-semibold text-lg mb-4">
                                👋 {me.profile.full_name}
                            </p>
                        )}
                        <div className="flex items-center justify-center gap-2 mb-6">
                            <div className="w-2 h-2 rounded-full bg-stellar-purple animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 rounded-full bg-stellar-purple animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 rounded-full bg-stellar-purple animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <p className="text-moon-gray text-sm mb-6">
                            Waiting for the organizer to start the game...
                        </p>
                        <div className="p-3 rounded-lg bg-stellar-purple/10 border border-stellar-purple/20 text-left">
                            <p className="text-xs text-moon-gray">
                                <span className="text-stellar-purple font-semibold">👀 Look for the architecture</span> on the presentation screen while you wait!
                            </p>
                        </div>
                        <p className="text-xs text-moon-gray/50 mt-4">
                            {players.length} player{players.length !== 1 ? 's' : ''} joined
                        </p>
                    </motion.div>
                </div>
            </div>
        )
    }

    // ─── ORGANIZER VIEW ───────────────────────────────────────────────────────
    return (
        <div className="min-h-screen pt-6 pb-24 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                    <h1 className="text-2xl font-bold text-star-white mb-1">🎮 Simple Hunt — Organizer</h1>
                    <p className="text-moon-gray text-sm">Assign imposters, then start the game</p>
                </motion.div>

                {/* Presenter Link */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.05 }}
                    className="mb-4"
                >
                    <button
                        onClick={() => window.open(`/hunt/present/${sessionId}`, '_blank')}
                        className="w-full py-2.5 px-4 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 transition-all flex items-center justify-center gap-2 text-sm font-semibold"
                    >
                        <Monitor className="w-4 h-4" />
                        Open Presenter Screen (for projector)
                    </button>
                </motion.div>

                {/* QR Code + Manual Code */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6 p-5 rounded-xl bg-cosmic-blue/20 border-2 border-stellar-purple"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <QrCode className="w-5 h-5 text-stellar-purple" />
                        <h3 className="font-semibold text-star-white">Players Join Here</h3>
                    </div>
                    <div className="flex gap-4 items-center">
                        {/* QR Code */}
                        <div className="p-3 rounded-lg bg-white flex-shrink-0">
                            <QRCode value={joinUrl} size={120} />
                        </div>
                        {/* Code fallback */}
                        <div className="flex-1">
                            <p className="text-xs text-moon-gray mb-2">Or type the code manually:</p>
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-space-navy border border-stellar-purple/40">
                                <span className="text-2xl font-mono font-black text-stellar-purple tracking-widest flex-1">
                                    {session?.session_code}
                                </span>
                                <button onClick={handleCopyCode} className="p-1 hover:text-stellar-purple transition-colors">
                                    {copied
                                        ? <Check className="w-4 h-4 text-green-400" />
                                        : <Copy className="w-4 h-4 text-moon-gray" />}
                                </button>
                            </div>
                            <p className="text-xs text-moon-gray mt-2 leading-relaxed">
                                Players go to the app → Hunt → Clash Mode Join
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Imposter counter */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className={`mb-4 p-3 rounded-lg border text-sm font-medium flex items-center justify-between ${impostersCount === 0
                        ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                        : impostersCount > recommended + 2
                            ? 'bg-orange-500/10 border-orange-500/40 text-orange-400'
                            : 'bg-green-500/10 border-green-500/30 text-green-400'
                        }`}
                >
                    <span>
                        👥 {players.length} players · 💀 {impostersCount} imposter{impostersCount !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs opacity-70">Recommended: {recommended}</span>
                </motion.div>

                {/* Players List */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6"
                >
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-star-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-stellar-purple" />
                            Players ({players.length})
                        </h3>
                        <button
                            onClick={fetchData}
                            className="p-2 rounded-lg bg-stellar-purple/20 hover:bg-stellar-purple/30 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4 text-stellar-purple" />
                        </button>
                    </div>

                    {players.length === 0 ? (
                        <div className="p-8 rounded-xl bg-cosmic-blue/10 border border-stellar-purple/20 text-center">
                            <p className="text-moon-gray text-sm">Waiting for players to scan the QR code...</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {players.map((player, index) => {
                                const initials = player.profile?.full_name
                                    ?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '??'
                                const isMe = player.player_id === profile?.user_id

                                return (
                                    <motion.button
                                        key={player.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        onClick={() => !gameStarted && toggleImposter(player)}
                                        disabled={gameStarted || player.is_organizer}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${player.is_imposter
                                            ? 'bg-red-900/30 border-red-500 hover:bg-red-900/40'
                                            : 'bg-cosmic-blue/20 border-stellar-purple/30 hover:border-stellar-purple/60 hover:bg-cosmic-blue/30'
                                            } ${gameStarted || player.is_organizer ? 'cursor-default' : 'cursor-pointer'}`}
                                    >
                                        {/* Avatar */}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm border-2 ${player.is_imposter
                                            ? 'bg-red-500/30 border-red-500 text-red-400'
                                            : 'bg-stellar-purple/20 border-stellar-purple text-stellar-purple'
                                            }`}>
                                            {player.is_imposter ? '💀' : initials}
                                        </div>
                                        {/* Name */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-star-white font-medium truncate">
                                                {player.profile?.full_name || 'Unknown'}
                                                {isMe && <span className="text-moon-gray text-xs ml-2">(You)</span>}
                                            </p>
                                            {player.is_organizer && (
                                                <p className="text-xs text-stellar-purple">Organizer</p>
                                            )}
                                        </div>
                                        {/* Role badge */}
                                        {player.is_imposter && (
                                            <span className="text-xs font-bold text-red-400 bg-red-900/40 border border-red-500/50 px-2 py-1 rounded flex-shrink-0">
                                                IMPOSTER
                                            </span>
                                        )}
                                        {!player.is_organizer && !gameStarted && (
                                            <span className="text-xs text-moon-gray/40 flex-shrink-0">
                                                {player.is_imposter ? 'tap to remove' : 'tap to assign'}
                                            </span>
                                        )}
                                    </motion.button>
                                )
                            })}
                        </div>
                    )}
                </motion.div>

                {/* Start Button */}
                {!gameStarted && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                        <button
                            onClick={handleStartGame}
                            disabled={players.length < 2 || impostersCount === 0 || starting}
                            className="w-full py-4 px-6 rounded-xl bg-stellar-purple hover:bg-stellar-purple/90 disabled:bg-stellar-purple/30 disabled:cursor-not-allowed text-star-white font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-stellar-purple/30"
                        >
                            {starting
                                ? <><RefreshCw className="w-5 h-5 animate-spin" /> Starting...</>
                                : <><Play className="w-5 h-5" /> Start Game</>}
                        </button>
                        {impostersCount === 0 && players.length >= 2 && (
                            <p className="text-center text-xs text-yellow-400 mt-2">
                                ⚠️ Tap at least one player to assign them as imposter first
                            </p>
                        )}
                        {players.length < 2 && (
                            <p className="text-center text-xs text-moon-gray mt-2">
                                Need at least 2 players to start
                            </p>
                        )}
                    </motion.div>
                )}

                {gameStarted && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 rounded-xl bg-green-500/20 border-2 border-green-500 text-center"
                    >
                        <p className="text-green-400 font-bold text-lg">🎮 Game is Live!</p>
                        <p className="text-sm text-moon-gray mt-1">
                            Players can see their cards. Walk-around phase is active!
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
