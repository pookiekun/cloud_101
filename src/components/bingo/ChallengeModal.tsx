import { motion, AnimatePresence } from 'framer-motion'
import { X, QrCode, Keyboard, Target } from 'lucide-react'
import { useScannerStore } from '@/lib/scannerStore'
import challenges from '@/data/challenges.json'

interface ChallengeModalProps {
    isOpen: boolean
    slotIndex: number | null
    onClose: () => void
}

export default function ChallengeModal({ isOpen, slotIndex, onClose }: ChallengeModalProps) {
    const { openScanner, setShowManualCodeEntry } = useScannerStore()

    if (slotIndex === null) return null

    const challenge = challenges.challenges[slotIndex]

    const handleScanQR = () => {
        onClose()
        openScanner()
    }

    const handleManualCode = () => {
        onClose()
        setShowManualCodeEntry(true)
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                            className="w-full max-w-md bg-gradient-to-br from-cosmic-blue to-space-navy rounded-2xl p-6 md:p-8 shadow-2xl border border-stellar-purple/50 relative"
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-stellar-purple/20 transition-colors"
                            >
                                <X className="w-5 h-5 text-moon-gray hover:text-star-white" />
                            </button>

                            {/* Challenge Icon */}
                            <div className="text-center mb-4">
                                <div className="text-7xl mb-3">{challenge.emoji}</div>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${challenge.difficulty === 'easy' ? 'bg-green-500/20 text-green-500' :
                                        challenge.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                                            'bg-red-500/20 text-red-500'
                                    }`}>
                                    {challenge.difficulty.toUpperCase()}
                                </span>
                            </div>

                            {/* Challenge Info */}
                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold text-star-white mb-3">
                                    {challenge.title}
                                </h3>
                                <p className="text-moon-gray leading-relaxed text-lg">
                                    {challenge.description}
                                </p>
                            </div>

                            {/* Mission Statement */}
                            <div className="bg-stellar-purple/20 border border-stellar-purple/50 rounded-lg p-4 mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Target className="w-5 h-5 text-stellar-purple" />
                                    <span className="text-sm font-semibold text-stellar-purple">Your Mission</span>
                                </div>
                                <p className="text-sm text-moon-gray">
                                    Find someone who matches this challenge, scan their QR code, and complete this slot!
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleScanQR}
                                    className="w-full py-3 px-4 rounded-lg bg-stellar-purple hover:bg-stellar-purple/90 text-star-white font-semibold flex items-center justify-center gap-2 transition-all hover:scale-105"
                                >
                                    <QrCode className="w-5 h-5" />
                                    Scan QR Code
                                </button>

                                <button
                                    onClick={handleManualCode}
                                    className="w-full py-3 px-4 rounded-lg border border-moon-gray/30 hover:border-stellar-purple text-moon-gray hover:text-stellar-purple font-medium flex items-center justify-center gap-2 transition-all"
                                >
                                    <Keyboard className="w-5 h-5" />
                                    Enter Code Manually
                                </button>
                            </div>

                            {/* Slot Number */}
                            <div className="mt-4 text-center text-sm text-moon-gray/50">
                                Challenge {slotIndex + 1} of 25
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}
