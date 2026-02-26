import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AuthCallbackPage() {
    const navigate = useNavigate()

    useEffect(() => {
        // The Supabase auth listener in the store will handle the session
        // Just show a loading state and redirect
        const timer = setTimeout(() => {
            toast.success('Welcome to CLOUD 101! 🚀')
            navigate('/grid', { replace: true })
        }, 1500)

        return () => clearTimeout(timer)
    }, [navigate])

    return (
        <div className="min-h-screen flex items-center justify-center bg-space-navy">
            <div className="starfield fixed inset-0 -z-10" />
            <div className="text-center">
                <Loader2 className="w-12 h-12 text-stellar-purple animate-spin mx-auto mb-4" />
                <p className="text-moon-gray text-lg">Signing you in...</p>
            </div>
        </div>
    )
}
