import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, User } from 'lucide-react'

interface PlayerResponse {
    player_id: string
    player_name: string
    pitch?: string
    has_card: boolean
    is_imposter: boolean
}

interface ResponsesListProps {
    responses: PlayerResponse[]
    onAcceptResponse: (playerId: string) => void
    disabled?: boolean
}

export default function ResponsesList({
    responses,
    onAcceptResponse,
    disabled = false,
}: ResponsesListProps) {
    if (responses.length === 0) {
        return (
            <div className="p-6 rounded-xl bg-cosmic-blue/20 border border-stellar-purple/30 text-center">
                <p className="text-moon-gray">Waiting for responses...</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-star-white mb-3">
                Player Responses ({responses.length})
            </h3>
            {responses.map((response, index) => (
                <motion.div
                    key={response.player_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`
            p-4 rounded-lg border-2 transition-all
            ${response.has_card
                            ? 'bg-green-500/10 border-green-500/50'
                            : 'bg-cosmic-blue/10 border-stellar-purple/30'
                        }
          `}
                >
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-stellar-purple/30 border-2 border-stellar-purple flex items-center justify-center">
                                <User className="w-4 h-4 text-stellar-purple" />
                            </div>
                            <div>
                                <p className="font-semibold text-star-white">
                                    {response.player_name}
                                </p>
                                {response.has_card && (
                                    <span className="text-xs text-green-400">Has this component</span>
                                )}
                            </div>
                        </div>
                        {response.is_imposter && (
                            <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400">
                                Imposter (hidden)
                            </span>
                        )}
                    </div>

                    {response.pitch && (
                        <p className="text-sm text-moon-gray mb-3 pl-10">
                            "{response.pitch}"
                        </p>
                    )}

                    <div className="flex gap-2 pl-10">
                        <button
                            onClick={() => onAcceptResponse(response.player_id)}
                            disabled={disabled}
                            className="flex-1 py-2 px-4 rounded-lg bg-green-500 hover:bg-green-600 disabled:bg-green-500/30 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-all"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Accept
                        </button>
                        <button
                            disabled={disabled}
                            className="flex-1 py-2 px-4 rounded-lg bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 font-semibold flex items-center justify-center gap-2 transition-all"
                        >
                            <XCircle className="w-4 h-4" />
                            Reject
                        </button>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}
