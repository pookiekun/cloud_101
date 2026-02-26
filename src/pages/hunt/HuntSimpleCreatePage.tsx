import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Loader2, Radio } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import architectures from '@/data/architectures.json'

export default function HuntSimpleCreatePage() {
    const navigate = useNavigate()
    const { profile } = useAuthStore()
    const [creating, setCreating] = useState(false)
    const [selectedArch, setSelectedArch] = useState<1 | 2>(1)

    const handleCreate = async () => {
        if (!profile?.user_id) return
        setCreating(true)
        try {
            const userId = profile.user_id

            // Generate a short unique session code client-side
            const sessionCode = `H${Math.random().toString(36).slice(2, 5).toUpperCase()}${Math.random().toString(36).slice(2, 4).toUpperCase()}`.slice(0, 6)

            // Create the session
            const { data: session, error: sErr } = await supabase
                .from('hunt_sessions')
                .insert({
                    architecture_id: selectedArch,
                    organizer_id: userId,
                    session_code: sessionCode,
                    status: 'lobby',
                })
                .select()
                .single()

            if (sErr) throw sErr

            // Add organizer as first player
            await supabase.from('hunt_players').insert({
                session_id: session.id,
                player_id: userId,
                is_organizer: true,
                is_imposter: false,
            })

            toast.success('Game created!')
            navigate(`/hunt/simple/${session.id}`)
        } catch (err) {
            console.error('Error creating simple game:', err)
            toast.error('Failed to create game')
        } finally {
            setCreating(false)
        }
    }

    return (
        <div className="min-h-screen pt-8 pb-24 px-4">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="relative inline-block mb-4">
                        <motion.div
                            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.1, 0.4] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute inset-0 rounded-full bg-stellar-purple blur-xl"
                        />
                        <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-stellar-purple via-[#7c3aed] to-cosmic-blue flex items-center justify-center shadow-2xl shadow-stellar-purple/50 border border-stellar-purple/40"
                        >
                            <span className="text-4xl select-none">⚡</span>
                        </motion.div>
                    </div>
                    <h1 className="text-3xl font-black text-star-white mb-2">Clash Mode</h1>
                    <p className="text-moon-gray">Perfect for 20–60 players · ~20 minutes</p>
                </motion.div>

                {/* Architecture Selection */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6"
                >
                    <h2 className="text-lg font-semibold text-star-white mb-3">Choose Architecture</h2>
                    <div className="space-y-3">
                        {architectures.architectures.map(arch => (
                            <button
                                key={arch.id}
                                onClick={() => setSelectedArch(arch.id as 1 | 2)}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedArch === arch.id
                                    ? 'border-stellar-purple bg-stellar-purple/20'
                                    : 'border-stellar-purple/30 bg-cosmic-blue/10 hover:border-stellar-purple/60'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${selectedArch === arch.id
                                        ? 'border-stellar-purple bg-stellar-purple'
                                        : 'border-moon-gray'
                                        }`} />
                                    <div>
                                        <p className="text-star-white font-semibold">{arch.name}</p>
                                        <p className="text-moon-gray text-sm">
                                            {arch.components.length} components · {arch.description}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* How it works */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8 p-5 rounded-xl bg-stellar-purple/10 border border-stellar-purple/30"
                >
                    <h3 className="text-star-white font-semibold mb-3 flex items-center gap-2">
                        <Radio className="w-4 h-4 text-stellar-purple" />
                        How Clash Mode Works
                    </h3>
                    <ol className="space-y-2">
                        {[
                            'A QR code appears on this screen — players scan it to join',
                            'You see a live list of everyone who joined',
                            'Tap players to mark them as imposters',
                            'Hit Start — everyone\'s phone instantly shows their card',
                            'Players walk around, explain their AWS component, find the imposter!',
                        ].map((step, i) => (
                            <li key={i} className="flex gap-2 text-sm text-moon-gray">
                                <span className="text-stellar-purple font-bold flex-shrink-0">{i + 1}.</span>
                                <span>{step}</span>
                            </li>
                        ))}
                    </ol>
                </motion.div>

                {/* Create Button */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <button
                        onClick={handleCreate}
                        disabled={creating}
                        className="w-full py-5 rounded-xl bg-stellar-purple hover:bg-stellar-purple/90 disabled:bg-stellar-purple/30 text-star-white font-bold text-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-stellar-purple/30"
                    >
                        {creating
                            ? <><Loader2 className="w-6 h-6 animate-spin" /> Creating...</>
                            : <><span className="text-2xl">⚡</span> Create Game</>}
                    </button>
                </motion.div>
            </div>
        </div>
    )
}
