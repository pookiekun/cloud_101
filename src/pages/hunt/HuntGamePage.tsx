import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Skull, Users, Shield } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import HuntCard from '@/components/hunt/HuntCard'
import architectures from '@/data/architectures.json'

export default function HuntGamePage() {
    const { sessionId } = useParams<{ sessionId: string }>()
    const navigate = useNavigate()
    const { profile } = useAuthStore()

    const [session, setSession] = useState<any>(null)
    const [myCards, setMyCards] = useState<any[]>([])
    const [isImposter, setIsImposter] = useState(false)
    const [loading, setLoading] = useState(true)
    const [playerName, setPlayerName] = useState('')

    useEffect(() => {
        if (sessionId && profile) {
            fetchGameData()
        }
    }, [sessionId, profile])

    const fetchGameData = async () => {
        if (!sessionId || !profile) return

        try {
            // Fetch session
            const { data: sessionData } = await supabase
                .from('hunt_sessions')
                .select('*')
                .eq('id', sessionId)
                .single()

            setSession(sessionData)

            // Fetch my player data to check if imposter
            const { data: myPlayerData } = await supabase
                .from('hunt_players')
                .select('*, profile:profiles!hunt_players_player_id_fkey(full_name)')
                .eq('session_id', sessionId)
                .eq('player_id', profile.user_id)
                .single()

            let isImposterRole = false
            if (myPlayerData) {
                isImposterRole = myPlayerData.is_imposter || false
                setIsImposter(isImposterRole)
                setPlayerName(myPlayerData.profile?.full_name || 'Player')
            }

            // SIMPLE LOGIC: Show ALL cards based on role
            const cards = isImposterRole ? getImposterCards() : getAllCrewCards()

            console.log('✅ Loaded', cards.length, 'cards for', isImposterRole ? 'IMPOSTER' : 'CREW')
            setMyCards(cards)

        } catch (error) {
            console.error('Error fetching game data:', error)
        } finally {
            setLoading(false)
        }
    }

    // Get ALL components from BOTH architectures for crew
    const getAllCrewCards = () => {
        const allComponents = [
            ...architectures.architectures[0].components,
            ...architectures.architectures[1].components
        ]

        return allComponents.map((comp, index) => ({
            id: `crew-card-${index}`,
            component_id: comp.id,
            component_name: comp.name,
            is_imposter_card: false,
            brief_text: comp.brief,
            icon: comp.icon
        }))
    }

    // Get imposter cards
    const getImposterCards = () => {
        return [
            {
                id: 'imposter-card-1',
                component_id: 'imposter',
                component_name: 'Imposter Card',
                is_imposter_card: true,
                brief_text: 'You are an IMPOSTER! Bluff your way through.',
                icon: '💀'
            },
            {
                id: 'imposter-card-2',
                component_id: 'imposter',
                component_name: 'Imposter Card',
                is_imposter_card: true,
                brief_text: 'You are an IMPOSTER! Bluff your way through.',
                icon: '💀'
            },
            {
                id: 'imposter-card-3',
                component_id: 'imposter',
                component_name: 'Imposter Card',
                is_imposter_card: true,
                brief_text: 'You are an IMPOSTER! Bluff your way through.',
                icon: '💀'
            }
        ]
    }

    if (loading) {
        return (
            <div className="min-h-screen pt-8 pb-24 px-4 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-stellar-purple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-moon-gray">Loading your cards...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-6 pb-24 px-4">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-6"
                >
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/hunt')}
                            className="p-2 rounded-lg bg-stellar-purple/20 hover:bg-stellar-purple/30"
                        >
                            <ArrowLeft className="w-5 h-5 text-stellar-purple" />
                        </button>
                        {session?.organizer_id === profile?.user_id && session?.event_id && (
                            <button
                                onClick={() => navigate(`/hunt/event/${session.event_id}`)}
                                className="px-3 py-1.5 rounded-lg bg-stellar-purple text-star-white text-sm font-semibold hover:bg-stellar-purple/80 transition-colors"
                            >
                                Manage Game
                            </button>
                        )}
                    </div>
                    <h1 className="text-xl font-bold text-star-white text-right">
                        {session?.session_name || 'Hunt Game'}
                    </h1>
                </motion.div>

                {/* Role Badge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className={`p-6 rounded-xl mb-6 text-center ${isImposter
                            ? 'bg-red-500/20 border-2 border-red-500'
                            : 'bg-green-500/20 border-2 border-green-500'
                        }`}
                >
                    {isImposter ? (
                        <Skull className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    ) : (
                        <Shield className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    )}
                    <h2 className="text-2xl font-bold text-star-white mb-1">
                        {playerName}
                    </h2>
                    <p className={`text-lg font-semibold ${isImposter ? 'text-red-400' : 'text-green-400'}`}>
                        You are {isImposter ? 'IMPOSTER' : 'CREW'}
                    </p>
                    <p className="text-sm text-moon-gray mt-2">
                        {isImposter
                            ? 'Use your knowledge to find the imposter!'
                            : 'Bluff your way through!'}
                    </p>
                </motion.div>

                {/* Cards Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-stellar-purple" />
                        <h3 className="text-lg font-semibold text-star-white">
                            Your Cards ({myCards.length})
                        </h3>
                    </div>

                    {myCards.length === 0 ? (
                        <div className="p-8 rounded-xl bg-cosmic-blue/20 border border-stellar-purple/30 text-center">
                            <p className="text-moon-gray mb-2">No cards yet...</p>
                            <p className="text-sm text-moon-gray">
                                Wait for the organizer to start the game.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {myCards.map((card) => (
                                <HuntCard key={card.id} card={card} />
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* How to Play */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 rounded-xl bg-stellar-purple/10 border border-stellar-purple/30"
                >
                    <h4 className="text-sm font-semibold text-star-white mb-2">How to Play:</h4>
                    <ul className="space-y-1 text-xs text-moon-gray">
                        <li>• Your cards have REAL AWS service info</li>
                        <li>• When asked, explain your component clearly</li>
                        <li>• Watch for suspect or incorrect explanations</li>
                        <li>• Help identify the imposter!</li>
                    </ul>
                </motion.div>
            </div>
        </div>
    )
}
