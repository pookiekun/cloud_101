// Real-time Subscriptions for Hunt Game
// Add this to HuntLobbyPage, HuntGamePage to enable automatic UI updates

import { useEffect } from 'react'
import { supabase } from './supabase'

/**
 * Subscribe to Hunt Players updates (lobby)
 * 
 * Use in HuntLobbyPage to automatically update player list when someone joins/leaves
 * 
 * Example:
 * ```tsx
 * useHuntPlayersSubscription(sessionId, () => {
 *   // Refetch players or update state
 *   fetchSessionData()
 * })
 * ```
 */
export function useHuntPlayersSubscription(
    sessionId: string | undefined,
    onUpdate: () => void
) {
    useEffect(() => {
        if (!sessionId) return

        const channel = supabase
            .channel(`hunt-players-${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'hunt_players',
                    filter: `session_id=eq.${sessionId}`,
                },
                () => {
                    onUpdate()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [sessionId, onUpdate])
}

/**
 * Subscribe to Hunt Session updates
 * 
 * Use to detect when game starts, status changes, or hunter rotates
 * 
 * Example:
 * ```tsx
 * useHuntSessionSubscription(sessionId, (session) => {
 *   if (session.status === 'active') {
 *     navigate(`/hunt/play/${sessionId}`)
 *   }
 * })
 * ```
 */
export function useHuntSessionSubscription(
    sessionId: string | undefined,
    onUpdate: (payload: any) => void
) {
    useEffect(() => {
        if (!sessionId) return

        const channel = supabase
            .channel(`hunt-session-${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'hunt_sessions',
                    filter: `id=eq.${sessionId}`,
                },
                (payload) => {
                    onUpdate(payload.new)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [sessionId, onUpdate])
}

/**
 * Subscribe to Hunt Board updates
 * 
 * Use in HuntGamePage to automatically update board when cards are placed
 * 
 * Example:
 * ```tsx
 * useHuntBoardSubscription(sessionId, () => {
 *   // Refetch board state
 *   fetchBoardCards()
 * })
 * ```
 */
export function useHuntBoardSubscription(
    sessionId: string | undefined,
    onUpdate: () => void
) {
    useEffect(() => {
        if (!sessionId) return

        const channel = supabase
            .channel(`hunt-board-${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'hunt_board',
                    filter: `session_id=eq.${sessionId}`,
                },
                () => {
                    onUpdate()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [sessionId, onUpdate])
}

/**
 * Subscribe to Hunt Questions
 * 
 * Use in HuntGamePage to show response modal when hunter asks a question
 * 
 * Example:
 * ```tsx
 * useHuntQuestionsSubscription(sessionId, (question) => {
 *   setCurrentQuestion(question)
 *   setShowResponseModal(true)
 * })
 * ```
 */
export function useHuntQuestionsSubscription(
    sessionId: string | undefined,
    onNewQuestion: (question: any) => void
) {
    useEffect(() => {
        if (!sessionId) return

        const channel = supabase
            .channel(`hunt-questions-${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'hunt_questions',
                    filter: `session_id=eq.${sessionId}`,
                },
                (payload) => {
                    onNewQuestion(payload.new)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [sessionId, onNewQuestion])
}

/**
 * Subscribe to Hunt Responses
 * 
 * Use in HuntGamePage (Hunter view) to see responses as they come in
 * 
 * Example:
 * ```tsx
 * useHuntResponsesSubscription(currentQuestion?.id, (response) => {
 *   setResponses(prev => [...prev, response])
 * })
 * ```
 */
export function useHuntResponsesSubscription(
    questionId: string | undefined,
    onNewResponse: (response: any) => void
) {
    useEffect(() => {
        if (!questionId) return

        const channel = supabase
            .channel(`hunt-responses-${questionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'hunt_responses',
                    filter: `question_id=eq.${questionId}`,
                },
                (payload) => {
                    onNewResponse(payload.new)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [questionId, onNewResponse])
}
