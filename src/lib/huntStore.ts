import { create } from 'zustand'
import { supabase } from './supabase'
import { useAuthStore } from './store'
import architectures from '@/data/architectures.json'
import toast from 'react-hot-toast'

interface HuntPlayer {
    id: string
    session_id: string
    player_id: string
    is_imposter: boolean
    is_organizer: boolean
    profile?: {
        full_name: string
        linkedin_url: string
    }
}

interface HuntCard {
    id: string
    session_id: string
    player_id: string
    component_id: string
    component_name: string
    is_imposter_card: boolean
    brief_text?: string
    icon: string
    status: 'available' | 'placed' | 'discarded'
}

interface HuntBoardCard {
    id: string
    component_id: string
    component_name: string
    is_imposter_card: boolean
    placed_by_player_id: string
    placement_order: number
}

interface CurrentQuestion {
    id: string
    component_id: string
    component_name: string
    hunter_id: string
    round_number: number
}

interface PlayerResponse {
    player_id: string
    player_name: string
    pitch?: string
    card_id?: string
    has_card: boolean
    is_imposter: boolean
}

interface HuntSession {
    id: string
    architecture_id: 1 | 2
    organizer_id: string
    session_code: string
    status: 'lobby' | 'active' | 'complete'
    current_hunter_id?: string
    winner?: 'crew' | 'imposter' | null
}

interface HuntStore {
    // State
    currentSession: HuntSession | null
    players: HuntPlayer[]
    playerCards: HuntCard[]
    boardCards: HuntBoardCard[]
    currentQuestion: CurrentQuestion | null
    playerResponses: PlayerResponse[]
    selectedArchitectureId: 1 | 2 | null

    // Actions
    setSelectedArchitecture: (id: 1 | 2) => void
    createSession: (architectureId: 1 | 2) => Promise<HuntSession>
    joinSession: (code: string) => Promise<HuntSession>
    startGame: () => Promise<void>
    leaveSession: () => void

    // Game mechanics
    askForComponent: (componentId: string, componentName: string) => Promise<void>
    respondToQuestion: (pitch: string, cardId?: string) => Promise<void>
    acceptCard: (playerId: string) => Promise<void>
    checkWinCondition: () => Promise<void>
    clearResponses: () => void
}

export const useHuntStore = create<HuntStore>((set, get) => ({
    // Initial state
    currentSession: null,
    players: [],
    playerCards: [],
    boardCards: [],
    currentQuestion: null,
    playerResponses: [],
    selectedArchitectureId: null,

    setSelectedArchitecture: (id) => set({ selectedArchitectureId: id }),

    createSession: async (architectureId) => {
        const { profile } = useAuthStore.getState()
        if (!profile) throw new Error('Not authenticated')

        // Generate session code
        const { data: codeData } = await supabase.rpc('generate_hunt_session_code')
        const sessionCode = codeData || 'HUNT01'

        const { data, error } = await supabase
            .from('hunt_sessions')
            .insert({
                architecture_id: architectureId,
                organizer_id: profile.user_id,
                session_code: sessionCode,
                status: 'lobby',
            })
            .select()
            .single()

        if (error) throw error

        // Add organizer as first player
        await supabase.from('hunt_players').insert({
            session_id: data.id,
            player_id: profile.user_id,
            is_organizer: true,
        })

        set({ currentSession: data })
        return data
    },

    joinSession: async (code) => {
        const { profile } = useAuthStore.getState()
        if (!profile) throw new Error('Not authenticated')

        // Get current user directly from Supabase auth
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        // Find session by code
        const { data: session, error: sessionError } = await supabase
            .from('hunt_sessions')
            .select('*')
            .eq('session_code', code)
            .single()

        if (sessionError) throw sessionError

        // Join as player - use auth user ID to match RLS policy
        const { error: joinError } = await supabase.from('hunt_players').insert({
            session_id: session.id,
            player_id: user.id,
            is_organizer: false,
        })

        if (joinError) throw joinError

        set({ currentSession: session })
        return session
    },

    startGame: async () => {
        const { currentSession, players } = get()
        const { profile } = useAuthStore.getState()
        if (!currentSession || !profile) return

        // Select random imposters
        const imposterCount = players.length >= 6 ? 2 : 1
        const shuffledPlayers = [...players].sort(() => Math.random() - 0.5)
        const imposters = shuffledPlayers.slice(0, imposterCount)

        // Mark imposters
        for (const imposter of imposters) {
            await supabase
                .from('hunt_players')
                .update({ is_imposter: true })
                .eq('id', imposter.id)
        }

        // Deal cards
        await dealCards(currentSession.id, currentSession.architecture_id, players)

        // Update session status
        await supabase
            .from('hunt_sessions')
            .update({
                status: 'active',
                current_hunter_id: shuffledPlayers[0].player_id,
            })
            .eq('id', currentSession.id)
    },

    leaveSession: () => {
        set({
            currentSession: null,
            players: [],
            playerCards: [],
            boardCards: [],
            currentQuestion: null,
            playerResponses: [],
        })
    },

    askForComponent: async (componentId, componentName) => {
        const { currentSession } = get()
        const { profile } = useAuthStore.getState()
        if (!currentSession || !profile) return

        try {
            // Get current round number
            const { count } = await supabase
                .from('hunt_questions')
                .select('*', { count: 'exact', head: true })
                .eq('session_id', currentSession.id)

            const roundNumber = (count || 0) + 1

            // Create question
            const { data: question, error } = await supabase
                .from('hunt_questions')
                .insert({
                    session_id: currentSession.id,
                    hunter_id: profile.user_id,
                    component_id: componentId,
                    component_name: componentName,
                    round_number: roundNumber,
                })
                .select()
                .single()

            if (error) throw error

            set({ currentQuestion: question, playerResponses: [] })
            toast.success(`Asked: "Who has ${componentName}?"`)
        } catch (error) {
            console.error('Error asking for component:', error)
            toast.error('Failed to ask question')
        }
    },

    respondToQuestion: async (cardId) => {
        const { currentQuestion } = get()
        const { profile } = useAuthStore.getState()
        if (!currentQuestion || !profile) return

        try {
            // Submit response
            const { error } = await supabase.from('hunt_responses').insert({
                question_id: currentQuestion.id,
                player_id: profile.user_id,
                card_id: cardId,
                was_accepted: false,
            })

            if (error) throw error
            toast.success('Response submitted!')
        } catch (error) {
            console.error('Error responding to question:', error)
            toast.error('Failed to submit response')
        }
    },

    acceptCard: async (playerId) => {
        const { currentSession, currentQuestion, players } = get()
        if (!currentSession || !currentQuestion) return

        try {
            // Get the accepted player's card
            const { data: acceptedCard } = await supabase
                .from('hunt_cards')
                .select('*')
                .eq('session_id', currentSession.id)
                .eq('player_id', playerId)
                .eq('component_id', currentQuestion.component_id)
                .eq('status', 'available')
                .single()

            if (!acceptedCard) {
                toast.error('Card not found')
                return
            }

            // Get current board count
            const { count } = await supabase
                .from('hunt_board')
                .select('*', { count: 'exact', head: true })
                .eq('session_id', currentSession.id)

            const placementOrder = (count || 0) + 1

            // Place card on board
            await supabase.from('hunt_board').insert({
                session_id: currentSession.id,
                card_id: acceptedCard.id,
                placed_by_player_id: playerId,
                component_id: acceptedCard.component_id,
                component_name: acceptedCard.component_name,
                is_imposter_card: acceptedCard.is_imposter_card,
                placement_order: placementOrder,
            })

            // Update card status
            await supabase
                .from('hunt_cards')
                .update({ status: 'placed' })
                .eq('id', acceptedCard.id)

            // Mark response as accepted
            await supabase
                .from('hunt_responses')
                .update({ was_accepted: true })
                .eq('question_id', currentQuestion.id)
                .eq('player_id', playerId)

            // Rotate hunter
            const currentHunterIndex = players.findIndex(
                (p) => p.player_id === currentSession.current_hunter_id
            )
            const nextHunterIndex = (currentHunterIndex + 1) % players.length
            const nextHunter = players[nextHunterIndex]

            await supabase
                .from('hunt_sessions')
                .update({ current_hunter_id: nextHunter.player_id })
                .eq('id', currentSession.id)

            toast.success('Card placed on board!')
            set({ currentQuestion: null, playerResponses: [] })
            await get().checkWinCondition()
        } catch (error) {
            console.error('Error accepting card:', error)
            toast.error('Failed to place card')
        }
    },

    checkWinCondition: async () => {
        const { currentSession } = get()
        if (!currentSession) return

        try {
            const { data: boardCards } = await supabase
                .from('hunt_board')
                .select('*')
                .eq('session_id', currentSession.id)

            const architecture = architectures.architectures.find(
                (a) => a.id === currentSession.architecture_id
            )

            if (!architecture || !boardCards) return

            // Check if all components placed
            if (boardCards.length === architecture.components.length) {
                const hasImposterCard = boardCards.some((card) => card.is_imposter_card)
                const winner = hasImposterCard ? 'imposter' : 'crew'

                await supabase
                    .from('hunt_sessions')
                    .update({ status: 'complete', winner })
                    .eq('id', currentSession.id)

                toast.success(
                    winner === 'crew'
                        ? '🎉 Crew wins! No imposters!'
                        : '🎭 Imposters win!'
                )
            }
        } catch (error) {
            console.error('Error checking win condition:', error)
        }
    },

    clearResponses: () => {
        set({ playerResponses: [], currentQuestion: null })
    },
}))

// Helper: Deal cards
async function dealCards(
    sessionId: string,
    architectureId: 1 | 2,
    players: HuntPlayer[]
) {
    const architecture = architectures.architectures.find((a) => a.id === architectureId)
    if (!architecture) return

    const { components } = architecture
    const deck: any[] = []

    // Add crew cards (2 copies per component)
    components.forEach((comp) => {
        for (let i = 0; i < 2; i++) {
            deck.push({
                component_id: comp.id,
                component_name: comp.name,
                is_imposter_card: false,
                brief_text: comp.brief,
                icon: comp.icon,
            })
        }
    })

    // Add imposter cards
    const imposterPlayers = players.filter((p) => p.is_imposter)
    imposterPlayers.forEach(() => {
        for (let i = 0; i < 3; i++) {
            deck.push({
                component_id: 'imposter',
                component_name: 'Imposter Card',
                is_imposter_card: true,
                brief_text: null,
                icon: '❓',
            })
        }
    })

    // Shuffle deck
    const shuffled = deck.sort(() => Math.random() - 0.5)

    // Deal 3 cards per player
    let cardIndex = 0
    for (const player of players) {
        const cardsForPlayer = player.is_imposter
            ? shuffled.filter((c) => c.is_imposter_card).slice(0, 3)
            : shuffled.filter((c) => !c.is_imposter_card).slice(cardIndex, cardIndex + 3)

        for (const card of cardsForPlayer) {
            await supabase.from('hunt_cards').insert({
                session_id: sessionId,
                player_id: player.player_id,
                ...card,
                status: 'available',
            })
        }

        if (!player.is_imposter) {
            cardIndex += 3
        }
    }
}
