import { motion } from 'framer-motion'
import { useBingoStore } from '@/lib/bingoStore'
import BingoSlot from './BingoSlot'
import { Plus } from 'lucide-react'

export default function BingoGrid() {
    const { grid, progress, selectSlot } = useBingoStore()
    const filledSlots = grid.filter(slot => slot !== null).length
    const remaining = 25 - filledSlots

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            {/* Progress Banner */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-10 mb-6 p-4 rounded-xl bg-cosmic-blue/30 backdrop-blur-md border border-stellar-purple/50"
            >
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-semibold text-star-white">
                        {remaining === 0 ? '🎉 BINGO Complete!' : `${remaining} more to go!`}
                    </h2>
                    <span className="text-2xl font-bold text-stellar-purple">
                        {filledSlots}/25
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-space-navy rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-stellar-purple to-cosmic-blue"
                    />
                </div>
            </motion.div>

            {/* Bingo Grid */}
            <div className="grid grid-cols-5 gap-3 md:gap-4">
                {grid.map((connection, index) => (
                    <BingoSlot
                        key={index}
                        index={index}
                        connection={connection}
                        onSelect={() => selectSlot(index)}
                    />
                ))}
            </div>

            {/* Empty State Help */}
            {filledSlots === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 text-center p-6 rounded-xl bg-cosmic-blue/20 border border-stellar-purple/30"
                >
                    <Plus className="w-12 h-12 mx-auto mb-3 text-stellar-purple" />
                    <p className="text-lg text-moon-gray mb-2">
                        Start connecting with others!
                    </p>
                    <p className="text-sm text-moon-gray/70">
                        Click a slot to see the challenge, then scan QR codes to fill your grid
                    </p>
                </motion.div>
            )}
        </div>
    )
}
