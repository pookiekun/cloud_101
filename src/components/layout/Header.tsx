import { LogOut, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'

export default function Header() {
    const { user, profile, signOut } = useAuthStore()

    const handleSignOut = async () => {
        try {
            await signOut()
            toast.success('Signed out successfully')
        } catch (error) {
            toast.error('Failed to sign out')
        }
    }

    if (!user) return null

    return (
        <header className="sticky top-0 z-20 bg-gradient-to-r from-cosmic-blue/40 via-space-navy/30 to-cosmic-blue/40 backdrop-blur-xl border-b border-stellar-purple/50 shadow-lg shadow-stellar-purple/20">
            <div className="max-w-4xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between">

                    {/* Brand */}
                    <div className="flex items-center gap-2.5">
                        {/* Animated sparkle logo icon */}
                        <div className="relative flex-shrink-0">
                            {/* Pulse glow behind icon */}
                            <motion.div
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.1, 0.5] }}
                                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                                className="absolute inset-0 rounded-full bg-stellar-purple blur-md"
                            />
                            <motion.div
                                animate={{ rotate: [0, 15, -10, 15, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
                                className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-stellar-purple to-[#4f46e5] flex items-center justify-center shadow-lg shadow-stellar-purple/50 border border-stellar-purple/60"
                            >
                                <span className="text-base select-none">✦</span>
                            </motion.div>
                        </div>

                        {/* Brand text with animated gradient */}
                        <motion.h1
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-xl font-black tracking-tight"
                        >
                            <span className="bg-gradient-to-r from-[#a78bfa] via-stellar-purple to-[#818cf8] bg-clip-text text-transparent">
                                CLOUD
                            </span>
                            <span className="text-star-white ml-1.5">101</span>
                        </motion.h1>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-3">
                        {profile?.full_name && (
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-medium text-star-white">
                                    {profile.full_name}
                                </p>
                                <p className="text-xs text-moon-gray">
                                    {user.email}
                                </p>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            {/* Avatar with pulse ring */}
                            <div className="relative">
                                <motion.div
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                    className="absolute inset-0 rounded-full border-2 border-stellar-purple"
                                />
                                <div className="relative w-10 h-10 rounded-full bg-stellar-purple/30 flex items-center justify-center border-2 border-stellar-purple">
                                    <User className="w-5 h-5 text-stellar-purple" />
                                </div>
                            </div>

                            {/* Sign Out Button */}
                            <button
                                onClick={handleSignOut}
                                className="p-2 rounded-lg hover:bg-stellar-purple/20 transition-colors"
                                title="Sign Out"
                            >
                                <LogOut className="w-5 h-5 text-moon-gray hover:text-star-white" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}
