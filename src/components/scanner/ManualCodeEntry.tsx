import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight } from 'lucide-react'
import { useScannerStore } from '@/lib/scannerStore'
import { useAuthStore } from '@/lib/store'
import { useBingoStore } from '@/lib/bingoStore'
import { supabase } from '@/lib/supabase'
import { formatConnectionCode } from '@/lib/utils'
import challenges from '@/data/challenges.json'
import toast from 'react-hot-toast'

export default function ManualCodeEntry() {
    const { showManualCodeEntry, setShowManualCodeEntry, resetFailedAttempts } = useScannerStore()
    const { profile } = useAuthStore()
    const { grid, fillSlot } = useBingoStore()
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)

    const handleClose = () => {
        setShowManualCodeEntry(false)
        setCode('')
        resetFailedAttempts()
    }

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow alphanumeric, max 8 chars, auto-uppercase
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
        setCode(value)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (code.length !== 8) {
            toast.error('Code must be 8 characters')
            return
        }

        setLoading(true)

        try {
            console.log('Looking up connection code:', code)

            // Wrap in timeout promise
            const connectionPromise = (async () => {
                // Find user by connection code
                const { data: partnerProfile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('connection_code', code)
                    .single()

                if (profileError || !partnerProfile) {
                    console.error('Profile lookup error:', profileError)
                    toast.error('Invalid code. Please try again.')
                    return
                }

                console.log('Found partner:', partnerProfile.full_name)

                // Check if connecting with self
                if (partnerProfile.user_id === profile?.user_id) {
                    toast.error('Cannot connect with yourself!')
                    return
                }

                // Check if already connected
                const { data: existing } = await supabase
                    .from('connections')
                    .select('*')
                    .or(`user_a_id.eq.${profile?.user_id},user_b_id.eq.${profile?.user_id}`)
                    .or(`user_a_id.eq.${partnerProfile.user_id},user_b_id.eq.${partnerProfile.user_id}`)
                    .single()

                if (existing) {
                    toast.error(`Already connected with ${partnerProfile.full_name}!`)
                    return
                }

                // Find next empty slot
                const emptySlotIndex = grid.findIndex(slot => slot === null)
                if (emptySlotIndex === -1) {
                    toast.error('Bingo grid is full!')
                    return
                }

                // Get challenge for this slot
                const challenge = challenges.challenges[emptySlotIndex]

                console.log('Creating connection...')

                // Create connection - NOTE: user_a_id and user_b_id are PROFILE IDs, not user IDs!
                const { data: connection, error } = await supabase
                    .from('connections')
                    .insert({
                        user_a_id: profile?.id,  // Profile ID, not user_id
                        user_b_id: partnerProfile.id,  // Profile ID, not user_id
                        challenge_id: challenge.id,
                        connection_method: 'manual_code',
                    })
                    .select()
                    .single()

                if (error) {
                    console.error('Connection creation error:', error)
                    throw error
                }

                console.log('Connection created, updating grid...')

                // Update bingo grid
                await supabase
                    .from('bingo_grid')
                    .upsert({
                        user_id: profile?.id,  // This is also profile ID
                        slot_index: emptySlotIndex,
                        challenge_id: challenge.id,
                        connection_id: connection.id,
                    })

                // Update local state
                fillSlot(emptySlotIndex, {
                    id: connection.id,
                    user_a_id: profile?.id!,  // Profile ID
                    user_b_id: partnerProfile.id,  // Profile ID
                    challenge_id: challenge.id,
                    connection_method: 'manual_code',
                    created_at: new Date().toISOString(),
                })

                toast.success(`Connected with ${partnerProfile.full_name}! 🎉`)
                handleClose()
            })()

            // Add 10 second timeout
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Connection timeout')), 10000)
            )

            await Promise.race([connectionPromise, timeoutPromise])

        } catch (error: any) {
            console.error('Error creating connection:', error)
            if (error.message?.includes('timeout')) {
                toast.error('Connection timed out. Please check your internet and try again.')
            } else {
                toast.error(`Failed to create connection: ${error.message || 'Unknown error'}`)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {showManualCodeEntry && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
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
                                onClick={handleClose}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-stellar-purple/20 transition-colors"
                            >
                                <X className="w-5 h-5 text-moon-gray hover:text-star-white" />
                            </button>

                            {/* Header */}
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-star-white mb-2">
                                    Enter Connection Code
                                </h2>
                                <p className="text-moon-gray">
                                    Ask for their 8-character code
                                </p>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Code Input */}
                                <div>
                                    <label className="block text-sm font-medium text-moon-gray mb-2">
                                        Connection Code
                                    </label>
                                    <input
                                        type="text"
                                        value={formatConnectionCode(code)}
                                        onChange={handleCodeChange}
                                        placeholder="AB12-CD34"
                                        className="w-full px-4 py-3 rounded-lg bg-space-navy border border-stellar-purple/30 text-star-white text-center text-2xl font-mono tracking-wider focus:outline-none focus:border-stellar-purple transition-colors"
                                        autoFocus
                                        maxLength={9} // 8 chars + 1 dash
                                    />
                                    <p className="text-xs text-moon-gray mt-2 text-center">
                                        {code.length}/8 characters
                                    </p>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={code.length !== 8 || loading}
                                    className="w-full py-3 px-4 rounded-lg bg-stellar-purple hover:bg-stellar-purple/90 disabled:bg-stellar-purple/30 disabled:cursor-not-allowed text-star-white font-semibold flex items-center justify-center gap-2 transition-all"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-star-white border-t-transparent rounded-full animate-spin" />
                                            Connecting...
                                        </>
                                    ) : (
                                        <>
                                            Connect
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Help Text */}
                            <div className="mt-6 p-4 rounded-lg bg-stellar-purple/10 border border-stellar-purple/30">
                                <p className="text-sm text-moon-gray text-center">
                                    Can't scan QR codes? No problem! Just ask for their connection code and enter it here.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}
