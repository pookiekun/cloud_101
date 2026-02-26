import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { KeyRound, ArrowRight } from 'lucide-react'
import { useHuntStore } from '@/lib/huntStore'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'

export default function HuntJoinPage() {
    const navigate = useNavigate()
    const { profile } = useAuthStore()
    const { joinSession } = useHuntStore()
    const [sessionCode, setSessionCode] = useState('')
    const [loading, setLoading] = useState(false)

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow alphanumeric, max 6 chars, auto-uppercase
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
        setSessionCode(value)
    }

    const handleJoinSession = async (e: React.FormEvent) => {
        e.preventDefault()

        if (sessionCode.length !== 6) {
            toast.error('Session code must be 6 characters')
            return
        }

        if (!profile) {
            toast.error('Please log in first')
            return
        }

        setLoading(true)
        try {
            const session = await joinSession(sessionCode)
            toast.success('Joined session!')

            // Note: We'd need to get the session ID to navigate properly
            // For now, we'll navigate to hunt home and let them rejoin
            navigate(`/hunt/lobby/${session.id}`)
        } catch (error: any) {
            console.error('Error joining session:', error)
            if (error.code === 'PGRST116') {
                toast.error('Session not found. Check the code and try again.')
            } else if (error.code === '23505') {
                toast.error('You already joined this session!')
            } else {
                toast.error('Failed to join session')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen pt-8 pb-24 px-4 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <KeyRound className="w-16 h-16 text-stellar-purple mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-star-white mb-2">
                        Join Hunt Session
                    </h1>
                    <p className="text-moon-gray">
                        Enter the 6-character session code
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleJoinSession} className="space-y-6">
                    {/* Code Input */}
                    <div>
                        <label className="block text-sm font-medium text-moon-gray mb-2">
                            Session Code
                        </label>
                        <input
                            type="text"
                            value={sessionCode}
                            onChange={handleCodeChange}
                            placeholder="ABC123"
                            className="w-full px-4 py-4 rounded-lg bg-space-navy border border-stellar-purple/30 text-star-white text-center text-3xl font-mono tracking-widest focus:outline-none focus:border-stellar-purple transition-colors"
                            autoFocus
                            maxLength={6}
                        />
                        <p className="text-xs text-moon-gray mt-2 text-center">
                            {sessionCode.length}/6 characters
                        </p>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={sessionCode.length !== 6 || loading}
                        className="w-full py-4 px-6 rounded-lg bg-stellar-purple hover:bg-stellar-purple/90 disabled:bg-stellar-purple/30 disabled:cursor-not-allowed text-star-white font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-star-white border-t-transparent rounded-full animate-spin" />
                                Joining...
                            </>
                        ) : (
                            <>
                                Join Session
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                {/* Help Text */}
                <div className="mt-8 p-4 rounded-lg bg-stellar-purple/10 border border-stellar-purple/30">
                    <p className="text-sm text-moon-gray text-center">
                        Ask the organizer for the session code. You'll join the lobby and wait for the game to start.
                    </p>
                </div>

                {/* Back Link */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => navigate('/hunt')}
                        className="text-stellar-purple hover:text-stellar-purple/80 font-medium transition-colors"
                    >
                        ← Back to Hunt Home
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
