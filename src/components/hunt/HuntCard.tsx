import { motion } from 'framer-motion'

interface HuntCardProps {
    card: {
        id: string
        component_id: string
        component_name: string
        icon: string
        is_imposter_card: boolean
        brief_text?: string
        status: 'available' | 'placed' | 'discarded'
    }
    onClick?: () => void
}

export default function HuntCard({ card, onClick }: HuntCardProps) {
    const { component_name, icon, is_imposter_card, brief_text, status } = card

    const statusStyles = {
        available: 'border-stellar-purple/50 bg-cosmic-blue/20',
        placed: 'border-green-500/50 bg-green-500/10 opacity-60',
        discarded: 'border-gray-500/50 bg-gray-500/10 opacity-40',
    }

    return (
        <motion.div
            whileHover={status === 'available' ? { scale: 1.02, y: -4 } : {}}
            whileTap={status === 'available' ? { scale: 0.98 } : {}}
            onClick={status === 'available' ? onClick : undefined}
            className={`
        p-4 rounded-xl border-2 transition-all cursor-pointer
        ${statusStyles[status]}
        ${status === 'available' ? 'hover:border-stellar-purple hover:bg-cosmic-blue/30' : 'cursor-not-allowed'}
      `}
        >
            {/* Icon and Status */}
            <div className="flex items-start justify-between mb-3">
                <span className="text-4xl">{icon}</span>
                {is_imposter_card && (
                    <span className="px-2 py-1 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/50">
                        IMPOSTER
                    </span>
                )}
                {status === 'placed' && (
                    <span className="px-2 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400">
                        PLACED
                    </span>
                )}
            </div>

            {/* Component Name */}
            <h3 className="text-lg font-bold text-star-white mb-2">{component_name}</h3>

            {/* Brief or Imposter Message */}
            {is_imposter_card ? (
                <p className="text-sm text-red-400 italic">
                    You don't have the brief. Bluff to convince the Hunter!
                </p>
            ) : (
                brief_text && (
                    <p className="text-sm text-moon-gray line-clamp-3">{brief_text}</p>
                )
            )}
        </motion.div>
    )
}
