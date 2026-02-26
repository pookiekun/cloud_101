import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import architectures from '@/data/architectures.json'

export default function HuntHomePage() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen pt-6 pb-24 px-4">
            <div className="max-w-lg mx-auto">

                {/* ── Hero Icon + Title ─────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    {/* Animated glowing rocket */}
                    <div className="relative inline-block mb-4">
                        {/* Outer glow ring */}
                        <motion.div
                            animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.15, 0.4] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute inset-0 rounded-full bg-stellar-purple blur-xl"
                        />
                        {/* Icon container */}
                        <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-stellar-purple via-[#7c3aed] to-cosmic-blue flex items-center justify-center shadow-2xl shadow-stellar-purple/50 border border-stellar-purple/40"
                        >
                            <span className="text-4xl select-none">🚀</span>
                        </motion.div>
                    </div>

                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-3xl font-black text-star-white mb-1"
                    >
                        Hunt Game — Big Room
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-moon-gray text-sm"
                    >
                        Social deduction meets AWS architecture · 20–60 players
                    </motion.p>
                </motion.div>

                {/* ── Big Room Edition Buttons ──────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-stellar-purple/30 via-cosmic-blue/30 to-space-navy border-2 border-stellar-purple shadow-xl shadow-stellar-purple/20 mb-8"
                >
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/hunt/simple/create')}
                            className="w-full px-6 py-4 rounded-xl bg-stellar-purple hover:bg-stellar-purple/90 active:scale-95 text-star-white font-bold text-lg transition-all shadow-lg shadow-stellar-purple/40 flex items-center justify-center gap-3"
                        >
                            <span className="text-xl">🎮</span> I'm the Organizer
                        </button>
                        <button
                            onClick={() => navigate('/hunt/simple/join')}
                            className="w-full px-6 py-4 rounded-xl border-2 border-stellar-purple/60 text-stellar-purple hover:bg-stellar-purple hover:text-star-white active:scale-95 font-semibold text-lg transition-all flex items-center justify-center gap-3"
                        >
                            <span className="text-xl">📱</span> Join with a Code
                        </button>
                    </div>
                </motion.div>

                {/* ── Architecture Reference Images ─────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <h2 className="text-sm font-bold text-moon-gray uppercase tracking-widest mb-3 text-center">
                        Architecture Reference
                    </h2>
                    <div className="space-y-4">
                        {architectures.architectures.map((arch, i) => (
                            <motion.div
                                key={arch.id}
                                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.35 + i * 0.1 }}
                                className="rounded-xl overflow-hidden border border-stellar-purple/30 bg-cosmic-blue/10 shadow-lg"
                            >
                                {/* Card header */}
                                <div className="flex items-center gap-3 px-4 py-3 bg-stellar-purple/10 border-b border-stellar-purple/20">
                                    <div className="w-7 h-7 rounded-lg bg-stellar-purple/30 flex items-center justify-center text-sm font-black text-stellar-purple border border-stellar-purple/40">
                                        {arch.id}
                                    </div>
                                    <div>
                                        <p className="text-star-white font-semibold text-sm leading-tight">{arch.name}</p>
                                        <p className="text-moon-gray text-xs">{arch.components.length} components</p>
                                    </div>
                                </div>
                                {/* Arch image */}
                                <div className="relative">
                                    <img
                                        src={arch.image}
                                        alt={arch.name}
                                        className="w-full object-cover"
                                    />
                                    {/* Overlay with component pills */}
                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-space-navy/90 to-transparent flex flex-wrap gap-1 justify-center">
                                        {arch.components.map(c => (
                                            <span
                                                key={c.id}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stellar-purple/30 border border-stellar-purple/40 text-xs text-star-white font-medium backdrop-blur-sm"
                                            >
                                                <span>{c.icon}</span>
                                                <span className="hidden sm:inline">{c.name.replace('Amazon ', '').replace('AWS ', '')}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

            </div>
        </div>
    )
}
