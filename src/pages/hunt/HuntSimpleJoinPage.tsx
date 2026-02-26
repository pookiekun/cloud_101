import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { QrCode, ArrowRight, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function HuntSimpleJoinPage() {
    const navigate = useNavigate()
    const { profile } = useAuthStore()
    const [code, setCode] = useState('')
    const [joining, setJoining] = useState(false)

    const handleJoin = async () => {
        if (!profile || code.trim().length < 4) return
        setJoining(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Find session by code
            const { data: session, error: sErr } = await supabase
                .from('hunt_sessions')
                .select('*')
                .eq('session_code', code.trim().toUpperCase())
                .single()

            if (sErr || !session) {
                toast.error('Session not found. Check the code and try again.')
                return
            }

            // Check if already joined
            const { data: existing } = await supabase
                .from('hunt_players')
                .select('id')
                .eq('session_id', session.id)
                .eq('player_id', user.id)
                .single()

            if (!existing) {
                // Join the session
                const { error: joinErr } = await supabase.from('hunt_players').insert({
                    session_id: session.id,
                    player_id: user.id,
                    is_organizer: false,
                    is_imposter: false,
                })
                if (joinErr) throw joinErr
            }

            toast.success('Joined! Waiting for the organizer...')
            navigate(`/hunt/simple/${session.id}`)
        } catch (err) {
            console.error('Join error:', err)
            toast.error('Failed to join. Please try again.')
        } finally {
            setJoining(false)
        }
    }

    return (
        <div className="min-h-screen pt-16 pb-24 px-4 flex items-center justify-center">
            <div className="max-w-sm w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <QrCode className="w-16 h-16 text-stellar-purple mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-star-white mb-2">Join Hunt Game</h1>
                    <p className="text-moon-gray">Enter the code from the screen</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-2xl bg-cosmic-blue/20 border-2 border-stellar-purple/50"
                >
                    <input
                        type="text"
                        inputMode="text"
                        placeholder="e.g. HUNT42"
                        value={code}
                        onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                        onKeyDown={e => e.key === 'Enter' && handleJoin()}
                        maxLength={8}
                        className="w-full text-center text-3xl font-mono font-black uppercase tracking-widest py-4 px-4 rounded-xl bg-space-navy border-2 border-stellar-purple/40 text-stellar-purple placeholder:text-moon-gray/40 focus:outline-none focus:border-stellar-purple transition-all mb-4"
                        autoFocus
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                    />

                    <button
                        onClick={handleJoin}
                        disabled={code.trim().length < 4 || joining}
                        className="w-full py-4 rounded-xl bg-stellar-purple hover:bg-stellar-purple/90 disabled:bg-stellar-purple/30 disabled:cursor-not-allowed text-star-white font-bold text-lg flex items-center justify-center gap-2 transition-all"
                    >
                        {joining
                            ? <><Loader2 className="w-5 h-5 animate-spin" /> Joining...</>
                            : <><ArrowRight className="w-5 h-5" /> Join Game</>}
                    </button>
                </motion.div>

                <p className="text-center text-xs text-moon-gray mt-6">
                    You can also scan the QR code on the screen to join instantly
                </p>
            </div>
        </div>
    )
}
