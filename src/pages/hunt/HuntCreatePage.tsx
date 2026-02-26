import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Play, Copy, Check } from 'lucide-react'
import { useHuntStore } from '@/lib/huntStore'
import { useAuthStore } from '@/lib/store'
import architectures from '@/data/architectures.json'
import toast from 'react-hot-toast'

export default function HuntCreatePage() {
    const navigate = useNavigate()
    const { profile } = useAuthStore()
    const { selectedArchitectureId, createSession } = useHuntStore()
    const [loading, setLoading] = useState(false)
    const [sessionCode, setSessionCode] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const architecture = architectures.architectures.find(
        (a) => a.id === selectedArchitectureId
    )

    const handleCreateSession = async () => {
        if (!profile || !selectedArchitectureId) return

        setLoading(true)
        try {
            const session = await createSession(selectedArchitectureId)
            setSessionCode(session.session_code)
            toast.success('Session created!')

            // Navigate to lobby after a moment
            setTimeout(() => {
                navigate(`/hunt/lobby/${session.id}`)
            }, 2000)
        } catch (error) {
            console.error('Error creating session:', error)
            toast.error('Failed to create session')
        } finally {
            setLoading(false)
        }
    }

    const handleCopyCode = () => {
        if (sessionCode) {
            navigator.clipboard.writeText(sessionCode)
            setCopied(true)
            toast.success('Code copied!')
            setTimeout(() => setCopied(false), 2000)
        }
    }

    if (!architecture) {
        return (
            <div className="min-h-screen pt-8 pb-24 px-4 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-moon-gray mb-4">No architecture selected</p>
                    <button
                        onClick={() => navigate('/hunt')}
                        className="px-6 py-3 rounded-lg bg-stellar-purple text-star-white font-semibold"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-8 pb-24 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Architecture Preview */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-2xl font-bold text-star-white mb-2 text-center">
                        Create Hunt Session
                    </h1>
                    <p className="text-moon-gray text-center mb-6">
                        {architecture.name}
                    </p>

                    <div className="p-4 rounded-xl bg-cosmic-blue/20 border border-stellar-purple/30">
                        <img
                            src={architecture.image}
                            alt={architecture.name}
                            className="w-full rounded-lg"
                        />
                    </div>
                </motion.div>

                {/* Components List */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8 p-6 rounded-xl bg-cosmic-blue/20 border border-stellar-purple/30"
                >
                    <h3 className="text-lg font-semibold text-star-white mb-4">
                        Components in this Architecture
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {architecture.components.map((comp) => (
                            <div
                                key={comp.id}
                                className="flex items-center gap-2 p-3 rounded-lg bg-stellar-purple/10 border border-stellar-purple/20"
                            >
                                <span className="text-2xl">{comp.icon}</span>
                                <span className="text-sm text-star-white font-medium">
                                    {comp.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Session Code Display (after creation) */}
                {sessionCode && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-8 p-6 rounded-xl bg-stellar-purple/20 border-2 border-stellar-purple text-center"
                    >
                        <h3 className="text-lg font-semibold text-star-white mb-2">
                            Session Code
                        </h3>
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <span className="text-4xl font-mono font-bold text-stellar-purple tracking-wider">
                                {sessionCode}
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
                        <p className="text-sm text-moon-gray">
                            Share this code with other players to join
                        </p>
                    </motion.div>
                )}

                {/* Create Button */}
                {!sessionCode && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <button
                            onClick={handleCreateSession}
                            disabled={loading}
                            className="w-full py-4 px-6 rounded-lg bg-stellar-purple hover:bg-stellar-purple/90 disabled:bg-stellar-purple/30 disabled:cursor-not-allowed text-star-white font-semibold flex items-center justify-center gap-3 transition-all"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-star-white border-t-transparent rounded-full animate-spin" />
                                    Creating Session...
                                </>
                            ) : (
                                <>
                                    <Play className="w-5 h-5" />
                                    Create Session
                                </>
                            )}
                        </button>
                    </motion.div>
                )}

                {/* Info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-6 p-4 rounded-lg bg-stellar-purple/10 border border-stellar-purple/20 text-center"
                >
                    <p className="text-sm text-moon-gray">
                        You'll be the organizer. Players can join with the session code.
                        Start the game when everyone is ready!
                    </p>
                </motion.div>
            </div>
        </div>
    )
}
