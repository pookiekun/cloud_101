import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, AlertTriangle, Home, RotateCcw } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { useHuntStore } from '@/lib/huntStore'
import confetti from 'canvas-confetti'

interface PlayerResult {
    id: string
    player_name: string
    is_imposter: boolean
    cards_placed: number
}

export default function HuntResultsPage() {
    const { sessionId } = useParams<{ sessionId: string }>()
    const navigate = useNavigate()
    const { profile } = useAuthStore()
    const { currentSession, players, boardCards } = useHuntStore()
    const [playerResults, setPlayerResults] = useState<PlayerResult[]>([])
    const [imposterCards, setImposterCards] = useState<string[]>([])

    useEffect(() => {
        if (!sessionId || !profile) return

        // Calculate player results
        const results = players.map(player => {
            const placedCount = boardCards.filter(
                card => card.placed_by_player_id === player.player_id
            ).length

            return {
                id: player.player_id,
                player_name: player.profile?.full_name || 'Unknown',
                is_imposter: player.is_imposter,
                cards_placed: placedCount
            }
        })

        setPlayerResults(results)

        // Find imposter cards on board
        const imposterCardIds = boardCards
            .filter(card => card.is_imposter_card)
            .map(card => card.component_name)

        setImposterCards(imposterCardIds)

        // Trigger confetti if crew won
        if (currentSession?.winner === 'crew') {
            const duration = 3000
            const end = Date.now() + duration

            const frame = () => {
                confetti({
                    particleCount: 3,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#8B5CF6', '#00FF88', '#60A5FA']
                })
                confetti({
                    particleCount: 3,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#8B5CF6', '#00FF88', '#60A5FA']
                })

                if (Date.now() < end) {
                    requestAnimationFrame(frame)
                }
            }
            frame()
        }
    }, [sessionId, profile, players, boardCards, currentSession])

    const crewWon = currentSession?.winner === 'crew'
    const impostersWon = currentSession?.winner === 'imposter'

    const handlePlayAgain = () => {
        navigate('/hunt')
    }

    const handleGoHome = () => {
        navigate('/grid')
    }

    return (
        <div className="min-h-screen pt-8 pb-24 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Winner Banner */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className={`
            mb-8 p-8 rounded-2xl text-center
            ${crewWon ? 'bg-green-500/20 border-2 border-green-500' : ''}
            ${impostersWon ? 'bg-red-500/20 border-2 border-red-500' : ''}
          `}
                >
                    <motion.div
                        initial={{ rotate: -180, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                    >
                        {crewWon && <Trophy className="w-20 h-20 text-green-400 mx-auto mb-4" />}
                        {impostersWon && <AlertTriangle className="w-20 h-20 text-red-400 mx-auto mb-4" />}
                    </motion.div>

                    <h1 className={`
            text-4xl font-bold mb-2
            ${crewWon ? 'text-green-400' : ''}
            ${impostersWon ? 'text-red-400' : ''}
          `}>
                        {crewWon && '🎉 Crew Victory!'}
                        {impostersWon && '💀 Imposters Win!'}
                    </h1>

                    <p className="text-xl text-moon-gray">
                        {crewWon && 'The architecture is complete with NO imposter components!'}
                        {impostersWon && `The architecture was infiltrated! ${imposterCards.length} imposter card(s) were placed.`}
                    </p>
                </motion.div>

                {/* Imposter Cards Reveal (if any) */}
                {imposterCards.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mb-8 p-6 rounded-xl bg-red-500/10 border border-red-500/30"
                    >
                        <h3 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Imposter Cards Placed
                        </h3>
                        <div className="space-y-2">
                            {imposterCards.map((cardName, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.4 + idx * 0.1 }}
                                    className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 font-medium"
                                >
                                    {cardName}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Player Roles Reveal */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mb-8"
                >
                    <h2 className="text-2xl font-bold text-star-white mb-4">Player Roles</h2>
                    <div className="space-y-3">
                        {playerResults.map((player, idx) => (
                            <motion.div
                                key={player.id}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.6 + idx * 0.1 }}
                                className={`
                  p-4 rounded-xl flex items-center justify-between
                  ${player.is_imposter
                                        ? 'bg-red-500/10 border border-red-500/30'
                                        : 'bg-cosmic-blue/20 border border-stellar-purple/30'
                                    }
                `}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                    ${player.is_imposter ? 'bg-red-500/30 text-red-400' : 'bg-green-500/30 text-green-400'}
                  `}>
                                        {player.player_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-star-white">{player.player_name}</h3>
                                        <p className={`text-sm ${player.is_imposter ? 'text-red-400' : 'text-green-400'}`}>
                                            {player.is_imposter ? '💀 Imposter' : '✅ Crew Member'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-stellar-purple">{player.cards_placed}</p>
                                    <p className="text-xs text-moon-gray">cards placed</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Architecture Board Summary */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mb-8 p-6 rounded-xl bg-cosmic-blue/20 border border-stellar-purple/30"
                >
                    <h3 className="text-lg font-bold text-star-white mb-3">Final Architecture Board</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {boardCards.map((card, idx) => (
                            <div
                                key={idx}
                                className={`
                  p-3 rounded-lg text-center
                  ${card.is_imposter_card
                                        ? 'bg-red-500/20 border border-red-500/50'
                                        : 'bg-green-500/10 border border-green-500/30'
                                    }
                `}
                            >
                                <p className="text-sm font-medium text-star-white">{card.component_name}</p>
                                <p className="text-xs text-moon-gray mt-1">
                                    {card.is_imposter_card ? '💀 Imposter' : '✅ Crew'}
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="flex gap-4"
                >
                    <button
                        onClick={handlePlayAgain}
                        className="flex-1 py-4 px-6 rounded-lg bg-stellar-purple hover:bg-stellar-purple/90 text-star-white font-semibold flex items-center justify-center gap-2 transition-all hover:scale-105"
                    >
                        <RotateCcw className="w-5 h-5" />
                        Play Again
                    </button>
                    <button
                        onClick={handleGoHome}
                        className="flex-1 py-4 px-6 rounded-lg bg-cosmic-blue/30 hover:bg-cosmic-blue/50 text-star-white font-semibold flex items-center justify-center gap-2 transition-all border border-stellar-purple/30"
                    >
                        <Home className="w-5 h-5" />
                        Go Home
                    </button>
                </motion.div>
            </div>
        </div>
    )
}
