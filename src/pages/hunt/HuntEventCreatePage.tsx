import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Users, Settings, Play } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import architectures from '@/data/architectures.json'
import toast from 'react-hot-toast'

export default function HuntEventCreatePage() {
    const navigate = useNavigate()
    const { profile } = useAuthStore()
    const [loading, setLoading] = useState(false)
    const [eventName, setEventName] = useState('')
    const [description, setDescription] = useState('')
    const [architectureId, setArchitectureId] = useState<1 | 2>(1)
    const [numSessions, setNumSessions] = useState(6)
    const [playersPerSession, setPlayersPerSession] = useState(10)

    const totalPlayers = numSessions * playersPerSession

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!profile || !eventName.trim()) {
            toast.error('Event name is required')
            return
        }

        setLoading(true)
        try {
            // Generate event code
            const { data: codeData } = await supabase.rpc('generate_hunt_event_code')
            const eventCode = codeData || 'EVT1'

            // Create event
            const { data: event, error: eventError } = await supabase
                .from('hunt_events')
                .insert({
                    name: eventName,
                    description: description || null,
                    organizer_id: profile.user_id,
                    event_code: eventCode,
                    max_players_per_session: playersPerSession,
                    architecture_id: architectureId,
                    status: 'setup',
                })
                .select()
                .single()

            if (eventError) throw eventError

            // Create multiple sessions for the event
            const sessionPromises = []
            for (let i = 1; i <= numSessions; i++) {
                // Generate session code
                const sessionCodePromise = supabase.rpc('generate_hunt_session_code')
                sessionPromises.push(sessionCodePromise)
            }

            const sessionCodes = await Promise.all(sessionPromises)

            // Insert all sessions
            const sessionsToInsert = sessionCodes.map((codeResult, i) => ({
                event_id: event.id,
                session_name: `Session ${i + 1}`,
                architecture_id: architectureId,
                organizer_id: profile.user_id,
                session_code: codeResult.data || `S${i + 1}`,
                status: 'lobby',
            }))

            const { error: sessionsError } = await supabase
                .from('hunt_sessions')
                .insert(sessionsToInsert)

            if (sessionsError) throw sessionsError

            toast.success('Event created with multiple sessions!')
            navigate(`/hunt/event/${event.id}`)
        } catch (error) {
            console.error('Error creating event:', error)
            toast.error('Failed to create event')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen pt-8 pb-24 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <Users className="w-16 h-16 text-stellar-purple mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-star-white mb-2">
                        Create Multi-Session Event
                    </h1>
                    <p className="text-moon-gray">
                        Perfect for large groups - run multiple Hunt sessions simultaneously
                    </p>
                </motion.div>

                {/* Form */}
                <motion.form
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    onSubmit={handleCreateEvent}
                    className="space-y-6"
                >
                    {/* Event Name */}
                    <div>
                        <label className="block text-sm font-medium text-moon-gray mb-2">
                            Event Name *
                        </label>
                        <input
                            type="text"
                            value={eventName}
                            onChange={(e) => setEventName(e.target.value)}
                            placeholder="CLOUD 101 Networking Night"
                            className="w-full px-4 py-3 rounded-lg bg-space-navy border border-stellar-purple/30 text-star-white placeholder-moon-gray focus:outline-none focus:border-stellar-purple transition-colors"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-moon-gray mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Fun networking game with AWS architecture components"
                            rows={3}
                            className="w-full px-4 py-3 rounded-lg bg-space-navy border border-stellar-purple/30 text-star-white placeholder-moon-gray focus:outline-none focus:border-stellar-purple transition-colors resize-none"
                        />
                    </div>

                    {/* Architecture Selection */}
                    <div>
                        <label className="block text-sm font-medium text-moon-gray mb-3">
                            Architecture
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {architectures.architectures.map((arch) => (
                                <button
                                    key={arch.id}
                                    type="button"
                                    onClick={() => setArchitectureId(arch.id as 1 | 2)}
                                    className={`
                    p-4 rounded-lg border-2 transition-all text-left
                    ${architectureId === arch.id
                                            ? 'border-stellar-purple bg-stellar-purple/20'
                                            : 'border-stellar-purple/30 bg-cosmic-blue/10 hover:border-stellar-purple/50'
                                        }
                  `}
                                >
                                    <h3 className="text-sm font-semibold text-star-white mb-1">
                                        {arch.name}
                                    </h3>
                                    <p className="text-xs text-moon-gray">
                                        {arch.components.length} components
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Session Configuration */}
                    <div className="p-6 rounded-xl bg-stellar-purple/10 border border-stellar-purple/30 space-y-4">
                        <div className="flex items-center gap-2 text-stellar-purple mb-3">
                            <Settings className="w-5 h-5" />
                            <h3 className="font-semibold">Session Configuration</h3>
                        </div>

                        {/* Number of Sessions */}
                        <div>
                            <label className="block text-sm font-medium text-moon-gray mb-2">
                                Number of Sessions: {numSessions}
                            </label>
                            <input
                                type="range"
                                min="2"
                                max="12"
                                value={numSessions}
                                onChange={(e) => setNumSessions(parseInt(e.target.value))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-moon-gray mt-1">
                                <span>2</span>
                                <span>12</span>
                            </div>
                        </div>

                        {/* Players per Session */}
                        <div>
                            <label className="block text-sm font-medium text-moon-gray mb-2">
                                Players per Session: {playersPerSession}
                            </label>
                            <input
                                type="range"
                                min="4"
                                max="10"
                                value={playersPerSession}
                                onChange={(e) => setPlayersPerSession(parseInt(e.target.value))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-moon-gray mt-1">
                                <span>4</span>
                                <span>10</span>
                            </div>
                        </div>

                        {/* Total Capacity */}
                        <div className="p-4 rounded-lg bg-cosmic-blue/20 border border-stellar-purple/20 text-center">
                            <p className="text-sm text-moon-gray mb-1">Total Event Capacity</p>
                            <p className="text-3xl font-bold text-stellar-purple">
                                {totalPlayers} <span className="text-lg">players</span>
                            </p>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || !eventName.trim()}
                        className="w-full py-4 px-6 rounded-lg bg-stellar-purple hover:bg-stellar-purple/90 disabled:bg-stellar-purple/30 disabled:cursor-not-allowed text-star-white font-semibold flex items-center justify-center gap-3 transition-all"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-star-white border-t-transparent rounded-full animate-spin" />
                                Creating Event...
                            </>
                        ) : (
                            <>
                                <Play className="w-5 h-5" />
                                Create Event with {numSessions} Sessions
                            </>
                        )}
                    </button>
                </motion.form>

                {/* Info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-6 p-4 rounded-lg bg-stellar-purple/10 border border-stellar-purple/20"
                >
                    <p className="text-sm text-moon-gray text-center">
                        After creation, you'll get a dashboard to monitor all sessions.
                        Players can join specific sessions using their session codes.
                    </p>
                </motion.div>
            </div>
        </div>
    )
}
