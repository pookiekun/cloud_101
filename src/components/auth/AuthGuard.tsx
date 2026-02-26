import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/lib/store'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
    children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
    const { user, profile, isLoading, initialize } = useAuthStore()
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        initialize()
    }, [initialize])

    useEffect(() => {
        if (!isLoading) {
            // Not authenticated — send to login but remember where they were going
            if (!user && location.pathname !== '/login') {
                navigate('/login', {
                    replace: true,
                    state: { from: location.pathname + location.search },
                })
            }

            // Authenticated but no profile — redirect to setup
            if (user && !profile && location.pathname !== '/profile/setup') {
                navigate('/profile/setup', { replace: true })
            }
        }
    }, [user, profile, isLoading, navigate, location])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-space-navy">
                <div className="starfield fixed inset-0 -z-10" />
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-stellar-purple animate-spin mx-auto mb-4" />
                    <p className="text-moon-gray">Loading your network...</p>
                </div>
            </div>
        )
    }

    if (!user && location.pathname !== '/login') {
        return null
    }

    return <>{children}</>
}
