import { motion } from 'framer-motion'
import { User, Lock } from 'lucide-react'
import { Connection } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import challenges from '@/data/challenges.json'

interface BingoSlotProps {
    index: number
    connection: Connection | null
    onSelect: () => void
}

export default function BingoSlot({ index, connection, onSelect }: BingoSlotProps) {
    const isEmpty = connection === null
    const challenge = challenges.challenges[index]

    return (
        <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.02 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSelect}
            className={cn(
                'aspect-square rounded-2xl transition-all duration-300',
                'flex flex-col items-center justify-center relative overflow-hidden p-2',
                isEmpty
                    ? 'border-2 border-dashed border-stellar-purple/50 bg-cosmic-blue/10 hover:border-stellar-purple hover:bg-cosmic-blue/20'
                    : 'border-2 border-green-500 bg-gradient-to-br from-stellar-purple/30 to-cosmic-blue/30'
            )}
        >
            {/* Challenge Emoji - Always Visible */}
            <div className="text-2xl md:text-3xl mb-1">
                {challenge.emoji}
            </div>

            {/* Challenge Title - Always Visible */}
            <p className="text-xs md:text-sm font-semibold text-star-white text-center line-clamp-2 mb-1">
                {challenge.title}
            </p>

            {/* Status Indicator */}
            {isEmpty ? (
                <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-stellar-purple/30 flex items-center justify-center">
                    <Lock className="w-3 h-3 text-stellar-purple" />
                </div>
            ) : (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                >
                    <span className="text-xs font-bold text-white">✓</span>
                </motion.div>
            )}

            {/* Connection Badge - Only when filled */}
            {!isEmpty && (
                <div className="absolute top-1 left-1 w-8 h-8 rounded-full bg-stellar-purple/80 border-2 border-green-500 flex items-center justify-center">
                    <User className="w-4 h-4 text-star-white" />
                </div>
            )}

            {/* Pulse Animation for Empty Slots */}
            {isEmpty && (
                <motion.div
                    animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute inset-0 rounded-2xl border-2 border-stellar-purple"
                />
            )}
        </motion.button>
    )
}
