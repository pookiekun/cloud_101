import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Send } from 'lucide-react'

interface ResponderModalProps {
    isOpen: boolean
    onClose: () => void
    componentName: string
    myCardBrief?: string
    isImposter: boolean
    onSubmitResponse: (pitch: string) => void
    timeLimit?: number // seconds
}

export default function ResponderModal({
    isOpen,
    onClose,
    componentName,
    myCardBrief,
    isImposter,
    onSubmitResponse,
    timeLimit = 20,
}: ResponderModalProps) {
    const [pitch, setPitch] = useState('')
    const [timeLeft, setTimeLeft] = useState(timeLimit)
    const [submitted, setSubmitted] = useState(false)

    useEffect(() => {
        if (isOpen && !submitted) {
            setTimeLeft(timeLimit)
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer)
                        // Auto-submit empty pitch when time runs out
                        if (!submitted) {
                            handleSubmit()
                        }
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)

            return () => clearInterval(timer)
        }
    }, [isOpen, submitted, timeLimit])

    useEffect(() => {
        if (!isOpen) {
            setPitch('')
            setSubmitted(false)
            setTimeLeft(timeLimit)
        }
    }, [isOpen, timeLimit])

    const handleSubmit = () => {
        if (submitted) return
        setSubmitted(true)
        onSubmitResponse(pitch)
    }

    const timePercentage = (timeLeft / timeLimit) * 100
    const isUrgent = timeLeft <= 5

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg bg-gradient-to-br from-cosmic-blue to-space-navy rounded-2xl border border-stellar-purple/50 shadow-xl p-6 pointer-events-auto"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-star-white mb-1">
                                        Pitch Time!
                                    </h3>
                                    <p className="text-moon-gray text-sm">
                                        Hunter asked: "Who has <span className="text-stellar-purple font-semibold">{componentName}</span>?"
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-stellar-purple/20 transition-colors"
                                >
                                    <X className="w-5 h-5 text-moon-gray" />
                                </button>
                            </div>

                            {/* Timer */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Clock className={`w-4 h-4 ${isUrgent ? 'text-red-400' : 'text-stellar-purple'}`} />
                                        <span className={`text-sm font-semibold ${isUrgent ? 'text-red-400' : 'text-stellar-purple'}`}>
                                            {timeLeft}s remaining
                                        </span>
                                    </div>
                                    {submitted && (
                                        <span className="text-sm text-green-400">✓ Submitted</span>
                                    )}
                                </div>
                                <div className="w-full h-2 bg-cosmic-blue/30 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: '100%' }}
                                        animate={{ width: `${timePercentage}%` }}
                                        className={`h-full ${isUrgent ? 'bg-red-500' : 'bg-stellar-purple'
                                            }`}
                                    />
                                </div>
                            </div>

                            {/* Brief Display (Crew) or Imposter Warning */}
                            {isImposter ? (
                                <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/50">
                                    <p className="text-sm text-red-400 font-semibold mb-2">
                                        🎭 You're an Imposter!
                                    </p>
                                    <p className="text-xs text-moon-gray">
                                        You don't have the real brief. Bluff convincingly based on what you know about AWS!
                                    </p>
                                </div>
                            ) : myCardBrief ? (
                                <div className="mb-4 p-4 rounded-lg bg-green-500/10 border border-green-500/50">
                                    <p className="text-sm text-green-400 font-semibold mb-2">
                                        📝 Your Component Brief:
                                    </p>
                                    <p className="text-xs text-moon-gray">{myCardBrief}</p>
                                </div>
                            ) : (
                                <div className="mb-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/50">
                                    <p className="text-sm text-yellow-400">
                                        You don't have this component. Skip your turn.
                                    </p>
                                </div>
                            )}

                            {/* Pitch Input */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-moon-gray mb-2">
                                    Your Pitch (Optional - you can pitch verbally too!)
                                </label>
                                <textarea
                                    value={pitch}
                                    onChange={(e) => setPitch(e.target.value)}
                                    disabled={submitted}
                                    placeholder={
                                        isImposter
                                            ? "Type your bluff or just say it out loud..."
                                            : "Explain why you have this component or just say it verbally..."
                                    }
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-lg bg-space-navy border border-stellar-purple/30 text-star-white placeholder-moon-gray focus:outline-none focus:border-stellar-purple transition-colors resize-none disabled:opacity-50"
                                />
                                <p className="text-xs text-moon-gray mt-1">
                                    💡 Tip: Most players pitch verbally! This is optional.
                                </p>
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={submitted}
                                className="w-full py-3 px-4 rounded-lg bg-stellar-purple hover:bg-stellar-purple/90 disabled:bg-green-500/30 disabled:cursor-not-allowed text-star-white font-semibold flex items-center justify-center gap-2 transition-all"
                            >
                                {submitted ? (
                                    <>✓ Response Submitted</>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Submit Response
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-moon-gray text-center mt-3">
                                {submitted
                                    ? 'Waiting for all players to respond...'
                                    : 'Click submit when you\'re done pitching (or time runs out)'}
                            </p>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}
