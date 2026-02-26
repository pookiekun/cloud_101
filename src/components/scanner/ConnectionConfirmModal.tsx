import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, X, Linkedin, User } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'

interface ConnectionConfirmModalProps {
    isOpen: boolean
    onConfirm: () => void
    onCancel: () => void
    partnerName: string
    partnerLinkedin?: string
    challengeTitle: string
    challengeEmoji: string
}

export default function ConnectionConfirmModal({
    isOpen,
    onConfirm,
    onCancel,
    partnerName,
    partnerLinkedin,
    challengeTitle,
    challengeEmoji,
}: ConnectionConfirmModalProps) {

    useEffect(() => {
        if (isOpen) {
            // Trigger confetti
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            })
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-navy/80 backdrop-blur-sm"
                onClick={onCancel}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="relative w-full max-w-md p-8 rounded-2xl bg-cosmic-blue/40 backdrop-blur-md border border-stellar-purple/50"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={onCancel}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-stellar-purple/20 transition-colors"
                    >
                        <X className="w-5 h-5 text-moon-gray" />
                    </button>

                    {/* Success Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
                    >
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </motion.div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-star-white text-center mb-2">
                        Connection Successful!
                    </h2>

                    {/* Challenge Completed */}
                    <div className="text-center mb-6">
                        <p className="text-moon-gray mb-3">You completed the challenge:</p>
                        <div className="inline-block px-4 py-2 rounded-lg bg-stellar-purple/20 border border-stellar-purple/50">
                            <span className="text-2xl mr-2">{challengeEmoji}</span>
                            <span className="text-stellar-purple font-semibold">{challengeTitle}</span>
                        </div>
                    </div>

                    {/* Partner Info */}
                    <div className="p-4 rounded-xl bg-space-navy/50 mb-6">
                        <p className="text-moon-gray text-sm mb-2 text-center">Connected with</p>
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-stellar-purple/30 border-2 border-stellar-purple flex items-center justify-center">
                                <User className="w-6 h-6 text-stellar-purple" />
                            </div>
                            <div>
                                <p className="text-star-white font-semibold">{partnerName}</p>
                                {partnerLinkedin && (
                                    <a
                                        href={partnerLinkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-stellar-purple hover:text-stellar-purple/80 flex items-center gap-1"
                                    >
                                        <Linkedin className="w-3 h-3" />
                                        LinkedIn
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Confirm Button */}
                    <button
                        onClick={onConfirm}
                        className="w-full py-3 px-4 rounded-lg bg-stellar-purple hover:bg-stellar-purple/90 text-star-white font-semibold transition-all hover:scale-105"
                    >
                        Awesome! View Grid
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
