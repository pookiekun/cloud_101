import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Linkedin, Loader2, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { generateConnectionCode } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ProfileSetupPage() {
    const { user, profile, setProfile } = useAuthStore()
    const navigate = useNavigate()

    const [fullName, setFullName] = useState('')
    const [linkedinUrl, setLinkedinUrl] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState<{ fullName?: string; linkedinUrl?: string }>({})

    useEffect(() => {
        // If profile already exists, redirect to grid
        if (profile) {
            navigate('/grid', { replace: true })
        }
    }, [profile, navigate])

    const validateForm = () => {
        const newErrors: { fullName?: string; linkedinUrl?: string } = {}

        if (!fullName.trim()) {
            newErrors.fullName = 'Full name is required'
        } else if (fullName.trim().length < 2) {
            newErrors.fullName = 'Name must be at least 2 characters'
        } else if (fullName.trim().length > 50) {
            newErrors.fullName = 'Name must be less than 50 characters'
        }

        if (!linkedinUrl.trim()) {
            newErrors.linkedinUrl = 'LinkedIn URL is required'
        } else if (!linkedinUrl.includes('linkedin.com')) {
            newErrors.linkedinUrl = 'Please enter a valid LinkedIn URL'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm() || !user) return

        setIsSubmitting(true)

        try {
            // Refresh session first — ensures we have a fresh JWT for RLS
            await supabase.auth.refreshSession()

            const connectionCode = generateConnectionCode(user.id)

            console.log('Creating profile for user:', user.id)

            const { data, error } = await Promise.race([
                supabase
                    .from('profiles')
                    .insert({
                        user_id: user.id,
                        full_name: fullName.trim(),
                        linkedin_url: linkedinUrl.trim(),
                        connection_code: connectionCode,
                    })
                    .select()
                    .single(),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('timeout')), 15000)
                ),
            ]) as any

            if (error) {
                // Log the full error so we can diagnose via console
                console.error('Profile creation error:', error.code, error.message, error.details)

                if (error.code === '23505') {
                    // Profile already exists (duplicate key) — just fetch and continue
                    const { data: existingProfile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('user_id', user.id)
                        .maybeSingle()
                    if (existingProfile) {
                        setProfile(existingProfile)
                        navigate('/grid', { replace: true })
                    }
                } else if (error.code === '42501') {
                    toast.error('Permission denied — please sign out and try again.')
                    console.error('RLS policy is blocking INSERT on profiles table!')
                } else {
                    toast.error(`Failed: ${error.message || error.code || 'Unknown error'}`)
                }
                return
            }

            console.log('Profile created successfully:', data)
            setProfile(data)
            toast.success('Profile created! Welcome to CLOUD 101 🚀')
            navigate('/grid', { replace: true })

        } catch (error: any) {
            console.error('Profile submit error:', error)
            if (error.message === 'timeout') {
                toast.error('Request timed out — check your internet and try again.')
            } else {
                toast.error(`Something went wrong: ${error.message || 'Please try again'}`)
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const getInitials = (name: string) => {
        return name
            .trim()
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-space-navy">
            <div className="starfield fixed inset-0 -z-10" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-stellar-purple to-cosmic-blue bg-clip-text text-transparent">
                        Welcome to CLOUD 101!
                    </h1>
                    <p className="text-moon-gray">
                        Let's set up your profile
                    </p>
                </div>

                <div className="p-8 rounded-2xl bg-cosmic-blue/30 backdrop-blur-md border border-stellar-purple/50">
                    {/* Avatar Preview */}
                    {fullName && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex justify-center mb-6"
                        >
                            <div className="w-20 h-20 rounded-full bg-stellar-purple/30 border-2 border-stellar-purple flex items-center justify-center">
                                <span className="text-2xl font-bold text-stellar-purple">
                                    {getInitials(fullName)}
                                </span>
                            </div>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Full Name */}
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-moon-gray mb-2">
                                Full Name *
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-moon-gray" />
                                <input
                                    id="fullName"
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => {
                                        setFullName(e.target.value)
                                        setErrors({ ...errors, fullName: undefined })
                                    }}
                                    placeholder="John Doe"
                                    maxLength={50}
                                    disabled={isSubmitting}
                                    className={`w-full pl-10 pr-4 py-3 rounded-lg bg-space-navy border ${errors.fullName ? 'border-red-500' : 'border-moon-gray/30'
                                        } text-star-white placeholder-moon-gray/50 focus:outline-none focus:ring-2 focus:ring-stellar-purple focus:border-transparent transition-all disabled:opacity-50`}
                                />
                                {fullName && !errors.fullName && (
                                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                                )}
                            </div>
                            {errors.fullName && (
                                <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
                            )}
                            <p className="mt-1 text-xs text-moon-gray/50">{fullName.length}/50 characters</p>
                        </div>

                        {/* LinkedIn URL */}
                        <div>
                            <label htmlFor="linkedinUrl" className="block text-sm font-medium text-moon-gray mb-2">
                                LinkedIn Profile URL *
                            </label>
                            <div className="relative">
                                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-moon-gray" />
                                <input
                                    id="linkedinUrl"
                                    type="url"
                                    value={linkedinUrl}
                                    onChange={(e) => {
                                        setLinkedinUrl(e.target.value)
                                        setErrors({ ...errors, linkedinUrl: undefined })
                                    }}
                                    placeholder="https://linkedin.com/in/yourname"
                                    disabled={isSubmitting}
                                    className={`w-full pl-10 pr-4 py-3 rounded-lg bg-space-navy border ${errors.linkedinUrl ? 'border-red-500' : 'border-moon-gray/30'
                                        } text-star-white placeholder-moon-gray/50 focus:outline-none focus:ring-2 focus:ring-stellar-purple focus:border-transparent transition-all disabled:opacity-50`}
                                />
                                {linkedinUrl && !errors.linkedinUrl && linkedinUrl.includes('linkedin.com') && (
                                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                                )}
                            </div>
                            {errors.linkedinUrl && (
                                <p className="mt-1 text-sm text-red-500">{errors.linkedinUrl}</p>
                            )}
                            <p className="mt-1 text-xs text-moon-gray/50">
                                This will be visible to your connections
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 px-4 rounded-lg bg-stellar-purple hover:bg-stellar-purple/90 text-star-white font-semibold flex items-center justify-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-6"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating Profile...
                                </>
                            ) : (
                                <>
                                    <Check className="w-5 h-5" />
                                    Complete Setup
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-xs text-moon-gray/70">
                        You can edit your profile later from settings
                    </p>
                </div>

                <p className="text-center text-sm text-moon-gray/50 mt-6">
                    Signed in as <strong>{user?.email}</strong>
                </p>
            </motion.div>
        </div>
    )
}
